// js/historial-recibos.js - Historial de comprobantes

let historialRecibos = [];
let recibosFiltrados = [];

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Función para mostrar toast de éxito
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

// Función para mostrar toast de error
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

// Mostrar confirmación para eliminar comprobante
async function mostrarConfirmacionEliminarComprobante(folio) {
    return new Promise((resolve) => {
        let modal = document.getElementById("modalConfirmacionComprobante");
        
        if (!modal) {
            const modalHTML = `
                <div id="modalConfirmacionComprobante" class="modal-confirmacion">
                    <div class="modal-confirmacion-content">
                        <div class="modal-confirmacion-header">
                            <div class="modal-confirmacion-icon" style="font-size: 56px;">🧾</div>
                            <h3 style="margin: 0; font-size: 22px;">Eliminar comprobante</h3>
                        </div>
                        <div class="modal-confirmacion-body">
                            <p id="confirmacionComprobanteMensaje">¿Estás seguro de eliminar este comprobante?</p>
                            <div id="comprobanteNombre" style="background: #f1f5f9; padding: 12px; border-radius: 16px; margin: 16px 0 8px; font-weight: 600; color: #0f172a;"></div>
                            <p style="color: #ef4444; font-size: 13px;">⚠️ Esta acción no se puede deshacer.</p>
                        </div>
                        <div class="modal-confirmacion-footer">
                            <button class="btn-confirmar-cancelar" id="btnComprobanteNo" style="flex: 1; padding: 12px; border-radius: 40px;">
                                <span>✗</span> Cancelar
                            </button>
                            <button class="btn-confirmar-aceptar" id="btnComprobanteSi" style="flex: 1; padding: 12px; border-radius: 40px; background: linear-gradient(135deg, #ef4444, #dc2626);">
                                <span>🗑️</span> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML("beforeend", modalHTML);
            modal = document.getElementById("modalConfirmacionComprobante");
        }
        
        const mensajeElem = document.getElementById("confirmacionComprobanteMensaje");
        const nombreElem = document.getElementById("comprobanteNombre");
        const btnSi = document.getElementById("btnComprobanteSi");
        const btnNo = document.getElementById("btnComprobanteNo");
        
        mensajeElem.textContent = `¿Estás seguro de eliminar el comprobante?`;
        nombreElem.textContent = `🧾 ${folio}`;
        
        const cerrar = (resultado) => {
            modal.style.display = "none";
            resolve(resultado);
        };
        
        btnSi.onclick = () => cerrar(true);
        btnNo.onclick = () => cerrar(false);
        
        modal.onclick = (e) => {
            if (e.target === modal) cerrar(false);
        };
        
        modal.style.display = "flex";
    });
}

// Eliminar del historial (y de Cloudinary)
async function eliminarReciboHistorial(id) {
    try {
        const doc = await coleccionHistorialRecibos.doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            if (data.public_id && typeof window.eliminarDeCloudinary === 'function') {
                await window.eliminarDeCloudinary(data.public_id, 'image');
            }
        }
    } catch (e) {
        console.warn('⚠️ No se pudo eliminar de Cloudinary:', e);
    }
    await coleccionHistorialRecibos.doc(id).delete();
}

// Cargar historial desde Firestore
async function cargarHistorialRecibos() {
    const tbody = document.getElementById('historialTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">📜 Cargando historial...<\/td><\/tr>';
    
    try {
        const snapshot = await coleccionHistorialRecibos.orderBy('fecha_creacion', 'desc').get();
        historialRecibos = [];
        snapshot.forEach(doc => {
            historialRecibos.push({ id: doc.id, ...doc.data() });
        });
        
        recibosFiltrados = [...historialRecibos];
        renderizarHistorial();
        
    } catch (error) {
        console.error("Error cargando historial:", error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">❌ Error al cargar historial<\/td><\/tr>';
    }
}

// Renderizar tabla de historial
function renderizarHistorial() {
    const tbody = document.getElementById('historialTableBody');
    if (!tbody) return;
    
    if (recibosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">📭 No hay comprobantes registrados<\/td><\/tr>';
        return;
    }
    
    tbody.innerHTML = recibosFiltrados.map(recibo => `
        <tr>
            <td><strong>REC-${recibo.numero}</strong><\/td>
            <td>${escapeHtml(recibo.juvenil)}<\/td>
            <td>${escapeHtml(recibo.concepto)}<\/td>
            <td>Q ${parseFloat(recibo.monto).toFixed(2)}<\/td>
            <td>${recibo.fecha}<br><small>${recibo.hora}<\/small><\/td>
            <td>
                <a href="${recibo.url}" target="_blank" class="btn-ver" style="padding: 4px 8px; font-size: 11px; display: inline-block; background: #0891b2; color: white; border-radius: 6px; text-decoration: none;">👁️ Ver</a>
                <button class="btn-descargar-recibo" data-url="${recibo.url}" data-folio="REC-${recibo.numero}" style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; margin-left: 5px;">⬇️</button>
                <button class="btn-eliminar-recibo" data-id="${recibo.id}" data-folio="REC-${recibo.numero}" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; margin-left: 5px;">🗑️</button>
            <\/td>
        <\/tr>
    `).join("");
    
    // Eventos de descarga
    document.querySelectorAll('.btn-descargar-recibo').forEach(btn => {
        btn.onclick = async () => {
            const url = btn.dataset.url;
            const folio = btn.dataset.folio;
            descargarComprobante(url, folio);
        };
    });
    
    // Eventos de eliminar con confirmación mejorada
    document.querySelectorAll('.btn-eliminar-recibo').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const folio = btn.dataset.folio;
            
            const confirmado = await mostrarConfirmacionEliminarComprobante(folio);
            if (!confirmado) return;
            
            try {
                await eliminarReciboHistorial(id);
                await cargarHistorialRecibos();
                mostrarToastExito("✓ Comprobante eliminado del historial");
            } catch (error) {
                mostrarToastError("❌ Error al eliminar el comprobante");
            }
        };
    });
}

// Descargar comprobante
async function descargarComprobante(url, folio) {
    try {
        mostrarToastExito(`📥 Descargando ${folio}...`);
        const response = await fetch(url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${folio}.png`;
        link.click();
        URL.revokeObjectURL(link.href);
        mostrarToastExito(`✓ ${folio} descargado`);
    } catch (error) {
        console.error(error);
        mostrarToastError("❌ Error al descargar");
    }
}

// Guardar comprobante en historial
async function guardarComprobanteHistorial(datos) {
    const recibo = {
        numero: datos.numero,
        juvenil: datos.juvenil,
        concepto: datos.concepto,
        monto: datos.monto,
        fecha: datos.fecha,
        hora: datos.hora,
        url: datos.url,
        public_id: datos.public_id || '',
        fecha_creacion: new Date().toISOString()
    };
    
    await coleccionHistorialRecibos.add(recibo);
    console.log("✓ Comprobante guardado en historial");
}

// Filtrar historial
function filtrarHistorial() {
    const busqueda = document.getElementById('buscarRecibo')?.value.toLowerCase() || '';
    const fechaFiltro = document.getElementById('filtroFecha')?.value || '';
    
    recibosFiltrados = historialRecibos.filter(recibo => {
        let coincide = true;
        
        if (busqueda) {
            coincide = `REC-${recibo.numero}`.toLowerCase().includes(busqueda) ||
                       recibo.juvenil?.toLowerCase().includes(busqueda) ||
                       recibo.concepto?.toLowerCase().includes(busqueda);
        }
        
        if (fechaFiltro && coincide) {
            coincide = recibo.fecha === fechaFiltro;
        }
        
        return coincide;
    });
    
    renderizarHistorial();
}

// Exportar a Excel
function exportarHistorialExcel() {
    if (recibosFiltrados.length === 0) {
        mostrarToastError("❌ No hay datos para exportar");
        return;
    }
    
    let csv = "Folio,Juvenil,Concepto,Monto,Fecha,Hora,URL\n";
    recibosFiltrados.forEach(recibo => {
        csv += `"REC-${recibo.numero}","${recibo.juvenil || ''}","${recibo.concepto || ''}",${recibo.monto || 0},"${recibo.fecha || ''}","${recibo.hora || ''}","${recibo.url || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'historial_comprobantes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    mostrarToastExito("✓ Historial exportado");
}

// Eventos
document.addEventListener('DOMContentLoaded', () => {
    const buscarInput = document.getElementById('buscarRecibo');
    const filtroFecha = document.getElementById('filtroFecha');
    const btnExportar = document.getElementById('btnExportarHistorial');
    
    if (buscarInput) buscarInput.addEventListener('input', filtrarHistorial);
    if (filtroFecha) filtroFecha.addEventListener('change', filtrarHistorial);
    if (btnExportar) btnExportar.onclick = exportarHistorialExcel;
});

// Exportar funciones
window.cargarHistorialRecibos = cargarHistorialRecibos;
window.guardarComprobanteHistorial = guardarComprobanteHistorial;