// Assistant « quel granulat et combien ? » : Ministral 14B (Mistral AI, offre gratuite) lit la description
// du chantier et renvoie un JSON (usage, produit, surface, épaisseur). Le tonnage est recalculé ici
// (surface × épaisseur × densité) : on ne fait pas confiance au modèle pour l'arithmétique.
// Sans MISTRAL_API_KEY ou en cas d'erreur, des règles simples prennent le relais.

const URL_MISTRAL = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions';

// Épaisseurs usuelles (cm) par usage, pour compléter une description incomplète.
const USAGES = [
  { cle: /all[ée]e.*(voiture|carross|v[ée]hicule|garage)|carross/i, usage: 'Allée carrossable', produit: 'GRAV-1014', ep: 10 },
  { cle: /all[ée]e|chemin|cour/i, usage: 'Allée piétonne', produit: 'GRAV-610', ep: 5 },
  { cle: /parking|plateforme|voirie|couche de forme|piste/i, usage: 'Parking / couche de forme', produit: 'GRAVE-0315', ep: 30 },
  { cle: /h[ée]risson|dalle|drain|puisard|d[ée]rainage/i, usage: 'Hérisson / drainage', produit: 'CAIL-2040', ep: 20 },
  { cle: /tranch[ée]e|canalisation|r[ée]seau|fourreau/i, usage: 'Tranchée de réseaux', produit: 'SABLE-TR', ep: 20 },
  { cle: /b[ée]ton|mortier|chape|lit de pose|pav[ée]/i, usage: 'Béton / lit de pose', produit: 'SABLE-04', ep: 5 },
  { cle: /pelouse|gazon|jardin|massif|potager|jardini[èe]re/i, usage: 'Pelouse / jardin', produit: 'TERRE-VEG', ep: 15 },
];

function nombre(re, t) {
  const m = t.match(re);
  return m ? Number(m[1].replace(',', '.')) : null;
}

export function analyseRegles(texte) {
  const u = USAGES.find((x) => x.cle.test(texte)) || USAGES[2];
  let surface = nombre(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|m\^2|mètres? carr)/i, texte);
  const dims = texte.match(/(\d+(?:[.,]\d+)?)\s*(?:m)?\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*m?/i);
  if (!surface && dims) surface = Number(dims[1].replace(',', '.')) * Number(dims[2].replace(',', '.'));
  const ep = nombre(/(\d+(?:[.,]\d+)?)\s*cm/i, texte) ?? u.ep;
  return { usage: u.usage, produitCode: u.produit, surfaceM2: surface ?? 50, epaisseurCm: ep, explication: 'Estimation par règles (assistant IA indisponible).' };
}

const SYSTEME = (produits) => `Tu aides un conducteur de travaux à commander des granulats livrés en vrac.
À partir de sa description, réponds UNIQUEMENT avec un objet JSON :
{"usage": string court, "produitCode": un code parmi la liste, "surfaceM2": nombre, "epaisseurCm": nombre, "explication": une ou deux phrases en français}
Produits disponibles :
${produits.map((p) => `- ${p.code} : ${p.nom} (${p.usage})`).join('\n')}
Épaisseurs usuelles : allée piétonne 5 cm de gravier, allée carrossable 10 cm, couche de forme / parking 30 cm de grave, hérisson 20 cm de caillou, tranchée 20 cm de sable, pelouse 15 cm de terre.
Si une dimension manque, propose une valeur usuelle et dis-le dans l'explication. Ne calcule pas le tonnage.`;

export async function analyserChantier(texte, produits) {
  const t = String(texte || '').slice(0, 400).trim();
  if (!t) throw new Error('Description vide.');
  let r = null;
  let source = 'regles';
  if (process.env.MISTRAL_API_KEY) {
    try {
      const rep = await fetch(URL_MISTRAL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
        body: JSON.stringify({
          model: process.env.MISTRAL_MODEL || 'ministral-14b-latest',
          messages: [{ role: 'system', content: SYSTEME(produits) }, { role: 'user', content: t }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 300,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!rep.ok) throw new Error(`Mistral ${rep.status} ${(await rep.text()).slice(0, 120)}`);
      const j = await rep.json();
      r = JSON.parse(j.choices[0].message.content);
      source = 'ia';
    } catch (e) {
      console.error('[assistant]', e.message);
    }
  }
  if (!r) r = analyseRegles(t);

  const produit = produits.find((p) => p.code === r.produitCode) || produits.find((p) => p.code === 'GRAVE-0315');
  const surface = Math.min(Math.max(Number(r.surfaceM2) || 50, 1), 50000);
  const ep = Math.min(Math.max(Number(r.epaisseurCm) || 10, 1), 200);
  const volume = (surface * ep) / 100;
  const tonnage = Math.max(1, Math.ceil(volume * produit.densite));
  return {
    source,
    usage: String(r.usage || '').slice(0, 60),
    produitCode: produit.code,
    produitNom: produit.nom,
    surfaceM2: Math.round(surface * 10) / 10,
    epaisseurCm: ep,
    volumeM3: Math.round(volume * 10) / 10,
    densite: produit.densite,
    tonnage,
    explication: String(r.explication || '').slice(0, 300),
  };
}
