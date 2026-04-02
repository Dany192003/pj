// js/app.js - Inicialización de la vista de usuario

document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos
    loadDatabase();
    
    // Inicializar calendario
    initCalendar();
    
    // Modal de login
    const modal = document.getElementById("loginModal");
    const btnAdminLogin = document.getElementById("btnAdminLogin");
    const closeBtn = document.querySelector(".close");
    const btnLogin = document.getElementById("btnLogin");
    const adminPassword = document.getElementById("adminPassword");
    const loginError = document.getElementById("loginError");
    
    if (btnAdminLogin) {
        btnAdminLogin.onclick = () => {
            if (modal) modal.style.display = "block";
        };
    }
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            if (modal) modal.style.display = "none";
            if (loginError) loginError.textContent = "";
            if (adminPassword) adminPassword.value = "";
        };
    }
    
    window.onclick = (event) => {
        if (event.target === modal) {
            if (modal) modal.style.display = "none";
            if (loginError) loginError.textContent = "";
            if (adminPassword) adminPassword.value = "";
        }
    };
    
    if (btnLogin) {
        btnLogin.onclick = () => {
            const password = adminPassword ? adminPassword.value : "";
            if (login(password)) {
                if (modal) modal.style.display = "none";
                window.location.href = "admin.html";
            } else {
                if (loginError) loginError.textContent = "Contraseña incorrecta";
            }
        };
    }
    
    if (adminPassword) {
        adminPassword.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && btnLogin) btnLogin.click();
        });
    }
    
    // Redirigir si ya está autenticado
    redirectIfAuthenticated();
});

// Función showToast global
function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#dc2626" : "#10b981";
    toast.className = "toast show";
    setTimeout(() => {
        toast.className = "toast";
    }, 2000);
}