// Configuración de Firebase del proyecto.
//
// Por defecto usa un proyecto "demo-*": con ese prefijo, el Firebase Emulator Suite
// funciona 100% en local, sin cuenta de Google y sin tocar ninguna base de datos real.
//
// Si querés publicar una demo online, creá TU PROPIO proyecto en https://console.firebase.google.com
// y reemplazá estos valores por los de ese proyecto (nunca los de un cliente en producción).
export const firebaseConfig = {
    apiKey: "demo-api-key",
    authDomain: "demo-isosceles.firebaseapp.com",
    projectId: "demo-isosceles",
    storageBucket: "demo-isosceles.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:demo"
};

// Al abrir la app desde localhost se conecta automáticamente a los emuladores locales.
export const USE_EMULATORS = ["localhost", "127.0.0.1"].includes(location.hostname);

export const EMULATOR_HOSTS = {
    auth: "http://127.0.0.1:9099",
    firestoreHost: "127.0.0.1",
    firestorePort: 8080
};
