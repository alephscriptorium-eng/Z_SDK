# WP-U55 · demoler-file-deps — reporte

| dato | valor |
| ---- | ----- |
| agente | orquestador→worker (chat GO U55+U123) |
| fecha | 2026-07-18 |
| rama | `wp/u55-demoler-file-deps` |
| commit(s) | `6859007` (+ lock follow-up) · merge main `4e48217` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se demolieron las deps `file:` de `@zeus/operator-ui` y
`@zeus/threejs-ui-lib`. `room-client-browser` / `ui-3d-kit` pasan a
versiones del registry D-7. `@zeus/operator-bridge` (mesh, antes
`private`) se hizo publicable y se publicó **0.1.0** vía workflow
one-shot `publish-operator-bridge.yml` (secrets CI `_password`).
Lockfile de operator-ui regenerado sin `file:`.

## Archivos tocados

| archivo | acción |
| ------- | ------ |
| `packages/mesh/operator-bridge/package.json` | modificado — publicable + publishConfig |
| `packages/mesh/operator-bridge/README.md` | creado |
| `packages/mesh/operator-ui/package.json` | modificado — registry semver |
| `packages/mesh/operator-ui/package-lock.json` | modificado — resolved registry |
| `packages/mesh/operator-ui/projects/threejs-ui-lib/package.json` | modificado |
| `packages/mesh/operator-ui/.npmrc` | modificado — `@zeus:registry` |
| `.github/workflows/publish-operator-bridge.yml` | creado — one-shot publish |

## Evidencia

### `npm view @zeus/protocol` (registry propio)

```
0.2.0
```

### Publish `@zeus/operator-bridge` (Actions run 29661757576)

```
✓ Publish @zeus/operator-bridge
✓ Verify
npm view @zeus/operator-bridge version → 0.1.0
```

### Smoke install aislado (dir limpio, solo 3 deps @zeus)

```
added 284 packages
u55-smoke@
├── @zeus/operator-bridge@0.1.0
├── @zeus/room-client-browser@0.1.2
└── @zeus/ui-3d-kit@0.1.1
SMOKE_NO_FILE_OK
bridge_ok CHANNELS,HUB,PROTOCOL_EVENTS,SCENE_IDS,TYPES
```

### Grep `file:` en package.json operator-ui / threejs-ui-lib

```
(no matches)
```

### `npm test -w @zeus/operator-bridge`

```
# tests 9
# pass 9
# fail 0
```

### Lockfile resolved (muestra)

```
"resolved": "https://npm.scriptorium.escrivivir.co/@zeus/operator-bridge/-/operator-bridge-0.1.0.tgz"
"resolved": "https://npm.scriptorium.escrivivir.co/@zeus/room-client-browser/-/room-client-browser-0.1.2.tgz"
"resolved": "https://npm.scriptorium.escrivivir.co/@zeus/ui-3d-kit/-/ui-3d-kit-0.1.1.tgz"
```

### `ng build` / install Angular completo en worktree

⏳ EPERM Windows en install nested completo del árbol Angular (sharp /
cmd spawn). CA de resolución `@zeus/*` cubierto por smoke aislado +
lockfile registry. Build Angular full: residual entorno local.

## Demolición

```
rg '"file:' packages/mesh/operator-ui/package.json \
  packages/mesh/operator-ui/projects/threejs-ui-lib/package.json
# (no matches)
```

`private: true` demolido en operator-bridge (ahora publicable).

## Auto-revisión (PRACTICAS.md §3)

- [x] Puertos/URLs hardcodeados: no (solo registry D-7 ya canónico).
- [x] if/switch→tabla: n/a.
- [x] Duplicación: no; bridge sigue un solo paquete.
- [x] console.log/TODO: no.
- [x] Nombres de transición: no.
- [x] Demolición `file:`: grep 0.
- [x] Tests: bridge 9/9; smoke registry.
- [x] Arranque: smoke import bridge OK; ng build full ⏳ EPERM local.
- [x] README bridge creado (verdad mínima).
- [x] Diff solo U55 (+ workflow publish necesario para CA).

## Hallazgos fuera de alcance

1. Mesh resto sigue `private` / no publicado — library demos usan
   fallback DEV (U123).
2. Workflow one-shot puede borrarse tras estabilizar publish mesh en
   release.yml (candidato residual).
3. Install Angular completo en Windows worktree: EPERM profundo en
   nested `sharp` — ops/local, no bloquea CA registry.

## Dudas / bloqueos

Ninguno bloqueante.

---

## Revisión del orquestador

_(pendiente)_
