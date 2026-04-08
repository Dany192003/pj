// js/tabla-control.js - Tabla de control (con modal de confirmación personalizado)

if (typeof window.showToast !== 'function') {
    window.showToast = function(message, isError = false) {
        const toast = document.getElementById("toast");
        if (!toast) { console.log(message); return; }
        toast.textContent = message;
        toast.style.backgroundColor = isError ? "#dc2626" : "#10b981";
        toast.className = "toast show";
        setTimeout(() => { toast.className = "toast"; }, 2000);
    };
}

let anioSeleccionado = new Date().getFullYear();

// ========== MODAL DE CONFIRMACIÓN PARA TABLA DE CONTROL ==========
function mostrarConfirmacionTabla(opciones) {
    return new Promise((resolve) => {
        let modal = document.getElementById("modalConfirmacionTabla");
        
        if (!modal) {
            const modalHTML = `
                <div id="modalConfirmacionTabla" class="modal-confirmacion">
                    <div class="modal-confirmacion-content">
                        <div class="modal-confirmacion-header">
                            <div class="modal-confirmacion-icon" id="confirmacionTablaIcono">⚠️</div>
                            <h3 id="confirmacionTablaTitulo">Confirmar acción</h3>
                        </div>
                        <div class="modal-confirmacion-body" id="confirmacionTablaBody">
                            <p id="confirmacionTablaMensaje">¿Estás seguro de realizar esta acción?</p>
                        </div>
                        <div class="modal-confirmacion-footer">
                            <button class="btn-confirmar-cancelar" id="btnTablaNo">
                                <span>✗</span> Cancelar
                            </button>
                            <button class="btn-confirmar-aceptar" id="btnTablaSi">
                                <span>✓</span> Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML("beforeend", modalHTML);
            modal = document.getElementById("modalConfirmacionTabla");
        }
        
        const tituloElem = document.getElementById("confirmacionTablaTitulo");
        const mensajeElem = document.getElementById("confirmacionTablaMensaje");
        const iconoElem = document.getElementById("confirmacionTablaIcono");
        const bodyElem = document.getElementById("confirmacionTablaBody");
        const btnSi = document.getElementById("btnTablaSi");
        const btnNo = document.getElementById("btnTablaNo");
        
        tituloElem.textContent = opciones.titulo || "Confirmar acción";
        iconoElem.textContent = opciones.icono || "⚠️";
        
        // Limpiar elementos adicionales
        const extras = bodyElem.querySelectorAll(".info-adicional");
        extras.forEach(el => el.remove());
        
        let mensajeHTML = `<p>${opciones.mensaje}</p>`;
        
        if (opciones.grupo && opciones.mes) {
            mensajeHTML = `
                <p>${opciones.mensaje}</p>
                <div class="info-adicional" style="background: #f1f5f9; padding: 12px; border-radius: 16px; margin: 12px 0; text-align: center;">
                    <div style="font-weight: 700; color: #0891b2;">👥 ${escapeHtml(opciones.grupo)}</div>
                    <div style="font-size: 13px; color: #475569;">📅 ${opciones.mes}</div>
                </div>
            `;
        }
        
        if (opciones.advertencia) {
            mensajeHTML += `<p style="color: #f97316; font-size: 13px; margin-top: 12px;">⚠️ ${opciones.advertencia}</p>`;
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
function mostrarToastExitoTabla(mensaje) {
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

function mostrarToastErrorTabla(mensaje) {
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderTabla() {
    if (!db[anioSeleccionado]) {
        asegurarDBCloud(anioSeleccionado);
    }
    
    const dataAnio = db[anioSeleccionado] || [];
    const thead = document.getElementById("tableHeader");
    const tbody = document.getElementById("tableBody");
    
    if (!thead || !tbody) return;
    
    thead.innerHTML = `<th>👥 Juvenil</th>${MESES.map(m => `<th>${m.substring(0, 3)}</th>`).join("")}`;
    
    const gruposOrdenados = [...GRUPOS].sort();
    
    tbody.innerHTML = gruposOrdenados.map(grupo => {
        let fila = `<td style="text-align:left; font-weight:700; background:#f8fafc;">${grupo}<\/td>`;
        
        MESES.forEach(mes => {
            const registro = dataAnio.find(p => p.grupo === grupo && p.mes === mes);
            const estaPagado = registro?.estado === "pagado";
            
            fila += `<td style="text-align:center;">
                        <button class="status-btn ${estaPagado ? 'status-pagado' : 'status-pendiente'}" 
                                data-grupo="${grupo}" 
                                data-mes="${mes}"
                                data-estado="${estaPagado ? 'pagado' : 'pendiente'}">
                            ${estaPagado ? '✓' : '✗'}
                        </button>
                     <\/td>`;
        });
        
        return `<tr>${fila}<\/tr>`;
    }).join("");
    
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.removeEventListener('click', handleStatusClick);
        btn.addEventListener('click', handleStatusClick);
    });
}

// Manejador de clic en botón de estado
async function handleStatusClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const grupo = btn.dataset.grupo;
    const mes = btn.dataset.mes;
    const estadoActual = btn.dataset.estado;
    const nuevoEstado = estadoActual === "pagado" ? "pendiente" : "pagado";
    const nuevoTexto = nuevoEstado === "pagado" ? "✓" : "✗";
    const nuevaClase = nuevoEstado === "pagado" ? "status-pagado" : "status-pendiente";
    
    const accion = nuevoEstado === "pagado" ? "marcar como PAGADO" : "marcar como PENDIENTE";
    const icono = nuevoEstado === "pagado" ? "✅" : "⏳";
    const titulo = nuevoEstado === "pagado" ? "Confirmar pago" : "Confirmar cambio";
    
    // Construir mensaje correctamente
    const mensaje = `¿Estás seguro de ${accion} el pago de <strong>${grupo}</strong> para el mes de <strong>${mes}</strong>?`;
    
    const confirmado = await mostrarConfirmacionTabla({
        titulo: titulo,
        icono: icono,
        mensaje: mensaje,
        grupo: grupo,
        mes: mes,
        advertencia: "Esta acción modificará el registro de pagos."
    });
    
    if (!confirmado) return;
    
    btn.innerHTML = '<span class="spinner-small"></span>';
    btn.disabled = true;
    
    try {
        btn.classList.remove(estadoActual === "pagado" ? "status-pagado" : "status-pendiente");
        btn.classList.add(nuevaClase);
        btn.innerHTML = nuevoTexto;
        btn.dataset.estado = nuevoEstado;
        
        if (!db[anioSeleccionado]) {
            await asegurarDBCloud(anioSeleccionado);
        }
        
        let record = db[anioSeleccionado].find(p => p.grupo === grupo && p.mes === mes);
        
        if (!record) {
            db[anioSeleccionado].push({ grupo: grupo, mes: mes, estado: nuevoEstado });
            record = db[anioSeleccionado].find(p => p.grupo === grupo && p.mes === mes);
        } else {
            record.estado = nuevoEstado;
        }
        
        const docId = `${anioSeleccionado}_${grupo}_${mes}`;
        await coleccionPagos.doc(docId).set({ 
            anio: anioSeleccionado, 
            grupo: grupo, 
            mes: mes, 
            estado: nuevoEstado 
        });
        
        saveDatabaseLocal();
        mostrarToastExitoTabla(`${nuevoEstado === "pagado" ? "✓ Pagado" : "✗ Pendiente"} - ${grupo} - ${mes}`);
        
    } catch (error) {
        console.error("Error al guardar:", error);
        btn.classList.remove(nuevaClase);
        btn.classList.add(estadoActual === "pagado" ? "status-pagado" : "status-pendiente");
        btn.innerHTML = estadoActual === "pagado" ? "✓" : "✗";
        btn.dataset.estado = estadoActual;
        mostrarToastErrorTabla("❌ Error al guardar el cambio");
    } finally {
        btn.disabled = false;
    }
}

function toggleStatus(grupo, mes) {
    const btn = document.querySelector(`.status-btn[data-grupo="${grupo}"][data-mes="${mes}"]`);
    if (btn) {
        btn.click();
    }
}

function cambiarAnioControl() {
    anioSeleccionado = parseInt(document.getElementById("selectAnioControl").value);
    renderTabla();
}

function initYearSelect() {
    const sel = document.getElementById("selectAnioControl");
    if (!sel) return;
    sel.innerHTML = "";
    for (let i = 2024; i <= 2030; i++) {
        const o = document.createElement("option");
        o.value = i;
        o.textContent = i;
        sel.appendChild(o);
    }
    sel.value = anioSeleccionado;
}

// Agregar estilos para toasts si no existen
if (!document.querySelector('#toastStylesTabla')) {
    const style = document.createElement('style');
    style.id = 'toastStylesTabla';
    style.textContent = `
        .toast-exito, .toast-error {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            padding: 12px 20px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 13px;
            z-index: 2001;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease;
        }
        .toast-exito {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
        }
        .toast-error {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
        }
        .toast-exito.show, .toast-error.show {
            transform: translateX(-50%) translateY(0);
        }
        .spinner-small {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}