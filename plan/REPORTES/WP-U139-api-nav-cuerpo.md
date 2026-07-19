# WP-U139 · api-nav-cuerpo — reporte

| dato | valor |
| ---- | ----- |
| agente | orquestador-implementa (GO D-30 · 1 WP micro) |
| fecha | 2026-07-19 |
| rama | `wp/u139-api-nav-cuerpo` |
| commit(s) | `19545d2` (fix) · `6813c2e`+ (reporte/CI) |
| estado propuesto | listo para revisión |

## Qué se hizo

Seguimiento de U138 ✅ (nav OK; **no reabierto**). Se sustituyeron los
links markdown `[…](/api/…)` del **cuerpo** por HTML inline
`<a href="/api/…" target="_blank" rel="noreferrer">` en las 3 superficies
ADDENDA más las 2 del residual U138 (CA **clase**). Se amplió PRACTICAS
§8 C8: CA de bug = clase (grep control), no solo la instancia reportada.

## Archivos tocados

- `docs/contracts/openapi.md` — modificado: 5 links tabla → `target="_blank"`
- `docs/contracts/asyncapi.md` — modificado: link `/api/protocol/`
- `docs/editor/index.md` — modificado: link editor-ui
- `docs/mesh/index.md` — modificado: 4 links Redoc (residual clase)
- `docs/engine/protocol.md` — modificado: link render HTML (residual clase)
- `plan/PRACTICAS.md` — modificado: C8 + cuerpo/clase + grep control
- `plan/REPORTES/WP-U139-api-nav-cuerpo.md` — creado: este reporte

## Evidencia

- Grep fuente (clase):

```
rg -n '\]\(/api/' docs --glob '*.md'
→ (0 md links)

rg -n 'href="/api/' docs --glob '*.md' | rg -v 'target='
→ (0 md href sin target)
```

- Dist audit (Python sobre `docs/.vitepress/dist/**/*.html`):

```
good_with_target=162 bad_without=0
```

- `npx vitepress build docs` (worktree) → EXIT 0 (~27.57s).

- Navegación real (Playwright MCP · preview `npx vitepress preview docs
  --port 5180`): clic en **12** links `main a[href^="/api/"]` de las 5
  páginas → popup, cero 404:

| página | href | title | 404 |
| ------ | ---- | ----- | --- |
| contracts/openapi | `/api/editor-ui.html` | Zeus Editor UI API | no |
| contracts/openapi | `/api/player-ui.html` | Zeus Player UI (Tablero ALEPH) API | no |
| contracts/openapi | `/api/cache-browser.html` | Zeus View UI (Cache Explorer) API | no |
| contracts/openapi | `/api/firehose-browser.html` | Zeus Firehose View UI API | no |
| contracts/openapi | `/api/mcp-http.html` | Zeus MCP HTTP Transport | no |
| contracts/asyncapi | `/api/protocol/` | Zeus Protocol 1 documentation | no |
| editor/ | `/api/editor-ui.html` | Zeus Editor UI API | no |
| mesh/ | `/api/player-ui.html` | Zeus Player UI (Tablero ALEPH) API | no |
| mesh/ | `/api/cache-browser.html` | Zeus View UI (Cache Explorer) API | no |
| mesh/ | `/api/firehose-browser.html` | Zeus Firehose View UI API | no |
| mesh/ | `/api/mcp-http.html` | Zeus MCP HTTP Transport | no |
| engine/protocol | `/api/protocol/` | Zeus Protocol 1 documentation | no |

```
TOTAL=12 FAIL=0
```

### Evidencia CI

> Tras push de la rama. Canónico: `gh run list --branch wp/u139-api-nav-cuerpo`.

| campo | valor |
| ----- | ----- |
| branch | `wp/u139-api-nav-cuerpo` |
| run_id | Docs `29691867603` · CI **N/A** (U104 paths-ignore `**.md`) |
| workflow | Docs (CI no disparado: solo `.md` + `plan/`) |
| conclusion | Docs `success` · CI N/A |

```
completed	success	docs(reportes): tip commit en WP-U139	Docs	wp/u139-api-nav-cuerpo	push	29691867603	1m33s
```

URL: https://github.com/alephscriptorium-eng/Z_SDK/actions/runs/29691867603

CI matriz no corre (`.github/workflows/ci.yml` paths-ignore `plan/**` +
`**.md` · U104/D-22). Diff = solo markdown + PRACTICAS — gate remoto
relevante = **Docs**.

## Demolición

Links md del cuerpo que trataban assets `/api/*.html` como rutas
VitePress in-app (sin `target`). Residual U138 cola inline → cerrado por
este WP.

```
rg -n '\]\(/api/' docs --glob '*.md' → 0
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: N/A (solo links de docs)
- [x] Cadenas if/switch que debieron ser tabla: N/A
- [x] Duplicación con otros paquetes: N/A
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa: md `[/api/]` sustituido; grep clase = 0
- [x] Tests prueban comportamiento: Playwright clic ×12 (canal de uso)
- [x] Arranque real verificado: vitepress preview :5180 + Playwright
- [x] README/specs del paquete siguen siendo verdad: N/A
- [x] El diff contiene solo el alcance del WP: 5 md + PRACTICAS + reporte
  (mesh + protocol = CA clase / residual U138, no scope creep de síntoma)
- [x] C8/C9: C8 ampliado (cuerpo + clase); verificación = navegación;
      C9 N/A

## Hallazgos fuera de alcance

Ninguno nuevo. Cola residual U138 (inline cuerpo) cerrada por este WP.

## Dudas / bloqueos

Ninguno.

## Pedido al orquestador

Revisar y ✅ / merge cuando Actions de la rama esté verde. **NO merge**
desde este chat worker.

---

## Revisión del orquestador

**Aceptado ✅** — 2026-07-19 · orquestador (REVISION + PRACTICAS §8 C8 clase · Actions U135).

Verificado:
- Diff `main...bc0b2ac` acotado: 5 `.md` cuerpo + `PRACTICAS` C8 + reporte (7 files). Sin BACKLOG.
- CA clase grep: `](/api/` = 0; `href="/api/` sin `target` = 0; 12 `<a … target="_blank">` en docs md. Nav U138 intacto (`config.mjs` `target: '_blank'` ×6).
- Superficies ADDENDA + residual U138 (mesh + protocol) cubiertas.
- C8: Playwright 12/12 en reporte (preview :5180) — confiado; no re-smoke.
- Actions rama: Docs `29691867603` success (head `6813c2e`; tip `bc0b2ac` = evidencia reporte). CI **N/A** U104 (`**.md` / `plan/**`).

Merge: inmediato a `main` (cierra residual U138 cola). Post-merge: Docs en `main` + `git worktree remove`.
