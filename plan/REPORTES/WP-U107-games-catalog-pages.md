# WP-U107 · games-catalog-pages — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok 4.5) |
| fecha | 2026-07-18 |
| rama | `wp/u107-games-catalog-pages` (zeus) · library `wp/u107-games-catalog-pages` → `main` |
| commit(s) | zeus: `b59eb33` docs(plan) · library: `dfd6f06` feat(docs) |
| estado propuesto | listo para revisión |
| push zeus | no intentado |
| push library | sí (`origin/wp/u107-games-catalog-pages` + `origin/main` `dfd6f06`) |

## Qué se hizo

Se montó el catálogo público en `Z_SDK-games-library` con la misma técnica
que U103/U106: VitePress + workflow Pages (`concurrency` +
`paths: ['docs/**']`) + piel zine (CSS copiado del monorepo). Portada con
un card por juego (delta, pozo, futuros), páginas de juego con arranque y
enlaces a spec en GitHub, sección **Releases** con estado real
(startpack-delta/pozo v0.1.0 publicados; sketch y futuros → ⏳ sin
releases). `base` VitePress = `/` (custom domain
`games.z-sdk.escrivivir.co`). En el monorepo solo un puntero en
`docs/games/index.md`. No se tocó DNS ni Settings → Pages (ops usuario).

## Archivos tocados

### Library (`Z_SDK-games-library`)

- creado `.github/workflows/docs.yml` — build + deploy Pages (paths `docs/**`)
- creado `docs/.vitepress/config.mjs` — catálogo + `resolveDocsBase()` → `/`
- creado `docs/.vitepress/theme/{index.js,custom.css}` — piel zine A-12
- creado `docs/index.md` — portada-catálogo (3 cards)
- creado `docs/releases.md` — releases reales / ⏳ honestos
- creado `docs/games/{delta,pozo,futuros}.md` — cards extendidos + specs
- modificado `package.json` / `package-lock.json` — `vitepress` + `docs:*`
- modificado `README.md` — puntero catálogo / dominio objetivo

### Monorepo (`Z_SDK` / worktree U107)

- modificado `docs/games/index.md` — puntero al catálogo / dominio
- creado `plan/REPORTES/WP-U107-games-catalog-pages.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### CA — un card por juego migrado

Portada `docs/index.md` features → delta / pozo / futuros. Dist:

```
docs/.vitepress/dist/index.html
docs/.vitepress/dist/games/delta.html
docs/.vitepress/dist/games/pozo.html
docs/.vitepress/dist/games/futuros.html
href="/games/delta"
href="/games/pozo"
href="/games/futuros"
href="/releases"
href="/startpacks"
```

### CA — sección releases refleja estado real

Consultado `gh release list` (2026-07-18):

```
@zeus/startpack-pozo@0.1.0   startpack-pozo-v0.1.0
@zeus/startpack-delta@0.1.0  startpack-delta-v0.1.0
# (sin startpack-sketch / sin SOLVE)
```

En `docs/releases.md` / dist: delta+pozo con tag, acta, tarball e
`npm install @zeus/startpack-<game>`; sketch y futuros → **⏳ sin releases**.

### CA — `npm run docs:build` verde · base `/`

```
$ npm run docs:build
  vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 14.48s.
exit_code: 0
```

```
$ GITHUB_ACTIONS=true node --input-type=module -e "
process.env.GITHUB_ACTIONS='true';
const mod = await import('./docs/.vitepress/config.mjs');
console.log('base=', mod.default.base);
"
base= /
```

### CA — workflow solo `docs/**` + concurrency + piel zine

```
$ rg -n "paths:|docs/\*\*|concurrency:" .github/workflows/docs.yml
13:      - 'docs/**'
16:      - 'docs/**'
19:concurrency:
```

Tokens en CSS compilado: `Courier New`, `repeating-linear-gradient`,
`@media print` → `ZINE_TOKENS_OK`.

### CA remoto URL viva HTTPS

```
https://games.z-sdk.escrivivir.co/ → ⏳ sin verificar
(motivo: tick ops usuario — DNS + Custom domain;
 cname en API Pages = null al cierre del WP)
```

Interim (project Pages, sin custom domain aún):

```
$ curl -sI https://alephscriptorium-eng.github.io/Z_SDK-games-library/
HTTP/1.1 200 OK
… Zeus Games / delta / pozo / futuros en HTML …
```

Nota: `base: '/'` (patrón U106) hace que en la URL `github.io/Z_SDK-games-library/`
los `href="/…"` apunten a la raíz del host — correcto solo tras Custom
domain `games.z-sdk.escrivivir.co`. No se marca CA remoto verde.

### Push library + workflow deploy

```
$ git push origin wp/u107-games-catalog-pages
$ git push origin main   # dfd6f06

$ gh run watch 29641365604
✓ main Docs · 29641365604
✓ docs:build in 27s
✓ deploy Pages in 9s
```

Pages API: `build_type: workflow`, `https_enforced: true`, `cname: null`
(Custom domain pendiente ops).

### Lint monorepo

⏳ sin verificar (WP docs/library; CA no exige lint de paquetes; monorepo
solo puntero markdown).

## Checklist ops usuario (tick; NO CA código)

Tras deploy Pages en `Z_SDK-games-library`:

1. **DNS** en zona `escrivivir.co`:
   - tipo: `CNAME`
   - host / nombre: `games.z-sdk`
   - valor / target: `alephscriptorium-eng.github.io`
2. **GitHub** → repo `alephscriptorium-eng/Z_SDK-games-library` →
   Settings → Pages:
   - Fuente: **GitHub Actions** (si aún no)
   - **Custom domain** = `games.z-sdk.escrivivir.co` (guardar)
3. Esperar propagación DNS (GitHub muestra check DNS OK).
4. Activar **Enforce HTTPS**.
5. Verificar:
   - `https://games.z-sdk.escrivivir.co/` → 200 + portada catálogo
   - cards delta / pozo / futuros
   - `/releases` con startpacks reales / ⏳
   - HTTPS forzado

GitHub mantiene el `CNAME` del artefacto tras el paso 2; no hace falta
commit de `docs/public/CNAME` en este WP.

## Demolición

n/a (catálogo nuevo; no había portal previo en la library).

```
# sin demolición — grep N/A
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: `base: '/'` requerido por
      custom domain D-23; hostname `games.z-sdk.escrivivir.co` solo en
      README/docs/reporte (ops), no en resolvers de runtime. Specs enlazan
      a GitHub blob (docs).
- [x] Cadenas if/switch → tabla: n/a (markdown/yaml/CSS).
- [x] Duplicación: piel zine copiada del monorepo (mismo patrón U103;
      no hay paquete compartido de theme docs entre repos hermanos —
      hallazgo menor).
- [x] console.log / código comentado / TODO: no.
- [x] Nombres de transición (v2/old/new): no.
- [x] Demolición: n/a.
- [x] Tests: CA = `docs:build` + inspección dist + releases reales; WP de
      docs/infra sin unit nuevo.
- [ ] Arranque `docs:dev` en navegador: ⏳ (`ZEUS_OPEN_BROWSER` no seteado).
- [x] README/specs: README library actualizado; specs de juego no tocados
      (enlaces a blob).
- [x] Diff solo alcance WP: sí. No se commitaron
      `packages/solve-coagula/` ni `startpack-solve-coagula/` (U87 en el
      mismo clone; dejados untracked).

## Hallazgos fuera de alcance

1. **Colisión de worktree library con U87**: el clone único
   `../Z_SDK-games-library` fue checkouteado a `wp/u87-solve-coagula`
   mientras U107 escribía docs. Mitigado: commit U107 solo pathspec
   docs/workflow/README/package; paquetes SOLVE quedaron untracked.
   Recomendación orquestador: worktrees separados también en la library
   cuando U107 ∥ U87.
2. Theme zine duplicado monorepo↔library (sin paquete compartido) — OK
   para réplica U103; candidato a extraer solo si hay 3er portal.
3. Workflow `docs.yml` hace `setup:zeus-sdk` + `npm install` completo
   (deps `file:`) aunque solo construye VitePress — más pesado que el
   monorepo; optimizable en WP futuro.
4. URL Pages / HTTPS custom domain = tick usuario (igual que U106).

## Dudas / bloqueos

Ninguno de diseño. CA remoto HTTPS = **bloqueado por ops usuario**
(checklist arriba); no se marca verde.

---

## Revisión del orquestador

**Aceptado ✅** — 2026-07-18 (orquestador). Sin ✅ BACKLOG ni merge/push
zeus en esta pasada (pedido explícito del usuario). Library ya en
`origin/main` @ `dfd6f06`. Autorización de merge zeus queda pendiente
de que el usuario lo pida.

### Qué se verificó

- **Diff zeus** `main...wp/u107-games-catalog-pages`: 2 archivos —
  `docs/games/index.md` (puntero catálogo) + este reporte. Sin
  `plan/BACKLOG.md`. Commits convencionales (`docs(plan)`,
  `docs(reportes)`). HEAD `1bbcff6`.
- **Library** `dfd6f06` en `origin/main`: VitePress + `docs.yml` +
  piel zine + portada/releases/games + `package.json` vitepress.
  Deploy Actions `29641365604` ✓ (build + Pages).
- **Re-CA (orquestador):**
  - Cards: `docs/index.md` features delta/pozo/futuros; dist
    `games/{delta,pozo,futuros}.html`; páginas con cómo jugar + spec.
  - Releases: `gh release list` = delta+pozo `v0.1.0`; `releases.md`
    refleja reales + sketch/futuros ⏳; sin inventar.
  - Workflow: `paths: ['docs/**']` + `concurrency` + deploy solo
    `main` (no PR).
  - `npm run docs:build` (worktree review @ `dfd6f06`) → dist OK;
    `base=/`; tokens zine en CSS dist (`Courier New`,
    `repeating-linear-gradient`, `@media print`).
  - Interim Pages:
    `https://alephscriptorium-eng.github.io/Z_SDK-games-library/` →
    200 + «Zeus Games» / delta / pozo / futuros.
  - Remoto custom: **⏳ OK** — Pages API `cname: null`; DNS CNAME
    `games.z-sdk` ya resuelve a `alephscriptorium-eng.github.io`, pero
    sin Custom domain en Settings la URL HTTPS del catálogo no sirve
    el sitio. Checklist ops sigue válida (paso Settings + Enforce).
- PRACTICAS §1–3 / §6: auto-revisión honesta; demolición n/a; alcance
  acotado; colisión clone library∥U87 mitigada (pathspec) — hallazgo
  operativo, no bloquea.

### CA

- [x] Un card por juego migrado (delta / pozo / futuros)
- [x] Sección releases refleja estado real (⏳ o lista)
- [x] Workflow solo dispara con cambios en `docs/**` (+ concurrency)
- [x] Piel zine (mono / b-n / rayas / print)
- [~] URL viva HTTPS `games.z-sdk.escrivivir.co` — **⏳ tick ops**
  (no fingir verde; igual U106)

### PRACTICAS

OK. Sin monkey-code / dual path / nombres de transición. Worker no
tocó BACKLOG. Push zeus no intentado (política).

### Merge

1. Library: **ya mergeada** (`dfd6f06` en `main`) — nada pendiente.
2. Zeus: merge `wp/u107-games-catalog-pages` → `main` cuando el
   usuario lo pida (solo puntero + reporte). Luego ✅ BACKLOG +
   `git worktree remove` del árbol U107.
3. Ops usuario (no bloquea aceptación código): Settings → Pages →
   Custom domain = `games.z-sdk.escrivivir.co` (DNS CNAME parece
   ya propagado).

### Hallazgos (cola; no bloquean)

1. Worktrees separados también en library cuando U107 ∥ U87.
2. Theme zine duplicado monorepo↔library — OK réplica U103.
3. `docs.yml` + `setup:zeus-sdk` + install completo — pesado; WP futuro.
4. Cabecera reporte lista `b59eb33`; HEAD zeus también `1bbcff6`
   (meta) — cosmético.
