import { auth } from '/firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import '/js/theme.js';

function setupAuthListener(){
  const userNameEl = document.getElementById('user-name');
  onAuthStateChanged(auth, user => {
    if(user){
      if(userNameEl) userNameEl.textContent = user.displayName || user.email || 'Usuario';
      window.currentUser = user;
    } else {
      window.currentUser = null;
      const requiresAuth = document.body.dataset.requiresAuth === "true";
      if(requiresAuth) window.location.href = '/login.html';
      if(userNameEl) userNameEl.textContent = '';
    }
  });
}

function setupLogout(){
  document.addEventListener('click', async (e) => {
    if(e.target && e.target.id === 'btn-logout'){
      try {
        await signOut(auth);
        window.location.href = '/login.html';
      } catch(err){
        console.error('Logout error', err);
        alert('Error al cerrar sesión');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupAuthListener();
  setupLogout();
});