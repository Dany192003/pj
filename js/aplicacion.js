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
    const adminUsername = document.getElementById('adminUsername');
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
        if (loginError) loginError.textContent = '';
        if (adminPassword) adminPassword.value = '';
    };

    btnAdminLogin?.addEventListener('click', () => { modal.style.display = 'flex'; });
    closeBtn?.addEventListener('click', cerrarModal);
    window.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });

    btnLogin?.addEventListener('click', async () => {
        const username = adminUsername?.value.trim();
        const password = adminPassword.value;
        
        if (!username) {
            loginError.textContent = 'Ingresa tu nombre de usuario';
            return;
        }
        if (!password) {
            loginError.textContent = 'Ingresa la contraseña';
            return;
        }
        
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="spinner"></span> Verificando...';
        
        const result = await login(username, password);
        
        if (result.success) {
            modal.style.display = 'none';
            loginError.textContent = '';
            adminPassword.value = '';
            window.location.href = 'panel-admin.html';
        } else {
            loginError.textContent = result.message || 'Credenciales incorrectas';
            btnLogin.disabled = false;
            btnLogin.innerHTML = 'Ingresar al Panel';
        }
    });

    adminPassword?.addEventListener('keypress', (e) => { if (e.key === 'Enter') btnLogin.click(); });

    redirectIfAuthenticated();

    // Modal Desarrollador
    const btnDesarrollador = document.getElementById('btnDesarrollador');
    const modalDesarrollador = document.getElementById('modalDesarrollador');
    const closeDesarrollador = document.querySelector('.close-desarrollador');
    if (btnDesarrollador && modalDesarrollador) {
        btnDesarrollador.addEventListener('click', () => { modalDesarrollador.style.display = 'flex'; });
        if (closeDesarrollador) closeDesarrollador.addEventListener('click', () => { modalDesarrollador.style.display = 'none'; });
        window.addEventListener('click', (e) => { if (e.target === modalDesarrollador) modalDesarrollador.style.display = 'none'; });
    }
});