// js/recibos.js - Generación de recibos con imagen nativa

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

function mostrarBarraProgreso(porcentaje, mensaje) {
    let barraContainer = document.getElementById("barraProgresoContainer");
    
    if (!barraContainer && porcentaje < 100) {
        const barraHTML = `
            <div id="barraProgresoContainer" class="barra-progreso-container">
                <div class="barra-progreso-content">
                    <div class="barra-progreso-header">
                        <span class="barra-progreso-icon">📤</span>
                        <span id="barraProgresoMensaje">Generando imagen...</span>
                    </div>
                    <div class="barra-progreso-barra">
                        <div id="barraProgresoFill" class="barra-progreso-fill" style="width: 0%"></div>
                    </div>
                    <div class="barra-progreso-footer">
                        <span id="barraProgresoPorcentaje">0%</span>
                        <span id="barraProgresoEstado">Iniciando...</span>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", barraHTML);
        barraContainer = document.getElementById("barraProgresoContainer");
    }
    
    if (barraContainer) {
        if (porcentaje >= 100) {
            setTimeout(() => {
                barraContainer.style.opacity = "0";
                setTimeout(() => {
                    if (barraContainer) barraContainer.remove();
                }, 500);
            }, 500);
        } else {
            barraContainer.style.display = "flex";
            const fill = document.getElementById("barraProgresoFill");
            const porcentajeSpan = document.getElementById("barraProgresoPorcentaje");
            const mensajeSpan = document.getElementById("barraProgresoMensaje");
            const estadoSpan = document.getElementById("barraProgresoEstado");
            
            if (fill) fill.style.width = `${porcentaje}%`;
            if (porcentajeSpan) porcentajeSpan.textContent = `${porcentaje}%`;
            if (mensajeSpan) mensajeSpan.textContent = mensaje || "Generando imagen...";
            if (estadoSpan) {
                if (porcentaje < 30) estadoSpan.textContent = "🎨 Creando diseño...";
                else if (porcentaje < 70) estadoSpan.textContent = "📤 Subiendo a la nube...";
                else if (porcentaje < 100) estadoSpan.textContent = "⚙️ Finalizando...";
                else estadoSpan.textContent = "✅ Completado!";
            }
        }
    }
}

function ocultarBarraProgreso() {
    const barra = document.getElementById("barraProgresoContainer");
    if (barra) {
        barra.style.opacity = "0";
        setTimeout(() => {
            if (barra) barra.remove();
        }, 500);
    }
}

function construirMensajeConEmojis(registro) {
    const estadoTexto = registro.estado || "PAGADO";
    return `✅ *COMPROBANTE DE PAGO - Pastoral Juvenil* ✅\n\n👥 *Juvenil:* ${registro.g}\n📌 *Concepto:* ${registro.concepto}\n💰 *Monto:* Q ${parseFloat(registro.mon).toFixed(2)}\n🔢 *No. Recibo:* REC-${registro.num}\n📆 *Fecha:* ${registro.fecha}\n⏰ *Hora:* ${registro.hora}\n✅ *Estado:* ${estadoTexto}\n\n_Gracias por tu contribución al movimiento juvenil._`;
}

function generarImagenComprobante(data, estado) {
    return new Promise((resolve) => {
        const width = 500;
        const height = 620;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        const gradiente = ctx.createLinearGradient(0, 0, 0, 100);
        gradiente.addColorStop(0, '#0f172a');
        gradiente.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradiente;
        ctx.fillRect(0, 0, width, 100);
        
        ctx.font = '48px "Segoe UI Emoji", "Apple Color Emoji"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('⛪', width / 2, 55);
        
        ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('COMPROBANTE DE PAGO', width / 2, 85);
        
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 100, width, 65);
        ctx.font = '10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#0891b2';
        ctx.fillText('NÚMERO DE RECIBO', width / 2, 128);
        ctx.font = 'bold 26px "Courier New", monospace';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`REC-${data.num}`, width / 2, 158);
        
        let yPos = 185;
        const infoItems = [
            { icon: '👥', label: 'JUVENIL', value: data.g },
            { icon: '📌', label: 'CONCEPTO', value: data.concepto },
            { icon: '📆', label: 'FECHA', value: data.fecha },
            { icon: '⏰', label: 'HORA', value: data.hora }
        ];
        
        infoItems.forEach((item) => {
            ctx.beginPath();
            ctx.strokeStyle = '#e2e8f0';
            ctx.setLineDash([5, 5]);
            ctx.moveTo(20, yPos - 5);
            ctx.lineTo(width - 20, yPos - 5);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'left';
            ctx.fillText(`${item.icon} ${item.label}`, 20, yPos + 10);
            
            ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'right';
            let valueText = item.value;
            const maxWidth = width - 140;
            if (ctx.measureText(valueText).width > maxWidth) {
                while (ctx.measureText(valueText + '...').width > maxWidth && valueText.length > 3) {
                    valueText = valueText.slice(0, -1);
                }
                valueText = valueText + '...';
            }
            ctx.fillText(valueText, width - 20, yPos + 10);
            
            yPos += 40;
        });
        
        ctx.fillStyle = estado === "PAGADO" ? "#dcfce7" : "#fef9c3";
        ctx.fillRect(20, yPos, width - 40, 45);
        ctx.strokeStyle = estado === "PAGADO" ? "#15803d" : "#f97316";
        ctx.lineWidth = 1;
        ctx.strokeRect(20, yPos, width - 40, 45);
        
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = estado === "PAGADO" ? "#15803d" : "#f97316";
        ctx.textAlign = 'center';
        ctx.fillText('ESTADO', width / 2, yPos + 18);
        
        ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = estado === "PAGADO" ? "#15803d" : "#f97316";
        ctx.fillText(estado, width / 2, yPos + 38);
        
        yPos += 60;
        
        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(20, yPos, width - 40, 75);
        ctx.strokeStyle = '#bae6fd';
        ctx.strokeRect(20, yPos, width - 40, 75);
        
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#0369a1';
        ctx.fillText('MONTO TOTAL', width / 2, yPos + 22);
        
        ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`Q ${parseFloat(data.mon).toFixed(2)}`, width / 2, yPos + 62);
        
        yPos += 90;
        
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, height - 55, width, 55);
        
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText('¡Gracias por tu contribución!', width / 2, height - 32);
        
        ctx.font = '9px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Parroquia San Agustín - Sumpango', width / 2, height - 15);
        
        resolve(canvas);
    });
}

async function subirImagenCloudinary(canvas, reciboNum) {
    mostrarBarraProgreso(50, "Generando imagen...");
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 1.0));
    mostrarBarraProgreso(60, "Preparando subida...");
    
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", "comprobantes");
    formData.append("folder", "comprobantes");
    formData.append("public_id", `REC-${reciboNum}_${Date.now()}`);
    
    console.log("📤 Subiendo a Cloudinary...");
    mostrarBarraProgreso(70, "Subiendo a la nube...");
    
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
    mostrarBarraProgreso(100, "¡Completado!");
    
    setTimeout(() => ocultarBarraProgreso(), 1000);
    
    // Retornar URL y public_id para poder eliminar después
    return { url: data.secure_url, public_id: data.public_id };
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

function mostrarVistaPrevia(data) {
    console.log("📄 Mostrando vista previa del comprobante (ESTADO: PENDIENTE)");
    
    const tempNum = getCurrentNumero();
    
    document.getElementById("vNumRecibo").textContent = `REC-${tempNum}`;
    document.getElementById("vGrupo").textContent = data.g;
    document.getElementById("vConcepto").textContent = data.concepto;
    document.getElementById("vFecha").textContent = data.fecha;
    document.getElementById("vHora").textContent = data.hora;
    document.getElementById("vMonto").textContent = parseFloat(data.mon).toFixed(2);
    
    const estadoElement = document.getElementById("vEstado");
    if (estadoElement) {
        estadoElement.textContent = "PENDIENTE";
        estadoElement.style.color = "#f97316";
        estadoElement.style.fontWeight = "800";
    }
    
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
        
        document.getElementById("vNumRecibo").textContent = `REC-${nuevoNumero}`;
        
        const estadoElement = document.getElementById("vEstado");
        if (estadoElement) {
            estadoElement.textContent = "PAGADO";
            estadoElement.style.color = "#15803d";
            estadoElement.style.fontWeight = "800";
        }
        
        const estadoRow = document.getElementById("estadoRow");
        if (estadoRow) {
            estadoRow.style.background = "#dcfce7";
        }
        
        mostrarBarraProgreso(10, "Creando imagen...");
        const canvas = await generarImagenComprobante({
            g: datos.g,
            concepto: datos.concepto,
            mon: datos.mon,
            num: nuevoNumero,
            fecha: datos.fecha,
            hora: datos.hora
        }, "PAGADO");
        
        const imagenResult = await subirImagenCloudinary(canvas, nuevoNumero);
        window.imagenCloudinaryUrl = imagenResult.url;
        
        // Guardar en historial de comprobantes
        if (typeof window.guardarComprobanteHistorial === 'function') {
            await window.guardarComprobanteHistorial({
                numero: nuevoNumero,
                juvenil: datos.g,
                concepto: datos.concepto,
                monto: datos.mon,
                fecha: datos.fecha,
                hora: datos.hora,
                url: imagenResult.url,
                public_id: imagenResult.public_id
            });
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
        ocultarBarraProgreso();
        console.error("❌ Error al guardar comprobante:", error);
        window.showToast("❌ Error al guardar el comprobante", true);
        return false;
    }
}

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

window.generarVistaPrevia = generarVistaPrevia;
window.confirmarYGuardarComprobante = confirmarYGuardarComprobante;
window.limpiarFormulario = limpiarFormulario;
window.actNumeroReciboPreview = actNumeroReciboPreview;
window.checkOtroGrupo = checkOtroGrupo;