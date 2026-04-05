// js/admin.js - Panel administrativo

window.showToast = function(message, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) { console.log(message); return; }
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#dc2626" : "#10b981";
    toast.className = "toast show";
    setTimeout(() => { toast.className = "toast"; }, 2000);
};

document.addEventListener('DOMContentLoaded', async () => {
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
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn, .tab-content').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            document.getElementById(b.dataset.tab).classList.add('active');
        });
    });
    
    // Reset Sistema
    const btnReset = document.getElementById("btnReset");
    const modalReset = document.getElementById("modalReset");
    const btnCancelReset = document.getElementById("btnCancelReset");
    const btnConfirmReset = document.getElementById("btnConfirmReset");
    
    if (btnReset) btnReset.onclick = () => modalReset.style.display = "block";
    if (btnCancelReset) btnCancelReset.onclick = () => modalReset.style.display = "none";
    if (btnConfirmReset) {
        btnConfirmReset.onclick = async () => {
            modalReset.style.display = "none";
            await resetSistema();
        };
    }
    window.onclick = (event) => { if (event.target === modalReset) modalReset.style.display = "none"; };
    
    // Tab 3: Actividades
    await cargarEventosAdmin();
    
    document.getElementById("btnAgregarEvento").onclick = async () => {
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
    
    // Tab 4: Contraseñas
    await cargarContraseñasAdmin();
});

async function cargarEventosAdmin() {
    const eventos = await cargarEventos();
    const eventosList = document.getElementById("eventosList");
    if (!eventosList) return;
    
    if (eventos.length === 0) {
        eventosList.innerHTML = '<p style="color: #64748b;">No hay actividades registradas</p>';
        return;
    }
    
    eventosList.innerHTML = eventos.map(evento => `
        <div class="evento-item">
            <div style="flex: 1;">
                <div class="evento-fecha">📅 ${evento.fecha}</div>
                <div class="evento-titulo"><strong>${evento.titulo}</strong></div>
                ${evento.lugar ? `<div class="evento-lugar">📍 ${evento.lugar}</div>` : ''}
                ${evento.descripcion ? `<div class="evento-descripcion">📝 ${evento.descripcion.substring(0, 100)}${evento.descripcion.length > 100 ? '...' : ''}</div>` : ''}
            </div>
            <button class="delete-btn" data-id="${evento.id}">🗑️</button>
        </div>
    `).join("");
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            await eliminarEvento(btn.dataset.id);
            await cargarEventosAdmin();
            window.showToast("✓ Actividad eliminada", false);
        };
    });
}

async function cargarContraseñasAdmin() {
    const passwords = await cargarContraseñasGrupos();
    const gruposPassList = document.getElementById("gruposPassList");
    if (!gruposPassList) return;
    
    gruposPassList.innerHTML = GRUPOS.map(grupo => `
        <div class="grupo-pass-item">
            <span><strong>👥 ${grupo}</strong></span>
            <div>
                <input type="text" id="pass-${grupo}" placeholder="Contraseña" value="${passwords[grupo] || ''}">
                <button class="save-pass-btn" data-grupo="${grupo}">💾 Guardar</button>
            </div>
        </div>
    `).join("");
    
    document.querySelectorAll('.save-pass-btn').forEach(btn => {
        btn.onclick = async () => {
            const grupo = btn.dataset.grupo;
            const password = document.getElementById(`pass-${grupo}`).value.trim();
            if (!password) { window.showToast("❌ Ingresa una contraseña", true); return; }
            await guardarContraseñaGrupo(grupo, password);
            window.showToast(`✓ Contraseña guardada para ${grupo}`, false);
        };
    });
}