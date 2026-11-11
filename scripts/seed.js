// Carga datos ficticios en los emuladores locales (Auth + Firestore).
// Uso: con los emuladores corriendo (`npm run dev`), en otra terminal: `npm run seed`
//
// Todos los nombres, teléfonos y consultas son inventados.

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

initializeApp({ projectId: "demo-isosceles" });
const auth = getAuth();
const db = getFirestore();

const PASSWORD = "demo1234";

const usuarios = [
    { uid: "admin-demo", email: "admin@demo.com", nombre: "Laura Gómez (Admin)", rol: "admin", telefonos: ["+54 9 11 5555-0100"] },
    { uid: "asesor-demo", email: "asesor@demo.com", nombre: "Martín Ruiz", rol: "empleado", telefonos: ["+54 9 11 5555-0101", "+54 9 11 5555-0102"] },
    { uid: "asesor-2", email: "sofia@demo.com", nombre: "Sofía Pérez", rol: "empleado", telefonos: ["+54 9 11 5555-0103"] },
    { uid: "asesor-3", email: "diego@demo.com", nombre: "Diego Fernández", rol: "empleado", telefonos: ["+54 9 11 5555-0104"] },
];

const diasAtras = (d, h = 10) => {
    const f = new Date();
    f.setDate(f.getDate() - d);
    f.setHours(h, 0, 0, 0);
    return Timestamp.fromDate(f);
};

const emp = Object.fromEntries(usuarios.map(u => [u.uid, u]));

// [cliente, teléfono, descripción, asesorUid|null, díasDesdeCreación, cierre?: {dias, resultado, nota}, comentarios?]
const tickets = [
    ["Carolina Medina", "+54 9 11 4000-1001", "Consulta por depto. 2 ambientes en Palermo, alquiler. Tiene garantía propietaria.", "asesor-demo", 1],
    ["Javier Torres", "+54 9 11 4000-1002", "Quiere tasar su casa en Banfield para vender.", "asesor-demo", 3, null, ["Llamado, no atendió. Reintentar a la tarde."]],
    ["Lucía Benítez", "+54 9 11 4000-1003", "Busca local comercial en zona centro, hasta 80 m2.", "asesor-demo", 10, null, ["Se le enviaron 3 opciones por mail."]],
    ["Ramiro Castro", "+54 9 11 4000-1004", "Interesado en PH 3 ambientes con patio, compra con crédito hipotecario.", "asesor-2", 2],
    ["Valentina Ríos", "+54 9 11 4000-1005", "Consulta por renovación de contrato de alquiler.", "asesor-3", 9],
    ["Federico Luna", "+54 9 11 4000-1006", "Pregunta por expensas del edificio de Av. Rivadavia.", null, 4, { dias: 4, resultado: "NO_CERRADO", nota: "Consulta resuelta en el momento, no requería asesor." }],
    ["Agustina Morales", "+54 9 11 4000-1007", "Compra de monoambiente para inversión.", "asesor-demo", 20, { dias: 12, resultado: "CERRADO", nota: "Se firmó boleto de compraventa." }],
    ["Nicolás Herrera", "+54 9 11 4000-1008", "Alquiler temporario 3 meses.", "asesor-2", 25, { dias: 18, resultado: "NO_CERRADO", nota: "El cliente consiguió otra opción." }],
    ["Paula Domínguez", "+54 9 11 4000-1009", "Venta de lote en barrio cerrado.", "asesor-3", 40, { dias: 30, resultado: "CERRADO", nota: "Reserva concretada." }],
    ["Tomás Acosta", "+54 9 11 4000-1010", "Busca casa 4 ambientes con cochera.", "asesor-demo", 45, { dias: 35, resultado: "CERRADO", nota: "Alquiler firmado por 3 años." }],
    ["Florencia Sosa", "+54 9 11 4000-1011", "Consulta por tasación de departamento heredado.", "asesor-2", 50, { dias: 41, resultado: "NO_CERRADO", nota: "Decidieron no vender por ahora." }],
    ["Gonzalo Vega", "+54 9 11 4000-1012", "Alquiler de oficina pequeña en microcentro.", "asesor-3", 6, { dias: 2, resultado: "CERRADO", nota: "Contrato firmado." }],
];

async function crearUsuarios() {
    for (const u of usuarios) {
        try {
            await auth.createUser({ uid: u.uid, email: u.email, password: PASSWORD, displayName: u.nombre });
        } catch (e) {
            if (e.code !== "auth/uid-already-exists" && e.code !== "auth/email-already-exists") throw e;
        }
        await db.collection("empleados").doc(u.uid).set({
            uid: u.uid,
            nombre: u.nombre,
            email: u.email,
            telefonos: u.telefonos,
            // vistaEmpleado.html lee el campo `telefono` del admin para el botón "Consultar al Admin"
            ...(u.rol === "admin" ? { telefono: u.telefonos[0] } : {}),
            rol: u.rol,
            fechaAlta: diasAtras(60),
        });
    }
}

async function crearTickets() {
    const viejos = await db.collection("tickets").get();
    const batch = db.batch();
    viejos.forEach(d => batch.delete(d.ref));

    for (const [cliente, tel, desc, asesorUid, dias, cierre, comentarios] of tickets) {
        const asesor = asesorUid ? emp[asesorUid] : null;
        const creado = diasAtras(dias);
        batch.set(db.collection("tickets").doc(), {
            cliente_nombre: cliente,
            cliente_telefono: tel,
            descripcion: desc,
            fecha_creacion: creado,
            fecha: creado,
            estado: cierre ? "FINALIZADO" : "EN_PROCESO",
            fecha_cierre: cierre ? diasAtras(cierre.dias, 17) : null,
            resultado_cierre: cierre ? cierre.resultado : null,
            resolucion: cierre ? cierre.nota : null,
            empleado_id: asesor ? asesor.uid : null,
            empleado_nombre: asesor ? asesor.nombre : "Admin",
            empleado_telefono: asesor ? asesor.telefonos[0] : null,
            comentarios: (comentarios || []).map((texto, i) => ({ texto, fecha: diasAtras(Math.max(dias - 1 - i, 0), 15) })),
        });
    }
    await batch.commit();
}

// Con --wait espera a que los emuladores estén levantados (lo usa `npm run dev`).
async function esperarEmuladores(timeoutMs = 120000) {
    const urls = [`http://${process.env.FIRESTORE_EMULATOR_HOST}/`, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/`];
    const inicio = Date.now();
    while (Date.now() - inicio < timeoutMs) {
        const ok = await Promise.all(urls.map(u => fetch(u).then(() => true, () => false)));
        if (ok.every(Boolean)) return;
        await new Promise(r => setTimeout(r, 1500));
    }
    throw new Error("Los emuladores no respondieron a tiempo.");
}

(async () => {
    if (process.argv.includes("--wait")) {
        console.log("⏳ Esperando a los emuladores...");
        await esperarEmuladores();
    }
    await crearUsuarios();
    await crearTickets();
    console.log(`✅ Datos demo cargados: ${usuarios.length} usuarios y ${tickets.length} tickets.`);
    console.log(`   Admin:  admin@demo.com / ${PASSWORD}`);
    console.log(`   Asesor: asesor@demo.com / ${PASSWORD}`);
    console.log("👉 Abrí http://localhost:5000/login.html");
    process.exit(0);
})().catch(e => {
    console.error("❌ Error cargando datos demo. ¿Están corriendo los emuladores (npm run dev)?\n", e);
    process.exit(1);
});
