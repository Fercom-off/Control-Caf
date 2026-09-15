// ============================================================
// CONTROL CAFETERÍA — app.js (v1.3)
// Toda la información se guarda en IndexedDB, dentro del navegador.
// Cuenta con sincronización automática opcional a GitHub.
// ============================================================

const VERSION_APP = "V1.3";

const ICONOS = {
  bolon: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="35" rx="20" ry="18" fill="#B5732B"/>
      <ellipse cx="25" cy="27" rx="7" ry="5" fill="#D7A15C" opacity="0.6"/>
      <path d="M18 43 Q32 55 46 43 Q38 51 32 51 Q26 51 18 43 Z" fill="#FFF6E5"/>
    </svg>`,
  tigrillo: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 32 Q10 50 32 50 Q54 50 54 32 L54 28 L10 28 Z" fill="#C8933F"/>
      <ellipse cx="32" cy="28" rx="22" ry="7" fill="#E7AF5C"/>
      <ellipse cx="32" cy="24" rx="8" ry="6" fill="#FFFFFF"/>
      <circle cx="32" cy="25" r="3.4" fill="#F2C14E"/>
    </svg>`,
  mote: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 32 Q10 50 32 50 Q54 50 54 32 L54 28 L10 28 Z" fill="#F4E7D3"/>
      <ellipse cx="32" cy="28" rx="22" ry="7" fill="#FBF1DF"/>
      <g fill="#D8C39C">
        <ellipse cx="21" cy="37" rx="3" ry="2.2"/>
        <ellipse cx="29" cy="42" rx="3" ry="2.2"/>
        <ellipse cx="41" cy="38" rx="3" ry="2.2"/>
        <ellipse cx="36" cy="33" rx="3" ry="2.2"/>
      </g>
      <ellipse cx="32" cy="24" rx="8" ry="6" fill="#FFFFFF"/>
      <circle cx="32" cy="25" r="3.4" fill="#F2C14E"/>
    </svg>`,
  emp_queso: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 40 Q32 14 56 40 Q32 54 8 40 Z" fill="#D9A257"/>
      <path d="M8 40 Q32 54 56 40" fill="none" stroke="#B5732B" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 6"/>
      <circle cx="32" cy="36" r="5" fill="#FFF6E0"/>
    </svg>`,
  emp_pollo: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 40 Q32 14 56 40 Q32 54 8 40 Z" fill="#D9A257"/>
      <path d="M8 40 Q32 54 56 40" fill="none" stroke="#B5732B" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 6"/>
      <circle cx="32" cy="36" r="5" fill="#C97A3B"/>
    </svg>`,
  cafe: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="26" width="26" height="20" rx="4" fill="#F4E7D3"/>
      <rect x="18" y="28" width="22" height="6" rx="2.5" fill="#5C3A22"/>
      <path d="M42 30 q8 0 8 8 q0 8 -8 8" fill="none" stroke="#F4E7D3" stroke-width="3.4"/>
      <ellipse cx="29" cy="48" rx="15" ry="3" fill="#C8933F"/>
      <path d="M23 20 q3 -4 0 -8" fill="none" stroke="#D9C6A5" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M33 20 q3 -4 0 -8" fill="none" stroke="#D9C6A5" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`,
  horchata: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 20 L44 20 L40 50 Q32 54 24 50 Z" fill="#F4E7D3" stroke="#D8C39C" stroke-width="1.5"/>
      <path d="M22.5 26 L41.5 26 L38.5 48 Q32 51.5 25.5 48 Z" fill="#C1447A"/>
      <rect x="30" y="8" width="4" height="20" rx="2" fill="#E7AF5C" transform="rotate(10 32 18)"/>
    </svg>`
};

const PRODUCTOS_INICIALES = [
  { id: "bolon", nombre: "Bolón", icono: ICONOS.bolon, precioLocal: 2.50, precioLlevar: 2.75 },
  { id: "tigrillo", nombre: "Tigrillo", icono: ICONOS.tigrillo, precioLocal: 2.50, precioLlevar: 2.75 },
  { id: "mote", nombre: "Mote pillo", icono: ICONOS.mote, precioLocal: 2.50, precioLlevar: 2.75 },
  { id: "emp_queso", nombre: "Empanada de queso", icono: ICONOS.emp_queso, precioLocal: 2.00, precioLlevar: 2.25 },
  { id: "emp_pollo", nombre: "Empanada de pollo", icono: ICONOS.emp_pollo, precioLocal: 2.00, precioLlevar: 2.25 },
  { id: "cafe", nombre: "Café", icono: ICONOS.cafe, precioLocal: 0.50, precioLlevar: null },
  { id: "horchata", nombre: "Horchata", icono: ICONOS.horchata, precioLocal: 0.50, precioLlevar: null }
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
// Carrito ahora almacena { itemId, productoId, nombre, tipoConsumo, precioUnitario, cantidad }
let carrito = [];
let tipoConsumo = "local";
let rangoHistorial = "hoy";
let tabHistorial = "ventas";
let metodoPagoSeleccionado = "Efectivo";
let configDesbloqueada = false;

// ---------------- UTILIDADES ----------------
const money = (n) => `$${Number(n || 0).toFixed(2)}`;

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
  const diff = (dia === 0 ? -6 : 1) - dia;
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
  mostrarToast._h = setTimeout(() => t.classList.add("oculto"), 2600);
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

// ---------------- VENTA: SELECTOR LOCAL / LLEVAR ----------------
document.querySelectorAll(".selector-consumo [data-tipo]").forEach((btn) => {
  btn.addEventListener("click", () => {
    tipoConsumo = btn.dataset.tipo;
    document.querySelectorAll(".selector-consumo [data-tipo]").forEach((b) =>
      b.classList.toggle("chip-activo", b === btn)
    );
    renderGridProductos();
  });
});

// ---------------- VENTA: PRODUCTOS Y CARRITO ----------------
function renderGridProductos() {
  const grid = document.getElementById("grid-productos");
  grid.innerHTML = "";
  productos.forEach((p) => {
    const div = document.createElement("div");
    div.className = "tarjeta-producto";
    const precio = precioProducto(p, tipoConsumo);
    div.innerHTML = `
      <span class="producto-icono">${p.icono}</span>
      <span class="producto-nombre">${p.nombre}</span>
      <span class="producto-precio">${money(precio)}</span>
    `;
    div.addEventListener("click", () => agregarAlCarrito(p));
    grid.appendChild(div);
  });
}

function agregarAlCarrito(producto) {
  const precio = precioProducto(producto, tipoConsumo);
  const itemKey = `${producto.id}_${tipoConsumo}`;
  const existente = carrito.find((i) => i.itemId === itemKey);

  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      itemId: itemKey,
      productoId: producto.id,
      nombre: producto.nombre,
      tipoConsumo: tipoConsumo, // 'local' o 'llevar'
      precioUnitario: precio,
      cantidad: 1
    });
  }
  renderCarrito();

  // Feedback visual sin tapar la pantalla
  const mini = document.getElementById("carrito-resumen-mini");
  if (mini) {
    mini.style.transform = "scale(1.15)";
    setTimeout(() => { mini.style.transform = "scale(1)"; }, 180);
  }
}

function cambiarCantidad(itemId, delta) {
  const item = carrito.find((i) => i.itemId === itemId);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter((i) => i.itemId !== itemId);
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
    const etiquetaTipo = item.tipoConsumo === "llevar" ? "🥡 Llevar" : "🍽️ Local";
    const fila = document.createElement("div");
    fila.className = "fila-carrito";
    fila.innerHTML = `
      <div class="fila-carrito-info">
        <div class="fila-carrito-nombre">
          ${item.nombre}
          <span class="badge-consumo badge-${item.tipoConsumo}">${etiquetaTipo}</span>
        </div>
        <div class="fila-carrito-precio">${money(item.precioUnitario)} c/u</div>
      </div>
      <div class="fila-carrito-controles">
        <button class="btn-cantidad" data-accion="menos" data-id="${item.itemId}">−</button>
        <span>${item.cantidad}</span>
        <button class="btn-cantidad" data-accion="mas" data-id="${item.itemId}">+</button>
      </div>
      <div class="fila-carrito-subtotal">${money(subtotal)}</div>
    `;
    lista.appendChild(fila);
  });

  document.getElementById("carrito-total").textContent = money(total);
  document.getElementById("carrito-resumen-mini").textContent =
    `${cantidadTotal} item${cantidadTotal === 1 ? "" : "s"} · ${money(total)}`;

  lista.querySelectorAll(".btn-cantidad").forEach((b) => {
    b.addEventListener("click", () => {
      const delta = b.dataset.accion === "mas" ? 1 : -1;
      cambiarCantidad(b.dataset.id, delta);
    });
  });
}

document.getElementById("btn-toggle-carrito").addEventListener("click", () => {
  document.getElementById("carrito-contenido").classList.toggle("abierto");
});

document.getElementById("btn-vaciar-carrito").addEventListener("click", () => {
  if (carrito.length === 0) return;
  carrito = [];
  renderCarrito();
});

// ---------------- VENTA: COBRO ----------------
document.getElementById("btn-cobrar").addEventListener("click", () => {
  if (carrito.length === 0) {
    mostrarToast("El carrito está vacío.");
    return;
  }
  const total = carrito.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0);
  document.getElementById("modal-total-monto").textContent = money(total);

  // Resumen de tipos de consumo presentes en la venta
  const tieneLocal = carrito.some(i => i.tipoConsumo === "local");
  const tieneLlevar = carrito.some(i => i.tipoConsumo === "llevar");
  let tipoTexto = "🍽️ En el local";
  if (tieneLocal && tieneLlevar) tipoTexto = "🍽️ Local + 🥡 Llevar mixto";
  else if (tieneLlevar) tipoTexto = "🥡 Para llevar";

  document.getElementById("modal-tipo-consumo").textContent = tipoTexto;
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
      tipoConsumo: i.tipoConsumo,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      subtotal: +(i.precioUnitario * i.cantidad).toFixed(2)
    })),
    total: +total.toFixed(2),
    metodoPago: metodoPagoSeleccionado
  };
  await add("ventas", venta);
  carrito = [];
  renderCarrito();
  document.getElementById("carrito-contenido").classList.remove("abierto");
  document.getElementById("modal-cobro").classList.add("oculto");
  mostrarToast(`Venta registrada: ${money(total)}`);

  // Sincronización automática con GitHub en segundo plano
  sincronizarConGitHubSilencioso();
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
  const totalSemana = ventasSemana.reduce((s, v) => s + v.total, 0);
  const totalMes = ventasMes.reduce((s, v) => s + v.total, 0);

  const productosHoy = ventasHoy.reduce((s, v) => s + v.items.reduce((si, it) => si + it.cantidad, 0), 0);

  document.getElementById("dash-ventas-hoy").textContent = money(totalHoy);
  document.getElementById("dash-productos-hoy").textContent = productosHoy;
  document.getElementById("dash-ventas-semana").textContent = money(totalSemana);
  document.getElementById("dash-ventas-mes").textContent = money(totalMes);

  // Conteo por producto este mes
  const conteoMes = {};
  ventasMes.forEach((v) => {
    v.items.forEach((it) => {
      conteoMes[it.nombre] = (conteoMes[it.nombre] || 0) + it.cantidad;
    });
  });

  let maxNombre = "—";
  let maxCant = 0;
  Object.entries(conteoMes).forEach(([nombre, cant]) => {
    if (cant > maxCant) {
      maxCant = cant;
      maxNombre = `${nombre} (${cant})`;
    }
  });
  document.getElementById("dash-mas-vendido").textContent = maxNombre;

  // Lista detallada mes
  const lista = document.getElementById("dash-lista-productos");
  lista.innerHTML = "";
  const ordenados = Object.entries(conteoMes).sort((a, b) => b[1] - a[1]);
  if (ordenados.length === 0) {
    lista.innerHTML = `<div class="texto-ayuda">Sin ventas este mes.</div>`;
  } else {
    ordenados.forEach(([nom, cant]) => {
      const row = document.createElement("div");
      row.className = "fila-reporte";
      row.innerHTML = `<span class="fila-reporte-nombre">${nom}</span><span class="fila-reporte-valor">${cant} unid.</span>`;
      lista.appendChild(row);
    });
  }

  // Estado del último cierre
  const cierres = await getAll("cierres");
  const cajaEstado = document.getElementById("caja-estado-inicio");
  if (cierres.length === 0) {
    cajaEstado.textContent = "Aún no se ha realizado ningún cierre de caja.";
  } else {
    const ultimo = cierres[cierres.length - 1];
    cajaEstado.textContent = `Último cierre: ${ultimo.fecha} ${ultimo.hora} · Total cerrado: ${money(ultimo.total)}`;
  }
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
  const todasVentas = await getAll("ventas");
  const ventas = filtrarVentasPorRango(todasVentas).sort((a, b) => b.timestamp - a.timestamp);

  const total = ventas.reduce((s, v) => s + v.total, 0);
  const cantVentas = ventas.length;
  document.getElementById("resumen-historial").innerHTML = `
    <span>${cantVentas} venta${cantVentas === 1 ? "" : "s"}</span>
    <span>Total: ${money(total)}</span>
  `;

  const listaVentas = document.getElementById("lista-ventas-historial");
  listaVentas.innerHTML = "";
  if (ventas.length === 0) {
    listaVentas.innerHTML = `<div class="lista-vacia">No hay ventas en este período.</div>`;
  } else {
    ventas.forEach((v) => {
      const card = document.createElement("div");
      card.className = "tarjeta-venta";
      const itemsStr = v.items
        .map((i) => `${i.cantidad}x ${i.nombre}${i.tipoConsumo === "llevar" ? " (llevar)" : ""}`)
        .join(", ");
      card.innerHTML = `
        <div class="tarjeta-venta-cab">
          <span>${v.fecha} · ${v.hora}</span>
          <span class="etiqueta-pago">${v.metodoPago || "Efectivo"}</span>
        </div>
        <div class="tarjeta-venta-items">${itemsStr}</div>
        <div class="tarjeta-venta-pie">
          <span>Total</span>
          <span>${money(v.total)}</span>
        </div>
      `;
      listaVentas.appendChild(card);
    });
  }

  // Cierres de caja
  const cierres = (await getAll("cierres")).sort((a, b) => b.timestampCierre - a.timestampCierre);
  const listaCierres = document.getElementById("lista-cierres-historial");
  listaCierres.innerHTML = "";
  if (cierres.length === 0) {
    listaCierres.innerHTML = `<div class="lista-vacia">No hay cierres registrados.</div>`;
  } else {
    cierres.forEach((c) => {
      const card = document.createElement("div");
      card.className = "tarjeta-venta";
      card.innerHTML = `
        <div class="tarjeta-venta-cab">
          <span>Cierre: ${c.fecha} · ${c.hora}</span>
          <span>${c.cantidadVentas} ventas</span>
        </div>
        <div class="tarjeta-venta-items">
          Efectivo: ${money(c.efectivo)} · Transf: ${money(c.transferencia)} · Otros: ${money(c.otro)}
        </div>
        <div class="tarjeta-venta-pie">
          <span>Total cerrado</span>
          <span>${money(c.total)}</span>
        </div>
      `;
      listaCierres.appendChild(card);
    });
  }
}

// ---------------- CIERRE DE CAJA ----------------
async function obtenerVentasDesdeUltimoCierre() {
  const cierres = await getAll("cierres");
  const ultimoCierre = cierres.length > 0 ? cierres[cierres.length - 1] : null;
  const tsDesde = ultimoCierre ? ultimoCierre.timestampCierre : 0;
  const todasVentas = await getAll("ventas");
  const ventas = todasVentas.filter((v) => v.timestamp > tsDesde);
  return { ventas, ultimoCierre };
}

async function renderCierre() {
  const { ventas, ultimoCierre } = await obtenerVentasDesdeUltimoCierre();

  const textoPeriodo = document.getElementById("cierre-periodo-texto");
  if (ultimoCierre) {
    textoPeriodo.textContent = `Ventas desde el último cierre (${ultimoCierre.fecha} ${ultimoCierre.hora}).`;
  } else {
    textoPeriodo.textContent = "Ventas desde el inicio de los registros (sin cierres previos).";
  }

  const total = ventas.reduce((s, v) => s + v.total, 0);
  const cantProds = ventas.reduce((s, v) => s + v.items.reduce((si, it) => si + it.cantidad, 0), 0);
  const efectivo = ventas.filter((v) => (v.metodoPago || "Efectivo") === "Efectivo").reduce((s, v) => s + v.total, 0);
  const transferencia = ventas.filter((v) => v.metodoPago === "Transferencia").reduce((s, v) => s + v.total, 0);
  const otro = ventas.filter((v) => v.metodoPago === "Otro").reduce((s, v) => s + v.total, 0);

  document.getElementById("cierre-total").textContent = money(total);
  document.getElementById("cierre-cant-productos").textContent = cantProds;
  document.getElementById("cierre-efectivo").textContent = money(efectivo);
  document.getElementById("cierre-transferencia").textContent = money(transferencia);
  document.getElementById("cierre-otro").textContent = money(otro);

  // Conteo por producto
  const conteo = {};
  ventas.forEach((v) => {
    v.items.forEach((it) => {
      conteo[it.nombre] = (conteo[it.nombre] || 0) + it.cantidad;
    });
  });

  const lista = document.getElementById("cierre-lista-productos");
  lista.innerHTML = "";
  const ordenados = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  if (ordenados.length === 0) {
    lista.innerHTML = `<div class="texto-ayuda">No hay ventas pendientes de cierre.</div>`;
  } else {
    ordenados.forEach(([nom, cant]) => {
      const row = document.createElement("div");
      row.className = "fila-reporte";
      row.innerHTML = `<span class="fila-reporte-nombre">${nom}</span><span class="fila-reporte-valor">${cant} unid.</span>`;
      lista.appendChild(row);
    });
  }
}

document.getElementById("btn-cerrar-caja").addEventListener("click", async () => {
  const { ventas } = await obtenerVentasDesdeUltimoCierre();
  if (ventas.length === 0) {
    mostrarToast("No hay ventas para cerrar.");
    return;
  }
  const total = ventas.reduce((s, v) => s + v.total, 0);
  if (!confirm(`¿Confirmas el cierre de caja por un total de ${money(total)} (${ventas.length} ventas)?`)) {
    return;
  }
  const ahora = new Date();
  const cantProds = ventas.reduce((s, v) => s + v.items.reduce((si, it) => si + it.cantidad, 0), 0);
  const efectivo = ventas.filter((v) => (v.metodoPago || "Efectivo") === "Efectivo").reduce((s, v) => s + v.total, 0);
  const transferencia = ventas.filter((v) => v.metodoPago === "Transferencia").reduce((s, v) => s + v.total, 0);
  const otro = ventas.filter((v) => v.metodoPago === "Otro").reduce((s, v) => s + v.total, 0);

  const cierre = {
    fecha: fechaLocalStr(ahora),
    hora: horaLocalStr(ahora),
    timestampCierre: ahora.getTime(),
    cantidadVentas: ventas.length,
    cantidadProductos: cantProds,
    total: +total.toFixed(2),
    efectivo: +efectivo.toFixed(2),
    transferencia: +transferencia.toFixed(2),
    otro: +otro.toFixed(2)
  };

  await add("cierres", cierre);
  mostrarToast(`Cierre guardado: ${money(total)}`);
  renderCierre();
  sincronizarConGitHubSilencioso();
});

// ---------------- CONFIGURACIÓN ----------------
async function obtenerPin() {
  const r = await getUno("config", "pin");
  return r ? r.valor : "1234";
}

document.getElementById("btn-desbloquear").addEventListener("click", async () => {
  const ingresado = document.getElementById("pin-config").value;
  const real = await obtenerPin();
  if (ingresado === real) {
    configDesbloqueada = true;
    document.getElementById("bloqueo-config").classList.add("oculto");
    document.getElementById("contenido-config").classList.remove("oculto");
    renderConfig();
  } else {
    mostrarToast("PIN incorrecto.");
    document.getElementById("pin-config").value = "";
  }
});

async function renderConfig() {
  if (!configDesbloqueada) return;

  const lista = document.getElementById("lista-precios");
  lista.innerHTML = "";
  productos.forEach((p) => {
    const card = document.createElement("div");
    card.className = "fila-precio";
    card.innerHTML = `
      <div class="fila-precio-nombre">
        <span class="fila-precio-icono">${p.icono}</span>
        <span>${p.nombre}</span>
      </div>
      <div class="fila-precio-inputs">
        <label class="campo-precio">
          <span>Local ($)</span>
          <input type="number" step="0.05" min="0" value="${p.precioLocal ?? ""}" data-id="${p.id}" data-campo="local" />
        </label>
        <label class="campo-precio">
          <span>Llevar ($)</span>
          <input type="number" step="0.05" min="0" value="${p.precioLlevar ?? ""}" placeholder="Opcional" data-id="${p.id}" data-campo="llevar" />
        </label>
      </div>
    `;
    lista.appendChild(card);
  });

  lista.querySelectorAll("input").forEach((inp) => {
    inp.addEventListener("change", async () => {
      const id = inp.dataset.id;
      const campo = inp.dataset.campo;
      const val = inp.value === "" ? null : parseFloat(inp.value);
      const prod = productos.find((x) => x.id === id);
      if (prod) {
        if (campo === "local") prod.precioLocal = val ?? 0;
        if (campo === "llevar") prod.precioLlevar = val;
        await put("productos", prod);
        mostrarToast(`Precio de ${prod.nombre} actualizado.`);
      }
    });
  });

  // Cargar configuración de GitHub
  const ghConfig = (await getUno("config", "github_sync")) || { valor: {} };
  document.getElementById("gh-repo").value = ghConfig.valor.repo || "";
  document.getElementById("gh-token").value = ghConfig.valor.token || "";
  document.getElementById("gh-branch").value = ghConfig.valor.branch || "main";

  document.getElementById("version-app").textContent = `Versión del sistema: ${VERSION_APP}`;
}

document.getElementById("btn-guardar-pin").addEventListener("click", async () => {
  const nuevo = document.getElementById("nuevo-pin").value.trim();
  if (!/^\d{4}$/.test(nuevo)) {
    mostrarToast("El PIN debe tener exactamente 4 dígitos.");
    return;
  }
  await put("config", { clave: "pin", valor: nuevo });
  document.getElementById("nuevo-pin").value = "";
  mostrarToast("PIN actualizado correctamente.");
});

// Guardar configuración de GitHub Sync
document.getElementById("btn-guardar-gh").addEventListener("click", async () => {
  const repo = document.getElementById("gh-repo").value.trim();
  const token = document.getElementById("gh-token").value.trim();
  const branch = document.getElementById("gh-branch").value.trim() || "main";

  await put("config", {
    clave: "github_sync",
    valor: { repo, token, branch }
  });
  mostrarToast("Configuración de GitHub guardada.");
});

document.getElementById("btn-probar-gh").addEventListener("click", async () => {
  mostrarToast("Probando sincronización con GitHub...");
  const res = await respaldarEnGitHub();
  if (res.ok) {
    mostrarToast("✅ Copia subida a GitHub con éxito.");
  } else {
    mostrarToast(`❌ Error: ${res.error}`);
  }
});

// ---------------- RESPALDO Y RESTAURACIÓN ----------------
async function generarDataRespaldo() {
  return {
    version: VERSION_APP,
    fechaExportacion: new Date().toISOString(),
    productos: await getAll("productos"),
    ventas: await getAll("ventas"),
    cierres: await getAll("cierres"),
    config: await getAll("config")
  };
}

document.getElementById("btn-exportar-json").addEventListener("click", async () => {
  const data = await generarDataRespaldo();
  const json = JSON.stringify(data, null, 2);
  descargarArchivo(`respaldo-cafeteria-${fechaLocalStr()}.json`, json, "application/json");
});

document.getElementById("btn-exportar-csv").addEventListener("click", async () => {
  const ventas = await getAll("ventas");
  let csv = "ID,Fecha,Hora,Consumo,MetodoPago,Productos,Total
";
  ventas.forEach((v) => {
    const prods = v.items.map((i) => `${i.cantidad}x ${i.nombre} (${i.tipoConsumo || "local"})`).join(" | ");
    csv += `"${v.id}","${v.fecha}","${v.hora}","${v.tipoConsumo || "mixto"}","${v.metodoPago || "Efectivo"}","${prods.replace(/"/g, '""')}","${v.total}"
`;
  });
  descargarArchivo(`ventas-cafeteria-${fechaLocalStr()}.csv`, csv, "text/csv");
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

// ---------------- GITHUB SYNC (API REST) ----------------
async function respaldarEnGitHub() {
  try {
    const ghConfig = (await getUno("config", "github_sync"))?.valor;
    if (!ghConfig || !ghConfig.repo || !ghConfig.token) {
      return { ok: false, error: "Falta configurar Token o Repositorio." };
    }

    const { repo, token, branch = "main" } = ghConfig;
    const path = "data/respaldo.json";
    const data = await generarDataRespaldo();
    const contenidoStr = JSON.stringify(data, null, 2);
    // Codificar a UTF-8 base64
    const contenidoB64 = btoa(unescape(encodeURIComponent(contenidoStr)));

    // 1. Obtener SHA actual si el archivo ya existe
    let sha = null;
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    }

    // 2. Subir o actualizar el archivo con PUT
    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Auto-respaldo ventas: ${fechaLocalStr()} ${horaLocalStr()}`,
        content: contenidoB64,
        branch: branch,
        sha: sha || undefined
      })
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      return { ok: false, error: err.message || "Error al subir a GitHub." };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function sincronizarConGitHubSilencioso() {
  if (!navigator.onLine) return;
  const ghConfig = (await getUno("config", "github_sync"))?.valor;
  if (ghConfig && ghConfig.repo && ghConfig.token) {
    respaldarEnGitHub().catch(() => {});
  }
}

// ---------------- CARGA INICIAL ----------------
async function cargarProductos() {
  productos = await getAll("productos");
  if (productos.length === 0) {
    for (const p of PRODUCTOS_INICIALES) await put("productos", p);
    productos = await getAll("productos");
  }

  for (const p of productos) {
    const base = PRODUCTOS_INICIALES.find((x) => x.id === p.id);
    if (base && p.icono !== base.icono) {
      p.icono = base.icono;
      delete p.emoji;
      await put("productos", p);
    }
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
