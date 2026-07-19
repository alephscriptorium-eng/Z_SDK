# WP-U138 · api-nav-spa — reporte

| dato | valor |
| ---- | ----- |
| agente | orquestador-implementa (GO D-29 · 1 WP micro) |
| fecha | 2026-07-19 |
| rama | `wp/u138-api-nav-spa` |
| commit(s) | _(tras commit)_ |
| estado propuesto | listo para revisión |

## Qué se hizo

Se añadió `target: '_blank'` + `rel: 'noopener noreferrer'` a los 6 items
del menú «API HTML» en `docs/.vitepress/config.mjs`, para que el router SPA
de VitePress no intercepte assets estáticos bajo `docs/public/api/` con
`cleanUrls: true`. Se amplió PRACTICAS §8 C8 con la lección: nav a asset
estático se verifica navegándolo, no solo con `curl`. Library confirmada
sin `/api/` en nav → sin cambios.

## Archivos tocados

- `docs/.vitepress/config.mjs` — modificado: 6 nav items API → externos al router
- `plan/PRACTICAS.md` — modificado: C8 + párrafo nav/SPA vs assets
- `plan/REPORTES/WP-U138-api-nav-spa.md` — creado: este reporte

## Evidencia

- Library N/A:

```
rg -n "/api/" Z_SDK-games-library/docs/.vitepress/config.mjs
→ (sin matches) library: no /api/ in vitepress config (N/A)
```

- `npm run docs:build` (worktree) → EXIT 0 (spec:generate + redoc +
  asyncapi html + vitepress build).

- HTML generado (`docs/.vitepress/dist/index.html`): los 6 `<a>` del flyout
  API HTML llevan `target="_blank" rel="noopener noreferrer"` y clase
  `vp-external-link-icon`.

- Navegación real (Playwright · preview `npx vitepress preview docs
  --port 5179`): clic en los 6 items → popup, cero 404:

| item | url abierta | title | 404 |
| ---- | ----------- | ----- | --- |
| AsyncAPI (protocol) | `/api/protocol/` | Zeus Protocol 1 documentation | no |
| OpenAPI · Editor UI | `/api/editor-ui.html` | Zeus Editor UI API | no |
| OpenAPI · Player UI | `/api/player-ui.html` | Zeus Player UI (Tablero ALEPH) API | no |
| OpenAPI · Cache Browser | `/api/cache-browser.html` | Zeus View UI (Cache Explorer) API | no |
| OpenAPI · Firehose Browser | `/api/firehose-browser.html` | Zeus Firehose View UI API | no |
| OpenAPI · MCP HTTP | `/api/mcp-http.html` | Zeus MCP HTTP Transport | no |

### Evidencia CI

> Tras push de la rama.

| campo | valor |
| ----- | ----- |
| branch | `wp/u138-api-nav-spa` |
| run_id | _(rellenar post-push)_ |
| workflow | Docs (+ CI si aplica) |
| conclusion | _(post-push)_ |

```
(pegar gh run list --branch wp/u138-api-nav-spa)
```

## Demolición

Nav que trataba Redoc/OpenAPI estáticos como páginas VitePress (sin
`target`/`rel` externos). `cleanUrls` se mantiene.

```
rg -n "API HTML|api/editor-ui" docs/.vitepress/config.mjs
→ 6 items con target: '_blank'
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: N/A (solo links de docs)
- [x] Cadenas if/switch que debieron ser tabla: N/A
- [x] Duplicación con otros paquetes: library sin `/api/` — no duplicar
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa: nav sin target demolida vía reemplazo
- [x] Tests prueban comportamiento: Playwright clic ×6 (canal de uso)
- [x] Arranque real verificado: vitepress preview :5179 + Playwright
- [x] README/specs del paquete siguen siendo verdad: N/A
- [x] El diff contiene solo el alcance del WP: config + PRACTICAS + reporte
- [x] C8/C9: C8 ampliado; verificación = navegación SPA (no solo curl);
      C9 N/A

## Hallazgos fuera de alcance

- Enlaces **inline** en md (`contracts/openapi.md`, `editor/index.md`,
  etc.) a `/api/*.html` siguen sin `target="_blank"` — mismo patrón SPA
  posible al clic in-app. Candidato micro residual si se reproduce.

## Dudas / bloqueos

Ninguno.

## Pedido al orquestador

Revisar y ✅ / merge cuando Actions de la rama esté verde.
