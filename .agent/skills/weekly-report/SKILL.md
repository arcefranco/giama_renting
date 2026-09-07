---
name: weekly-report
description: >
  Genera el reporte semanal de trabajos realizados en Giama Renting,
  cruzando datos de Jira (proyecto GR), historial de git y conversaciones previas.
  Trigger: Cuando el usuario pide el reporte semanal, "reporte de la semana", "qué hicimos esta semana".
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Cuando usar esta skill

- El usuario pide el reporte semanal o dice "haceme el reporte"
- El usuario dice "qué hicimos esta semana" o "reporte de trabajos"
- Se necesita documentar el avance semanal para stakeholders no técnicos

---

## Proceso — seguir en este orden

### 1. Determinar el período

El período es siempre **lunes a viernes de la semana actual** (o la semana que el usuario indique).
Formato: `DD de mes al DD de mes de YYYY`.

### 2. Obtener datos del git

```bash
# Commits de la semana con autor y fecha
git log --oneline --format="%h %ad %an %s" --date=short --since="7 days ago"

# Merges (PRs a producción)
git log --oneline --merges --format="%h %ad %s" --date=short --since="7 days ago"

# Commits por ticket (para ver qué archivos tocó cada uno)
git show --stat <hash>
```

**CRÍTICO**: Usar la FECHA DEL COMMIT en git como fuente de verdad del período.
Jira devuelve tickets "actualizados" que pueden ser de semanas anteriores — NO incluirlos si el commit es anterior al período.

### 3. Consultar Jira

- Cloud ID: `f8e69d1e-97f6-458e-a1d3-a2ab7a47b705` (cyberarg.atlassian.net)
- Proyecto: `GR` (Giama Renting)
- JQL: `project = GR AND updated >= -7d ORDER BY updated DESC`

Filtrar solo tickets cuyo trabajo efectivo (según git) cae dentro del período.
Los tickets que solo cambiaron de estado esta semana pero fueron implementados antes → NO incluir como trabajo de esta semana.

### 4. Buscar contexto en conversaciones previas

Usar `mem_search` en engram con keywords del período para recuperar decisiones, análisis o trabajo que no quedó en git (investigaciones, reuniones, análisis de errores).

### 5. Agrupar por área funcional

NO agrupar por ticket. Agrupar semánticamente:

| Área | Ejemplos de qué va acá |
|------|------------------------|
| Gestión y Seguimiento de Vehículos | estados, flota, reservas |
| Importación Masiva (Multas / Telepases) | cargas masivas, Excel, rectificaciones |
| Trazabilidad y Auditoría | campos de auditoría, historial |
| Cuenta Corriente y Reportes | Excel, ficha cliente, pagos |
| Seguridad y Control de Accesos | roles, permisos, botones |
| Contabilidad y Facturación | PA6, asientos, cuentas |
| En análisis | tareas investigadas pero no completadas |

### 6. Redactar con el tono correcto

Reglas de tono:
- Audiencia: stakeholders NO técnicos (gerencia, cliente)
- Sin jerga técnica (no decir "commit", "branch", "endpoint", "tabla", "controller")
- Sin números de ticket visibles
- Enfocarse en QUÉ PUEDE HACER el usuario ahora que antes no podía
- Verbos de resultado: "Se incorporó", "Se mejoró", "Se corrigió", "Se habilitó", "Ahora el sistema..."
- Si algo está en análisis o pausado, decirlo claramente sin dramatismo

FORMATO DE SALIDA — CRÍTICO:
- El reporte SIEMPRE se entrega como texto plano, NO como markdown
- PROHIBIDO usar: #, ##, **, *, `, ---, tablas markdown, o cualquier símbolo de formato
- Usar solo: texto, saltos de línea y el carácter • para bullets
- El usuario necesita copiar y pegar el resultado directamente sin que aparezcan símbolos extraños

---

## Template de salida

```
DETALLE DE TRABAJOS REALIZADOS

Semana del [DD de mes] al [DD de mes de YYYY]


[Área funcional 1]

    • [Título del ítem]: [Descripción en lenguaje de negocio. Qué problema resuelve o qué mejora trae. Máximo 3 oraciones.]

    • [Título del ítem]: [...]


[Área funcional 2]

    • [...]


En análisis

    • [Título]: [Descripción de qué se está investigando y por qué.]
```

---

## Reglas críticas

1. **Git manda sobre Jira** para determinar si algo cayó en esta semana o no.
2. **No inventar** — si no hay evidencia en git ni en Jira ni en memoria, no incluir.
3. **No mezclar semanas** — si el commit es de la semana anterior, va al reporte de esa semana.
4. **Siempre verificar** antes de afirmar que algo está "en producción" — solo los merges a `main`/`testing` cuentan como producción.
5. **GR-74 y similares** (errores contables) van siempre en "En análisis" hasta que haya resolución confirmada.

---

## Recursos

- **Template**: Ver [assets/template.md](assets/template.md) para ejemplo completo
- **Ejemplo de salida**: Ver [assets/ejemplo_agosto_2026.md](assets/ejemplo_agosto_2026.md)
