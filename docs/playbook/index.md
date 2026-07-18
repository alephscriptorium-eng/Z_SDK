# Método playbook (CASOS)

Un juego con release lleva `CASOS.md` + acta de validación. El método:

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

Desde la library (playbooks de delta/pozo):

```bash
cd ../Z_SDK-games-library
npm exec -w @zeus/playbook-kit -- zeus-playbook-run \
  --casos packages/delta/spec/CASOS.md \
  --check
```

```bash
cd ../Z_SDK-games-library
npm exec -w @zeus/playbook-kit -- zeus-playbook-run \
  --casos packages/delta/spec/CASOS.md \
  --ids C-01,C-03 \
  --game delta \
  --out /tmp/acta-delta.md
```

Playbooks de referencia en la library: `packages/delta/spec/CASOS.md`,
`packages/pozo/spec/CASOS.md`.
