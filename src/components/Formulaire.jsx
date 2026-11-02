import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const RACCOURCIS = [
  { label: 'Paris 12e', adresse: 'Gare de Lyon, 75012 Paris', lat: 48.8443, lng: 2.3744 },
  { label: 'Paris 18e', adresse: 'Porte de la Chapelle, 75018 Paris', lat: 48.8987, lng: 2.3594 },
  { label: 'Serris', adresse: 'Serris, 77700', lat: 48.8545, lng: 2.7856 },
  { label: 'Lyon', adresse: 'Gerland, 69007 Lyon', lat: 45.7279, lng: 4.8315 },
  { label: 'Nantes', adresse: 'Île de Nantes, 44200 Nantes', lat: 47.2059, lng: -1.5541 },
];

export default function Formulaire({ ref_, demande, setDemande, onCalculer, chargement, erreur }) {
  const [saisie, setSaisie] = useState(demande.adresse);
  const [suggestions, setSuggestions] = useState([]);
  const [ouvert, setOuvert] = useState(false);
  const minuteur = useRef(null);

  useEffect(() => setSaisie(demande.adresse), [demande.adresse]);

  function taper(v) {
    setSaisie(v);
    clearTimeout(minuteur.current);
    if (v.trim().length < 3) return setSuggestions([]);
    minuteur.current = setTimeout(() => {
      api.geocode(v).then((r) => { setSuggestions(r.resultats); setOuvert(true); }).catch(() => setSuggestions([]));
    }, 280);
  }

  const choisir = (s) => {
    setDemande({ ...demande, adresse: s.label ?? s.adresse, lat: s.lat, lng: s.lng });
    setOuvert(false);
  };

  return (
    <section className="panneau formulaire">
      <h2>Votre chantier</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCalculer();
        }}
      >
        <label className="champ">
          <span>Adresse de livraison</span>
          <div className="autocomplete">
            <input
              value={saisie}
              onChange={(e) => taper(e.target.value)}
              onFocus={() => suggestions.length && setOuvert(true)}
              onBlur={() => setTimeout(() => setOuvert(false), 150)}
              placeholder="Rue, ville ou code postal"
              autoComplete="off"
              role="combobox"
              aria-expanded={ouvert}
            />
            <ul className={`suggestions ${ouvert && suggestions.length ? 'ouvert' : ''}`} role="listbox">
              {suggestions.map((s) => (
                <li key={`${s.lat},${s.lng}`} role="option" onMouseDown={() => choisir(s)}>{s.label}</li>
              ))}
            </ul>
          </div>
        </label>
        <div className="raccourcis">
          {RACCOURCIS.map((r) => (
            <button type="button" key={r.label} className={`puce ${demande.adresse === r.adresse ? 'actif' : ''}`} onClick={() => choisir(r)}>{r.label}</button>
          ))}
        </div>

        <fieldset className="champ">
          <legend>Produit</legend>
          <div className="produits">
            {ref_?.produits.map((p) => (
              <label key={p.code} className={`produit ${demande.produitCode === p.code ? 'actif' : ''}`} title={p.usage}>
                <input type="radio" name="produit" value={p.code} checked={demande.produitCode === p.code} onChange={() => setDemande({ ...demande, produitCode: p.code })} />
                <span className="p-nom">{p.nom}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="champ">
          <span>Quantité <output>{demande.tonnage} t</output></span>
          <input type="range" min="1" max="500" step="1" value={demande.tonnage} onChange={(e) => setDemande({ ...demande, tonnage: Number(e.target.value) })} />
        </label>

        <label className="coche">
          <input type="checkbox" checked={demande.accesDifficile} onChange={(e) => setDemande({ ...demande, accesDifficile: e.target.checked })} />
          <span>Accès difficile (camions de 12 t max)</span>
        </label>

        <button className="btn btn-principal" disabled={chargement}>{chargement ? 'Calcul…' : 'Calculer mon devis'}</button>
        {erreur && <p className="erreur">{erreur}</p>}
      </form>
    </section>
  );
}
