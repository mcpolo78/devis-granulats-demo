// Référentiel FICTIF : sites d'extraction, produits, camions, indice gazole.
// Les communes sont réelles (pour placer les points sur la carte), les entreprises et les prix sont inventés.

export const PRODUITS = [
  { code: 'SABLE-04', nom: 'Sable 0/4 lavé', categorie: 'Sable', densite: 1.6, usage: 'béton, mortier, lit de pose' },
  { code: 'SABLE-TR', nom: 'Sable de tranchée 0/2', categorie: 'Sable', densite: 1.55, usage: 'enrobage de réseaux, tranchée' },
  { code: 'GRAV-610', nom: 'Gravier 6/10 roulé', categorie: 'Gravier', densite: 1.5, usage: 'allée piétonne, drainage léger' },
  { code: 'GRAV-1014', nom: 'Gravier 10/14 concassé', categorie: 'Gravier', densite: 1.5, usage: 'allée carrossable, béton désactivé' },
  { code: 'GRAVE-0315', nom: 'Grave 0/31,5 GNT', categorie: 'Grave', densite: 2.0, usage: 'couche de forme, voirie, parking' },
  { code: 'CAIL-2040', nom: 'Caillou 20/40 drainant', categorie: 'Caillou', densite: 1.5, usage: 'hérisson, drain, puisard' },
  { code: 'TERRE-VEG', nom: 'Terre végétale criblée', categorie: 'Terre', densite: 1.3, usage: 'pelouse, jardinière, massif' },
];

// [id, nom, commune, lat, lng, type, prix €/t par code produit]
const S = (id, nom, ville, lat, lng, type, prix) => ({ id, nom, ville, lat, lng, type, prix });
export const FOURNISSEURS = [
  S('F01', 'Carrière du Vexin', 'Guitrancourt', 49.008, 1.784, 'Carrière', { 'GRAVE-0315': 17.5, 'CAIL-2040': 24, 'GRAV-1014': 27 }),
  S('F02', 'Sablière de l\'Oise', 'Bernes-sur-Oise', 49.161, 2.300, 'Sablière', { 'SABLE-04': 22, 'SABLE-TR': 18, 'GRAV-610': 29 }),
  S('F03', 'Granulats Seine Aval', 'Saint-Martin-la-Garenne', 49.034, 1.689, 'Sablière', { 'SABLE-04': 20.5, 'GRAV-610': 27.5, 'SABLE-TR': 16.5 }),
  S('F04', 'Recyclage Plaine Ouest', 'Carrières-sous-Poissy', 48.947, 2.040, 'Plateforme de recyclage', { 'GRAVE-0315': 12.5, 'CAIL-2040': 16 }),
  S('F05', 'Matériaux du Mantois', 'Gargenville', 48.988, 1.811, 'Carrière', { 'GRAV-1014': 25, 'CAIL-2040': 22.5, 'GRAVE-0315': 18 }),
  S('F06', 'Terres & Composts IDF', 'Achères', 48.962, 2.069, 'Biocentre', { 'TERRE-VEG': 21 }),
  S('F07', 'Carrière de la Marne', 'Isles-lès-Villenoy', 48.906, 2.833, 'Carrière', { 'GRAVE-0315': 18.5, 'GRAV-1014': 28, 'SABLE-04': 24 }),
  S('F08', 'Sablières du Loing', 'Bagneaux-sur-Loing', 48.233, 2.703, 'Sablière', { 'SABLE-04': 18.5, 'SABLE-TR': 15, 'GRAV-610': 25.5 }),
  S('F09', 'Recyclage Grand Paris Sud', 'Bonneuil-sur-Marne', 48.770, 2.488, 'Plateforme de recyclage', { 'GRAVE-0315': 13, 'CAIL-2040': 17.5, 'SABLE-TR': 14 }),
  S('F10', 'Granulats de l\'Essonne', 'Itteville', 48.513, 2.343, 'Sablière', { 'SABLE-04': 21, 'GRAV-610': 26, 'GRAV-1014': 27 }),
  S('F11', 'Terres Vertes Sud', 'Lisses', 48.602, 2.425, 'Biocentre', { 'TERRE-VEG': 19 }),
  S('F12', 'Carrière de Montereau', 'Montereau-Fault-Yonne', 48.385, 2.951, 'Carrière', { 'CAIL-2040': 21, 'GRAVE-0315': 16.5, 'GRAV-1014': 24 }),
  S('F13', 'Sablière de Beauce', 'Coignières', 48.750, 1.920, 'Sablière', { 'SABLE-04': 23, 'SABLE-TR': 17.5 }),
  S('F14', 'Terres du Vexin', 'Cergy', 49.036, 2.063, 'Biocentre', { 'TERRE-VEG': 23.5 }),
  S('F15', 'Carrière Nord Picardie', 'Saint-Maximin', 49.222, 2.452, 'Carrière', { 'GRAVE-0315': 15.5, 'CAIL-2040': 20, 'GRAV-1014': 23.5 }),
  S('F16', 'Recyclage Roissy', 'Gonesse', 48.986, 2.449, 'Plateforme de recyclage', { 'GRAVE-0315': 12, 'CAIL-2040': 15.5 }),
  S('F17', 'Granulats Rhône-Saône', 'Villeurbanne', 45.771, 4.880, 'Carrière', { 'SABLE-04': 19, 'GRAVE-0315': 15, 'GRAV-1014': 24, 'CAIL-2040': 20 }),
  S('F18', 'Terres du Lyonnais', 'Brignais', 45.674, 4.754, 'Biocentre', { 'TERRE-VEG': 18 }),
  S('F19', 'Carrière de l\'Estuaire', 'Saint-Herblain', 47.212, -1.649, 'Carrière', { 'SABLE-04': 18, 'GRAVE-0315': 14.5, 'GRAV-610': 24, 'CAIL-2040': 19.5 }),
  S('F20', 'Sablières de Gironde', 'Saint-Médard-en-Jalles', 44.896, -0.719, 'Sablière', { 'SABLE-04': 17, 'SABLE-TR': 13.5, 'GRAV-610': 23 }),
  S('F21', 'Granulats des Flandres', 'Lesquin', 50.589, 3.111, 'Carrière', { 'GRAVE-0315': 15.5, 'CAIL-2040': 21, 'SABLE-04': 21.5 }),
  S('F22', 'Carrière de Provence', 'Les Pennes-Mirabeau', 43.410, 5.317, 'Carrière', { 'GRAVE-0315': 14, 'GRAV-1014': 22, 'CAIL-2040': 18.5, 'TERRE-VEG': 22 }),
  S('F23', 'Sablière de Seine-Amont', 'Marolles-sur-Seine', 48.381, 3.036, 'Sablière', { 'SABLE-04': 17.5, 'GRAV-610': 24, 'SABLE-TR': 14 }),
  S('F24', 'Granulats de Normandie', 'Gaillon', 49.160, 1.330, 'Carrière', { 'GRAV-610': 23, 'GRAV-1014': 22.5, 'SABLE-04': 19 }),
];

// Coûts indicatifs FICTIFS : forfait par rotation (chargement + déchargement) et coût au km (aller-retour facturé).
export const CAMIONS = [
  { code: 'SEMI', nom: 'Semi-benne', capaciteT: 28, coutKm: 2.05, forfait: 110, co2Km: 1.05, urbain: false },
  { code: '8X4', nom: '8x4 benne', capaciteT: 17, coutKm: 1.70, forfait: 85, co2Km: 0.90, urbain: false },
  { code: '6X4', nom: '6x4 benne', capaciteT: 12, coutKm: 1.45, forfait: 70, co2Km: 0.74, urbain: true },
  { code: '4X2', nom: '4x2 benne', capaciteT: 8, coutKm: 1.20, forfait: 60, co2Km: 0.55, urbain: true },
];

// Indice gazole FICTIF (base 100 = novembre 2025), inspiré du principe des indices CNR.
export const INDICE_GAZOLE = [
  ['2025-11', 100.0], ['2025-12', 101.6], ['2026-01', 103.1], ['2026-02', 99.4],
  ['2026-03', 97.8], ['2026-04', 98.6], ['2026-05', 102.2], ['2026-06', 104.0],
  ['2026-07', 103.3], ['2026-08', 105.4], ['2026-09', 106.1], ['2026-10', 104.7],
].map(([mois, valeur]) => ({ mois, valeur }));

// Part du carburant dans le prix d'une rotation (entre 20 et 30 % selon la profession).
export const PART_CARBURANT = 0.25;
