# WP-U108 · volumes-gitignore — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok) |
| fecha | 2026-07-18 |
| rama | `wp/u108-volumes-gitignore` |
| commit(s) | `ed1952a` (fix), `695201d` (reporte) |
| estado propuesto | listo para revisión |
| push | **no intentado** (política swarm) |

## Qué se hizo

Se acotó la whitelist de `.gitignore` VOLUMES: se demolieron las wildcards
anchas `!VOLUMES/DISK_02/**` y `!VOLUMES/DISK_03/**` y se sustituyeron por
un patrón nested ignore→un-ignore alineado a `git ls-files VOLUMES/`
(demo + registry.yaml; force-sample; cotas/sima `{cota,manifest}.json`;
registry.json; README + volumes.json).

Se corrigió la mentira del reporte U62 («copies locales … están
gitignoradas») y la sección Git policy de `VOLUMES/README.md` para
describir la whitelist exacta.

Verificado contra datos vivos reales del checkout principal (~espana,
force-a..g, cima, sima/escenas): `check-ignore` → IGNORADO;
`git add VOLUMES/ --dry-run` vacío; `git status --short VOLUMES/` limpio;
`git ls-files VOLUMES/` = 15 (sin cambios).

## Archivos tocados

| archivo | cambio |
| ------- | ------ |
| `.gitignore` | modificado — whitelist fixtures exactos; demole `!DISK_0{2,3}/**` |
| `VOLUMES/README.md` | modificado — Git policy honesta (U108) |
| `plan/REPORTES/WP-U62-release-pipeline.md` | modificado — corrige nota falsa + CA orquestador |
| `plan/REPORTES/WP-U108-volumes-gitignore.md` | creado — este reporte |

## Evidencia

### Demolición de wildcards anchas

```
$ grep -n '!VOLUMES/DISK_0[23]/\*\*' .gitignore || echo "DEMOLITION_OK"
DEMOLITION_OK: no !DISK_02/** or !DISK_03/**
```

### `git ls-files VOLUMES/` (sin cambios; 15 paths)

```
VOLUMES/DISK_02/LINEAS/demo/manifest.json
VOLUMES/DISK_02/LINEAS/demo/nodos/N01/meta.json
VOLUMES/DISK_02/LINEAS/demo/wp/historia/manifest.json
VOLUMES/DISK_02/LINEAS/demo/wp/historia/nodo-sections.json
VOLUMES/DISK_02/LINEAS/registry.yaml
VOLUMES/DISK_03/FORCES/cotas/sima/cota.json
VOLUMES/DISK_03/FORCES/cotas/sima/manifest.json
VOLUMES/DISK_03/FORCES/forces/force-sample/escenas/sesion-01/01-sample/output.md
VOLUMES/DISK_03/FORCES/forces/force-sample/escenas/sesion-01/01-sample/prompt.md
VOLUMES/DISK_03/FORCES/forces/force-sample/escenas/sesion-01/01-sample/think.md
VOLUMES/DISK_03/FORCES/forces/force-sample/force.json
VOLUMES/DISK_03/FORCES/forces/force-sample/manifest.json
VOLUMES/DISK_03/FORCES/registry.json
VOLUMES/README.md
VOLUMES/volumes.json
```

### `git check-ignore -v` — rutas vivas (checkout principal, .gitignore U108 aplicado temporalmente)

```
.gitignore:21:VOLUMES/DISK_02/LINEAS/**	VOLUMES/DISK_02/LINEAS/espana/INDICE.md
.gitignore:21:VOLUMES/DISK_02/LINEAS/**	VOLUMES/DISK_02/LINEAS/espana/etiquetados/aeo-caso2-2026/caso.json
.gitignore:32:VOLUMES/DISK_03/FORCES/forces/**	VOLUMES/DISK_03/FORCES/forces/force-a/force.json
.gitignore:32:VOLUMES/DISK_03/FORCES/forces/**	VOLUMES/DISK_03/FORCES/forces/force-g/force.json
.gitignore:36:VOLUMES/DISK_03/FORCES/cotas/**	VOLUMES/DISK_03/FORCES/cotas/cima/cota.json
.gitignore:38:VOLUMES/DISK_03/FORCES/cotas/sima/**	VOLUMES/DISK_03/FORCES/cotas/sima/escenas
.gitignore:29:VOLUMES/DISK_03/FORCES/**	VOLUMES/DISK_03/FORCES/README.md
live_exit:0
```

### Fixtures — no ignorados (`check-ignore` exit 1, sin salida)

```
git check-ignore -v \
  VOLUMES/DISK_02/LINEAS/registry.yaml \
  VOLUMES/DISK_02/LINEAS/demo/manifest.json \
  VOLUMES/DISK_03/FORCES/forces/force-sample/force.json \
  VOLUMES/DISK_03/FORCES/cotas/sima/cota.json
# → (vacío) fix_exit:1
```

### `git add VOLUMES/ --dry-run` (main + gitignore U108)

```
dry_lines:0
```

### `git status --short VOLUMES/` (main + gitignore U108)

```
(vacío — sin ?? de datos vivos)
```

Tras restaurar el `.gitignore` pre-U108 en main, reaparecen los `??`
(espana/, force-a/, …) — confirma el delta del candado.

### Tests

```
npm run test:forces
# pass 2 # fail 0  (force-sample fixture)

npm test -w @zeus/linea-kit
# pass 26 # fail 0

npm run lint
# 0 errors, 11 warnings (preexistentes; no tocados)

npm run test:lineas
# fail 2 — PREEXISTENTE también en main (smoke exige linea espana;
# hasLiveLineasRegistry no skipea bien con fixture-only / copy rota).
# No causado por este WP (gitignore no altera lectura de fixtures).
```

### Efecto visible

n/a (micro gitignore). Verificación = comandos git anteriores.

## Demolición

Borradas las un-ignore anchas:

- `!VOLUMES/DISK_02/**`
- `!VOLUMES/DISK_03/**`

(y el par `!VOLUMES/DISK_02/` / `!VOLUMES/DISK_03/` que solo abría el
disco sin re-ignorar el interior).

```
$ grep -n '!VOLUMES/DISK_0[23]/\*\*' .gitignore || echo DEMOLITION_OK
DEMOLITION_OK
```

Quedan `VOLUMES/DISK_02/**` / `VOLUMES/DISK_03/**` **sin** `!` como
capa de re-ignore nested (necesarios para la whitelist fina).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: n/a (solo gitignore/docs).
- [x] Cadenas if/switch → tabla: n/a.
- [x] Duplicación con otros paquetes: n/a.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no.
- [x] Demolición completa (grep arriba): sí — cero `!DISK_0{2,3}/**`.
- [x] Tests prueban comportamiento: CA = check-ignore / dry-run / ls-files
  (evidencia literal). Suites fixture force + linea-kit verdes.
- [x] Arranque real: n/a micro; verificado status/dry-run contra árbol vivo.
- [x] README/specs: `VOLUMES/README.md` alineado a policy real.
- [x] Diff solo alcance WP: `.gitignore` + docs honestas + reporte; no
  BACKLOG; no U70/U86; no `git add` de datos reales.

## Hallazgos fuera de alcance

- `npm run test:lineas` rojo en main y worktree: smoke asume corpus
  `espana`; con solo fixture `demo` o copy viva incompleta revienta.
  Relacionado a residual U102 «espana-shaped fixture» / skip honesto —
  no arreglado aquí.
- Copies locales de caso (~20 MB) siguen en el disco del operador bajo
  `zeus-sdk/VOLUMES/` (ahora ignoradas). Ops debería moverlas a
  `ZEUS_VOLUMES_ROOT` externo (ya documentado).
- Hallazgo BACKLOG post-U80 «DISK_03 gitignore vs D-19» quedó obsoleto
  tras U62/U108; orquestador puede limpiar esa cola.

## Dudas / bloqueos

Ninguno. Push no intentado (política).

---

## Revisión del orquestador

**Aceptado ✅** (orquestador / 2026-07-18) — **sin merge aún** (usuario:
prioridad merge inmediato tras esta aceptación; orquestador no mergea /
no push / no ✅ BACKLOG en esta pasada).

### Verificado

- Diff `main...HEAD` acotado: `.gitignore`, `VOLUMES/README.md`,
  reporte U62 (honestidad), reporte U108. Sin BACKLOG. Sin U70/U86.
- Demolición: `grep '!VOLUMES/DISK_0[23]/\*\*'` → `DEMOLITION_OK` (rama).
  En `main` aún viven las wildcards anchas (líneas 16/18) — se cierran
  al merge.
- `git ls-files VOLUMES/` = 15 paths; idéntico a `main` (fixtures
  siguen en árbol).
- `git check-ignore -v` rutas vivas (espana, force-a/g, cima,
  sima/escenas, FORCES/README) → IGNORADO (`live_exit:0`).
- Fixtures trackeados (`registry.yaml`, `demo/…`, `force-sample`,
  `sima/{cota,manifest}.json`, …) → `check-ignore` vacío (`fix_exit:1`).
- `git add VOLUMES/ --dry-run` en worktree → vacío (`dry_lines:0`);
  `git status --short VOLUMES/` limpio.
- Contraste en `main` (gitignore pre-U108): `??` de datos vivos +
  dry-run añade espana/force-a..g — confirma el hueco que U108 cierra.
- Commits convencionales (`fix(volumes):` / `docs(plan):`). PRACTICAS
  §1–3 OK para micro gitignore/docs.
- Hallazgo `test:lineas` rojo preexistente (espana-shaped) — fuera de
  alcance; no bloquea CA de este WP.

### CA

- [x] `check-ignore` rutas vivas → IGNORADO
- [x] `git add VOLUMES/ --dry-run` no añade fuera de fixtures
- [x] `git ls-files VOLUMES/` sin cambios (15)
- [x] fixtures en árbol; datos vivos ignorados / no trackeables
- [x] docs honestas (README + nota U62)
- [x] demolición `!DISK_0{2,3}/**`

### Merge

**Inmediato** — urgente A-15 (repo público). Independiente de U70/U86.
Orden: merge `wp/u108-volumes-gitignore` → `main` → push → BACKLOG
🔶→✅ → `git worktree remove` del worktree U108.

### Acción siguiente

Usuario/orquestador en sesión de merge: merge + push main + ✅ BACKLOG
+ retirar worktree. Push de esta rama: **no intentado**.
