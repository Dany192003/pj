// js/whatsapp.js - Gestión de WhatsApp

async function subirYEnviar() {
    let tel = document.getElementById("whatsapp").value.replace(/\D/g, "");
    if (!tel) { window.showToast("❌ Ingresa el número", true); return; }
    if (tel.length === 8 && !tel.startsWith("502")) tel = "502" + tel;
    if (!window.compActual) { window.showToast("❌ Genera un comprobante primero", true); return; }
    
    const btn = document.getElementById("btnEnviarWA");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Subiendo imagen...';
    btn.disabled = true;
    
    try {
        window.showToast("📤 Subiendo imagen a la nube...", false);
        
        const canvas = window.comprobanteCanvas;
        if (!canvas) throw new Error("No hay imagen generada");
        
        const imagenUrl = await subirImagenCloudinary(canvas, window.compActual.num);
        window.imagenCloudinaryUrl = imagenUrl;
        
        window.showToast("✓ Imagen subida, abriendo WhatsApp...", false);
        
        const mensajeTexto = construirMensajeConEmojis(window.compActual);
        const mensajeCompleto = mensajeTexto + "\n\n📎 *Comprobante en línea:*\n" + imagenUrl;
        const mensajeCodificado = encodeURIComponent(mensajeCompleto);
        const waUrl = `https://api.whatsapp.com/send/?phone=${tel}&text=${mensajeCodificado}&type=phone_number&app_absent=0`;
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) window.location.href = waUrl;
        else window.open(waUrl, "_blank");
        
        setTimeout(() => {
            if (typeof limpiarFormulario === 'function') limpiarFormulario();
        }, 2000);
        
    } catch (e) { 
        console.error(e); 
        window.showToast("❌ Error al subir la imagen", true); 
    } finally { 
        btn.innerHTML = originalText; 
        btn.disabled = false; 
    }
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
    }).catch(() => window.showToast("❌ Error al copiar", true));
}