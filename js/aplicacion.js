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

    // Botones de navegación
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

    // CORREGIDO: usar 'flex' en lugar de 'block' para centrar
    btnAdminLogin?.addEventListener('click', () => { 
        modal.style.display = 'flex'; 
    });
    
    closeBtn?.addEventListener('click', cerrarModal);
    window.addEventListener('click', (e) => { 
        if (e.target === modal) cerrarModal(); 
    });

// En aplicacion.js, modifica el login
btnLogin?.addEventListener('click', async () => {
    const email = document.getElementById('adminEmail').value.trim();
    const password = adminPassword.value;
    
    if (!email) {
        loginError.textContent = 'Ingresa el correo electrónico';
        return;
    }
    if (!password) {
        loginError.textContent = 'Ingresa la contraseña';
        return;
    }
    
    // Mostrar loading
    btnLogin.disabled = true;
    btnLogin.innerHTML = '<span class="spinner"></span> Verificando...';
    
    const result = await login(email, password);
    
    if (result.success) {
        // Limpiar modal
        modal.style.display = 'none';
        loginError.textContent = '';
        adminPassword.value = '';
        // Redirigir directamente
        window.location.href = 'panel-admin.html';
    } else {
        loginError.textContent = result.message || 'Credenciales incorrectas';
        btnLogin.disabled = false;
        btnLogin.innerHTML = 'Ingresar al Panel';
    }
});

    adminPassword?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnLogin.click();
    });

    redirectIfAuthenticated();
});