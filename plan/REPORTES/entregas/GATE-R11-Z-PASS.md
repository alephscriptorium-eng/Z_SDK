# GATE · R11-Z PASS · cierre Sprint 8 · 2026-07-24

## Veredicto

**R11-Z PASS. Ola B y Sprint 8 quedan cerrados.**

U164 ✅ · U166 ✅ → U165 ✅. Este PASS no autoriza publicación.

## Evidencia

- Tip código final U165: `289b7fe9c8a77e59ba747c6bc2f4f3c01aed6ad4`.
- HEAD auditado: `6ad16c46fda67dcbf93248de4b0384e222dbc2a6` =
  `origin/main`; working tree limpio.
- CI `30088694250`: success sobre `88a9568`, que contiene `289b7fe`.
- Smoke registry `89466799397`: success.
- `semver: ^7.8.5` está declarado en devDependencies raíz.
- `package-lock.json` contiene la declaración directa y
  `node_modules/semver@7.8.5`.
- `npm ls semver --depth=0`: `semver@7.8.5`, exit 0.
- `npm run gate:publish-ready`: P0×4 PASS.
- Probes `star`, `latest`, `git`, `url`, `windows-path` y
  `missing-version`: exit 1 cada uno.
- `npm run gates`: OK.
- `private` intacto; cero changesets de publicación, cambios de workflow
  publish y `npm publish`.
- Worktrees: solo checkout principal; `.worktrees/z` vacío; ramas `wp/*`,
  stash y locks: cero.
- DC-15: LOCAL-ONLY.

## Observación no bloqueante

El `npm install --save-dev semver` regeneró también snapshots del lock que
estaban atrasados respecto de manifests aceptados en WPs anteriores
(versiones y pines internos). El resultado coincide con el árbol actual y el
`npm ci` de CI pasó. R12-Z debe incorporar un CA de coherencia de lock por WP
que modifique manifests, para evitar acumulación silenciosa.

## Fronteras posteriores

- P0×4 están preparados y medidos, todavía `private: true`.
- `linea-editor` permanece candidato P1, no publish-ready.
- `console-monitor` y `blobstore-client` permanecen privados.
- Flip `private`, changesets, release y publish requieren GO separado.
- Las mejoras retroactivas R12-Z esperan idle del swarm; no abrir ahora.

## Decisión del custodio

Ninguna decisión necesaria para cerrar Sprint 8. Esperar aviso de idle antes
de aplicar el GO de planificación R12-Z ya concedido.

## Handoff copiable al orquestador-Z

```text
R11-Z PASS.

Sprint 8 CERRADO:
- U164 ✅
- U166 ✅
- U165 ✅
- CI 30088694250 success
- smoke 89466799397 success
- semver root directa + lock
- gate P0x4 PASS
- probes x6 FAIL esperado
- higiene PASS

No private, no changesets de publicación, no release, no publish.
linea-editor sigue P1 pendiente.

Mantener IDLE. No abrir R12-Z hasta aviso de idle del custodio.
En R12-Z añadir CA: todo WP que cambie manifests verifica/actualiza lock
en el mismo alcance.
DC-15 LOCAL-ONLY.
```
