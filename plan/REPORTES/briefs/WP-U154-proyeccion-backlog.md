# Brief — WP-U154 · proyección backlog→Issues (dry-run local)

(rol) plan/roles/README.md → protocolo WORKER (o skill swarm-orquestacion)

WP: WP-U154 · Montar proyección backlog→Issues (dry-run local)
Rama: wp/u154-proyeccion-backlog
Worktree: worktree aislado (paralelo posible; el orquestador lo lanza en bg)
Reporte: plan/REPORTES/WP-U154-proyeccion-backlog.md

## Lecturas obligatorias
- plan/PRACTICAS.md entero (autocontención, citar-no-copiar, ejes, ceguera)
- El WP en plan/BACKLOG.md §Sprint 6 (CA + FRONTERA DURA)
- Método del paquete (0.3.3, solo lectura):
  `node_modules/@alephscript/skills-scriptorium/skills/swarm-orquestacion/reference/proyeccion-issues.md`
  y el script `.../scripts/proyectar-backlog.mjs`

## FRONTERA DURA (inviolable)
- **Modo LOCAL-ONLY (DC-15).** NO `PROYECCION_GITHUB=1`. NO `--habilitar-github`.
  NO crear/cerrar/editar issues reales. NO tocar la API de GitHub.
- Solo `export --dry-run` (preview sin API). Si el dry-run intentara algo
  remoto, PARA y anótalo en §dudas.
- `Z_SDK` es repo PÚBLICO: el gate de ceguera es obligatorio.

## Tarea
1. Cablear `proyectar-backlog.mjs` como npm script (p. ej. `backlog:project`),
   invocándolo desde `node_modules` (no copiar el script; patrón U147/U150).
2. Definir la calibración local de zeus, documentada en el plan (no hardcodear
   secretos ni rutas locales):
   - `CEGUERA_PATTERN` = regex de tokens PROHIBIDOS en cara pública: vocabulario
     de marco (vig[íi]a, custodio, mediaci, marco, addenda, §interna,
     instancia-ejemplo) + cualquier token local sensible. Va por **env**, no
     almacenado en el skill.
   - `--alcance abiertos` (solo ⬜/🔶; los ~140 ✅ NO se proyectan).
   - Ubicación del mapa: `plan/.sync-map.json` (git-tracked, inicial/vacío).
3. Ejecutar `export --dry-run` con el `CEGUERA_PATTERN` puesto y **pegar la
   salida literal** en el reporte (lista de WP abiertos que proyectaría).
4. Probar el fail-safe del gate: sin `CEGUERA_PATTERN` → el export **rehúsa**
   (exit 3); con el patrón → 0 hits. Salida literal de ambos.
5. Verificar cero efecto externo: `gh issue list --repo alephscriptorium-eng/Z_SDK`
   antes/después sin novedades (o declararlo si no aplica).

## CA (evidencia literal)
- npm script existe e invoca el script del paquete.
- `export --dry-run` corre y lista los WP abiertos (salida literal).
- Gate de ceguera: sin patrón → rehúsa (exit 3, literal); con patrón → 0 hits.
- `plan/.sync-map.json` inicial/vacío; **cero issues creados**.

## Notas del orquestador
- ALCANCE_DIFF = `package.json`, `plan/.sync-map.json`, calibración en
  `plan/roles/README.md` (o config nueva), `.gitignore` (si aplica), reporte.
- MUNDO_RAIZ = zeus-sdk. NO push, NO merge, NO editar BACKLOG (es del orquestador).
- El worktree nace sin node_modules: `npm install` primero (~3 min, timeout
  generoso). Restaura EOL de `bin/*.mjs` con `git restore` si se ensucian
  (hallazgo recurrente U145).
- CI: sin push → N/A; anótalo (package.json dispararía CI al pushear).
- Commits convencionales en castellano.

## Respuesta final
Rama, commits (hashes), estado de cada CA, ruta del reporte, y confirmación
explícita de que NO se tocó la API de GitHub (0 issues).
