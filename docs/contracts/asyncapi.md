# AsyncAPI — contrato de room

El AsyncAPI del **contrato único** se genera desde `@zeus/protocol`, no a
mano.

```bash
npm run spec:generate              # → packages/lib/protocol/spec/asyncapi.yaml
npm run spec:asyncapi:html         # → docs/public/api/protocol/ (gitignored)
```

- Guía del contrato: [engine/protocol](/engine/protocol)
- Render HTML (tras `docs:build` o `spec:asyncapi:html`):
  **[Abrir AsyncAPI HTML](/api/protocol/)**

El portal **enlaza** ese HTML generado; no reinventamos el generador
(`scripts/spec-asyncapi-html.mjs`).
