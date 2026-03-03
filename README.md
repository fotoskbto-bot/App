# ☕ Macadamia Shop — Sistema de Caja

Aplicación web de caja y finanzas para tiendas pequeñas. Construida con **Next.js**, desplegada en **Vercel** y con almacenamiento en **Google Sheets**.

---

## 🗂 Estructura del proyecto

```
macadamia/
├── pages/
│   ├── index.js              ← App principal (todos los tabs)
│   ├── _app.js               ← Wrapper Next.js
│   └── api/
│       ├── data.js           ← GET todos los datos de una vez
│       ├── transacciones.js  ← CRUD transacciones
│       ├── gastos.js         ← CRUD gastos no fijos
│       ├── gastos-fijos.js   ← CRUD gastos fijos
│       ├── pendientes.js     ← CRUD ventas pendientes
│       ├── creditos.js       ← CRUD créditos + abonos
│       └── productos.js      ← CRUD catálogo de productos
├── components/
│   └── ui.js                 ← Componentes reutilizables
├── lib/
│   ├── sheets.js             ← Capa de datos Google Sheets API
│   └── useStore.js           ← Estado global + lógica de negocio
├── styles/
│   └── globals.css
├── public/
│   └── logo.jpg              ← ⚠️ Pon aquí tu logo
├── .env.example
├── next.config.js
└── package.json
```

---

## 🚀 Despliegue paso a paso

### 1. Preparar el repositorio en GitHub

```bash
# Clona / descarga este proyecto
git init
git add .
git commit -m "Initial commit — Macadamia Shop"

# Crea un repo en github.com y conecta
git remote add origin https://github.com/TU_USUARIO/macadamia-shop.git
git push -u origin main
```

---

### 2. Configurar Google Sheets

#### 2a. Crear el Spreadsheet

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja nueva
2. Ponle el nombre `Macadamia Shop`
3. Copia el **ID** de la URL:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
   ```

#### 2b. Crear Service Account

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo (o usa uno existente)
3. Ve a **APIs y servicios → Biblioteca**
4. Busca y habilita **Google Sheets API**
5. Ve a **APIs y servicios → Credenciales**
6. Clic en **Crear credenciales → Cuenta de servicio**
7. Dale un nombre (ej: `macadamia-sheets`) y crea
8. En la lista de cuentas de servicio, clic en la que creaste
9. Ve a la pestaña **Claves → Agregar clave → Crear clave nueva → JSON**
10. Se descargará un archivo `.json` — **guárdalo en un lugar seguro**

#### 2c. Compartir el Spreadsheet con la Service Account

1. Abre el archivo JSON descargado
2. Copia el valor de `client_email` (algo como `macadamia-sheets@proyecto.iam.gserviceaccount.com`)
3. En tu Google Spreadsheet, clic en **Compartir**
4. Pega el email y dale permiso de **Editor**
5. Clic en **Enviar**

---

### 3. Agregar el logo

Coloca tu imagen de logo en:
```
public/logo.jpg
```
(puede ser `.jpg`, `.png` o `.webp` — actualiza la referencia en `pages/index.js` si cambias la extensión)

---

### 4. Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta (gratis)
2. Clic en **New Project → Import Git Repository**
3. Selecciona tu repo `macadamia-shop`
4. En **Environment Variables**, agrega estas dos variables:

| Variable | Valor |
|----------|-------|
| `GOOGLE_SHEET_ID` | El ID de tu spreadsheet (paso 2a) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | El contenido **completo** del archivo JSON en una sola línea |

   > 💡 Para convertir el JSON a una sola línea, puedes usar:
   > ```bash
   > cat tu-archivo-credenciales.json | tr -d '\n'
   > ```
   > O pégalo tal cual en Vercel — la plataforma lo maneja bien.

5. Clic en **Deploy**
6. ¡Listo! Tu app estará en `https://macadamia-shop.vercel.app`

---

### 5. Desarrollo local

```bash
# Instalar dependencias
npm install

# Crear archivo de entorno local
cp .env.example .env.local
# Edita .env.local con tus credenciales reales

# Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

---

## 📊 Estructura del Google Spreadsheet

La app crea automáticamente estas hojas (tabs) la primera vez:

| Hoja | Descripción |
|------|-------------|
| `Transacciones` | Todos los movimientos de dinero |
| `Gastos` | Gastos no fijos (insumos, transporte, etc.) |
| `GastosFijos` | Gastos recurrentes mensuales |
| `Pendientes` | Ventas guardadas sin cobrar |
| `Creditos` | Clientes fiados |
| `Abonos` | Pagos parciales de créditos |
| `Productos` | Catálogo de productos del menú |

---

## ✨ Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| 🧾 **Caja** | Venta rápida por producto, venta manual, pendientes y cobro |
| ⏳ **Pendientes** | Pedidos guardados, cobrar o mover a crédito |
| 👤 **Créditos** | Clientes fiados con historial de abonos |
| 📋 **Gastos** | Gastos del día y del mes no recurrentes |
| 📊 **Resumen** | Saldo por cuenta (Nequi, Bancolombia, Daviplata, Efectivo) |
| 📜 **Movimientos** | Historial filtrable por mes |
| 📅 **Gastos Fijos** | Recordatorios y pago de gastos mensuales |
| ☕ **Productos** | Gestión del catálogo con emoji, nombre y precio |

---

## 🔒 Variables de entorno

```env
GOOGLE_SHEET_ID=tu_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

---

## 🛠 Tecnologías

- **Next.js 14** — Framework React con API Routes
- **Google Sheets API v4** — Base de datos en la nube
- **Vercel** — Hosting y despliegue continuo
- **GitHub** — Control de versiones

---

## 📱 Acceso desde el celular

Una vez desplegada en Vercel, puedes abrir la URL en el navegador de tu celular. Para instalarla como app:

- **Android**: Menú del navegador → "Agregar a pantalla de inicio"
- **iOS**: Safari → Compartir → "Agregar a pantalla de inicio"
