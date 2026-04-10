// js/autenticacion.js - Autenticación con mapeo automático

function obtenerEmailPorUsername(username) {
    if (username === 'admin') {
        return 'admin@pastoral.com';
    }
    return `${username}@pastoral.local`;
}

async function login(username, password) {
    console.log('🔐 Intentando login con usuario:', username);
    
    if (!username || !password) {
        return { success: false, message: 'Ingresa usuario y contraseña' };
    }
    
    const email = obtenerEmailPorUsername(username);
    console.log('📧 Email correspondiente:', email);
    
    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        let permisos = ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6', 'tab7'];
        let nombre = username;
        
        try {
            const doc = await coleccionUsuarios.doc(user.uid).get();
            if (doc.exists) {
                permisos = doc.data().permisos || permisos;
                nombre = doc.data().nombre || username;
                console.log('✅ Permisos cargados:', permisos);
                console.log('✅ Nombre del usuario:', nombre);
            }
        } catch (e) {
            console.log('Error al cargar datos del usuario:', e);
        }
        
        sessionStorage.setItem('admin_auth', 'true');
        sessionStorage.setItem('admin_username', username);
        sessionStorage.setItem('admin_nombre', nombre);
        sessionStorage.setItem('admin_permisos', JSON.stringify(permisos));
        sessionStorage.setItem('admin_last_activity', Date.now().toString());
        
        return { success: true, message: 'Login exitoso', permisos: permisos, nombre: nombre };
        
    } catch (error) {
        console.error('Error:', error);
        let mensaje = 'Credenciales incorrectas';
        if (error.code === 'auth/user-not-found') mensaje = 'Usuario no encontrado';
        else if (error.code === 'auth/wrong-password') mensaje = 'Contraseña incorrecta';
        return { success: false, message: mensaje };
    }
}

async function logout() {
    try { await firebase.auth().signOut(); } catch(e) {}
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_username');
    sessionStorage.removeItem('admin_nombre');
    sessionStorage.removeItem('admin_permisos');
    sessionStorage.removeItem('admin_last_activity');
    window.location.href = 'index.html';
}

function isAuthenticated() {
    return sessionStorage.getItem('admin_auth') === 'true';
}

function requireAuth() {
    const isIndexPage = window.location.pathname.includes('index.html') || 
                        window.location.pathname === '/' || 
                        window.location.pathname === '';
    if (isIndexPage) return true;
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    sessionStorage.setItem('admin_last_activity', Date.now().toString());
    return true;
}

function redirectIfAuthenticated() {
    const isIndexPage = window.location.pathname.includes('index.html') || 
                        window.location.pathname === '/' || 
                        window.location.pathname === '';
    if (!isIndexPage) return false;
    if (isAuthenticated()) {
        window.location.href = 'panel-admin.html';
        return true;
    }
    return false;
}

window.login = login;
window.logout = logout;
window.isAuthenticated = isAuthenticated;
window.requireAuth = requireAuth;
window.redirectIfAuthenticated = redirectIfAuthenticated;
window.obtenerEmailPorUsername = obtenerEmailPorUsername;