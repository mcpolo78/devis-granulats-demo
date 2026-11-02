async function appel(url, options) {
  const r = await fetch(url, options);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.erreur || `Erreur ${r.status}`);
  return j;
}
const post = (url, body) => appel(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const api = {
  referentiel: () => appel('/api/referentiel'),
  geocode: (q) => appel(`/api/geocode?q=${encodeURIComponent(q)}`),
  devis: (d) => post('/api/devis', d),
  reserver: (id, creneau, o) => post(`/api/devis/${encodeURIComponent(id)}/reserver`, {
    creneau,
    offre: { fournisseurNom: o.fournisseur.nom, camionCode: o.camion.code, rotations: o.rotations, totalHT: o.total, prixTonne: o.prixTonneLivre, co2Kg: o.co2Kg },
  }),
  activite: () => appel('/api/activite'),
  assistant: (texte) => post('/api/assistant', { texte }),
};

const nf = (opts) => new Intl.NumberFormat('fr-FR', opts);
export const eur = (n) => nf({ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
export const eur2 = (n) => nf({ style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export const num = (n, d = 0) => nf({ maximumFractionDigits: d }).format(n);
export const dateFr = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
