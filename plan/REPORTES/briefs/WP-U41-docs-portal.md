# Brief — WP-U41 · Portal de docs refundado

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U41 · Portal de docs refundado
Rama: wp/u41-docs-portal
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u41-docs-portal
Reporte: plan/REPORTES/WP-U41-docs-portal.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U41-docs-portal.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/arg/spec/BACKLOG.md (features delta; otro backlog).

Política de publicación (swarm, dura):
- NO git push.
- NO gh pr / gh pr create.
- NO configurar ni usar remotes de publicación (origen Z_SDK u otros).
  El trabajo queda local en la rama/worktree; el orquestador/usuario
  publican fuera del agente.

WP completo (de plan/BACKLOG.md) — cierra Ola 4:
- Portal VitePress refundado: refleja la realidad del monorepo
  (engine / editor / mesh / games), no el mapa viejo de «sesión Scriptorium».
- Contrato único (AsyncAPI desde `@zeus/protocol`), rutas REST
  (OpenAPI/Redoc desde http-contract), resources MCP (proyección U40),
  y el método playbook (`@zeus/playbook-kit` / CASOS).
- README raíz y README de cada paquete publicable al día (hoy el README
  raíz aún habla de MASTER de sesión; `packages/arg` y otros pueden
  estar desfasados — alinear con la realidad post-U10…U40).
- CA:
  · `npm run docs:build` verde
  · navegación sin enlaces rotos
  · cero menciones al protocolo muerto (sesión Scriptorium /
    session-protocol / session:state como verdad viva)
- Demolición (obligatoria, D-3 / PRACTICAS §1 — cero vías muertas):
  · páginas/specs del portal (o residuales en docs/) que documenten la
    sesión Scriptorium como protocolo vivo
  · no dejar convivir docs del protocolo muerto con el contrato único;
    git es la historia
  · Nota U10: el portal VitePress estaba ausente; `docs/` puede nacer
    en este WP. HTML AsyncAPI bajo `docs/public/api/` (gitignored) ya
    cumple render vía `spec:asyncapi:html` — el portal debe enlazarlo /
    embeberlo, no reinventar el generador

Alcance de contenido (mínimo verificable):
- Navegación / secciones que reflejen layout objetivo
  (engine · editor · mesh · games) aunque el move físico sea U51
- AsyncAPI del contrato único (generado; visible en el portal)
- OpenAPI / Redoc de rutas REST
- Resources MCP (cómo se proyectan desde RouteEntry / http-contract)
- Método playbook (CASOS, coherencia, acta / runner)
- Guías de arranque alineadas con demos vivas (`demo:arg`, `demo:pozo`,
  etc.) — sin presentar player-ui como MASTER de room

Regla de los dos juegos (PRACTICAS §1.11) — donde aplique:
- Docs de engine no nombran conceptos exclusivos de un juego como si
  fueran del kit; los ejemplos de juego viven bajo games / demos.
- `gates` verde si se toca código; este WP es sobre todo docs + portal.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/ARQUITECTURA.md §2 (layout objetivo engine/editor/mesh/games),
  §3 (contrato único; AsyncAPI; OpenAPI; proyección MCP)
- plan/DECISIONES.md D-3 (sin vías muertas), D-8 (dos juegos)
- plan/BACKLOG.md cola U10: «portal VitePress ausente → WP-U41»
- plan/REPORTES/WP-U10-protocol.md (AsyncAPI + render)
- plan/REPORTES/WP-U40-route-mcp.md (RouteEntry → MCP resources)
- root: `npm run docs:dev` / `docs:build` / `spec:generate:all` /
  `spec:redoc` / `spec:asyncapi:html` (package.json + scripts/)
- scripts/docs-dev.mjs (puerto vía presets-sdk/env)
- README.md raíz (desfasado: «MASTER de sesión», e2e:deck:room…)
- packages/arg/README.md y READMEs de paquetes publicables `@zeus/*`

Notas del orquestador:
- Ola 4. Deps U10 + U40 ✅. Este WP cierra la ola.
- U51 (layout físico) NO está en alcance: documentar el mapa objetivo /
  realidad conceptual; no mover carpetas.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir (default headless para
  swarm/CI). Para `docs:dev` / verificación humana: setear solo si hace
  falta y anotarlo en el reporte.
- Pregunta obligatoria (PRACTICAS §1.11 / CA): ¿`docs:build` verde?
  ¿cero menciones al protocolo muerto en el portal y READMEs tocados?
  ¿queda alguna página/spec de sesión Scriptorium sin demoler?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
