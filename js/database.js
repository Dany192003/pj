// js/database.js - Gestión de datos

// Constantes globales
const GRUPOS = ["Confirmación", "Jeshua", "Jufra", "Lectores", "Mujeres y Hombres Nuevos", "PCV", "Pentecostés", "Roca Fuerte", "San Pablo", "Senderos", "Shadai", "Ssael"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Estado global
let db = {};
let ultimoNum = 0;

// Inicializar base de datos
function initDatabase() {
    localStorage.removeItem("pj_db_v8");
    localStorage.removeItem("pj_corr_v8");
    db = {};
    ultimoNum = 0;
    localStorage.setItem("pj_corr_v8", "0");
    localStorage.setItem("pj_db_v8", JSON.stringify({}));
}

// Asegurar que existe la estructura para un año
function asegurarDB(anio) {
    if (!db[anio]) {
        db[anio] = [];
        GRUPOS.forEach(g => MESES.forEach(m => db[anio].push({ grupo: g, mes: m, estado: "pendiente" })));
        localStorage.setItem("pj_db_v8", JSON.stringify(db));
    }
}

// Cargar datos desde localStorage
function loadDatabase() {
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

// Guardar datos en localStorage
function saveDatabase() {
    localStorage.setItem("pj_db_v8", JSON.stringify(db));
    localStorage.setItem("pj_corr_v8", ultimoNum.toString());
}

// Actualizar estado de una cuota
function updatePaymentStatus(anio, grupo, mes, estado) {
    if (!db[anio]) asegurarDB(anio);
    const record = db[anio].find(p => p.grupo === grupo && p.mes === mes);
    if (record) {
        record.estado = estado;
        saveDatabase();
        return true;
    }
    return false;
}

// Obtener siguiente número de recibo
function getNextNumero() {
    ultimoNum++;
    saveDatabase();
    return String(ultimoNum).padStart(4, '0');
}

// Obtener número actual para mostrar
function getCurrentNumero() {
    return String(ultimoNum + 1).padStart(4, '0');
}

// Agregar grupo personalizado a la base de datos
function addCustomGroup(anio, grupo) {
    if (!db[anio]) asegurarDB(anio);
    
    const existeGrupo = db[anio].some(item => item.grupo === grupo);
    if (!existeGrupo) {
        MESES.forEach(mesItem => {
            db[anio].push({ grupo: grupo, mes: mesItem, estado: "pendiente" });
        });
        saveDatabase();
        return true;
    }
    return false;
}