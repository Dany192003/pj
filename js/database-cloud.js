// js/database-cloud.js - Gestión de datos en Firebase

// Constantes globales
const GRUPOS = ["Confirmación", "Jeshua", "Jufra", "Lectores", "Mujeres y Hombres Nuevos", "PCV", "Pentecostés", "Roca Fuerte", "San Pablo", "Senderos", "Shadai", "Ssael"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Estado global
let db = {};
let ultimoNum = 0;
let datosCargados = false;

// Función interna para mostrar mensajes
function logMensaje(mensaje, isError = false) {
    console.log(mensaje);
    if (typeof window.showToast === 'function') {
        window.showToast(mensaje, isError);
    }
}

// Cargar datos desde Firebase
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
                db[anio].push({
                    grupo: data.grupo,
                    mes: data.mes,
                    estado: data.estado
                });
            });
            
            const añoActual = new Date().getFullYear();
            await asegurarDBCloud(añoActual);
            
            datosCargados = true;
            console.log("✓ Datos cargados exitosamente");
            resolve(true);
        } catch (error) {
            console.error("Error cargando datos:", error);
            loadDatabaseLocal();
            resolve(false);
        }
    });
}

// Asegurar estructura para un año
async function asegurarDBCloud(anio) {
    if (!db[anio]) {
        db[anio] = [];
        for (const grupo of GRUPOS) {
            for (const mes of MESES) {
                const existe = db[anio].some(p => p.grupo === grupo && p.mes === mes);
                if (!existe) {
                    db[anio].push({ grupo, mes, estado: "pendiente" });
                    const docId = `${anio}_${grupo}_${mes}`;
                    await coleccionPagos.doc(docId).set({
                        anio: anio,
                        grupo: grupo,
                        mes: mes,
                        estado: "pendiente"
                    });
                }
            }
        }
    }
}

// Guardar datos en Firebase
async function saveDatabase() {
    try {
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
        return true;
    } catch (error) {
        console.error("Error guardando en cloud:", error);
        saveDatabaseLocal();
        return false;
    }
}

// Resetear toda la base de datos
async function resetDatabase() {
    return new Promise(async (resolve, reject) => {
        try {
            if (typeof window.showToast === 'function') {
                window.showToast("🔄 Eliminando todos los datos...", false);
            }
            
            const snapshot = await coleccionPagos.get();
            const batch = dbFirestore.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            
            await coleccionCorrelativo.set({ valor: 0 });
            
            localStorage.removeItem("pj_db_v8");
            localStorage.removeItem("pj_corr_v8");
            
            db = {};
            ultimoNum = 0;
            
            const añoActual = new Date().getFullYear();
            await asegurarDBCloud(añoActual);
            await saveDatabase();
            
            if (typeof window.showToast === 'function') {
                window.showToast("✓ Todos los datos han sido eliminados", false);
            }
            
            setTimeout(() => {
                location.reload();
            }, 1500);
            
            resolve(true);
        } catch (error) {
            console.error("Error al resetear:", error);
            if (typeof window.showToast === 'function') {
                window.showToast("❌ Error al resetear los datos", true);
            }
            reject(error);
        }
    });
}

// Fallback a localStorage
function loadDatabaseLocal() {
    const storedDb = localStorage.getItem("pj_db_v8");
    const storedCorr = localStorage.getItem("pj_corr_v8");
    
    if (storedDb) {
        db = JSON.parse(storedDb);
    } else {
        db = {};
    }
    
    if (storedCorr) {
        ultimoNum = parseInt(storedCorr);
    } else {
        ultimoNum = 0;
    }
}

function saveDatabaseLocal() {
    localStorage.setItem("pj_db_v8", JSON.stringify(db));
    localStorage.setItem("pj_corr_v8", ultimoNum.toString());
}

async function initDatabase() {
    const snapshot = await coleccionPagos.get();
    const batch = dbFirestore.batch();
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
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
            await coleccionPagos.doc(docId).set({
                anio: anio,
                grupo: grupo,
                mes: mesItem,
                estado: "pendiente"
            });
        }
        await saveDatabase();
        return true;
    }
    return false;
}