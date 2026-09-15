# ☕ Control Cafetería

Sistema de punto de venta (POS) sencillo para cafetería. Es una **aplicación web progresiva (PWA)** que funciona sin internet y se puede instalar en teléfonos, tablets y computadoras como si fuera una app nativa.

Toda la información (ventas, productos, precios y cierres de caja) se guarda en el navegador mediante **IndexedDB**: no necesita servidor ni base de datos externa.

## Características

- 🛒 **Punto de venta**: productos con ícono y precio, carrito, cobro con método de pago (efectivo, transferencia, otro).
- 🍽️🥡 **Precios dobles**: «en el local» y «para llevar» por producto.
- 📊 **Panel de inicio**: ventas del día, semana y mes, y producto más vendido.
- 📋 **Historial** con filtros (hoy, ayer, semana, mes, rango personalizado) y lista de cierres de caja.
- 🔒 **Cierre de caja** con resumen por método de pago y por producto.
- ⚙️ **Configuración protegida por PIN** (inicial: `1234`): precios, cambio de PIN y respaldos.
- 💾 **Respaldo y restauración**: exporta todo en JSON, ventas en CSV, e importa respaldos.
- 📴 **Funciona sin internet** gracias al service worker (caché local).
- 📱💻 **Diseño adaptable**: teléfono, tablet y computadora de escritorio.

## Cómo publicarla en GitHub Pages (gratis)

1. Crea un repositorio en GitHub (por ejemplo `control-cafeteria`).
2. Sube todos los archivos manteniendo esta estructura:

   ```
   index.html
   style.css
   app.js
   manifest.json
   service-worker.js
   icons/
     icon-192.png
     icon-512.png
     icon-maskable-512.png
     apple-touch-icon.png
   ```

3. En el repositorio ve a **Settings → Pages**.
4. En **Build and deployment** elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
5. En 1–2 minutos la app queda disponible en:
   `https://TU-USUARIO.github.io/control-cafeteria/`

## Instalarla como app

- **Android (Chrome)**: abre la URL → menú ⋮ → *Instalar aplicación* / *Añadir a pantalla de inicio*.
- **iPhone/iPad (Safari)**: abre la URL → botón Compartir → *Añadir a pantalla de inicio*.
- **PC (Chrome/Edge)**: en la barra de direcciones aparece el botón *Instalar*.

## Uso rápido

1. En la pestaña **Venta** elige *En el local* o *Para llevar* y toca los productos.
2. Abre el **Carrito**, ajusta cantidades y pulsa **COBRAR**.
3. Elige el método de pago y confirma.
4. Al final del día usa **Caja → CERRAR CAJA**; el conteo se reinicia para el siguiente turno.
5. Haz respaldos periódicos desde **Config** (PIN `1234` la primera vez).

> ⚠️ Los datos viven en el navegador del dispositivo. Si borras los datos del sitio o cambias de dispositivo, exporta antes un respaldo JSON e impórtalo en el nuevo equipo.

## Tecnologías

HTML + CSS + JavaScript puro, sin frameworks. IndexedDB para datos, service worker para modo offline y `manifest.json` para instalación PWA.

## Licencia

MIT — ver [LICENSE](LICENSE).
