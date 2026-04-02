// js/app.js - Inicialización y utilidades

// Mostrar notificación
function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#dc2626" : "#10b981";
    toast.className = "toast show";
    setTimeout(() => {
        toast.className = "toast";
    }, 2000);
}

// Actualizar número de recibo en la interfaz
function actNumeroRecibo() {
    document.getElementById("numRecibo").value = `REC-${getCurrentNumero()}`;
}

// Inicializar todo
function initApp() {
    // Inicializar base de datos limpia
    initDatabase();
    
    // Cargar datos
    loadDatabase();
    
    // Inicializar selects
    initYearSelect();
    
    // Configurar año actual
    const anioActual = new Date().getFullYear();
    anioSeleccionado = anioActual;
    
    // Asegurar estructura para el año actual
    asegurarDB(anioActual);
    
    // Renderizar tabla
    renderTabla();
    
    // Actualizar número de recibo
    actNumeroRecibo();
    
    // Configurar event listeners
    document.getElementById("btnGenerar").onclick = generarComprobante;
    document.getElementById("btnEnviarWA").onclick = subirYEnviar;
    document.getElementById("btnCopiarMsg").onclick = copiarMensaje;
    document.getElementById("grupo").onchange = checkOtroGrupo;
    document.getElementById("selectAnioControl").onchange = cambiarAnioControl;
    
    // Configurar tabs
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.tab-btn, .tab-content').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            document.getElementById(b.dataset.tab).classList.add('active');
        });
    });
}

// Iniciar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);