import { useEffect, useMemo, useState } from 'react';
import { api, dateFr } from '../api.js';

// Les 5 jours ouvrés proposés, à partir de la première date livrable renvoyée par l'API (J+2 ouvrés).
function joursOuvres(depuis, n = 5) {
  const jours = [];
  const d = new Date(`${depuis}T12:00:00`);
  while (jours.length < n) {
    if (d.getDay() !== 0 && d.getDay() !== 6) jours.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return jours;
}
const jourCourt = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  return { jour: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''), num: d.getDate() };
};

export default function Planning({ resultat, offre, onReserve }) {
  const [jour, setJour] = useState('');
  const [creneau, setCreneau] = useState('');
  const [etat, setEtat] = useState('');
  const premier = resultat?.livraison?.date;
  const jours = useMemo(() => (premier ? joursOuvres(premier) : []), [premier]);
  useEffect(() => { setJour(premier ?? ''); setCreneau(''); setEtat(''); }, [resultat, premier]);
  if (!resultat?.livraison || !offre) return <section className="panneau planning" />;
  const { creneaux } = resultat.livraison;

  async function reserver() {
    setEtat('envoi');
    try {
      await api.reserver(resultat.devisId, `${jour} ${creneau}`, offre);
      setEtat('ok');
      onReserve(`Livraison réservée le ${dateFr(jour)}, ${creneau.replace('-', ' – ')}, chez ${offre.fournisseur.nom}.`);
    } catch (e) {
      setEtat(e.message);
    }
  }

  return (
    <section className="panneau planning">
      <h2>Planifier la livraison <span className="discret">dès {dateFr(premier)}</span></h2>
      <div className="jours" role="radiogroup" aria-label="Jour de livraison">
        {jours.map((j) => {
          const { jour: nom, num } = jourCourt(j);
          return (
            <button type="button" key={j} role="radio" aria-checked={jour === j} className={`jour ${jour === j ? 'actif' : ''}`} onClick={() => setJour(j)} disabled={etat === 'ok'} title={dateFr(j)}>
              <span>{nom}</span>
              <strong>{num}</strong>
            </button>
          );
        })}
      </div>
      <div className="creneaux" role="radiogroup" aria-label="Créneau">
        {creneaux.map((c) => (
          <button type="button" key={c} role="radio" aria-checked={creneau === c} className={`puce ${creneau === c ? 'actif' : ''}`} onClick={() => setCreneau(c)} disabled={etat === 'ok'}>
            {c.replace('-', '–')}
          </button>
        ))}
      </div>
      <button className="btn btn-principal" disabled={!creneau || !jour || etat === 'envoi' || etat === 'ok'} onClick={reserver}>
        {etat === 'ok' ? 'Créneau réservé ✓' : creneau ? `Réserver le ${jourCourt(jour).jour} ${jourCourt(jour).num}, ${creneau.replace('-', '–')}` : 'Choisissez un créneau'}
      </button>
      {etat && !['ok', 'envoi'].includes(etat) && <p className="erreur">{etat}</p>}
    </section>
  );
}
