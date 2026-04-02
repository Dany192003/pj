// js/calendar.js - Generador de calendario

let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();

// Inicializar calendario
function initCalendar() {
    renderCalendar();
    loadUpcomingPayments();
    
    const prevBtn = document.getElementById("prevMonth");
    const nextBtn = document.getElementById("nextMonth");
    
    if (prevBtn) prevBtn.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
        loadUpcomingPayments();
    });
    
    if (nextBtn) nextBtn.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
        loadUpcomingPayments();
    });
}

// Renderizar calendario
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
        
        const hasPayments = checkPaymentsForDay(day);
        if (hasPayments) {
            dayElement.classList.add(hasPayments.status);
            dayElement.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="day-payment ${hasPayments.status}">${hasPayments.text}</div>
            `;
        } else {
            dayElement.innerHTML = `<div class="day-number">${day}</div>`;
        }
        
        calendarDays.appendChild(dayElement);
    }
}

// Verificar pagos para un día específico
function checkPaymentsForDay(day) {
    const mesActual = MESES[currentMonth];
    const anioActual = currentYear;
    
    if (!db[anioActual]) return null;
    
    const paymentsForMonth = db[anioActual].filter(p => p.mes === mesActual);
    if (paymentsForMonth.length === 0) return null;
    
    const paidCount = paymentsForMonth.filter(p => p.estado === "pagado").length;
    const pendingCount = paymentsForMonth.filter(p => p.estado === "pendiente").length;
    
    if (paidCount > 0 && pendingCount === 0) {
        return { status: "paid", text: "✓ Todos pagados" };
    } else if (pendingCount > 0) {
        return { status: "pending", text: `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}` };
    }
    return null;
}

// Cargar próximos pagos
function loadUpcomingPayments() {
    const paymentsList = document.getElementById("paymentsList");
    if (!paymentsList) return;
    
    const anioActual = new Date().getFullYear();
    const mesActual = MESES[new Date().getMonth()];
    
    if (!db[anioActual]) {
        paymentsList.innerHTML = '<div class="payment-item">No hay pagos registrados</div>';
        return;
    }
    
    const pendingPayments = db[anioActual].filter(p => p.estado === "pendiente" && p.mes === mesActual);
    
    if (pendingPayments.length === 0) {
        paymentsList.innerHTML = '<div class="payment-item">✨ No hay pagos pendientes este mes</div>';
        return;
    }
    
    paymentsList.innerHTML = pendingPayments.map(p => `
        <div class="payment-item">
            <div class="payment-info">
                <div class="payment-group">👥 ${p.grupo}</div>
                <div class="payment-date">📅 ${p.mes} ${anioActual}</div>
            </div>
            <div class="payment-status pending">Pendiente</div>
        </div>
    `).join("");
}