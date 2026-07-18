# AsyncAPI — contrato de room

El AsyncAPI del **contrato único** se genera desde `@zeus/protocol`.

```bash
npm run spec:generate
npm run spec:asyncapi:html
```

Salida: `packages/engine/protocol/spec/asyncapi.yaml` y
`docs/public/api/protocol/` (gitignored).

- Guía del contrato: [engine/protocol](/engine/protocol)
- Render HTML (tras `docs:build` o `spec:asyncapi:html`):
  **[Abrir AsyncAPI HTML](/api/protocol/)**

El portal enlaza ese HTML generado (`scripts/spec-asyncapi-html.mjs`).