import { eur2, num } from '../api.js';

export default function Kpis({ resultat, offre, tonnage, chargement }) {
  const vide = !resultat || !offre;
  const tuiles = [
    { titre: 'Combinaisons évaluées', valeur: vide ? '–' : num(resultat.combinaisonsEvaluees), detail: vide ? '' : `${resultat.sitesProches} sites à moins de 150 km` },
    { titre: 'Prix livré retenu', valeur: vide ? '–' : `${eur2(offre.prixTonneLivre)}/t`, detail: vide ? '' : `${num(tonnage)} t · ${offre.camion.nom}` },
    { titre: 'Écart de prix entre sites', valeur: vide || !resultat.ecartPrix ? '–' : `×${num(resultat.ecartPrix, 2)}`, detail: 'du moins cher au plus cher' },
    { titre: 'CO₂ du transport', valeur: vide ? '–' : `${num(offre.co2Kg)} kg`, detail: vide ? '' : `${offre.rotations} rotation${offre.rotations > 1 ? 's' : ''} · ${num(offre.remplissage * 100)} % rempli` },
    {
      titre: 'Temps de calcul',
      valeur: vide ? '–' : `${num(resultat.perf.ms, 1)} ms`,
      detail: vide ? '' : `cache ${resultat.perf.moteur === 'redis' ? 'Redis' : 'mémoire'} : ${resultat.perf.cache === 'HIT' ? 'déjà calculé' : 'nouveau calcul'}`,
      badge: vide ? null : resultat.perf.cache,
    },
  ];
  return (
    <section className={`kpis ${chargement ? 'charge' : ''}`} aria-label="Indicateurs">
      {tuiles.map((t) => (
        <div className="kpi" key={t.titre}>
          <span className="kpi-titre">{t.titre}{t.badge && <b className={`badge ${t.badge === 'HIT' ? 'hit' : ''}`}>{t.badge}</b>}</span>
          <span className="kpi-valeur">{t.valeur}</span>
          <span className="kpi-detail">{t.detail}</span>
        </div>
      ))}
    </section>
  );
}
