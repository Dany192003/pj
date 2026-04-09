// js/autenticacion.js - Autenticación simplificada (sin auto-verificación)

// Iniciar sesión con Firebase Auth
async function login(email, password) {
    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        // Guardar solo en sessionStorage, no depender de onAuthStateChanged
        sessionStorage.setItem('admin_auth', 'true');
        sessionStorage.setItem('admin_email', email);
        sessionStorage.setItem('admin_last_activity', Date.now().toString());
        return { success: true, message: 'Login exitoso' };
    } catch (error) {
        console.error('Error de autenticación:', error.message);
        let mensaje = 'Credenciales incorrectas';
        if (error.code === 'auth/user-not-found') {
            mensaje = 'Usuario no encontrado';
        } else if (error.code === 'auth/wrong-password') {
            mensaje = 'Contraseña incorrecta';
        } else if (error.code === 'auth/invalid-email') {
            mensaje = 'Email inválido';
        } else if (error.code === 'auth/too-many-requests') {
            mensaje = 'Demasiados intentos. Intenta más tarde';
        }
        return { success: false, message: mensaje };
    }
}

// Cerrar sesión
async function logout() {
    try {
        await firebase.auth().signOut();
    } catch (error) {
        console.error('Error al cerrar sesión en Firebase:', error);
    }
    // Siempre limpiar sessionStorage
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_email');
    sessionStorage.removeItem('admin_last_activity');
    window.location.href = 'index.html';
}

// Verificar si está autenticado (solo por sessionStorage)
function isAuthenticated() {
    return sessionStorage.getItem('admin_auth') === 'true';
}

// Requerir autenticación (para páginas protegidas)
function requireAuth() {
    if (!isAuthenticated()) {
        console.log('🔒 No autenticado, redirigiendo a login');
        window.location.href = 'index.html';
        return false;
    }
    // Actualizar última actividad
    sessionStorage.setItem('admin_last_activity', Date.now().toString());
    return true;
}

// Redirigir si ya está autenticado (solo para index.html)
function redirectIfAuthenticated() {
    // Solo redirigir si estamos en index.html
    const isIndexPage = window.location.pathname.includes('index.html') || 
                        window.location.pathname === '/' || 
                        window.location.pathname === '';
    
    if (!isIndexPage) {
        return false;
    }
    
    if (isAuthenticated()) {
        console.log('✅ Usuario autenticado, redirigiendo a panel');
        window.location.href = 'panel-admin.html';
        return true;
    }
    return false;
}

// NO usar onAuthStateChanged para evitar bucles
// Solo lo usamos para mantener la sesión de Firebase activa
firebase.auth().onAuthStateChanged((user) => {
    // Solo registrar en consola, no hacer redirecciones
    if (user) {
        console.log('✅ Firebase: Usuario autenticado:', user.email);
    } else {
        console.log('🔒 Firebase: No hay usuario autenticado');
    }
});

// Exportar funciones
window.login = login;
window.logout = logout;
window.isAuthenticated = isAuthenticated;
window.requireAuth = requireAuth;
window.redirectIfAuthenticated = redirectIfAuthenticated;