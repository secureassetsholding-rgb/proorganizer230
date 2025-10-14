// ========================================
// CONFIGURACIÓN CENTRAL DE FIREBASE
// OrganizerPro - Proyecto: proorganizer230
// ========================================

// Configuración de Firebase (Nueva - proorganizer230)
const firebaseConfig = {
  apiKey: "AIzaSyAcr56qpwswCKNSQV-otQYy2xD-ADbCGyc",
  authDomain: "proorganizer230.firebaseapp.com",
  projectId: "proorganizer230",
  storageBucket: "proorganizer230.appspot.com", // ✅ CORREGIDO: fue .firebasestorage.app
  messagingSenderId: "265916509815",
  appId: "1:265916509815:web:f9a9756fa4e42747a92072"
};

// Inicializar Firebase (modo compat para compatibilidad)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

// Referencias globales
const auth = firebase.auth();
const db = firebase.firestore();

// ========== SISTEMA DE ROLES ==========
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    USER: 'user',
    VIEWER: 'viewer'
};

const ROLE_NAMES = {
    'super_admin': 'Super Administrador',
    'admin': 'Administrador',
    'user': 'Usuario',
    'viewer': 'Visor (Solo Lectura)'
};

const ROLE_PERMISSIONS = {
    'super_admin': {
        canRead: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canManageUsers: true,
        canManageSettings: true,
        canViewLogs: true,
        canUseAI: true
    },
    'admin': {
        canRead: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canManageUsers: true,
        canManageSettings: false,
        canViewLogs: true,
        canUseAI: true
    },
    'user': {
        canRead: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canManageUsers: false,
        canManageSettings: false,
        canViewLogs: false,
        canUseAI: true
    },
    'viewer': {
        canRead: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
        canManageSettings: false,
        canViewLogs: false,
        canUseAI: false
    }
};

// ========== FUNCIONES GLOBALES DE UTILIDAD ==========

// Obtener usuario actual completo
async function getCurrentUser() {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) return null;
        
        return {
            uid: user.uid,
            email: user.email,
            ...userDoc.data()
        };
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        return null;
    }
}

// Obtener rol del usuario actual
async function getCurrentUserRole() {
    const user = await getCurrentUser();
    return user ? user.role : null;
}

// Verificar permisos específicos
async function hasPermission(permission) {
    const role = await getCurrentUserRole();
    if (!role) return false;
    
    return ROLE_PERMISSIONS[role][permission] || false;
}

// Verificar si es administrador
async function isAdmin() {
    const role = await getCurrentUserRole();
    return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

// Registrar actividad en logs
async function logActivity(action, details = {}) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userName = userDoc.exists ? userDoc.data().name : user.email;
        
        await db.collection('logs').add({
            userId: user.uid,
            userName: userName,
            userEmail: user.email,
            action: action,
            details: details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            date: new Date().toISOString()
        });
        
        console.log('📝 Log registrado:', action);
    } catch (error) {
        console.error('Error al registrar log:', error);
    }
}

// Proteger página (verificar autenticación y rol)
async function protectPage(requiredRole = null) {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                console.log('❌ No autenticado, redirigiendo a login...');
                window.location.href = 'login.html';
                reject('No autenticado');
                return;
            }
            
            // Verificar rol si es requerido
            if (requiredRole) {
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    
                    if (!userDoc.exists) {
                        console.log('❌ Usuario no encontrado en base de datos');
                        window.location.href = 'login.html';
                        reject('Usuario no encontrado');
                        return;
                    }
                    
                    const userRole = userDoc.data().role;
                    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
                    
                    if (!allowedRoles.includes(userRole)) {
                        console.log('❌ Sin permisos para esta página');
                        mostrarNotificacion('No tienes permisos para acceder a esta página', 'error');
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 2000);
                        reject('Sin permisos');
                        return;
                    }
                    
                    console.log('✅ Acceso concedido - Rol:', userRole);
                } catch (error) {
                    console.error('Error al verificar permisos:', error);
                    window.location.href = 'login.html';
                    reject('Error de permisos');
                    return;
                }
            }
            
            resolve(user);
        });
    });
}

// Formatear fecha para mostrar
function formatearFecha(timestamp) {
    if (!timestamp) return 'Sin fecha';
    
    let fecha;
    if (timestamp.toDate) {
        fecha = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        fecha = timestamp;
    } else {
        fecha = new Date(timestamp);
    }
    
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Formatear fecha corta
function formatearFechaCorta(timestamp) {
    if (!timestamp) return '';
    
    let fecha;
    if (timestamp.toDate) {
        fecha = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        fecha = timestamp;
    } else {
        fecha = new Date(timestamp);
    }
    
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Mostrar notificación en pantalla
function mostrarNotificacion(mensaje, tipo = 'info') {
    const colores = {
        'success': 'linear-gradient(135deg, #10b981, #059669)',
        'error': 'linear-gradient(135deg, #ef4444, #dc2626)',
        'warning': 'linear-gradient(135deg, #f59e0b, #d97706)',
        'info': 'linear-gradient(135deg, #667eea, #764ba2)'
    };
    
    const iconos = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colores[tipo]};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    notif.innerHTML = `<span style="font-size: 20px;">${iconos[tipo]}</span> ${mensaje}`;
    
    // Agregar animación CSS si no existe
    if (!document.querySelector('style[data-notifications]')) {
        const style = document.createElement('style');
        style.setAttribute('data-notifications', 'true');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
        logActivity('Cierre de sesión');
        auth.signOut().then(() => {
            localStorage.clear();
            mostrarNotificacion('Sesión cerrada correctamente', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }).catch((error) => {
            console.error('Error al cerrar sesión:', error);
            mostrarNotificacion('Error al cerrar sesión', 'error');
        });
    }
}

// Inicializar configuración de la empresa (si no existe)
async function initializeCompanyConfig() {
    try {
        const configDoc = await db.collection('config').doc('company').get();
        
        if (!configDoc.exists) {
            await db.collection('config').doc('company').set({
                companyName: 'OrganizerPro',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                version: '2.0.0'
            });
            console.log('✅ Configuración de empresa inicializada');
        }
    } catch (error) {
        console.error('Error al inicializar configuración:', error);
    }
}

// Actualizar última actividad del usuario
async function updateLastActivity() {
    const user = auth.currentUser;
    if (user) {
        try {
            await db.collection('users').doc(user.uid).update({
                lastActivity: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error al actualizar actividad:', error);
        }
    }
}

// Actualizar actividad cada 5 minutos
setInterval(updateLastActivity, 300000);

// Iniciar inicialización
initializeCompanyConfig();

console.log('🔥 Firebase configurado correctamente - Proyecto: proorganizer230');
console.log('📊 Sistema: OrganizerPro v2.0');
console.log('👥 Sistema multi-usuario cargado');