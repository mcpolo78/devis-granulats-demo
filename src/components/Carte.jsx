import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Tuiles OpenStreetMap (gratuites, attribution obligatoire). En thème sombre, un filtre CSS les assombrit.
const TUILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const icone = (classe, texte = '') => L.divIcon({ className: '', html: `<div class="marqueur ${classe}">${texte}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] });

export default function Carte({ chantier, resultat, selection, onSelection }) {
  const noeud = useRef(null);
  const carte = useRef(null);
  const calque = useRef(null);

  useEffect(() => {
    const m = L.map(noeud.current, { zoomControl: true, attributionControl: true }).setView([48.95, 2.2], 9);
    m.attributionControl.setPrefix(false);
    L.tileLayer(TUILES, { attribution: ATTRIBUTION, maxZoom: 18, className: 'tuiles' }).addTo(m);
    calque.current = L.layerGroup().addTo(m);
    carte.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(noeud.current);
    return () => {
      ro.disconnect();
      m.remove();
    };
  }, []);

  useEffect(() => {
    const m = carte.current;
    const g = calque.current;
    if (!m || !g) return;
    g.clearLayers();
    const c = [chantier.lat, chantier.lng];
    const points = [c];
    const offres = resultat?.offres ?? [];
    const idsOffres = new Map(offres.map((o, i) => [o.fournisseur.id, i]));

    for (const s of resultat?.tousLesSites ?? []) {
      if (idsOffres.has(s.id)) continue;
      L.marker([s.lat, s.lng], { icon: icone('site'), keyboard: false })
        .bindTooltip(`${s.nom} · ${s.ville}<br>${s.prixTonneLivre.toLocaleString('fr-FR')} €/t livré`)
        .addTo(g);
    }
    offres.forEach((o, i) => {
      const p = [o.fournisseur.lat, o.fournisseur.lng];
      points.push(p);
      const actif = i === selection;
      L.polyline([c, p], { className: `trajet ${actif ? 'actif' : ''}`, weight: actif ? 3 : 2, dashArray: actif ? null : '4 6' }).addTo(g);
      L.marker(p, { icon: icone(actif ? 'top actif' : 'top', String(i + 1)), zIndexOffset: actif ? 1000 : 500 })
        .bindTooltip(`<strong>${i + 1}. ${o.fournisseur.nom}</strong><br>${o.fournisseur.ville} · ${o.distanceKm} km<br>${o.prixTonneLivre.toLocaleString('fr-FR')} €/t livré`)
        .on('click', () => onSelection(i))
        .addTo(g);
    });
    L.marker(c, { icon: icone('chantier', '★'), zIndexOffset: 2000 }).bindTooltip(chantier.adresse).addTo(g);
    if (points.length > 1) m.flyToBounds(L.latLngBounds(points).pad(0.25), { duration: 0.8, maxZoom: 12 });
    else m.flyTo(c, 10, { duration: 0.8 });
  }, [resultat, selection, chantier.lat, chantier.lng, chantier.adresse, onSelection]);

  return <div ref={noeud} className="carte" role="region" aria-label="Carte du chantier et des sites" />;
}
