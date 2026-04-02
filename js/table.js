// js/table.js - Tabla de control

if (typeof window.showToast !== 'function') {
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
    
    const gruposUnicos = [...new Set(dataAnio.map(p => p.grupo))].sort();
    
    tbody.innerHTML = gruposUnicos.map(g => {
        let fila = `<td style="text-align:left; font-weight:700;">${g}<\/td>`;
        MESES.forEach(m => {
            const r = dataAnio.find(p => p.grupo === g && p.mes === m);
            const isP = r?.estado === "pagado";
            fila += `<td><button class="status-btn ${isP ? 'status-pagado' : 'status-pendiente'}" onclick="window.toggleStatus('${g}', '${m}')">${isP ? '✓' : '✗'}</button><\/td>`;
        });
        return `<tr>${fila}<\/tr>`;
    }).join("");
}

function toggleStatus(grupo, mes) {
    if (!db[anioSeleccionado]) asegurarDBCloud(anioSeleccionado);
    
    const record = db[anioSeleccionado].find(p => p.grupo === grupo && p.mes === mes);
    if (record) {
        const nuevoEstado = record.estado === "pagado" ? "pendiente" : "pagado";
        record.estado = nuevoEstado;
        saveDatabase();
        renderTabla();
        window.showToast(`${nuevoEstado === "pagado" ? "✓ Pagado" : "✗ Pendiente"} - ${grupo} - ${mes}`);
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