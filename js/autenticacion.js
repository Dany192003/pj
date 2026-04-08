// js/autenticacion.js - Autenticación de administrador

const ADMIN_CREDENTIALS = { password: 'admin123' };
let sesionTimeout = null;

function isAuthenticated() {
    return sessionStorage.getItem('admin_auth') === 'true';
}

function login(password) {
    if (password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('admin_auth', 'true');
        sessionStorage.setItem('admin_last_activity', Date.now().toString());
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_last_activity');
    window.location.href = 'index.html';
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    
    // Actualizar última actividad
    sessionStorage.setItem('admin_last_activity', Date.now().toString());
    return true;
}

function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'panel-admin.html';
        return true;
    }
    return false;
}