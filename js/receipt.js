// js/receipt.js - Generación de recibos (vista previa con PENDIENTE)

if (typeof window.showToast !== 'function') {
    window.showToast = function(message, isError = false) {
        const toast = document.getElementById("toast");
        if (!toast) { console.log(message); return; }
        toast.textContent = message;
        toast.style.backgroundColor = isError ? "#dc2626" : "#10b981";
        toast.className = "toast show";
        setTimeout(() => { toast.className = "toast"; }, 2000);
    };
}

window.compActual = null;
window.compPendiente = null;
window.imagenCloudinaryUrl = null;

function construirMensajeConEmojis(registro) {
    const estadoTexto = registro.estado || "PAGADO";
    return `✅ *COMPROBANTE DE PAGO - Pastoral Juvenil* ✅\n\n👥 *Juvenil:* ${registro.g}\n📌 *Concepto:* ${registro.concepto}\n💰 *Monto:* Q ${parseFloat(registro.mon).toFixed(2)}\n🔢 *No. Recibo:* REC-${registro.num}\n📆 *Fecha:* ${registro.fecha}\n⏰ *Hora:* ${registro.hora}\n✅ *Estado:* ${estadoTexto}\n\n_Gracias por tu contribución al movimiento juvenil._`;
}

// Función para capturar el HTML y subir a Cloudinary
async function capturarYSubirCloudinary(elemento, reciboNum) {
    console.log("📸 Iniciando captura del comprobante...");
    
    if (!elemento) {
        throw new Error("No se encontró el elemento del comprobante");
    }
    
    try {
        // Configuración de captura
        const canvas = await html2canvas(elemento, {
            scale: 2.5,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            allowTaint: false
        });
        
        console.log("✓ Captura completada, tamaño:", canvas.width, "x", canvas.height);
        
        // Convertir a blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.95));
        
        // Crear FormData
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("upload_preset", "comprobantes");
        formData.append("folder", "comprobantes");
        formData.append("public_id", `REC-${reciboNum}_${Date.now()}`);
        
        console.log("📤 Subiendo a Cloudinary...");
        
        const res = await fetch("https://api.cloudinary.com/v1_1/dyzpdl9tg/image/upload", { 
            method: "POST", 
            body: formData 
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error("❌ Error Cloudinary:", errorText);
            throw new Error(`Error en Cloudinary: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("✓ Imagen subida exitosamente:", data.secure_url);
        return data.secure_url;
        
    } catch (error) {
        console.error("❌ Error en captura/subida:", error);
        throw error;
    }
}

function mostrarLoader(mostrar) {
    let loader = document.getElementById("loaderGenerando");
    if (!loader && mostrar) {
        const loaderHTML = `
            <div id="loaderGenerando" class="loader-overlay">
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <p>Generando comprobante...</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", loaderHTML);
    } else if (loader && !mostrar) {
        loader.remove();
    }
}

// Mostrar vista previa con estado PENDIENTE
function mostrarVistaPrevia(data) {
    console.log("📄 Mostrando vista previa del comprobante (ESTADO: PENDIENTE)");
    
    const tempNum = getCurrentNumero();
    
    document.getElementById("vNumRecibo").textContent = `REC-${tempNum}`;
    document.getElementById("vGrupo").textContent = data.g;
    document.getElementById("vConcepto").textContent = data.concepto;
    document.getElementById("vFecha").textContent = data.fecha;
    document.getElementById("vHora").textContent = data.hora;
    document.getElementById("vMonto").textContent = parseFloat(data.mon).toFixed(2);
    
    // Estado: PENDIENTE (color naranja)
    const estadoElement = document.getElementById("vEstado");
    if (estadoElement) {
        estadoElement.textContent = "PENDIENTE";
        estadoElement.style.color = "#f97316";
        estadoElement.style.fontWeight = "800";
    }
    
    // Cambiar fondo de la fila de estado
    const estadoRow = document.getElementById("estadoRow");
    if (estadoRow) {
        estadoRow.style.background = "#fef9c3";
    }
    
    window.compPendiente = {
        g: data.g,
        concepto: data.concepto,
        mon: data.mon,
        num: tempNum,
        fecha: data.fecha,
        hora: data.hora,
        whatsapp: data.whatsapp
    };
    
    document.getElementById("preview").style.display = "block";
    console.log("✓ Vista previa HTML mostrada - ESTADO: PENDIENTE");
    
    setTimeout(() => { 
        document.getElementById("preview").scrollIntoView({ behavior: 'smooth' }); 
    }, 100);
}

// Confirmar y guardar el comprobante (cambiar estado a PAGADO)
async function confirmarYGuardarComprobante() {
    if (!window.compPendiente) {
        window.showToast("❌ Primero genera una vista previa", true);
        return false;
    }
    
    const datos = window.compPendiente;
    const anioActual = new Date().getFullYear();
    
    mostrarLoader(true);
    
    try {
        console.log("💾 Confirmando y guardando comprobante en BD...");
        
        await asegurarDBCloud(anioActual);
        if (!GRUPOS.includes(datos.g)) {
            await addCustomGroup(anioActual, datos.g);
        }
        const mesActual = MESES[new Date().getMonth()];
        await updatePaymentStatus(anioActual, datos.g, mesActual, "pagado");
        
        const nuevoNumero = getNextNumero();
        datos.num = nuevoNumero;
        document.getElementById("numReciboPreview").value = `REC-${getCurrentNumero()}`;
        
        // Cambiar vista previa a PAGADO
        document.getElementById("vNumRecibo").textContent = `REC-${nuevoNumero}`;
        
        // Estado: PAGADO (color verde)
        const estadoElement = document.getElementById("vEstado");
        if (estadoElement) {
            estadoElement.textContent = "PAGADO";
            estadoElement.style.color = "#15803d";
            estadoElement.style.fontWeight = "800";
        }
        
        // Cambiar fondo de la fila de estado a verde claro
        const estadoRow = document.getElementById("estadoRow");
        if (estadoRow) {
            estadoRow.style.background = "#dcfce7";
        }
        
        window.compActual = {
            g: datos.g,
            concepto: datos.concepto,
            mon: datos.mon,
            num: nuevoNumero,
            fecha: datos.fecha,
            hora: datos.hora,
            estado: "PAGADO"
        };
        
        mostrarLoader(false);
        window.showToast("✓ Comprobante guardado exitosamente - ESTADO: PAGADO", false);
        console.log("✅ Comprobante guardado con éxito. Folio:", nuevoNumero, "- ESTADO: PAGADO");
        
        if (anioActual === window.anioSeleccionado && typeof renderTabla === 'function') {
            renderTabla();
        }
        
        return true;
        
    } catch (error) {
        mostrarLoader(false);
        console.error("❌ Error al guardar comprobante:", error);
        window.showToast("❌ Error al guardar el comprobante", true);
        return false;
    }
}

// Obtener datos del formulario para vista previa
function getFormDataParaVistaPrevia() {
    let grupo = document.getElementById("grupo").value;
    if (!grupo || grupo === "") {
        window.showToast("❌ Por favor selecciona un juvenil", true);
        return null;
    }
    if (grupo === "OTRO") {
        grupo = document.getElementById("nombreOtro").value.trim();
        if (!grupo) { window.showToast("❌ Escribe el nombre del grupo", true); return null; }
    }
    const concepto = document.getElementById("concepto").value.trim();
    const monto = document.getElementById("monto").value;
    const whatsapp = document.getElementById("whatsapp").value.trim();
    
    if (!concepto) { window.showToast("❌ Ingresa un concepto", true); return null; }
    if (!monto || parseFloat(monto) <= 0) { window.showToast("❌ Ingresa un monto válido", true); return null; }
    if (!whatsapp) { window.showToast("❌ Ingresa el número de WhatsApp", true); return null; }
    
    const ahora = new Date();
    const fechaActual = ahora.toLocaleDateString("es-GT", { day: 'numeric', month: 'long', year: 'numeric' });
    const horaActual = ahora.toLocaleTimeString("es-GT", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    return { 
        g: grupo, 
        concepto: concepto, 
        mon: monto, 
        whatsapp: whatsapp,
        fecha: fechaActual, 
        hora: horaActual 
    };
}

// Evento: Vista Previa
async function generarVistaPrevia() {
    console.log("👁️ Generando vista previa...");
    const formData = getFormDataParaVistaPrevia();
    if (!formData) return;
    mostrarVistaPrevia(formData);
}

function limpiarFormulario() {
    document.getElementById("concepto").value = "";
    document.getElementById("monto").value = "";
    document.getElementById("whatsapp").value = "";
    const grupoSelect = document.getElementById("grupo");
    grupoSelect.value = "";
    document.getElementById("campoOtro").style.display = "none";
    document.getElementById("nombreOtro").value = "";
    document.getElementById("preview").style.display = "none";
    window.compActual = null;
    window.compPendiente = null;
    window.imagenCloudinaryUrl = null;
    console.log("🧹 Formulario limpiado");
}

function checkOtroGrupo() {
    const campoOtro = document.getElementById("campoOtro");
    const grupoSelect = document.getElementById("grupo");
    if (campoOtro) campoOtro.style.display = grupoSelect.value === "OTRO" ? "block" : "none";
}

function actNumeroReciboPreview() {
    const numRecibo = document.getElementById("numReciboPreview");
    if (numRecibo) numRecibo.value = `REC-${getCurrentNumero()}`;
}

// Exportar funciones
window.generarVistaPrevia = generarVistaPrevia;
window.confirmarYGuardarComprobante = confirmarYGuardarComprobante;
window.limpiarFormulario = limpiarFormulario;
window.actNumeroReciboPreview = actNumeroReciboPreview;
window.checkOtroGrupo = checkOtroGrupo;
window.capturarYSubirCloudinary = capturarYSubirCloudinary;