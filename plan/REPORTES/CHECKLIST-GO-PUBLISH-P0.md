# Checklist · GO publish P0×4 (D-42)

Uso: runbook **antes** del publish real de
`@zeus/linea-system` · `@zeus/linea-firehose` · `@zeus/force-system` ·
`@zeus/ssb-system`. **No** ejecutar los pasos de flip/publish desde
U171; solo tras cumplir D-42 completo + tip con runners verdes.

## Precondiciones (D-42)

- [x] skills `@alephscript/skills-scriptorium@0.10.0` adoptado/validado
- [x] R12-Z PASS + GO implementación U168–U171
- [x] U168–U171 ✅
- [x] major-band aplicada (U168) + gate adaptado verde (U169)
- [x] contrarrevisión independiente PASS en WPs de riesgo
- [x] changesets de pub **reales** creados (fase publish; `.changeset/d42-go-publish-p0x4.md`)
- [x] matriz CI/Release completa de tip (pre-GO: CI×3 + Release `30131689030`)
- [x] gate local publish-ready / R14-Z PASS (C8 registry = post-publish)
- [x] tarballs limpios · contratos JS-only documentados
- [x] **R14-Z PASS** + **GO publish FINAL** custodio 2026-07-25

## Prep local (sin publish)

- [x] `npm run gate:publish-ready` → OK P0×4
- [x] fail-probes ×6 → exit 1 cada uno (U169 / R14)
- [x] `npm pack --dry-run` ×4 (workspaces P0) — OK 8/6/8/11 files
- [x] `release:changeset-dry` **omitido** (script restaura solo
      `packages/engine/**`; P0×4 mesh → pack dry-run ×4)
- [x] Flip `private: false` deliberado en tip `b717123` (solo P0×4)

## Secuencia GO publish (GO FINAL **DONE** · 2026-07-25)

1. [x] Tip limpio = `origin/main`; higiene worktrees.
2. [x] Flip `private: false` **solo** en los cuatro P0 — `b717123`.
3. [x] Changesets de release P0×4 — `e873376` (+ relanzar `64175cb`).
4. [x] Release → Version PR **#54** (`30134377681`) → merge `e8c5ac2` →
   publish Release **`30134579637`** · CI **`30134579623`**.
5. [x] **No** `npm publish` manual.
6. [x] C8: `npm view` ×4 → **0.1.1** (registry propio).
7. [x] Run-ids + versiones en
   [AVISO-PUBLISH-FINAL-P0-DONE.md](entregas/AVISO-PUBLISH-FINAL-P0-DONE.md).
8. [ ] Sello Rn-Z / gate online post-publish — si el custodio lo exige.

## Fuera de alcance

- `@zeus/linea-editor` → U178 (GO propio)
- Clases privadas por producto (D-42 §c) → sin flip
- R13 / U172–U177 / U73 → carril aparte
