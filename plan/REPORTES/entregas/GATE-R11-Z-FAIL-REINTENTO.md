# GATE · R11-Z FAIL · reintento U165 · 2026-07-24

## Veredicto

**R11-Z FAIL técnico, corrección mínima pendiente.**

La lógica solicitada en el FAIL anterior ya funciona. El bloqueo restante es
la dependencia directa no declarada que esa corrección introdujo.

## Evidencia verde

- Tip código: `b550510f33dca98edb394fe1caa8ee8a157bd9e9`.
- HEAD `f62556606e0c8f258e472fe3c96ffecf7e1d4667` =
  `origin/main`; working tree limpio.
- CI `30085114674`: success; smoke registry `89455353450`: success.
- Re-gate P0×4 re-ejecutado: PASS.
- Probes re-ejecutados: `star`, `latest`, `git`, `url`, `windows-path` y
  `missing-version` devuelven exit 1.
- `classifyZeusVersion()` exige `semver.valid()` exacto.
- `npm view <dep>@<pin>` comprueba resolución en el registry canónico.
- Allowlist, manifests P0, `private`, `.changeset/**` y workflows no fueron
  modificados.
- Worktrees, ramas `wp/*`, stash y locks: cero.

## Bloqueo

`scripts/gate-publish-ready.mjs` carga:

```text
const semver = require('semver');
```

pero el `package.json` raíz no declara `semver` en dependencies ni
devDependencies.

Comprobación:

```text
npm ls semver --depth=0
zeus-sdk@0.1.0 C:\S_LAB\z-sdk
└── (empty)
exit 1
```

El comando funciona hoy porque otra dependencia instala/eleva `semver`
transitivamente. Ese hoisting no es contrato: un cambio ajeno del lock puede
romper el gate aunque U165 no cambie.

## Corrección requerida

Dentro del mismo U165:

1. Declarar `semver` como dependencia de desarrollo directa del root mediante
   el package manager y actualizar el lock coherentemente.
2. Verificar `npm ls semver --depth=0` verde.
3. Re-ejecutar P0×4, los seis probes, gates, lint y CI.
4. Mantener intactas las fronteras de publicación.

Automatizar los probes en CI es recomendable, pero no bloquea este reintento:
el brief permitía gate opt-in y existe evidencia literal reproducida.

## Decisión del custodio

**No hace falta GO nuevo:** sigue siendo corrección del CA U165. No dar GO
publish.

## Handoff copiable al orquestador-Z

```text
R11-Z reintento: FAIL técnico mínimo.

La validación semver/C8 y los 6 probes ya pasan.
Bloqueo único:
- gate-publish-ready requiere "semver"
- root package.json no lo declara
- npm ls semver --depth=0 = empty / exit 1
- hoy funciona solo por hoisting transitivo

Reabrir U165:
1. añadir semver como devDependency directa con package manager
2. actualizar lock
3. npm ls semver --depth=0 debe quedar verde
4. re-gate P0x4 + probes + gates + lint + CI

No WP ni GO nuevos.
No private, no changesets de publicación, no publish.
Después pedir nuevo reintento R11-Z.
DC-15 LOCAL-ONLY.
```
