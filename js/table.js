// js/table.js - Tabla de control (versión corregida)

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

function renderTabla() {
    if (!db[anioSeleccionado]) {
        asegurarDBCloud(anioSeleccionado);
    }
    
    const dataAnio = db[anioSeleccionado] || [];
    const thead = document.getElementById("tableHeader");
    const tbody = document.getElementById("tableBody");
    
    if (!thead || !tbody) return;
    
    thead.innerHTML = `<th>👥 Juvenil</th>${MESES.map(m => `<th>${m.substring(0, 3)}</th>`).join("")}`;
    
    // Usar GRUPOS para asegurar que TODOS aparezcan
    const gruposOrdenados = [...GRUPOS].sort();
    
    tbody.innerHTML = gruposOrdenados.map(grupo => {
        let fila = `<td style="text-align:left; font-weight:700; background:#f8fafc;">${grupo}<\/td>`;
        
        MESES.forEach(mes => {
            const registro = dataAnio.find(p => p.grupo === grupo && p.mes === mes);
            const estaPagado = registro?.estado === "pagado";
            
            fila += `<td style="text-align:center;">
                        <button class="status-btn ${estaPagado ? 'status-pagado' : 'status-pendiente'}" 
                                onclick="window.toggleStatus('${grupo}', '${mes}')">
                            ${estaPagado ? '✓' : '✗'}
                        </button>
                     <\/td>`;
        });
        
        return `<tr>${fila}<\/tr>`;
    }).join("");
}

function toggleStatus(grupo, mes) {
    if (!db[anioSeleccionado]) {
        asegurarDBCloud(anioSeleccionado);
    }
    
    let record = db[anioSeleccionado].find(p => p.grupo === grupo && p.mes === mes);
    
    if (!record) {
        db[anioSeleccionado].push({ grupo: grupo, mes: mes, estado: "pendiente" });
        record = db[anioSeleccionado].find(p => p.grupo === grupo && p.mes === mes);
    }
    
    const nuevoEstado = record.estado === "pagado" ? "pendiente" : "pagado";
    record.estado = nuevoEstado;
    
    const docId = `${anioSeleccionado}_${grupo}_${mes}`;
    coleccionPagos.doc(docId).set({ 
        anio: anioSeleccionado, 
        grupo: grupo, 
        mes: mes, 
        estado: nuevoEstado 
    }).then(() => {
        saveDatabaseLocal();
        renderTabla();
        window.showToast(`${nuevoEstado === "pagado" ? "✓ Pagado" : "✗ Pendiente"} - ${grupo} - ${mes}`, false);
    }).catch(error => {
        console.error("Error:", error);
        window.showToast("❌ Error al guardar", true);
    });
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