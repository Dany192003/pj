// js/biblioteca-admin.js - Gestión de biblioteca con eliminación directa

let recursoEditando = null;

// Función para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Función para eliminar de Cloudinary usando API con firma
async function eliminarDeCloudinary(publicId, resourceType = 'image') {
    return new Promise(async (resolve, reject) => {
        try {
            // Usar una petición con timestamp y firma
            // Nota: Esto requiere configuración adicional en Cloudinary
            console.log("🗑️ Eliminando de Cloudinary:", publicId);
            
            // Método alternativo: marcar como privado en lugar de eliminar
            // Cloudinary no permite eliminación directa desde frontend sin autenticación
            // Por ahora, solo eliminamos de Firestore
            resolve(false);
        } catch (error) {
            reject(error);
        }
    });
}

// Eliminar recurso (de Firestore y opcionalmente de Cloudinary)
async function eliminarRecursoCloud(recursoId) {
    console.log("🗑️ Eliminando recurso:", recursoId);
    
    const doc = await coleccionRecursos.doc(recursoId).get();
    if (doc.exists) {
        const recurso = doc.data();
        const publicId = recurso.public_id;
        
        // Intentar eliminar de Cloudinary (si tenemos public_id)
        if (publicId) {
            try {
                // Cloudinary no permite eliminación directa desde frontend
                // Como alternativa, podemos sobrescribir el archivo o marcarlo como privado
                console.log("ℹ️ El archivo permanece en Cloudinary, pero ya no está en la biblioteca");
                window.showToast("ℹ️ Recurso eliminado de la biblioteca (el archivo permanece en la nube)", false);
            } catch (e) {
                console.log("No se pudo eliminar de Cloudinary:", e);
            }
        }
    }
    
    // Eliminar de Firestore
    await coleccionRecursos.doc(recursoId).delete();
    console.log("✓ Recurso eliminado de Firestore");
}

// El resto del código permanece igual...
async function cargarRecursosAdmin() {
    const recursosTableBody = document.getElementById("recursosTableBody");
    if (!recursosTableBody) return;
    
    try {
        const snapshot = await coleccionRecursos.get();
        const recursos = [];
        snapshot.forEach(doc => {
            recursos.push({ id: doc.id, ...doc.data() });
        });
        
        recursos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        const categoriasNombres = {
            formacion: "📖 Formación",
            espiritualidad: "🙏 Espiritualidad",
            actividades: "🎮 Actividades",
            documentos: "📄 Documentos",
            otros: "📁 Otros"
        };
        
        if (recursos.length === 0) {
            recursosTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">📭 No hay recursos disponibles</td>' + '<\/tr>';
            return;
        }
        
        recursosTableBody.innerHTML = recursos.map(recurso => `
            <tr>
                <td><strong>${escapeHtml(recurso.titulo)}</strong></td>
                <td><span class="categoria-badge">${categoriasNombres[recurso.categoria] || recurso.categoria}</span></td>
                <td>${recurso.descripcion ? escapeHtml(recurso.descripcion.substring(0, 60)) + (recurso.descripcion.length > 60 ? '...' : '') : '-'}</td>
                <td>
                    <a href="${recurso.url}" target="_blank" class="btn-ver" data-url="${recurso.url}">👁️ Ver</a>
                    <button class="btn-eliminar-recurso" data-id="${recurso.id}" data-url="${recurso.url}">🗑️ Eliminar</button>
                 </td>
             </tr>
        `).join("");
        
        document.querySelectorAll('.btn-eliminar-recurso').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                if (confirm("¿Eliminar este recurso permanentemente?")) {
                    await eliminarRecursoCloud(id);
                    await cargarRecursosAdmin();
                    window.showToast("✓ Recurso eliminado de la biblioteca", false);
                }
            };
        });
        
    } catch (error) {
        console.error("Error cargando recursos:", error);
        recursosTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">❌ Error al cargar recursos</td>' + '<\/tr>';
    }
}

// Subir archivo a Cloudinary
async function subirArchivoCloudinary(file, titulo) {
    return new Promise(async (resolve, reject) => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "comprobantes");
            formData.append("folder", "biblioteca");
            
            const nombreLimpio = titulo.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            const publicId = `biblioteca_${Date.now()}_${nombreLimpio}`;
            formData.append("public_id", publicId);
            
            console.log("📤 Subiendo a Cloudinary...", { nombre: file.name, tamaño: file.size });
            
            const res = await fetch("https://api.cloudinary.com/v1_1/dyzpdl9tg/upload", {
                method: "POST",
                body: formData
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error("❌ Error Cloudinary:", errorText);
                throw new Error(`Error en Cloudinary: ${res.status}`);
            }
            
            const data = await res.json();
            console.log("✓ Archivo subido exitosamente:", data.secure_url);
            
            resolve({
                url: data.secure_url,
                public_id: data.public_id,
                resource_type: data.resource_type
            });
            
        } catch (error) {
            console.error("❌ Error en subida:", error);
            reject(error);
        }
    });
}

// Subir recurso
async function subirRecurso(file, titulo, categoria, descripcion) {
    return new Promise(async (resolve, reject) => {
        try {
            mostrarProgreso(20);
            const result = await subirArchivoCloudinary(file, titulo);
            mostrarProgreso(80);
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

// Agregar recurso a Firestore
async function agregarRecursoFirestore(titulo, categoria, descripcion, url, publicId, resourceType, tipo) {
    const recurso = {
        titulo: titulo,
        categoria: categoria,
        descripcion: descripcion || "",
        url: url,
        public_id: publicId || "",
        resource_type: resourceType || "image",
        tipo: tipo,
        fecha: new Date().toISOString()
    };
    
    const docRef = await coleccionRecursos.add(recurso);
    return { id: docRef.id, ...recurso };
}

// Mostrar barra de progreso
function mostrarProgreso(porcentaje) {
    let progressBar = document.getElementById("uploadProgress");
    if (!progressBar) {
        const btn = document.getElementById("btnSubirRecurso");
        if (btn) {
            const progressHTML = `<div id="uploadProgress" style="margin-top: 10px; background: #e2e8f0; border-radius: 10px; height: 6px; overflow: hidden; display: none;"><div style="width: 0%; height: 100%; background: linear-gradient(90deg, #0891b2, #3b82f6); transition: width 0.3s;"></div></div>`;
            btn.insertAdjacentHTML("afterend", progressHTML);
            progressBar = document.getElementById("uploadProgress");
        }
    }
    
    if (progressBar) {
        if (porcentaje > 0 && porcentaje < 100) {
            progressBar.style.display = "block";
        }
        const fill = progressBar.querySelector("div");
        if (fill) fill.style.width = `${porcentaje}%`;
    }
}

function ocultarProgreso() {
    const progressBar = document.getElementById("uploadProgress");
    if (progressBar) {
        setTimeout(() => {
            progressBar.style.display = "none";
            const fill = progressBar.querySelector("div");
            if (fill) fill.style.width = "0%";
        }, 1000);
    }
}

// Evento de subida
document.addEventListener('DOMContentLoaded', () => {
    const btnSubirRecurso = document.getElementById("btnSubirRecurso");
    if (btnSubirRecurso) {
        btnSubirRecurso.onclick = async () => {
            const titulo = document.getElementById("recursoTitulo").value.trim();
            const categoria = document.getElementById("recursoCategoria").value;
            const descripcion = document.getElementById("recursoDescripcion").value.trim();
            const archivo = document.getElementById("recursoArchivo").files[0];
            
            if (!titulo) {
                window.showToast("❌ Ingresa un título", true);
                return;
            }
            if (!archivo) {
                window.showToast("❌ Selecciona un archivo", true);
                return;
            }
            
            if (archivo.size > 10 * 1024 * 1024) {
                window.showToast("❌ El archivo es demasiado grande (máx 10MB)", true);
                return;
            }
            
            const tipo = archivo.type.startsWith('image/') ? 'image' : 'pdf';
            
            window.showToast("📤 Subiendo archivo...", false);
            btnSubirRecurso.disabled = true;
            btnSubirRecurso.innerHTML = '<span class="spinner"></span> Subiendo...';
            mostrarProgreso(10);
            
            try {
                const result = await subirRecurso(archivo, titulo, categoria, descripcion);
                mostrarProgreso(90);
                
                await agregarRecursoFirestore(titulo, categoria, descripcion, result.url, result.public_id, result.resource_type, tipo);
                mostrarProgreso(100);
                
                document.getElementById("recursoTitulo").value = "";
                document.getElementById("recursoDescripcion").value = "";
                document.getElementById("recursoArchivo").value = "";
                document.getElementById("previewArchivo").innerHTML = "";
                
                await cargarRecursosAdmin();
                window.showToast("✓ Recurso subido exitosamente", false);
                ocultarProgreso();
                
            } catch (error) {
                console.error("Error:", error);
                ocultarProgreso();
                window.showToast("❌ Error al subir el recurso: " + (error.message || "Error desconocido"), true);
            } finally {
                btnSubirRecurso.disabled = false;
                btnSubirRecurso.innerHTML = "📤 Subir Recurso";
            }
        };
    }
    
    const inputArchivo = document.getElementById("recursoArchivo");
    if (inputArchivo) {
        inputArchivo.onchange = (e) => {
            const previewDiv = document.getElementById("previewArchivo");
            const file = e.target.files[0];
            if (file) {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        previewDiv.innerHTML = `<img src="${e.target.result}" style="max-width: 100px; max-height: 100px; border-radius: 8px;">`;
                    };
                    reader.readAsDataURL(file);
                } else if (file.type === 'application/pdf') {
                    previewDiv.innerHTML = `<div style="padding: 10px; background: #f1f5f9; border-radius: 8px;">📄 ${file.name}</div>`;
                } else {
                    previewDiv.innerHTML = `<div style="padding: 10px; background: #f1f5f9; border-radius: 8px;">📎 ${file.name}</div>`;
                }
            } else {
                previewDiv.innerHTML = "";
            }
        };
    }
});