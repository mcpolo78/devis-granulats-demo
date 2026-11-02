import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import Assistant from './components/Assistant.jsx';
import Formulaire from './components/Formulaire.jsx';
import Carte from './components/Carte.jsx';
import Kpis from './components/Kpis.jsx';
import Decomposition from './components/Decomposition.jsx';
import Offres from './components/Offres.jsx';
import Planning from './components/Planning.jsx';
import IndiceGazole from './components/IndiceGazole.jsx';
import Activite from './components/Activite.jsx';

const DEPART = {
  adresse: 'Gare de Lyon, 75012 Paris',
  lat: 48.8443,
  lng: 2.3744,
  produitCode: 'GRAVE-0315',
  tonnage: 60,
  accesDifficile: false,
};

export default function App() {
  const [ref, setRef] = useState(null);
  const [demande, setDemande] = useState(DEPART);
  const [resultat, setResultat] = useState(null);
  const [selection, setSelection] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [activite, setActivite] = useState(null);
  const [toast, setToast] = useState('');

  const rafraichirActivite = useCallback(() => api.activite().then(setActivite).catch(() => {}), []);

  const lancer = useCallback(async (d, { defiler = true } = {}) => {
    setChargement(true);
    setErreur('');
    try {
      const r = await api.devis(d);
      setResultat(r);
      setSelection(0);
      rafraichirActivite();
      // Sur téléphone et petit écran, les résultats sont sous le formulaire : on y descend en douceur.
      if (defiler && window.matchMedia('(max-width: 1180px)').matches) {
        requestAnimationFrame(() => document.getElementById('resultats')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }, [rafraichirActivite]);

  useEffect(() => {
    api.referentiel().then(setRef).catch((e) => setErreur(e.message));
    lancer(DEPART, { defiler: false });
  }, [lancer]);

  const notifier = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 3500);
  };

  const produit = ref?.produits.find((p) => p.code === demande.produitCode);
  const offre = resultat?.offres[selection];

  return (
    <div className="app">
      <header className="entete">
        <div className="marque">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--logo-fond)" /><path d="M6 22l7-10 4 6 3-4 6 8z" fill="#eda100" /><circle cx="23" cy="10" r="2.5" fill="#fff" /></svg>
          <strong>Granulo</strong>
          <span className="sous-titre">Devis instantané de granulats livrés</span>
        </div>
        <div className="infra" aria-label="Infrastructure">
          {ref && (
            <>
              <span className="pastille" title="Stockage des données">{ref.infra.donnees === 'postgres' ? 'Postgres · Prisma' : 'Données en mémoire'}</span>
              <span className="pastille" title="Cache des devis">{ref.infra.cache === 'redis' ? 'Cache Redis' : 'Cache mémoire'}</span>
              <span className="pastille" title="Assistant">{ref.infra.ia ? 'IA Ministral 14B' : 'IA : règles'}</span>
            </>
          )}
          <span className="fictif">Données fictives</span>
          <a href="https://marcchesnel.com" target="_blank" rel="noreferrer">Marc Chesnel</a>
        </div>
      </header>

      <aside className="col gauche">
        <Assistant
          onAppliquer={(a) => {
            const d = { ...demande, produitCode: a.produitCode, tonnage: a.tonnage };
            setDemande(d);
            lancer(d);
          }}
        />
        <Formulaire ref_={ref} demande={demande} setDemande={setDemande} onCalculer={() => lancer(demande)} chargement={chargement} erreur={erreur} />
      </aside>

      <main className="col centre">
        <section className="panneau carte-panneau">
          <Carte chantier={demande} resultat={resultat} selection={selection} onSelection={setSelection} />
          <div className="legende-carte">
            <span><i className="pt pt-chantier" /> Chantier</span>
            <span><i className="pt pt-top" /> Offre retenue</span>
            <span><i className="pt pt-site" /> Autres sites {produit ? `(${produit.nom})` : ''}</span>
          </div>
        </section>
        <Kpis resultat={resultat} offre={offre} tonnage={demande.tonnage} chargement={chargement} />
        <Decomposition resultat={resultat} selection={selection} onSelection={setSelection} />
      </main>

      <aside className="col droite" id="resultats">
        <Offres resultat={resultat} selection={selection} onSelection={setSelection} chargement={chargement} />
        <Planning
          resultat={resultat}
          offre={offre}
          onReserve={(m) => {
            notifier(m);
            rafraichirActivite();
          }}
        />
        <IndiceGazole indices={ref?.indices} partCarburant={ref?.partCarburant} />
        <Activite activite={activite} produits={ref?.produits} />
      </aside>

      <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}
