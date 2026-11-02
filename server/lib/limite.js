// Limiteur simple par IP (fenêtre glissante, en mémoire par instance).
const seaux = new Map();
export function limiter(cle, max, fenetreMs) {
  const now = Date.now();
  const l = (seaux.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (l.length >= max) { seaux.set(cle, l); return false; }
  l.push(now);
  seaux.set(cle, l);
  if (seaux.size > 5000) seaux.delete(seaux.keys().next().value);
  return true;
}
