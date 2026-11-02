import { eur, eur2, num } from '../api.js';

export default function Offres({ resultat, selection, onSelection, chargement }) {
  const offres = resultat?.offres.slice(0, 3) ?? [];
  return (
    <section className={`panneau offres ${chargement ? 'charge' : ''}`}>
      <h2>Meilleures offres <span className="discret">prix HT, livraison comprise</span></h2>
      <ol className="liste-offres" key={resultat?.devisId ?? 'vide'}>
        {offres.map((o, i) => (
          <li key={o.fournisseur.id}>
            <button type="button" className={`offre ${i === selection ? 'actif' : ''}`} onClick={() => onSelection(i)} aria-pressed={i === selection}>
              <span className="rang">{i + 1}</span>
              <span className="offre-corps">
                <span className="offre-haut">
                  <strong>{o.fournisseur.nom}</strong>
                  <span className="offre-total">{eur(o.total)}</span>
                </span>
                <span className="offre-bas">
                  <span>{o.fournisseur.ville} · {num(o.distanceKm)} km · {o.rotations} × {o.camion.nom}</span>
                  <span>{eur2(o.prixTonneLivre)}/t</span>
                </span>
              </span>
            </button>
          </li>
        ))}
        {!offres.length && !chargement && <li className="vide">Pas d'offre pour cette zone.</li>}
      </ol>
    </section>
  );
}
