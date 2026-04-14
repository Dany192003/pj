// js/base-datos-nube.js - Gestión de datos en Firebase

const GRUPOS = [
    'Confirmación', 'Jeshua', 'Jufra', 'Lectores',
    'Mujeres y Hombres Nuevos', 'PCV', 'Pentecostés',
    'Roca Fuerte', 'San Pablo', 'Senderos', 'Shadai', 'Ssael'
];
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

let db = {};
let ultimoNum = 0;

// Función para actualizar el label de sincronización
function actualizarSyncLabel(estado, mensaje) {
    const syncIcon = document.getElementById('syncIcon');
    const syncText = document.getElementById('syncText');
    if (!syncIcon || !syncText) return;
    
    if (estado === 'cargando') {
        syncIcon.innerHTML = '🔄';
        syncIcon.style.animation = 'spin 1s linear infinite';
        syncText.textContent = mensaje || 'Sincronizando...';
    } else if (estado === 'exito') {
        syncIcon.innerHTML = '✅';
        syncIcon.style.animation = 'none';
        syncText.textContent = mensaje || 'Sincronizado';
        setTimeout(() => {
            if (syncIcon && syncText) {
                syncIcon.innerHTML = '☁️';
                syncText.textContent = 'En línea';
            }
        }, 2000);
    } else if (estado === 'error') {
        syncIcon.innerHTML = '⚠️';
        syncIcon.style.animation = 'none';
        syncText.textContent = mensaje || 'Error de conexión';
        setTimeout(() => {
            if (syncIcon && syncText) {
                syncIcon.innerHTML = '☁️';
                syncText.textContent = 'En línea';
            }
        }, 3000);
    }
}

// Agregar estilos para la animación del spinner
if (!document.querySelector('#syncStyles')) {
    const style = document.createElement('style');
    style.id = 'syncStyles';
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// ── Significados de colores ──────────────────────────────────────────────────

async function cargarSignificadosColores() {
    const snapshot = await coleccionSignificadosColores.get();
    const significados = {};
    snapshot.forEach(doc => {
        significados[doc.id] = doc.data().significado;
    });
    return significados;
}

async function guardarSignificadoColor(color, significado) {
    await coleccionSignificadosColores.doc(color).set({ significado: significado });
}

// ── Carga y guardado ──────────────────────────────────────────────────────────

async function loadDatabase() {
    return new Promise(async (resolve) => {
        try {
            actualizarSyncLabel('cargando', 'Cargando datos...');
            console.log("🔄 Cargando datos desde Firebase...");
            
            const docCorr = await coleccionCorrelativo.get();
            ultimoNum = docCorr.exists ? (docCorr.data().valor || 0) : 0;
            if (!docCorr.exists) await coleccionCorrelativo.set({ valor: 0 });

            const snapshot = await coleccionPagos.get();
            db = {};
            snapshot.forEach(doc => {
                const { anio, grupo, mes, estado } = doc.data();
                if (!db[anio]) db[anio] = [];
                db[anio].push({ grupo, mes, estado });
            });

            const anioActual = new Date().getFullYear();
            await asegurarDBCloud(anioActual);
            
            console.log("✓ Datos cargados exitosamente");
            actualizarSyncLabel('exito', 'Sincronizado');
            resolve(true);
        } catch (error) {
            console.error('Error cargando datos:', error);
            actualizarSyncLabel('error', 'Error de conexión');
            loadDatabaseLocal();
            resolve(false);
        }
    });
}

async function asegurarDBCloud(anio) {
    if (!db[anio]) db[anio] = [];

    for (const grupo of GRUPOS) {
        for (const mes of MESES) {
            const existe = db[anio].some(p => p.grupo === grupo && p.mes === mes);
            if (!existe) {
                db[anio].push({ grupo, mes, estado: 'pendiente' });
                const docId = `${anio}_${grupo}_${mes}`;
                await coleccionPagos.doc(docId).set({ anio, grupo, mes, estado: 'pendiente' });
            }
        }
    }
}

async function saveDatabase() {
    try {
        actualizarSyncLabel('cargando', 'Guardando...');
        await coleccionCorrelativo.set({ valor: ultimoNum });
        for (const anio in db) {
            for (const pago of db[anio]) {
                const docId = `${anio}_${pago.grupo}_${pago.mes}`;
                await coleccionPagos.doc(docId).set({
                    anio: parseInt(anio),
                    grupo: pago.grupo,
                    mes: pago.mes,
                    estado: pago.estado
                });
            }
        }
        saveDatabaseLocal();
        actualizarSyncLabel('exito', 'Guardado');
        return true;
    } catch (error) {
        console.error('Error guardando:', error);
        actualizarSyncLabel('error', 'Error al guardar');
        saveDatabaseLocal();
        return false;
    }
}

function loadDatabaseLocal() {
    const storedDb   = localStorage.getItem('pj_db_v8');
    const storedCorr = localStorage.getItem('pj_corr_v8');
    db        = storedDb   ? JSON.parse(storedDb) : {};
    ultimoNum = storedCorr ? parseInt(storedCorr) : 0;
}

function saveDatabaseLocal() {
    localStorage.setItem('pj_db_v8', JSON.stringify(db));
    localStorage.setItem('pj_corr_v8', ultimoNum.toString());
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

async function updatePaymentStatus(anio, grupo, mes, estado) {
    if (!db[anio]) await asegurarDBCloud(anio);
    const record = db[anio].find(p => p.grupo === grupo && p.mes === mes);
    if (record) {
        record.estado = estado;
        await saveDatabase();
        return true;
    }
    return false;
}

async function addCustomGroup(anio, grupo) {
    if (!db[anio]) await asegurarDBCloud(anio);
    const existeGrupo = db[anio].some(item => item.grupo === grupo);
    if (!existeGrupo) {
        for (const mes of MESES) {
            db[anio].push({ grupo, mes, estado: 'pendiente' });
            const docId = `${anio}_${grupo}_${mes}`;
            await coleccionPagos.doc(docId).set({ anio, grupo, mes, estado: 'pendiente' });
        }
        await saveDatabase();
        return true;
    }
    return false;
}

// ── Recibos ───────────────────────────────────────────────────────────────────

function getNextNumero() {
    ultimoNum++;
    saveDatabase();
    return String(ultimoNum).padStart(4, '0');
}

function getCurrentNumero() {
    return String(ultimoNum + 1).padStart(4, '0');
}

// ── Eventos ───────────────────────────────────────────────────────────────────

async function cargarEventos() {
    const snapshot = await coleccionEventos.get();
    const eventos = [];
    snapshot.forEach(doc => eventos.push({ id: doc.id, ...doc.data() }));
    return eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

async function agregarEvento(fecha, titulo, lugar, descripcion, color) {
    const evento = {
        fecha,
        titulo,
        lugar: lugar || '',
        descripcion: descripcion || '',
        color: color || '#0891b2',
        creado: new Date().toISOString()
    };
    const docRef = await coleccionEventos.add(evento);
    return { id: docRef.id, ...evento };
}

async function eliminarEvento(eventoId) {
    await coleccionEventos.doc(eventoId).delete();
}

// ── Contraseñas ───────────────────────────────────────────────────────────────

async function cargarContraseñasGrupos() {
    const snapshot = await coleccionPasswords.get();
    const passwords = {};
    snapshot.forEach(doc => { passwords[doc.id] = doc.data().password; });
    return passwords;
}

async function guardarContraseñaGrupo(grupo, password) {
    await coleccionPasswords.doc(grupo).set({ password });
}

async function verificarContraseñaGrupo(grupo, password) {
    const doc = await coleccionPasswords.doc(grupo).get();
    if (doc.exists) return doc.data().password === password;
    return password === 'admin123';
}

// ── Recursos / Biblioteca ─────────────────────────────────────────────────────

async function cargarRecursos() {
    const snapshot = await coleccionRecursos.get();
    const recursos = [];
    snapshot.forEach(doc => recursos.push({ id: doc.id, ...doc.data() }));
    return recursos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

async function agregarRecurso(titulo, categoria, descripcion, url, tipo, publicId, resourceType) {
    const recurso = {
        titulo,
        categoria,
        descripcion: descripcion || '',
        url,
        tipo,
        public_id: publicId || '',
        resource_type: resourceType || 'image',
        fecha: new Date().toISOString()
    };
    const docRef = await coleccionRecursos.add(recurso);
    return { id: docRef.id, ...recurso };
}

async function eliminarRecursoCloud(recursoId) {
    const doc = await coleccionRecursos.doc(recursoId).get();
    if (doc.exists) {
        await coleccionRecursos.doc(recursoId).delete();
        return true;
    }
    return false;
}

// ── Categorías ────────────────────────────────────────────────────────────────

async function cargarCategorias() {
    const snapshot = await coleccionCategorias.get();
    const categorias = [];
    snapshot.forEach(doc => categorias.push({ id: doc.id, ...doc.data() }));
    return categorias.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

async function agregarCategoria(nombre, icono = '📁') {
    const categoria = { nombre, icono, fecha: new Date().toISOString() };
    const docRef = await coleccionCategorias.add(categoria);
    return { id: docRef.id, ...categoria };
}

async function eliminarCategoria(categoriaId) {
    const snapshot = await coleccionRecursos.where('categoria', '==', categoriaId).get();
    if (!snapshot.empty) {
        throw new Error(`No se puede eliminar: tiene ${snapshot.size} recursos asociados`);
    }
    await coleccionCategorias.doc(categoriaId).delete();
}

async function actualizarCategoria(categoriaId, nombre, icono) {
    await coleccionCategorias.doc(categoriaId).update({ nombre, icono });
}

// ── Reset sistema ─────────────────────────────────────────────────────────────
async function resetSistema(opciones) {
    return new Promise(async (resolve, reject) => {
        try {
            actualizarSyncLabel('cargando', 'Reiniciando...');
            
            const deleteCollection = async (coleccion) => {
                const snap = await coleccion.get();
                const batch = dbFirestore.batch();
                snap.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            };

            // Eliminar recursos de Cloudinary antes de borrar de Firestore
            if (opciones?.biblioteca && typeof window.eliminarDeCloudinary === 'function') {
                const snapRecursos = await coleccionRecursos.get();
                for (const doc of snapRecursos.docs) {
                    const data = doc.data();
                    if (data.public_id) {
                        await window.eliminarDeCloudinary(data.public_id, data.resource_type || 'image');
                    }
                }
            }

            if (opciones?.historial && typeof window.eliminarDeCloudinary === 'function') {
                const snapHistorial = await coleccionHistorialRecibos.get();
                for (const doc of snapHistorial.docs) {
                    const data = doc.data();
                    if (data.public_id) {
                        await window.eliminarDeCloudinary(data.public_id, 'image');
                    }
                }
            }

            if (opciones?.pagos) await deleteCollection(coleccionPagos);
            if (opciones?.actividades) await deleteCollection(coleccionEventos);
            if (opciones?.passwords) await deleteCollection(coleccionPasswords);
            if (opciones?.biblioteca) await deleteCollection(coleccionRecursos);
            if (opciones?.categorias) await deleteCollection(coleccionCategorias);
            if (opciones?.historial) await deleteCollection(coleccionHistorialRecibos);
            if (opciones?.significados) await deleteCollection(coleccionSignificadosColores);
            if (opciones?.grupos) await deleteCollection(coleccionGruposInfo);  // ← NUEVO

            if (opciones?.recibos) {
                ultimoNum = 0;
                await coleccionCorrelativo.set({ valor: 0 });
            }

            if (opciones?.pagos) {
                db = {};
                const anioActual = new Date().getFullYear();
                await asegurarDBCloud(anioActual);
            }

            saveDatabaseLocal();
            actualizarSyncLabel('exito', 'Reiniciado');
            setTimeout(() => location.reload(), 1500);
            resolve(true);
        } catch (error) {
            console.error('Error al reiniciar:', error);
            actualizarSyncLabel('error', 'Error al reiniciar');
            reject(error);
        }
    });
}

async function initDatabase() {
    const snapshot = await coleccionPagos.get();
    const batch = dbFirestore.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    await coleccionCorrelativo.set({ valor: 0 });
    localStorage.removeItem('pj_db_v8');
    localStorage.removeItem('pj_corr_v8');
    db = {};
    ultimoNum = 0;
    await asegurarDBCloud(new Date().getFullYear());
}

// ── Exportar al scope global ──────────────────────────────────────────────────

Object.assign(window, {
    db, GRUPOS, MESES,
    loadDatabase, saveDatabase, asegurarDBCloud, initDatabase,
    updatePaymentStatus, addCustomGroup,
    getNextNumero, getCurrentNumero,
    cargarEventos, agregarEvento, eliminarEvento,
    cargarContraseñasGrupos, guardarContraseñaGrupo, verificarContraseñaGrupo,
    cargarRecursos, agregarRecurso, eliminarRecursoCloud,
    cargarCategorias, agregarCategoria, eliminarCategoria, actualizarCategoria,
    cargarSignificadosColores, guardarSignificadoColor,
    resetSistema
});