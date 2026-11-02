// Moteur de devis : pour une adresse de chantier, un produit et un tonnage, il croise chaque site
// qui vend le produit avec chaque type de camion, calcule matériau + transport + indexation gazole,
// puis classe les combinaisons du moins cher au plus cher (prix livré, HT).

export const COEF_ROUTE = 1.3; // distance routière ≈ vol d'oiseau × 1,3 (pas d'API d'itinéraire dans la démo)
export const RAYON_MAX_KM = 150;

export function distanceKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const arrondi = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

// Indexation gazole : surcoût = transport × part carburant × (indice du mois / indice de référence − 1).
export function surchargeGazole(transport, indiceActuel, indiceReference, partCarburant) {
  return transport * partCarburant * (indiceActuel / indiceReference - 1);
}

// Créneau proposé : 2 jours ouvrés après la demande, 6h30-16h30.
export function premierJourLivrable(depuis = new Date()) {
  const d = new Date(depuis);
  let ouvres = 0;
  while (ouvres < 2) {
    d.setDate(d.getDate() + 1);
    const j = d.getDay();
    if (j !== 0 && j !== 6) ouvres++;
  }
  return d.toISOString().slice(0, 10);
}

/**
 * @param {object} p
 * @param {{lat:number,lng:number}} p.chantier
 * @param {string} p.produitCode
 * @param {number} p.tonnage
 * @param {boolean} [p.accesDifficile] réserve aux camions urbains (6x4, 4x2)
 * @param {object} ref { fournisseurs, camions, indices, partCarburant }
 */
export function calculerDevis({ chantier, produitCode, tonnage, accesDifficile = false }, ref) {
  const { fournisseurs, camions, indices, partCarburant } = ref;
  const indiceRef = indices[0].valeur;
  const indiceActuel = indices[indices.length - 1].valeur;
  const camionsOk = camions.filter((c) => !accesDifficile || c.urbain);

  const combinaisons = [];
  let sitesProches = 0;
  for (const f of fournisseurs) {
    const prixTonne = f.prix[produitCode];
    if (prixTonne == null) continue;
    const km = distanceKm(chantier, f) * COEF_ROUTE;
    if (km > RAYON_MAX_KM) continue;
    sitesProches++;
    for (const c of camionsOk) {
      const rotations = Math.ceil(tonnage / c.capaciteT);
      const materiau = prixTonne * tonnage;
      const transport = rotations * (c.forfait + 2 * km * c.coutKm);
      const gazole = surchargeGazole(transport, indiceActuel, indiceRef, partCarburant);
      const total = materiau + transport + gazole;
      combinaisons.push({
        fournisseur: { id: f.id, nom: f.nom, ville: f.ville, lat: f.lat, lng: f.lng, type: f.type },
        camion: { code: c.code, nom: c.nom, capaciteT: c.capaciteT },
        distanceKm: arrondi(km, 1),
        rotations,
        remplissage: arrondi(tonnage / (rotations * c.capaciteT), 3),
        materiau: arrondi(materiau),
        transport: arrondi(transport),
        gazole: arrondi(gazole),
        total: arrondi(total),
        prixTonneLivre: arrondi(total / tonnage),
        co2Kg: Math.round(rotations * 2 * km * c.co2Km),
      });
    }
  }
  combinaisons.sort((a, b) => a.total - b.total);

  // Une seule offre par site dans le classement (le meilleur camion pour ce site).
  const vus = new Set();
  const parSite = combinaisons.filter((c) => (vus.has(c.fournisseur.id) ? false : vus.add(c.fournisseur.id)));

  const meilleur = parSite[0];
  const pire = parSite[parSite.length - 1];
  return {
    combinaisonsEvaluees: combinaisons.length,
    sitesProches,
    offres: parSite.slice(0, 5),
    tousLesSites: parSite.map((c) => ({ ...c.fournisseur, prixTonneLivre: c.prixTonneLivre })),
    ecartPrix: meilleur && pire ? arrondi(pire.prixTonneLivre / meilleur.prixTonneLivre, 2) : null,
    indice: { reference: indiceRef, actuel: indiceActuel, variationPct: arrondi((indiceActuel / indiceRef - 1) * 100, 1) },
    livraison: { date: premierJourLivrable(), creneaux: ['06:30-08:30', '08:30-10:30', '10:30-12:30', '13:30-15:30', '14:30-16:30'] },
  };
}

export function validerDemande(b, codesProduits) {
  const lat = Number(b?.lat), lng = Number(b?.lng), tonnage = Number(b?.tonnage);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 41 || lat > 51.5 || lng < -5.5 || lng > 9.8) return 'Adresse hors de France métropolitaine.';
  if (!codesProduits.includes(b?.produitCode)) return 'Produit inconnu.';
  if (!Number.isFinite(tonnage) || tonnage < 1 || tonnage > 5000) return 'Tonnage entre 1 et 5 000 t.';
  return null;
}
