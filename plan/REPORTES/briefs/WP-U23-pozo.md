# Brief — WP-U23 · pozo, el segundo juego

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U23 · pozo, el segundo juego
Rama: wp/u23-pozo
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u23-pozo
Reporte: plan/REPORTES/WP-U23-pozo.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U23-pozo.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md):
- Juego mínimo A PROPÓSITO (D-8): un pozo, un puñado de nodos, un feed,
  UN intent con ledger (p. ej. sacar una gota del pozo y etiquetarla),
  una vista sobre view-kit, un MCP de jugador sobre player-mcp-kit, y un
  CASOS.md corto en formato playbook-kit.
- Regla dura (dos juegos / PRACTICAS §1.11): se construye **solo importando
  engine/*** (hoy: `@zeus/protocol`, `@zeus/authority-kit`,
  `@zeus/player-mcp-kit`, `@zeus/playbook-kit`, `@zeus/view-kit`, más
  mesh/infra necesarios vía presets-sdk/env — room/socket). Si para hacer
  pozo hay que tocar el engine, NO se parchea desde el juego: se anota en
  §hallazgos del reporte como mejora del SDK → WP aparte.
- Debe consumir (no reinventar):
  · `@zeus/protocol` — envelope + intents con `game: 'pozo'`
  · `@zeus/authority-kit` — `startAuthority` con `game` (gate U24 ✅)
  · `@zeus/player-mcp-kit` — MCP de jugador
  · `@zeus/playbook-kit` — CASOS.md + coherencia (+ runner MCP si aplica)
  · `@zeus/view-kit` — una vista mínima
- CA:
  · `demo:pozo` levanta room+autoridad+vista+MCP
  · e2e — un cliente JSON-RPC ejecuta sus casos vía MCP
  · `gates` verde (engine sin nombres de juego)
  · cero imports de `games/delta` ni de `packages/arg`
- Demolición: n/a (nacimiento). El reporte lista lo que NO se pudo hacer
  sin tocar engine — esa lista alimenta el backlog de mejoras del SDK.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-8 (delta + pozo; regla de los dos juegos)
- plan/ARQUITECTURA.md §2 (layout objetivo `games/pozo`; U51 moverá delta)
- plan/VISION.md § regla de los dos juegos
- packages/lib/protocol, authority-kit, player-mcp-kit, playbook-kit, view-kit
- packages/arg/arg-demos (patrón de referencia de launcher/autoridad — NO
  importar; solo mirar el patrón)
- Cola hallazgos ola 2: A-05 dual-wire — NO mezclar; no bloquea U23
- PRACTICAS §1.1 (puertos vía presets-sdk/env)

Notas del orquestador:
- Lote 2c. Gate pre-U23 (U24 envelope `game`) ya ✅. U21 puede seguir 🔶
  en paralelo (otro worktree); no implementar U21 en este chat.
- Ubicación: nace en `packages/games/pozo` (layout objetivo). No tocar
  `packages/arg/*` salvo leer patrones. Workspace/scripts raíz para
  `demo:pozo` / e2e propios del juego.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para swarm/CI).
  Para e2e del CA: NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación humana
  explícita anotada en el reporte.
- Pregunta obligatoria (PRACTICAS §1.11): ¿pozo se montó solo importando
  los kits engine, sin editar `packages/lib/*`? Si no: listar hallazgos → WPs.
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
