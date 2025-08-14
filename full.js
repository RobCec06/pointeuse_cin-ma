  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
  const firebaseConfig = {
    apiKey: "AIzaSyBN6-Zbl4LSeCj0O4HOJIcRKq7ZAv41o6E",
    authDomain: "pointeuse-cinema-beaulieu.firebaseapp.com",
    projectId: "pointeuse-cinema-beaulieu",
    storageBucket: "pointeuse-cinema-beaulieu.appspot.com",
    messagingSenderId: "1042682924564",
    appId: "1:1042682924564:web:9e989e2331373e35e22101",
    measurementId: "G-7EPLLYK4KQ"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const userStates = {};

  window.pointer = async function(nom, type) {
    const now = new Date();
    const entry = {
      nom,
      type,
      time: now.toLocaleTimeString('fr-FR'),
      date: now.toLocaleDateString('fr-FR'),
      timestamp: now.getTime()
    };

    try {
      await addDoc(collection(db, "pointages"), entry);
      userStates[nom] = type;
      toggleButtons(nom, type);
      window.displayLog();
    } catch (e) {
      console.error("Erreur Firebase:", e);
    }
  }

  function toggleButtons(nom, type) {
    const arriveeBtn = document.getElementById(`arrivee-${nom}`);
    const departBtn = document.getElementById(`depart-${nom}`);

    if (arriveeBtn && departBtn) {
      if (type === 'arrivée') {
        arriveeBtn.disabled = true;
        departBtn.disabled = false;
      } else {
        arriveeBtn.disabled = false;
        departBtn.disabled = true;
      }
    }
  }

 window.displayLog = function () {
  const logContainer = document.getElementById("log");
  logContainer.innerHTML = "Chargement...";

  const q = query(collection(db, "pointages"), orderBy("timestamp", "asc"));

  onSnapshot(q, (querySnapshot) => {
    logContainer.innerHTML = "";
    const entries = [];
    querySnapshot.forEach(doc => entries.push(doc.data()));

    const grouped = {};
    entries.forEach(entry => {
      const key = `${entry.nom}-${entry.date}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });

    const orderedKeys = Object.keys(grouped).sort((a, b) => {
      const ta = grouped[a][0].timestamp;
      const tb = grouped[b][0].timestamp;
      return tb - ta;
    });

    orderedKeys.forEach(key => {
      const logs = grouped[key];
      for (let i = 0; i < logs.length; i++) {
        const entry = logs[i];
        const next = logs[i + 1];

        const div = document.createElement("div");
        div.className = "entry";

        if (entry.type === 'arrivée' && (!next || next.type !== 'départ')) {
          div.classList.add("arrival");
          div.textContent = `${entry.date} - ${entry.nom} est arrivé à ${entry.time}`;
          logContainer.appendChild(div);
        } else if (entry.type === 'arrivée' && next && next.type === 'départ') {
          const start = new Date(entry.timestamp);
          const end = new Date(next.timestamp);
          const diffMs = end - start;
          const diffH = Math.floor(diffMs / (1000 * 60 * 60));
          const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

          div.textContent = `${entry.date} - ${entry.time} → ${next.time} | ${entry.nom} | ${diffH}h ${diffM}`;
          logContainer.appendChild(div);
          i++; // skip next
        }
      }
    });
  }, (error) => {
    console.error("Erreur temps réel:", error);
    logContainer.innerHTML = "Erreur lors du chargement en direct.";
  });
}

  window.resetLog = function() {
    if (confirm("Voulez-vous vraiment effacer l'historique affiché sur le site ?")) {
      const logContainer = document.getElementById("log");
      logContainer.innerHTML = "";
    }
  }

 window.exportToPDF = function () {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(13); // 👈 réduction de la taille du texte PDF
    const entries = document.querySelectorAll('.entry');
    let y = 10;
    entries.forEach(entry => {
      doc.text(entry.textContent, 10, y);
      y += 6; // réduit aussi l'espacement pour s'adapter à la taille
    });
    doc.save("pointages.pdf");
  };
  document.body.appendChild(script);
};

  window.exportToExcel = function () {
    let csvContent = "data:text/csv;charset=utf-8,Date,Heure début,Heure fin,Nom,Durée\n";
    const entries = document.querySelectorAll('.entry');
    entries.forEach(entry => {
      const text = entry.textContent;
const match = text.match(/(\d{2}\/\d{2}\/\d{4}) - (\d{2}:\d{2}:\d{2}) → (\d{2}:\d{2}:\d{2}) \| (.+?) \| (\d+)h (\d+)/);
      if (match) {
        const [, date, start, end, name, h, m] = match;
        csvContent += `${date},${start},${end},${name},${h}h ${m}min\n`;
      }
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pointages.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  window.login = function() {
    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    const users = { "admin": "cinema123" };

    if (users[username] === password) {
      document.getElementById("loginPage").style.display = "none";
      document.getElementById("mainContent").style.display = "block";
      window.displayLog();
    } else {
      document.getElementById("loginError").textContent = "Identifiants incorrects.";
    }
  }

  window.onload = function () {
    document.getElementById("loginPage").style.display = "block";
    document.getElementById("mainContent").style.display = "none";
  }