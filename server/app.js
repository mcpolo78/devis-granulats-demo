// API Express : référentiel, géocodage, devis (avec cache Redis), réservation de créneau, assistant IA.
import express from 'express';
import { referentiel, enregistrerDevis, reserverCreneau, derniersDevis, statsDevis, modeDonnees } from './lib/depot.js';
import { calculerDevis, validerDemande } from './lib/devis.js';
import { lireOuCalculer, cache } from './lib/cache.js';
import { geocoder } from './lib/geo.js';
import { analyserChantier } from './lib/assistant.js';
import { limiter } from './lib/limite.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

const ip = (req) => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
const garde = (max, fenetreMs) => (req, res, next) =>
  limiter(`${req.path}:${ip(req)}`, max, fenetreMs) ? next() : res.status(429).json({ erreur: 'Trop de requêtes, réessayez dans un instant.' });

app.get('/api/sante', async (_req, res) => {
  const c = await cache();
  res.json({ ok: true, donnees: modeDonnees(), cache: c.nom, ia: Boolean(process.env.MISTRAL_API_KEY) });
});

app.get('/api/referentiel', async (_req, res, next) => {
  try {
    const r = await referentiel();
    const c = await cache();
    res.json({
      produits: r.produits,
      fournisseurs: r.fournisseurs.map(({ prix, ...f }) => ({ ...f, produits: Object.keys(prix) })),
      camions: r.camions,
      indices: r.indices,
      partCarburant: r.partCarburant,
      infra: { donnees: modeDonnees(), cache: c.nom, ia: Boolean(process.env.MISTRAL_API_KEY) },
    });
  } catch (e) { next(e); }
});

app.get('/api/geocode', garde(40, 60_000), async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 120);
  if (q.length < 3) return res.json({ resultats: [] });
  try {
    const { valeur } = await lireOuCalculer(`geo:${q.toLowerCase()}`, 86400, () => geocoder(q));
    res.json({ resultats: valeur });
  } catch (e) {
    console.error('[geocode]', e.message);
    res.status(502).json({ erreur: 'Géocodage indisponible.' });
  }
});

app.post('/api/devis', garde(30, 60_000), async (req, res, next) => {
  try {
    const t0 = performance.now();
    const ref = await referentiel();
    const erreur = validerDemande(req.body, ref.produits.map((p) => p.code));
    if (erreur) return res.status(400).json({ erreur });
    const demande = {
      chantier: { lat: Number(req.body.lat), lng: Number(req.body.lng) },
      produitCode: req.body.produitCode,
      tonnage: Math.round(Number(req.body.tonnage) * 10) / 10,
      accesDifficile: Boolean(req.body.accesDifficile),
    };
    // Clé de cache : position arrondie à ~1 km, produit, tonnage, accès.
    const cle = `devis:${demande.chantier.lat.toFixed(2)}:${demande.chantier.lng.toFixed(2)}:${demande.produitCode}:${demande.tonnage}:${demande.accesDifficile ? 1 : 0}`;
    const { valeur, hit, moteur } = await lireOuCalculer(cle, 600, async () => calculerDevis(demande, ref));
    const ms = Math.round((performance.now() - t0) * 10) / 10;

    let devisId = null;
    const best = valeur.offres[0];
    if (best) {
      const ligne = await enregistrerDevis({
        adresse: String(req.body.adresse || 'Chantier').slice(0, 160),
        lat: demande.chantier.lat,
        lng: demande.chantier.lng,
        produitCode: demande.produitCode,
        tonnage: demande.tonnage,
        fournisseurNom: best.fournisseur.nom,
        camionCode: best.camion.code,
        rotations: best.rotations,
        totalHT: best.total,
        prixTonne: best.prixTonneLivre,
        co2Kg: best.co2Kg,
      });
      devisId = ligne.id;
    }
    res.json({ ...valeur, devisId, perf: { ms, cache: hit ? 'HIT' : 'MISS', moteur } });
  } catch (e) { next(e); }
});

app.post('/api/devis/:id/reserver', garde(20, 60_000), async (req, res, next) => {
  try {
    const creneau = String(req.body?.creneau || '').slice(0, 40);
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}-\d{2}:\d{2}$/.test(creneau)) return res.status(400).json({ erreur: 'Créneau invalide.' });
    // L'utilisateur peut retenir une autre offre que la moins chère : on met à jour la ligne du devis.
    const o = req.body?.offre || {};
    const nombre = (v, max) => (Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= max ? Number(v) : null);
    const patch = {
      fournisseurNom: typeof o.fournisseurNom === 'string' ? o.fournisseurNom.slice(0, 80) : null,
      camionCode: typeof o.camionCode === 'string' ? o.camionCode.slice(0, 10) : null,
      rotations: nombre(o.rotations, 1000),
      totalHT: nombre(o.totalHT, 1e7),
      prixTonne: nombre(o.prixTonne, 1e4),
      co2Kg: nombre(o.co2Kg, 1e7),
    };
    for (const k of Object.keys(patch)) if (patch[k] == null) delete patch[k];
    if (patch.rotations != null) patch.rotations = Math.round(patch.rotations);
    if (patch.co2Kg != null) patch.co2Kg = Math.round(patch.co2Kg);
    const l = await reserverCreneau(String(req.params.id).slice(0, 40), creneau, patch);
    if (!l) return res.status(404).json({ erreur: 'Devis introuvable.' });
    res.json({ ok: true, devis: l });
  } catch (e) { next(e); }
});

app.get('/api/activite', async (_req, res, next) => {
  try {
    const [devis, stats] = await Promise.all([derniersDevis(8), statsDevis()]);
    res.json({ devis, stats });
  } catch (e) { next(e); }
});

app.post('/api/assistant', garde(8, 60_000), async (req, res, next) => {
  try {
    const { produits } = await referentiel();
    const texte = String(req.body?.texte || '');
    if (!texte.trim()) return res.status(400).json({ erreur: 'Décrivez votre chantier.' });
    res.json(await analyserChantier(texte, produits));
  } catch (e) { next(e); }
});

app.use('/api', (_req, res) => res.status(404).json({ erreur: 'Route inconnue.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[api]', err);
  res.status(500).json({ erreur: 'Erreur serveur.' });
});

export default app;
