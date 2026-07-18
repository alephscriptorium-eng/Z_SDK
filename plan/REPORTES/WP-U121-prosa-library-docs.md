# WP-U121 · prosa-library-docs — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok) |
| fecha | 2026-07-18 |
| rama zeus | `wp/u121-prosa-library-docs` |
| rama library | `wp/u121-prosa-library-docs` |
| commit(s) library | `2314b8e` |
| commit(s) zeus | `54cc94a` · `4388b55` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se refactorizó la prosa de los 6 md del portal `Z_SDK-games-library/docs/`
según ENTREGA-18d bloque B2 / D-24. `releases.md` describe el mecanismo y
apunta a GitHub Releases como verdad viva (sin fechas «consultado» ni
tablas de versión a mano). `startpacks.md` separa el pipeline Notario del
estado de publish al registry. `file:` / `.deps` quedó encajonado como
«modo provisional» en `delta.md` + puntero en `index.md`. `futuros.md` se
declaró página de estado (no doctrina). Se limpiaron hits doctrinales
(`WP-U`, `D-8`, `⏳`, `puede estar`, `consultado 20`). El bloque `hero:` de
`index.md` no se tocó (D-24).

## Archivos tocados

**library** (`Z_SDK-games-library`):

- `docs/releases.md` — modificado: mecanismo + enlace vivo; fuera versiones/fechas a mano
- `docs/startpacks.md` — modificado: pipeline doctrinal; publish fuera de doctrina
- `docs/index.md` — modificado: features sin D-8; modo provisional; **hero intacto**
- `docs/games/delta.md` — modificado: sección modo provisional `file:`/`.deps`
- `docs/games/pozo.md` — modificado: sin referencia D-8
- `docs/games/futuros.md` — modificado: declarado estado; tabla sin WP/⏳

**zeus** (`zeus-sdk`):

- `plan/REPORTES/WP-U121-prosa-library-docs.md` — creado: este reporte

## Evidencia

### `docs:build` (library)

```
> z-sdk-games-library@0.0.0 docs:build
> vitepress build docs

  vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 12.87s.
```

### Grep doctrinales (excluida `docs/games/futuros.md`)

```
$ rg -n "WP-U|D-[0-9]|ola [0-9]|⏳|puede estar|consultado 20" docs --glob '*.md' --glob '!docs/games/futuros.md'
(exit 1 / 0 hits)
```

También 0 hits en todos los `docs/**/*.md` (futuros quedó limpio de patrón).

### Spot-check comandos (scripts existen y Notario responde)

```
$ npm run release:startpack -- --help
Usage: notario-release.mjs --game <delta|pozo|sketch|solve-coagula|plaza> [--publish-github] [--publish-npm] [--dry-run]

$ npm pkg get scripts.test:startpack scripts.e2e:startpack scripts.demo:arg scripts.demo:pozo scripts.setup:zeus-sdk
(presentes en package.json)
```

Ancla VitePress verificada en build: `#modo-provisional-file-deps`.

### Heros intactos

Diff de `docs/index.md` no toca `hero.name` / `hero.text` / `hero.tagline` /
`hero.actions`. Solo cambia `features.pozo.details` (quitó `(D-8)`) y el
cuerpo bajo el frontmatter.

## Demolición

Fuera de doctrinales: fechas «consultado 2026-07-18», versiones a mano
(`@0.1.0` en tablas de releases), `⏳` / «puede estar» mezclados con
pipeline, `WP-U##` / `D-#` en páginas de producto.

```
$ rg -n "consultado 20|@0\.1\.0|puede estar ⏳|Publish real al registry puede estar" docs --glob '*.md'
(exit 1 / 0 hits)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: URLs de GitHub Releases /
  repo son las canónicas del portal (docs, no código). Sin puertos nuevos.
- [x] Cadenas if/switch que debieron ser tabla: N/A (solo markdown).
- [x] Duplicación con otros paquetes: N/A.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no (`modo provisional`
  es el encajonado pedido por el WP).
- [x] Demolición completa (grep arriba): sí en `docs/**/*.md`.
- [x] Tests prueban comportamiento: N/A código; CA = docs:build + grep.
- [x] Arranque real verificado: `docs:build` verde; demos e2e no levantados
  (fuera de alcance de prosa). Spot-check de scripts documentados: OK.
- [x] README/specs del paquete siguen siendo verdad: README raíz de library
  **no** tocado (fuera de `docs/`); sigue con prosa de estado/swarm — ver
  hallazgos.
- [x] El diff contiene solo el alcance del WP: sí (6 md en `docs/`).

## Hallazgos fuera de alcance

- `README.md` raíz de library aún habla `WP-U##`, `D-7`/`D-10`, `file:`
  temporal y publish gated — no está en el portal VitePress; candidato a
  scrub aparte si se quiere coherencia repo↔portal.
- Comentarios en `docs/.vitepress/config.mjs` / `custom.css` citan WP-U107 /
  D-23 (no son páginas doctrinales `.md`).
- Zeus tip del worktree de reporte: `c58d5ea` (asignación citaba main
  ~`bf70911`); el reporte no depende del merge.

## Dudas / bloqueos

Ninguno. Listo para revisión orquestador (sin merge).

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
