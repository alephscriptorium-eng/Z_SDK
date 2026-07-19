# Brief — WP-U40 · RouteEntry → MCP resources

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U40 · RouteEntry → MCP resources
Rama: wp/u40-route-mcp
Worktree: .worktrees/wp-u40-route-mcp
Reporte: plan/REPORTES/WP-U40-route-mcp.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U40-route-mcp.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md) — abre Ola 4:
- Cablear `openapi-mcp-projector` dentro de `http-contract`: toda ruta REST
  declarada (RouteEntry) queda proyectada automáticamente como
  resource / resource-template MCP.
- Si al implementarlo el projector no aporta (decisión con evidencia en el
  reporte): proyección directa en http-contract y **borrar el paquete**
  `@zeus/openapi-mcp-projector`. Lo que no puede pasar: que siga huérfano.
- CA:
  · e2e — una ruta de cache-browser o firehose-browser aparece como
    resource-template MCP y responde
  · `spec:generate:all` la documenta
- Demolición (obligatoria, D-3 / PRACTICAS §1 — cero vías muertas):
  · `openapi-mcp-projector` como huérfano → cableado O borrado en este WP
  · Si se borra: limpiar workspace, scripts raíz (`test:openapi-mcp-projector`),
    lockfile y menciones en README que lo listan como canal vivo sin
    consumidor
  · Cero wrappers / re-exports de compat hacia un projector «por si acaso»

Regla de los dos juegos (PRACTICAS §1.11) — obligatoria:
- Donde el cambio toque engine (`packages/lib/*` / `@zeus/*`): delta Y
  pozo verdes donde aplique; `gates` verde.
- Este WP es engine (http-contract + proyección MCP). Cero nombres de juego
  en el kit; los consumers (cache/firehose-browser) inyectan rutas/URIs.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §1 (deuda: openapi-mcp-projector 0 consumidores),
  §3 (OpenAPI desde http-contract; proyección MCP resource desde la misma
  definición — ola 4)
- plan/DECISIONES.md D-3 (sin vías muertas / sin compat)
- packages/lib/http-contract (RouteEntry, OpenAPI, `src/mcp-resources/*`,
  `spec:generate`, exports `./mcp-resources`)
- packages/lib/openapi-mcp-projector (API actual + tests; evaluar aporte)
- packages/platform/cache-browser y/o firehose-browser (ruta REST de
  referencia para el e2e del CA)
- root: `npm run spec:generate:all` (http + asyncapi)
- PRACTICAS §1.1 (puertos vía presets-sdk/env)

Notas del orquestador:
- Ola 4. Solo U40 asignado. U41 (portal docs) dep U10+U40 — NO tomar aún.
- Decisión cablear vs borrar: evidencia en el reporte (qué aporta el
  projector, o por qué no). No dejar el paquete sin consumidores.
- http-contract ya tiene `mcp-resources` manuales (linea/firehose/solar/
  server-card): el WP une RouteEntry → proyección automática; no duplicar
  a mano lo que el projector (o la proyección directa) deba generar.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para swarm/CI).
  Para e2e del CA: NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación humana
  explícita anotada en el reporte.
- Pregunta obligatoria (PRACTICAS §1.11): ¿delta y pozo verdes donde
  aplique? ¿quedó `@zeus/openapi-mcp-projector` huérfano? (debe ser cableado
  o borrado — nunca 0 consumidores)
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
