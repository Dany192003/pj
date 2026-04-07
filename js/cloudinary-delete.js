// js/cloudinary-delete.js - Eliminación de archivos en Cloudinary con firma autenticada

const CLOUDINARY_CLOUD_NAME = 'dyzpdl9tg';
const CLOUDINARY_API_KEY    = '188385225181351';
const CLOUDINARY_API_SECRET = 'V6OIViruOnuVlKI9a5j601cRyEo';

/**
 * Genera una firma SHA-1 para la API de Cloudinary usando Web Crypto API.
 * @param {Object} params - Parámetros a firmar (se ordenan y concatenan)
 * @returns {Promise<string>} - Firma en hexadecimal
 */
async function generarFirmaCloudinary(params) {
    // Ordenar parámetros alfabéticamente y construir string a firmar
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
        .map(k => `${k}=${params[k]}`)
        .join('&');
    
    const stringAFirmar = paramString + CLOUDINARY_API_SECRET;
    
    // SHA-1 con Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(stringAFirmar);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Elimina un archivo de Cloudinary por su public_id.
 * @param {string} publicId    - El public_id del recurso en Cloudinary
 * @param {string} resourceType - 'image' | 'raw' | 'video' (default: 'image')
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function eliminarDeCloudinary(publicId, resourceType = 'image') {
    if (!publicId) {
        console.warn('⚠️ eliminarDeCloudinary: public_id vacío, se omite eliminación en Cloudinary.');
        return false;
    }

    try {
        const timestamp = Math.round(Date.now() / 1000);

        const params = {
            public_id: publicId,
            timestamp:  timestamp
        };

        const signature = await generarFirmaCloudinary(params);

        const formData = new FormData();
        formData.append('public_id',    publicId);
        formData.append('timestamp',    timestamp);
        formData.append('api_key',      CLOUDINARY_API_KEY);
        formData.append('signature',    signature);

        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`;

        const res = await fetch(url, {
            method: 'POST',
            body:   formData
        });

        const data = await res.json();

        if (data.result === 'ok' || data.result === 'not found') {
            console.log(`✅ Cloudinary: "${publicId}" eliminado (${data.result})`);
            return true;
        } else {
            console.error('❌ Cloudinary no eliminó el recurso:', data);
            return false;
        }
    } catch (err) {
        console.error('❌ Error al eliminar de Cloudinary:', err);
        return false;
    }
}

// Exportar al scope global
window.eliminarDeCloudinary = eliminarDeCloudinary;
