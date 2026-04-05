// js/whatsapp.js - Gestión de WhatsApp

function mostrarLoaderWhatsApp(mostrar) {
    let loader = document.getElementById("loaderWhatsApp");
    if (!loader && mostrar) {
        const loaderHTML = `
            <div id="loaderWhatsApp" class="loader-overlay">
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <p>Procesando imagen...</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", loaderHTML);
    } else if (loader && !mostrar) {
        loader.remove();
    }
}

async function subirYEnviar() {
    // Obtener el teléfono ANTES de cualquier limpieza
    let tel = document.getElementById("whatsapp").value.replace(/\D/g, "");
    if (!tel) { 
        window.showToast("❌ Ingresa el número", true); 
        return; 
    }
    if (tel.length === 8 && !tel.startsWith("502")) tel = "502" + tel;
    
    console.log("📞 Número de teléfono:", tel);
    
    // Guardar el teléfono en una variable local antes de que se limpie
    const telefonoParaEnviar = tel;
    
    // Si hay datos pendientes, primero guardar
    if (window.compPendiente && !window.compActual) {
        window.showToast("💾 Guardando comprobante antes de enviar...", false);
        const guardado = await window.confirmarYGuardarComprobante();
        if (!guardado) return;
    }
    
    if (!window.compActual) { 
        window.showToast("❌ Genera una vista previa primero", true); 
        return; 
    }
    
    const btn = document.getElementById("btnConfirmarEnviar");
    const originalText = btn ? btn.innerHTML : "Enviar";
    if (btn) {
        btn.innerHTML = '<span class="spinner"></span> Procesando...';
        btn.disabled = true;
    }
    
    mostrarLoaderWhatsApp(true);
    
    try {
        console.log("📸 Capturando el comprobante HTML...");
        
        const elemento = document.getElementById("vistaPrevia");
        if (!elemento) {
            throw new Error("No se encontró el elemento del comprobante");
        }
        
        const imagenUrl = await capturarYSubirCloudinary(elemento, window.compActual.num);
        window.imagenCloudinaryUrl = imagenUrl;
        
        console.log("📤 Imagen subida, URL:", imagenUrl);
        window.showToast("✓ Imagen lista, abriendo WhatsApp...", false);
        
        const mensajeTexto = construirMensajeConEmojis(window.compActual);
        const mensajeCompleto = mensajeTexto + "\n\n📎 *Comprobante en línea:*\n" + imagenUrl;
        const mensajeCodificado = encodeURIComponent(mensajeCompleto);
        
        // Construir URL de WhatsApp correctamente
        const waUrl = `https://wa.me/${telefonoParaEnviar}?text=${mensajeCodificado}`;
        
        console.log("🔗 Abriendo WhatsApp con URL:", waUrl);
        
        // Pequeña pausa para asegurar que el loader se vea
        setTimeout(() => {
            // Abrir WhatsApp
            window.open(waUrl, "_blank");
            
            // Limpiar formulario después de enviar (con delay para que WhatsApp se abra)
            setTimeout(() => {
                if (typeof window.limpiarFormulario === 'function') {
                    window.limpiarFormulario();
                    console.log("🧹 Formulario limpiado después de envío");
                }
            }, 1000);
        }, 500);
        
    } catch (error) { 
        console.error("❌ Error detallado:", error);
        window.showToast("❌ Error al procesar la imagen: " + (error.message || "Error desconocido"), true); 
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
    return `✅ *COMPROBANTE DE PAGO - Pastoral Juvenil* ✅\n\n👥 *Juvenil:* ${registro.g}\n📌 *Concepto:* ${registro.concepto}\n💰 *Monto:* Q ${parseFloat(registro.mon).toFixed(2)}\n🔢 *No. Recibo:* REC-${registro.num}\n📆 *Fecha:* ${registro.fecha}\n⏰ *Hora:* ${registro.hora}\n\n_Gracias por tu contribución al movimiento juvenil._`;
}