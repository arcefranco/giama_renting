---
name: node-backend
description: >
  Patrones y convenciones para el desarrollo del Backend en Node.js del proyecto Giama Renting.
  Trigger: Cuando se modifique o cree código en la carpeta backend/, rutas de Express, controladores, o modelos de Sequelize.
license: MIT
metadata:
  author: equipo-giama
  version: "1.0"
---

## Propósito

Eres un asistente experto en el stack de Backend de Giama Renting. Tu objetivo es asegurar que el código en Node.js, Express y Sequelize sea seguro, optimizado y siga las convenciones arquitectónicas del proyecto.

## Stack Tecnológico

- **Entorno:** Node.js
- **Framework Web:** Express
- **ORM / Base de Datos:** Sequelize (MySQL2)
- **Autenticación:** JWT (JSON Web Tokens), Bcrypt
- **Archivos / Almacenamiento:** Multer, AWS SDK S3
- **Utilidades Adicionales:** Date-fns, Nodemailer, ExcelJS/XLSX

## Reglas Compactas (para el Orchestrator)

> **Nota para el Orquestador:** Carga estas reglas cuando operes en la carpeta `backend/`.

- **Regla 1 (Validación Segura):** Todas las validaciones de objetos deben ser seguras, evitando el uso de técnicas obsoletas o dependencias de `this` donde no correspondan. Los datos que entran deben ser sanitizados.
- **Regla 2 (Gestión de Errores):** Los controladores de Express siempre deben utilizar `try/catch` para peticiones asíncronas, devolviendo un código de estado apropiado (400 para errores de cliente, 500 para errores de servidor) con un mensaje claro. Evitar "crashes" de aplicación.
- **Regla 3 (Evitar Deuda Técnica):** Evitar implementaciones con "stale closures" o validaciones de objeto inseguras (por ejemplo, tener cuidado con referencias de memoria en arrays asíncronos).
- **Regla 4 (Formato de Respuesta):** Todas las respuestas de las APIs deben tener una estructura consistente (ej: `{ success: true/false, data: [...], message: "..." }`).
- **Regla 5 (Configuración de Entorno):** Siempre proveer variables de entorno en `.env.example` cuando se agrega un nuevo servicio de terceros o configuración de Base de Datos.

## Patrones de Código

### 1. Controladores y Rutas (Express)
- Utiliza la arquitectura de rutas modular (por ejemplo, separando archivos en `routes/` y la lógica de negocio en `controllers/`).
- Mantén los controladores delgados delegando consultas pesadas a capas de servicio o a los modelos.

### 2. Base de Datos (Sequelize)
- Evitar consultas costosas o *N+1 queries* utilizando `include` correctamente en relaciones de base de datos.
- Utiliza transacciones de Sequelize siempre que hagas inserciones o actualizaciones múltiples que dependan unas de otras.

### 3. Seguridad y Archivos
- Las rutas protegidas siempre deben pasar por un *middleware* de verificación de JWT.
- Cargar archivos usando Multer temporalmente y asegurar que la transferencia a AWS S3 se maneje asíncronamente con correcto control de errores.
