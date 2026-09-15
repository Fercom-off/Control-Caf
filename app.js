// ============================================================
// CONTROL CAFETERÍA — app.js
// Toda la información se guarda en IndexedDB, dentro del navegador.
// No hay servidor: la app funciona sola, incluso sin internet.
// ============================================================

const VERSION_APP = "V1.0";

const PRODUCTOS_INICIALES = [
  { id: "bolon", nombre: "Bolón", emoji: "🟠", precioLocal: 2.50, precioLlevar: 2.75 },
  { id: "tigrillo", nombre: "Tigrillo", emoji: "🟡", precioLocal: 2.50, precioLlevar: 2.75 },
  { id: "mote", nombre: "Mote pillo", emoji: "🍳", precioLocal: 2.50, precioLlevar: 2.75 },
  { id: "emp_queso", nombre: "Empanada de queso", emoji: "🥟", precioLocal: 2.00, precioLlevar: 2.25 },
  { id: "emp_pollo", nombre: "Empanada de pollo", emoji: "🥟", precioLocal: 2.00, precioLlevar: 2.25 },
  { id: "cafe", nombre: "Café", emoji: "☕", precioLocal: 0.50, precioLlevar: null },
  { id: "horchata", nombre: "Horchata", emoji: "🥤", precioLocal: 0.50, precioLlevar: null }
];

// ---------------- INDEXEDDB ----------------
let db;

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("ControlCafeteriaDB", 1);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains("productos")) {
        d.createObjectStore("productos", { keyPath: "id" });
      }
      if (!d.objectStoreNames.contains("ventas")) {
        const s = d.createObjectStore("ventas", { keyPath: "id", autoIncrement: true });
        s.createIndex("timestamp", "timestamp");
      }
      if (!d.objectStoreNames.contains("cierres")) {
        const c = d.createObjectStore("cierres", { keyPath: "id", autoIncrement: true });
        c.createIndex("timestampCierre", "timestampCierre");
      }
      if (!d.objectStoreNames.contains("config")) {
        d.createObjectStore("config", { keyPath: "clave" });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function tx(nombreStore, modo) {
  return db.transaction(nombreStore, modo).objectStore(nombreStore);
}

function getAll(nombreStore) {
  return new Promise((resolve, reject) => {
    const req = tx(nombreStore, "readonly").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function put(nombreStore, valor) {
  return new Promise((resolve, reject) => {
    const req = tx(nombreStore, "readwrite").put(valor);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function add(nombreStore, valor) {
  return new Promise((resolve, reject) => {
    const req = tx(nombreStore, "readwrite").add(valor);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getUno(nombreStore, clave) {
  return new Promise((resolve, reject) => {
    const req = tx(nombreStore, "readonly").get(clave);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function limpiarStore(nombreStore) {
  return new Promise((resolve, reject) => {
    const req = tx(nombreStore, "readwrite").clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- ESTADO ----------------
let productos = [];
let carrito = []; // { productoId, nombre, precioUnitario, cantidad }
let tipoConsumo = "local";
let rangoHistorial = "hoy";
let tabHistorial = "ventas";
let metodoPagoSeleccionado = "Efectivo";
let configDesbloqueada = false;

// ---------------- UTILIDADES ----------------
const money = (n) => `$${n.toFixed(2)}`;

function fechaLocalStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function horaLocalStr(d = new Date()) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function inicioSemana(d = new Date()) {
  const dia = d.getDay(); // 0=domingo
  const diff = (dia === 0 ? -6 : 1) - dia; // lunes como inicio
  const lunes = new Date(d);
  lunes.setDate(d.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);
  return lunes.getTime();
}
function inicioMes(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime();
}
function inicioDia(d = new Date()) {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n.getTime();
}

function mostrarToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("oculto");
  clearTimeout(mostrarToast._h);
  mostrarToast._h = setTimeout(() => t.classList.add("oculto"), 2200);
}

function precioProducto(producto, tipo) {
  if (tipo === "llevar" && producto.precioLlevar != null) return producto.precioLlevar;
  return producto.precioLocal;
}

// ---------------- NAVEGACIÓN ----------------
function irAVista(nombre) {
  document.querySelectorAll(".vista").forEach((v) => v.classList.remove("vista-activa"));
  document.getElementById(`vista-${nombre}`).classList.add("vista-activa");
  document.querySelectorAll(".tab-item").forEach((b) => b.classList.toggle("tab-activa", b.dataset.vista === nombre));
  if (nombre === "inicio") renderInicio();
  if (nombre === "historial") renderHistorial();
  if (nombre === "cierre") renderCierre();
  if (nombre === "config") renderConfig();
}

document.querySelectorAll(".tab-item").forEach((btn) => {
  btn.addEventListener("click", () => irAVista(btn.dataset.vista));
});

// ---------------- RELOJ ----------------
function actualizarReloj() {
  const ahora = new Date();
  const dias = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  document.getElementById("reloj").textContent =
    `${dias[ahora.getDay()]} ${fechaLocalStr(ahora)} · ${horaLocalStr(ahora)}`;
}

// ---------------- VENTA: PRODUCTOS Y CARRITO ----------------
function renderGridProductos() {
  const grid = document.getElementById("grid-productos");
  grid.innerHTML = "";
  productos.forEach((p) => {
    const div = document.createElement("div");
    div.className = "tarjeta-producto";
    const precio = precioProducto(p, tipoConsumo);
    div.innerHTML = `
      <span class="producto-emoji">${p.emoji}</span>
      <span class="producto-nombre">${p.nombre}</span>
      <span class="producto-precio">${money(precio)}</span>
    `;
    div.addEventListener("click", () => agregarAlCarrito(p));
    grid.appendChild(div);
  });
}

function agregarAlCarrito(producto) {
  const precio = precioProducto(producto, tipoConsumo);
  const existente = carrito.find((i) => i.productoId === producto.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ productoId: producto.id, nombre: producto.nombre, precioUnitario: precio, cantidad: 1 });
  }
  renderCarrito();
  const cont = document.getElementById("carrito-contenido");
  if (!cont.classList.contains("abierto")) cont.classList.add("abierto");
}

function cambiarCantidad(productoId, delta) {
  const item = carrito.find((i) => i.productoId === productoId);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter((i) => i.productoId !== productoId);
  }
  renderCarrito();
}

function renderCarrito() {
  const lista = document.getElementById("lista-carrito");
  lista.innerHTML = "";
  if (carrito.length === 0) {
    lista.innerHTML = `<div class="carrito-vacio">Toca un producto para agregarlo a la venta.</div>`;
  }
  let total = 0;
  let cantidadTotal = 0;
  carrito.forEach((item) => {
    const subtotal = item.precioUnitario * item.cantidad;
    total += subtotal;
    cantidadTotal += item.cantidad;
    const fila = document.createElement("div");
    fila.className = "fila-carrito";
    fila.innerHTML = `
      <div class="fila-carrito-info">
        <div class="fila-carrito-nombre">${item.nombre}</div>
        <div class="fila-carrito-precio">${money(item.precioUnitario)} c/u</div>
      </div>
      <div class="fila-carrito-controles">
        <button class="btn-cantidad" data-accion="menos" data-id="${item.productoId}">−</button>
        <span>${item.cantidad}</span>
        <button class="btn-cantidad" data-accion="mas" data-id="${item.productoId}">+</button>
      </div>
      <div class="fila-carrito-subtotal">${money(subtotal)}</div>
    `;
    lista.appendChild(fila);
  });

  lista.querySelectorAll("[data-accion='mas']").forEach((b) =>
    b.addEventListener("click", () => cambiarCantidad(b.dataset.id, 1))
  );
  lista.querySelectorAll("[data-accion='menos']").forEach((b) =>
    b.addEventListener("click", () => cambiarCantidad(b.dataset.id, -1))
  );

  document.getElementById("carrito-total").textContent = money(total);
  document.getElementById("carrito-resumen-mini").textContent = `${cantidadTotal} items · ${money(total)}`;
}

document.getElementById("btn-toggle-carrito").addEventListener("click", () => {
  document.getElementById("carrito-contenido").classList.toggle("abierto");
});

document.getElementById("btn-vaciar-carrito").addEventListener("click", () => {
  if (carrito.length === 0) return;
  if (confirm("¿Vaciar el carrito de la venta actual?")) {
    carrito = [];
    renderCarrito();
  }
});

// Selector de tipo de consumo: recalcula precios de lo que ya está en el carrito
document.getElementById("btn-tipo-local").addEventListener("click", () => setTipoConsumo("local"));
document.getElementById("btn-tipo-llevar").addEventListener("click", () => setTipoConsumo("llevar"));

function setTipoConsumo(tipo) {
  tipoConsumo = tipo;
  document.getElementById("btn-tipo-local").classList.toggle("chip-activo", tipo === "local");
  document.getElementById("btn-tipo-llevar").classList.toggle("chip-activo", tipo === "llevar");
  carrito.forEach((item) => {
    const p = productos.find((pr) => pr.id === item.productoId);
    if (p) item.precioUnitario = precioProducto(p, tipoConsumo);
  });
  renderGridProductos();
  renderCarrito();
}

// ---------------- COBRO ----------------
document.getElementById("btn-cobrar").addEventListener("click", () => {
  if (carrito.length === 0) {
    mostrarToast("Agrega al menos un producto antes de cobrar.");
    return;
  }
  const total = carrito.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0);
  document.getElementById("modal-total-monto").textContent = money(total);
  document.getElementById("modal-tipo-consumo").textContent =
    tipoConsumo === "local" ? "🍽️ Consumo en el local" : "🥡 Para llevar";
  metodoPagoSeleccionado = "Efectivo";
  document.querySelectorAll("#modal-cobro [data-metodo]").forEach((b) =>
    b.classList.toggle("chip-activo", b.dataset.metodo === "Efectivo")
  );
  document.getElementById("modal-cobro").classList.remove("oculto");
});

document.querySelectorAll("#modal-cobro [data-metodo]").forEach((btn) => {
  btn.addEventListener("click", () => {
    metodoPagoSeleccionado = btn.dataset.metodo;
    document.querySelectorAll("#modal-cobro [data-metodo]").forEach((b) =>
      b.classList.toggle("chip-activo", b === btn)
    );
  });
});

document.getElementById("btn-cancelar-cobro").addEventListener("click", () => {
  document.getElementById("modal-cobro").classList.add("oculto");
});

document.getElementById("btn-confirmar-cobro").addEventListener("click", async () => {
  const ahora = new Date();
  const total = carrito.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0);
  const venta = {
    fecha: fechaLocalStr(ahora),
    hora: horaLocalStr(ahora),
    timestamp: ahora.getTime(),
    items: carrito.map((i) => ({
      productoId: i.productoId,
      nombre: i.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      subtotal: +(i.precioUnitario * i.cantidad).toFixed(2)
    })),
    total: +total.toFixed(2),
    tipoConsumo,
    metodoPago: metodoPagoSeleccionado
  };
  await add("ventas", venta);
  carrito = [];
  renderCarrito();
  document.getElementById("carrito-contenido").classList.remove("abierto");
  document.getElementById("modal-cobro").classList.add("oculto");
  mostrarToast(`Venta registrada: ${money(total)}`);
});

// ---------------- INICIO / DASHBOARD ----------------
async function renderInicio() {
  const ventas = await getAll("ventas");
  const hoy = fechaLocalStr();
  const tsSemana = inicioSemana();
  const tsMes = inicioMes();

  const ventasHoy = ventas.filter((v) => v.fecha === hoy);
  const ventasSemana = ventas.filter((v) => v.timestamp >= tsSemana);
  const ventasMes = ventas.filter((v) => v.timestamp >= tsMes);

  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0);
  const productosHoy = ventasHoy.reduce((s, v) => s + v.items.reduce((a, i) => a + i.cantidad, 0), 0);
  const totalSemana = ventasSemana.reduce((s, v) => s + v.total, 0);
  const totalMes = ventasMes.reduce((s, v) => s + v.total, 0);

  document.getElementById("dash-ventas-hoy").textContent = money(totalHoy);
  document.getElementById("dash-productos-hoy").textContent = productosHoy;
  document.getElementById("dash-ventas-semana").textContent = money(totalSemana);
  document.getElementById("dash-ventas-mes").textContent = money(totalMes);

  const conteo = {};
  ventasMes.forEach((v) => v.items.forEach((i) => {
    conteo[i.nombre] = (conteo[i.nombre] || 0) + i.cantidad;
  }));
  const entradas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  document.getElementById("dash-mas-vendido").textContent = entradas.length ? entradas[0][0] : "—";

  const listaDiv = document.getElementById("dash-lista-productos");
  listaDiv.innerHTML = entradas.length
    ? entradas.map(([nombre, cant]) =>
        `<div class="fila-reporte"><span class="fila-reporte-nombre">${nombre}</span><span class="fila-reporte-valor">${cant} unid.</span></div>`
      ).join("")
    : `<div class="lista-vacia">Todavía no hay ventas este mes.</div>`;

  const cierres = await getAll("cierres");
  const ultimoCierre = cierres.sort((a, b) => b.timestampCierre - a.timestampCierre)[0];
  const estadoDiv = document.getElementById("caja-estado-inicio");
  estadoDiv.textContent = ultimoCierre
    ? `Último cierre de caja: ${ultimoCierre.fecha} — ${money(ultimoCierre.totalVentas)}`
    : "Todavía no se ha hecho ningún cierre de caja.";
}

// ---------------- HISTORIAL ----------------
document.querySelectorAll("#filtros-historial .chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    rangoHistorial = btn.dataset.rango;
    document.querySelectorAll("#filtros-historial .chip").forEach((b) => b.classList.toggle("chip-activo", b === btn));
    document.getElementById("rango-personalizado").classList.toggle("oculto", rangoHistorial !== "personalizado");
    if (rangoHistorial !== "personalizado") renderHistorial();
  });
});
document.getElementById("btn-aplicar-rango").addEventListener("click", renderHistorial);

document.querySelectorAll(".tab-sec").forEach((btn) => {
  btn.addEventListener("click", () => {
    tabHistorial = btn.dataset.tab;
    document.querySelectorAll(".tab-sec").forEach((b) => b.classList.toggle("tab-sec-activa", b === btn));
    document.getElementById("lista-ventas-historial").classList.toggle("oculto", tabHistorial !== "ventas");
    document.getElementById("lista-cierres-historial").classList.toggle("oculto", tabHistorial !== "cierres");
  });
});

function filtrarVentasPorRango(ventas) {
  const hoy = fechaLocalStr();
  const ayer = fechaLocalStr(new Date(Date.now() - 86400000));
  if (rangoHistorial === "hoy") return ventas.filter((v) => v.fecha === hoy);
  if (rangoHistorial === "ayer") return ventas.filter((v) => v.fecha === ayer);
  if (rangoHistorial === "semana") return ventas.filter((v) => v.timestamp >= inicioSemana());
  if (rangoHistorial === "mes") return ventas.filter((v) => v.timestamp >= inicioMes());
  if (rangoHistorial === "personalizado") {
    const desde = document.getElementById("fecha-desde").value;
    const hasta = document.getElementById("fecha-hasta").value;
    if (!desde || !hasta) return [];
    return ventas.filter((v) => v.fecha >= desde && v.fecha <= hasta);
  }
  return ventas;
}

async function renderHistorial() {
  const todas = await getAll("ventas");
  const filtradas = filtrarVentasPorRango(todas).sort((a, b) => b.timestamp - a.timestamp);

  const total = filtradas.reduce((s, v) => s + v.total, 0);
  document.getElementById("resumen-historial").innerHTML =
    `<span>${filtradas.length} venta(s)</span><span>${money(total)}</span>`;

  const lista = document.getElementById("lista-ventas-historial");
  lista.innerHTML = filtradas.length
    ? filtradas.map((v) => `
        <div class="tarjeta-venta">
          <div class="tarjeta-venta-cab">
            <span>${v.fecha} · ${v.hora}</span>
            <span>${v.tipoConsumo === "local" ? "🍽️ Local" : "🥡 Para llevar"}</span>
          </div>
          <div class="tarjeta-venta-items">${v.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")}</div>
          <div class="tarjeta-venta-pie">
            <span class="etiqueta-pago">${v.metodoPago}</span>
            <span>${money(v.total)}</span>
          </div>
        </div>
      `).join("")
    : `<div class="lista-vacia">No hay ventas en este periodo.</div>`;

  const cierres = (await getAll("cierres")).sort((a, b) => b.timestampCierre - a.timestampCierre);
  const listaCierres = document.getElementById("lista-cierres-historial");
  listaCierres.innerHTML = cierres.length
    ? cierres.map((c) => `
        <div class="tarjeta-venta">
          <div class="tarjeta-venta-cab"><span>${c.fecha}</span><span>${c.horaCierre || ""}</span></div>
          <div class="tarjeta-venta-items">Efectivo ${money(c.efectivo)} · Transferencia ${money(c.transferencia)} · Otro ${money(c.otro)}</div>
          <div class="tarjeta-venta-pie"><span>${c.totalProductos} productos</span><span>${money(c.totalVentas)}</span></div>
        </div>
      `).join("")
    : `<div class="lista-vacia">Todavía no hay cierres de caja.</div>`;
}

// ---------------- CIERRE DE CAJA ----------------
async function ventasDesdeUltimoCierre() {
  const cierres = await getAll("cierres");
  const ultimo = cierres.sort((a, b) => b.timestampCierre - a.timestampCierre)[0];
  const cutoff = ultimo ? ultimo.timestampCierre : 0;
  const todas = await getAll("ventas");
  return { ventas: todas.filter((v) => v.timestamp > cutoff), ultimo };
}

async function renderCierre() {
  const { ventas, ultimo } = await ventasDesdeUltimoCierre();
  document.getElementById("cierre-periodo-texto").textContent = ultimo
    ? `Ventas desde el último cierre (${ultimo.fecha} ${ultimo.horaCierre || ""}).`
    : "Ventas desde que se empezó a usar la aplicación (todavía no hay cierres).";

  const total = ventas.reduce((s, v) => s + v.total, 0);
  const cantidadProductos = ventas.reduce((s, v) => s + v.items.reduce((a, i) => a + i.cantidad, 0), 0);
  const efectivo = ventas.filter((v) => v.metodoPago === "Efectivo").reduce((s, v) => s + v.total, 0);
  const transferencia = ventas.filter((v) => v.metodoPago === "Transferencia").reduce((s, v) => s + v.total, 0);
  const otro = ventas.filter((v) => v.metodoPago === "Otro").reduce((s, v) => s + v.total, 0);

  document.getElementById("cierre-total").textContent = money(total);
  document.getElementById("cierre-cant-productos").textContent = cantidadProductos;
  document.getElementById("cierre-efectivo").textContent = money(efectivo);
  document.getElementById("cierre-transferencia").textContent = money(transferencia);
  document.getElementById("cierre-otro").textContent = money(otro);

  const conteo = {};
  ventas.forEach((v) => v.items.forEach((i) => { conteo[i.nombre] = (conteo[i.nombre] || 0) + i.cantidad; }));
  const entradas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  document.getElementById("cierre-lista-productos").innerHTML = entradas.length
    ? entradas.map(([nombre, cant]) =>
        `<div class="fila-reporte"><span class="fila-reporte-nombre">${nombre}</span><span class="fila-reporte-valor">${cant} unid.</span></div>`
      ).join("")
    : `<div class="lista-vacia">No hay ventas pendientes de cierre.</div>`;
}

document.getElementById("btn-cerrar-caja").addEventListener("click", async () => {
  const { ventas } = await ventasDesdeUltimoCierre();
  if (ventas.length === 0) {
    mostrarToast("No hay ventas nuevas para cerrar.");
    return;
  }
  const total = ventas.reduce((s, v) => s + v.total, 0);
  if (!confirm(`¿Confirmas cerrar la caja?\n\nTotal: ${money(total)}\nVentas: ${ventas.length}`)) return;

  const conteo = {};
  ventas.forEach((v) => v.items.forEach((i) => { conteo[i.nombre] = (conteo[i.nombre] || 0) + i.cantidad; }));
  const ahora = new Date();
  const cierre = {
    fecha: fechaLocalStr(ahora),
    horaCierre: horaLocalStr(ahora),
    timestampCierre: ahora.getTime(),
    totalVentas: +total.toFixed(2),
    totalProductos: ventas.reduce((s, v) => s + v.items.reduce((a, i) => a + i.cantidad, 0), 0),
    efectivo: +ventas.filter((v) => v.metodoPago === "Efectivo").reduce((s, v) => s + v.total, 0).toFixed(2),
    transferencia: +ventas.filter((v) => v.metodoPago === "Transferencia").reduce((s, v) => s + v.total, 0).toFixed(2),
    otro: +ventas.filter((v) => v.metodoPago === "Otro").reduce((s, v) => s + v.total, 0).toFixed(2),
    resumenProductos: conteo
  };
  await add("cierres", cierre);
  mostrarToast("Caja cerrada correctamente.");
  renderCierre();
  renderInicio();
});

// ---------------- CONFIGURACIÓN ----------------
document.getElementById("btn-desbloquear").addEventListener("click", async () => {
  const pinIngresado = document.getElementById("pin-config").value;
  const guardado = await getUno("config", "pin");
  const pinReal = guardado ? guardado.valor : "1234";
  if (pinIngresado === pinReal) {
    configDesbloqueada = true;
    document.getElementById("bloqueo-config").classList.add("oculto");
    document.getElementById("contenido-config").classList.remove("oculto");
    renderListaPrecios();
  } else {
    mostrarToast("PIN incorrecto.");
  }
  document.getElementById("pin-config").value = "";
});

function renderConfig() {
  document.getElementById("version-app").textContent = `Versión de la app: ${VERSION_APP}`;
  if (configDesbloqueada) {
    document.getElementById("bloqueo-config").classList.add("oculto");
    document.getElementById("contenido-config").classList.remove("oculto");
    renderListaPrecios();
  }
}

function renderListaPrecios() {
  const cont = document.getElementById("lista-precios");
  cont.innerHTML = "";
  productos.forEach((p) => {
    const div = document.createElement("div");
    div.className = "fila-precio";
    div.innerHTML = `
      <div class="fila-precio-nombre">${p.emoji} ${p.nombre}</div>
      <div class="fila-precio-inputs">
        <label class="campo-precio">En el local
          <input type="number" step="0.01" min="0" value="${p.precioLocal.toFixed(2)}" data-id="${p.id}" data-campo="precioLocal" />
        </label>
        <label class="campo-precio">Para llevar
          <input type="number" step="0.01" min="0" value="${p.precioLlevar != null ? p.precioLlevar.toFixed(2) : ""}" placeholder="igual" data-id="${p.id}" data-campo="precioLlevar" />
        </label>
      </div>
    `;
    cont.appendChild(div);
  });

  cont.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", async () => {
      const producto = productos.find((p) => p.id === input.dataset.id);
      if (!producto) return;
      const valor = input.value.trim();
      if (input.dataset.campo === "precioLocal") {
        producto.precioLocal = valor === "" ? 0 : parseFloat(valor);
      } else {
        producto.precioLlevar = valor === "" ? null : parseFloat(valor);
      }
      await put("productos", producto);
      renderGridProductos();
      mostrarToast(`${producto.nombre} actualizado.`);
    });
  });
}

document.getElementById("btn-guardar-pin").addEventListener("click", async () => {
  const nuevo = document.getElementById("nuevo-pin").value.trim();
  if (!/^\d{4}$/.test(nuevo)) {
    mostrarToast("El PIN debe tener 4 dígitos.");
    return;
  }
  await put("config", { clave: "pin", valor: nuevo });
  document.getElementById("nuevo-pin").value = "";
  mostrarToast("PIN actualizado.");
});

// ---- Exportar / Importar ----
document.getElementById("btn-exportar-json").addEventListener("click", async () => {
  const data = {
    productos: await getAll("productos"),
    ventas: await getAll("ventas"),
    cierres: await getAll("cierres"),
    config: await getAll("config"),
    exportadoEl: new Date().toISOString()
  };
  descargarArchivo(
    `control-cafeteria-backup-${fechaLocalStr()}.json`,
    JSON.stringify(data, null, 2),
    "application/json"
  );
});

document.getElementById("btn-exportar-csv").addEventListener("click", async () => {
  const ventas = await getAll("ventas");
  const filas = [["id_venta", "fecha", "hora", "producto", "cantidad", "precio_unitario", "subtotal", "total_venta", "tipo_consumo", "metodo_pago"]];
  ventas.forEach((v) => {
    v.items.forEach((i) => {
      filas.push([v.id, v.fecha, v.hora, i.nombre, i.cantidad, i.precioUnitario.toFixed(2), i.subtotal.toFixed(2), v.total.toFixed(2), v.tipoConsumo, v.metodoPago]);
    });
  });
  const csv = filas.map((f) => f.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(",")).join("\n");
  descargarArchivo(`control-cafeteria-ventas-${fechaLocalStr()}.csv`, csv, "text/csv");
});

function descargarArchivo(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document.getElementById("input-importar").addEventListener("change", async (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  if (!confirm("Importar reemplazará TODA la información actual (productos, ventas y cierres). ¿Continuar?")) {
    e.target.value = "";
    return;
  }
  try {
    const texto = await archivo.text();
    const data = JSON.parse(texto);
    await limpiarStore("productos");
    await limpiarStore("ventas");
    await limpiarStore("cierres");
    await limpiarStore("config");
    for (const p of data.productos || []) await put("productos", p);
    for (const v of data.ventas || []) await put("ventas", v);
    for (const c of data.cierres || []) await put("cierres", c);
    for (const cfg of data.config || []) await put("config", cfg);
    await cargarProductos();
    mostrarToast("Respaldo importado correctamente.");
    irAVista("inicio");
  } catch (err) {
    mostrarToast("El archivo no es un respaldo válido.");
  }
  e.target.value = "";
});

// ---------------- CARGA INICIAL ----------------
async function cargarProductos() {
  productos = await getAll("productos");
  if (productos.length === 0) {
    for (const p of PRODUCTOS_INICIALES) await put("productos", p);
    productos = await getAll("productos");
  }
  productos.sort((a, b) =>
    PRODUCTOS_INICIALES.findIndex((x) => x.id === a.id) - PRODUCTOS_INICIALES.findIndex((x) => x.id === b.id)
  );
  renderGridProductos();
}

async function iniciar() {
  db = await abrirDB();
  await cargarProductos();
  renderCarrito();
  actualizarReloj();
  setInterval(actualizarReloj, 15000);
  renderInicio();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

iniciar();
