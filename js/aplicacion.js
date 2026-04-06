// js/aplicacion.js - Lógica vista usuario (index.html)

window.showToast = function(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#dc2626' : '#10b981';
    toast.className = 'toast show';
    setTimeout(() => { toast.className = 'toast'; }, 2000);
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadDatabase();
    await initCalendar();

    const modal         = document.getElementById('loginModal');
    const btnAdminLogin = document.getElementById('btnAdminLogin');
    const closeBtn      = document.querySelector('.close');
    const btnLogin      = document.getElementById('btnLogin');
    const adminPassword = document.getElementById('adminPassword');
    const loginError    = document.getElementById('loginError');

    document.getElementById('btnConsultaPagos')?.addEventListener('click', () => {
        window.location.href = 'consulta-pagos.html';
    });
    document.getElementById('btnBiblioteca')?.addEventListener('click', () => {
        window.location.href = 'biblioteca.html';
    });

    const cerrarModal = () => {
        modal.style.display = 'none';
        if (loginError)    loginError.textContent = '';
        if (adminPassword) adminPassword.value = '';
    };

    btnAdminLogin?.addEventListener('click', () => { modal.style.display = 'block'; });
    closeBtn?.addEventListener('click', cerrarModal);
    window.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });

    btnLogin?.addEventListener('click', () => {
        if (login(adminPassword.value)) {
            modal.style.display = 'none';
            window.location.href = 'panel-admin.html';
        } else {
            loginError.textContent = 'Contraseña incorrecta';
        }
    });

    adminPassword?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnLogin.click();
    });

    redirectIfAuthenticated();
    
});
