import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculerDevis, distanceKm, surchargeGazole, premierJourLivrable, validerDemande } from '../server/lib/devis.js';
import { analyseRegles } from '../server/lib/assistant.js';
import { PRODUITS, FOURNISSEURS, CAMIONS, INDICE_GAZOLE, PART_CARBURANT } from '../server/data/referentiel.js';

const ref = { fournisseurs: FOURNISSEURS, camions: CAMIONS, indices: INDICE_GAZOLE, partCarburant: PART_CARBURANT };
const paris = { lat: 48.8443, lng: 2.3744 };

test('distance Paris-Lyon ≈ 392 km à vol d\'oiseau', () => {
  const d = distanceKm({ lat: 48.8566, lng: 2.3522 }, { lat: 45.764, lng: 4.8357 });
  assert.ok(d > 385 && d < 400, String(d));
});

test('surcharge gazole : +4,7 % d\'indice sur 25 % du transport', () => {
  assert.equal(Math.round(surchargeGazole(1000, 104.7, 100, 0.25) * 100) / 100, 11.75);
});

test('les offres sont triées par total croissant, une par site', () => {
  const r = calculerDevis({ chantier: paris, produitCode: 'GRAVE-0315', tonnage: 60 }, ref);
  assert.ok(r.offres.length >= 3);
  for (let i = 1; i < r.offres.length; i++) assert.ok(r.offres[i].total >= r.offres[i - 1].total);
  assert.equal(new Set(r.offres.map((o) => o.fournisseur.id)).size, r.offres.length);
  assert.ok(r.combinaisonsEvaluees >= r.sitesProches);
});

test('total = matériau + transport + gazole, rotations suffisantes', () => {
  const r = calculerDevis({ chantier: paris, produitCode: 'SABLE-04', tonnage: 45 }, ref);
  for (const o of r.offres) {
    assert.ok(Math.abs(o.materiau + o.transport + o.gazole - o.total) < 0.02);
    assert.ok(o.rotations * o.camion.capaciteT >= 45);
  }
});

test('accès difficile : seulement des camions urbains', () => {
  const r = calculerDevis({ chantier: paris, produitCode: 'GRAVE-0315', tonnage: 30, accesDifficile: true }, ref);
  assert.ok(r.offres.every((o) => ['6X4', '4X2'].includes(o.camion.code)));
});

test('aucun site au-delà de 150 km', () => {
  const r = calculerDevis({ chantier: { lat: 47.0, lng: 6.5 }, produitCode: 'TERRE-VEG', tonnage: 10 }, ref);
  assert.equal(r.offres.length, 0);
});

test('livraison 2 jours ouvrés plus tard (vendredi → mardi)', () => {
  assert.equal(premierJourLivrable(new Date('2026-11-06T10:00:00Z')), '2026-11-10');
});

test('validation de la demande', () => {
  const codes = PRODUITS.map((p) => p.code);
  assert.equal(validerDemande({ lat: 48.9, lng: 2.1, produitCode: 'SABLE-04', tonnage: 20 }, codes), null);
  assert.match(validerDemande({ lat: 10, lng: 2.1, produitCode: 'SABLE-04', tonnage: 20 }, codes), /France/);
  assert.match(validerDemande({ lat: 48.9, lng: 2.1, produitCode: 'X', tonnage: 20 }, codes), /Produit/);
  assert.match(validerDemande({ lat: 48.9, lng: 2.1, produitCode: 'SABLE-04', tonnage: 0 }, codes), /Tonnage/);
});

test('assistant (règles) : allée carrossable 8 x 5 m', () => {
  const r = analyseRegles('allée pour voiture de 8 x 5 m');
  assert.equal(r.produitCode, 'GRAV-1014');
  assert.equal(r.surfaceM2, 40);
  assert.equal(r.epaisseurCm, 10);
});
