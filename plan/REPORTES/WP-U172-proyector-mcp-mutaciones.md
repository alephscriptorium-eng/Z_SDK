# Reporte — WP-U172 · Proyectar mutaciones HTTP como herramientas MCP

- Rama: `wp/u172-proyector-mcp-mutaciones`
- Worktree: `C:\S_LAB\.worktrees\z\wp-u172-proyector-mcp-mutaciones`
- Base: `origin/main` = `f35c6b5`
- Eje: I · Ola A (∥ U173)

## Qué se hizo

Se **extendió** el proyector RouteEntry→MCP existente de `@zeus/http-contract`
(módulo `src/mcp-project.mjs`) — **cero proyector paralelo nuevo** (DRY). Antes
sólo GET → resource / resource-template; ahora las mutaciones (POST/PUT/PATCH/
DELETE) se proyectan como **tools** MCP en el mismo `projectRoutesToMcp`, y hay
un binding fetch-only `bindProjectedHttpMutators` que aplica, por llamada:

1. **gate** inyectado por el consumidor (D-8) → rechazo si ausente o denegado;
2. **validación de envelope** con zod (mismos schemas del `RouteEntry` que usa
   el middleware Express) → `VALIDATION_ERROR` sin tocar red;
3. **mutación HTTP** (verbo real + body JSON), con la **card del gate** visible
   en `res.gate` tanto en éxito como en error (patrón `linea-editor`).

## Ficheros tocados

| fichero | cambio |
| ------- | ------ |
| `packages/engine/http-contract/src/mcp-project.mjs` | typedef `ProjectedMcpTool`; `MUTATION_METHODS`; `projectRouteToMcpTool`; `projectRoutesToMcp` devuelve `tools`; nuevo `bindProjectedHttpMutators`; `renderRouteMcpCatalog` lista filas `tool` |
| `packages/engine/http-contract/src/index.mjs` | exporta `projectRouteToMcpTool`, `MUTATION_METHODS`, `bindProjectedHttpMutators` |
| `packages/engine/http-contract/types/index.d.ts` | tipos `ProjectedMcpTool`, `xMcpTool` en `RouteEntry`, firmas nuevas |
| `packages/engine/http-contract/README.md` | sección «Mutaciones → MCP tools (WP-U172)» |
| `packages/engine/http-contract/test/mcp-project-mutations.test.mjs` | **nuevo** — probes verde/rojo |

ALCANCE_DIFF respetado: sólo `packages/engine/http-contract/**` + este reporte.
Sin paquete nuevo, sin `linea-editor`, sin `story-board-schema`, sin manifests
de publish, sin UI, sin `.changeset/`, sin `plan/BACKLOG.md`, sin
`plan/DECISIONES.md`.

## CA por CA (evidencia literal)

### CA1 · Tools MCP proyectadas desde RouteEntry de mutación; readers GET intactos

`projectRoutesToMcp` ahora devuelve `{ resources, templates, tools }`. GET
inalterado; POST/PUT/PATCH/DELETE → `tools[]` con `bodySchema`/`paramsSchema`.

Suite previa de GET (`test/mcp-project.test.mjs`) — sin regresión:

```text
ok 1 - projectRoutesToMcp maps GET to resources and templates; skips POST
ok 2 - resolveRouteMcpUri prefers xMcpResource over derived rest:// URI
ok 3 - fillExpressPath substitutes path params
ok 4 - bindProjectedHttpReaders GETs baseUrl + filled path
ok 5 - renderRouteMcpCatalog lists resource-template rows
# tests 5
# pass 5
# fail 0
```

### CA2 · Validación + gate visibles y probados (verde/rojo automatizados)

`test/mcp-project-mutations.test.mjs`:

```text
ok 1 - projectRoutesToMcp projects mutations as tools; GET readers intact
ok 2 - projectRouteToMcpTool honours xMcpTool override
ok 3 - MUTATION_METHODS is the non-GET write set
ok 4 - GREEN: gated + valid envelope → mutation performed, gate card approved
ok 5 - GREEN: PUT tool fills :param path and mutates
ok 6 - RED: no gate wired → refused, network never hit
ok 7 - RED: gate denies → refused, gate card visible, network never hit
ok 8 - RED: gate ok but invalid body envelope → VALIDATION_ERROR, network never hit
ok 9 - RED: gate ok but invalid params envelope → VALIDATION_ERROR
ok 10 - GET readers still bind alongside mutation tools (no regression)
ok 11 - renderRouteMcpCatalog lists tool rows for mutations
# tests 11
# pass 11
# fail 0
```

- **Verde:** mutación válida + gate aprueba → POST/PUT ejecutado (probes 4–5).
- **Rojo (sin gate):** gate no cableado → `http-contract.gate_missing`, red no
  tocada (probe 6).
- **Rojo (gate deniega):** card visible `res.gate.approved=false` (probe 7).
- **Rojo (envelope inválido):** gate ok pero body/params fallan zod →
  `VALIDATION_ERROR`, red no tocada (probes 8–9).

### CA3 · Sin nombres de juego concretos (D-8); consumidor inyecta wire/gate

El gate es un parámetro `options.gate` (función inyectada por el consumidor);
el envelope viene del `RouteEntry` del consumidor. El engine no nombra juego,
wire ni gate concreto. Vocabulario de dominio (reparto/línea/acto) neutral.

Vocab vetado (`novelist|novela`) en src/test/README/types = **0**:

```text
0
```

### CA4 · Cero publish / flip private / changesets

`git status --porcelain` — sólo ficheros de http-contract + reporte; sin
`.changeset/`, sin manifests de publish, sin `private` tocado:

```text
 M packages/engine/http-contract/README.md
 M packages/engine/http-contract/src/index.mjs
 M packages/engine/http-contract/src/mcp-project.mjs
 M packages/engine/http-contract/types/index.d.ts
?? packages/engine/http-contract/test/mcp-project-mutations.test.mjs
 (+ plan/REPORTES/WP-U172-proyector-mcp-mutaciones.md)
```

## Suite completa del paquete (verde partida + después)

Antes (verde de partida): `# tests 20 / # pass 20 / # fail 0`.
Después (con tests nuevos):

```text
1..31
# tests 31
# suites 0
# pass 31
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 8473.7725
```

## Decisiones de diseño

1. **Mutación = no-GET** (`MUTATION_METHODS` = POST/PUT/PATCH/DELETE): complemento
   simétrico y DRY del `if (method !== 'GET') continue` que ya existía; el brief
   nombra POST/PUT y el conjunto los cubre sin ramas paralelas.
2. **Gate inyectado, no cableado** (D-8): `bindProjectedHttpMutators` recibe
   `options.gate`; sin gate la mutación se rechaza por defecto (fail-closed). La
   card del gate viaja en `res.gate` en éxito y error (patrón `linea-editor`:
   gate en card/errores) sin importar `linea-editor` (paquete de U175).
3. **Envelope con el schema del RouteEntry**: se reusa `request.body`/
   `request.params` (los mismos que valida el middleware Express), no un schema
   nuevo; orden gate→validación→fetch para que el rechazo nunca toque red.

## Pendientes / limitaciones honestas

- El worktree no traía `node_modules` (monorepo con hoisting al root); para
  correr la suite se creó un **junction local** `node_modules → C:\S_LAB\z-sdk\
  node_modules` (infra de test, fuera del diff, no versionado). No altera fuentes.
- Contrarrevisión independiente PASS: **\<pendiente\>** — la ejecuta el
  orquestador/rol de revisión antes del merge (no es tarea del worker).
- `bindProjectedHttpMutators` es fetch-only y neutral: el registro real como
  tools MCP (SDK server) lo hace el consumidor, igual que `bindProjectedHttpReaders`.

## Corrección tras contrarrevisión

Devolución de contrarrevisión independiente (misma rama
`wp/u172-proyector-mcp-mutaciones`, mismo worktree). Tres observaciones,
resueltas:

### OBS-1 (BLOQUEANTE) · envelope validado pero no saneado — RESUELTO

Antes, `call()` validaba `bodySchema.safeParse(body)` pero enviaba el `body`
CRUDO en `JSON.stringify`. Con schemas zod no-strict (modo strip por defecto)
la validación pasa y, al reenviar el crudo, los campos desconocidos llegaban al
endpoint. **Fix:** el fetch usa ahora el payload **parseado** (`parsed.data`)
tanto para `body` como para `params` (variables `sendBody` / `sendParams`) —
disciplina a nivel de proyector, sin depender de que el consumidor recuerde
`.strict()`. Test adversarial nuevo (probe 12): body con `evilExtra` sobre
schema no-strict → el body recibido por el endpoint es exactamente
`{ nombre, acto }`, sin `evilExtra`.

```text
ok 12 - RED (OBS-1): non-strict schema + extra field → sanitised body reaches endpoint
```

**Observación para WP futuro (fuera de alcance de U172):** `middleware.mjs:33-35`
comparte el mismo patrón (valida `req.body` pero no reasigna el body saneado);
es superficie preexistente del middleware Express, no tocada en este WP. Se deja
anotada como candidata a saneo en un WP futuro.

### OBS-2 (menor) · sin guarda de colisión de nombres de tool — RESUELTO

`projectRoutesToMcp` ahora lleva un `Set` de nombres de tool y lanza
`Error('duplicate MCP tool name: <name> ...')` si dos RouteEntry de mutación
colisionan en `id`/`xMcpTool`. La superficie de resources GET no se toca. Test
nuevo (probe 13):

```text
ok 13 - OBS-2: duplicate tool name (colliding xMcpTool) throws in projection
```

### OBS-3 (menor) · PATCH/DELETE sin probe round-trip — RESUELTO

Probes round-trip automatizados nuevos para PATCH y DELETE (gate→validate→fetch),
más un rojo de params inválidos en DELETE (probes 14–16):

```text
ok 14 - GREEN (OBS-3): PATCH round-trip gate→validate→fetch
ok 15 - GREEN (OBS-3): DELETE round-trip gate→validate→fetch
ok 16 - RED (OBS-3): DELETE with invalid params → VALIDATION_ERROR, network never hit
```

### Suite completa del paquete tras la corrección

```text
1..36
# tests 36
# suites 0
# pass 36
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 7117.3835
```

Fichero de mutaciones (16 tests, todos verde):

```text
ok 1 - projectRoutesToMcp projects mutations as tools; GET readers intact
ok 2 - projectRouteToMcpTool honours xMcpTool override
ok 3 - MUTATION_METHODS is the non-GET write set
ok 4 - GREEN: gated + valid envelope → mutation performed, gate card approved
ok 5 - GREEN: PUT tool fills :param path and mutates
ok 6 - RED: no gate wired → refused, network never hit
ok 7 - RED: gate denies → refused, gate card visible, network never hit
ok 8 - RED: gate ok but invalid body envelope → VALIDATION_ERROR, network never hit
ok 9 - RED: gate ok but invalid params envelope → VALIDATION_ERROR
ok 10 - GET readers still bind alongside mutation tools (no regression)
ok 11 - renderRouteMcpCatalog lists tool rows for mutations
ok 12 - RED (OBS-1): non-strict schema + extra field → sanitised body reaches endpoint
ok 13 - OBS-2: duplicate tool name (colliding xMcpTool) throws in projection
ok 14 - GREEN (OBS-3): PATCH round-trip gate→validate→fetch
ok 15 - GREEN (OBS-3): DELETE round-trip gate→validate→fetch
ok 16 - RED (OBS-3): DELETE with invalid params → VALIDATION_ERROR, network never hit
# tests 16
# pass 16
# fail 0
```
