# Cursor — adaptador del protocolo de swarm

Reglas compartidas por git para quien clone **zeus-sdk** y use Cursor. Son el
**adaptador Cursor** del protocolo de swarm: la fuente de verdad es
[`plan/roles/`](../plan/roles/README.md) (agnóstico de herramienta); estas
reglas solo lo refuerzan según contexto — si contradicen a `plan/`, gana
`plan/`.

## Reglas automáticas (`.cursor/rules/`)

| Regla | Cuándo aplica |
| ----- | ------------- |
| `swarm-context.mdc` | Siempre — roles, fuentes de verdad, enlaces |
| `swarm-worker-code.mdc` | Al editar `packages/**`, `e2e/**`, `scripts/**` |
| `swarm-plan-artifacts.mdc` | Al editar `plan/**` |

**Limitación:** las rules no detectan la rama git (`wp/*`) ni el worktree.
Para encender un rol concreto, `@`-menciona el prompt:
`@plan/roles/ORQUESTADOR.md` o `@plan/roles/WORKER.md`.

## Flujo recomendado

1. Orquestador: `@plan/roles/ORQUESTADOR.md`
2. Worker (chat nuevo, worktree propio si hay paralelo):
   `@plan/roles/WORKER.md` + brief de `@plan/roles/BRIEF.md`
3. Las rules refuerzan PRACTICAS mientras el agente edita código o `plan/`

Ver también [`plan/roles/README.md`](../plan/roles/README.md) y
[`plan/README.md`](../plan/README.md).
