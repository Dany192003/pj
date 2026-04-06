// js/panel-admin.js - Panel administrativo

window.showToast = function(message, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) { console.log(message); return; }
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#dc2626" : "#10b981";
    toast.className = "toast show";
    setTimeout(() => { toast.className = "toast"; }, 2000);
};

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== FUNCIÓN: CARGAR EVENTOS ==========
async function cargarEventosAdmin() {
    console.log("📅 Cargando eventos...");
    const eventos = await cargarEventos();
    const eventosList = document.getElementById("eventosList");
    if (!eventosList) return;
    
    if (eventos.length === 0) {
        eventosList.innerHTML = '<p style="color: #64748b; text-align: center; padding: 20px;">No hay actividades registradas</p>';
        return;
    }
    
    eventosList.innerHTML = eventos.map(evento => `
        <div class="evento-item">
            <div style="flex: 1;">
                <div class="evento-fecha">📅 ${evento.fecha}</div>
                <div class="evento-titulo"><strong>${escapeHtml(evento.titulo)}</strong></div>
                ${evento.lugar ? `<div class="evento-lugar">📍 ${escapeHtml(evento.lugar)}</div>` : ''}
                ${evento.descripcion ? `<div class="evento-descripcion">📝 ${escapeHtml(evento.descripcion.substring(0, 100))}${evento.descripcion.length > 100 ? '...' : ''}</div>` : ''}
            </div>
            <button class="delete-btn" data-id="${evento.id}">🗑️</button>
        </div>
    `).join("");
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            await eliminarEvento(id);
            await cargarEventosAdmin();
            window.showToast("✓ Actividad eliminada", false);
        };
    });
    console.log("✅ Eventos cargados:", eventos.length);
}

// ========== FUNCIÓN: CARGAR CONTRASEÑAS ==========
async function cargarContraseñasAdmin() {
    console.log("🔑 Cargando contraseñas...");
    const passwords = await cargarContraseñasGrupos();
    const gruposPassList = document.getElementById("gruposPassList");
    if (!gruposPassList) return;
    
    gruposPassList.innerHTML = GRUPOS.map(grupo => `
        <div class="grupo-pass-item">
            <span><strong>👥 ${escapeHtml(grupo)}</strong></span>
            <div>
                <input type="text" id="pass-${escapeHtml(grupo)}" placeholder="Contraseña" value="${passwords[grupo] || ''}" class="pass-input">
                <button class="save-pass-btn" data-grupo="${escapeHtml(grupo)}">💾 Guardar</button>
            </div>
        </div>
    `).join("");
    
    document.querySelectorAll('.save-pass-btn').forEach(btn => {
        btn.onclick = async () => {
            const grupo = btn.dataset.grupo;
            const passwordInput = document.getElementById(`pass-${grupo}`);
            const password = passwordInput.value.trim();
            if (!password) { window.showToast("❌ Ingresa una contraseña", true); return; }
            await guardarContraseñaGrupo(grupo, password);
            window.showToast(`✓ Contraseña guardada para ${grupo}`, false);
        };
    });
    console.log("✅ Contraseñas cargadas");
}

// ========== FUNCIÓN: CARGAR SELECT DE CATEGORÍAS ==========
async function cargarSelectCategorias() {
    const select = document.getElementById("recursoCategoria");
    if (!select) return;
    
    try {
        const categorias = await cargarCategorias();
        select.innerHTML = '<option value="" disabled selected>-- Seleccione una categoría --</option>';
        
        if (categorias.length === 0) {
            select.innerHTML = '<option value="" disabled selected>⚠️ No hay categorías - Agrega una arriba</option>';
        } else {
            categorias.forEach(cat => {
                select.innerHTML += `<option value="${cat.id}">${cat.icono || '📁'} ${cat.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error("Error cargando categorías:", error);
        select.innerHTML = '<option value="" disabled selected>❌ Error al cargar categorías</option>';
    }
}

// ========== FUNCIÓN: CARGAR LISTA DE CATEGORÍAS (ADMIN) ==========
async function cargarListaCategoriasAdmin() {
    const categoriasListAdmin = document.getElementById("categoriasListAdmin");
    if (!categoriasListAdmin) return;
    
    try {
        const categorias = await cargarCategorias();
        
        if (categorias.length === 0) {
            categoriasListAdmin.innerHTML = '<p style="color: #64748b; text-align: center; padding: 20px;">No hay categorías. Agrega la primera.</p>';
            return;
        }
        
        categoriasListAdmin.innerHTML = `
            <div style="margin-top: 10px;">
                <h4 style="margin-bottom: 10px; color: #0f172a;">📋 Categorías existentes:</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    ${categorias.map(cat => `
                        <div style="background: #f8fafc; border-radius: 30px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 8px;">
                            <span style="font-size: 18px;">${cat.icono || '📁'}</span>
                            <span style="font-weight: 500;">${escapeHtml(cat.nombre)}</span>
                            <button class="btn-editar-categoria-mini" data-id="${cat.id}" data-nombre="${cat.nombre}" data-icono="${cat.icono || '📁'}" style="background: none; border: none; cursor: pointer; color: #0891b2;">✏️</button>
                            <button class="btn-eliminar-categoria-mini" data-id="${cat.id}" data-nombre="${cat.nombre}" style="background: none; border: none; cursor: pointer; color: #ef4444;">🗑️</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.querySelectorAll('.btn-editar-categoria-mini').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const nombreActual = btn.dataset.nombre;
                const iconoActual = btn.dataset.icono;
                
                const nuevoNombre = prompt("Editar nombre de categoría:", nombreActual);
                if (nuevoNombre && nuevoNombre.trim()) {
                    const nuevoIcono = prompt("Editar icono (emojis):", iconoActual);
                    await actualizarCategoria(id, nuevoNombre.trim(), nuevoIcono || '📁');
                    await cargarListaCategoriasAdmin();
                    await cargarSelectCategorias();
                    window.showToast("✓ Categoría actualizada", false);
                }
            };
        });
        
        document.querySelectorAll('.btn-eliminar-categoria-mini').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const nombre = btn.dataset.nombre;
                
                if (confirm(`¿Eliminar la categoría "${nombre}"? Los recursos se quedarán sin categoría.`)) {
                    try {
                        await eliminarCategoria(id);
                        await cargarListaCategoriasAdmin();
                        await cargarSelectCategorias();
                        window.showToast(`✓ Categoría "${nombre}" eliminada`, false);
                    } catch (error) {
                        window.showToast(error.message, true);
                    }
                }
            };
        });
        
    } catch (error) {
        console.error("Error cargando lista de categorías:", error);
        categoriasListAdmin.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 20px;">❌ Error al cargar categorías</p>';
    }
}

// ========== FUNCIÓN: CARGAR RECURSOS BIBLIOTECA ==========
// ========== FUNCIÓN: CARGAR RECURSOS BIBLIOTECA ==========
async function cargarRecursosAdmin() {
    const recursosTableBody = document.getElementById("recursosTableBody");
    if (!recursosTableBody) return;
    
    try {
        const snapshot = await coleccionRecursos.get();
        const recursos = [];
        snapshot.forEach(doc => {
            recursos.push({ id: doc.id, ...doc.data() });
        });
        
        const categoriasMap = {};
        const categoriasSnapshot = await coleccionCategorias.get();
        categoriasSnapshot.forEach(doc => {
            categoriasMap[doc.id] = { nombre: doc.data().nombre, icono: doc.data().icono || '📁' };
        });
        
        recursos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        if (recursos.length === 0) {
            recursosTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">📭 No hay recursos disponibles<\/td><\/tr>';
            return;
        }
        
        recursosTableBody.innerHTML = recursos.map(recurso => {
            const categoria = categoriasMap[recurso.categoria];
            const categoriaDisplay = categoria ? `${categoria.icono} ${categoria.nombre}` : '📁 Sin categoría';
            const fechaFormateada = formatearFechaAdmin(recurso.fecha);
            
            return `
                <tr>
                    <td><strong>${escapeHtml(recurso.titulo)}<\/strong><\/td>
                    <td><span class="categoria-badge">${categoriaDisplay}<\/span><\/td>
                    <td>${recurso.descripcion ? escapeHtml(recurso.descripcion.substring(0, 60)) + (recurso.descripcion.length > 60 ? '...' : '') : '-'}<\/td>
                    <td><span style="font-size: 12px; color: #64748b;">📅 ${fechaFormateada}<\/span><\/td>
                    <td>
                        <a href="${recurso.url}" target="_blank" class="btn-ver" data-url="${recurso.url}">👁️ Ver<\/a>
                        <button class="btn-eliminar-recurso" data-id="${recurso.id}" data-url="${recurso.url}">🗑️ Eliminar<\/button>
                    <\/td>
                <\/tr>
            `;
        }).join("");
        
        document.querySelectorAll('.btn-eliminar-recurso').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                if (confirm("¿Eliminar este recurso permanentemente?")) {
                    await eliminarRecursoCloud(id);
                    await cargarRecursosAdmin();
                    window.showToast("✓ Recurso eliminado", false);
                }
            };
        });
        
    } catch (error) {
        console.error("Error cargando recursos:", error);
        recursosTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">❌ Error al cargar recursos<\/td><\/tr>';
    }
}

// Función para formatear fecha en el panel admin
function formatearFechaAdmin(fechaISO) {
    if (!fechaISO) return "Fecha no disponible";
    
    const fecha = new Date(fechaISO);
    const opciones = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return fecha.toLocaleDateString("es-GT", opciones);
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Iniciando panel administrativo...");
    
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
    document.getElementById("btnVistaPrevia").onclick = generarVistaPrevia;
    document.getElementById("btnConfirmarEnviar").onclick = subirYEnviar;
    document.getElementById("btnLogout").onclick = logout;
    document.getElementById("grupo").onchange = checkOtroGrupo;
    document.getElementById("selectAnioControl").onchange = cambiarAnioControl;
    
    // ========== TABS ==========
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    async function activateTab(tabId) {
        console.log("📑 Activando pestaña:", tabId);
        
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        const selectedTab = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (selectedTab) selectedTab.classList.add('active');
        const selectedContent = document.getElementById(tabId);
        if (selectedContent) selectedContent.classList.add('active');
        
        if (tabId === 'tab3') {
            await cargarEventosAdmin();
        }
        if (tabId === 'tab4') {
            await cargarContraseñasAdmin();
        }
        if (tabId === 'tab2') {
            renderTabla();
        }
        if (tabId === 'tab5') {
            await cargarRecursosAdmin();
            await cargarListaCategoriasAdmin();
        }
    }
    
    tabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            e.preventDefault();
            const tabId = tab.dataset.tab;
            if (tabId) {
                await activateTab(tabId);
            }
        });
    });
    
    await activateTab('tab1');
    
    // ========== SELECTOR DE EMOJIS ==========
    const btnAbrirEmojis = document.getElementById("btnAbrirEmojis");
    const emojiSelector = document.getElementById("emojiSelector");
    const categoriaIconoInput = document.getElementById("categoriaIcono");
    
    if (btnAbrirEmojis && emojiSelector) {
        btnAbrirEmojis.onclick = (e) => {
            e.stopPropagation();
            if (emojiSelector.style.display === "none") {
                emojiSelector.style.display = "block";
            } else {
                emojiSelector.style.display = "none";
            }
        };
        
        document.addEventListener("click", (e) => {
            if (btnAbrirEmojis && emojiSelector) {
                if (!btnAbrirEmojis.contains(e.target) && !emojiSelector.contains(e.target)) {
                    emojiSelector.style.display = "none";
                }
            }
        });
        
        document.querySelectorAll('.emoji-option').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const emoji = btn.dataset.emoji;
                if (categoriaIconoInput) {
                    categoriaIconoInput.value = emoji;
                    emojiSelector.style.display = "none";
                }
            };
        });
    }
    
    // ========== BOTÓN AGREGAR EVENTO ==========
    const btnAgregarEvento = document.getElementById("btnAgregarEvento");
    if (btnAgregarEvento) {
        btnAgregarEvento.onclick = async () => {
            const fecha = document.getElementById("eventoFecha").value;
            const titulo = document.getElementById("eventoTitulo").value.trim();
            const lugar = document.getElementById("eventoLugar").value.trim();
            const descripcion = document.getElementById("eventoDescripcion").value.trim();
            
            if (!fecha) { window.showToast("❌ Selecciona una fecha", true); return; }
            if (!titulo) { window.showToast("❌ Escribe un título", true); return; }
            
            await agregarEvento(fecha, titulo, lugar, descripcion);
            
            document.getElementById("eventoFecha").value = "";
            document.getElementById("eventoTitulo").value = "";
            document.getElementById("eventoLugar").value = "";
            document.getElementById("eventoDescripcion").value = "";
            
            await cargarEventosAdmin();
            window.showToast("✓ Actividad agregada", false);
        };
    }
    
    // ========== BOTÓN AGREGAR CATEGORÍA ==========
    const btnAgregarCategoria = document.getElementById("btnAgregarCategoria");
    if (btnAgregarCategoria) {
        btnAgregarCategoria.onclick = async () => {
            const nombre = document.getElementById("categoriaNombre").value.trim();
            const icono = document.getElementById("categoriaIcono").value.trim() || "📁";
            
            if (!nombre) {
                window.showToast("❌ Ingresa un nombre para la categoría", true);
                return;
            }
            
            await agregarCategoria(nombre, icono);
            document.getElementById("categoriaNombre").value = "";
            document.getElementById("categoriaIcono").value = "";
            await cargarListaCategoriasAdmin();
            await cargarSelectCategorias();
            window.showToast("✓ Categoría agregada", false);
        };
    }
    
    // ========== BOTÓN SUBIR RECURSO ==========
    const btnSubirRecurso = document.getElementById("btnSubirRecurso");
    if (btnSubirRecurso) {
        btnSubirRecurso.onclick = async () => {
            const titulo = document.getElementById("recursoTitulo").value.trim();
            const categoria = document.getElementById("recursoCategoria").value;
            const descripcion = document.getElementById("recursoDescripcion").value.trim();
            const archivo = document.getElementById("recursoArchivo").files[0];
            
            if (!titulo) {
                window.showToast("❌ Ingresa un título", true);
                return;
            }
            if (!archivo) {
                window.showToast("❌ Selecciona un archivo", true);
                return;
            }
            if (!categoria) {
                window.showToast("❌ Selecciona una categoría", true);
                return;
            }
            
            if (archivo.size > 10 * 1024 * 1024) {
                window.showToast("❌ El archivo es demasiado grande (máx 10MB)", true);
                return;
            }
            
            const tipo = archivo.type.startsWith('image/') ? 'image' : 'pdf';
            
            window.showToast("📤 Subiendo archivo...", false);
            btnSubirRecurso.disabled = true;
            btnSubirRecurso.innerHTML = '<span class="spinner"></span> Subiendo...';
            
            try {
                const formData = new FormData();
                formData.append("file", archivo);
                formData.append("upload_preset", "comprobantes");
                formData.append("folder", "biblioteca");
                formData.append("public_id", `biblioteca_${Date.now()}_${titulo.replace(/[^a-z0-9]/gi, '_')}`);
                
                const res = await fetch("https://api.cloudinary.com/v1_1/dyzpdl9tg/upload", {
                    method: "POST",
                    body: formData
                });
                
                if (!res.ok) throw new Error(`Error: ${res.status}`);
                
                const data = await res.json();
                
                await agregarRecurso(titulo, categoria, descripcion, data.secure_url, tipo, data.public_id, data.resource_type);
                
                document.getElementById("recursoTitulo").value = "";
                document.getElementById("recursoDescripcion").value = "";
                document.getElementById("recursoArchivo").value = "";
                document.getElementById("previewArchivo").innerHTML = "";
                
                await cargarRecursosAdmin();
                window.showToast("✓ Recurso subido exitosamente", false);
                
            } catch (error) {
                console.error("Error:", error);
                window.showToast("❌ Error al subir el recurso: " + (error.message || "Error desconocido"), true);
            } finally {
                btnSubirRecurso.disabled = false;
                btnSubirRecurso.innerHTML = "📤 Subir Recurso";
            }
        };
    }
    
    // Preview del archivo
    const inputArchivo = document.getElementById("recursoArchivo");
    if (inputArchivo) {
        inputArchivo.onchange = (e) => {
            const previewDiv = document.getElementById("previewArchivo");
            const file = e.target.files[0];
            if (file) {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        previewDiv.innerHTML = `<img src="${e.target.result}" style="max-width: 100px; max-height: 100px; border-radius: 8px;">`;
                    };
                    reader.readAsDataURL(file);
                } else if (file.type === 'application/pdf') {
                    previewDiv.innerHTML = `<div style="padding: 10px; background: #f1f5f9; border-radius: 8px;">📄 ${file.name}</div>`;
                } else {
                    previewDiv.innerHTML = `<div style="padding: 10px; background: #f1f5f9; border-radius: 8px;">📎 ${file.name}</div>`;
                }
            } else {
                previewDiv.innerHTML = "";
            }
        };
    }
    
    // ========== RESET SISTEMA CON OPCIONES ==========
    const btnReset = document.getElementById("btnReset");
    const modalReset = document.getElementById("modalReset");
    const btnCancelReset = document.getElementById("btnCancelReset");
    const btnConfirmReset = document.getElementById("btnConfirmReset");
    
    if (btnReset) {
        btnReset.onclick = () => {
            console.log("🔄 Botón Reset clickeado - Mostrando modal");
            if (modalReset) modalReset.style.display = "block";
        };
    }
    
    if (btnCancelReset) {
        btnCancelReset.onclick = () => {
            if (modalReset) modalReset.style.display = "none";
            const checkboxes = modalReset.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                if (cb.id === 'resetBiblioteca') cb.checked = false;
                else if (cb.id === 'resetCategorias') cb.checked = false;
                else cb.checked = true;
            });
        };
    }
    
    if (btnConfirmReset) {
        btnConfirmReset.onclick = async () => {
            console.log("⚠️ Confirmando reset...");
            
            const opciones = {
                pagos: document.getElementById("resetPagos")?.checked || false,
                actividades: document.getElementById("resetActividades")?.checked || false,
                passwords: document.getElementById("resetPasswords")?.checked || false,
                recibos: document.getElementById("resetRecibos")?.checked || false,
                biblioteca: document.getElementById("resetBiblioteca")?.checked || false,
                categorias: document.getElementById("resetCategorias")?.checked || false
            };
            
            if (!opciones.pagos && !opciones.actividades && !opciones.passwords && !opciones.recibos && !opciones.biblioteca && !opciones.categorias) {
                window.showToast("❌ Selecciona al menos un elemento para reiniciar", true);
                return;
            }
            
            if (modalReset) modalReset.style.display = "none";
            
            if (typeof resetSistema === 'function') {
                await resetSistema(opciones);
            } else {
                console.error("❌ función resetSistema no disponible");
                window.showToast("❌ Error: función de reset no disponible", true);
            }
        };
    }
    
    window.onclick = (event) => {
        if (event.target === modalReset) {
            if (modalReset) modalReset.style.display = "none";
        }
    };
    
    window.showToast("✓ Panel administrativo listo", false);
    console.log("✅ Panel administrativo inicializado");
});