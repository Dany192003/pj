// js/panel-admin.js - Panel administrativo

window.showToast = function(message, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) { console.log(message); return; }
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#dc2626" : "#10b981";
    toast.className = "toast show";
    setTimeout(() => { toast.className = "toast"; }, 2000);
};

// Función para escapar HTML
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
    if (!eventosList) {
        console.log("❌ eventosList no encontrado");
        return;
    }
    
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
    if (!gruposPassList) {
        console.log("❌ gruposPassList no encontrado");
        return;
    }
    
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
            
            if (!password) {
                window.showToast("❌ Ingresa una contraseña", true);
                return;
            }
            
            await guardarContraseñaGrupo(grupo, password);
            window.showToast(`✓ Contraseña guardada para ${grupo}`, false);
        };
    });
    console.log("✅ Contraseñas cargadas");
}

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
    
    // Botones principales
    document.getElementById("btnVistaPrevia").onclick = generarVistaPrevia;
    document.getElementById("btnConfirmarEnviar").onclick = subirYEnviar;
    document.getElementById("btnLogout").onclick = logout;
    document.getElementById("grupo").onchange = checkOtroGrupo;
    document.getElementById("selectAnioControl").onchange = cambiarAnioControl;
    
    // ========== TABS - Versión mejorada ==========
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Función para activar una pestaña
    async function activateTab(tabId) {
        console.log("📑 Activando pestaña:", tabId);
        
        // Desactivar todas las pestañas
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Activar la pestaña seleccionada
        const selectedTab = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (selectedTab) selectedTab.classList.add('active');
        const selectedContent = document.getElementById(tabId);
        if (selectedContent) selectedContent.classList.add('active');
        
        // Cargar contenido según la pestaña
        if (tabId === 'tab3') {
            await cargarEventosAdmin();
        }
        if (tabId === 'tab4') {
            await cargarContraseñasAdmin();
        }
        if (tabId === 'tab2') {
            renderTabla();
        }
    }
    
    // Agregar event listeners a las pestañas
    tabs.forEach(tab => {
        tab.addEventListener('click', async (e) => {
            e.preventDefault();
            const tabId = tab.dataset.tab;
            if (tabId) {
                await activateTab(tabId);
            }
        });
    });
    
    // Activar la pestaña inicial (tab1)
    await activateTab('tab1');
    
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
    } else {
        console.log("❌ btnAgregarEvento no encontrado");
    }
    
    // ========== RESET SISTEMA ==========
    const btnReset = document.getElementById("btnReset");
    const modalReset = document.getElementById("modalReset");
    const btnCancelReset = document.getElementById("btnCancelReset");
    const btnConfirmReset = document.getElementById("btnConfirmReset");
    
    if (btnReset) {
        btnReset.onclick = () => {
            console.log("🔄 Botón Reset clickeado - Mostrando modal");
            if (modalReset) modalReset.style.display = "block";
        };
    } else {
        console.log("❌ btnReset no encontrado");
    }
    
    if (btnCancelReset) {
        btnCancelReset.onclick = () => {
            console.log("❌ Cancelar reset");
            if (modalReset) modalReset.style.display = "none";
        };
    }
    
    if (btnConfirmReset) {
        btnConfirmReset.onclick = async () => {
            console.log("⚠️ Confirmando reset del sistema...");
            if (modalReset) modalReset.style.display = "none";
            
            if (typeof resetSistema === 'function') {
                await resetSistema();
            } else {
                console.error("❌ función resetSistema no disponible");
                window.showToast("❌ Error: función de reset no disponible", true);
            }
        };
    }
    
    // Cerrar modal si se hace clic fuera
    window.onclick = (event) => {
        if (event.target === modalReset) {
            if (modalReset) modalReset.style.display = "none";
        }
    };
    
    window.showToast("✓ Panel administrativo listo", false);
    console.log("✅ Panel administrativo inicializado");
});