// js/consulta-pagos.js - Directorio y Pagos (solo después de contraseña)

let grupoSeleccionado = null;
let anioSeleccionado = 2026;
let todosLosCoordinadores = [];

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
    
    const anioSelector = document.getElementById("anioSelector");
    if (anioSelector) {
        anioSelector.onchange = () => {
            anioSeleccionado = parseInt(anioSelector.value);
            if (grupoSeleccionado) {
                mostrarPagosGrupo(grupoSeleccionado);
            }
        };
    }
    
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
                    // Cargar directorio y pagos después de contraseña correcta
                    await cargarDirectorio();
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
                <span>🔒</span> Click para acceder
            </div>
        </div>
    `).join("");
    
    document.querySelectorAll('.grupo-card').forEach(card => {
        card.addEventListener('click', () => {
            grupoSeleccionado = card.dataset.grupo;
            const modal = document.getElementById("passwordModal");
            if (modal) {
                modal.style.display = "flex";
            }
        });
    });
}

// Cargar directorio de coordinadores (solo después de contraseña)
async function cargarDirectorio() {
    const grid = document.getElementById("coordinadoresGrid");
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading-coordinadores">📜 Cargando directorio...</div>';
    
    try {
        const snapshot = await coleccionGruposInfo.get();
        todosLosCoordinadores = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.coordinador && data.coordinador.trim() !== '' && data.coordinador !== 'No registrado') {
                todosLosCoordinadores.push({
                    id: doc.id,
                    grupo: data.grupo,
                    coordinador: data.coordinador,
                    telefono: data.telefono
                });
            }
        });
        
        todosLosCoordinadores.sort((a, b) => a.grupo.localeCompare(b.grupo));
        renderizarDirectorio();
    } catch (error) {
        console.error('Error cargando directorio:', error);
        grid.innerHTML = '<div class="loading-coordinadores">❌ Error al cargar el directorio</div>';
    }
}

function renderizarDirectorio() {
    const grid = document.getElementById("coordinadoresGrid");
    if (!grid) return;
    
    if (todosLosCoordinadores.length === 0) {
        grid.innerHTML = '<div class="loading-coordinadores">📭 No hay coordinadores registrados aún</div>';
        return;
    }
    
    grid.innerHTML = todosLosCoordinadores.map(coord => {
        const telefonoLimpio = coord.telefono ? coord.telefono.replace(/\D/g, '') : '';
        const tieneWhatsApp = telefonoLimpio && telefonoLimpio.length >= 8;
        
        return `
            <div class="coordinador-card">
                <div class="coordinador-header">
                    <div class="coordinador-icon">
                        <span>👤</span>
                    </div>
                    <h4>${escapeHtml(coord.coordinador)}</h4>
                    <div class="coordinador-grupo">
                        <span>👥</span> ${escapeHtml(coord.grupo)}
                    </div>
                </div>
                <div class="coordinador-body">
                    <div class="coordinador-info">
                        <div class="info-item">
                            <div class="info-icon">📱</div>
                            <div class="info-label">Teléfono:</div>
                            <div class="info-value">${coord.telefono || 'No registrado'}</div>
                        </div>
                    </div>
                    ${tieneWhatsApp ? `
                        <button class="coordinador-wa-btn" data-telefono="${telefonoLimpio}" data-nombre="${escapeHtml(coord.coordinador)}" data-grupo="${escapeHtml(coord.grupo)}">
                            <span>📱</span> Contactar por WhatsApp
                        </button>
                    ` : `
                        <button class="coordinador-wa-btn" disabled style="opacity:0.5; cursor:not-allowed;">
                            <span>📱</span> Sin WhatsApp disponible
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.coordinador-wa-btn[data-telefono]').forEach(btn => {
        btn.onclick = () => {
            const telefono = btn.dataset.telefono;
            const nombre = btn.dataset.nombre;
            const grupo = btn.dataset.grupo;
            const mensaje = `Hola ${nombre}, me comunico desde la Pastoral Juvenil (Juvenil ${grupo})`;
            const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
        };
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
    
    const mesesOrdenados = [...MESES];
    pagosGrupo.sort((a, b) => mesesOrdenados.indexOf(a.mes) - mesesOrdenados.indexOf(b.mes));
    
    if (grupoTitle) grupoTitle.innerHTML = `📋 Pagos - ${grupo} - Año ${anioSeleccionado}`;
    
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}