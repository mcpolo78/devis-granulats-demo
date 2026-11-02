import { useEffect, useRef, useState } from 'react';
import { api, num } from '../api.js';

const RACCOURCIS = [
  { label: 'Paris 12e', adresse: 'Gare de Lyon, 75012 Paris', lat: 48.8443, lng: 2.3744 },
  { label: 'Paris 18e', adresse: 'Porte de la Chapelle, 75018 Paris', lat: 48.8987, lng: 2.3594 },
  { label: 'Serris', adresse: 'Serris, 77700', lat: 48.8545, lng: 2.7856 },
  { label: 'Lyon', adresse: 'Gerland, 69007 Lyon', lat: 45.7279, lng: 4.8315 },
  { label: 'Nantes', adresse: 'Île de Nantes, 44200 Nantes', lat: 47.2059, lng: -1.5541 },
];

const EXEMPLES = [
  ['Allée 12 × 3 m', 'Allée carrossable de 12 x 3 m'],
  ['Parking 400 m²', 'Parking de 400 m² pour poids lourds'],
  ['Pelouse 150 m²', 'Pelouse de 150 m²'],
];
const ETAPES = ['Lecture de la demande', 'Choix du granulat adapté', 'Surface et épaisseur', 'Calcul du tonnage'];

export default function Formulaire({ ref_, demande, setDemande, onCalculer, chargement, erreur }) {
  const [saisie, setSaisie] = useState(demande.adresse);
  const [suggestions, setSuggestions] = useState([]);
  const [ouvert, setOuvert] = useState(false);
  const minuteur = useRef(null);
  // Deux façons de dire ce qu'on veut : décrire le chantier (l'IA trouve produit + tonnage) ou choisir soi-même.
  const [mode, setMode] = useState('ia');
  const [texte, setTexte] = useState('');
  const [ia, setIa] = useState(null);
  const [etatIa, setEtatIa] = useState('');
  const [etape, setEtape] = useState(0);
  const chargeIa = etatIa === 'chargement';

  useEffect(() => {
    if (!chargeIa) return undefined;
    setEtape(0);
    const id = setInterval(() => setEtape((e) => Math.min(e + 1, ETAPES.length - 1)), 700);
    return () => clearInterval(id);
  }, [chargeIa]);

  async function viaIa(t = texte) {
    if (!t.trim() || chargeIa) return;
    setEtatIa('chargement');
    try {
      const a = await api.assistant(t);
      setIa(a);
      setEtatIa('');
      const d = { ...demande, produitCode: a.produitCode, tonnage: a.tonnage };
      setDemande(d);
      onCalculer(d);
    } catch (e) {
      setEtatIa(e.message);
    }
  }

  function soumettre() {
    if (mode === 'ia') viaIa();
    else onCalculer(demande);
  }

  useEffect(() => setSaisie(demande.adresse), [demande.adresse]);

  function taper(v) {
    setSaisie(v);
    clearTimeout(minuteur.current);
    if (v.trim().length < 3) return setSuggestions([]);
    minuteur.current = setTimeout(() => {
      api.geocode(v).then((r) => { setSuggestions(r.resultats); setOuvert(true); }).catch(() => setSuggestions([]));
    }, 280);
  }

  const choisir = (s) => {
    setDemande({ ...demande, adresse: s.label ?? s.adresse, lat: s.lat, lng: s.lng });
    setOuvert(false);
  };

  return (
    <section className="panneau formulaire">
      <h2>Votre chantier <span className="discret">adresse de livraison</span></h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          soumettre();
        }}
      >
        <label className="champ">
          <span className="sr-only">Adresse de livraison</span>
          <div className="autocomplete">
            <input
              value={saisie}
              onChange={(e) => taper(e.target.value)}
              onFocus={() => suggestions.length && setOuvert(true)}
              onBlur={() => setTimeout(() => setOuvert(false), 150)}
              placeholder="Rue, ville ou code postal"
              autoComplete="off"
              role="combobox"
              aria-expanded={ouvert}
            />
            <ul className={`suggestions ${ouvert && suggestions.length ? 'ouvert' : ''}`} role="listbox">
              {suggestions.map((s) => (
                <li key={`${s.lat},${s.lng}`} role="option" onMouseDown={() => choisir(s)}>{s.label}</li>
              ))}
            </ul>
          </div>
        </label>
        <div className="raccourcis">
          {RACCOURCIS.map((r) => (
            <button type="button" key={r.label} className={`puce ${demande.adresse === r.adresse ? 'actif' : ''}`} onClick={() => choisir(r)}>{r.label}</button>
          ))}
        </div>

        <div className="onglets" role="tablist" aria-label="Façon de décrire le besoin">
          <button type="button" role="tab" aria-selected={mode === 'ia'} className={mode === 'ia' ? 'actif' : ''} onClick={() => setMode('ia')}>
            ✦ Décrire le chantier
          </button>
          <button type="button" role="tab" aria-selected={mode === 'manuel'} className={mode === 'manuel' ? 'actif' : ''} onClick={() => setMode('manuel')}>
            Choisir le produit
          </button>
          <span className={`onglet-curseur ${mode}`} aria-hidden="true" />
        </div>

        <div className="onglet-contenu" key={mode}>
          {mode === 'ia' ? (
            <div className="mode-ia">
              <textarea
                rows={2}
                maxLength={400}
                placeholder="Ex. : allée de 15 × 3 m pour 2 voitures"
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    viaIa();
                  }
                }}
              />
              <div className="exemples">
                {EXEMPLES.map(([court, x]) => (
                  <button type="button" key={x} className="puce" title={x} disabled={chargeIa} onClick={() => { setTexte(x); viaIa(x); }}>{court}</button>
                ))}
              </div>
              {chargeIa && (
                <div className="ia-attente" role="status" aria-live="polite">
                  <p className="ia-titre"><span className="points"><i /><i /><i /></span>Mistral (Ministral 14B) analyse votre chantier</p>
                  <div className="ia-progression">
                    <span className="ia-barre"><i style={{ width: `${((etape + 1) / ETAPES.length) * 100}%` }} /></span>
                    <span className="ia-etape" key={etape}>{etape + 1}/{ETAPES.length} · {ETAPES[etape]}</span>
                  </div>
                </div>
              )}
              {ia && !chargeIa && (
                <div className="ia-res">
                  <p className="calc">
                    <strong>{ia.produitNom}</strong> · {num(ia.surfaceM2, 1)} m² × {num(ia.epaisseurCm)} cm = {num(ia.volumeM3, 1)} m³ × {num(ia.densite, 2)} t/m³ ≈ <strong>{num(ia.tonnage)} t</strong>
                  </p>
                  <p className="expl">
                    {ia.explication} <em>({ia.source === 'ia' ? 'Ministral 14B' : 'règles'})</em>{' '}
                    <button type="button" className="lien" onClick={() => setMode('manuel')}>Ajuster</button>
                  </p>
                </div>
              )}
              {etatIa && !chargeIa && <p className="erreur">{etatIa}</p>}
            </div>
          ) : (
            <div className="mode-manuel">
              <fieldset className="champ">
                <legend>Produit</legend>
                <div className="produits">
                  {ref_?.produits.map((p) => (
                    <label key={p.code} className={`produit ${demande.produitCode === p.code ? 'actif' : ''}`} title={p.usage}>
                      <input type="radio" name="produit" value={p.code} checked={demande.produitCode === p.code} onChange={() => setDemande({ ...demande, produitCode: p.code })} />
                      <span className="p-nom">{p.nom}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="champ">
                <span>Quantité <output>{demande.tonnage} t</output></span>
                <input type="range" min="1" max="500" step="1" value={demande.tonnage} onChange={(e) => setDemande({ ...demande, tonnage: Number(e.target.value) })} />
              </label>
            </div>
          )}
        </div>

        <label className="coche">
          <input type="checkbox" checked={demande.accesDifficile} onChange={(e) => setDemande({ ...demande, accesDifficile: e.target.checked })} />
          <span>Accès difficile (camions de 12 t max)</span>
        </label>

        <button className="btn btn-principal" disabled={chargement || chargeIa || (mode === 'ia' && !texte.trim())}>
          {chargeIa ? 'Analyse en cours…' : chargement ? 'Calcul…' : mode === 'ia' ? 'Calculer mon devis avec l\u2019IA' : 'Calculer mon devis'}
        </button>
        {erreur && <p className="erreur">{erreur}</p>}
      </form>
    </section>
  );
}
