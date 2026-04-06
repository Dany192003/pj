// js/biblioteca-admin.js - Gestión de biblioteca (simplificado)

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Eliminar recurso
async function eliminarRecursoCloud(recursoId) {
    console.log("🗑️ Eliminando recurso:", recursoId);
    await coleccionRecursos.doc(recursoId).delete();
    console.log("✓ Recurso eliminado de Firestore");
    window.showToast("✓ Recurso eliminado", false);
}

// Cargar recursos admin
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
            recursosTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">📭 No hay recursos disponibles</td></tr>';
            return;
        }
        
        function formatearFechaAdmin(fechaISO) {
            if (!fechaISO) return 'Fecha no disponible';
            return new Date(fechaISO).toLocaleDateString('es-GT', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        }
        
        recursosTableBody.innerHTML = recursos.map(recurso => {
            const categoria = categoriasMap[recurso.categoria];
            const categoriaDisplay = categoria ? `${categoria.icono} ${categoria.nombre}` : '📁 Sin categoría';
            const desc = recurso.descripcion 
                ? escapeHtml(recurso.descripcion.substring(0, 60)) + (recurso.descripcion.length > 60 ? '...' : '')
                : '-';
            return `
                <tr>
                    <td><strong>${escapeHtml(recurso.titulo)}</strong></td>
                    <td><span class="categoria-badge">${categoriaDisplay}</span></td>
                    <td>${desc}</td>
                    <td><span style="font-size: 12px; color: #64748b;">📅 ${formatearFechaAdmin(recurso.fecha)}</span></td>
                    <td>
                        <a href="${recurso.url}" target="_blank" class="btn-ver">👁️ Ver</a>
                        <button class="btn-eliminar-recurso" data-id="${recurso.id}">🗑️ Eliminar</button>
                    </td>
                </tr>
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
        recursosTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">❌ Error al cargar recursos</td></tr>';
    }
}

// Exportar funciones
window.cargarRecursosAdmin = cargarRecursosAdmin;
window.eliminarRecursoCloud = eliminarRecursoCloud;