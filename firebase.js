import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
  import { getFirestore, collection, addDoc, getDocs, query, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

window.VACANCES_SCOLAIRES = [];

  async function chargerVacances() {
      // API mise à jour pour forcer les dates récentes (2024/2025)
      const apiUrl = "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records?where=location%3D%22Cr%C3%A9teil%22&order_by=start_date%20DESC&limit=100";
      try {
          const reponse = await fetch(apiUrl);
          const data = await reponse.json();
          window.VACANCES_SCOLAIRES = data.results.map(vacance => {
              return {
                  nom: vacance.description,
                  debut: new Date(vacance.start_date).setHours(0,0,0,0),
                  fin: new Date(vacance.end_date).setHours(23,59,59,999)
              };
          });
          console.log("Vacances récentes chargées :", window.VACANCES_SCOLAIRES);
      } catch (erreur) {
          console.error("Erreur de chargement des vacances :", erreur);
      }
  }

window.estPendantVacances = function(dateCliqueeStr) {
    if (!window.VACANCES_SCOLAIRES || window.VACANCES_SCOLAIRES.length === 0) {
        console.warn("L'API n'a pas encore chargé les dates.");
        return false; 
    }
    const dateCible = new Date(dateCliqueeStr + 'T12:00:00').getTime();
    return window.VACANCES_SCOLAIRES.some(vac => {
        return dateCible >= vac.debut && dateCible <= vac.fin;
    });
}

  chargerVacances();

  const firebaseConfig = {
    apiKey: "AIzaSyCAfoMmouoN2cmCgHYJ07gIyyTLqv_ltto",
    authDomain: "neoball-e2f1f.firebaseapp.com",
    projectId: "neoball-e2f1f",
    storageBucket: "neoball-e2f1f.firebasestorage.app",
    messagingSenderId: "648867084826",
    appId: "1:648867084826:web:e86426f3cdd0fe086bafa3"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  window.db = db;
  window.collection = collection;
  window.addDoc = addDoc;
  window.updateDoc = updateDoc;
  window.doc = doc;
  
  window.BLOCKED_DATES_DB = [];
  window.COMMUNES_DB = []; 

  window.loadReservations = async function() {
      try {
          const q = query(collection(db, "reservations"));
          const querySnapshot = await getDocs(q);
          const blocked = [];
          window.ALL_RESAS_DB = [];
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              window.ALL_RESAS_DB.push(data);
              const ids = Array.isArray(data.date_id) ? data.date_id : (data.date_id ? [data.date_id] : []);
              ids.forEach(id => blocked.push({ id, profs: data.profs||'', statut: data.statut||'', commune: data.contact_commune||'' }));
          });
          window.BLOCKED_SLOTS_DB = [];
          window.BLOCKED_DATES_LEGACY = [];
          blocked.forEach(function(item) {
            const slotId = item.id;
            if (typeof slotId === 'string' && slotId.indexOf('_') > 7) {
              var parts = slotId.split('_');
              var startStr = parts[1] ? parts[1].replace('h',':') : '00:00';
              var endStr   = parts[2] ? parts[2].replace('h',':') : '23:59';
              window.BLOCKED_SLOTS_DB.push({ date: parts[0], start: startStr, end: endStr, profs: item.profs, statut: item.statut, commune: item.commune });
            } else if (typeof slotId === 'string') {
              window.BLOCKED_DATES_LEGACY.push(slotId);
            }
          });
          window.BLOCKED_DATES_DB = blocked.map(b => b.id);
          if (typeof buildCal === 'function') buildCal();
      } catch (error) { console.log("Erreur", error); }
  }

  window.loadCommunes = async function() {
      try {
          const q = query(collection(db, "communes"));
          const querySnapshot = await getDocs(q);
          const communes = [];
          querySnapshot.forEach((doc) => { communes.push(doc.data()); });
          window.COMMUNES_DB = communes;
          
          if(typeof refreshMapData === 'function') refreshMapData();
      } catch (error) { console.log("Erreur communes", error); }
  }

  window.loadReservations();
  window.loadCommunes();
