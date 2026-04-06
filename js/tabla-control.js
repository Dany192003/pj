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

// Crear modal de confirmación personalizado
function crearModalConfirmacion() {
    if (document.getElementById("modalConfirmacion")) return;
    
    const modalHTML = `
        <div id="modalConfirmacion" class="modal-confirmacion">
            <div class="modal-confirmacion-content">
                <div class="modal-confirmacion-header">
                    <span class="modal-confirmacion-icon" id="confirmacionIcono">⚠️</span>
                    <h3 id="confirmacionTitulo">Confirmar cambio</h3>
                </div>
                <div class="modal-confirmacion-body">
                    <p id="confirmacionMensaje">¿Estás seguro de realizar esta acción?</p>
                </div>
                <div class="modal-confirmacion-footer">
                    <button class="btn-confirmar-cancelar" id="btnConfirmarNo">Cancelar</button>
                    <button class="btn-confirmar-aceptar" id="btnConfirmarSi">Aceptar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// Mostrar modal de confirmación
function mostrarConfirmacion(mensaje, titulo = "Confirmar acción", icono = "⚠️") {
    return new Promise((resolve) => {
        crearModalConfirmacion();
        
        const modal = document.getElementById("modalConfirmacion");
        const tituloElem = document.getElementById("confirmacionTitulo");
        const mensajeElem = document.getElementById("confirmacionMensaje");
        const iconoElem = document.getElementById("confirmacionIcono");
        const btnSi = document.getElementById("btnConfirmarSi");
        const btnNo = document.getElementById("btnConfirmarNo");
        
        tituloElem.textContent = titulo;
        mensajeElem.innerHTML = mensaje; // Usar innerHTML para que renderice <strong>
        iconoElem.textContent = icono;
        
        const cerrar = (resultado) => {
            modal.style.display = "none";
            resolve(resultado);
        };
        
        btnSi.onclick = () => cerrar(true);
        btnNo.onclick = () => cerrar(false);
        
        modal.onclick = (e) => {
            if (e.target === modal) cerrar(false);
        };
        
        modal.style.display = "block";
    });
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
    
    // Usar innerHTML para que renderice las etiquetas <strong>
    const mensajeHtml = `¿Estás seguro de ${accion} el pago de <strong>${grupo}</strong> para el mes de <strong>${mes}</strong>?`;
    
    const confirmado = await mostrarConfirmacion(mensajeHtml, titulo, icono);
    
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
        window.showToast(`${nuevoEstado === "pagado" ? "✓ Pagado" : "✗ Pendiente"} - ${grupo} - ${mes}`, false);
        
    } catch (error) {
        console.error("Error al guardar:", error);
        btn.classList.remove(nuevaClase);
        btn.classList.add(estadoActual === "pagado" ? "status-pagado" : "status-pendiente");
        btn.innerHTML = estadoActual === "pagado" ? "✓" : "✗";
        btn.dataset.estado = estadoActual;
        window.showToast("❌ Error al guardar el cambio", true);
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