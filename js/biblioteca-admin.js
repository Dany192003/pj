// js/biblioteca-admin.js - Gestión de biblioteca

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Función para mostrar modal de confirmación mejorado
async function mostrarConfirmacionEliminar(titulo, nombreElemento, tipo = "recurso") {
    return new Promise((resolve) => {
        let modal = document.getElementById("modalConfirmacionEliminar");
        
        if (!modal) {
            const modalHTML = `
                <div id="modalConfirmacionEliminar" class="modal-confirmacion">
                    <div class="modal-confirmacion-content">
                        <div class="modal-confirmacion-header">
                            <div class="modal-confirmacion-icon" id="confirmacionEliminarIcono">🗑️</div>
                            <h3 id="confirmacionEliminarTitulo">Eliminar</h3>
                        </div>
                        <div class="modal-confirmacion-body" id="confirmacionEliminarBody">
                            <p id="confirmacionEliminarMensaje">¿Estás seguro?</p>
                        </div>
                        <div class="modal-confirmacion-footer">
                            <button class="btn-confirmar-cancelar" id="btnEliminarNo">
                                <span>✗</span> Cancelar
                            </button>
                            <button class="btn-confirmar-aceptar" id="btnEliminarSi">
                                <span>🗑️</span> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML("beforeend", modalHTML);
            modal = document.getElementById("modalConfirmacionEliminar");
        }
        
        const tituloElem = document.getElementById("confirmacionEliminarTitulo");
        const mensajeElem = document.getElementById("confirmacionEliminarMensaje");
        const iconoElem = document.getElementById("confirmacionEliminarIcono");
        const bodyElem = document.getElementById("confirmacionEliminarBody");
        const btnSi = document.getElementById("btnEliminarSi");
        const btnNo = document.getElementById("btnEliminarNo");
        
        tituloElem.textContent = titulo || "🗑️ Eliminar recurso";
        iconoElem.textContent = "⚠️";
        
        const extras = bodyElem.querySelectorAll(".nombre-elemento");
        extras.forEach(el => el.remove());
        
        let mensajeHTML = `<p>${mensajeElem.textContent}</p>`;
        
        if (nombreElemento) {
            mensajeHTML = `<p>¿Estás seguro de eliminar <strong>${escapeHtml(nombreElemento)}</strong>?</p>`;
            mensajeHTML += `<div class="nombre-elemento" style="background: #f1f5f9; padding: 12px; border-radius: 16px; margin: 12px 0; font-weight: 600; color: #0f172a; word-break: break-word;">📄 ${escapeHtml(nombreElemento)}</div>`;
            mensajeHTML += `<p style="color: #ef4444; font-size: 13px;">⚠️ Esta acción no se puede deshacer.</p>`;
        }
        
        mensajeElem.innerHTML = mensajeHTML;
        
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

// Eliminar recurso con confirmación
async function eliminarRecursoConConfirmacion(recursoId, recursoTitulo) {
    const confirmado = await mostrarConfirmacionEliminar(
        "🗑️ Eliminar recurso",
        recursoTitulo,
        "recurso"
    );
    
    if (!confirmado) return false;
    
    try {
        mostrarToastExito("⏳ Eliminando recurso...");
        
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
        mostrarToastExito("✓ Recurso eliminado correctamente");
        return true;
    } catch (error) {
        console.error("Error al eliminar:", error);
        mostrarToastError("❌ Error al eliminar el recurso");
        return false;
    }
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
            recursosTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">📭 No hay recursos disponibles<\/td><\/tr>';
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
                    <td><strong>${escapeHtml(recurso.titulo)}<\/strong><\/td>
                    <td><span class="categoria-badge">${categoriaDisplay}<\/span><\/td>
                    <td>${desc}<\/td>
                    <td><span style="font-size: 12px; color: #64748b;">📅 ${formatearFechaAdmin(recurso.fecha)}<\/span><\/td>
                    <td>
                        <a href="${recurso.url}" target="_blank" class="btn-ver" style="display: inline-block; padding: 4px 8px; background: #0891b2; color: white; border-radius: 6px; text-decoration: none; font-size: 11px;">👁️ Ver</a>
                        <button class="btn-eliminar-recurso" data-id="${recurso.id}" data-titulo="${escapeHtml(recurso.titulo)}" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; margin-left: 5px;">🗑️ Eliminar</button>
                    <\/td>
                <\/tr>
            `;
        }).join("");
        
        document.querySelectorAll('.btn-eliminar-recurso').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const titulo = btn.dataset.titulo;
                const eliminado = await eliminarRecursoConConfirmacion(id, titulo);
                if (eliminado) {
                    await cargarRecursosAdmin();
                }
            };
        });
        
    } catch (error) {
        console.error("Error cargando recursos:", error);
        recursosTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">❌ Error al cargar recursos<\/td><\/tr>';
    }
}

// Exportar funciones
window.cargarRecursosAdmin = cargarRecursosAdmin;
window.eliminarRecursoConConfirmacion = eliminarRecursoConConfirmacion;