# plan/roles — el protocolo del swarm

Prompts de rol **agnósticos de herramienta**: definen el protocolo (quién hace
qué, dónde vive el estado, cómo se entrega). Cualquier runner de agentes los
consume tal cual — en Cursor se `@`-mencionan; el adaptador específico de
Cursor vive en [`.cursor/rules/`](../../.cursor/README.md) y solo *refuerza*
esto, nunca lo contradice. Si algún día hay otro cliente (Claude Code, CI…),
se le escribe otro adaptador; el protocolo es este.

## Roles

| Prompt | Rol | Cuándo |
| ------ | --- | ------ |
| [ORQUESTADOR.md](ORQUESTADOR.md) | Orquestador | Chat principal: estado, asignación, revisión, ✅ |
| [WORKER.md](WORKER.md) | Worker | Chat nuevo por WP: implementar + reportar |
| [REVISION.md](REVISION.md) | Orquestador | Revisar un entregable concreto (reporte + diff) |
| [CORRECCION.md](CORRECCION.md) | Worker | Tras devolución: corregir en la misma rama |
| [BRIEF.md](BRIEF.md) | Orquestador → usuario | Plantilla de brief para lanzar un worker |

## Dónde vive el estado (la regla que evita el caos)

- **`plan/BACKLOG.md` es del orquestador y vive en master.** Marca 🔶 al
  asignar (con agente y fecha) y ✅ al aceptar. **El worker no edita BACKLOG
  nunca** — su 🔶 en una rama no lo vería nadie.
- **El reporte vive en la rama del WP** (`plan/REPORTES/WP-….md`): nombre de
  archivo único = sin conflictos; llega a master con el merge tras el ✅.
- **`plan/DECISIONES.md` §abiertas es del usuario.** Nadie más cierra
  decisiones.

## Paralelismo real: worktrees

Varios chats worker comparten máquina y repo: **una rama por chat no basta,
hace falta un working tree por chat**. Antes de lanzar un worker paralelo:

```bash
git worktree add ../zeus-wp-u00 -b wp/u00-gates
# el chat worker trabaja en ../zeus-wp-u00 (npm install allí la primera vez)
# al aceptar y mergear: git worktree remove ../zeus-wp-u00
```

Un solo worker activo puede trabajar en el checkout principal con su rama.
Si no se quiere usar worktrees, los workers van en serie, no en paralelo.

## Flujo

```text
1. Chat orquestador (ORQUESTADOR.md) → «Estado del swarm»
2. Orquestador propone lote, marca 🔶 en master y rellena un BRIEF por WP
3. Usuario abre N worktrees + N chats worker (WORKER.md + brief)
4. Worker termina → reporte en plan/REPORTES/ (en su rama) → avisa
5. Chat orquestador (REVISION.md + reporte + rama) → ✅ y merge, o devolución
6. Si devuelto: mismo chat worker (CORRECCION.md + comentarios del reporte)
```

## Ciclo de sprint

Formalizado en [PRACTICAS.md §7](../PRACTICAS.md):

1. **Entrada** — lote con GO explícito del usuario (sin GO → sin 🔶 de lote).
2. **Ejecución** — WPs con CA; Devuelto legítimo; 1 WP = 1 chat = 1 rama.
3. **Cierre** — estado declarado siempre:
   `IDLE sin pendientes` **o** `esperando: <tick> de <quién>` — nunca silencio.
4. **Retro** — hallazgos → cola residual viva; no colas por WP en el tablero.

El remate de `BACKLOG.md` y el acta del sprint (si hay carpeta `ENTREGA-…`)
usan esa fórmula al cerrar o pausar.

## Reglas de oro

1. Un WP = un chat worker = una rama = (si hay paralelo) un worktree.
2. Solo el orquestador escribe en BACKLOG; solo el usuario cierra DECISIONES.
3. No mezclar refundación (`plan/`) con features de delta
   (`packages/games/delta/spec/BACKLOG.md`) en un mismo WP.
4. El historial del chat orquestador no se asume en los workers: el brief +
   `plan/` bastan.
5. ✅ implica autorización de merge. Orden de merge lo sugiere la revisión;
   mergea el usuario (o el orquestador si el usuario lo delega).
6. Commits en formato convencional (PRACTICAS §6): alimentan el changelog y
   el semver del pipeline de release (ARQUITECTURA §5).

## Primer lote sugerido (Ola 0, paralelo)

WP-U00 (gates) · WP-U01 (tests núcleo) · WP-U02 (identidad delta) ·
WP-U03 (push a Z_SDK + CI). Orden de merge si hay conflictos:
U02 → U01 → U00 → U03.
