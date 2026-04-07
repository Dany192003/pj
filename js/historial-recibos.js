// js/historial-recibos.js - Historial de comprobantes

let historialRecibos = [];
let recibosFiltrados = [];

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
                <a href="${recibo.url}" target="_blank" class="btn-ver" style="padding: 4px 8px; font-size: 11px; display: inline-block;">👁️ Ver</a>
                <button class="btn-descargar-recibo" data-url="${recibo.url}" data-folio="REC-${recibo.numero}" style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; margin-left: 5px;">⬇️</button>
                <button class="btn-eliminar-recibo" data-id="${recibo.id}" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; margin-left: 5px;">🗑️</button>
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
    
    // Eventos de eliminar
    document.querySelectorAll('.btn-eliminar-recibo').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            if (confirm("¿Eliminar este comprobante del historial?")) {
                await eliminarReciboHistorial(id);
                await cargarHistorialRecibos();
                window.showToast("✓ Comprobante eliminado del historial", false);
            }
        };
    });
}

// Guardar comprobante en historial (se llama después de generar un recibo)
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

// Descargar comprobante
async function descargarComprobante(url, folio) {
    try {
        window.showToast(`📥 Descargando ${folio}...`, false);
        const response = await fetch(url);
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${folio}.png`;
        link.click();
        URL.revokeObjectURL(link.href);
        window.showToast(`✓ ${folio} descargado`, false);
    } catch (error) {
        console.error(error);
        window.showToast("❌ Error al descargar", true);
    }
}

// Eliminar del historial (y de Cloudinary si tiene public_id)
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
        window.showToast("❌ No hay datos para exportar", true);
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
    window.showToast("✓ Historial exportado", false);
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