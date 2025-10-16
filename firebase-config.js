// firebase-config.js (Firebase v9 modular, listo para Netlify/Vercel/navegador)
// Usa siempre imports desde el CDN de Firebase

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// Tu configuración de Firebase (pon tu API KEY real)
const firebaseConfig = {
  apiKey: "zaSyAcr56qpwswCKNSQV-otQYy2xD-ADbCGyc",
  authDomain: "proorganizer230.firebaseapp.com",
  projectId: "proorganizer230",
  storageBucket: "proorganizer230.firebasestorage.app",
  messagingSenderId: "265916509815",
  appId: "1:265916509815:web:f9a9756fa4e42747a92072"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exporta para otros módulos
export { app as firebaseApp, auth, db };

// También expón en window para debugging
window.firebaseApp = app;
window.auth = auth;
window.db = db;

console.log('✅ Firebase (v9) inicializado — proorganizer230');
