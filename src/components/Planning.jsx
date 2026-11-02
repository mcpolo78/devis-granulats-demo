import { useEffect, useState } from 'react';
import { api, dateFr } from '../api.js';

export default function Planning({ resultat, offre, onReserve }) {
  const [creneau, setCreneau] = useState('');
  const [etat, setEtat] = useState('');
  useEffect(() => { setCreneau(''); setEtat(''); }, [resultat]);
  if (!resultat?.livraison || !offre) return <section className="panneau planning" />;
  const { date, creneaux } = resultat.livraison;

  async function reserver() {
    setEtat('envoi');
    try {
      await api.reserver(resultat.devisId, `${date} ${creneau}`, offre);
      setEtat('ok');
      onReserve(`Livraison réservée le ${dateFr(date)}, ${creneau.replace('-', ' – ')}, chez ${offre.fournisseur.nom}.`);
    } catch (e) {
      setEtat(e.message);
    }
  }

  return (
    <section className="panneau planning">
      <h2>Planifier la livraison <span className="discret">{dateFr(date)}</span></h2>
      <div className="creneaux" role="radiogroup" aria-label="Créneau">
        {creneaux.map((c) => (
          <button type="button" key={c} role="radio" aria-checked={creneau === c} className={`puce ${creneau === c ? 'actif' : ''}`} onClick={() => setCreneau(c)} disabled={etat === 'ok'}>
            {c.replace('-', '–')}
          </button>
        ))}
      </div>
      <button className="btn btn-principal" disabled={!creneau || etat === 'envoi' || etat === 'ok'} onClick={reserver}>
        {etat === 'ok' ? 'Créneau réservé ✓' : 'Réserver ce créneau'}
      </button>
      {etat && !['ok', 'envoi'].includes(etat) && <p className="erreur">{etat}</p>}
    </section>
  );
}
