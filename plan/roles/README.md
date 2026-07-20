# plan/roles — protocolo del swarm (zeus-sdk)

El protocolo de swarm (orquestador / worker / revisión / corrección / brief y
la plantilla de reporte) **ya no se copia aquí**: es genérico, vive publicado
y versionado, y este mundo lo **referencia**. En `plan/roles/` solo queda la
**calibración local** de zeus: lo propio de este mundo que el protocolo
genérico no fija. (Ejecuta la sustitución gradual diferida en D-35, con GO
Sprint 4 — WP-U146.)

## Protocolo canónico (referencia versionada)

| dato | valor |
| ---- | ----- |
| paquete | `@alephscript/skills-scriptorium` |
| versión | rango **`0.x`** (pin solo de major; la efectiva la fija `package-lock.json`) |
| skills | `skills/swarm-orquestacion` (SKILL.md + `reference/roles/` + plantilla de reporte) · `skills/vigilancia` (estación read-only) |
| registry | `https://npm.scriptorium.escrivivir.co` |

Consulta / instalación (resoluble por registry, sin copiar los prompts):

```bash
# comprobar qué versiones resuelve el rango
npm view @alephscript/skills-scriptorium@0.x \
  --registry=https://npm.scriptorium.escrivivir.co version

# traer el paquete a un runner
npm install @alephscript/skills-scriptorium@0.x \
  --registry=https://npm.scriptorium.escrivivir.co
```

Los prompts de rol (ORQUESTADOR, WORKER, REVISION, CORRECCION, BRIEF, README)
y la plantilla de reporte son los de `skills/swarm-orquestacion/reference/`
del paquete en la versión fijada. Un runner los consume tal cual desde el
paquete; este árbol no los duplica. Las reglas de oro genéricas — incluida
«un WP = un chat worker = una rama = (si hay paralelo) un worktree», el
BACKLOG como propiedad exclusiva del orquestador y la evidencia literal —
las fija ya el paquete y aquí no se repiten. `skills/vigilancia` define la
estación de vigilancia read-only (pulso, addendas dos caras, re-verificación
post-merge de CA).

## Calibración local de zeus (delta sobre el canónico)

Lo que el protocolo genérico NO fija y este mundo sí. Queda visible aquí sin
abrir el paquete:

### 1. Dos backlogs, nunca mezclados

El genérico asume «un BACKLOG = el mundo». Este repo tiene dos:

- `plan/BACKLOG.md` — la **refundación del SDK** (tablero del orquestador,
  vive en `main`).
- `packages/games/delta/spec/BACKLOG.md` — las **features del juego delta**
  (fases 1.6 y 2).

Un WP trabaja en uno u otro, **nunca mezcla ambos**. Mezclarlos = devolución.

### 2. Adaptador de evidencia CI (GitHub Actions vía `gh`)

El genérico exige evidencia literal pero no fija el canal. Aquí:

- Canónico de evidencia remota: **CLI `gh`** (`gh run list --branch <rama>` /
  `gh run view`) → citar **run_id + conclusion**. No es obligatorio MCP ni
  Automations, y no se inventan como gate (PRACTICAS §5).
- **paths-ignore U104**: si el diff solo toca `plan/**` / `**.md`, CI **no
  corre** → evidencia = **N/A** (no se inventa un verde ni se bloquea por
  ausencia de run).
- Verde local (`lint` / `gates` / tests) **no** sustituye el gate remoto
  cuando el runner aplica. Tip de `main` sin run asociado = push faltante.
- `docs/**` tiene workflow **Docs** propio, con despliegue en dominios
  propios: `z-sdk.escrivivir.co` (portal zeus) y `games.z-sdk.escrivivir.co`
  (catálogo de la library). Lo desplegado se verifica contra ese canal real
  (C8, PRACTICAS §8), no solo con build local.

### 3. Límites Actions del swarm

| Prohibido | Quién puede |
| --------- | ----------- |
| Volcar secrets (`NPM_*`, tokens) en reportes o chat | nadie del swarm |
| `workflow_dispatch` de publish / release | solo ops / usuario |
| Inventar MCP / Automations / Cursor-in-CI como gate | nadie (no son canónicos) |

### 4. Dónde vive el estado (concreción zeus)

- **`plan/BACKLOG.md` es del orquestador y vive en `main`** (🔶 al asignar,
  ✅ al aceptar; el worker no lo edita nunca).
- **El reporte vive en la rama del WP**, creado desde
  [`REPORTES/PLANTILLA.md`](../REPORTES/PLANTILLA.md) — la plantilla local
  añade la subsección **Evidencia CI** (§2 de esta calibración).
- **`plan/DECISIONES.md` §abiertas**: el custodio es **el usuario**.
- **Handoffs** (`ENTREGA-*`, paquetes WEBS): al aceptar el lote se archivan
  en [`REPORTES/entregas/`](../REPORTES/entregas/); la raíz de `plan/` queda
  solo con canónicos.
- **Ciclo de sprint** (GO explícito de lote, estado declarado
  `IDLE sin pendientes` / `esperando: <tick> de <quién>`, retro a cola
  residual): [PRACTICAS §7](../PRACTICAS.md).

### 5. Semver integrado en CI/CD

Los commits convencionales no son cosmética: alimentan changesets → changelog
→ `npm publish` del pipeline de release (PRACTICAS §6, ARQUITECTURA §5).
WP que toque paquete publicable ⇒ changeset obligatorio.

## Runners / IDEs

Ningún IDE lleva adaptador propio en el repo (decisión usuario
2026-07-20: sin carpetas de IDE con markdown). Todo runner — Cursor,
Claude Code, CI u otro — consume el protocolo desde el paquete en
`node_modules` (más, si el runner lo soporta, un espejo local generado
con `npm run skills:sync`, fuera de git).

**Regla 15** (`reglas-metodo-v04` del paquete, contrato vigente; cita:
regla 15): el plan trazado en git es la **única** fuente de verdad. La
memoria interna del agente y los markdowns/notas de sesión bajo carpetas
de IDE (`.claude/`, `.cursor/`, …) son **efímeros** — no se citan ni se
dejan como verdad paralela. Se conserva solo la **configuración funcional**
(json/toml, tasks, MCP). Zeus ya aplica esto de facto (U148 demolió
residuos IDE; `.claude/` gitignorado).