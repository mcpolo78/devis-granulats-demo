import { useState } from 'react';
import { eur2 } from '../api.js';

const SERIES = [
  { cle: 'materiau', nom: 'Matériau', classe: 's1' },
  { cle: 'transport', nom: 'Transport', classe: 's2' },
  { cle: 'gazole', nom: 'Indexation gazole', classe: 's3' },
];

export default function Decomposition({ resultat, selection, onSelection }) {
  const [survol, setSurvol] = useState(null);
  const offres = resultat?.offres ?? [];
  const lignes = offres.map((o) => {
    const t = o.total / o.prixTonneLivre; // tonnage
    return { o, parT: { materiau: o.materiau / t, transport: o.transport / t, gazole: o.gazole / t } };
  });
  const max = Math.max(1, ...offres.map((o) => o.prixTonneLivre));

  return (
    <section className="panneau decomposition">
      <div className="titre-ligne">
        <h2>Décomposition du prix livré, en € par tonne</h2>
        <div className="legende" aria-label="Légende">
          {SERIES.map((s) => (
            <span key={s.cle}><i className={`carre ${s.classe}`} />{s.nom}</span>
          ))}
        </div>
      </div>
      {!offres.length && <p className="vide">Aucun site ne livre ce produit à moins de 150 km.</p>}
      <div className="barres" onMouseLeave={() => setSurvol(null)}>
        {lignes.map(({ o, parT }, i) => (
          <button type="button" key={o.fournisseur.id} className={`barre-ligne ${i === selection ? 'actif' : ''}`} onClick={() => onSelection(i)}>
            <span className="barre-nom">{i + 1}. {o.fournisseur.nom}</span>
            <span className="barre-piste">
              <span className="barre" style={{ width: `${(o.prixTonneLivre / max) * 100}%` }}>
                {SERIES.map((s) => (
                  <span
                    key={s.cle}
                    className={`seg ${s.classe}`}
                    style={{ flexGrow: Math.max(parT[s.cle], 0.0001) }}
                    onMouseEnter={(e) => setSurvol({ i, s, v: parT[s.cle], x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2 })}
                  />
                ))}
              </span>
              <span className="barre-total">{eur2(o.prixTonneLivre)}</span>
              {survol?.i === i && (
                <span className="infobulle" style={{ left: survol.x }}>
                  <i className={`carre ${survol.s.classe}`} />{survol.s.nom} : <strong>{eur2(survol.v)}/t</strong>
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
