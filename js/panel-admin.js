// js/panel-admin.js - Panel administrativo

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

// ── Eventos ───────────────────────────────────────────────────────────────────

async function cargarEventosAdmin() {
    const eventosList = document.getElementById('eventosList');
    if (!eventosList) return;

    const eventos = await cargarEventos();

    if (eventos.length === 0) {
        eventosList.innerHTML = '<p style="color:#64748b;text-align:center;padding:20px;">No hay actividades registradas</p>';
        return;
    }

    eventosList.innerHTML = eventos.map(evento => `
        <div class="evento-item">
            <div style="flex:1;">
                <div class="evento-fecha">📅 ${evento.fecha}</div>
                <div class="evento-titulo"><strong>${escapeHtml(evento.titulo)}</strong></div>
                ${evento.lugar       ? `<div class="evento-lugar">📍 ${escapeHtml(evento.lugar)}</div>` : ''}
                ${evento.descripcion ? `<div class="evento-descripcion">📝 ${escapeHtml(evento.descripcion.substring(0, 100))}${evento.descripcion.length > 100 ? '...' : ''}</div>` : ''}
            </div>
            <button class="delete-btn" data-id="${evento.id}">🗑️</button>
        </div>
    `).join('');

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            await eliminarEvento(btn.dataset.id);
            await cargarEventosAdmin();
            window.showToast('✓ Actividad eliminada', false);
        };
    });
}

// ── Contraseñas ───────────────────────────────────────────────────────────────

async function cargarContraseñasAdmin() {
    const gruposPassList = document.getElementById('gruposPassList');
    if (!gruposPassList) return;

    const passwords = await cargarContraseñasGrupos();

    gruposPassList.innerHTML = GRUPOS.map(grupo => `
        <div class="grupo-pass-item">
            <span><strong>👥 ${escapeHtml(grupo)}</strong></span>
            <div>
                <input type="text" id="pass-${escapeHtml(grupo)}" placeholder="Contraseña" value="${passwords[grupo] || ''}" class="pass-input">
                <button class="save-pass-btn" data-grupo="${escapeHtml(grupo)}">💾 Guardar</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.save-pass-btn').forEach(btn => {
        btn.onclick = async () => {
            const grupo = btn.dataset.grupo;
            const password = document.getElementById(`pass-${grupo}`).value.trim();
            if (!password) { window.showToast('❌ Ingresa una contraseña', true); return; }
            await guardarContraseñaGrupo(grupo, password);
            window.showToast(`✓ Contraseña guardada para ${grupo}`, false);
        };
    });
}

// ── Categorías ────────────────────────────────────────────────────────────────

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
                    window.showToast('✓ Categoría actualizada', false);
                }
            };
        });

        document.querySelectorAll('.btn-eliminar-categoria-mini').forEach(btn => {
            btn.onclick = async () => {
                if (confirm(`¿Eliminar la categoría "${btn.dataset.nombre}"?`)) {
                    try {
                        await eliminarCategoria(btn.dataset.id);
                        await cargarListaCategoriasAdmin();
                        await cargarSelectCategorias();
                        window.showToast(`✓ Categoría "${btn.dataset.nombre}" eliminada`, false);
                    } catch (error) {
                        window.showToast(error.message, true);
                    }
                }
            };
        });
    } catch (error) {
        container.innerHTML = '<p style="color:#ef4444;text-align:center;padding:20px;">❌ Error al cargar categorías</p>';
    }
}

// ── Recursos biblioteca ───────────────────────────────────────────────────────

async function cargarRecursosAdmin() {
    const recursosTableBody = document.getElementById('recursosTableBody');
    if (!recursosTableBody) return;

    try {
        const [recursos, categoriasSnapshot] = await Promise.all([
            coleccionRecursos.get(),
            coleccionCategorias.get()
        ]);

        const categoriasMap = {};
        categoriasSnapshot.forEach(doc => {
            categoriasMap[doc.id] = { nombre: doc.data().nombre, icono: doc.data().icono || '📁' };
        });

        const lista = [];
        recursos.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
        lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        if (lista.length === 0) {
            recursosTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">📭 No hay recursos disponibles</td></tr>';
            return;
        }

        recursosTableBody.innerHTML = lista.map(recurso => {
            const cat = categoriasMap[recurso.categoria];
            const catDisplay = cat ? `${cat.icono} ${cat.nombre}` : '📁 Sin categoría';
            const desc = recurso.descripcion
                ? escapeHtml(recurso.descripcion.substring(0, 60)) + (recurso.descripcion.length > 60 ? '...' : '')
                : '-';
            return `
                <tr>
                    <td><strong>${escapeHtml(recurso.titulo)}</strong></td>
                    <td><span class="categoria-badge">${catDisplay}</span></td>
                    <td>${desc}</td>
                    <td><span style="font-size:12px;color:#64748b;">📅 ${formatearFechaAdmin(recurso.fecha)}</span></td>
                    <td>
                        <a href="${recurso.url}" target="_blank" class="btn-ver">👁️ Ver</a>
                        <button class="btn-eliminar-recurso" data-id="${recurso.id}">🗑️ Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelectorAll('.btn-eliminar-recurso').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('¿Eliminar este recurso permanentemente?')) {
                    await eliminarRecursoCloud(btn.dataset.id);
                    await cargarRecursosAdmin();
                    window.showToast('✓ Recurso eliminado', false);
                }
            };
        });
    } catch (error) {
        recursosTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">❌ Error al cargar recursos</td></tr>';
    }
}

// ── Inicialización ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    await loadDatabase();

    const anioActual = new Date().getFullYear();
    window.anioSeleccionado = anioActual;
    await asegurarDBCloud(anioActual);

    initYearSelect();
    renderTabla();
    actNumeroReciboPreview();
    await cargarSelectCategorias();
    await cargarListaCategoriasAdmin();

    // Botones principales
    document.getElementById('btnVistaPrevia').onclick    = generarVistaPrevia;
    document.getElementById('btnConfirmarEnviar').onclick = subirYEnviar;
    document.getElementById('btnLogout').onclick          = logout;
    document.getElementById('grupo').onchange             = checkOtroGrupo;
    document.getElementById('selectAnioControl').onchange = cambiarAnioControl;

    // ── Tabs ──────────────────────────────────────────────────────────────────
    const tabs        = document.querySelectorAll('.tab-btn');
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
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            e.preventDefault();
            if (tab.dataset.tab) await activateTab(tab.dataset.tab);
        });
    });

    await activateTab('tab1');

    // ── Selector de emojis ────────────────────────────────────────────────────
    const btnAbrirEmojis    = document.getElementById('btnAbrirEmojis');
    const emojiSelector     = document.getElementById('emojiSelector');
    const categoriaIconoInput = document.getElementById('categoriaIcono');

    if (btnAbrirEmojis && emojiSelector) {
        btnAbrirEmojis.onclick = (e) => {
            e.stopPropagation();
            emojiSelector.style.display = emojiSelector.style.display === 'none' ? 'block' : 'none';
        };

        document.addEventListener('click', (e) => {
            if (!btnAbrirEmojis.contains(e.target) && !emojiSelector.contains(e.target)) {
                emojiSelector.style.display = 'none';
            }
        });

        document.querySelectorAll('.emoji-option').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                if (categoriaIconoInput) categoriaIconoInput.value = btn.dataset.emoji;
                emojiSelector.style.display = 'none';
            };
        });
    }

    // ── Agregar evento ────────────────────────────────────────────────────────
    document.getElementById('btnAgregarEvento')?.addEventListener('click', async () => {
        const fecha       = document.getElementById('eventoFecha').value;
        const titulo      = document.getElementById('eventoTitulo').value.trim();
        const lugar       = document.getElementById('eventoLugar').value.trim();
        const descripcion = document.getElementById('eventoDescripcion').value.trim();

        if (!fecha)  { window.showToast('❌ Selecciona una fecha', true); return; }
        if (!titulo) { window.showToast('❌ Escribe un título', true); return; }

        await agregarEvento(fecha, titulo, lugar, descripcion);

        ['eventoFecha', 'eventoTitulo', 'eventoLugar', 'eventoDescripcion']
            .forEach(id => { document.getElementById(id).value = ''; });

        await cargarEventosAdmin();
        window.showToast('✓ Actividad agregada', false);
    });

    // ── Agregar categoría ─────────────────────────────────────────────────────
    document.getElementById('btnAgregarCategoria')?.addEventListener('click', async () => {
        const nombre = document.getElementById('categoriaNombre').value.trim();
        const icono  = document.getElementById('categoriaIcono').value.trim() || '📁';

        if (!nombre) { window.showToast('❌ Ingresa un nombre para la categoría', true); return; }

        await agregarCategoria(nombre, icono);
        document.getElementById('categoriaNombre').value = '';
        document.getElementById('categoriaIcono').value  = '';
        await cargarListaCategoriasAdmin();
        await cargarSelectCategorias();
        window.showToast('✓ Categoría agregada', false);
    });

    // ── Subir recurso (SOLO UNA VEZ - CENTRALIZADO) ──────────────────────────
    const btnSubirRecurso = document.getElementById('btnSubirRecurso');
    if (btnSubirRecurso) {
        // Remover event listeners anteriores para evitar duplicados
        const nuevoBtn = btnSubirRecurso.cloneNode(true);
        btnSubirRecurso.parentNode.replaceChild(nuevoBtn, btnSubirRecurso);
        
        nuevoBtn.addEventListener('click', async function subirRecursoHandler(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Verificar si ya está en proceso
            if (nuevoBtn.disabled) {
                console.log("⚠️ Subida ya en proceso, espera...");
                return;
            }
            
            const titulo = document.getElementById('recursoTitulo').value.trim();
            const categoria = document.getElementById('recursoCategoria').value;
            const descripcion = document.getElementById('recursoDescripcion').value.trim();
            const archivo = document.getElementById('recursoArchivo').files[0];

            if (!titulo) { window.showToast('❌ Ingresa un título', true); return; }
            if (!archivo) { window.showToast('❌ Selecciona un archivo', true); return; }
            if (!categoria) { window.showToast('❌ Selecciona una categoría', true); return; }
            if (archivo.size > 10 * 1024 * 1024) {
                window.showToast('❌ El archivo es demasiado grande (máx 10MB)', true);
                return;
            }

            // Deshabilitar botón para evitar doble clic
            nuevoBtn.disabled = true;
            const textoOriginal = nuevoBtn.innerHTML;
            nuevoBtn.innerHTML = '<span class="spinner"></span> Subiendo...';
            
            window.showToast('📤 Subiendo archivo...', false);

            try {
                // Limpiar el título para usarlo como nombre
                let nombreLimpio = titulo
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]/gi, '_')
                    .replace(/_+/g, '_')
                    .toLowerCase()
                    .substring(0, 40);
                
                if (!nombreLimpio) nombreLimpio = 'recurso';
                
                const extension = archivo.name.split('.').pop();
                const publicId = `${nombreLimpio}`;
                
                // Crear FormData
                const formData = new FormData();
                formData.append("file", archivo);
                formData.append("upload_preset", "comprobantes");
                formData.append("public_id", publicId);
                
                console.log("📤 Subiendo a Cloudinary con ID:", publicId);
                
                const res = await fetch("https://api.cloudinary.com/v1_1/dyzpdl9tg/upload", {
                    method: "POST",
                    body: formData
                });
                
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("❌ Error Cloudinary:", errorText);
                    throw new Error(`Error en Cloudinary: ${res.status}`);
                }
                
                const data = await res.json();
                console.log("✓ Archivo subido:", data.secure_url);
                
                const tipo = archivo.type.startsWith('image/') ? 'image' : 'pdf';
                
                // Guardar en Firestore
                const recurso = {
                    titulo: titulo,
                    categoria: categoria,
                    descripcion: descripcion || "",
                    url: data.secure_url,
                    public_id: data.public_id,
                    resource_type: data.resource_type,
                    tipo: tipo,
                    fecha: new Date().toISOString()
                };
                
                await coleccionRecursos.add(recurso);
                
                // Limpiar formulario
                document.getElementById('recursoTitulo').value = '';
                document.getElementById('recursoDescripcion').value = '';
                document.getElementById('recursoArchivo').value = '';
                document.getElementById('previewArchivo').innerHTML = '';
                
                // Recargar lista
                await cargarRecursosAdmin();
                window.showToast('✓ Recurso subido exitosamente', false);
                
            } catch (error) {
                console.error('Error:', error);
                window.showToast('❌ Error al subir el recurso: ' + (error.message || 'Error desconocido'), true);
            } finally {
                nuevoBtn.disabled = false;
                nuevoBtn.innerHTML = textoOriginal;
            }
        });
    }

    // Preview del archivo seleccionado
    document.getElementById('recursoArchivo')?.addEventListener('change', (e) => {
        const previewDiv = document.getElementById('previewArchivo');
        const file = e.target.files[0];
        if (!file) { previewDiv.innerHTML = ''; return; }

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                previewDiv.innerHTML = `<img src="${ev.target.result}" style="max-width:100px;max-height:100px;border-radius:8px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            const icon = file.type === 'application/pdf' ? '📄' : '📎';
            previewDiv.innerHTML = `<div style="padding:10px;background:#f1f5f9;border-radius:8px;">${icon} ${file.name}</div>`;
        }
    });

    // ── Modal Reset ───────────────────────────────────────────────────────────
    const modalReset     = document.getElementById('modalReset');
    const btnReset       = document.getElementById('btnReset');
    const btnCancelReset = document.getElementById('btnCancelReset');
    const btnConfirmReset = document.getElementById('btnConfirmReset');

    btnReset?.addEventListener('click', () => {
        if (modalReset) modalReset.style.display = 'block';
    });

    btnCancelReset?.addEventListener('click', () => {
        if (modalReset) modalReset.style.display = 'none';
    });

    btnConfirmReset?.addEventListener('click', async () => {
        const getId = (id) => document.getElementById(id)?.checked || false;
        const opciones = {
            pagos:       getId('resetPagos'),
            actividades: getId('resetActividades'),
            passwords:   getId('resetPasswords'),
            recibos:     getId('resetRecibos'),
            biblioteca:  getId('resetBiblioteca'),
            categorias:  getId('resetCategorias')
        };

        if (!Object.values(opciones).some(Boolean)) {
            window.showToast('❌ Selecciona al menos un elemento para reiniciar', true);
            return;
        }

        if (modalReset) modalReset.style.display = 'none';
        await resetSistema(opciones);
    });

    window.addEventListener('click', (e) => {
        if (e.target === modalReset) modalReset.style.display = 'none';
    });

    window.showToast('✓ Panel administrativo listo', false);
});