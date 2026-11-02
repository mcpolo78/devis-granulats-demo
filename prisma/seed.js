// Remplit la base avec le référentiel fictif (idempotent : upsert).
import { PrismaClient } from '@prisma/client';
import { PRODUITS, FOURNISSEURS, CAMIONS, INDICE_GAZOLE } from '../server/data/referentiel.js';

const prisma = new PrismaClient();

export async function seed() {
  for (const p of PRODUITS) await prisma.produit.upsert({ where: { code: p.code }, update: p, create: p });
  for (const c of CAMIONS) await prisma.camion.upsert({ where: { code: c.code }, update: c, create: c });
  for (const i of INDICE_GAZOLE) await prisma.indiceGazole.upsert({ where: { mois: i.mois }, update: i, create: i });
  for (const { prix, ...f } of FOURNISSEURS) {
    await prisma.fournisseur.upsert({ where: { id: f.id }, update: f, create: f });
    for (const [produitCode, prixTonne] of Object.entries(prix)) {
      await prisma.tarif.upsert({
        where: { fournisseurId_produitCode: { fournisseurId: f.id, produitCode } },
        update: { prixTonne },
        create: { fournisseurId: f.id, produitCode, prixTonne },
      });
    }
  }
  const n = await prisma.tarif.count();
  console.log(`[seed] ${FOURNISSEURS.length} sites, ${PRODUITS.length} produits, ${n} tarifs, ${CAMIONS.length} camions.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed().finally(() => prisma.$disconnect());
}
