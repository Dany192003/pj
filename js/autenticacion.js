// js/autenticacion.js - Autenticación con mapeo automático

function obtenerEmailPorUsername(username) {
    if (username === 'admin') {
        return 'admin@pastoral.com';
    }
    return `${username}@pastoral.local`;
}
// js/autenticacion.js - Autenticación con username

async function login(username, password) {
    console.log('🔐 Intentando login con usuario:', username);
    
    if (!username || !password) {
        return { success: false, message: 'Ingresa usuario y contraseña' };
    }
    
    try {
        // Buscar el usuario por username en Firestore
        const snapshot = await coleccionUsuarios.where('username', '==', username).get();
        
        if (snapshot.empty) {
            return { success: false, message: 'Usuario no encontrado' };
        }
        
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const email = userData.email;
        
        if (!email) {
            return { success: false, message: 'Usuario sin correo asociado' };
        }
        
        // Autenticar con Firebase usando el correo real
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        
        sessionStorage.setItem('admin_auth', 'true');
        sessionStorage.setItem('admin_username', username);
        sessionStorage.setItem('admin_nombre', userData.nombre || username);
        sessionStorage.setItem('admin_permisos', JSON.stringify(userData.permisos || []));
        sessionStorage.setItem('admin_last_activity', Date.now().toString());
        
        return { success: true, message: 'Login exitoso', permisos: userData.permisos || [] };
        
    } catch (error) {
        console.error('Error:', error);
        let mensaje = 'Credenciales incorrectas';
        if (error.code === 'auth/wrong-password') mensaje = 'Contraseña incorrecta';
        else if (error.code === 'auth/user-not-found') mensaje = 'Usuario no encontrado';
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