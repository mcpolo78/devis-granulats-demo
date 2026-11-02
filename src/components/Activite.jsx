import { eur, num } from '../api.js';

const heure = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export default function Activite({ activite, produits }) {
  const nom = (c) => produits?.find((p) => p.code === c)?.nom ?? c;
  const s = activite?.stats;
  return (
    <section className="panneau activite">
      <h2>Activité de la plateforme</h2>
      <div className="mini-stats">
        <span><strong>{s ? num(s.total) : '–'}</strong> devis</span>
        <span><strong>{s ? num(s.commandes) : '–'}</strong> commandes</span>
        <span><strong>{s ? num(s.tonnes) : '–'}</strong> t demandées</span>
      </div>
      <ul className="journal">
        {(activite?.devis ?? []).map((d) => (
          <li key={d.id}>
            <span className={`etat ${d.statut}`}>{d.statut === 'commande' ? 'Commande' : 'Devis'}</span>
            <span className="j-texte">{num(d.tonnage)} t {nom(d.produitCode)} · {d.adresse}</span>
            <span className="j-prix">{eur(d.totalHT)}</span>
            <span className="j-heure">{heure(d.createdAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
