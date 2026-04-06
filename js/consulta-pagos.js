// js/consulta-pagos.js - Consulta de pagos por grupo

let grupoSeleccionado = null;
let anioSeleccionado = 2026;

window.showToast = function(message, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) { console.log(message); return; }
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#dc2626" : "#10b981";
    toast.className = "toast show";
    setTimeout(() => { toast.className = "toast"; }, 2000);
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadDatabase();
    
    cargarListaGrupos();
    
    const btnVolver = document.getElementById("btnVolver");
    if (btnVolver) btnVolver.onclick = () => window.location.href = "index.html";
    
    const modal = document.getElementById("passwordModal");
    const closeBtn = document.getElementById("closePasswordModal");
    const btnVerificar = document.getElementById("btnVerificarPassword");
    const passwordInput = document.getElementById("grupoPassword");
    const passwordError = document.getElementById("passwordError");
    
    // Selector de año
    const anioSelector = document.getElementById("anioSelector");
    if (anioSelector) {
        anioSelector.onchange = () => {
            anioSeleccionado = parseInt(anioSelector.value);
            mostrarPagosGrupo(grupoSeleccionado);
        };
    }
    
    // Botón volver a grupos
    const btnBackToGroups = document.getElementById("btnBackToGroups");
    if (btnBackToGroups) {
        btnBackToGroups.onclick = () => {
            document.getElementById("pagosView").style.display = "none";
            document.getElementById("gruposList").style.display = "grid";
        };
    }
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = "none";
            passwordInput.value = "";
            passwordError.textContent = "";
        };
    }
    
    if (btnVerificar) {
        btnVerificar.onclick = async () => {
            const password = passwordInput.value;
            if (typeof window.verificarContraseñaGrupo === 'function') {
                const esValido = await window.verificarContraseñaGrupo(grupoSeleccionado, password);
                if (esValido) {
                    modal.style.display = "none";
                    mostrarPagosGrupo(grupoSeleccionado);
                    passwordInput.value = "";
                    passwordError.textContent = "";
                } else {
                    passwordError.textContent = "Contraseña incorrecta";
                }
            } else {
                passwordError.textContent = "Error al verificar contraseña";
            }
        };
    }
    
    if (passwordInput) {
        passwordInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && btnVerificar) btnVerificar.click();
        });
    }
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
            passwordInput.value = "";
            passwordError.textContent = "";
        }
    };
});

function cargarListaGrupos() {
    const gruposList = document.getElementById("gruposList");
    if (!gruposList) return;
    
    const gruposOrdenados = [...GRUPOS].sort();
    gruposList.innerHTML = gruposOrdenados.map(grupo => `
        <div class="grupo-card" data-grupo="${grupo}">
            <div class="grupo-nombre">👥 ${grupo}</div>
            <div class="grupo-info">
                <span>🔒</span> Click para consultar
            </div>
        </div>
    `).join("");
    
    document.querySelectorAll('.grupo-card').forEach(card => {
        card.addEventListener('click', () => {
            grupoSeleccionado = card.dataset.grupo;
            const modal = document.getElementById("passwordModal");
            if (modal) modal.style.display = "block";
        });
    });
}

function mostrarPagosGrupo(grupo) {
    const pagosView = document.getElementById("pagosView");
    const gruposList = document.getElementById("gruposList");
    const grupoTitle = document.getElementById("grupoSeleccionadoTitle");
    const pagosBody = document.getElementById("pagosTableBody");
    const resumenDiv = document.getElementById("resumenPagos");
    
    if (!db[anioSeleccionado]) {
        window.showToast(`No hay datos de pagos para el año ${anioSeleccionado}`, true);
        return;
    }
    
    const pagosGrupo = db[anioSeleccionado].filter(p => p.grupo === grupo);
    
    if (pagosGrupo.length === 0) {
        window.showToast(`No hay datos de pagos para ${grupo} en ${anioSeleccionado}`, true);
        return;
    }
    
    // Ordenar por mes (enero a diciembre)
    const mesesOrdenados = [...MESES];
    pagosGrupo.sort((a, b) => mesesOrdenados.indexOf(a.mes) - mesesOrdenados.indexOf(b.mes));
    
    if (grupoTitle) grupoTitle.innerHTML = `📋 Pagos - ${grupo} - Año ${anioSeleccionado}`;
    
    // Contar pagados y pendientes
    const pagados = pagosGrupo.filter(p => p.estado === "pagado").length;
    const pendientes = pagosGrupo.filter(p => p.estado === "pendiente").length;
    const total = pagosGrupo.length;
    const porcentaje = total > 0 ? Math.round((pagados / total) * 100) : 0;
    
    if (resumenDiv) {
        resumenDiv.innerHTML = `
            📊 <span>${pagados}</span> meses pagados de <span>${total}</span> (${porcentaje}%)<br>
            ${pendientes > 0 ? `⏳ <span>${pendientes}</span> meses pendientes` : '🎉 ¡Todos los meses están pagados!'}
        `;
    }
    
    if (pagosBody) {
        pagosBody.innerHTML = pagosGrupo.map(p => `
            <tr>
                <td style="font-weight: 600; text-align: left;">${p.mes}</td>
                <td>
                    <span class="${p.estado === 'pagado' ? 'status-pagado' : 'status-pendiente'}">
                        ${p.estado === 'pagado' ? '✓ Pagado' : '⏳ Pendiente'}
                    </span>
                </td>
            </tr>
        `).join("");
    }
    
    if (gruposList) gruposList.style.display = "none";
    if (pagosView) pagosView.style.display = "block";
}