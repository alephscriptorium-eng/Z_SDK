# WP-U125 · copy-web-b — reporte

| dato | valor |
| ---- | ----- |
| agente | worker · chat WP-U125 |
| fecha | 2026-07-19 |
| rama | `wp/u125-copy-web-b` (library + zeus) |
| commit(s) | library `eb0619909408e184ce8415fb85be65b7adc25738` · zeus (este reporte) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se aplicó CAPA W-B verbatim en `Z_SDK-games-library` (no marketing SUPERADA).
Anclas ANTES de hero/features en `docs/index.md` coincidieron con el repo.
Se creó la ficha `docs/games/solve-coagula.md`; se retiró SOLVE-como-futuro de
`futuros.md` y se añadió §call4makers; se insertó capa de ficha en delta/pozo
(línea de obra + cierre Llévatela). `config.mjs` no se tocó (CAPA no lo pide).
`actions` de index intactas; cuerpos técnicos de delta/pozo intactos salvo las
2 inserciones.

## Archivos tocados

**Library** (`Z_SDK-games-library`, rama `wp/u125-copy-web-b`):

- `docs/index.md` — modificado: hero + features CAPA
- `docs/games/solve-coagula.md` — creado: ficha released
- `docs/games/futuros.md` — modificado: demuele fila SOLVE; §call4makers
- `docs/games/delta.md` — modificado: línea El Común + Llévatela
- `docs/games/pozo.md` — modificado: línea El Aljibe + Llévatela

**Zeus** (rama `wp/u125-copy-web-b`):

- `plan/REPORTES/WP-U125-copy-web-b.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `git diff --stat` (antes del commit; 5 ficheros del paquete W-B):

```
 docs/games/delta.md   | 10 ++++++++++
 docs/games/futuros.md | 16 +++++++++++++++-
 docs/games/pozo.md    | 10 ++++++++++
 docs/index.md         | 23 ++++++++++++-----------
 docs/games/solve-coagula.md | (nuevo)
 5 files changed (+ untracked solve-coagula.md)
```

- `npm run docs:build` (library) — OK con cwd en drive `C:` (ver hallazgos):

```
> vitepress build docs
✓ building client + server bundles...
✓ rendering pages...
build complete in 38.50s.
```

HTML generado incluye `docs/.vitepress/dist/games/solve-coagula.html` (y
delta/futuros/pozo/index/releases/startpacks).

- Hero FOSS 1 línea + Ventana de Contexto:

```
tagline: |-
  Librería de juegos de Ventana de Contexto para ARG
```

- `demo:solve-coagula` existe en root `package.json`:

```
npm run demo -w @zeus/solve-coagula
```

- Start packs en GitHub Releases (2026-07-18):

```
@zeus/startpack-solve-coagula@0.1.0  startpack-solve-coagula-v0.1.0
@zeus/startpack-pozo@0.1.0           startpack-pozo-v0.1.0
@zeus/startpack-delta@0.1.0          startpack-delta-v0.1.0
```

- `npm view @zeus/startpack-*` contra registry → 404 en este entorno
  (auth/red); verdad de publicación verificada vía `gh release list`.
  Installs `npm install @zeus/startpack-*`: ⏳ sin verificar (registry 404
  local).

- Greps razonables sobre ficheros tocados: SOLVE como fila de futuros = 0.
  Hit «Sin inventar releases» solo en §call4makers CAPA verbatim (no hero).

- Slugs `delta` / `pozo` / `solve-coagula` / links `/games/*` intactos.
  `config.mjs` nav/sidebar: sin solve-coagula (CAPA no lo pide; hallazgo).

- Efecto visible (docs:dev / browser): ⏳ sin verificar — solo `docs:build`.

## Demolición

Entrada SOLVE-como-futuro en `docs/games/futuros.md` (fila de tabla).

```
$ rg -n "SOLVE ET COAGULA" docs/games/futuros.md
(sin matches)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: solo URLs de GitHub ya en CAPA /
      fichas; sin puertos nuevos
- [x] Cadenas if/switch que debieron ser tabla: N/A (markdown)
- [x] Duplicación con otros paquetes: N/A
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no (verbatim CAPA; voseo
      call4makers vs tuteo Llévatela dejado a propósito)
- [x] Demolición completa (grep arriba): sí
- [x] Tests prueban comportamiento: N/A WP docs; CA = docs:build
- [x] Arranque real verificado: docs:build OK; demo no levantada
- [x] README/specs del paquete siguen siendo verdad: no tocados
- [x] El diff contiene solo el alcance del WP: 5 ficheros library docs

## Hallazgos fuera de alcance

1. **`docs:build` en Windows + Git Bash:** falla en fase *rendering pages*
   (`Cannot read properties of undefined (reading 'imports')`) si
   `process.cwd()` usa drive `c:` (minúscula); OK con cwd `C:\...`. Mismatch
   facadeModuleId VitePress. CI Linux OK históricamente. No se cambió
   `config.mjs`.
2. **Nav/sidebar** (`docs/.vitepress/config.mjs`) no listan
   `solve-coagula`; la ficha es reachable por card de portada. SUPERADA
   marketing sí tocaba config; CAPA no.
3. Cuerpo de `index.md` §«Cómo usar» sigue citando «delta / pozo / futuros»
   (fuera del bloque CAPA; intocado).
4. Registro voseo/tuteo inconsistente (nota ADDENDA) — aplicado verbatim.

## Dudas / bloqueos

Ninguno que bloquee el WP. Orquestador: ¿abrir micro para nav/sidebar
solve-coagula + preserveSymlinks/docs:build Windows?

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
