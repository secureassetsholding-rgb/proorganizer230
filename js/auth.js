import { auth } from '/firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  const resetForm = document.getElementById('form-reset');

  if(loginForm){
    loginForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const email = loginForm.email.value.trim();
      const pass = loginForm.password.value;
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        window.location.href = '/index.html';
      } catch(err){
        console.error(err);
        alert('Error iniciando sesión: ' + err.message);
      }
    });
  }

  if(signupForm){
    signupForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const email = signupForm.email.value.trim();
      const pass = signupForm.password.value;
      const name = signupForm.name.value.trim();
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if(name) await updateProfile(cred.user, { displayName: name });
        window.location.href = '/index.html';
      } catch(err){
        console.error(err);
        alert('Error creando cuenta: ' + err.message);
      }
    });
  }

  if(resetForm){
    resetForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const email = resetForm.email.value.trim();
      try {
        await sendPasswordResetEmail(auth, email);
        alert('Email de recuperación enviado');
      } catch(err){
        console.error(err);
        alert('Error enviando email: ' + err.message);
      }
    });
  }
});