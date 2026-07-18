# WP-U106 · docs-custom-domain — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok 4.5) |
| fecha | 2026-07-18 |
| rama | `wp/u106-docs-custom-domain` |
| commit(s) | `1704ce1` refactor(docs)! · `40a87db`/`e82c086`/`7241813` docs(reportes) |
| estado propuesto | listo para revisión |
| push | no intentado |

## Qué se hizo

Se cambió `resolveDocsBase()` en `docs/.vitepress/config.mjs` para que el
`base` de VitePress sea siempre `/` (también bajo `GITHUB_ACTIONS`). Se
demolió el hardwire `return '/Z_SDK/'` que aplicaba en Actions (path de
proyecto Pages). Se actualizó el comentario en `.github/workflows/docs.yml`.
No había links absolutos `/Z_SDK/…` en `docs/` que corregir. No se tocó DNS
ni Settings → Pages (ops usuario). No se añadió `CNAME` en repo: GitHub lo
inyecta en el artefacto tras Custom domain en Settings.

## Archivos tocados

- modificado `docs/.vitepress/config.mjs` — `resolveDocsBase()` → `/` (Actions incluido)
- modificado `.github/workflows/docs.yml` — comentario base `/` (WP-U106)
- creado `plan/REPORTES/WP-U106-docs-custom-domain.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### CA código — `docs:build` con base `/` (simula Actions)

```
$ GITHUB_ACTIONS=true npm run docs:build
…
  vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 13.87s.
exit_code: 0
```

```
$ GITHUB_ACTIONS=true node --input-type=module -e "
process.env.GITHUB_ACTIONS = 'true';
const mod = await import('./docs/.vitepress/config.mjs');
console.log('base=', mod.default.base);
"
base= /
```

### CA — nav + API HTML intactos (dist)

```
href="/"
href="/guide/getting-started"
href="/contracts/asyncapi"
href="/playbook/"
href="/api/protocol/"
href="/api/editor-ui.html"
…
ZERO_Z_SDK_IN_DIST
OK api/protocol/index.html
OK api/editor-ui.html
OK api/player-ui.html
OK api/cache-browser.html
OK api/firehose-browser.html
OK api/mcp-http.html
```

`__VP_SITE_DATA__.base` en dist = `"/"`.

### CA remoto URL viva

```
https://z-sdk.escrivivir.co/ → ⏳ sin verificar
(motivo: tick ops usuario — DNS + Custom domain + Enforce HTTPS;
 este worker no configura DNS ni Settings de Pages)
```

URL vieja `https://alephscriptorium-eng.github.io/Z_SDK/` redirect =
⏳ sin verificar (post-tick GitHub).

### Lint

```
$ npm run lint
✖ 12 problems (0 errors, 12 warnings)
exit_code: 0
```

(warnings preexistentes; ninguno en archivos de este WP)

## Checklist ops usuario (tick; NO CA código)

Tras merge a `main` y deploy Pages:

1. **DNS** en zona `escrivivir.co`:
   - tipo: `CNAME`
   - host / nombre: `z-sdk`
   - valor / target: `alephscriptorium-eng.github.io`
2. **GitHub** → repo `alephscriptorium-eng/Z_SDK` → Settings → Pages →
   **Custom domain** = `z-sdk.escrivivir.co` (guardar).
3. Esperar propagación DNS (GitHub muestra check DNS OK).
4. Activar **Enforce HTTPS**.
5. Verificar:
   - `https://z-sdk.escrivivir.co/` → 200 + portada Zeus SDK
   - HTTPS forzado (http→https)
   - nav Guía / Contratos / API HTML responden
   - (opcional) `https://alephscriptorium-eng.github.io/Z_SDK/` redirige

GitHub mantiene el `CNAME` del artefacto de deploy tras el paso 2; no hace
falta commit de `docs/public/CNAME` en este WP.

## Demolición

Símbolo demolido: `base` hardwired `/Z_SDK/` en Actions
(`if (GITHUB_ACTIONS) return '/Z_SDK/'` y fallback MSYS a `/Z_SDK/`).

```
$ rg -n --no-ignore '/Z_SDK/' docs/.vitepress/ .github/workflows/docs.yml
ZERO_MATCHES_OK
```

```
$ rg -n '/Z_SDK/' docs/.vitepress/dist || echo ZERO_Z_SDK_IN_DIST
ZERO_Z_SDK_IN_DIST
```

(Referencias a `/Z_SDK/` en `plan/` e históricos de reportes U103 quedan
como historia; no son código vivo del portal.)

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: `base: '/'` es path raíz del
      sitio docs (requerido por custom domain D-22); no hay puertos ni rooms.
      Hostname `z-sdk.escrivivir.co` solo en este reporte (ops), no en código.
- [x] Cadenas if/switch que debieron ser tabla: n/a (`resolveDocsBase` sigue
      siendo override env → `/`).
- [x] Duplicación con otros paquetes: n/a (solo VitePress config).
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no (`legacy`/`v2`/etc. ausentes).
- [x] Demolición completa (grep arriba): sí en código portal + workflow.
- [x] Tests prueban comportamiento: build + inspección dist (hrefs `/…`,
      API HTML presentes); WP de docs/infra sin unit nuevo.
- [x] Arranque real verificado: build VitePress + dist leído; URL viva
      remota = ⏳ (ops).
- [x] README/specs del paquete siguen siendo verdad: README no citaba
      `github.io/Z_SDK/` como URL canónica; specs regenerados por
      `docs:build` se descartaron (churn CRLF fuera de alcance).
- [x] El diff contiene solo el alcance del WP: `config.mjs` + comentario
      `docs.yml` + este reporte.

## Hallazgos fuera de alcance

1. `docs:build` regenera specs OpenAPI/AsyncAPI con churn CRLF en Windows
   (cola higiene / U95) — restaurados, no commitados.
2. Mentiones históricas `base: /Z_SDK/` en reportes U103 / DECISIONES D-22
   addendum describen el estado pre-U106; no se reescribieron.

## Dudas / bloqueos

Ninguno de código. CA remoto completo depende del checklist ops usuario
arriba (orquestador / custodio).

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** (código; CA remoto ⏳ tick usuario)

**Fecha:** 2026-07-18 · orquestador (Cursor Grok 4.5)

### Qué se verificó

- Diff `main...wp/u106-docs-custom-domain`: 3 archivos — `docs/.vitepress/config.mjs`,
  comentario `.github/workflows/docs.yml`, este reporte. Sin BACKLOG. Alcance OK.
- `resolveDocsBase()`: demolido `GITHUB_ACTIONS → '/Z_SDK/'` y fallback MSYS a
  `/Z_SDK/`; bajo Actions `base= /`.
- Re-CA local: `GITHUB_ACTIONS=true npm run docs:build` exit 0; dist sin
  `/Z_SDK/`; nav `href="/…"`; API HTML presentes (`protocol`, `editor-ui`,
  `player-ui`, `cache-browser`, `firehose-browser`, `mcp-http`).
- Demolición: `rg '/Z_SDK/'` en `docs/.vitepress/` + `docs.yml` → cero.
- Checklist ops (DNS CNAME `z-sdk` → `alephscriptorium-eng.github.io` + Custom
  domain + Enforce HTTPS) documentado; CA remoto `https://z-sdk.escrivivir.co/`
  ⏳ OK según brief (no fingir verde).
- PRACTICAS §1–3 / §6: commits convencionales; auto-revisión honesta; sin
  monkey-code / legacy / fuera de alcance.

### Merge (cuando usuario autorice)

1. Merge `wp/u106-docs-custom-domain` → `main` (después o en paralelo con U60/U105
   del lote; sin dependencia de código entre ellos).
2. Tras deploy Pages: tick ops del checklist §reporte (DNS + Custom domain +
   HTTPS) y verificar URL viva.
3. `git worktree remove` `.worktrees/wp-u106-docs-custom-domain`.

**Nota:** ✅ BACKLOG / merge / push = fuera de este chat (instrucción
revisión). Código autorizado a merge cuando el usuario lo pida.
