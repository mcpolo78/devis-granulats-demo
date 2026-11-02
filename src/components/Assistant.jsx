import { useState } from 'react';
import { api, num } from '../api.js';

const EXEMPLES = [
  ['Allée 12 × 3 m', 'Allée carrossable de 12 x 3 m'],
  ['Parking 400 m²', 'Parking de 400 m² pour poids lourds'],
  ['Pelouse 150 m²', 'Pelouse de 150 m²'],
];

export default function Assistant({ onAppliquer }) {
  const [texte, setTexte] = useState('');
  const [res, setRes] = useState(null);
  const [etat, setEtat] = useState('');

  async function analyser(t = texte) {
    if (!t.trim()) return;
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
          <button className="btn" disabled={etat === 'chargement' || !texte.trim()}>{etat === 'chargement' ? '…' : 'Estimer'}</button>
        </div>
        <div className="exemples">
          {EXEMPLES.map(([court, x]) => (
            <button type="button" key={x} className="puce" title={x} onClick={() => { setTexte(x); analyser(x); }}>{court}</button>
          ))}
        </div>
      </form>
      <div className={`assistant-res ${res ? 'ouvert' : ''}`}>
        {res && (
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
