// js/biblioteca-usuario.js - Biblioteca para usuarios

let recursosGlobal = [];
let categoriaActual = "todos";
let busquedaActual = "";

window.showToast = function(message, isError = false) {
    const toast = document.getElementById("toast");
    if (!toast) { console.log(message); return; }
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#dc2626" : "#10b981";
    toast.className = "toast show";
    setTimeout(() => { toast.className = "toast"; }, 2000);
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadDatabase();
    await cargarRecursos();
    await cargarCategoriasUsuario();
    
    const btnVolver = document.getElementById("btnVolver");
    if (btnVolver) btnVolver.onclick = () => window.location.href = "index.html";
    
    const buscador = document.getElementById("buscadorInput");
    if (buscador) {
        buscador.addEventListener("input", (e) => {
            busquedaActual = e.target.value.toLowerCase();
            filtrarRecursos();
        });
    }
    
    const modal = document.getElementById("modalPreview");
    const closeBtn = document.querySelector(".modal-preview-close");
    if (closeBtn) {
        closeBtn.onclick = () => {
            if (modal) modal.style.display = "none";
        };
    }
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
});

async function cargarRecursos() {
    const recursosGrid = document.getElementById("recursosGrid");
    if (!recursosGrid) return;
    
    recursosGrid.innerHTML = '<div class="loading-recursos">📚 Cargando recursos...</div>';
    
    try {
        const snapshot = await coleccionRecursos.get();
        recursosGlobal = [];
        snapshot.forEach(doc => {
            recursosGlobal.push({ id: doc.id, ...doc.data() });
        });
        
        recursosGlobal.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        filtrarRecursos();
    } catch (error) {
        console.error("Error cargando recursos:", error);
        recursosGrid.innerHTML = '<div class="sin-recursos">❌ Error al cargar recursos</div>';
    }
}

async function cargarCategoriasUsuario() {
    const categoriasDiv = document.getElementById("categoriasList");
    if (!categoriasDiv) return;
    
    try {
        const categorias = await cargarCategorias();
        
        if (categorias.length === 0) {
            categoriasDiv.innerHTML = '<p style="text-align: center; color: #64748b;">No hay categorías disponibles</p>';
            return;
        }
        
        categoriasDiv.innerHTML = categorias.map(cat => `
            <button class="categoria-btn" data-categoria="${cat.id}">${cat.icono || '📁'} ${cat.nombre}</button>
        `).join("");
        
        document.querySelectorAll('.categoria-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                categoriaActual = btn.dataset.categoria;
                filtrarRecursos();
            });
        });
        
    } catch (error) {
        console.error("Error cargando categorías:", error);
        categoriasDiv.innerHTML = '<p style="text-align: center; color: #64748b;">Error al cargar categorías</p>';
    }
}

function filtrarRecursos() {
    let filtrados = [...recursosGlobal];
    
    if (categoriaActual !== "todos") {
        filtrados = filtrados.filter(r => r.categoria === categoriaActual);
    }
    
    if (busquedaActual) {
        filtrados = filtrados.filter(r => 
            r.titulo.toLowerCase().includes(busquedaActual) ||
            (r.descripcion && r.descripcion.toLowerCase().includes(busquedaActual))
        );
    }
    
    renderizarRecursos(filtrados);
}

async function renderizarRecursos(recursos) {
    const recursosGrid = document.getElementById("recursosGrid");
    if (!recursosGrid) return;
    
    if (recursos.length === 0) {
        recursosGrid.innerHTML = '<div class="sin-recursos">📭 No hay recursos disponibles</div>';
        return;
    }
    
    const categoriasMap = {};
    const categoriasSnapshot = await coleccionCategorias.get();
    categoriasSnapshot.forEach(doc => {
        categoriasMap[doc.id] = { nombre: doc.data().nombre, icono: doc.data().icono || '📁' };
    });
    
    recursosGrid.innerHTML = recursos.map(recurso => {
        const categoria = categoriasMap[recurso.categoria];
        const categoriaDisplay = categoria ? `${categoria.icono} ${categoria.nombre}` : '📁 Sin categoría';
        const esImagen = recurso.tipo === "image" || (recurso.url && (recurso.url.includes('.jpg') || recurso.url.includes('.png') || recurso.url.includes('.jpeg') || recurso.url.includes('.webp')));
        const previewHtml = esImagen 
            ? `<img src="${recurso.url}" alt="${recurso.titulo}" loading="lazy">`
            : `<div class="file-icon">📄</div>`;
        
        const fechaFormateada = formatearFechaCompleta(recurso.fecha);
        
        return `
            <div class="recurso-card" data-url="${recurso.url}" data-titulo="${recurso.titulo}" data-tipo="${recurso.tipo}">
                <div class="recurso-preview">
                    ${previewHtml}
                </div>
                <div class="recurso-info">
                    <div class="recurso-categoria">${categoriaDisplay}</div>
                    <div class="recurso-titulo">${escapeHtml(recurso.titulo)}</div>
                    <div class="recurso-descripcion">${escapeHtml(recurso.descripcion || '')}</div>
                    <div class="recurso-footer">
                        <div class="recurso-fecha">
                            <span>📅 ${fechaFormateada}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-ver" data-url="${recurso.url}" data-titulo="${recurso.titulo}">👁️ Ver</button>
                            <button class="btn-descargar" data-url="${recurso.url}" data-titulo="${recurso.titulo}">⬇️ Descargar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
    
    document.querySelectorAll('.btn-ver').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            const titulo = btn.dataset.titulo;
            abrirPreview(url, titulo);
        });
    });
    
    document.querySelectorAll('.btn-descargar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            const titulo = btn.dataset.titulo;
            descargarDirecto(url, titulo);
        });
    });
}

function abrirPreview(url, titulo) {
    const modal = document.getElementById("modalPreview");
    const modalBody = document.getElementById("modalPreviewBody");
    
    if (!modal || !modalBody) return;
    
    const esImagen = url && (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') || url.includes('.webp'));
    
    if (esImagen) {
        modalBody.innerHTML = `<img src="${url}" alt="${titulo}">`;
    } else {
        modalBody.innerHTML = `<iframe src="${url}" class="pdf-viewer" frameborder="0" title="${titulo}"></iframe>`;
    }
    
    modal.style.display = "block";
}

// Función mejorada para descargar directamente desde Cloudinary
function descargarDirecto(url, titulo) {
    // Limpiar el nombre del archivo
    let nombreLimpio = titulo.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    
    // Determinar la extensión del archivo
    let extension = 'pdf';
    if (url.includes('.jpg') || url.includes('.jpeg')) extension = 'jpg';
    else if (url.includes('.png')) extension = 'png';
    else if (url.includes('.gif')) extension = 'gif';
    else if (url.includes('.webp')) extension = 'webp';
    
    // Agregar parámetro para forzar descarga en Cloudinary (fl_attachment)
    let urlDescarga = url;
    
    // Si es un PDF o imagen, agregar fl_attachment para forzar descarga
    if (url.includes('cloudinary.com')) {
        // Para Cloudinary, agregar fl_attachment al final de la URL
        if (url.includes('/upload/')) {
            urlDescarga = url.replace('/upload/', '/upload/fl_attachment/');
        } else if (url.includes('/image/upload/')) {
            urlDescarga = url.replace('/image/upload/', '/image/upload/fl_attachment/');
        } else if (url.includes('/raw/upload/')) {
            urlDescarga = url.replace('/raw/upload/', '/raw/upload/fl_attachment/');
        }
    }
    
    console.log("📥 Descargando desde:", urlDescarga);
    
    // Crear enlace invisible y forzar descarga
    const link = document.createElement('a');
    link.href = urlDescarga;
    link.download = `${nombreLimpio}.${extension}`;
    link.setAttribute('download', `${nombreLimpio}.${extension}`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Limpiar después de un momento
    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
    
    window.showToast(`⬇️ Descargando: ${titulo}`, false);
}

function formatearFechaCompleta(fechaISO) {
    if (!fechaISO) return "Fecha no disponible";
    
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diferencia = Math.floor((ahora - fecha) / (1000 * 60 * 60 * 24));
    
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = fecha.toLocaleDateString("es-GT", opciones);
    
    if (diferencia === 0) {
        return `Hoy, ${fechaFormateada}`;
    } else if (diferencia === 1) {
        return `Ayer, ${fechaFormateada}`;
    } else if (diferencia < 7) {
        return `Hace ${diferencia} días, ${fechaFormateada}`;
    }
    
    return fechaFormateada;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}