# Session Protocol AsyncAPI Spec

Artifact histórico de la sesión Scriptorium. La generación canónica del
contrato único pasó a `@zeus/protocol` (WP-U10). Este YAML + `build.mjs`
quedan para tests internos del paquete hasta WP-U31 (demolición completa).

## View locally (contrato único)

```bash
npm run spec:studio   # AsyncAPI de @zeus/protocol
npm run spec:asyncapi:html
```

## Design notes (sesión — muere en U31)

- **No rooms**: the global XState actor is intentional (collaborative deck).
- **Editor-ui ghost events** are not part of this protocol.
- **wikitext:poll** is deprecated; prefer server-side wait after `wikitext:cache`.
