// Punto único de inicialización de Firebase. Todas las páginas importan app/auth/db desde acá.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig, USE_EMULATORS, EMULATOR_HOSTS } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (USE_EMULATORS) {
    connectAuthEmulator(auth, EMULATOR_HOSTS.auth, { disableWarnings: true });
    connectFirestoreEmulator(db, EMULATOR_HOSTS.firestoreHost, EMULATOR_HOSTS.firestorePort);
}

// Instancia de Auth secundaria: permite que el admin cree usuarios sin perder su propia sesión.
export function crearAuthSecundaria() {
    const secondaryApp = initializeApp(firebaseConfig, "Secondary");
    const secondaryAuth = getAuth(secondaryApp);
    if (USE_EMULATORS) {
        connectAuthEmulator(secondaryAuth, EMULATOR_HOSTS.auth, { disableWarnings: true });
    }
    return secondaryAuth;
}
