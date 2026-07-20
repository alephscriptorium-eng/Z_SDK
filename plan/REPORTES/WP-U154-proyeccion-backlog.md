# WP-U154 · proyeccion-backlog — reporte

| dato | valor |
| ---- | ----- |
| agente | worker swarm zeus-sdk (background) |
| fecha | 2026-07-20 |
| rama | `wp/u154-proyeccion-backlog` |
| commit(s) | `454124c` |
| eje(s) CA | ceguera (transversal) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se cableó la herramienta del paquete `proyectar-backlog.mjs`
(`@alephscript/skills-scriptorium@0.3.3`) como npm script, invocándola desde
`node_modules` (no se copió el script; patrón U147/U150/U153). Se añadieron
dos scripts: `backlog:project` (base — `export --alcance abiertos`, con el
candado local-only DC-15 que rehúsa la API sin opt-in) y
`backlog:project:preview` (reutiliza el base añadiéndole `--dry-run`, preview
sin API). Se documentó la calibración local en `plan/roles/README.md §6`
(modo LOCAL-ONLY, gate de ceguera por env, `--alcance abiertos`, ubicación del
mapa) y se creó `plan/.sync-map.json` inicial/vacío (`{}`), git-tracked. Se
ejecutó `export --dry-run` con `CEGUERA_PATTERN` y se probó el fail-safe del
gate en las tres ramas (sin patrón → exit 3; con patrón/abiertos → 0 hits;
con patrón/todos → hit real exit 1). **Cero** issues creados o editados
(evidencia `gh issue list` antes/después = `[]`).

**Desvío honesto (no bloqueante):** bajo `--alcance abiertos` el dry-run
lista **0 WP**. El único WP abierto del backlog (WP-U154, línea 384) usa el
formato `- 🔶 **WP-U154** (…). Rama…`, mientras el parser del paquete exige
`- <estado> **WP-XX · título**` (ID y título dentro del mismo `**…**`). El
formato no casa, así que no se parsea. No se corrige aquí porque
`plan/BACKLOG.md` es del orquestador (ver §Hallazgos). El montaje, el gate y
la evidencia literal quedan igualmente demostrados.

## Archivos tocados

- `package.json` · modificado — añade `backlog:project` y
  `backlog:project:preview` (invocan el script del paquete; no lo copian).
- `plan/roles/README.md` · modificado — nueva §6 «Proyección backlog→Issues
  (LOCAL-ONLY, DC-15)» con la calibración local.
- `plan/.sync-map.json` · creado — mapa `WP-XX → nº issue`, inicial vacío `{}`.
- `plan/REPORTES/WP-U154-proyeccion-backlog.md` · creado — este reporte.

## Evidencia

> Regla: no inventes observaciones. Salida literal.

### CA1 · npm script existe e invoca el script del paquete

`package.json` (fragmento):

```
"backlog:project": "node node_modules/@alephscript/skills-scriptorium/skills/swarm-orquestacion/scripts/proyectar-backlog.mjs export --alcance abiertos",
"backlog:project:preview": "npm run backlog:project -- --dry-run",
```

El script vive en el paquete (0.3.3), no en el repo:

```
$ ls node_modules/@alephscript/skills-scriptorium/skills/swarm-orquestacion/scripts/proyectar-backlog.mjs
node_modules/@alephscript/skills-scriptorium/skills/swarm-orquestacion/scripts/proyectar-backlog.mjs
```

### CA2 · `export --dry-run` corre y lista los WP abiertos (salida literal)

```
$ export CEGUERA_PATTERN='vig[íi]a|custodio|mediaci|marco|addenda|§interna|instancia-ejemplo'
$ npm run --silent backlog:project:preview
[proyectar] ceguera OK (0 WP validados contra el patrón del mundo).
[proyectar] export (DRY-RUN) · alcance=abiertos · 0 proyectado(s), 0 a cerrar · repo=(cwd)
[proyectar] OK.
# EXIT=0
```

La lista de WP abiertos que proyectaría está **vacía**: ver el desvío honesto
arriba y §Hallazgos (formato de entrada de WP-U154 vs. parser del paquete).

### CA3 · Gate de ceguera — fail-safe (sin patrón → rehúsa, exit 3)

```
$ unset CEGUERA_PATTERN
$ npm run --silent backlog:project:preview
[proyectar] CEGUERA_PATTERN no definido: se rehúsa exportar a un tracker público sin prueba de ceguera (DC-12).
# EXIT_A=3
```

### CA3 · Gate de ceguera — con patrón, alcance abiertos → 0 hits

Ver CA2 (`ceguera OK (0 WP validados…)`, exit 0).

### CA3 (extra) · Gate VIVO — con patrón, alcance todos → hit real (exit 1)

Prueba de que el gate no es vacuo: sobre el conjunto `todos` (los WP que sí
casan el parser) detecta un token de marco y aborta sin crear nada.

```
$ export CEGUERA_PATTERN='vig[íi]a|custodio|mediaci|marco|addenda|§interna|instancia-ejemplo'
$ npm run --silent backlog:project -- --alcance todos --dry-run
[proyectar] CEGUERA FALLA: tokens de marco en WP-U139. No se proyecta.
# EXIT_TODOS=1
```

Token que dispara: `custodio` (en el cuerpo de WP-U139 del backlog).

### CA4 · Candado LOCAL-ONLY (DC-15) — base sin dry-run ni opt-in → exit 4

El npm script base **nunca** toca la API por defecto:

```
$ export CEGUERA_PATTERN='…'
$ npm run --silent backlog:project
[proyectar] proyección a GitHub DESHABILITADA por defecto (local-only, DC-15).
  Actívala solo si el usuario lo pidió: --habilitar-github o PROYECCION_GITHUB=1.
  (Para previsualizar sin tocar la API: añade --dry-run.)
# EXIT_C=4
```

### CA4 · `plan/.sync-map.json` inicial/vacío y git-tracked

```
$ cat plan/.sync-map.json
{}
$ git check-ignore -v plan/.sync-map.json || echo "NOT ignored (trackable) OK"
NOT ignored (trackable) OK
```

### CA4 · CERO issues creados — evidencia externa (read-only, antes/después)

Autenticado como `alephscriptorium-eng`; repo público `Z_SDK`.

```
# ANTES de cualquier ejecución
$ gh issue list --repo alephscriptorium-eng/Z_SDK --state all --json number,title
[]
# DESPUÉS de todas las pruebas dry-run
$ gh issue list --repo alephscriptorium-eng/Z_SDK --state all --json number,title
[]
```

Ninguna llamada de escritura a la API de GitHub en todo el WP: sólo
`export --dry-run` (sin API) y `gh issue list` (solo lectura).

### Evidencia CI

| campo | valor |
| ----- | ----- |
| branch | `wp/u154-proyeccion-backlog` |
| run_id | **N/A** (sin push) |
| workflow | CI |
| conclusion | **N/A** |

CI = N/A por decisión de alcance: **no** hay push (restricción del brief).
Honestidad: `package.json` **no** está en paths-ignore U104 (que sólo exime
`plan/**` / `**.md`), de modo que al pushear esta rama el workflow CI **sí**
dispararía. Queda para el orquestador tras el merge.

## Demolición

n/a (WP de montaje; no sustituye nada).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: ninguno. El repo remoto se pasa
  como argumento a `gh` (solo lectura); el script infiere del cwd si no.
- [x] Cadenas if/switch que debieron ser tabla: n/a (no se escribió lógica;
  el método vive en el paquete). Las tres ramas del gate son del paquete.
- [x] Duplicación con otros paquetes (busqué antes): ninguna — el script se
  **invoca** desde `node_modules`, no se copia (patrón U147/U150/U153).
- [x] console.log / código comentado / TODO sin backlog: ninguno.
- [x] Nombres fuera de glosario o de transición: ninguno.
- [x] Demolición completa: n/a.
- [x] Tests prueban comportamiento: las pruebas ejercen las 4 salidas reales
  del gate/candado (exit 0/1/3/4), no «no explota».
- [x] Arranque real verificado: sí — se ejecutaron los npm scripts y se
  capturó salida literal; `gh issue list` antes/después = `[]`.
- [x] README/specs siguen siendo verdad: `plan/roles/README.md §6` describe
  exactamente los scripts y el modo cableados.
- [x] El diff contiene solo el alcance del WP: `package.json`,
  `plan/roles/README.md`, `plan/.sync-map.json`, reporte. Nada más.
  `.gitignore` no se tocó (el mapa es git-tracked, no requiere ignore).
- [x] EOL de `bin/*.mjs`: `npm install` los ensució (hallazgo recurrente
  U145); restaurados con `git restore` antes de nada. Diff final sin `bin/`.
- [x] BACKLOG **no** editado (es del orquestador). Puntero de submódulo
  **sin** bumpear (n/a; no se tocaron submódulos).

## Hallazgos fuera de alcance

1. **Formato de entrada de WP abierto vs. parser del paquete (relevante).**
   El parser de `proyectar-backlog.mjs` exige
   `- <estado> **WP-XX · título**` (ID y título dentro del mismo `**…**`).
   El único WP abierto (WP-U154, línea 384) usa
   `- 🔶 **WP-U154** (worker background · …). Rama…` — bold cerrado tras el ID
   — y **no** se parsea. Además, de los ~55 bullets de WP del backlog, sólo
   **27** casan el patrón `**WP-XX · título**`; el resto usa el estilo
   em-dash `**WP-XX** — prosa`. Consecuencia: bajo `--alcance abiertos` la
   proyección quedaría vacía aunque hubiera WP abiertos con ese formato.
   **Candidato a WP del orquestador:** unificar el formato de los bullets de
   WP del backlog al que el parser espera, o (feedback al diseñador del
   paquete) flexibilizar el parser para aceptar `**WP-XX**` con título fuera
   del bold. No se corrige aquí porque `plan/BACKLOG.md` es del orquestador.

2. **`git` avisa `LF will be replaced by CRLF` en `plan/.sync-map.json`** al
   añadirlo (autocrlf del entorno Windows). El fichero se commiteó igual;
   sin impacto funcional (JSON). Nota de higiene, no acción.

## Dudas / bloqueos

Ninguno bloqueante. El montaje, el gate de ceguera (4 salidas probadas) y la
evidencia de cero efecto externo están completos. La única observación de
fondo es el desajuste de formato del §Hallazgos #1, que pertenece al
orquestador (dueño del BACKLOG) decidir cómo resolver.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
