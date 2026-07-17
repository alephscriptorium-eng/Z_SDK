# Método playbook (CASOS)

Un juego sin `CASOS.md` + acta de validación no tiene release. El método:

1. **Agente** ejecuta la mitad MCP-verificable (tools + resources).
2. **Humano** verifica el checklist visual.
3. Cada ⚠️ / ❌ / 💡 genera tarea trazable.

Producto del SDK: [`@zeus/playbook-kit`](/engine/playbook-kit).

## Forma de un caso

Secciones markdown `## C-xx — título` con:

- Precondición
- Pasos del agente (llamadas `` `tool {json}` ``)
- Qué observa el humano
- Criterio de éxito
- Errores esperados

## Runner

```bash
npm exec -w @zeus/playbook-kit -- zeus-playbook-run \
  --casos packages/arg/spec/CASOS.md \
  --check

npm exec -w @zeus/playbook-kit -- zeus-playbook-run \
  --casos packages/arg/spec/CASOS.md \
  --ids C-01,C-03 \
  --game delta \
  --out /tmp/acta-delta.md
```

Playbooks de referencia: `packages/arg/spec/CASOS.md`,
`packages/games/pozo/spec/CASOS.md`.
