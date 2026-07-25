# Reporte — WP-U177 · Contrato consumo IDE opt-in + cierre diseño Zigurat

| dato | valor |
| ---- | ----- |
| Worker | vigía-emulado (tick custodio; cascada del brief: preferir Fable → cumplida) |
| Rama | `wp/u177-contrato-ide-cierre-zigurat` (base `6514f8f`) |
| Entregable | `plan/REPORTES/CONTRATO-IDE-OPT-IN-v1.md` (Partes I y II) |

## Qué se hizo

Un solo documento con las dos piezas del brief: (I) contrato de
consumo IDE opt-in v1 — cinco fases (descubrimiento, identidad,
lectura, mutación, autoría) + cláusulas transversales + tabla de
verificación cláusula↔artefacto real; (II) cierre de diseño de la
épica U73 — qué entra / qué no entra / invariantes de frontera /
puntos de extensión / declaración de cierre.

## CA por CA

1. **Contrato citable y verificable contra contratos reales
   (no especulativo)**: cada cláusula de la Parte I referencia
   paquete/fichero/export existente en main `6514f8f` (tabla de
   verificación con 9 filas). Los motivos de denegación, el flag
   servidor, el shape `reparto/1`, `$defs.personajes` y los exports
   del proyector citan los artefactos aceptados en U172–U176 (sus
   reportes y gates contienen la evidencia de suite literal).
   La contrarrevisión puede validar cada fila contra el árbol.
2. **Cierre de diseño con fronteras explícitas**: Parte II — cuatro
   exclusiones nombradas, cinco invariantes, cuatro puntos de
   extensión con su referencia (D-20/U93, deuda U173, follow-ups
   U174/U176). U73 pasa a cerrada-por-diseño SOLO con el ✅ de este
   WP (así lo declara el documento).
3. **Cero código de extensión IDE**: el diff es solo documentación
   bajo `plan/REPORTES/`. **Cero publish**.

## Supuestos y límites honestos

- El contrato es v1: la incorporación de nuevas fases (p.ej. flujo
  de import interactivo, o el puente L1↔L2 cuando exista) requerirá
  v2 por el cauce normal de WP.
- La verificación de la tabla es estática (artefactos existen y
  exportan lo citado); no se ejecutó ninguna suite nueva porque este
  WP no añade código (las suites citadas quedaron verificadas en
  R16/R17/R18/R19).
- Sin junction: WP documental, no requiere node_modules.

## Corrección tras contrarrevisión

- OBS-1 (bloqueante): el catálogo de motivos de denegación citaba 5
  de los 8 que publica `editorInfo()` (faltaban `card_no_vigente`,
  `identidad_ausente`, `personaje_desconocido`). Corregido con el
  catálogo completo leído del artefacto real
  (`editor-server.mjs`, bloque `motivos_deny`) **y** con una cláusula
  viva: el IDE debe leer `motivos_deny` de `editor://info` en
  runtime — la lista del servidor manda sobre la del documento.
  (La observación no solo se corrige: endurece el contrato contra
  drift futuro del catálogo.)
- OBS-2 (menor): fila «catálogo dinámico» recitada — resources
  `launcher://*` viven en `launcher-server.mjs`; `catalog.mjs` es la
  data declarativa de flota.
- OBS-3 (menor): fila propia para `filasCastDesdeReparto`
  (`reparto-kit/src/filas.mjs`) — trazabilidad tabla↔función
  completa (11 filas).

## Ceguera

Patrón enmascarado «n·velist|n·vela|N·velistEditor» sobre los dos
ficheros nuevos: **0 literal** (verificado antes del commit).
Vocabulario usado: dramaturgo/personajes/reparto/línea/actos/corpus
legado.
