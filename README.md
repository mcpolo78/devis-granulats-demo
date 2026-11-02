# Granulo · devis instantané de granulats livrés (démo)

Démo full-stack : à partir d'une adresse de chantier, d'un produit (sable, gravier, grave, terre…) et d'un tonnage,
le moteur croise chaque site d'extraction avec chaque type de camion, calcule **matériau + transport + indexation gazole**
et classe les offres livrées. **Toutes les données sont fictives** (entreprises, prix, indice gazole).

## Ce que montre la démo

- **Moteur de devis** (`server/lib/devis.js`) : distance routière estimée, rotations par camion (semi, 8x4, 6x4, 4x2),
  forfait + coût au km aller-retour, révision gazole `transport × 25 % × (indice du mois / indice du tarif − 1)`,
  option « accès difficile » (camions urbains seulement), une offre par site, créneaux à J+2 ouvrés entre 6h30 et 16h30.
- **API Express** (`server/app.js`) : `/api/devis`, `/api/devis/:id/reserver`, `/api/geocode` (Base Adresse Nationale),
  `/api/activite`, `/api/assistant`, limitation de débit par IP.
- **Prisma + Postgres** : référentiel (sites, tarifs, camions, indice) et historique des devis / commandes.
- **Cache Redis** : devis identiques (position arrondie à ~1 km) et géocodage. Le tableau de bord affiche `HIT` / `MISS` et le temps de calcul.
- **Assistant IA** (Ministral 14B, offre gratuite Mistral) : « une allée de 12 × 3 m » → produit, surface, épaisseur.
  Le tonnage est **recalculé côté serveur** (surface × épaisseur × densité).
- **Front React** (Vite + Leaflet) : tableau de bord sur un seul écran, carte, offres, décomposition du prix, indice gazole.

Chaque brique a un repli : sans `DATABASE_URL` les données sont en mémoire, sans Redis le cache est en mémoire,
sans `MISTRAL_API_KEY` l'assistant passe par des règles simples.

## Lancer en local

```bash
npm install
cp .env.example .env        # facultatif
npm run db:push && npm run db:seed   # si DATABASE_URL est défini
node --env-file-if-exists=.env scripts/dev.js   # API sur :3001
npx vite                    # front sur :5173 (proxy /api)
npm test                    # tests du moteur
```

## Déploiement

Vercel : le front est construit par Vite (`dist/`), l'API Express tourne dans `api/index.js`.
Au build, `scripts/preparer-base.js` synchronise le schéma Prisma et charge le référentiel si une base est branchée
(Neon via Vercel Storage). Redis : Upstash via Vercel Storage (`KV_REST_API_URL` / `KV_REST_API_TOKEN`).

Fond de carte © contributeurs OpenStreetMap. Géocodage : Base Adresse Nationale (api-adresse.data.gouv.fr).
