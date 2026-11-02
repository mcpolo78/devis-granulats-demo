import { useEffect, useState } from 'react';
import { api, num } from '../api.js';

const EXEMPLES = [
  ['Allée 12 × 3 m', 'Allée carrossable de 12 x 3 m'],
  ['Parking 400 m²', 'Parking de 400 m² pour poids lourds'],
  ['Pelouse 150 m²', 'Pelouse de 150 m²'],
];

const ETAPES = ['Lecture de la demande', 'Choix du granulat adapté', 'Surface et épaisseur', 'Calcul du tonnage'];

export default function Assistant({ onAppliquer }) {
  const [texte, setTexte] = useState('');
  const [res, setRes] = useState(null);
  const [etat, setEtat] = useState('');
  const [etape, setEtape] = useState(0);
  const charge = etat === 'chargement';

  // Pendant l'appel à Mistral, on fait défiler les étapes du raisonnement (la réponse arrive en 1 à 3 s).
  useEffect(() => {
    if (!charge) return undefined;
    setEtape(0);
    const id = setInterval(() => setEtape((e) => Math.min(e + 1, ETAPES.length - 1)), 700);
    return () => clearInterval(id);
  }, [charge]);

  async function analyser(t = texte) {
    if (!t.trim() || charge) return;
    setEtat('chargement');
    try {
      const r = await api.assistant(t);
      setRes(r);
      setEtat('');
      onAppliquer(r);
    } catch (e) {
      setEtat(e.message);
    }
  }

  return (
    <section className="panneau assistant">
      <h2>Assistant chantier <span className="tag">IA</span></h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          analyser();
        }}
      >
        <div className="saisie-ia">
          <textarea
            rows={2}
            maxLength={400}
            placeholder="Ex. : allée de 15 × 3 m pour 2 voitures"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                analyser();
              }
            }}
          />
        </div>
        <div className="exemples">
          {EXEMPLES.map(([court, x]) => (
            <button type="button" key={x} className="puce" title={x} disabled={charge} onClick={() => { setTexte(x); analyser(x); }}>{court}</button>
          ))}
        </div>
        <button className={`btn btn-ia ${charge ? 'en-cours' : ''}`} disabled={charge || !texte.trim()} aria-busy={charge}>
          {charge ? <><span className="spinner" aria-hidden="true" /> Analyse en cours…</> : 'Trouver le produit et la quantité'}
        </button>
      </form>
      <div className={`assistant-res ${res || charge ? 'ouvert' : ''}`}>
        {charge && (
          <div className="ia-attente" role="status" aria-live="polite">
            <p className="ia-titre"><span className="points"><i /><i /><i /></span>Mistral (Ministral 14B) analyse votre chantier</p>
            <ol className="ia-etapes">
              {ETAPES.map((e, i) => (
                <li key={e} className={i < etape ? 'fait' : i === etape ? 'actif' : ''}>{e}</li>
              ))}
            </ol>
          </div>
        )}
        {res && !charge && (
          <>
            <p className="calc">
              <strong>{res.produitNom}</strong> · {num(res.surfaceM2, 1)} m² × {num(res.epaisseurCm)} cm = {num(res.volumeM3, 1)} m³ × {num(res.densite, 2)} t/m³ ≈ <strong>{num(res.tonnage)} t</strong>
            </p>
            <p className="expl">{res.explication} <em>({res.source === 'ia' ? 'Ministral 14B' : 'règles'}, tonnage recalculé côté serveur)</em></p>
          </>
        )}
        {etat && etat !== 'chargement' && <p className="erreur">{etat}</p>}
      </div>
    </section>
  );
}
