// js/admin.js - Inicialización del panel administrativo

window.showToast = function(message, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) {
        console.log(message);
        return;
    }
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#dc2626" : "#10b981";
    toast.className = "toast show";
    setTimeout(() => {
        toast.className = "toast";
    }, 2000);
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    
    const syncStatus = document.getElementById("syncStatus");
    if (syncStatus) {
        syncStatus.textContent = "🔄 Sincronizando...";
        syncStatus.classList.add("syncing");
    }
    
    await loadDatabase();
    
    const anioActual = new Date().getFullYear();
    window.anioSeleccionado = anioActual;
    
    if (typeof asegurarDBCloud === 'function') {
        await asegurarDBCloud(anioActual);
    }
    
    if (typeof initYearSelect === 'function') initYearSelect();
    if (typeof renderTabla === 'function') renderTabla();
    if (typeof actNumeroRecibo === 'function') actNumeroRecibo();
    
    if (syncStatus) {
        syncStatus.textContent = "☁️ Sincronizado";
        syncStatus.classList.remove("syncing");
    }
    
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
    
    // Botón reset
    const btnReset = document.getElementById("btnReset");
    const modalReset = document.getElementById("modalReset");
    const btnCancelReset = document.getElementById("btnCancelReset");
    const btnConfirmReset = document.getElementById("btnConfirmReset");
    
    if (btnReset) {
        btnReset.onclick = () => {
            if (modalReset) modalReset.style.display = "block";
        };
    }
    
    if (btnCancelReset) {
        btnCancelReset.onclick = () => {
            if (modalReset) modalReset.style.display = "none";
        };
    }
    
    if (btnConfirmReset) {
        btnConfirmReset.onclick = async () => {
            if (modalReset) modalReset.style.display = "none";
            if (typeof resetDatabase === 'function') {
                await resetDatabase();
            }
        };
    }
    
    window.onclick = (event) => {
        if (event.target === modalReset) {
            if (modalReset) modalReset.style.display = "none";
        }
    };
    
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.tab-btn, .tab-content').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            const tabId = b.dataset.tab;
            if (tabId) document.getElementById(tabId).classList.add('active');
        });
    });
    
    window.showToast("✓ Datos sincronizados desde la nube", false);
});