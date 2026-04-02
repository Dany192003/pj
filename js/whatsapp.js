// js/whatsapp.js - Gestión de WhatsApp (con limpieza después de enviar)

async function subirYEnviar() {
    let tel = document.getElementById("whatsapp").value.replace(/\D/g, "");
    if (!tel) { window.showToast("❌ Ingresa el número", true); return; }
    if (tel.length === 8 && !tel.startsWith("502")) tel = "502" + tel;
    if (!window.compActual) { window.showToast("❌ Genera un comprobante primero", true); return; }
    let imagenUrl = window.imagenCloudinaryUrl;
    if (!imagenUrl) { window.showToast("⚠️ La imagen aún no se ha subido", true); return; }
    
    const btn = document.getElementById("btnEnviarWA");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Abriendo...';
    btn.disabled = true;
    
    try {
        const mensajeTexto = construirMensajeConEmojis(window.compActual);
        const mensajeCompleto = mensajeTexto + "\n\n📎 *Comprobante en línea:*\n" + imagenUrl;
        const mensajeCodificado = encodeURIComponent(mensajeCompleto);
        const waUrl = `https://api.whatsapp.com/send/?phone=${tel}&text=${mensajeCodificado}&type=phone_number&app_absent=0`;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) window.location.href = waUrl;
        else window.open(waUrl, "_blank");
        window.showToast("✓ Abriendo WhatsApp...");
        
        // Limpiar el formulario después de enviar
        if (typeof limpiarFormulario === 'function') {
            setTimeout(() => {
                limpiarFormulario();
            }, 1000);
        }
        
    } catch (e) { window.showToast("❌ Error al enviar", true); }
    finally { btn.innerHTML = originalText; btn.disabled = false; }
}

function construirMensajeConEmojis(registro) {
    if (!registro) return "";
    return `✅ *COMPROBANTE DE PAGO - Pastoral Juvenil* ✅\n\n👥 *Juvenil:* ${registro.g}\n📌 *Concepto:* ${registro.concepto}\n💰 *Monto:* Q ${parseFloat(registro.mon).toFixed(2)}\n🔢 *No. Recibo:* REC-${registro.num}\n📆 *Fecha:* ${registro.fecha}\n⏰ *Hora:* ${registro.hora}\n\n_Gracias por tu contribución al movimiento juvenil._`;
}

function copiarMensaje() {
    if (!window.compActual) { window.showToast("❌ Genera un comprobante primero", true); return; }
    const mensaje = construirMensajeConEmojis(window.compActual);
    navigator.clipboard.writeText(mensaje).then(() => {
        window.showToast("✓ Mensaje copiado", false);
        // Limpiar el formulario después de copiar
        if (typeof limpiarFormulario === 'function') {
            setTimeout(() => {
                limpiarFormulario();
            }, 1000);
        }
    }).catch(() => window.showToast("❌ Error al copiar", true));
}