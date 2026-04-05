// js/whatsapp.js - Gestión de WhatsApp

function mostrarLoaderWhatsApp(mostrar) {
    let loader = document.getElementById("loaderWhatsApp");
    if (!loader && mostrar) {
        const loaderHTML = `
            <div id="loaderWhatsApp" class="loader-overlay">
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <p>Abriendo WhatsApp...</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", loaderHTML);
    } else if (loader && !mostrar) {
        loader.remove();
    }
}

async function subirYEnviar() {
    let tel = document.getElementById("whatsapp").value.replace(/\D/g, "");
    if (!tel) { 
        window.showToast("❌ Ingresa el número", true); 
        return; 
    }
    if (tel.length === 8 && !tel.startsWith("502")) tel = "502" + tel;
    
    console.log("📞 Número de teléfono:", tel);
    const telefonoParaEnviar = tel;
    
    if (window.compPendiente && !window.compActual) {
        window.showToast("💾 Guardando comprobante antes de enviar...", false);
        const guardado = await window.confirmarYGuardarComprobante();
        if (!guardado) return;
    }
    
    if (!window.compActual) { 
        window.showToast("❌ Genera una vista previa primero", true); 
        return; 
    }
    
    if (!window.imagenCloudinaryUrl) {
        window.showToast("❌ La imagen aún no se ha generado", true);
        return;
    }
    
    const btn = document.getElementById("btnConfirmarEnviar");
    const originalText = btn ? btn.innerHTML : "Enviar";
    if (btn) {
        btn.innerHTML = '<span class="spinner"></span> Abriendo WhatsApp...';
        btn.disabled = true;
    }
    
    mostrarLoaderWhatsApp(true);
    
    try {
        const mensajeTexto = construirMensajeConEmojis(window.compActual);
        const mensajeCompleto = mensajeTexto + "\n\n📎 *Comprobante en línea:*\n" + window.imagenCloudinaryUrl;
        const mensajeCodificado = encodeURIComponent(mensajeCompleto);
        
        const waUrl = `https://api.whatsapp.com/send/?phone=${telefonoParaEnviar}&text=${mensajeCodificado}&type=phone_number&app_absent=0`;
        
        console.log("🔗 Abriendo WhatsApp con URL:", waUrl);
        
        window.open(waUrl, "_blank");
        
        setTimeout(() => {
            if (typeof window.limpiarFormulario === 'function') {
                window.limpiarFormulario();
                console.log("🧹 Formulario limpiado después de envío");
            }
        }, 1000);
        
    } catch (error) { 
        console.error("❌ Error detallado:", error);
        window.showToast("❌ Error al enviar", true); 
    } finally { 
        setTimeout(() => {
            mostrarLoaderWhatsApp(false);
            if (btn) {
                btn.innerHTML = originalText; 
                btn.disabled = false; 
            }
        }, 1000);
    }
}

function construirMensajeConEmojis(registro) {
    if (!registro) return "";
    const estadoTexto = registro.estado || "PAGADO";
    return `✅ *COMPROBANTE DE PAGO - Pastoral Juvenil* ✅\n\n👥 *Juvenil:* ${registro.g}\n📌 *Concepto:* ${registro.concepto}\n💰 *Monto:* Q ${parseFloat(registro.mon).toFixed(2)}\n🔢 *No. Recibo:* REC-${registro.num}\n📆 *Fecha:* ${registro.fecha}\n⏰ *Hora:* ${registro.hora}\n✅ *Estado:* ${estadoTexto}\n\n_Gracias por tu contribución al movimiento juvenil._`;
}