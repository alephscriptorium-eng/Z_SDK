# Contrato de consumo IDE opt-in · v1 — y cierre de diseño de la épica U73 · Zigurat acotada

**WP-U177 · Ola E.** Este documento es el contrato que un IDE/editor
externo puede citar para consumir el dominio del dramaturgo, y el
acta de cierre de diseño de la épica U73. **No implementa ninguna
extensión** (ownership externo al carril). Toda cláusula cita
artefactos reales de main (`6514f8f`); nada especulativo.

---

## Parte I · Contrato de consumo IDE opt-in (v1)

### Principio rector

**Opt-in estricto**: ningún paquete de `engine/*` ni `mesh/*` conoce
ni depende del IDE. El IDE es un consumidor más que se acopla por
catálogo, identidad y contratos publicados — una fila del inventario,
no una pieza del motor. Corolario: retirar el IDE no deja huella en
el carril.

### Fase 0 · Descubrimiento (catálogo dinámico, no listas fijas)

- El IDE consume `launcher://catalog` y las tools
  `resolve_capability`/`list_capabilities` de `@zeus/mcp-launcher`
  (`packages/mesh/mcp-launcher`, puerto 3050) para construir su
  inventario de servicios EN CALIENTE.
- Cláusula de diseño (lección del esqueleto precedente): el IDE no
  hardcodea puertos, rutas de máquina ni listas de tareas; todo lo
  descubrible se descubre.

### Fase 1 · Identidad y asiento

- El IDE hace join de room; la **autoridad** emite la peer-card
  (`@zeus/authority-kit` · `issuePeerCard`). El IDE **jamás acuña
  identidad**: la identidad durable es el `ssbId` (`@…ed25519`) que
  viaja en la card; el asiento firmado (`seatSignature`) se verifica
  con `verifyTravelingPeerCard` de
  `@zeus/protocol/peer-card-seat` — nunca con criptografía propia.
- La card es efímera/revocable (TTL); el IDE debe renovar por join,
  no cachear como si fuera identidad.

### Fase 2 · Lectura (resources)

- Superficie de lectura = resources/resource-templates MCP
  proyectados desde los `RouteEntry` GET vía `projectRoutesToMcp`
  (`packages/engine/http-contract/src/mcp-project.mjs`).

### Fase 3 · Mutación (tools con gate visible)

- Superficie de mutación = tools MCP proyectadas desde `RouteEntry`
  no-GET (U172): mismo módulo, `MUTATION_METHODS`,
  `bindProjectedHttpMutators`. Garantías que el IDE puede citar:
  - **payload saneado**: el servidor reenvía `parsed.data` (zod), no
    el body crudo — campos extra del llamador no viajan;
  - **guarda de colisión** de nombres de tool (throw en proyección);
  - **gate visible** en card y payloads de error: el IDE debe
    representar el estado del gate, no ocultarlo.

### Fase 4 · Autoría del dramaturgo (linea-editor)

- Tools gateadas de `@zeus/linea-editor` (`crear_linea`,
  `export_story_board`) con **gate único de dos caras**
  (`gate.gate_line` + `gate.reparto`), visible en `editor://info`.
- **Requisito de despliegue dramaturgo** (advertencia de seguridad
  del README de linea-editor, U175): el operador DEBE activar
  `ZEUS_LINEA_EDITOR_REQUIRE_REPARTO`. La política es del servidor
  (env fresco, no debilitable por args); con ella activa, toda
  mutación sin reparto deniega antes de escribir.
- Motivos de denegación que el IDE debe representar textualmente:
  `reparto_requerido` · `personaje_no_en_reparto` · `seat_ausente` ·
  `seat_invalido` · `rol_sin_permiso` (catálogo de
  `@zeus/reparto-kit` `evaluarPermiso`/`puede`, permiso de autoría
  `reparto:interpretar`).
- Personajes: relación **1 actor (ssbId) – N personajes** del shape
  `reparto/1`; el export de story-board emite refs-only
  (`personajes.refs[{personajeId}]`, schema U174).

### Fase 5 · Elenco y visualización

- Widget canónico: `cast-table` de `@zeus/view-kit`
  (`src/widgets.mjs`; `panel-elenco` es alias) alimentado por
  `filasCastDesdeReparto` de `@zeus/reparto-kit`. El IDE reutiliza,
  no reimplementa.

### Cláusulas transversales

1. **Honestidad de estado**: lo no desplegado se muestra `⏳`
   pendiente; el IDE nunca presenta como sincronizado lo que no lo
   está.
2. **Separación de elencos**: el elenco del dominio (reparto/1) y
   cualquier compañía de agentes propia del IDE son objetos
   distintos; el IDE no los fusiona en un mismo modelo de datos.
3. **Import de corpus**: si el IDE ofrece importación, delega en el
   tooling one-off del carril (`scripts/import-legado/`, fuentes por
   env del operador) — nunca embebe corpus ni rutas de máquina.

### Tabla de verificación (cláusula ↔ artefacto real)

| cláusula | artefacto en main |
| -------- | ----------------- |
| catálogo dinámico | `packages/mesh/mcp-launcher/src/catalog.mjs` · resources `launcher://*` |
| identidad/asiento | `packages/engine/protocol/src/peer-card.mjs` · `peer-card-seat.mjs` · `packages/engine/authority-kit` |
| lectura | `packages/engine/http-contract/src/mcp-project.mjs` (`projectRoutesToMcp`) |
| mutación saneada | ídem (`MUTATION_METHODS`, `bindProjectedHttpMutators`, envío de `parsed.data`) + `test/mcp-project-mutations.test.mjs` |
| autoría gateada | `packages/mesh/linea-editor/src/gate.mjs` · `config.mjs` (`resolveRequireReparto`) · `editor-server.mjs` (`editorInfo`) |
| permisos/motivos | `packages/engine/reparto-kit/src/permisos.mjs` · `tipos.mjs` (shape `reparto/1`) |
| personajes en board | `packages/engine/story-board-schema/schemas/story-board.schema.json` (`$defs.personajes`) |
| elenco visual | `packages/engine/view-kit/src/widgets.mjs` (`cast-table`) |
| import | `scripts/import-legado/` (CLI + validar) |

---

## Parte II · Cierre de diseño · épica U73 «Zigurat acotada (teatro de la capa 2)»

### Qué ENTRA (entregado, con gates)

- Proyección de mutaciones como tools con gate visible (U172).
- Reparto y permisos sobre identidad existente, firma verificada
  (U173).
- Personajes referenciables en story-board, retro-compatible (U174).
- Autoría gateada con política servidor-side (U175).
- Import one-off de corpus con ceguera reforzada (U176).
- Este contrato de consumo IDE opt-in (U177).

### Qué NO ENTRA (fronteras explícitas)

- **Capa federada completa L1↔L2**: fuera. El puente SSB completo
  sigue siendo punto de extensión documentado (hook D-20 / U93),
  dependiente de spikes externos.
- **Identidad nueva**: prohibida. Solo peer-card/ssbId/seat del
  protocol.
- **Implementación de extensión IDE**: ownership externo al carril;
  este contrato es su único acople.
- **Publish de linea-editor**: U178, GO propio (D-42), no forma
  parte de la épica.

### Invariantes de frontera (cláusulas no negociables)

1. L1 es permanente; L2 es sesión: el estado vivo de una room nunca
   se presenta como registro canónico del pub.
2. Honestidad de sincronía: pendiente se muestra pendiente.
3. La única identidad transfronteriza es la peer-card con ssbId y
   asiento verificable.
4. La casa techy del juego social (Tribe real, con ancla propia) y
   el rol teatral homónimo del diseño de capa 2 son objetos
   distintos: ningún modelo de datos los fusiona.
5. Nada de la sala escribe directo al pub: todo retorno a L1 pasa
   por cristalización explícita (hash + firmas + resumen).

### Puntos de extensión registrados (deuda consciente)

- Hook SSB (D-20) para el puente completo.
- `./widgets` como export público de view-kit (deuda U173).
- `format: "uri"`/`maxLength` en el puntero `reparto` del schema
  (follow-up U174).
- Enmascarado retroactivo de citas inertes en reportes previos
  (follow-up U176).

### Declaración de cierre

Con la aceptación de este WP, la épica **U73 pasa de ⬜ a
cerrada-por-diseño**: todo lo que entra está entregado y sellado por
gates; todo lo que no entra tiene frontera nombrada y punto de
extensión; el consumidor externo tiene contrato citable. El teatro
de la capa 2 queda acotado, abierto por sus junturas y cerrado en su
forma.
