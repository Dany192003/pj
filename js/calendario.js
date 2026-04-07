// js/calendario.js - Calendario de actividades (con colores de fondo)

let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
let eventosGlobal = [];

async function initCalendar() {
    eventosGlobal = await cargarEventos();
    renderCalendar();
    crearModalActividad();
    
    const prevBtn = document.getElementById("prevMonth");
    const nextBtn = document.getElementById("nextMonth");
    
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
    }
}

function renderCalendar() {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const monthYearElement = document.getElementById("currentMonthYear");
    if (monthYearElement) monthYearElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const calendarDays = document.getElementById("calendarDays");
    if (!calendarDays) return;
    calendarDays.innerHTML = "";
    
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "calendar-day empty";
        calendarDays.appendChild(emptyDay);
    }
    
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement("div");
        dayElement.className = "calendar-day";
        
        if (day === todayDate && currentMonth === todayMonth && currentYear === todayYear) {
            dayElement.classList.add("today");
        }
        
        const fechaStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const eventosDia = eventosGlobal.filter(e => e.fecha === fechaStr);
        
        if (eventosDia.length > 0) {
            dayElement.classList.add("has-event");
            // Obtener el color de la primera actividad
            const colorPrincipal = eventosDia[0].color || '#0891b2';
            // Aplicar color de fondo
            dayElement.style.backgroundColor = colorPrincipal;
            // Aplicar borde izquierdo del mismo color
            dayElement.style.borderLeftColor = colorPrincipal;
            
            eventosDia.forEach(evento => {
                const tituloCorto = evento.titulo.length > 15 ? evento.titulo.substring(0, 15) + '...' : evento.titulo;
                const eventBadge = document.createElement("div");
                eventBadge.className = "day-event";
                eventBadge.textContent = `📌 ${tituloCorto}`;
                dayElement.appendChild(eventBadge);
            });
        }
        
        const dayNumber = document.createElement("div");
        dayNumber.className = "day-number";
        dayNumber.textContent = day;
        dayElement.insertBefore(dayNumber, dayElement.firstChild);
        
        dayElement.addEventListener("click", (e) => {
            e.stopPropagation();
            const fechaStrClick = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const eventosDelDia = eventosGlobal.filter(e => e.fecha === fechaStrClick);
            
            if (eventosDelDia.length > 0) {
                mostrarDetalleActividad(eventosDelDia, day);
            } else {
                mostrarSinActividades(day);
            }
        });
        
        calendarDays.appendChild(dayElement);
    }
}

function crearModalActividad() {
    if (document.getElementById("modalActividad")) return;
    
    const modalHTML = `
        <div id="modalActividad" class="modal-actividad">
            <div class="modal-actividad-content">
                <div class="modal-actividad-header">
                    <h3 id="modalActividadTitulo">📅 Actividades del día</h3>
                    <span class="close-actividad">&times;</span>
                </div>
                <div class="modal-actividad-body" id="modalActividadBody"></div>
                <div class="modal-actividad-footer">
                    <button class="btn-cerrar-modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    
    const modal = document.getElementById("modalActividad");
    const closeBtn = document.querySelector(".close-actividad");
    const cerrarBtn = document.querySelector(".btn-cerrar-modal");
    
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    if (cerrarBtn) cerrarBtn.onclick = () => modal.style.display = "none";
    
    window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };
}

function mostrarDetalleActividad(eventos, dia) {
    const modal = document.getElementById("modalActividad");
    const body = document.getElementById("modalActividadBody");
    const tituloModal = document.getElementById("modalActividadTitulo");
    
    if (!modal || !body) return;
    
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const fechaFormateada = `${dia} de ${meses[currentMonth]} de ${currentYear}`;
    
    if (tituloModal) tituloModal.innerHTML = `📅 Actividades - ${fechaFormateada}`;
    
    if (eventos.length === 1) {
        const evento = eventos[0];
        body.innerHTML = `
            <div class="actividad-item" style="border-left: 4px solid ${evento.color || '#0891b2'}">
                <div class="actividad-titulo" style="color: ${evento.color || '#0891b2'}">📌 ${evento.titulo}</div>
                ${evento.lugar ? `
                <div class="actividad-lugar">
                    <span class="actividad-icono">📍</span>
                    <strong>Lugar:</strong> ${evento.lugar}
                </div>
                ` : ''}
                <div class="actividad-descripcion">
                    <span class="actividad-icono">📝</span>
                    <strong>Descripción:</strong> ${evento.descripcion || 'No se proporcionó descripción adicional.'}
                </div>
            </div>
        `;
    } else {
        const actividadesHtml = eventos.map((evento, index) => `
            <div class="actividad-item" style="${index < eventos.length - 1 ? 'border-bottom: 1px solid #e2e8f0; margin-bottom: 15px; padding-bottom: 15px;' : ''} border-left: 4px solid ${evento.color || '#0891b2'}">
                <div class="actividad-titulo" style="color: ${evento.color || '#0891b2'}">📌 ${evento.titulo}</div>
                ${evento.lugar ? `
                <div class="actividad-lugar">
                    <span class="actividad-icono">📍</span>
                    <strong>Lugar:</strong> ${evento.lugar}
                </div>
                ` : ''}
                ${evento.descripcion ? `
                <div class="actividad-descripcion" style="margin-top: 8px;">
                    <span class="actividad-icono">📝</span> ${evento.descripcion.length > 200 ? evento.descripcion.substring(0, 200) + '...' : evento.descripcion}
                </div>
                ` : ''}
            </div>
        `).join('');
        
        body.innerHTML = `<div class="actividades-lista">${actividadesHtml}</div>`;
    }
    
    modal.style.display = "block";
}

function mostrarSinActividades(dia) {
    const modal = document.getElementById("modalActividad");
    const body = document.getElementById("modalActividadBody");
    const tituloModal = document.getElementById("modalActividadTitulo");
    
    if (!modal || !body) return;
    
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const fechaFormateada = `${dia} de ${meses[currentMonth]} de ${currentYear}`;
    
    if (tituloModal) tituloModal.innerHTML = `📅 ${fechaFormateada}`;
    
    body.innerHTML = `
        <div class="sin-actividades">
            <div class="sin-actividades-icono">📭</div>
            <div class="sin-actividades-texto">No hay actividades programadas para esta fecha.</div>
        </div>
    `;
    
    modal.style.display = "block";
}