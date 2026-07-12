# Session Protocol AsyncAPI Spec

Generated artifact — **do not edit `asyncapi.yaml` by hand**.

## View locally

From repo root:

```bash
npm run spec:studio   # http://localhost:3210 (on-disk asyncapi.yaml)
```

With **player-ui** running (`npm run start:player`), the live spec is also at `http://localhost:3013/spec/asyncapi.json` and the session console uses `/spec/session-manifest.json`. See [Runtime API docs](../../../../docs/reference/runtime-api-docs.md) in the docs portal.

VS Code: **Terminal → Run Task → Spec ▸ asyncapi-studio**.

## Regenerate

```bash
npm run spec:generate -w @zeus/session-protocol
```

## Design notes

- **No rooms**: the global XState actor is intentional (collaborative deck). Revisit if multi-audience sessions are needed.
- **Editor-ui ghost events** (`preset:updated`, `mcp-server-status-changed`, etc.) are not part of this protocol; a future editor namespace could use `attachNamespaceServer`.
- **wikitext:poll** is deprecated; prefer server-side wait after `wikitext:cache`.
