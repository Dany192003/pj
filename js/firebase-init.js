// js/firebase-init.js - Inicialización de Firebase

// Tu configuración de Firebase
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

// Referencia a la colección de pagos
const coleccionPagos = dbFirestore.collection("pagos");

// Referencia al correlativo (documento único)
const coleccionCorrelativo = dbFirestore.collection("config").doc("correlativo");