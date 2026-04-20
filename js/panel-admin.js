// js/panel-admin.js - Panel administrativo completo

// Función para actualizar el badge del usuario
function actualizarUserBadge() {
    const nombre = sessionStorage.getItem('admin_nombre') || 
                   sessionStorage.getItem('admin_username') || 
                   'Administrador';
    const userBadge = document.getElementById('userBadge');
    if (userBadge) {
        userBadge.textContent = nombre;
    }
}

// Función para ocultar botones de administrador (solo admin los ve)
function configurarBotonesAdmin(permisos) {
    const esAdmin = permisos.includes('tab7'); // tab7 es Usuarios (solo admin)
    const btnForzar = document.getElementById('btnForzarActualizacion');
    const btnReset = document.getElementById('btnReset');
    
    if (btnForzar) {
        btnForzar.style.display = esAdmin ? 'flex' : 'none';
    }
    if (btnReset) {
        btnReset.style.display = esAdmin ? 'flex' : 'none';
    }
}

// Función para aplicar tema según el usuario
function aplicarTemaPorUsuario() {
    const username = sessionStorage.getItem('admin_username');
    const body = document.body;
    
    if (username === 'dany') {
        body.classList.add('tema-administrador');
        console.log('🎨 Tema naranja para administrador activado');
    } else {
        body.classList.remove('tema-administrador');
    }
}

// Verificar autenticación primero
if (!requireAuth()) {
    throw new Error('No autorizado');
}

window.showToast = function(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#dc2626' : '#10b981';
    toast.className = 'toast show';
    setTimeout(() => { toast.className = 'toast'; }, 2000);
};

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatearFechaAdmin(fechaISO) {
    if (!fechaISO) return 'Fecha no disponible';
    return new Date(fechaISO).toLocaleDateString('es-GT', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function mostrarToastExito(mensaje) {
    const toast = document.createElement("div");
    toast.className = "toast-exito";
    toast.innerHTML = `<span class="toast-icon">✅</span><span>${mensaje}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function mostrarToastError(mensaje) {
    const toast = document.createElement("div");
    toast.className = "toast-error";
    toast.innerHTML = `<span class="toast-icon">❌</span><span>${mensaje}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function mostrarConfirmacion(opciones) {
    return new Promise((resolve) => {
        let modal = document.getElementById("modalConfirmacion");
        
        if (!modal) {
            const modalHTML = `
                <div id="modalConfirmacion" class="modal-confirmacion">
                    <div class="modal-confirmacion-content">
                        <div class="modal-confirmacion-header">
                            <div class="modal-confirmacion-icon" id="confirmacionIcono">⚠️</div>
                            <h3 id="confirmacionTitulo">Confirmar acción</h3>
                        </div>
                        <div class="modal-confirmacion-body" id="confirmacionBody">
                            <p id="confirmacionMensaje">¿Estás seguro de realizar esta acción?</p>
                        </div>
                        <div class="modal-confirmacion-footer">
                            <button class="btn-confirmar-cancelar" id="btnConfirmarNo"><span>✗</span> Cancelar</button>
                            <button class="btn-confirmar-aceptar" id="btnConfirmarSi"><span>✓</span> Confirmar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML("beforeend", modalHTML);
            modal = document.getElementById("modalConfirmacion");
        }
        
        const tituloElem = document.getElementById("confirmacionTitulo");
        const mensajeElem = document.getElementById("confirmacionMensaje");
        const iconoElem = document.getElementById("confirmacionIcono");
        const bodyElem = document.getElementById("confirmacionBody");
        const btnSi = document.getElementById("btnConfirmarSi");
        const btnNo = document.getElementById("btnConfirmarNo");
        
        tituloElem.textContent = opciones.titulo || "Confirmar acción";
        iconoElem.textContent = opciones.icono || "⚠️";
        
        const extras = bodyElem.querySelectorAll(".recurso-nombre, .comprobante-nombre, .advertencia-texto");
        extras.forEach(el => el.remove());
        
        let mensajeHTML = `<p>${opciones.mensaje}</p>`;
        if (opciones.nombre) {
            const claseNombre = opciones.tipo === "recurso" ? "recurso-nombre" : "comprobante-nombre";
            mensajeHTML += `<div class="${claseNombre}">"${escapeHtml(opciones.nombre)}"</div>`;
        }
        if (opciones.advertencia) {
            mensajeHTML += `<p style="color: #f97316; font-size: 13px; margin-top: 12px;">⚠️ ${opciones.advertencia}</p>`;
        }
        mensajeElem.innerHTML = mensajeHTML;
        
        const cerrar = (resultado) => {
            modal.style.display = "none";
            resolve(resultado);
        };
        
        btnSi.onclick = () => cerrar(true);
        btnNo.onclick = () => cerrar(false);
        modal.onclick = (e) => { if (e.target === modal) cerrar(false); };
        modal.style.display = "flex";
    });
}

// ========== EVENTOS ADMIN (con edición y hora) ==========
let eventoEditandoId = null;

function abrirModalEditarActividad(evento) {
    eventoEditandoId = evento.id;
    
    let modal = document.getElementById('modalEditarActividad');
    if (!modal) {
        const modalHTML = `
            <div id="modalEditarActividad" class="modal-editar-actividad">
                <div class="modal-editar-actividad-content">
                    <div class="modal-editar-actividad-header">
                        <h3>✏️ Editar Actividad</h3>
                        <button class="modal-editar-actividad-close">&times;</button>
                    </div>
                    <div class="modal-editar-actividad-body">
                        <div class="form-editar-actividad">
                            <div class="form-actividad-field">
                                <label>📆 Fecha</label>
                                <input type="date" id="editActividadFecha" class="form-actividad-input">
                            </div>
                            <div class="form-actividad-field">
                                <label>⏰ Hora</label>
                                <input type="time" id="editActividadHora" class="form-actividad-input" step="60">
                            </div>
                            <div class="form-actividad-field">
                                <label>📌 Título</label>
                                <input type="text" id="editActividadTitulo" class="form-actividad-input" placeholder="Título de la actividad">
                            </div>
                            <div class="form-actividad-field">
                                <label>📍 Lugar</label>
                                <input type="text" id="editActividadLugar" class="form-actividad-input" placeholder="Lugar">
                            </div>
                            <div class="form-actividad-field">
                                <label>🎨 Color</label>
                                <select id="editActividadColor" class="form-actividad-select"></select>
                            </div>
                            <div class="form-actividad-field">
                                <label>📝 Descripción</label>
                                <textarea id="editActividadDescripcion" class="form-actividad-textarea" rows="3" placeholder="Descripción detallada..."></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-editar-actividad-footer">
                        <button class="btn-editar-actividad-cancelar">Cancelar</button>
                        <button class="btn-editar-actividad-guardar">💾 Guardar cambios</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('modalEditarActividad');
        
        const closeBtn = modal.querySelector('.modal-editar-actividad-close');
        const cancelBtn = modal.querySelector('.btn-editar-actividad-cancelar');
        
        closeBtn.onclick = () => modal.style.display = 'none';
        cancelBtn.onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
        
        const guardarBtn = modal.querySelector('.btn-editar-actividad-guardar');
        guardarBtn.onclick = guardarEdicionActividad;
    }
    
    // Cargar colores en el select
    const selectColor = document.getElementById('editActividadColor');
const colores = [
    { codigo: '#0891b2', nombre: 'Azul', icono: '🔵' },
    { codigo: '#ef4444', nombre: 'Rojo', icono: '🔴' },
    { codigo: '#f97316', nombre: 'Naranja', icono: '🟠' },
    { codigo: '#eab308', nombre: 'Amarillo', icono: '🟡' },
    { codigo: '#10b981', nombre: 'Verde', icono: '🟢' },
    { codigo: '#8b5cf6', nombre: 'Morado', icono: '🟣' },
    { codigo: '#ec4899', nombre: 'Rosa', icono: '🩷' },
    { codigo: '#6b4226', nombre: 'Café', icono: '🟤' },      // Café
    { codigo: '#4ade80', nombre: 'Menta', icono: '🌿' },      // Menta
    { codigo: '#000000', nombre: 'Negro', icono: '⚫' }       // Negro
];
    selectColor.innerHTML = colores.map(c => 
        `<option value="${c.codigo}" ${evento.color === c.codigo ? 'selected' : ''}>${c.icono} ${c.nombre}</option>`
    ).join('');
    
    document.getElementById('editActividadFecha').value = evento.fecha;
    document.getElementById('editActividadHora').value = evento.hora || '';
    document.getElementById('editActividadTitulo').value = evento.titulo;
    document.getElementById('editActividadLugar').value = evento.lugar || '';
    document.getElementById('editActividadDescripcion').value = evento.descripcion || '';
    
    modal.style.display = 'flex';
}

async function guardarEdicionActividad() {
    const fecha = document.getElementById('editActividadFecha').value;
    const hora = document.getElementById('editActividadHora').value;
    const titulo = document.getElementById('editActividadTitulo').value.trim();
    const lugar = document.getElementById('editActividadLugar').value.trim();
    const descripcion = document.getElementById('editActividadDescripcion').value.trim();
    const color = document.getElementById('editActividadColor').value;
    
    if (!fecha) { mostrarToastError('❌ La fecha es obligatoria'); return; }
    if (!titulo) { mostrarToastError('❌ El título es obligatorio'); return; }
    
    const btnGuardar = document.querySelector('#modalEditarActividad .btn-editar-actividad-guardar');
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<span class="spinner-small"></span> Guardando...';
    
    try {
        await coleccionEventos.doc(eventoEditandoId).update({
            fecha, hora, titulo, lugar, descripcion, color
        });
        await cargarEventosAdmin();
        mostrarToastExito('✓ Actividad actualizada correctamente');
        document.getElementById('modalEditarActividad').style.display = 'none';
    } catch (error) {
        console.error('Error:', error);
        mostrarToastError('❌ Error al actualizar la actividad');
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '💾 Guardar cambios';
    }
}

async function cargarEventosAdmin() {
    const eventosList = document.getElementById('eventosList');
    if (!eventosList) return;
    const eventos = await cargarEventos();
    if (eventos.length === 0) {
        eventosList.innerHTML = '<p style="color:#64748b;text-align:center;padding:20px;">No hay actividades registradas</p>';
        return;
    }
    eventosList.innerHTML = eventos.map(evento => `
        <div class="evento-item" style="border-left: 4px solid ${evento.color || '#0891b2'};">
            <div style="flex:1;">
                <div class="evento-fecha">📅 ${evento.fecha} ${evento.hora ? `⏰ ${evento.hora}` : ''}</div>
                <div class="evento-titulo"><strong>${escapeHtml(evento.titulo)}</strong></div>
                ${evento.lugar ? `<div class="evento-lugar">📍 ${escapeHtml(evento.lugar)}</div>` : ''}
                ${evento.descripcion ? `<div class="evento-descripcion">📝 ${escapeHtml(evento.descripcion.substring(0, 100))}${evento.descripcion.length > 100 ? '...' : ''}</div>` : ''}
                <div class="evento-color" style="display: inline-block; background: ${evento.color || '#0891b2'}; width: 16px; height: 16px; border-radius: 4px; margin-top: 5px;"></div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="edit-btn" data-id="${evento.id}" data-evento='${JSON.stringify(evento)}'>✏️ Editar</button>
                <button class="delete-btn" data-id="${evento.id}">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = () => {
            const evento = JSON.parse(btn.dataset.evento);
            abrirModalEditarActividad(evento);
        };
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            const confirmado = await mostrarConfirmacion({
                titulo: "🗑️ Eliminar actividad", icono: "⚠️",
                mensaje: "¿Estás seguro de eliminar esta actividad?",
                advertencia: "Esta acción no se puede deshacer."
            });
            if (confirmado) {
                await eliminarEvento(btn.dataset.id);
                await cargarEventosAdmin();
                mostrarToastExito("✓ Actividad eliminada");
            }
        };
    });
}

// ========== CONTRASEÑAS ==========
async function cargarContraseñasAdmin() {
    const gruposPassList = document.getElementById('gruposPassList');
    if (!gruposPassList) return;

    const passwords = await cargarContraseñasGrupos();

    gruposPassList.innerHTML = GRUPOS.map(grupo => {
        const tienePassword = passwords[grupo] && passwords[grupo].trim() !== '';
        return `
            <div class="grupo-pass-item" data-grupo="${escapeHtml(grupo)}">
                <span><strong>👥 ${escapeHtml(grupo)}</strong></span>
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <input type="text" id="pass-${escapeHtml(grupo)}" placeholder="Contraseña" value="${passwords[grupo] || ''}" class="pass-input">
                    <button class="save-pass-btn" data-grupo="${escapeHtml(grupo)}">💾 Guardar</button>
                    <span class="pass-status-indicator" id="status-indicator-${escapeHtml(grupo)}" style="display: ${tienePassword ? 'inline-flex' : 'none'};">
                        <span class="pass-status-check">✅</span>
                        <span class="pass-status-text">Guardada</span>
                    </span>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.save-pass-btn').forEach(btn => {
        btn.onclick = async () => {
            const grupo = btn.dataset.grupo;
            const password = document.getElementById(`pass-${grupo}`).value.trim();
            const indicator = document.getElementById(`status-indicator-${grupo}`);
            
            if (!password) { 
                mostrarToastError("❌ Ingresa una contraseña"); 
                return; 
            }
            
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-small"></span> Guardando...';
            
            await guardarContraseñaGrupo(grupo, password);
            
            if (indicator) {
                indicator.style.display = 'inline-flex';
                indicator.style.animation = 'fadeInScale 0.3s ease';
            }
            
            btn.innerHTML = '💾 Guardar';
            btn.disabled = false;
            
            mostrarToastExito(`✓ Contraseña guardada para ${grupo}`);
        };
    });
}

// ========== CATEGORÍAS ==========
async function cargarSelectCategorias() {
    const select = document.getElementById('recursoCategoria');
    if (!select) return;
    try {
        const categorias = await cargarCategorias();
        if (categorias.length === 0) {
            select.innerHTML = '<option value="" disabled selected>⚠️ No hay categorías - Agrega una arriba</option>';
        } else {
            select.innerHTML = '<option value="" disabled selected>-- Seleccione una categoría --</option>' +
                categorias.map(cat => `<option value="${cat.id}">${cat.icono || '📁'} ${cat.nombre}</option>`).join('');
        }
    } catch (error) {
        select.innerHTML = '<option value="" disabled selected>❌ Error al cargar categorías</option>';
    }
}

async function cargarListaCategoriasAdmin() {
    const container = document.getElementById('categoriasListAdmin');
    if (!container) return;
    try {
        const categorias = await cargarCategorias();
        if (categorias.length === 0) {
            container.innerHTML = '<p style="color:#64748b;text-align:center;padding:20px;">No hay categorías. Agrega la primera.</p>';
            return;
        }
        container.innerHTML = `
            <div style="margin-top:10px;">
                <h4 style="margin-bottom:10px;color:#0f172a;">📋 Categorías existentes:</h4>
                <div style="display:flex;flex-wrap:wrap;gap:10px;">
                    ${categorias.map(cat => `
                        <div style="background:#f8fafc;border-radius:30px;padding:6px 12px;display:inline-flex;align-items:center;gap:8px;">
                            <span style="font-size:18px;">${cat.icono || '📁'}</span>
                            <span style="font-weight:500;">${escapeHtml(cat.nombre)}</span>
                            <button class="btn-editar-categoria-mini" data-id="${cat.id}" data-nombre="${cat.nombre}" data-icono="${cat.icono || '📁'}" style="background:none;border:none;cursor:pointer;color:#0891b2;">✏️</button>
                            <button class="btn-eliminar-categoria-mini" data-id="${cat.id}" data-nombre="${cat.nombre}" style="background:none;border:none;cursor:pointer;color:#ef4444;">🗑️</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.querySelectorAll('.btn-editar-categoria-mini').forEach(btn => {
            btn.onclick = async () => {
                const nuevoNombre = prompt('Editar nombre de categoría:', btn.dataset.nombre);
                if (nuevoNombre?.trim()) {
                    const nuevoIcono = prompt('Editar icono (emojis):', btn.dataset.icono);
                    await actualizarCategoria(btn.dataset.id, nuevoNombre.trim(), nuevoIcono || '📁');
                    await cargarListaCategoriasAdmin();
                    await cargarSelectCategorias();
                    mostrarToastExito("✓ Categoría actualizada");
                }
            };
        });
        document.querySelectorAll('.btn-eliminar-categoria-mini').forEach(btn => {
            btn.onclick = async () => {
                const confirmado = await mostrarConfirmacion({
                    titulo: "🗑️ Eliminar categoría", icono: "⚠️",
                    mensaje: `¿Estás seguro de eliminar la categoría "${btn.dataset.nombre}"?`,
                    nombre: btn.dataset.nombre, tipo: "categoria",
                    advertencia: "Esta acción no se puede deshacer."
                });
                if (confirmado) {
                    try {
                        await eliminarCategoria(btn.dataset.id);
                        await cargarListaCategoriasAdmin();
                        await cargarSelectCategorias();
                        mostrarToastExito(`✓ Categoría "${btn.dataset.nombre}" eliminada`);
                    } catch (error) {
                        mostrarToastError(error.message);
                    }
                }
            };
        });
    } catch (error) {
        container.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px;">❌ Error al cargar categorías</p>';
    }
}

async function cargarRecursosAdmin() {
    const recursosTableBody = document.getElementById('recursosTableBody');
    if (!recursosTableBody) return;
    try {
        const [recursos, categoriasSnapshot] = await Promise.all([coleccionRecursos.get(), coleccionCategorias.get()]);
        const categoriasMap = {};
        categoriasSnapshot.forEach(doc => { categoriasMap[doc.id] = { nombre: doc.data().nombre, icono: doc.data().icono || '📁' }; });
        const lista = [];
        recursos.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
        lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        if (lista.length === 0) {
            recursosTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">📭 No hay recursos disponibles<\/td><\/tr>';
            return;
        }
        recursosTableBody.innerHTML = lista.map(recurso => {
            const cat = categoriasMap[recurso.categoria];
            const catDisplay = cat ? `${cat.icono} ${cat.nombre}` : '📁 Sin categoría';
            const desc = recurso.descripcion ? escapeHtml(recurso.descripcion.substring(0, 60)) + (recurso.descripcion.length > 60 ? '...' : '') : '-';
            return `
                <tr>
                    <td><strong>${escapeHtml(recurso.titulo)}<\/strong><\/td>
                    <td><span class="categoria-badge">${catDisplay}<\/span><\/td>
                    <td>${desc}<\/td>
                    <td><span style="font-size:12px;color:#64748b;">📅 ${formatearFechaAdmin(recurso.fecha)}<\/span><\/td>
                    <td>
                        <a href="${recurso.url}" target="_blank" class="btn-ver" style="display:inline-block; background: #0891b2; color:white; border:none; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:11px; margin-right:5px;">👀 Ver<\/a>
                        <button class="btn-editar-recurso" data-id="${recurso.id}" style="background: #ff9100; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:11px; margin-right:5px;">✏️ Editar<\/button>
                        <button class="btn-eliminar-recurso" data-id="${recurso.id}" data-titulo="${escapeHtml(recurso.titulo)}" style="background: #f50000; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:11px;">🗑️ Eliminar<\/button>
                    <\/td>
                <\/tr>
            `;
        }).join('');
        document.querySelectorAll('.btn-editar-recurso').forEach(btn => { btn.onclick = () => { abrirModalEditarRecursoAdmin(btn.dataset.id); }; });
        document.querySelectorAll('.btn-eliminar-recurso').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const titulo = btn.dataset.titulo;
                const confirmado = await mostrarConfirmacion({
                    titulo: "🗑️ Eliminar recurso", icono: "⚠️",
                    mensaje: "¿Estás seguro de eliminar este recurso permanentemente?",
                    nombre: titulo, tipo: "recurso", advertencia: "Esta acción no se puede deshacer."
                });
                if (confirmado) {
                    try {
                        const docSnap = await coleccionRecursos.doc(id).get();
                        if (docSnap.exists) {
                            const recursoData = docSnap.data();
                            if (recursoData.public_id && typeof window.eliminarDeCloudinary === 'function') {
                                await window.eliminarDeCloudinary(recursoData.public_id, recursoData.resource_type || 'image');
                            }
                        }
                        await eliminarRecursoCloud(id);
                        await cargarRecursosAdmin();
                        mostrarToastExito("✓ Recurso eliminado");
                    } catch (e) {
                        console.error('Error al eliminar recurso:', e);
                        mostrarToastError("❌ Error al eliminar el recurso");
                    }
                }
            };
        });
    } catch (error) {
        console.error('Error cargando recursos:', error);
        recursosTableBody.innerHTML = '<td><td colspan="5" style="text-align:center;padding:40px;">❌ Error al cargar recursos<\/td><\/tr>';
    }
}

async function abrirModalEditarRecursoAdmin(recursoId) {
    let recursoData;
    try {
        const docSnap = await coleccionRecursos.doc(recursoId).get();
        if (!docSnap.exists) { mostrarToastError("❌ Recurso no encontrado"); return; }
        recursoData = { id: docSnap.id, ...docSnap.data() };
    } catch (e) { mostrarToastError("❌ Error al cargar el recurso"); return; }
    let categorias = [];
    try {
        const snap = await coleccionCategorias.get();
        snap.forEach(doc => categorias.push({ id: doc.id, ...doc.data() }));
        categorias.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } catch (e) { }
    const opcionesCategoria = categorias.map(cat => `<option value="${cat.id}" ${recursoData.categoria === cat.id ? 'selected' : ''}>${escapeHtml(cat.icono || '📁')} ${escapeHtml(cat.nombre)}</option>`).join('');
    let modal = document.getElementById('modalEditarRecursoAdmin');
    if (!modal) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="modalEditarRecursoAdmin" class="modal-editar-recurso">
                <div class="modal-editar-recurso-content">
                    <div class="modal-editar-recurso-header">
                        <span class="modal-editar-recurso-icon">✏️</span>
                        <h3>Editar Recurso</h3>
                        <button class="modal-editar-recurso-close" id="btnCerrarEditarRecursoAdmin">✕</button>
                    </div>
                    <div class="modal-editar-recurso-body">
                        <input type="hidden" id="editarRecursoAdminId" />
                        <div class="form-editar-grupo"><label class="form-editar-label">📝 Título</label><input type="text" id="editarRecursoAdminTitulo" class="form-editar-input" placeholder="Título del recurso" maxlength="200" /></div>
                        <div class="form-editar-grupo"><label class="form-editar-label">🗂️ Categoría</label><select id="editarRecursoAdminCategoria" class="form-editar-input form-editar-select"><option value="">— Sin categoría —</option></select></div>
                        <div class="form-editar-grupo"><label class="form-editar-label">📄 Descripción</label><textarea id="editarRecursoAdminDescripcion" class="form-editar-input form-editar-textarea" placeholder="Descripción del recurso (opcional)" maxlength="500" rows="3"></textarea></div>
                    </div>
                    <div class="modal-editar-recurso-footer">
                        <button class="btn-editar-cancelar" id="btnEditarRecursoAdminCancelar">✗ Cancelar</button>
                        <button class="btn-editar-guardar" id="btnEditarRecursoAdminGuardar">💾 Guardar cambios</button>
                    </div>
                </div>
            </div>
        `);
        modal = document.getElementById('modalEditarRecursoAdmin');
        document.getElementById('btnCerrarEditarRecursoAdmin').onclick = () => modal.style.display = 'none';
        document.getElementById('btnEditarRecursoAdminCancelar').onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
        document.getElementById('btnEditarRecursoAdminGuardar').onclick = async () => {
            const id = document.getElementById('editarRecursoAdminId').value;
            const titulo = document.getElementById('editarRecursoAdminTitulo').value.trim();
            const catId = document.getElementById('editarRecursoAdminCategoria').value;
            const desc = document.getElementById('editarRecursoAdminDescripcion').value.trim();
            if (!titulo) { mostrarToastError("❌ El título es obligatorio"); return; }
            const btnGuardar = document.getElementById('btnEditarRecursoAdminGuardar');
            btnGuardar.disabled = true;
            btnGuardar.textContent = '⏳ Guardando...';
            try {
                await coleccionRecursos.doc(id).update({ titulo, categoria: catId || null, descripcion: desc });
                modal.style.display = 'none';
                mostrarToastExito('✓ Recurso actualizado correctamente');
                await cargarRecursosAdmin();
            } catch (err) { mostrarToastError('❌ Error al guardar los cambios'); }
            finally { btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar cambios'; }
        };
    }
    document.getElementById('editarRecursoAdminId').value = recursoData.id;
    document.getElementById('editarRecursoAdminTitulo').value = recursoData.titulo || '';
    document.getElementById('editarRecursoAdminDescripcion').value = recursoData.descripcion || '';
    const selectCat = document.getElementById('editarRecursoAdminCategoria');
    selectCat.innerHTML = `<option value="">— Sin categoría —</option>${opcionesCategoria}`;
    selectCat.value = recursoData.categoria || '';
    modal.style.display = 'flex';
}

// ========== SIGNIFICADOS DE COLORES ==========
async function cargarSignificadosAdmin() {
    const significadosGrid = document.getElementById('significadoColoresGrid');
    if (!significadosGrid) return;
    const significados = await cargarSignificadosColores();
const colores = [
    { codigo: '#0891b2', nombre: 'Azul' }, 
    { codigo: '#ef4444', nombre: 'Rojo' },
    { codigo: '#f97316', nombre: 'Naranja' }, 
    { codigo: '#eab308', nombre: 'Amarillo' },
    { codigo: '#10b981', nombre: 'Verde' }, 
    { codigo: '#8b5cf6', nombre: 'Morado' },
    { codigo: '#ec4899', nombre: 'Rosa' }, 
    { codigo: '#6b4226', nombre: 'Café' },    // antes Cian
    { codigo: '#4ade80', nombre: 'Menta' },   // antes Ámbar
    { codigo: '#000000', nombre: 'Negro' },   // antes Índigo
    { codigo: '#616163', nombre: 'Gris' }
];
    significadosGrid.innerHTML = colores.map(color => {
        const significadoActual = significados[color.codigo] || '';
        const tieneSignificado = significadoActual.trim() !== '';
        return `
            <div class="significado-item ${tieneSignificado ? 'tiene-significado' : ''}" data-color="${color.codigo}">
                <div class="significado-info">
                    <div class="significado-color" style="background-color: ${color.codigo};"></div>
                    <span class="significado-nombre">${color.nombre}</span>
                    ${tieneSignificado ? '<span class="significado-badge">✓ Activo</span>' : '<span class="significado-badge inactivo">⚡ Sin significado</span>'}
                </div>
                <div class="significado-input-group">
                    <input type="text" id="significado_${color.codigo.replace('#', '')}" class="significado-input" placeholder="Ej: Actividades de formación..." value="${significadoActual.replace(/"/g, '&quot;')}">
                    <button class="btn-guardar-significado" data-color="${color.codigo}">💾 Guardar</button>
                </div>
            </div>
        `;
    }).join('');
    document.querySelectorAll('.btn-guardar-significado').forEach(btn => {
        btn.onclick = async () => {
            const color = btn.dataset.color;
            const input = document.getElementById(`significado_${color.replace('#', '')}`);
            const significado = input.value.trim();
            await guardarSignificadoColor(color, significado);
            const parent = btn.closest('.significado-item');
            if (significado) {
                parent.classList.add('tiene-significado');
                const badge = parent.querySelector('.significado-badge');
                if (badge) { badge.textContent = '✓ Activo'; badge.classList.remove('inactivo'); }
                mostrarToastExito(`✓ Significado guardado para ${color}`);
            } else {
                parent.classList.remove('tiene-significado');
                const badge = parent.querySelector('.significado-badge');
                if (badge) { badge.textContent = '⚡ Sin significado'; badge.classList.add('inactivo'); }
                mostrarToastExito(`✓ Significado eliminado para ${color}`);
            }
            await cargarSelectColoresActividades();
        };
    });
}

async function cargarSelectColoresActividades() {
    const select = document.getElementById('eventoColor');
    if (!select) return;
    const significados = await cargarSignificadosColores();
const coloresPredeterminados = [
    { codigo: '#0891b2', nombre: 'Azul', icono: '🔵' }, 
    { codigo: '#ef4444', nombre: 'Rojo', icono: '🔴' },
    { codigo: '#f97316', nombre: 'Naranja', icono: '🟠' }, 
    { codigo: '#eab308', nombre: 'Amarillo', icono: '🟡' },
    { codigo: '#10b981', nombre: 'Verde', icono: '🟢' }, 
    { codigo: '#8b5cf6', nombre: 'Morado', icono: '🟣' },
    { codigo: '#ec4899', nombre: 'Rosa', icono: '🩷' }, 
    { codigo: '#6b4226', nombre: 'Café', icono: '🟤' },    // antes Cian
    { codigo: '#4ade80', nombre: 'Menta', icono: '🌿' },    // antes Ámbar
    { codigo: '#000000', nombre: 'Negro', icono: '⚫' }     // antes Índigo
];
    const coloresConSignificado = coloresPredeterminados.filter(color => {
        const significado = significados[color.codigo];
        return significado && significado.trim() !== '';
    });
    if (coloresConSignificado.length === 0) {
        select.innerHTML = '<option value="" disabled selected>⚠️ No hay colores disponibles - Ve a "Gestionar significados"</option>';
        select.disabled = true;
        return;
    }
    select.disabled = false;
    select.innerHTML = '<option value="" disabled selected>-- Seleccione un color --</option>' +
        coloresConSignificado.map(color => {
            const significado = significados[color.codigo] || '';
            const significadoCorto = significado.length > 50 ? significado.substring(0, 47) + '...' : significado;
            return `<option value="${color.codigo}" style="background-color: ${color.codigo}; color: white; padding: 5px;">${color.icono} ${color.nombre} - ${significadoCorto}</option>`;
        }).join('');
}

function initModalColores() {
    const btnGestionarColores = document.getElementById('btnGestionarColores');
    const modalGestionColores = document.getElementById('modalGestionColores');
    const closeModalColores = document.querySelector('.close-modal-colores');
    const btnCerrarModalColores = document.getElementById('btnCerrarModalColores');
    if (btnGestionarColores) { btnGestionarColores.onclick = async () => { await cargarSignificadosAdmin(); if (modalGestionColores) modalGestionColores.style.display = 'flex'; }; }
    if (closeModalColores) { closeModalColores.onclick = () => { if (modalGestionColores) modalGestionColores.style.display = 'none'; }; }
    if (btnCerrarModalColores) { btnCerrarModalColores.onclick = () => { if (modalGestionColores) modalGestionColores.style.display = 'none'; }; }
    window.addEventListener('click', (e) => { if (e.target === modalGestionColores) modalGestionColores.style.display = 'none'; });
}

function initSubirRecurso() {
    const btnSubirRecurso = document.getElementById('btnSubirRecurso');
    if (!btnSubirRecurso) return;
    const nuevoBtn = btnSubirRecurso.cloneNode(true);
    btnSubirRecurso.parentNode.replaceChild(nuevoBtn, btnSubirRecurso);
    nuevoBtn.addEventListener('click', async function subirRecursoHandler(e) {
        e.preventDefault();
        e.stopPropagation();
        if (nuevoBtn.disabled) return;
        const titulo = document.getElementById('recursoTitulo').value.trim();
        const categoria = document.getElementById('recursoCategoria').value;
        const descripcion = document.getElementById('recursoDescripcion').value.trim();
        const archivo = document.getElementById('recursoArchivo').files[0];
        if (!titulo) { mostrarToastError('❌ Ingresa un título'); return; }
        if (!archivo) { mostrarToastError('❌ Selecciona un archivo'); return; }
        if (!categoria) { mostrarToastError('❌ Selecciona una categoría'); return; }
        if (archivo.size > 10 * 1024 * 1024) { mostrarToastError('❌ El archivo es demasiado grande (máx 10MB)'); return; }
        nuevoBtn.disabled = true;
        const textoOriginal = nuevoBtn.innerHTML;
        nuevoBtn.innerHTML = '<span class="spinner"></span> Subiendo...';
        mostrarToastExito('📤 Subiendo archivo...');
        try {
            let nombreLimpio = titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').toLowerCase().substring(0, 40);
            if (!nombreLimpio) nombreLimpio = 'recurso';
            const formData = new FormData();
            formData.append("file", archivo);
            formData.append("upload_preset", "comprobantes");
            formData.append("folder", "biblioteca");
            formData.append("public_id", nombreLimpio);
            const res = await fetch("https://api.cloudinary.com/v1_1/dyzpdl9tg/upload", { method: "POST", body: formData });
            if (!res.ok) throw new Error(`Error: ${res.status}`);
            const data = await res.json();
            const tipo = archivo.type.startsWith('image/') ? 'image' : 'pdf';
            const recurso = { titulo: titulo, categoria: categoria, descripcion: descripcion || "", url: data.secure_url, public_id: data.public_id, resource_type: data.resource_type, tipo: tipo, fecha: new Date().toISOString() };
            await coleccionRecursos.add(recurso);
            document.getElementById('recursoTitulo').value = '';
            document.getElementById('recursoDescripcion').value = '';
            document.getElementById('recursoArchivo').value = '';
            document.getElementById('previewArchivo').innerHTML = '';
            await cargarRecursosAdmin();
            mostrarToastExito('✓ Recurso subido exitosamente');
        } catch (error) {
            console.error('Error:', error);
            mostrarToastError('❌ Error al subir el recurso: ' + (error.message || 'Error desconocido'));
        } finally { nuevoBtn.disabled = false; nuevoBtn.innerHTML = textoOriginal; }
    });
}

function initPreviewArchivo() {
    document.getElementById('recursoArchivo')?.addEventListener('change', (e) => {
        const previewDiv = document.getElementById('previewArchivo');
        const file = e.target.files[0];
        if (!file) { previewDiv.innerHTML = ''; return; }
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => { previewDiv.innerHTML = `<img src="${ev.target.result}" style="max-width:100px;max-height:100px;border-radius:8px;">`; };
            reader.readAsDataURL(file);
        } else {
            const icon = file.type === 'application/pdf' ? '📄' : '📎';
            previewDiv.innerHTML = `<div style="padding:10px;background:#f1f5f9;border-radius:8px;">${icon} ${file.name}</div>`;
        }
    });
}

function initTabUsuarios() {
    if (typeof initUsuarios === 'function') initUsuarios();
}

// ========== GESTIÓN DE GRUPOS (TAB8) ==========
let listaGrupos = [];

async function cargarGrupos() {
    const tbody = document.getElementById('tablaGruposBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px;">📜 Cargando grupos...<\/td><\/tr>';
    try {
        const snapshot = await coleccionGruposInfo.get();
        listaGrupos = [];
        snapshot.forEach(doc => { listaGrupos.push({ id: doc.id, ...doc.data() }); });
        renderizarTablaGrupos();
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px;">❌ Error al cargar grupos<\/td><\/tr>';
    }
}

function renderizarTablaGrupos() {
    const tbody = document.getElementById('tablaGruposBody');
    if (!tbody) return;
    if (listaGrupos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:40px;">📭 No hay coordinadores agregados. Usa "Agregar coordinador" para empezar.解决</td>';
        return;
    }
    let html = '';
    for (const grupo of listaGrupos) {
        html += `
            <tr>
                <td><strong>${escapeHtml(grupo.grupo)}</strong></td>
                <td>${escapeHtml(grupo.coordinador || '-')}</td>
                <td>${escapeHtml(grupo.telefono || '-')}</td>
                <td>
                    <button class="btn-editar-grupo" data-id="${grupo.id}" data-grupo="${grupo.grupo}" data-coordinador="${grupo.coordinador || ''}" data-telefono="${grupo.telefono || ''}">✏️ Editar</button>
                    <button class="btn-eliminar-grupo" data-id="${grupo.id}" data-grupo="${grupo.grupo}">🗑️ Eliminar</button>
                </td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
    document.querySelectorAll('.btn-editar-grupo').forEach(btn => {
        btn.onclick = () => editarGrupo(btn.dataset.id, btn.dataset.grupo, btn.dataset.coordinador, btn.dataset.telefono);
    });
    document.querySelectorAll('.btn-eliminar-grupo').forEach(btn => {
        btn.onclick = async () => {
            if (confirm(`¿Eliminar la información del grupo "${btn.dataset.grupo}"?`)) {
                await coleccionGruposInfo.doc(btn.dataset.id).delete();
                await cargarGrupos();
                mostrarToastExito('✓ Información del grupo eliminada');
            }
        };
    });
}

function editarGrupo(id, grupoActual, coordinadorActual, telefonoActual) {
    let modal = document.getElementById('modalEditarGrupo');
    if (!modal) {
        const modalHTML = `
            <div id="modalEditarGrupo" class="modal-editar-grupo">
                <div class="modal-editar-grupo-content">
                    <div class="modal-editar-grupo-header">
                        <h3>✏️ Editar Grupo</h3>
                        <button class="modal-editar-grupo-close">&times;</button>
                    </div>
                    <div class="modal-editar-grupo-body">
                        <div class="form-editar-grupo">
                            <div class="form-grupo-field"><label>🏷️ Nombre del grupo</label><input type="text" id="editGrupoNombre" class="form-editar-input" placeholder="Nombre del grupo"></div>
                            <div class="form-grupo-field"><label>👤 Coordinador</label><input type="text" id="editGrupoCoordinador" class="form-editar-input" placeholder="Nombre del coordinador"></div>
                            <div class="form-grupo-field"><label>📱 Teléfono</label><input type="tel" id="editGrupoTelefono" class="form-editar-input" placeholder="Ej: 50212345678"></div>
                        </div>
                    </div>
                    <div class="modal-editar-grupo-footer">
                        <button class="btn-editar-grupo-cancelar">Cancelar</button>
                        <button class="btn-editar-grupo-guardar">💾 Guardar cambios</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('modalEditarGrupo');
        modal.querySelector('.modal-editar-grupo-close').onclick = () => modal.style.display = 'none';
        modal.querySelector('.btn-editar-grupo-cancelar').onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }
    document.getElementById('editGrupoNombre').value = grupoActual;
    document.getElementById('editGrupoCoordinador').value = coordinadorActual || '';
    document.getElementById('editGrupoTelefono').value = telefonoActual || '';
    modal.dataset.id = id;
    modal.dataset.grupoActual = grupoActual;
    const guardarBtn = modal.querySelector('.btn-editar-grupo-guardar');
    const nuevoGuardarBtn = guardarBtn.cloneNode(true);
    guardarBtn.parentNode.replaceChild(nuevoGuardarBtn, guardarBtn);
    nuevoGuardarBtn.onclick = async () => {
        const nuevoNombre = document.getElementById('editGrupoNombre').value.trim();
        const nuevoCoordinador = document.getElementById('editGrupoCoordinador').value.trim();
        const nuevoTelefono = document.getElementById('editGrupoTelefono').value.trim();
        const updates = {};
        if (nuevoNombre && nuevoNombre !== modal.dataset.grupoActual) updates.grupo = nuevoNombre;
        if (nuevoCoordinador) updates.coordinador = nuevoCoordinador;
        if (nuevoTelefono) updates.telefono = nuevoTelefono;
        if (Object.keys(updates).length === 0) { modal.style.display = 'none'; return; }
        nuevoGuardarBtn.disabled = true;
        nuevoGuardarBtn.innerHTML = '<span class="spinner-small"></span> Guardando...';
        try {
            await coleccionGruposInfo.doc(modal.dataset.id).update(updates);
            await cargarGrupos();
            mostrarToastExito('✓ Grupo actualizado correctamente');
            modal.style.display = 'none';
        } catch (error) {
            mostrarToastError('❌ Error al actualizar el grupo');
        } finally {
            nuevoGuardarBtn.disabled = false;
            nuevoGuardarBtn.innerHTML = '💾 Guardar cambios';
        }
    };
    modal.style.display = 'flex';
}

function initTabGrupos() {
    cargarGrupos();
    const btnAgregarGrupoForm = document.getElementById('btnAgregarGrupoForm');
    if (btnAgregarGrupoForm) {
        btnAgregarGrupoForm.onclick = () => {
            const nombre = document.getElementById('nuevoGrupoNombre')?.value.trim();
            const coordinador = document.getElementById('nuevoGrupoCoordinador')?.value.trim();
            const telefono = document.getElementById('nuevoGrupoTelefono')?.value.trim();
            if (!nombre) { mostrarToastError('❌ Ingresa el nombre del grupo'); return; }
            if (listaGrupos.find(g => g.grupo === nombre)) { mostrarToastError('❌ El grupo ya existe'); return; }
            coleccionGruposInfo.add({ grupo: nombre, coordinador: coordinador || '', telefono: telefono || '' }).then(() => {
                cargarGrupos();
                document.getElementById('nuevoGrupoNombre').value = '';
                document.getElementById('nuevoGrupoCoordinador').value = '';
                document.getElementById('nuevoGrupoTelefono').value = '';
                mostrarToastExito('✓ Grupo agregado exitosamente');
            }).catch(() => mostrarToastError('❌ Error al agregar grupo'));
        };
    }
}

// ========== INICIALIZACIÓN PRINCIPAL ==========
document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    await loadDatabase();

    const permisos = getPermisosUsuario();
    console.log('📌 Permisos del usuario:', permisos);
    
    const tabsIds = ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6', 'tab7', 'tab8'];
    for (const tabId of tabsIds) {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (tabBtn) tabBtn.style.display = permisos.includes(tabId) ? 'flex' : 'none';
    }
    configurarBotonesAdmin(permisos);
    actualizarUserBadge();
    aplicarTemaPorUsuario();

    const anioActual = new Date().getFullYear();
    window.anioSeleccionado = anioActual;
    await asegurarDBCloud(anioActual);

    initYearSelect();
    renderTabla();
    actNumeroReciboPreview();
    await cargarSelectCategorias();
    await cargarListaCategoriasAdmin();
    await cargarSelectColoresActividades();
    initModalColores();
    initSubirRecurso();
    initPreviewArchivo();

    document.getElementById('btnVistaPrevia').onclick = generarVistaPrevia;
    document.getElementById('btnConfirmarEnviar').onclick = subirYEnviar;
    document.getElementById('btnLogout').onclick = logout;
    document.getElementById('grupo').onchange = checkOtroGrupo;
    document.getElementById('selectAnioControl').onchange = cambiarAnioControl;

    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    async function activateTab(tabId) {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`)?.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');
        if (tabId === 'tab2') renderTabla();
        if (tabId === 'tab3') await cargarEventosAdmin();
        if (tabId === 'tab4') await cargarContraseñasAdmin();
        if (tabId === 'tab5') {
            await cargarRecursosAdmin();
            await cargarListaCategoriasAdmin();
        }
        if (tabId === 'tab6') {
            if (typeof cargarHistorialRecibos === 'function') await cargarHistorialRecibos();
        }
        if (tabId === 'tab7') initTabUsuarios();
        if (tabId === 'tab8') initTabGrupos();
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            e.preventDefault();
            if (tab.dataset.tab) await activateTab(tab.dataset.tab);
        });
    });

    let firstAllowedTab = tabsIds.find(tabId => permisos.includes(tabId));
    if (!firstAllowedTab) firstAllowedTab = 'tab1';
    await activateTab(firstAllowedTab);

    const btnAbrirEmojis = document.getElementById('btnAbrirEmojis');
    const emojiSelector = document.getElementById('emojiSelector');
    const categoriaIconoInput = document.getElementById('categoriaIcono');
    if (btnAbrirEmojis && emojiSelector) {
        btnAbrirEmojis.onclick = (e) => { e.stopPropagation(); emojiSelector.style.display = emojiSelector.style.display === 'none' ? 'block' : 'none'; };
        document.addEventListener('click', (e) => { if (!btnAbrirEmojis.contains(e.target) && !emojiSelector.contains(e.target)) emojiSelector.style.display = 'none'; });
        document.querySelectorAll('.emoji-option').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); if (categoriaIconoInput) categoriaIconoInput.value = btn.dataset.emoji; emojiSelector.style.display = 'none'; }; });
    }

    document.getElementById('btnAgregarEvento')?.addEventListener('click', async () => {
        const fecha = document.getElementById('eventoFecha').value;
        const hora = document.getElementById('eventoHora').value;
        const titulo = document.getElementById('eventoTitulo').value.trim();
        const lugar = document.getElementById('eventoLugar').value.trim();
        const descripcion = document.getElementById('eventoDescripcion').value.trim();
        const color = document.getElementById('eventoColor').value;
        if (!fecha) { mostrarToastError('❌ Selecciona una fecha'); return; }
        if (!color) { mostrarToastError('❌ Selecciona un color'); return; }
        const tituloFinal = titulo || '📅 Actividad sin título';
        await agregarEvento(fecha, tituloFinal, lugar, descripcion, color, hora);
        document.getElementById('eventoFecha').value = '';
        document.getElementById('eventoHora').value = '';
        document.getElementById('eventoTitulo').value = '';
        document.getElementById('eventoLugar').value = '';
        document.getElementById('eventoDescripcion').value = '';
        await cargarEventosAdmin();
        mostrarToastExito('✓ Actividad agregada');
    });

    document.getElementById('btnAgregarCategoria')?.addEventListener('click', async () => {
        const nombre = document.getElementById('categoriaNombre').value.trim();
        const icono = document.getElementById('categoriaIcono').value.trim() || '📁';
        if (!nombre) { mostrarToastError('❌ Ingresa un nombre'); return; }
        await agregarCategoria(nombre, icono);
        document.getElementById('categoriaNombre').value = '';
        document.getElementById('categoriaIcono').value = '';
        await cargarListaCategoriasAdmin();
        await cargarSelectCategorias();
        mostrarToastExito('✓ Categoría agregada');
    });

    const modalReset = document.getElementById('modalReset');
    const btnReset = document.getElementById('btnReset');
    const btnCancelReset = document.getElementById('btnCancelReset');
    const btnConfirmReset = document.getElementById('btnConfirmReset');
    if (btnReset) { btnReset.onclick = () => { if (modalReset) { modalReset.style.display = 'flex'; document.body.style.overflow = 'hidden'; } }; }
    if (btnCancelReset) { btnCancelReset.onclick = () => { if (modalReset) { modalReset.style.display = 'none'; document.body.style.overflow = ''; } }; }
    if (btnConfirmReset) {
        btnConfirmReset.onclick = async () => {
            const getId = (id) => document.getElementById(id)?.checked || false;
            const opciones = {
                pagos: getId('resetPagos'), actividades: getId('resetActividades'), passwords: getId('resetPasswords'),
                recibos: getId('resetRecibos'), biblioteca: getId('resetBiblioteca'), categorias: getId('resetCategorias'),
                historial: getId('resetHistorial'), significados: getId('resetSignificados'), grupos: getId('resetGrupos')
            };
            if (!Object.values(opciones).some(Boolean)) { mostrarToastError('❌ Selecciona al menos un elemento'); return; }
            const confirmado = await mostrarConfirmacion({ titulo: "⚠️ Reiniciar Sistema", icono: "⚠️", mensaje: "¿Estás seguro de reiniciar los elementos seleccionados?", advertencia: "Esta acción NO se puede deshacer." });
            if (confirmado) {
                if (modalReset) { modalReset.style.display = 'none'; document.body.style.overflow = ''; }
                await resetSistema(opciones);
            }
        };
    }
    window.addEventListener('click', (e) => { if (e.target === modalReset) { modalReset.style.display = 'none'; document.body.style.overflow = ''; } });
    mostrarToastExito('✓ Panel administrativo listo');
});

// Función para cambiar contraseña
async function cambiarMiContraseña() {
    const nuevaPassword = prompt('🔑 Ingresa tu nueva contraseña (mínimo 6 caracteres):');
    if (!nuevaPassword) return;
    if (nuevaPassword.length < 6) { mostrarToastError('❌ La contraseña debe tener al menos 6 caracteres'); return; }
    const confirmar = prompt('🔑 Confirma tu nueva contraseña:');
    if (nuevaPassword !== confirmar) { mostrarToastError('❌ Las contraseñas no coinciden'); return; }
    try {
        const user = firebase.auth().currentUser;
        if (user) { await user.updatePassword(nuevaPassword); mostrarToastExito('✓ Contraseña actualizada correctamente'); }
        else { mostrarToastError('❌ No hay usuario autenticado'); }
    } catch (error) {
        let mensaje = 'Error al cambiar contraseña';
        if (error.code === 'auth/requires-recent-login') mensaje = '⚠️ Por seguridad, cierra sesión y vuelve a iniciar para cambiar la contraseña';
        mostrarToastError(mensaje);
    }
}

document.getElementById('btnCambiarPassword')?.addEventListener('click', cambiarMiContraseña);