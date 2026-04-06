// js/consulta-tabla-horizontal.js - Consulta de pagos en tabla horizontal

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
    
    const btnVolver = document.getElementById("btnVolver");
    if (btnVolver) btnVolver.onclick = () => window.location.href = "index.html";
    
    const btnCerrarTabla = document.getElementById("btnCerrarTabla");
    if (btnCerrarTabla) {
        btnCerrarTabla.onclick = () => {
            document.getElementById("pagosView").style.display = "none";
        };
    }
    
    // Selector de año
    const anioSelector = document.getElementById("anioSelector");
    if (anioSelector) {
        anioSelector.onchange = () => {
            anioSeleccionado = parseInt(anioSelector.value);
            if (document.getElementById("pagosView").style.display === "block") {
                cargarTablaPagos();
            }
        };
    }
    
    // Modal de contraseña
    const modal = document.getElementById("passwordModal");
    const closeBtn = document.getElementById("closePasswordModal");
    const btnVerificar = document.getElementById("btnVerificarAdmin");
    const passwordInput = document.getElementById("adminPassword");
    const passwordError = document.getElementById("passwordError");
    
    // Botón para ver tabla (desde algún lugar, o automático al cargar)
    // Aquí mostramos la tabla directamente si se quiere, o con un botón
    mostrarTablaPagos();
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = "none";
            passwordInput.value = "";
            passwordError.textContent = "";
        };
    }
    
    if (btnVerificar) {
        btnVerificar.onclick = () => {
            const password = passwordInput.value;
            if (password === "pastoral2026") {
                modal.style.display = "none";
                cargarTablaPagos();
                passwordInput.value = "";
                passwordError.textContent = "";
            } else {
                passwordError.textContent = "Contraseña incorrecta";
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

function mostrarTablaPagos() {
    // Mostrar modal de contraseña primero
    const modal = document.getElementById("passwordModal");
    if (modal) modal.style.display = "block";
}

function cargarTablaPagos() {
    const pagosView = document.getElementById("pagosView");
    const anioMostrado = document.getElementById("anioMostrado");
    const tableHeader = document.getElementById("tableHeader");
    const tableBody = document.getElementById("tableBody");
    
    if (!db[anioSeleccionado]) {
        window.showToast(`No hay datos para el año ${anioSeleccionado}`, true);
        return;
    }
    
    if (anioMostrado) anioMostrado.textContent = anioSeleccionado;
    
    // Generar encabezado con los meses
    const mesesAbreviados = MESES.map(m => m.substring(0, 3));
    tableHeader.innerHTML = `<tr><th>👥 Grupo</th>${mesesAbreviados.map(m => `<th>${m}</th>`).join("")}</tr>`;
    
    // Obtener todos los grupos únicos
    const gruposUnicos = [...new Set(db[anioSeleccionado].map(p => p.grupo))].sort();
    
    // Generar filas para cada grupo
    tableBody.innerHTML = gruposUnicos.map(grupo => {
        let fila = `<td class="grupo-cell">${grupo}</td>`;
        MESES.forEach(mes => {
            const pago = db[anioSeleccionado].find(p => p.grupo === grupo && p.mes === mes);
            const estado = pago ? pago.estado : "pendiente";
            fila += `<td><span class="${estado === 'pagado' ? 'status-pagado' : 'status-pendiente'}">${estado === 'pagado' ? '✓' : '○'}</span></td>`;
        });
        return `<tr>${fila}</tr>`;
    }).join("");
    
    if (pagosView) pagosView.style.display = "block";
}