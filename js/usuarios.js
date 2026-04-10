// js/usuarios.js - Gestión de usuarios con correo real

let listaUsuarios = [];
let permisosSeleccionados = [];

async function cargarUsuarios() {
    const tbody = document.getElementById('tablaUsuariosBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">📜 Cargando usuarios...<\/td><\/tr>';
    try {
        const snapshot = await coleccionUsuarios.get();
        listaUsuarios = [];
        snapshot.forEach(doc => listaUsuarios.push({ id: doc.id, ...doc.data() }));
        renderizarTablaUsuarios();
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">❌ Error al cargar usuarios<\/td><\/tr>';
    }
}
function renderizarTablaUsuarios() {
    const tbody = document.getElementById('tablaUsuariosBody');
    if (!tbody) return;
    if (listaUsuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">📭 No hay usuarios registrados<\/td><\/tr>';
        return;
    }
    const permisosMap = { 'tab1': '📄', 'tab2': '📊', 'tab3': '📅', 'tab4': '🔑', 'tab5': '📚', 'tab6': '📜', 'tab7': '👥' };
    
    tbody.innerHTML = listaUsuarios.map(usuario => {
        const permisosLista = usuario.permisos || [];
        const permisosBadges = permisosLista.map(p => `<span class="permiso-badge">${permisosMap[p] || p}</span>`).join('');
        
        // Verificar si es el administrador (username 'dany')
        const esAdmin = usuario.username === 'dany';
        
        // Botones: solo mostrar si NO es administrador
        const botones = esAdmin ? 
            '<span style="color:#94a3b8; font-size:12px;">🔒 Bloqueado</span>' :
            `
                <button class="btn-editar-usuario" data-id="${usuario.id}" data-username="${usuario.username}" data-nombre="${usuario.nombre || ''}" data-email="${usuario.email || ''}" data-permisos='${JSON.stringify(usuario.permisos || [])}'>✏️ Editar</button>
                <button class="btn-eliminar-usuario" data-id="${usuario.id}" data-username="${usuario.username}">🗑️ Eliminar</button>
            `;
        
        return `
            <tr>
                <td><strong>${usuario.username || '-'}<\/strong><\/td>
                <td>${usuario.email || '-'}<\/td>
                <td>${usuario.nombre || '-'}<\/td>
                <td><div class="permisos-badges">${permisosBadges || '⚠️ Sin permisos'}<\/div><\/td>
                <td>${usuario.fecha_creacion ? new Date(usuario.fecha_creacion).toLocaleDateString() : '-'}<\/td>
                <td>${botones}<\/td>
            <\/tr>
        `;
    }).join('');
    
    // Eventos solo para usuarios no administradores
    document.querySelectorAll('.btn-editar-usuario').forEach(btn => {
        btn.onclick = () => {
            const permisos = JSON.parse(btn.dataset.permisos || '[]');
            editarUsuario(btn.dataset.id, btn.dataset.username, btn.dataset.email, btn.dataset.nombre, permisos);
        };
    });
    
    document.querySelectorAll('.btn-eliminar-usuario').forEach(btn => {
        btn.onclick = async () => {
            if (confirm(`¿Eliminar usuario ${btn.dataset.username}?`)) {
                await eliminarUsuario(btn.dataset.id);
                await cargarUsuarios();
                mostrarToastExito('✓ Usuario eliminado');
            }
        };
    });
}
async function registrarUsuario(username, email, password, nombre, permisos) {
    try {
        if (!username) return { success: false, message: 'Ingresa un nombre de usuario' };
        if (!email) return { success: false, message: 'Ingresa un correo electrónico' };
        if (!password) return { success: false, message: 'Ingresa una contraseña' };
        if (password.length < 6) return { success: false, message: 'La contraseña debe tener al menos 6 caracteres' };
        if (permisos.length === 0) return { success: false, message: 'Selecciona al menos un permiso' };
        
        const existingUser = listaUsuarios.find(u => u.username === username);
        if (existingUser) return { success: false, message: 'El nombre de usuario ya existe' };
        
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        
        await coleccionUsuarios.doc(uid).set({
            username: username,
            email: email,
            nombre: nombre,
            permisos: permisos,
            uid: uid,
            fecha_creacion: new Date().toISOString()
        });
        return { success: true, message: 'Usuario creado exitosamente' };
    } catch (error) {
        let mensaje = 'Error al crear usuario';
        if (error.code === 'auth/email-already-in-use') mensaje = 'El correo ya está registrado';
        else if (error.code === 'auth/weak-password') mensaje = 'La contraseña es muy débil (mínimo 6 caracteres)';
        return { success: false, message: mensaje };
    }
}

async function editarUsuario(id, usernameActual, emailActual, nombreActual, permisosActuales) {
    const nuevoNombre = prompt('Editar nombre:', nombreActual || '');
    permisosSeleccionados = [...permisosActuales];
    abrirModalPermisos();
    
    const btnGuardar = document.getElementById('btnGuardarPermisos');
    const guardarHandler = async () => {
        const updates = {};
        if (nuevoNombre !== null && nuevoNombre.trim() !== '') updates.nombre = nuevoNombre.trim();
        updates.permisos = permisosSeleccionados;
        if (Object.keys(updates).length > 0) {
            await coleccionUsuarios.doc(id).update(updates);
            await cargarUsuarios();
            mostrarToastExito('✓ Usuario actualizado');
        }
        cerrarModalPermisos();
        btnGuardar.removeEventListener('click', guardarHandler);
    };
    btnGuardar.addEventListener('click', guardarHandler);
    abrirModalPermisos();
}

async function eliminarUsuario(id) {
    try {
        await coleccionUsuarios.doc(id).delete();
        return true;
    } catch (error) { return false; }
}

// Restablecer contraseña de un usuario (envía email)
async function restablecerPasswordUsuario(email, username) {
    if (!email) {
        mostrarToastError('❌ Este usuario no tiene correo registrado');
        return;
    }
    
    const confirmado = confirm(`¿Enviar enlace de restablecimiento a ${username} (${email})?`);
    if (!confirmado) return;
    
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        mostrarToastExito(`✓ Se ha enviado un enlace a ${email}`);
    } catch (error) {
        console.error('Error:', error);
        mostrarToastError('❌ Error al enviar el enlace');
    }
}

function getPermisosUsuario() {
    const permisos = sessionStorage.getItem('admin_permisos');
    return permisos ? JSON.parse(permisos) : [];
}

function configurarPermisosPorRol(permisos) {
    const tabs = ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6', 'tab7'];
    for (const tabId of tabs) {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (tabBtn) tabBtn.style.display = permisos.includes(tabId) ? 'flex' : 'none';
    }
    if (permisos.length === 0) {
        mostrarToastError('⚠️ No tienes permisos asignados');
        setTimeout(() => logout(), 2000);
    }
}

function abrirModalPermisos() {
    const modal = document.getElementById('modalPermisos');
    if (modal) {
        document.querySelectorAll('.permiso-checkbox').forEach(cb => cb.checked = permisosSeleccionados.includes(cb.value));
        modal.style.display = 'flex';
    }
}

function cerrarModalPermisos() {
    const modal = document.getElementById('modalPermisos');
    if (modal) modal.style.display = 'none';
}

function initUsuarios() {
    const btnRegistrar = document.getElementById('btnRegistrarUsuario');
    const btnAbrirPermisos = document.getElementById('btnAbrirPermisos');
    const btnGuardarPermisos = document.getElementById('btnGuardarPermisos');
    const closePermisos = document.querySelector('.close-permisos');
    const modalPermisos = document.getElementById('modalPermisos');
    
    if (btnAbrirPermisos) {
        btnAbrirPermisos.onclick = () => {
            permisosSeleccionados = [];
            document.querySelectorAll('.permiso-checkbox').forEach(cb => cb.checked = false);
            abrirModalPermisos();
        };
    }
    if (btnGuardarPermisos) {
        btnGuardarPermisos.onclick = () => {
            permisosSeleccionados = [];
            document.querySelectorAll('.permiso-checkbox:checked').forEach(cb => permisosSeleccionados.push(cb.value));
            cerrarModalPermisos();
            mostrarToastExito(`✓ ${permisosSeleccionados.length} permisos seleccionados`);
        };
    }
    if (closePermisos) closePermisos.onclick = cerrarModalPermisos;
    if (modalPermisos) window.addEventListener('click', (e) => { if (e.target === modalPermisos) cerrarModalPermisos(); });
    
    if (btnRegistrar) {
        btnRegistrar.onclick = async () => {
            const username = document.getElementById('nuevoUsuarioUsername').value.trim();
            const email = document.getElementById('nuevoUsuarioEmail').value.trim();
            const password = document.getElementById('nuevoUsuarioPassword').value;
            const nombre = document.getElementById('nuevoUsuarioNombre').value.trim();
            
            if (!username) { mostrarToastError('❌ Ingresa un nombre de usuario'); return; }
            if (!email) { mostrarToastError('❌ Ingresa un correo electrónico'); return; }
            if (!password) { mostrarToastError('❌ Ingresa una contraseña'); return; }
            if (password.length < 6) { mostrarToastError('❌ La contraseña debe tener al menos 6 caracteres'); return; }
            if (permisosSeleccionados.length === 0) { mostrarToastError('❌ Selecciona al menos un permiso'); return; }
            
            btnRegistrar.disabled = true;
            btnRegistrar.innerHTML = '<span class="spinner"></span> Registrando...';
            const result = await registrarUsuario(username, email, password, nombre, permisosSeleccionados);
            if (result.success) {
                document.getElementById('nuevoUsuarioUsername').value = '';
                document.getElementById('nuevoUsuarioEmail').value = '';
                document.getElementById('nuevoUsuarioPassword').value = '';
                document.getElementById('nuevoUsuarioNombre').value = '';
                permisosSeleccionados = [];
                document.querySelectorAll('.permiso-checkbox').forEach(cb => cb.checked = false);
                await cargarUsuarios();
                mostrarToastExito('✓ Usuario registrado exitosamente');
            } else { mostrarToastError(result.message); }
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '➕ Registrar Usuario';
        };
    }
    cargarUsuarios();
}

window.initUsuarios = initUsuarios;
window.getPermisosUsuario = getPermisosUsuario;
window.configurarPermisosPorRol = configurarPermisosPorRol;