// Cache des devis et du géocodage.
// Ordre : Upstash Redis REST (KV_REST_API_URL / UPSTASH_REDIS_REST_URL), puis Redis classique (REDIS_URL),
// sinon un cache en mémoire : la démo fonctionne sans Redis.
let impl = null;

function memoire() {
  const m = new Map();
  return {
    nom: 'memoire',
    async get(k) {
      const e = m.get(k);
      if (!e) return null;
      if (e.exp < Date.now()) { m.delete(k); return null; }
      return e.v;
    },
    async set(k, v, ttl) {
      if (m.size > 500) m.delete(m.keys().next().value);
      m.set(k, { v, exp: Date.now() + ttl * 1000 });
    },
  };
}

async function creer() {
  const urlRest = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const jeton = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (urlRest && jeton) {
    const { Redis } = await import('@upstash/redis');
    const r = new Redis({ url: urlRest, token: jeton, automaticDeserialization: false });
    return {
      nom: 'redis',
      async get(k) { const v = await r.get(k); return v == null ? null : JSON.parse(v); },
      async set(k, v, ttl) { await r.set(k, JSON.stringify(v), { ex: ttl }); },
    };
  }
  if (process.env.REDIS_URL) {
    const { createClient } = await import('redis');
    const r = createClient({ url: process.env.REDIS_URL, socket: { connectTimeout: 3000 } });
    r.on('error', (e) => console.error('[cache] redis :', e.message));
    await r.connect();
    return {
      nom: 'redis',
      async get(k) { const v = await r.get(k); return v == null ? null : JSON.parse(v); },
      async set(k, v, ttl) { await r.set(k, JSON.stringify(v), { EX: ttl }); },
    };
  }
  return memoire();
}

export async function cache() {
  if (!impl) {
    try {
      impl = await creer();
    } catch (e) {
      console.error('[cache] Redis indisponible, repli en mémoire :', e.message);
      impl = memoire();
    }
  }
  return impl;
}

// Lecture/écriture qui ne casse jamais la requête si Redis tombe.
export async function lireOuCalculer(cle, ttl, calcul) {
  const c = await cache();
  let v = null;
  try { v = await c.get(cle); } catch (e) { console.error('[cache] get :', e.message); }
  if (v != null) return { valeur: v, hit: true, moteur: c.nom };
  v = await calcul();
  try { await c.set(cle, v, ttl); } catch (e) { console.error('[cache] set :', e.message); }
  return { valeur: v, hit: false, moteur: c.nom };
}
