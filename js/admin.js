// js/admin.js - Inicialización del panel administrativo

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (!requireAuth()) return;
    
    // Cargar datos
    loadDatabase();
    
    // Inicializar año
    const anioActual = new Date().getFullYear();
    window.anioSeleccionado = anioActual;
    
    // Asegurar estructura
    asegurarDB(anioActual);
    
    // Inicializar selects
    if (typeof initYearSelect === 'function') initYearSelect();
    
    // Renderizar tabla
    if (typeof renderTabla === 'function') renderTabla();
    
    // Actualizar número de recibo
    if (typeof actNumeroRecibo === 'function') actNumeroRecibo();
    
    // Configurar event listeners
    const btnGenerar = document.getElementById("btnGenerar");
    const btnEnviarWA = document.getElementById("btnEnviarWA");
    const btnCopiarMsg = document.getElementById("btnCopiarMsg");
    const btnLogout = document.getElementById("btnLogout");
    const grupoSelect = document.getElementById("grupo");
    const selectAnioControl = document.getElementById("selectAnioControl");
    
    if (btnGenerar) btnGenerar.onclick = generarComprobante;
    if (btnEnviarWA) btnEnviarWA.onclick = subirYEnviar;
    if (btnCopiarMsg) btnCopiarMsg.onclick = copiarMensaje;
    if (btnLogout) btnLogout.onclick = logout;
    if (grupoSelect) grupoSelect.onchange = checkOtroGrupo;
    if (selectAnioControl) selectAnioControl.onchange = cambiarAnioControl;
    
    // Configurar tabs
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.tab-btn, .tab-content').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            const tabId = b.dataset.tab;
            if (tabId) document.getElementById(tabId).classList.add('active');
        });
    });
});