// js/biblioteca-admin.js - Funciones exclusivas para biblioteca (NO duplicadas con panel-admin.js)

// NOTA: Las siguientes funciones NO están duplicadas porque:
// - escapeHtml(), mostrarToastExito(), mostrarToastError(), mostrarConfirmacion()
//   están definidas en panel-admin.js y se usan globalmente.
// - cargarRecursosAdmin() y abrirModalEditarRecursoAdmin() están en panel-admin.js

// ========== FUNCIÓN EXCLUSIVA PARA ELIMINAR CON CONFIRMACIÓN ==========
// Esta función usa el modal de confirmación global de panel-admin.js
async function eliminarRecursoConConfirmacion(recursoId, recursoTitulo) {
    // Usar el modal global de confirmación
    const confirmado = await window.mostrarConfirmacion?.({
        titulo: "🗑️ Eliminar recurso",
        icono: "⚠️",
        mensaje: "¿Estás seguro de eliminar este recurso permanentemente?",
        nombre: recursoTitulo,
        tipo: "recurso",
        advertencia: "Esta acción no se puede deshacer."
    });
    
    // Fallback por si mostrarConfirmacion no está disponible globalmente
    const finalConfirmado = confirmado === undefined ? await mostrarConfirmacionFallback(recursoTitulo) : confirmado;
    
    if (!finalConfirmado) return false;
    
    try {
        window.mostrarToastExito?.("⏳ Eliminando recurso...");
        
        const docSnap = await coleccionRecursos.doc(recursoId).get();
        if (docSnap.exists) {
            const recursoData = docSnap.data();
            if (recursoData.public_id && typeof window.eliminarDeCloudinary === 'function') {
                await window.eliminarDeCloudinary(
                    recursoData.public_id,
                    recursoData.resource_type || 'image'
                );
            }
        }
        
        await coleccionRecursos.doc(recursoId).delete();
        window.mostrarToastExito?.("✓ Recurso eliminado correctamente");
        return true;
    } catch (error) {
        console.error("Error al eliminar:", error);
        window.mostrarToastError?.("❌ Error al eliminar el recurso");
        return false;
    }
}

// Fallback por si las funciones globales no están disponibles
async function mostrarConfirmacionFallback(nombreElemento) {
    return new Promise((resolve) => {
        let modal = document.getElementById("modalConfirmacionEliminarFallback");
        
        if (!modal) {
            const modalHTML = `
                <div id="modalConfirmacionEliminarFallback" class="modal-confirmacion">
                    <div class="modal-confirmacion-content">
                        <div class="modal-confirmacion-header">
                            <div class="modal-confirmacion-icon">⚠️</div>
                            <h3>Eliminar recurso</h3>
                        </div>
                        <div class="modal-confirmacion-body">
                            <p>¿Estás seguro de eliminar <strong>${escapeHtml(nombreElemento)}</strong>?</p>
                            <p style="color: #ef4444; font-size: 13px;">⚠️ Esta acción no se puede deshacer.</p>
                        </div>
                        <div class="modal-confirmacion-footer">
                            <button class="btn-confirmar-cancelar" id="btnFallbackNo">Cancelar</button>
                            <button class="btn-confirmar-aceptar" id="btnFallbackSi">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML("beforeend", modalHTML);
            modal = document.getElementById("modalConfirmacionEliminarFallback");
        }
        
        const nombreElem = modal.querySelector('.modal-confirmacion-body strong');
        if (nombreElem) nombreElem.textContent = nombreElemento;
        
        const btnSi = document.getElementById("btnFallbackSi");
        const btnNo = document.getElementById("btnFallbackNo");
        
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

// Función auxiliar escapeHtml por si acaso
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exportar funciones al scope global
window.eliminarRecursoConConfirmacion = eliminarRecursoConConfirmacion;