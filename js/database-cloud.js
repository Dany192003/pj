// js/database-cloud.js - Gestión de datos en Firebase

const GRUPOS = ["Confirmación", "Jeshua", "Jufra", "Lectores", "Mujeres y Hombres Nuevos", "PCV", "Pentecostés", "Roca Fuerte", "San Pablo", "Senderos", "Shadai", "Ssael"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

let db = {};
let ultimoNum = 0;

function logMensaje(mensaje, isError = false) {
    console.log(mensaje);
    if (typeof window.showToast === 'function') {
        window.showToast(mensaje, isError);
    }
}

async function loadDatabase() {
    return new Promise(async (resolve) => {
        try {
            console.log("🔄 Cargando datos desde Firebase...");
            const docCorr = await coleccionCorrelativo.get();
            if (docCorr.exists) {
                ultimoNum = docCorr.data().valor || 0;
            } else {
                ultimoNum = 0;
                await coleccionCorrelativo.set({ valor: 0 });
            }
            
            const snapshot = await coleccionPagos.get();
            db = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                const anio = data.anio;
                if (!db[anio]) db[anio] = [];
                db[anio].push({ grupo: data.grupo, mes: data.mes, estado: data.estado });
            });
            
            const añoActual = new Date().getFullYear();
            await asegurarDBCloud(añoActual);
            console.log("✓ Datos cargados exitosamente");
            resolve(true);
        } catch (error) {
            console.error("Error cargando datos:", error);
            loadDatabaseLocal();
            resolve(false);
        }
    });
}

async function asegurarDBCloud(anio) {
    if (!db[anio]) {
        db[anio] = [];
        for (const grupo of GRUPOS) {
            for (const mes of MESES) {
                const existe = db[anio].some(p => p.grupo === grupo && p.mes === mes);
                if (!existe) {
                    db[anio].push({ grupo, mes, estado: "pendiente" });
                    const docId = `${anio}_${grupo}_${mes}`;
                    await coleccionPagos.doc(docId).set({ anio: anio, grupo: grupo, mes: mes, estado: "pendiente" });
                }
            }
        }
    }
}

async function saveDatabase() {
    try {
        await coleccionCorrelativo.set({ valor: ultimoNum });
        for (const anio in db) {
            for (const pago of db[anio]) {
                const docId = `${anio}_${pago.grupo}_${pago.mes}`;
                await coleccionPagos.doc(docId).set({ anio: parseInt(anio), grupo: pago.grupo, mes: pago.mes, estado: pago.estado });
            }
        }
        saveDatabaseLocal();
        return true;
    } catch (error) {
        console.error("Error guardando:", error);
        saveDatabaseLocal();
        return false;
    }
}

async function resetSistema() {
    return new Promise(async (resolve, reject) => {
        try {
            logMensaje("🔄 Reiniciando TODO el sistema...", false);
            
            const snapshotPagos = await coleccionPagos.get();
            const batchPagos = dbFirestore.batch();
            snapshotPagos.forEach(doc => { batchPagos.delete(doc.ref); });
            await batchPagos.commit();
            
            ultimoNum = 0;
            await coleccionCorrelativo.set({ valor: 0 });
            
            const snapshotPasswords = await coleccionPasswords.get();
            const batchPasswords = dbFirestore.batch();
            snapshotPasswords.forEach(doc => { batchPasswords.delete(doc.ref); });
            await batchPasswords.commit();
            
            const snapshotEventos = await coleccionEventos.get();
            const batchEventos = dbFirestore.batch();
            snapshotEventos.forEach(doc => { batchEventos.delete(doc.ref); });
            await batchEventos.commit();
            
            db = {};
            const añoActual = new Date().getFullYear();
            db[añoActual] = [];
            for (const grupo of GRUPOS) {
                for (const mes of MESES) {
                    db[añoActual].push({ grupo: grupo, mes: mes, estado: "pendiente" });
                    const docId = `${añoActual}_${grupo}_${mes}`;
                    await coleccionPagos.doc(docId).set({ anio: añoActual, grupo: grupo, mes: mes, estado: "pendiente" });
                }
            }
            
            saveDatabaseLocal();
            logMensaje("✓ Sistema reiniciado completamente", false);
            setTimeout(() => location.reload(), 1500);
            resolve(true);
        } catch (error) {
            console.error("Error al reiniciar sistema:", error);
            logMensaje("❌ Error al reiniciar el sistema", true);
            reject(error);
        }
    });
}

async function cargarEventos() {
    const snapshot = await coleccionEventos.get();
    const eventos = [];
    snapshot.forEach(doc => { eventos.push({ id: doc.id, ...doc.data() }); });
    return eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}

async function agregarEvento(fecha, titulo, lugar, descripcion) {
    const evento = { 
        fecha, 
        titulo, 
        lugar: lugar || "", 
        descripcion: descripcion || "",
        creado: new Date().toISOString() 
    };
    const docRef = await coleccionEventos.add(evento);
    return { id: docRef.id, ...evento };
}

async function eliminarEvento(eventoId) {
    await coleccionEventos.doc(eventoId).delete();
}

async function cargarContraseñasGrupos() {
    const snapshot = await coleccionPasswords.get();
    const passwords = {};
    snapshot.forEach(doc => { passwords[doc.id] = doc.data().password; });
    return passwords;
}

async function guardarContraseñaGrupo(grupo, password) {
    await coleccionPasswords.doc(grupo).set({ password: password });
}

async function verificarContraseñaGrupo(grupo, password) {
    const doc = await coleccionPasswords.doc(grupo).get();
    if (doc.exists) return doc.data().password === password;
    return password === "admin123";
}

function loadDatabaseLocal() {
    const storedDb = localStorage.getItem("pj_db_v8");
    const storedCorr = localStorage.getItem("pj_corr_v8");
    if (storedDb) db = JSON.parse(storedDb);
    else db = {};
    if (storedCorr) ultimoNum = parseInt(storedCorr);
    else ultimoNum = 0;
}

function saveDatabaseLocal() {
    localStorage.setItem("pj_db_v8", JSON.stringify(db));
    localStorage.setItem("pj_corr_v8", ultimoNum.toString());
}

async function initDatabase() {
    const snapshot = await coleccionPagos.get();
    const batch = dbFirestore.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    await coleccionCorrelativo.set({ valor: 0 });
    localStorage.removeItem("pj_db_v8");
    localStorage.removeItem("pj_corr_v8");
    db = {};
    ultimoNum = 0;
    const añoActual = new Date().getFullYear();
    await asegurarDBCloud(añoActual);
}

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

function getNextNumero() {
    ultimoNum++;
    saveDatabase();
    return String(ultimoNum).padStart(4, '0');
}

function getCurrentNumero() {
    return String(ultimoNum + 1).padStart(4, '0');
}

async function addCustomGroup(anio, grupo) {
    if (!db[anio]) await asegurarDBCloud(anio);
    const existeGrupo = db[anio].some(item => item.grupo === grupo);
    if (!existeGrupo) {
        for (const mesItem of MESES) {
            db[anio].push({ grupo: grupo, mes: mesItem, estado: "pendiente" });
            const docId = `${anio}_${grupo}_${mesItem}`;
            await coleccionPagos.doc(docId).set({ anio: anio, grupo: grupo, mes: mesItem, estado: "pendiente" });
        }
        await saveDatabase();
        return true;
    }
    return false;
}

// Exportar funciones globales
window.cargarContraseñasGrupos = cargarContraseñasGrupos;
window.verificarContraseñaGrupo = verificarContraseñaGrupo;
window.guardarContraseñaGrupo = guardarContraseñaGrupo;
window.cargarEventos = cargarEventos;
window.agregarEvento = agregarEvento;
window.eliminarEvento = eliminarEvento;
window.resetSistema = resetSistema;
window.loadDatabase = loadDatabase;
window.saveDatabase = saveDatabase;
window.asegurarDBCloud = asegurarDBCloud;
window.updatePaymentStatus = updatePaymentStatus;
window.getNextNumero = getNextNumero;
window.getCurrentNumero = getCurrentNumero;
window.addCustomGroup = addCustomGroup;
window.initDatabase = initDatabase;
window.db = db;
window.GRUPOS = GRUPOS;
window.MESES = MESES;