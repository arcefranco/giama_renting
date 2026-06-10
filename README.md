# Giama Renting

Sistema de gestión para alquiler de vehículos (Renting). El proyecto está estructurado en un monorepo que contiene tanto el **Backend** (Node.js, Express, Sequelize) como el **Frontend** (React, Vite, Redux, DevExtreme).

## Arquitectura y Stack Tecnológico

### Backend
- **Framework**: Node.js con Express
- **Base de Datos**: MySQL (Hosteada en Amazon RDS)
- **ORM**: Sequelize
- **Autenticación**: JWT (JSON Web Tokens)
- **Otras herramientas**: AWS S3, Nodemailer, Elastic Email

### Frontend
- **Framework**: React.js (compilado con Vite)
- **Estado Global**: Redux Toolkit + Redux Persist
- **Componentes UI**: DevExtreme
- **Estilos**: Vanilla CSS / CSS Modules

---

## Requisitos Previos

1. **Node.js**: Versión 16 o superior.
2. **Acceso a Base de Datos**: Es requerido contar con permisos de red internos para conectarse a la base de datos de Desarrollo/Testing. Si al iniciar sesión el backend arroja un error `ETIMEDOUT`, contactá al administrador de infraestructura para verificar tus accesos.

---

## Instalación y Configuración Local

Dado que el proyecto está dividido, el cliente y el servidor deben configurarse por separado.

### 1. Configurar el Backend

1. Entrar a la carpeta del backend e instalar dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Crear tu archivo de variables de entorno local:
   ```bash
   cp .env.example .env
   ```
3. Abrir el archivo `backend/.env` y completar las credenciales reales de la base de datos, puerto y claves AWS proporcionadas por el equipo.
   > **Nota:** Verificá bien la variable `DB_NAME` (nombre de la base de datos). Asegurate de estar usando el nombre correcto ya que existe una base de datos para testing/desarrollo y otra distinta para producción.

### 2. Configurar el Frontend

1. Entrar a la carpeta del frontend e instalar dependencias:
   ```bash
   cd frontend
   npm install
   ```
2. Crear tu archivo de variables de entorno local:
   ```bash
   cp .env.example .env
   ```
3. Abrir `frontend/.env` y asegurarte de que `VITE_REACT_APP_HOST` apunte al puerto correcto donde correrá tu backend local (por ejemplo: `http://localhost:3001/`).
   > **Nota:** Es fundamental que el puerto especificado en el `VITE_REACT_APP_HOST` del frontend coincida exactamente con la variable `PORT` que configuraste en el `.env` del backend para que puedan comunicarse.

---

## Levantar el Entorno de Desarrollo

Para correr la aplicación localmente, deberás abrir **dos terminales**.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*(Levantará Nodemon escuchando en el puerto configurado).*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*(Levantará el servidor de Vite, generalmente en `http://localhost:5173`).*

---

## Estructura de Directorios Principal

```text
giama_renting/
├── backend/                # API RESTful
│   ├── index.js            # Punto de entrada del servidor
│   ├── src/
│   │   ├── controllers/    # Lógica de negocio (Login, Vehículos, Clientes, etc.)
│   │   ├── routes/         # Definición de endpoints
│   │   └── middlewares/    # Autenticación y validaciones de JWT
│   └── .env.example        # Plantilla de configuración
├── frontend/               # Cliente SPA
│   ├── src/
│   │   ├── components/     # Componentes visuales y de rutas
│   │   ├── reducers/       # Slices de Redux Toolkit y llamadas HTTP (Thunks)
│   │   └── App.jsx
│   ├── store.js            # Configuración de Redux Store y Redux Persist
│   └── .env.example        # Plantilla de configuración
└── README.md               # Este archivo
```

---

## Solución de Problemas Frecuentes

- **`ETIMEDOUT` (ConnectionError) al intentar ingresar**: Tu computadora no tiene acceso a la base de datos de Amazon. Asegurate de estar conectado a la VPN de Giama o solicitá autorización de IP.
- **`EADDRINUSE` (Puerto ya en uso)**: Un proceso de Node.js quedó "colgado" en segundo plano de una sesión anterior. Liberá el puerto (ej: `npx kill-port 3001`) y volvé a correr `npm run dev`.
- **Modificación de Variables de Entorno**: `nodemon` no detecta los cambios en el archivo `.env` de forma automática. Si editás una variable, debés apagar el backend (`Ctrl + C`) y volver a iniciarlo.
