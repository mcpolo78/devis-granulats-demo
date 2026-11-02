import { useEffect, useRef, useState } from 'react';
import { num } from '../api.js';

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const moisFr = (m) => { const [a, mm] = m.split('-'); return `${MOIS[Number(mm) - 1]} ${a.slice(2)}`; };

function useTaille() {
  const ref = useRef(null);
  const [t, setT] = useState({ w: 300, h: 110 });
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setT({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, t];
}

export default function IndiceGazole({ indices, partCarburant }) {
  const [ref, { w, h }] = useTaille();
  const [survol, setSurvol] = useState(null);
  const d = indices ?? [];
  const m = { g: 30, d: 8, h: 8, b: 18 };
  const vals = d.map((x) => x.valeur);
  const min = Math.floor(Math.min(96, ...vals) / 2) * 2;
  const max = Math.ceil(Math.max(108, ...vals) / 2) * 2;
  const x = (i) => m.g + (i * (w - m.g - m.d)) / Math.max(1, d.length - 1);
  const y = (v) => m.h + ((max - v) * (h - m.h - m.b)) / (max - min);
  const chemin = d.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.valeur).toFixed(1)}`).join('');
  const dernier = d[d.length - 1];
  const variation = dernier ? dernier.valeur - d[0].valeur : 0;
  const graduations = [min, 100, max].filter((v, i, a) => a.indexOf(v) === i);

  function bouger(e) {
    if (!d.length) return;
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - m.g) / (w - m.g - m.d)) * (d.length - 1));
    setSurvol(Math.min(d.length - 1, Math.max(0, i)));
  }

  return (
    <section className="panneau gazole">
      <h2>
        Indice gazole <span className="discret">fictif, base 100 = nov. 25</span>
        {dernier && <span className="valeur-titre">{num(dernier.valeur, 1)} <small>({variation >= 0 ? '+' : ''}{num(variation, 1)} pts)</small></span>}
      </h2>
      <div className="graphe" ref={ref}>
        <svg width={w} height={h} onMouseMove={bouger} onMouseLeave={() => setSurvol(null)} role="img" aria-label="Évolution de l'indice gazole sur 12 mois">
          {graduations.map((v) => (
            <g key={v}>
              <line x1={m.g} x2={w - m.d} y1={y(v)} y2={y(v)} className={v === 100 ? 'grille base' : 'grille'} />
              <text x={m.g - 6} y={y(v) + 3} className="axe" textAnchor="end">{v}</text>
            </g>
          ))}
          {d.map((p, i) => (i % 4 === 0 || i === d.length - 1) && (
            <text key={p.mois} x={x(i)} y={h - 4} className="axe" textAnchor={i === 0 ? 'start' : i === d.length - 1 ? 'end' : 'middle'}>{moisFr(p.mois)}</text>
          ))}
          <path d={chemin} className="courbe" />
          {dernier && <circle cx={x(d.length - 1)} cy={y(dernier.valeur)} r="4" className="point" />}
          {survol != null && (
            <g>
              <line x1={x(survol)} x2={x(survol)} y1={m.h} y2={h - m.b} className="croix" />
              <circle cx={x(survol)} cy={y(d[survol].valeur)} r="4.5" className="point" />
            </g>
          )}
        </svg>
        {survol != null && (
          <div className="infobulle" style={{ left: Math.min(Math.max(x(survol), 60), w - 60), top: 0 }}>
            {moisFr(d[survol].mois)} : <strong>{num(d[survol].valeur, 1)}</strong>
          </div>
        )}
      </div>
      <p className="note">Le transport est révisé de {num((partCarburant ?? 0.25) * 100)} % × la variation de l'indice depuis la date du tarif (principe des indices CNR).</p>
    </section>
  );
}
