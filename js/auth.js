// js/auth.js - Autenticación del sistema

// Credenciales del administrador (cambia la contraseña aquí)
const ADMIN_CREDENTIALS = {
    password: "pastoral2026"
};

// Verificar si está autenticado
function isAuthenticated() {
    return sessionStorage.getItem("admin_auth") === "true";
}

// Iniciar sesión
function login(password) {
    if (password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem("admin_auth", "true");
        return true;
    }
    return false;
}

// Cerrar sesión
function logout() {
    sessionStorage.removeItem("admin_auth");
    window.location.href = "index.html";
}

// Redirigir si no está autenticado (para admin.html)
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = "index.html";
        return false;
    }
    return true;
}

// Redirigir al panel admin si ya está autenticado (para index.html)
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = "admin.html";
        return true;
    }
    return false;
}