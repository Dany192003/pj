// js/usuarios.js - Gestión de usuarios con correo real

let listaUsuarios = [];
let permisosSeleccionados = [];
let usuarioEditandoId = null;
let usuarioEditandoUsername = null;

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
    const permisosMap = { 'tab1': '📄', 'tab2': '📊', 'tab3': '📅', 'tab4': '🔑', 'tab5': '📚', 'tab6': '📜', 'tab7': '👥', 'tab8': '👨‍💼' };
    
    tbody.innerHTML = listaUsuarios.map(usuario => {
        const permisosLista = usuario.permisos || [];
        const permisosBadges = permisosLista.map(p => `<span class="permiso-badge">${permisosMap[p] || p}</span>`).join('');
        
        const esAdmin = usuario.username === 'dany';
        
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
    
    document.querySelectorAll('.btn-editar-usuario').forEach(btn => {
        btn.onclick = () => {
            const permisos = JSON.parse(btn.dataset.permisos || '[]');
            abrirModalEditarUsuario(btn.dataset.id, btn.dataset.username, btn.dataset.email, btn.dataset.nombre, permisos);
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

// ========== MODAL EDITAR USUARIO (CON ESTILOS) ==========

function abrirModalEditarUsuario(id, username, email, nombreActual, permisosActuales) {
    usuarioEditandoId = id;
    usuarioEditandoUsername = username;
    
    // Verificar que los elementos existan
    const nombreInput = document.getElementById('editUsuarioNombre');
    const emailInput = document.getElementById('editUsuarioEmail');
    
    if (nombreInput) nombreInput.value = nombreActual || '';
    if (emailInput) {
        emailInput.value = email || '';
        emailInput.readOnly = true;
    }
    
    const permisosContainer = document.getElementById('editUsuarioPermisos');
    if (!permisosContainer) return;
    
    const listaPermisos = [
        { id: 'tab1', nombre: '📄 Generar Recibos' },
        { id: 'tab2', nombre: '📊 Control de Cuotas' },
        { id: 'tab3', nombre: '📅 Actividades' },
        { id: 'tab4', nombre: '🔑 Contraseñas Grupos' },
        { id: 'tab5', nombre: '📚 Biblioteca' },
        { id: 'tab6', nombre: '📜 Historial Recibos' },
        { id: 'tab7', nombre: '👥 Usuarios' },
        { id: 'tab8', nombre: '📋 Grupos' }
    ];
    
    permisosContainer.innerHTML = listaPermisos.map(permiso => `
        <label class="permiso-checkbox-item">
            <input type="checkbox" value="${permiso.id}" ${permisosActuales.includes(permiso.id) ? 'checked' : ''}>
            <span>${permiso.nombre}</span>
        </label>
    `).join('');
    
    const modal = document.getElementById('modalEditarUsuario');
    if (modal) modal.style.display = 'flex';
}

function cerrarModalEditarUsuario() {
    const modal = document.getElementById('modalEditarUsuario');
    if (modal) modal.style.display = 'none';
}

async function guardarEdicionUsuario() {
    const nuevoNombre = document.getElementById('editUsuarioNombre')?.value.trim() || '';
    const permisosSeleccionadosEdit = [];
    
    document.querySelectorAll('#editUsuarioPermisos input[type="checkbox"]:checked').forEach(cb => {
        permisosSeleccionadosEdit.push(cb.value);
    });
    
    if (!nuevoNombre) {
        mostrarToastError('❌ El nombre es obligatorio');
        return;
    }
    
    const btnGuardar = document.querySelector('#modalEditarUsuario .btn-editar-usuario-guardar');
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<span class="spinner-small"></span> Guardando...';
    }
    
    try {
        await coleccionUsuarios.doc(usuarioEditandoId).update({
            nombre: nuevoNombre,
            permisos: permisosSeleccionadosEdit
        });
        
        await cargarUsuarios();
        mostrarToastExito('✓ Usuario actualizado correctamente');
        cerrarModalEditarUsuario();
    } catch (error) {
        console.error('Error:', error);
        mostrarToastError('❌ Error al actualizar el usuario');
    } finally {
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '💾 Guardar cambios';
        }
    }
}

function initModalEditarUsuario() {
    const modal = document.getElementById('modalEditarUsuario');
    if (!modal) return;
    
    const closeBtn = document.querySelector('#modalEditarUsuario .modal-editar-usuario-close');
    const cancelBtn = document.querySelector('#modalEditarUsuario .btn-editar-usuario-cancelar');
    const guardarBtn = document.querySelector('#modalEditarUsuario .btn-editar-usuario-guardar');
    
    if (closeBtn) closeBtn.onclick = cerrarModalEditarUsuario;
    if (cancelBtn) cancelBtn.onclick = cerrarModalEditarUsuario;
    if (guardarBtn) guardarBtn.onclick = guardarEdicionUsuario;
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalEditarUsuario();
    });
}

// ========== ELIMINAR USUARIO ==========

async function eliminarUsuario(id) {
    try {
        await coleccionUsuarios.doc(id).delete();
        return true;
    } catch (error) { return false; }
}

// ========== RESTABLECER CONTRASEÑA ==========

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

// ========== PERMISOS Y ROLES ==========

function getPermisosUsuario() {
    const permisos = sessionStorage.getItem('admin_permisos');
    return permisos ? JSON.parse(permisos) : [];
}

function configurarPermisosPorRol(permisos) {
    const tabs = ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6', 'tab7', 'tab8'];
    for (const tabId of tabs) {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (tabBtn) tabBtn.style.display = permisos.includes(tabId) ? 'flex' : 'none';
    }
    if (permisos.length === 0) {
        mostrarToastError('⚠️ No tienes permisos asignados');
        setTimeout(() => logout(), 2000);
    }
}

// ========== MODAL DE PERMISOS ==========

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

// ========== INICIALIZACIÓN ==========

function initUsuarios() {
    // Inicializar modal de edición de usuario
    initModalEditarUsuario();
    
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

// ========== EXPORTAR ==========
window.initUsuarios = initUsuarios;
window.getPermisosUsuario = getPermisosUsuario;
window.configurarPermisosPorRol = configurarPermisosPorRol;