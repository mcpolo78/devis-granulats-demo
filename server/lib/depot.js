// Accès aux données : Prisma + Postgres si DATABASE_URL est défini, sinon référentiel en mémoire.
import { PRODUITS, FOURNISSEURS, CAMIONS, INDICE_GAZOLE, PART_CARBURANT } from '../data/referentiel.js';

let prisma = null;
async function client() {
  if (!process.env.DATABASE_URL) return null;
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

export const modeDonnees = () => (process.env.DATABASE_URL ? 'postgres' : 'memoire');

let refCache = null;
let refCacheAt = 0;
const TTL_REF_MS = 5 * 60 * 1000;

export async function referentiel() {
  if (refCache && Date.now() - refCacheAt < TTL_REF_MS) return refCache;
  const db = await client();
  if (!db) {
    refCache = { produits: PRODUITS, fournisseurs: FOURNISSEURS, camions: CAMIONS, indices: INDICE_GAZOLE, partCarburant: PART_CARBURANT };
  } else {
    const [produits, fournisseursDb, camions, indices] = await Promise.all([
      db.produit.findMany({ orderBy: { code: 'asc' } }),
      db.fournisseur.findMany({ include: { tarifs: true }, orderBy: { id: 'asc' } }),
      db.camion.findMany({ orderBy: { capaciteT: 'desc' } }),
      db.indiceGazole.findMany({ orderBy: { mois: 'asc' } }),
    ]);
    const fournisseurs = fournisseursDb.map(({ tarifs, ...f }) => ({
      ...f,
      prix: Object.fromEntries(tarifs.map((t) => [t.produitCode, t.prixTonne])),
    }));
    refCache = { produits, fournisseurs, camions, indices, partCarburant: PART_CARBURANT };
  }
  refCacheAt = Date.now();
  return refCache;
}

// Historique des devis : table Devis en base, ou liste en mémoire (perdue au redémarrage).
const memoire = [];
const LIMITE_MEMOIRE = 200;

export async function enregistrerDevis(d) {
  const db = await client();
  if (!db) {
    const ligne = { id: `mem_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, statut: 'devis', creneau: null, createdAt: new Date(), ...d };
    memoire.unshift(ligne);
    memoire.length = Math.min(memoire.length, LIMITE_MEMOIRE);
    return ligne;
  }
  return db.devis.create({ data: d });
}

export async function reserverCreneau(id, creneau, patch = {}) {
  const db = await client();
  if (!db) {
    const l = memoire.find((x) => x.id === id);
    if (!l) return null;
    Object.assign(l, patch, { creneau, statut: 'commande' });
    return l;
  }
  try {
    return await db.devis.update({ where: { id }, data: { ...patch, creneau, statut: 'commande' } });
  } catch {
    return null;
  }
}

export async function derniersDevis(n = 8) {
  const db = await client();
  const lignes = db ? await db.devis.findMany({ orderBy: { createdAt: 'desc' }, take: n }) : memoire.slice(0, n);
  return lignes;
}

export async function statsDevis() {
  const db = await client();
  if (!db) {
    const total = memoire.length;
    const commandes = memoire.filter((d) => d.statut === 'commande').length;
    const tonnes = memoire.reduce((s, d) => s + d.tonnage, 0);
    return { total, commandes, tonnes };
  }
  const [total, commandes, agg] = await Promise.all([
    db.devis.count(),
    db.devis.count({ where: { statut: 'commande' } }),
    db.devis.aggregate({ _sum: { tonnage: true } }),
  ]);
  return { total, commandes, tonnes: agg._sum.tonnage ?? 0 };
}
