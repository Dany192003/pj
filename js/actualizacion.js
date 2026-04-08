// js/actualizacion.js - Sistema de actualización automática

const APP_VERSION = '1.0.0';

// Variables de control
let verificadoEnEstaSesion = false;
let notificacionActiva = false;

// Función principal para verificar actualizaciones
async function verificarActualizacion() {
    if (verificadoEnEstaSesion) {
        console.log('✅ Ya se verificó en esta sesión');
        return false;
    }
    
    try {
        console.log('🔍 Verificando actualizaciones...');
        
        const response = await fetch('/version.json?v=' + Date.now(), {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        const versionData = await response.json();
        const versionLocal = localStorage.getItem('app_version');
        
        console.log(`📌 Versión local: ${versionLocal}`);
        console.log(`📌 Versión servidor: ${versionData.version}`);
        
        if (!versionLocal) {
            localStorage.setItem('app_version', versionData.version);
            localStorage.setItem('app_last_update', versionData.lastUpdate);
            verificadoEnEstaSesion = true;
            console.log('📌 Primera visita - Versión guardada');
            return false;
        }
        
        if (versionLocal !== versionData.version) {
            console.log('🔄 NUEVA VERSIÓN DETECTADA!');
            
            const versionNotificada = localStorage.getItem('app_version_notified');
            
            if (versionNotificada !== versionData.version) {
                console.log('📢 Mostrando notificación de actualización');
                mostrarNotificacionActualizacion(versionData);
                localStorage.setItem('app_version_notified', versionData.version);
                notificacionActiva = true;
            } else {
                console.log('ℹ️ Notificación ya fue mostrada para esta versión');
            }
            
            localStorage.setItem('app_version', versionData.version);
            localStorage.setItem('app_last_update', versionData.lastUpdate);
            verificadoEnEstaSesion = true;
            return true;
        } else {
            console.log('✅ Versión actualizada - No hay cambios');
            verificadoEnEstaSesion = true;
            return false;
        }
        
    } catch (error) {
        console.log('⚠️ Error verificando actualización:', error);
        verificadoEnEstaSesion = true;
        return false;
    }
}

function mostrarNotificacionActualizacion(versionData) {
    if (notificacionActiva) {
        console.log('⚠️ Ya hay una notificación activa');
        return;
    }
    
    const existingToast = document.querySelector('.toast-actualizacion');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-actualizacion';
    toast.innerHTML = `
        <div style="background: linear-gradient(135deg, #0891b2, #3b82f6); color: white; padding: 14px 24px; border-radius: 60px; display: flex; align-items: center; gap: 15px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); font-size: 14px;">
            <span style="font-size: 24px;">🔄</span>
            <div>
                <strong>¡Nueva versión disponible!</strong><br>
                <small style="opacity: 0.9;">${versionData.changes || 'Mejoras y correcciones recientes'}</small>
            </div>
            <button id="btnRecargar" style="background: white; color: #0891b2; border: none; padding: 8px 20px; border-radius: 40px; cursor: pointer; font-weight: bold; font-size: 13px;">
                Actualizar ahora
            </button>
        </div>
    `;
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.zIndex = '10000';
    toast.style.animation = 'slideUp 0.3s ease';
    document.body.appendChild(toast);
    
    document.getElementById('btnRecargar').onclick = () => {
        localStorage.removeItem('app_version_notified');
        window.location.reload();
    };
    
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                if (toast && toast.parentNode) toast.remove();
                notificacionActiva = false;
            }, 300);
        }
    }, 15000);
}

async function forzarActualizacionGlobal() {
    const confirmado = confirm('⚠️ ¿Forzar actualización global?\n\nEsto limpiará la caché y recargará la app.');
    
    if (confirmado) {
        localStorage.removeItem('app_version');
        localStorage.removeItem('app_version_notified');
        localStorage.removeItem('app_last_update');
        
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.update();
                await registration.unregister();
            }
        }
        
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        alert('✅ Actualización forzada. La página se recargará.');
        window.location.reload();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Inicializando verificador de actualizaciones...');
    setTimeout(() => {
        verificarActualizacion();
    }, 2000);
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js?v=' + Date.now())
            .then(registration => {
                console.log('✅ Service Worker registrado');
            })
            .catch(error => console.log('❌ Error Service Worker:', error));
    });
}

window.forzarActualizacionGlobal = forzarActualizacionGlobal;
window.verificarActualizacion = verificarActualizacion;