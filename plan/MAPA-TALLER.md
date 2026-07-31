# MAPA-TALLER — la zona de obra: plan/ · estación · gates · CI

**WP-U223** (regla #19 — `plan/BACKLOG.md:297`) · 2026-07-31.
**Apunta, no duplica**: el gobierno de ejecución vive en `plan/GOBIERNO-EJECUCION-F2.md`
(§1 paths · §2 calientes · §3 olas · §6 BRIEF · §7 DoD); el backlog vivo en
`plan/BACKLOG.md`. Este mapa solo fija qué hay en el taller y quién lo toca.

## plan/ — centro de mando

Verificación: `ls -1A plan/` → **21 entradas** (18 preexistentes + los tres
`MAPA-*.md` que crea este WP; cada una con fila abajo).

| entrada | qué es | quién la posee/toca |
| --- | --- | --- |
| `.sync-map.json` | mapa WP→número para la proyección del backlog (`backlog:project` `package.json:86`, skill swarm) | custodio Z (tooling del método) |
| `ARQUITECTURA.md` | diagnóstico y objetivo de arquitectura (mapeado 2026-07-15) | custodio Z |
| `BACKLOG-F2.md` | lápida: absorbido en `BACKLOG.md` §ÉPICA F2 | custodio Z |
| `BACKLOG-HISTORICO.md` | snapshot archivado de olas/colas de la refundación (WP-U118) | custodio Z (archivo) |
| `BACKLOG.md` | **backlog vivo** — lanes A-M, ÉPICA F2 | **solo custodio Z**; prohibido a workers (BRIEF §6) |
| `DATOS.md` | plano de datos: líneas, volúmenes y feeds | custodio Z · carril D |
| `DECISIONES.md` | registro D-n (decisión, fecha, consecuencia) | custodio Z |
| `ESTACION.md` | calibración del mundo z-sdk; activación de la estación (skill estacion-viva) | vigía Z (GOBIERNO :415: su espejo `.claude/skills/` está gitignorado) |
| `GOBIERNO-EJECUCION-F2.md` | gobierno de ejecución F2: mapa WP→deps→paths, calientes, olas, BRIEF, DoD | custodio Z |
| `MAPA-RAIZ.md` | mapa de la raíz del repo (este WP) | WP-U223; lo mantiene quien añada entradas a la raíz |
| `MAPA-REPO.md` | mapa de packages/ + VOLUMES/docs/scripts/e2e (este WP) | WP-U223; ídem |
| `MAPA-TALLER.md` | este mapa | WP-U223; ídem |
| `MATRIZ-RUNTIME-51.md` | ficha de runtime de las 51 piezas (WP-U179); alimenta el gate U233 | WP-U179 → U233 |
| `PRACTICAS.md` | lectura obligatoria antes de tocar código (modos de fallo de agente) | custodio Z |
| `PUBLISH-ALLOWLIST.md` | fuente única de clases publicables (WP-U162) | **caliente** §2 GOBIERNO: U236 · U213 (lee) · U178 |
| `RE-PLAN.md` | retrospectiva de cierre de la refundación | custodio Z (archivo) |
| `README.md` | qué es `plan/` (centro de mando de la refundación) | custodio Z |
| `REPORTES/` | reportes `WP-*.md`, actas, checklists, `PLANTILLA.md`, `briefs/`, `entregas/` | cada worker escribe el suyo; actas del orquestador/vigía |
| `VISION.md` | visión: de frankenstein a herramienta de crear juegos | custodio Z |
| `recursos/` | `README.md` (recursos del plan) | custodio Z |
| `roles/` | `README.md` (roles del swarm) | custodio Z |

## scripts/estacion/ — vigilancia de la estación

Verificación: `ls -1A scripts/estacion/` → 3 entradas.
**Caliente** §2 GOBIERNO: U222 (ola 6) · U226 (P2-a).

| entrada | qué es | ref npm |
| --- | --- | --- |
| `README.md` | contrato de la estación local | — |
| `checks-031.sh` | checks de vigilancia | `vigilancia:check` (`package.json:81`) |
| `run-watcher.sh` | watcher de sesión (once/watch) | `vigilancia` / `vigilancia:watch` (`:79-80`) |

## Gates

Verificación: `ls -1A scripts/gates/` → 3 entradas; tests en `test/gates/`.
**Caliente** §2 GOBIERNO: `scripts/gates/*` → U233 (ola 2) · U231 (ola 4). Origen: WP-U00
(`plan/REPORTES/WP-U00-gates.md`).

| entrada | qué es | ref |
| --- | --- | --- |
| `scripts/gates/run.mjs` | runner de gates | `gates` (`package.json:78`) |
| `scripts/gates/scan.mjs` | escáner que alimenta el runner | invocado por `run.mjs` |
| `scripts/gates/exceptions.mjs` | excepciones declaradas de los gates | ídem |
| `test/gates/gates.test.mjs` | test del runner | `test:gates` (`package.json:82`) |
| `scripts/gate-publish-ready.mjs` | gate suelto de publish-ready | `gate:publish-ready` (`:132`) |
| `scripts/audit-publish-allowlist.mjs` | auditoría de la allowlist (WP-U162) | `audit:publish-allowlist` (`:131`) |

## CI / workflows

Verificación: `ls -1A .github/workflows/` → 4 entradas.

| entrada | qué es | quién la posee/toca |
| --- | --- | --- |
| `ci.yml` | CI del monorepo | **caliente** §2 GOBIERNO: U221 (ola 5) → U241 (ola 7) → U213 (ola 8); U233 candidato |
| `docs.yml` | build/deploy del sitio docs (Pages) | Lane E (reportes WP-U103 · WP-U106) |
| `publish-operator-bridge.yml` | one-shot de publicación de operator-bridge al registry (secrets CI) | WP-U55 (`plan/REPORTES/WP-U55-demoler-file-deps.md:17,30`) |
| `release.yml` | release por changesets | **caliente** §2 GOBIERNO: U212 (ola 6) → U239 (ola 7) → U238 (ola 8) |

---

## Propuesta de gate `verificar-territorio-mapa` (NO cableado en este WP)

El gobierno dejó `<pendiente>` su ubicación (GOBIERNO :424: «script del paquete de
skills vs copia en `scripts/`»). Propuesta para decisión del custodio Z:

**Forma** (independiente de la ubicación):

1. Pares (territorio → mapa): raíz → `MAPA-RAIZ.md`; `VOLUMES/`, `docs/`, `scripts/`,
   `e2e/`, `examples/` → `MAPA-REPO.md`; `plan/`, `scripts/estacion/`, `scripts/gates/`,
   `.github/workflows/` → `MAPA-TALLER.md`.
2. Por par: listar el primer nivel real (`ls -1A`, exclusiones declaradas: `node_modules`,
   `dist`, `.git` como contenido) y extraer las filas del mapa (primera columna
   `` | `entrada` | `` o los nombres en listas de grupo).
3. **Entrada sin fila = FAIL** (nombra la entrada) · **fila sin entrada = FAIL**
   (fila fantasma). Cualquier discrepancia → exit ≠ 0.
4. `packages/*` no se compara fila a fila aquí: el gate verifica los **conteos** del
   denominador (26/1/21 + 2 examples workspace + 1 anidada) contra
   `plan/MATRIZ-RUNTIME-51.md` §Denominador, que es la fuente única (apuntar, no duplicar).

**Ubicación propuesta** (en orden de preferencia):

- **(a)** script del paquete de skills (método swarm), parametrizado por pares
  territorio→mapa, invocado como un check más desde `scripts/gates/run.mjs` **cuando
  U233 (ola 2) fije el patrón de invocación** — evita tocar `scripts/gates/*` fuera
  de su WP caliente (§2).
- **(b)** si el paquete de skills no se materializa en CI: copia mínima
  `scripts/estacion/verificar-territorio-mapa.sh` junto a `checks-031.sh` (ámbito
  vigilancia), respetando que `scripts/estacion/*` es caliente de U222/U226 → coordinar ola.

Este WP **no** crea el script ni toca `scripts/gates/**`, `package.json` ni CI.

---

**entrada sin fila = FAIL** — todo lo nuevo en este territorio añade su fila en el mismo cambio.
