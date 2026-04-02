// js/receipt.js - Generación de recibos (con limpieza de formulario)

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
window.comprobanteCanvas = null;
window.imagenCloudinaryUrl = null;

function construirMensajeConEmojis(registro) {
    return `✅ *COMPROBANTE DE PAGO - Pastoral Juvenil* ✅\n\n👥 *Juvenil:* ${registro.g}\n📌 *Concepto:* ${registro.concepto}\n💰 *Monto:* Q ${parseFloat(registro.mon).toFixed(2)}\n🔢 *No. Recibo:* REC-${registro.num}\n📆 *Fecha:* ${registro.fecha}\n⏰ *Hora:* ${registro.hora}\n\n_Gracias por tu contribución al movimiento juvenil._`;
}

async function subirImagenCloudinary(canvas, reciboNum) {
    return new Promise(async (resolve, reject) => {
        try {
            const blob = await new Promise(r => canvas.toBlob(r, "image/png", 1.0));
            const formData = new FormData();
            formData.append("file", blob);
            formData.append("upload_preset", "comprobantes");
            formData.append("folder", "comprobantes");
            formData.append("public_id", `REC-${reciboNum}_${Date.now()}`);
            const res = await fetch("https://api.cloudinary.com/v1_1/dyzpdl9tg/image/upload", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Error en Cloudinary");
            const data = await res.json();
            resolve(data.secure_url);
        } catch (error) { reject(error); }
    });
}

async function generarImagenComprobante(data) {
    return new Promise((resolve) => {
        const width = 450, height = 550;
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
        ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(0, 0, width, height, 20); ctx.fill();
        ctx.shadowColor = 'transparent';
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, '#0f172a'); gradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradient; ctx.beginPath(); ctx.roundRect(0, 0, width, 100, 20); ctx.fill();
        
        ctx.font = '42px "Segoe UI Emoji"'; ctx.fillStyle = '#ffffff'; ctx.fillText('⛪', width/2 - 20, 55);
        ctx.font = 'bold 18px "Plus Jakarta Sans"'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.fillText('COMPROBANTE DE PAGO', width/2, 75);
        ctx.font = '11px "Plus Jakarta Sans"'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('Pastoral Juvenil - Sumpango', width/2, 92);
        
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 100, width, 70);
        ctx.font = '10px "Plus Jakarta Sans"'; ctx.fillStyle = '#0891b2'; ctx.fillText('NÚMERO DE RECIBO', width/2, 128);
        ctx.font = 'bold 26px "Courier New"'; ctx.fillStyle = '#0f172a'; ctx.fillText(`REC-${data.num}`, width/2, 160);
        
        let yPos = 185;
        const infoItems = [
            { label: '👥 JUVENIL', value: data.g },
            { label: '📌 CONCEPTO', value: data.concepto },
            { label: '📆 FECHA', value: data.fecha },
            { label: '⏰ HORA', value: data.hora }
        ];
        infoItems.forEach((item) => {
            ctx.beginPath(); ctx.strokeStyle = '#e2e8f0'; ctx.setLineDash([5,5]); ctx.moveTo(20, yPos - 5); ctx.lineTo(width - 20, yPos - 5); ctx.stroke(); ctx.setLineDash([]);
            ctx.font = 'bold 11px "Plus Jakarta Sans"'; ctx.fillStyle = '#64748b'; ctx.textAlign = 'left'; ctx.fillText(item.label, 20, yPos + 8);
            ctx.font = '600 13px "Plus Jakarta Sans"'; ctx.fillStyle = '#1e293b'; ctx.textAlign = 'right';
            let valueText = item.value; const maxWidth = width - 140;
            let textWidth = ctx.measureText(valueText).width;
            if (textWidth > maxWidth) { while (textWidth > maxWidth && valueText.length > 3) { valueText = valueText.slice(0, -1); textWidth = ctx.measureText(valueText + '...').width; } valueText = valueText + '...'; }
            ctx.fillText(valueText, width - 20, yPos + 8); yPos += 35;
        });
        
        const montoY = yPos + 10;
        ctx.fillStyle = '#f0f9ff'; ctx.beginPath(); ctx.roundRect(20, montoY - 15, width - 40, 85, 16); ctx.fill();
        ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(20, montoY - 15, width - 40, 85, 16); ctx.stroke();
        ctx.font = 'bold 11px "Plus Jakarta Sans"'; ctx.fillStyle = '#0369a1'; ctx.fillText('MONTO TOTAL', width/2, montoY + 8);
        ctx.font = 'bold 36px "Plus Jakarta Sans"'; ctx.fillStyle = '#0f172a'; ctx.fillText(`Q ${parseFloat(data.mon).toFixed(2)}`, width/2, montoY + 55);
        
        const footerY = height - 65;
        ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, footerY, width, 65);
        ctx.font = 'bold 12px "Plus Jakarta Sans"'; ctx.fillStyle = '#334155'; ctx.fillText('¡Gracias por tu contribución!', width/2, footerY + 28);
        ctx.font = '9px "Plus Jakarta Sans"'; ctx.fillStyle = '#94a3b8'; ctx.fillText('Este comprobante es válido como constancia de pago', width/2, footerY + 48);
        
        resolve(canvas);
    });
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2; if (h < 2 * r) r = h / 2;
        this.moveTo(x+r, y); this.lineTo(x+w-r, y); this.quadraticCurveTo(x+w, y, x+w, y+r);
        this.lineTo(x+w, y+h-r); this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
        this.lineTo(x+r, y+h); this.quadraticCurveTo(x, y+h, x, y+h-r);
        this.lineTo(x, y+r); this.quadraticCurveTo(x, y, x+r, y);
        return this;
    };
}

async function displayReceipt(data) {
    document.getElementById("vNumRecibo").textContent = `REC-${data.num}`;
    document.getElementById("vGrupo").textContent = data.g;
    document.getElementById("vConcepto").textContent = data.concepto;
    document.getElementById("vFecha").textContent = data.fecha;
    document.getElementById("vHora").textContent = data.hora;
    document.getElementById("vMonto").textContent = parseFloat(data.mon).toFixed(2);
    
    const canvas = await generarImagenComprobante(data);
    window.comprobanteCanvas = canvas;
    
    window.showToast("📤 Subiendo imagen...", false);
    try {
        const imagenUrl = await subirImagenCloudinary(canvas, data.num);
        window.imagenCloudinaryUrl = imagenUrl;
        window.showToast("✓ Imagen guardada", false);
    } catch (error) { window.showToast("⚠️ Error al subir imagen", true); window.imagenCloudinaryUrl = null; }
    
    document.getElementById("preview").style.display = "block";
    window.compActual = data;
    setTimeout(() => { document.getElementById("preview").scrollIntoView({ behavior: 'smooth' }); }, 100);
}

// Función para limpiar el formulario
function limpiarFormulario() {
    // Limpiar concepto
    document.getElementById("concepto").value = "";
    // Limpiar monto
    document.getElementById("monto").value = "";
    // Limpiar WhatsApp
    document.getElementById("whatsapp").value = "";
    // Resetear selector de grupo a la opción por defecto
    const grupoSelect = document.getElementById("grupo");
    grupoSelect.value = "";
    // Ocultar campo de "OTRO"
    document.getElementById("campoOtro").style.display = "none";
    document.getElementById("nombreOtro").value = "";
    // Limpiar preview
    document.getElementById("preview").style.display = "none";
    // Limpiar variables globales
    window.compActual = null;
    window.comprobanteCanvas = null;
    window.imagenCloudinaryUrl = null;
}

function getFormData() {
    let grupo = document.getElementById("grupo").value;
    
    // Validar que se haya seleccionado un grupo
    if (!grupo || grupo === "") {
        window.showToast("❌ Por favor selecciona un juvenil", true);
        return null;
    }
    
    if (grupo === "OTRO") {
        grupo = document.getElementById("nombreOtro").value.trim();
        if (!grupo) {
            window.showToast("❌ Escribe el nombre del grupo", true);
            return null;
        }
    }
    
    const concepto = document.getElementById("concepto").value.trim();
    const monto = document.getElementById("monto").value;
    const whatsapp = document.getElementById("whatsapp").value.trim();
    
    if (!concepto) {
        window.showToast("❌ Ingresa un concepto", true);
        return null;
    }
    if (!monto || parseFloat(monto) <= 0) {
        window.showToast("❌ Ingresa un monto válido", true);
        return null;
    }
    if (!whatsapp) {
        window.showToast("❌ Ingresa el número de WhatsApp", true);
        return null;
    }
    
    const numero = document.getElementById("numRecibo").value.replace("REC-", "");
    const ahora = new Date();
    const fechaActual = ahora.toLocaleDateString("es-GT", { day: 'numeric', month: 'long', year: 'numeric' });
    const horaActual = ahora.toLocaleTimeString("es-GT", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    return { grupo, concepto, monto, numero, whatsapp, fecha: fechaActual, hora: horaActual };
}

async function generarComprobante() {
    const formData = getFormData();
    if (!formData) return;
    
    const { grupo, concepto, monto, numero, fecha, hora } = formData;
    const anioActual = new Date().getFullYear();
    
    await asegurarDBCloud(anioActual);
    if (!GRUPOS.includes(grupo)) await addCustomGroup(anioActual, grupo);
    const mesActual = MESES[new Date().getMonth()];
    await updatePaymentStatus(anioActual, grupo, mesActual, "pagado");
    const newNumero = getNextNumero();
    document.getElementById("numRecibo").value = `REC-${getCurrentNumero()}`;
    await displayReceipt({ g: grupo, concepto: concepto, mon: monto, num: newNumero, fecha: fecha, hora: hora });
    
    window.showToast("✓ Comprobante generado exitosamente", false);
    
    // Limpiar el formulario para el siguiente comprobante
    limpiarFormulario();
    
    if (anioActual === window.anioSeleccionado) renderTabla();
}

function checkOtroGrupo() {
    const campoOtro = document.getElementById("campoOtro");
    const grupoSelect = document.getElementById("grupo");
    if (campoOtro) campoOtro.style.display = grupoSelect.value === "OTRO" ? "block" : "none";
}

function actNumeroRecibo() {
    const numRecibo = document.getElementById("numRecibo");
    if (numRecibo) numRecibo.value = `REC-${getCurrentNumero()}`;
}