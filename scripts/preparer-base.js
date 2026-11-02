// Au build Vercel : si une base Postgres est branchée, on synchronise le schéma et on charge le référentiel.
// Sans DATABASE_URL, on saute l'étape : l'API tournera sur le référentiel en mémoire.
import { execSync } from 'node:child_process';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.log('[base] Pas de DATABASE_URL : mode mémoire.');
} else {
  const env = { ...process.env, DATABASE_URL: url };
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit', env });
  execSync('node prisma/seed.js', { stdio: 'inherit', env });
}
