# WP-U41 · docs-portal — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok 4.5) |
| fecha | 2026-07-17 |
| rama | `wp/u41-docs-portal` |
| commit(s) | `fd0fc8f` docs(portal) · `ae982df` docs(reportes) |
| estado propuesto | listo para revisión |
| push | no intentado |

## Qué se hizo

Se creó el portal VitePress ausente (`docs/`): navegación **engine / editor /
mesh / games**, guías de arranque con `demo:arg` / `demo:pozo`, páginas de
contrato AsyncAPI (enlace al HTML de `spec:asyncapi:html`), OpenAPI/Redoc,
proyección RouteEntry→MCP, y método playbook CASOS. Se actualizó el README
raíz (sin «MASTER de sesión» ni `e2e:deck:room` como verificación primaria),
`packages/arg/README.md` (5/5 paquetes + CASOS), y READMEs nuevos de
`http-contract`, `rooms` y `presets-sdk`. No se movió layout físico (U51).

## Archivos tocados

- creado `docs/.vitepress/config.mjs` — nav/sidebar portal
- creado `docs/index.md`, `docs/guide/*`, `docs/engine/*`, `docs/editor/`,
  `docs/mesh/`, `docs/games/*`, `docs/contracts/*`, `docs/playbook/` — contenido
- creado `docs/public/.gitkeep` — ancla de `public/` (HTML API gitignored)
- modificado `README.md` — mapa engine/editor/mesh/games + demos vivas
- modificado `packages/arg/README.md` — 5 paquetes, contrato único, CASOS
- creado `packages/lib/http-contract/README.md` — RouteEntry→MCP
- creado `packages/lib/rooms/README.md`, `packages/lib/presets-sdk/README.md`
- creado `plan/REPORTES/WP-U41-docs-portal.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### CA — `npm run docs:build` verde

```
> zeus-sdk@0.1.0 docs:build
> npm run spec:generate:all && npm run spec:redoc && npm run spec:asyncapi:html && vitepress build docs
…
AsyncAPI HTML generated: docs/public/api/protocol/
  vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 7.59s.
exit_code: 0
```

Dist incluye páginas + API:

```
docs/.vitepress/dist/{index,guide,engine,editor,mesh,games,contracts,playbook}.html…
docs/.vitepress/dist/api/{editor-ui,player-ui,cache-browser,firehose-browser,mcp-http}.html
docs/.vitepress/dist/api/protocol/index.html  # asyncapi in dist ok
```

### CA — cero menciones al protocolo muerto (portal + READMEs tocados)

```
rg "session-protocol|MASTER de sesión|sesión Scriptorium|session:state" docs/ README.md \
  packages/arg/README.md packages/lib/http-contract/README.md \
  packages/lib/rooms/README.md packages/lib/presets-sdk/README.md
# (sin coincidencias)
```

### Navegación / enlaces

VitePress `ignoreDeadLinks: false`; build exit 0 ⇒ enlaces internos del markdown
resueltos. HTML AsyncAPI/Redoc generados **antes** del build (script
`docs:build`) y copiados desde `docs/public/api/`.

### Arranque docs:dev

⏳ sin verificar en navegador (`ZEUS_OPEN_BROWSER` no seteado; default no abre).
Puerto vía `resolveSpecToolPorts().docs` (3230).

### Gates / lint / código de juego

No se tocó código ejecutable de engine/games. Gates/lint:
⏳ sin verificar (WP de docs + portal; CA no los exige).

## Demolición

No había páginas VitePress previas (portal ausente post-U10). Demolición =
sustituir el framing muerto en docs/READMEs tocados, sin dejar convivir
«sesión Scriptorium como protocolo vivo» junto al contrato único:

- README raíz: eliminados «MASTER de sesión», tabla centrada en player-ui como
  verdad, y `e2e:deck:room` como verificación primaria.
- `packages/arg/README.md`: deja de presentar «runtime Scriptorium» como marco;
  lista los 5 paquetes + playbook.

```
# portal nace limpio; grep arriba = cero refs vivas al protocolo muerto
# en docs/ y READMEs de este WP
```

No se borraron paquetes (U31 ya demolió session-protocol/domain/tablero-core).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: docs citan defaults de ejemplo
  (3230, 3021, 3025, 4131) permitidos por PRACTICAS §1.1 excepción docs;
  runtime vía presets-sdk/env en guías.
- [x] Cadenas if/switch → tabla: N/A (markdown).
- [x] Duplicación: portal enlaza generadores existentes
  (`spec:asyncapi:html`, `spec:redoc`); no se reinventó el generador.
- [x] console.log / código comentado / TODO: no.
- [x] Nombres de transición (v2/old/new): no en portal/READMEs nuevos.
- [x] Demolición: framing muerto del README raíz sustituido; sin páginas
  viejas de sesión que demoler.
- [x] Tests: N/A (pura docs); CA = `docs:build`.
- [ ] Arranque real docs:dev en navegador: ⏳ sin verificar (opt-in browser).
- [x] README/specs: READMEs tocados alineados; specs regeneradas en build
  dejaron ruido CRLF/lockfile **fuera** del commit a propósito.
- [x] Diff solo alcance WP: sí (portal + READMEs; sin BACKLOG).

## Hallazgos fuera de alcance

1. READMEs de mesh aún documentan protocolo muerto como vivo:
   `packages/app/player-3d-ui/README.md` (`session:state`, MASTER),
   `packages/platform/3d-monitor/README.md` («player-ui … como MASTER»),
   `packages/app/ping-pong-bots/README.md`.
2. `@zeus/rooms` aún exporta `makeMaster` / `setState` (API residual);
   description del package.json dice «Scriptorium rooms client».
3. Varios `packages/lib/*` publicables sin README
   (`game-engine`, `ui-kit`, `ui-3d-kit`, `app-shell`, `firehose-core`,
   `test-utils`, `room-client-browser`, `operator-bridge`).
4. `npm install` en worktree marcó specs OpenAPI/AsyncAPI como `M` por CRLF
   sin diff de contenido, y `package-lock.json` `extraneous`→`dev` en un
   nested dep — no incluidos en el commit.
5. `eslint.config.mjs` aún lista `packages/lib/session-protocol/browser/**`
   (residual post-U31; ya en hallazgos U31).

## Dudas / bloqueos

Ninguno. CA del WP cumplido localmente; push no intentado (política swarm).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
