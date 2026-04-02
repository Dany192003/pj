// js/whatsapp.js - Gestión de WhatsApp

async function subirYEnviar() {
    let tel = document.getElementById("whatsapp").value.replace(/\D/g, "");
    
    if (!tel) {
        window.showToast("❌ Ingresa el número de WhatsApp", true);
        return;
    }
    
    if (tel.length === 8 && !tel.startsWith("502")) {
        tel = "502" + tel;
    }
    
    if (!window.compActual) {
        window.showToast("❌ Primero genera un comprobante", true);
        return;
    }
    
    let imagenUrl = window.imagenCloudinaryUrl;
    if (!imagenUrl) {
        window.showToast("⚠️ La imagen aún no se ha subido, intenta de nuevo", true);
        return;
    }
    
    const btn = document.getElementById("btnEnviarWA");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Abriendo WhatsApp...';
    btn.disabled = true;
    
    try {
        const mensajeTexto = construirMensajeConEmojis(window.compActual);
        const mensajeCompleto = mensajeTexto + "\n\n📎 *Comprobante en línea:*\n" + imagenUrl;
        const mensajeCodificado = encodeURIComponent(mensajeCompleto);
        
        const waUrl = `https://api.whatsapp.com/send/?phone=${tel}&text=${mensajeCodificado}&type=phone_number&app_absent=0`;
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            window.location.href = waUrl;
        } else {
            window.open(waUrl, "_blank");
        }
        
        window.showToast("✓ Abriendo WhatsApp...");
    } catch (e) {
        console.error(e);
        window.showToast("❌ Error al enviar", true);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function construirMensajeConEmojis(registro) {
    if (!registro) return "";
    
    let mensaje = "✅ *COMPROBANTE DE PAGO - Pastoral Juvenil* ✅\n\n";
    mensaje += "👥 *Juvenil:* " + registro.g + "\n";
    mensaje += "📌 *Concepto:* " + registro.concepto + "\n";
    mensaje += "💰 *Monto:* Q " + parseFloat(registro.mon).toFixed(2) + "\n";
    mensaje += "🔢 *No. Recibo:* REC-" + registro.num + "\n";
    mensaje += "📆 *Fecha:* " + registro.fecha + "\n";
    mensaje += "⏰ *Hora:* " + registro.hora + "\n\n";
    mensaje += "_Gracias por tu contribución al movimiento juvenil._";
    
    return mensaje;
}

function copiarMensaje() {
    if (!window.compActual) {
        window.showToast("❌ Primero genera un comprobante", true);
        return;
    }
    
    const mensajeParaCopiar = construirMensajeConEmojis(window.compActual);
    
    navigator.clipboard.writeText(mensajeParaCopiar).then(() => {
        window.showToast("✓ Mensaje copiado al portapapeles", false);
        window.showToast("📱 Pégalo en WhatsApp y adjunta la imagen manualmente", false);
    }).catch(() => {
        window.showToast("❌ Error al copiar", true);
    });
}