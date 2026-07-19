# WP-U132 · wb-prime-canales — reporte

| dato | valor |
| ---- | ----- |
| agente | worker · WP-U132 |
| fecha | 2026-07-19 |
| rama | `wp/u132-wb-prime-canales` (library + zeus) |
| commit(s) | library `c55955bb840a35e12f40eae6057027c0923d93e4` · zeus rama `wp/u132-wb-prime-canales` (este reporte) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se aplicó `WEBS/ENTREGA-CAPA/01-PAQUETE-CAPA.md` rev2 verbatim sobre los 6
ficheros de `Z_SDK-games-library/docs` (worktree
`.worktrees/wp-u132-wb-prime-canales`). Fichas delta/pozo/solve: bloque
«Llévatela» → tarball Release; sellos intocados. `releases.md`: tabla
manual borrada (link Releases), sección «Otros títulos», Registry npm
doctrinal+estado→Futuros. `startpacks.md`: dos canales (Release operativo;
npm→Futuros). Nav/sidebar: SOLVE ET COAGULA tras pozo. Sin tocar
`packages/*` ni `plan/BACKLOG.md`.

## Archivos tocados

- `docs/games/delta.md` — modificado: Llévatela → tarball Release
- `docs/games/pozo.md` — modificado: idem
- `docs/games/solve-coagula.md` — modificado: idem (ancla «publicado»)
- `docs/releases.md` — modificado: 2a/2b/2c del paquete
- `docs/startpacks.md` — modificado: línea de canales (§3)
- `docs/.vitepress/config.mjs` — modificado: nav + sidebar solve-coagula
- `plan/REPORTES/WP-U132-wb-prime-canales.md` (zeus) — creado: este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm run docs:build` (library worktree, tras `npm install`):

```
> z-sdk-games-library@0.0.0 docs:build
> vitepress build docs

  vitepress v1.6.4
✓ building client + server bundles...
✓ rendering pages...
build complete in 10.67s.
```

- C8 — `rg -n "npm install @zeus/startpack" docs/`:

```
docs/startpacks.md:41:npm install @zeus/startpack-delta
docs/releases.md:19:Canal previsto para instalar por nombre (`npm install @zeus/startpack-<game>`).
```

  → `releases.md:19` = § doctrinal 2c (OK). Residual: `startpacks.md:41`
  (fence `### Registry`) — **fuera del DESPUÉS del paquete §3**; no
  improvisado (ver §Dudas).

- C9 — tabla manual juegos/versiones en `releases.md`:

```
## Juegos con canal de release
Los juegos con canal se ven en la propia página de
[Releases](.../releases):
un tag `startpack-<game>-v*` por juego publicado.
```

  Grep de filas `| delta |` / `| game |` de la tabla antigua: **0**.
  Título `Futuros (SOLVE`: **0**.

- Nav/sidebar solve-coagula (`config.mjs`):

```
38:          { text: 'SOLVE ET COAGULA', link: '/games/solve-coagula' },
58:          { text: 'SOLVE ET COAGULA', link: '/games/solve-coagula' },
```

- `git diff --stat` (library, pre-commit):

```
 docs/.vitepress/config.mjs  |  2 ++
 docs/games/delta.md         |  6 ++++--
 docs/games/pozo.md          |  6 ++++--
 docs/games/solve-coagula.md |  6 ++++--
 docs/releases.md            | 26 ++++++++++----------------
 docs/startpacks.md          |  4 ++--
 6 files changed, 26 insertions(+), 24 deletions(-)
```

- CA#5 — estado publish npm: `docs/games/futuros.md` sigue enunciando
  `Publish registry npm | gated (ops)`; `releases.md`/`startpacks.md`
  remiten a Futuros sin duplicar el estado.

- Efecto visible (portal en navegador): `⏳ sin verificar` — CA pide
  `docs:build` + greps; no se levantó `docs:dev`.

## Demolición

- Comandos `npm install @zeus/startpack-<game>` como canal operativo en
  fichas delta/pozo/solve: sustituidos por tarball Release.
- Tabla manual «Juegos con canal de release»: borrada.
- Título `### Futuros (SOLVE, …)`: renombrado a `### Otros títulos`.
- Sección Registry npm con fences copiables en `releases.md`: reformulada
  a doctrina + link Futuros.

```
# fichas: cero npm-por-nombre operativo
$ rg -n "npm install @zeus/startpack" docs/games/
(sin matches)

# título obsoleto
$ rg -n "Futuros \(SOLVE" docs/releases.md
(sin matches)
```

Residual vivo (no demolido — paquete no lo pide): fence en
`docs/startpacks.md` § Registry (`npm install @zeus/startpack-delta`).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: N/A docs; URLs Releases del
      paquete verbatim
- [x] Cadenas if/switch que debieron ser tabla: N/A (docs)
- [x] Duplicación con otros paquetes: N/A
- [x] console.log / código comentado / TODO sin backlog: no
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa (grep arriba): parcial — residual C8 en
      startpacks § Registry (paquete no lo toca)
- [x] Tests prueban comportamiento: N/A (WP docs; CA = docs:build + greps)
- [x] Arranque real verificado: docs:build verde; portal vivo no mirado
- [x] README/specs del paquete siguen siendo verdad: N/A (no tocados)
- [x] El diff contiene solo el alcance del WP: sí — exactamente 6 ficheros

## Hallazgos fuera de alcance

1. **C8 residual en `startpacks.md:41`**: el paquete §3 solo sustituye la
   línea de canales; el fence `### Registry` / `npm install
   @zeus/startpack-delta` sigue siendo comando copiable contra canal 404.
   CA#2 del propio paquete lo exige a 0 fuera de 2c → **conflicto
   paquete↔CA**.
2. `docs/games/futuros.md` aún dice «Canal primario documentado en Start
   packs» (prosa previa al amend); no está en los 6 ficheros.
3. Fichas delta/pozo conservan `require.resolve('@zeus/startpack-…')` en el
   bloque «Desde start pack» — no es `npm install` por nombre; C8 literal
   no lo pilla; posible ROT-FUTURO si se audita C8 espíritu más amplio.

## Dudas / bloqueos

- **Conflicto C8 / §3:** ¿amend del paquete para reformular o borrar el
  fence `### Registry` de `startpacks.md`, o se acepta residual y CA#2
  se reinterpreta? Worker no improvisó: diff cerrado a los 6 ficheros
  del paquete. Orquestador decide.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
