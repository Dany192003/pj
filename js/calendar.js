// js/calendar.js - Calendario de actividades

let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();
let eventosGlobal = [];

async function initCalendar() {
    eventosGlobal = await cargarEventos();
    renderCalendar();
    
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
        
        let eventosHtml = "";
        if (eventosDia.length > 0) {
            dayElement.classList.add("has-event");
            eventosDia.forEach(evento => {
                eventosHtml += `<div class="day-event" title="${evento.lugar || ''}">📌 ${evento.titulo.substring(0, 20)}${evento.titulo.length > 20 ? '...' : ''}</div>`;
            });
        }
        
        dayElement.innerHTML = `<div class="day-number">${day}</div><div class="day-events">${eventosHtml}</div>`;
        calendarDays.appendChild(dayElement);
    }
}