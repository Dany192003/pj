// js/inicio-firebase.js - Inicialización de Firebase

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAcNCw3O4HsffvFBC7cD7o9xx6yBkN5flI",
    authDomain: "pastoral-juvenil-b98be.firebaseapp.com",
    projectId: "pastoral-juvenil-b98be",
    storageBucket: "pastoral-juvenil-b98be.firebasestorage.app",
    messagingSenderId: "216902261665",
    appId: "1:216902261665:web:e592f4a0e7f78fcb1789e0"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firestore
const dbFirestore = firebase.firestore();

// Colecciones
const coleccionPagos = dbFirestore.collection("pagos");
const coleccionCorrelativo = dbFirestore.collection("config").doc("correlativo");
const coleccionEventos = dbFirestore.collection("eventos");
const coleccionPasswords = dbFirestore.collection("passwords");
const coleccionRecursos = dbFirestore.collection("recursos");
const coleccionCategorias = dbFirestore.collection("categorias");

// Nota: Storage no se usa en esta versión (usamos Cloudinary)
console.log("✅ Firebase inicializado correctamente");