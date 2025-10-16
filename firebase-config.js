const firebaseConfig = {
  apiKey: "AIzaSyAcr56qpwswCKNSQV-otQYy2xD-ADbCGyc", 
  authDomain: "proorganizer230.firebaseapp.com",
  projectId: "proorganizer230",
  storageBucket: "proorganizer230.firebasestorage.app",
  messagingSenderId: "265916509815",
  appId: "1:265916509815:web:f9a9756fa4e42747a92072"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

const auth = firebase.auth();
const db = firebase.firestore();

console.log('✅ App lista y sin errores');
