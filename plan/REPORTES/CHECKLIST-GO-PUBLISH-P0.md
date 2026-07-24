# Checklist · GO publish P0×4 (D-42)

Uso: runbook **antes** del publish real de
`@zeus/linea-system` · `@zeus/linea-firehose` · `@zeus/force-system` ·
`@zeus/ssb-system`. **No** ejecutar los pasos de flip/publish desde
U171; solo tras cumplir D-42 completo + tip con runners verdes.

## Precondiciones (D-42)

- [ ] skills `@alephscript/skills-scriptorium@0.10.0` adoptado/validado
- [ ] R12-Z PASS + GO implementación U168–U171
- [ ] U168–U171 ✅
- [ ] major-band aplicada (U168) + gate adaptado verde (U169)
- [ ] contrarrevisión independiente PASS en WPs de riesgo
- [ ] changesets de pub **reales** creados (fase publish; no en U171)
- [ ] matriz CI/Release completa de tip
- [ ] gate online / C8 pre-pub verde
- [ ] tarballs limpios · contratos JS-only documentados

## Prep local (sin publish)

- [ ] `npm run gate:publish-ready` → OK P0×4
- [ ] fail-probes ×6 → exit 1 cada uno
- [ ] `npm pack --dry-run` ×4 (workspaces P0)
- [ ] `npm run release:changeset-dry` con changesets pendientes (cuando existan)
- [ ] `private: true` aún presente hasta el flip deliberado

## Secuencia GO publish (futuro · no U171)

1. Tip limpio = `origin/main`; higiene worktrees.
2. Flip `private: false` **solo** en los cuatro P0 (commit dedicado).
3. Crear changesets de release para los cuatro (bump patch/minor según
   política); **no** mezclar con U178 ni clases excluidas.
4. Push a `main` → workflow **Release** (paths `.changeset/**` +
   `packages/**`) ejecuta quality+test+publish automático del pipeline.
5. **No** `npm publish` manual en workstation.
6. Verificar C8: `npm view @zeus/<pkg> version --registry
   https://npm.scriptorium.escrivivir.co` ×4.
7. Documentar run-ids CI + Release + versiones publicadas.
8. Pedir sello Rn-Z / gate online post-publish si el custodio lo exige.

## Fuera de alcance

- `@zeus/linea-editor` → U178 (GO propio)
- Clases privadas por producto (D-42 §c) → sin flip
- R13 / U172–U177 / U73 → carril aparte
