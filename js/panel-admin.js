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
        <div class="evento-item" style="border-left: 4px solid ${evento.color || '#0891b2'};">
            <div style="flex:1;">
                <div class="evento-fecha">📅 ${evento.fecha}</div>
                <div class="evento-titulo"><strong>${escapeHtml(evento.titulo)}</strong></div>
                ${evento.lugar ? `<div class="evento-lugar">📍 ${escapeHtml(evento.lugar)}</div>` : ''}
                ${evento.descripcion ? `<div class="evento-descripcion">📝 ${escapeHtml(evento.descripcion.substring(0, 100))}${evento.descripcion.length > 100 ? '...' : ''}</div>` : ''}
                <div class="evento-color" style="display: inline-block; background: ${evento.color || '#0891b2'}; width: 16px; height: 16px; border-radius: 4px; margin-top: 5px;"></div>
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
        recursosTableBody.innerHTML = '<td><td colspan="5" style="text-align:center;padding:40px;">❌ Error al cargar recursos</td></tr>';
    }
}

// ── Significados de colores (todos los colores predefinidos) ─────────────────

async function cargarSignificadosAdmin() {
    const significadosGrid = document.getElementById('significadoColoresGrid');
    if (!significadosGrid) return;
    
    const significados = await cargarSignificadosColores();
    
    const colores = [
        { codigo: '#0891b2', nombre: 'Azul', icono: '🔵', default: '' },
        { codigo: '#ef4444', nombre: 'Rojo', icono: '🔴', default: '' },
        { codigo: '#f97316', nombre: 'Naranja', icono: '🟠', default: '' },
        { codigo: '#eab308', nombre: 'Amarillo', icono: '🟡', default: '' },
        { codigo: '#10b981', nombre: 'Verde', icono: '🟢', default: '' },
        { codigo: '#8b5cf6', nombre: 'Morado', icono: '🟣', default: '' },
        { codigo: '#ec4899', nombre: 'Rosa', icono: '🩷', default: '' },
        { codigo: '#06b6d4', nombre: 'Cian', icono: '💙', default: '' },
        { codigo: '#f59e0b', nombre: 'Ámbar', icono: '🟧', default: '' },
        { codigo: '#6366f1', nombre: 'Índigo', icono: '🔮', default: '' }
    ];
    
    significadosGrid.innerHTML = colores.map(color => {
        const significadoActual = significados[color.codigo] || '';
        const tieneSignificado = significadoActual.trim() !== '';
        
        return `
            <div class="significado-item ${tieneSignificado ? 'tiene-significado' : ''}" data-color="${color.codigo}">
                <div class="significado-info">
                    <div class="significado-color" style="background-color: ${color.codigo};"></div>
                    <span class="significado-nombre">${color.icono} ${color.nombre}</span>
                    ${tieneSignificado ? '<span class="significado-badge">✓ Activo</span>' : '<span class="significado-badge inactivo">⚡ Sin significado</span>'}
                </div>
                <div class="significado-input-group">
                    <input type="text" id="significado_${color.codigo.replace('#', '')}" 
                           class="significado-input" 
                           placeholder="Ej: Actividades de formación, Eventos importantes..."
                           value="${significadoActual.replace(/"/g, '&quot;')}">
                    <button class="btn-guardar-significado" data-color="${color.codigo}">💾 Guardar</button>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.btn-guardar-significado').forEach(btn => {
        // En la función cargarSignificadosAdmin, dentro del btn.onclick:

btn.onclick = async () => {
    const color = btn.dataset.color;
    const input = document.getElementById(`significado_${color.replace('#', '')}`);
    const significado = input.value.trim();
    
    await guardarSignificadoColor(color, significado);
    
    // Actualizar el badge y la clase
    const parent = btn.closest('.significado-item');
    if (significado) {
        parent.classList.add('tiene-significado');
        const badge = parent.querySelector('.significado-badge');
        if (badge) {
            badge.textContent = '✓ Activo';
            badge.classList.remove('inactivo');
        }
    } else {
        parent.classList.remove('tiene-significado');
        const badge = parent.querySelector('.significado-badge');
        if (badge) {
            badge.textContent = '⚡ Sin significado';
            badge.classList.add('inactivo');
        }
    }
    
    // Recargar el selector de colores en actividades
    await cargarSelectColoresActividades();
    
    window.showToast(significado ? `✓ Significado guardado para ${color}` : `✓ Significado eliminado para ${color}`, false);
};
    });
}

// ── Cargar selector de colores para actividades (solo colores con significado) ─

// ── Cargar selector de colores para actividades (solo colores con significado) ─

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
        { codigo: '#06b6d4', nombre: 'Cian', icono: '💙' },
        { codigo: '#f59e0b', nombre: 'Ámbar', icono: '🟧' },
        { codigo: '#6366f1', nombre: 'Índigo', icono: '🔮' }
    ];
    
    // Filtrar solo colores que tienen significado guardado (no vacío)
    const coloresConSignificado = coloresPredeterminados.filter(color => {
        const significado = significados[color.codigo];
        return significado && significado.trim() !== '';
    });
    
    // Si no hay colores con significado, mostrar mensaje y deshabilitar
    if (coloresConSignificado.length === 0) {
        select.innerHTML = '<option value="" disabled selected>⚠️ No hay colores disponibles - Ve a "Significado Colores"</option>';
        select.disabled = true;
        return;
    }
    
    // Habilitar el select y mostrar solo colores con significado
    select.disabled = false;
    select.innerHTML = '<option value="" disabled selected>-- Seleccione un color --</option>' +
        coloresConSignificado.map(color => 
            `<option value="${color.codigo}" style="background-color: ${color.codigo}; color: white; padding: 5px;">${color.icono} ${color.nombre}</option>`
        ).join('');
}

// ── Subir recurso ─────────────────────────────────────────────────────────────

const btnSubirRecurso = document.getElementById('btnSubirRecurso');
if (btnSubirRecurso) {
    const nuevoBtn = btnSubirRecurso.cloneNode(true);
    btnSubirRecurso.parentNode.replaceChild(nuevoBtn, btnSubirRecurso);
    
    nuevoBtn.addEventListener('click', async function subirRecursoHandler(e) {
        e.preventDefault();
        e.stopPropagation();
        
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

        nuevoBtn.disabled = true;
        const textoOriginal = nuevoBtn.innerHTML;
        nuevoBtn.innerHTML = '<span class="spinner"></span> Subiendo...';
        
        window.showToast('📤 Subiendo archivo...', false);

        try {
            let nombreLimpio = titulo
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/gi, '_')
                .replace(/_+/g, '_')
                .toLowerCase()
                .substring(0, 40);
            
            if (!nombreLimpio) nombreLimpio = 'recurso';
            
            const formData = new FormData();
            formData.append("file", archivo);
            formData.append("upload_preset", "comprobantes");
            formData.append("folder", "biblioteca");
            formData.append("public_id", nombreLimpio);
            
            const res = await fetch("https://api.cloudinary.com/v1_1/dyzpdl9tg/upload", {
                method: "POST",
                body: formData
            });
            
            if (!res.ok) throw new Error(`Error: ${res.status}`);
            const data = await res.json();
            
            const tipo = archivo.type.startsWith('image/') ? 'image' : 'pdf';
            
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
            
            document.getElementById('recursoTitulo').value = '';
            document.getElementById('recursoDescripcion').value = '';
            document.getElementById('recursoArchivo').value = '';
            document.getElementById('previewArchivo').innerHTML = '';
            
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
    await cargarSelectColoresActividades(); // Cargar solo colores con significado

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
        if (tabId === 'tab6') {
            if (typeof cargarHistorialRecibos === 'function') {
                await cargarHistorialRecibos();
            }
        }
        if (tabId === 'tab7') {
            await cargarSignificadosAdmin();
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

    // ── Agregar evento (con colores filtrados) ────────────────────────────────
    document.getElementById('btnAgregarEvento')?.addEventListener('click', async () => {
        const fecha       = document.getElementById('eventoFecha').value;
        const titulo      = document.getElementById('eventoTitulo').value.trim();
        const lugar       = document.getElementById('eventoLugar').value.trim();
        const descripcion = document.getElementById('eventoDescripcion').value.trim();
        const color       = document.getElementById('eventoColor').value;

        if (!fecha)  { window.showToast('❌ Selecciona una fecha', true); return; }
        if (!titulo) { window.showToast('❌ Escribe un título', true); return; }

        await agregarEvento(fecha, titulo, lugar, descripcion, color);

        ['eventoFecha', 'eventoTitulo', 'eventoLugar', 'eventoDescripcion']
            .forEach(id => { document.getElementById(id).value = ''; });
        document.getElementById('eventoColor').value = '#0891b2';

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

    // ── Modal Reset ───────────────────────────────────────────────────────────
    const modalReset     = document.getElementById('modalReset');
    const btnReset       = document.getElementById('btnReset');
    const btnCancelReset = document.getElementById('btnCancelReset');
    const btnConfirmReset = document.getElementById('btnConfirmReset');

    if (btnReset) {
        btnReset.onclick = () => {
            if (modalReset) {
                modalReset.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        };
    }

    if (btnCancelReset) {
        btnCancelReset.onclick = () => {
            if (modalReset) {
                modalReset.style.display = 'none';
                document.body.style.overflow = '';
            }
        };
    }

    if (btnConfirmReset) {
        btnConfirmReset.onclick = async () => {
            const getId = (id) => document.getElementById(id)?.checked || false;
            const opciones = {
                pagos:       getId('resetPagos'),
                actividades: getId('resetActividades'),
                passwords:   getId('resetPasswords'),
                recibos:     getId('resetRecibos'),
                biblioteca:  getId('resetBiblioteca'),
                categorias:  getId('resetCategorias'),
                historial:   getId('resetHistorial'),
                significados: getId('resetSignificados')
            };

            if (!Object.values(opciones).some(Boolean)) {
                window.showToast('❌ Selecciona al menos un elemento para reiniciar', true);
                return;
            }

            if (modalReset) {
                modalReset.style.display = 'none';
                document.body.style.overflow = '';
            }
            await resetSistema(opciones);
        };
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalReset) {
            modalReset.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalReset && modalReset.style.display === 'flex') {
            modalReset.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    window.showToast('✓ Panel administrativo listo', false);
});