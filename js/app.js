// js/app.js - Vista de usuario

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
    await initCalendar();
    
    const modal = document.getElementById("loginModal");
    const btnAdminLogin = document.getElementById("btnAdminLogin");
    const btnConsultaPagos = document.getElementById("btnConsultaPagos");
    const closeBtn = document.querySelector(".close");
    const btnLogin = document.getElementById("btnLogin");
    const adminPassword = document.getElementById("adminPassword");
    const loginError = document.getElementById("loginError");
    
    if (btnConsultaPagos) btnConsultaPagos.onclick = () => window.location.href = "consulta-pagos.html";
    if (btnAdminLogin) btnAdminLogin.onclick = () => modal.style.display = "block";
    if (closeBtn) closeBtn.onclick = () => { modal.style.display = "none"; if (loginError) loginError.textContent = ""; if (adminPassword) adminPassword.value = ""; };
    window.onclick = (event) => { if (event.target === modal) { modal.style.display = "none"; if (loginError) loginError.textContent = ""; if (adminPassword) adminPassword.value = ""; } };
    if (btnLogin) btnLogin.onclick = () => { if (login(adminPassword.value)) { modal.style.display = "none"; window.location.href = "admin.html"; } else { loginError.textContent = "Contraseña incorrecta"; } };
    if (adminPassword) adminPassword.addEventListener("keypress", (e) => { if (e.key === "Enter") btnLogin.click(); });
    
    redirectIfAuthenticated();
    window.showToast("✓ Bienvenido", false);
});