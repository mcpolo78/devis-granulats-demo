// Géocodage via la Base Adresse Nationale (API publique, gratuite, sans clé).
const URL_BAN = 'https://api-adresse.data.gouv.fr/search/';

export async function geocoder(q) {
  const u = `${URL_BAN}?q=${encodeURIComponent(q)}&limit=5`;
  const r = await fetch(u, { signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'devis-granulats-demo' } });
  if (!r.ok) throw new Error(`BAN ${r.status}`);
  const j = await r.json();
  return (j.features || []).map((f) => ({
    label: f.properties.label,
    ville: f.properties.city,
    cp: f.properties.postcode,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));
}
