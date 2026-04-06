// js/autenticacion.js - Autenticación de administrador

const ADMIN_CREDENTIALS = { password: '321' };

function isAuthenticated() {
    return sessionStorage.getItem('admin_auth') === 'true';
}

function login(password) {
    if (password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('admin_auth', 'true');
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem('admin_auth');
    window.location.href = 'index.html';
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'panel-admin.html';
        return true;
    }
    return false;
}
