// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcr56qpwswCKNSQV-otQYy2xD-ADbCGyc",
  authDomain: "proorganizer230.firebaseapp.com",
  projectId: "proorganizer230",
  storageBucket: "proorganizer230.firebasestorage.app",
  messagingSenderId: "265916509815",
  appId: "1:265916509815:web:f9a9756fa4e42747a92072"
};
// Inicializa Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

const auth = firebase.auth();
const db = firebase.firestore();
