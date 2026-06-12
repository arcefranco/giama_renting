---
name: react-frontend
description: >
  Patrones y convenciones para el desarrollo del Frontend en React del proyecto Giama Renting.
  Trigger: Cuando se modifique o cree código en la carpeta frontend/, se utilicen componentes de React, Redux Toolkit o DevExtreme.
license: MIT
metadata:
  author: equipo-giama
  version: "1.0"
---

## Propósito

Eres un asistente experto en el stack de Frontend de Giama Renting. Tu objetivo es asegurar que el código nuevo o modificado siga las convenciones arquitectónicas, de estilo y de librerías del proyecto.

## Stack Tecnológico

- **Framework:** React 18+ (Vite)
- **Estado Global:** Redux Toolkit + Redux Persist
- **Ruteo:** React Router DOM (v7+)
- **Componentes de UI / Grillas:** DevExtreme React
- **Estilos:** CSS Modules / Vanilla CSS (Se valora la consistencia y el diseño moderno)
- **Formateo/Calidad:** ESLint

## Reglas Compactas (para el Orchestrator)

> **Nota para el Orquestador:** Carga estas reglas cuando operes en la carpeta `frontend/`.

- **Regla 1 (Validación y Formularios):** Todos los formularios deben tener validación estricta y proporcionar feedback visual inmediato (inline feedback o tooltips).
- **Regla 2 (Estados de Carga):** Cualquier acción que requiera una llamada al backend debe mostrar un indicador de carga (spinner de `react-spinners`) y deshabilitar los botones de envío (Submit) para evitar peticiones duplicadas o "race conditions".
- **Regla 3 (Manejo de Errores):** Las llamadas a la API deben capturar los errores y mostrar notificaciones amigables (usando `react-toastify` o `sweetalert2`).
- **Regla 4 (Warnings de React):** Evitar warnings en la consola sobre inputs controlados vs no controlados. Los estados iniciales de los inputs deben ser `""` (string vacío), no `null` ni `undefined`.
- **Regla 5 (Uso de DevExtreme):** Utilizar correctamente los componentes de DevExtreme (DataGrid, Form, etc.) respetando la sintaxis moderna de React y minimizando los errores E1059 de configuración.

## Patrones de Código

### 1. Estado Global con Redux Toolkit
Al crear *slices* nuevos, recuerda siempre manejar los errores de persistencia si corresponde, asegurando que los valores que se guardan sean serializables (omitir acciones o valores no serializables en los middlewares si es necesario).

### 2. Estructura de Componentes
- Mantener una arquitectura atómica / orientada a dominios (por ejemplo, agrupar todo lo relacionado a "PagosClientes" en su propia carpeta).
- Separar componentes contenedores de componentes presentacionales donde tenga sentido para no saturar los componentes de la vista con lógica compleja de negocio.

### 3. Formularios Modernos y Modales
- Implementar la lógica "abrir para resetear" (*open-to-reset*): cuando se abre un modal para crear/editar, los campos deben limpiarse, excepto los seleccionados por contexto previo (ej. un cliente preseleccionado).
- Actualizar siempre el estado local / global tras una transacción exitosa (ej. recargar la tabla) antes de cerrar el modal.
