// js/seguridad.js - Seguridad por inactividad

let tiempoInactividad = 0;
let tiempoLimite = 10; // 10 minutos de inactividad
let intervaloTiempo = null;
let modalInactividad = null;

// Crear modal de advertencia
function crearModalInactividad() {
    if (document.getElementById('modalInactividad')) return;
    
    const modalHTML = `
        <div id="modalInactividad" class="modal-inactividad">
            <div class="modal-inactividad-content">
                <div class="modal-inactividad-header">
                    <span class="modal-inactividad-icon">⏰</span>
                    <h3>Sesión a punto de expirar</h3>
                </div>
                <div class="modal-inactividad-body">
                    <p>Por tu seguridad, tu sesión cerrará automáticamente por inactividad.</p>
                    <p id="tiempoRestante" style="font-size: 24px; font-weight: 700; color: #0891b2; margin: 15px 0;">60</p>
                    <p>segundos restantes</p>
                </div>
                <div class="modal-inactividad-footer">
                    <button class="btn-inactividad-continuar" id="btnContinuarSesion">✅ Continuar sesión</button>
                    <button class="btn-inactividad-cerrar" id="btnCerrarSesion">🚪 Cerrar sesión</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    
    const modal = document.getElementById('modalInactividad');
    const btnContinuar = document.getElementById('btnContinuarSesion');
    const btnCerrar = document.getElementById('btnCerrarSesion');
    
    if (btnContinuar) {
        btnContinuar.onclick = () => {
            resetearInactividad();
            modal.style.display = 'none';
            if (intervaloTiempo) clearInterval(intervaloTiempo);
            window.showToast("✓ Sesión continuada", false);
        };
    }
    
    if (btnCerrar) {
        btnCerrar.onclick = () => {
            modal.style.display = 'none';
            cerrarSesionPorInactividad();
        };
    }
    
    window.onclick = (event) => {
        if (event.target === modal) {
            resetearInactividad();
            modal.style.display = 'none';
            if (intervaloTiempo) clearInterval(intervaloTiempo);
        }
    };
}

// Mostrar advertencia de inactividad
function mostrarAdvertenciaInactividad() {
    crearModalInactividad();
    const modal = document.getElementById('modalInactividad');
    const tiempoRestanteSpan = document.getElementById('tiempoRestante');
    
    let segundosRestantes = 60;
    if (tiempoRestanteSpan) tiempoRestanteSpan.textContent = segundosRestantes;
    
    if (intervaloTiempo) clearInterval(intervaloTiempo);
    
    intervaloTiempo = setInterval(() => {
        segundosRestantes--;
        if (tiempoRestanteSpan) tiempoRestanteSpan.textContent = segundosRestantes;
        
        if (segundosRestantes <= 0) {
            clearInterval(intervaloTiempo);
            modal.style.display = 'none';
            cerrarSesionPorInactividad();
        }
    }, 1000);
    
    modal.style.display = 'flex';
}

// Cerrar sesión por inactividad
function cerrarSesionPorInactividad() {
    if (typeof logout === 'function') {
        window.showToast("⏰ Sesión cerrada por inactividad", false);
        setTimeout(() => {
            logout();
        }, 1500);
    }
}

// Reiniciar contador de inactividad
function resetearInactividad() {
    tiempoInactividad = 0;
    
    // Si el modal está abierto, cerrarlo
    const modal = document.getElementById('modalInactividad');
    if (modal && modal.style.display === 'flex') {
        modal.style.display = 'none';
        if (intervaloTiempo) clearInterval(intervaloTiempo);
    }
}

// Iniciar detector de inactividad
function iniciarDetectorInactividad(minutos = 10) {
    tiempoLimite = minutos;
    tiempoInactividad = 0;
    
    // Eventos que indican actividad del usuario
    const eventos = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    
    eventos.forEach(evento => {
        document.addEventListener(evento, () => {
            tiempoInactividad = 0;
            
            // Cerrar modal de advertencia si está abierto
            const modal = document.getElementById('modalInactividad');
            if (modal && modal.style.display === 'flex') {
                modal.style.display = 'none';
                if (intervaloTiempo) clearInterval(intervaloTiempo);
            }
        });
    });
    
    // Verificar cada minuto
    setInterval(() => {
        if (tiempoInactividad >= tiempoLimite) {
            mostrarAdvertenciaInactividad();
        } else {
            tiempoInactividad++;
        }
    }, 60000); // 1 minuto
}

// Agregar estilos CSS
const estilosInactividad = document.createElement('style');
estilosInactividad.textContent = `
    .modal-inactividad {
        display: none;
        position: fixed;
        z-index: 3000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    }
    
    .modal-inactividad-content {
        background-color: white;
        border-radius: 24px;
        width: 90%;
        max-width: 400px;
        text-align: center;
        animation: slideUp 0.3s ease;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    .modal-inactividad-header {
        padding: 24px 24px 16px 24px;
        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
        color: white;
    }
    
    .modal-inactividad-icon {
        font-size: 48px;
        display: inline-block;
        margin-bottom: 12px;
    }
    
    .modal-inactividad-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
    }
    
    .modal-inactividad-body {
        padding: 24px;
        color: #334155;
    }
    
    .modal-inactividad-footer {
        padding: 16px 24px 24px 24px;
        display: flex;
        gap: 12px;
        justify-content: center;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
    }
    
    .btn-inactividad-continuar {
        background: linear-gradient(135deg, #0891b2, #3b82f6);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
        flex: 1;
    }
    
    .btn-inactividad-cerrar {
        background: #ef4444;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
        flex: 1;
    }
    
    .btn-inactividad-continuar:hover, .btn-inactividad-cerrar:hover {
        transform: translateY(-2px);
        filter: brightness(1.05);
    }
`;

document.head.appendChild(estilosInactividad);

// Exportar funciones
window.iniciarDetectorInactividad = iniciarDetectorInactividad;
window.cerrarSesionPorInactividad = cerrarSesionPorInactividad;
window.resetearInactividad = resetearInactividad;