# Changelog

All notable changes to this **world's governance plane** (plan / swarm) are
documented here. Format: [Keep a Changelog](https://keepachangelog.com/).

This file is the **gobierno** changelog (derived from `plan/BACKLOG.md` and
`plan/BACKLOG-HISTORICO.md`). It is **not** a package changelog: per-package
`packages/*/CHANGELOG.md` files remain changesets-owned and are untouched.

Granularity: **coarse by ola / sprint** (aggregated ✅ WPs), not WP-by-WP
prose.

---

## [Unreleased]

### Changed

- Sprint 8 Ola B — corrección de planificación post-R9-Z: U165 solo lee
  allowlist; U166 posee enmiendas P1; orden `U164 ∥ U166` → U165 último
  + re-gate; U164–U166 siguen ⬜ (pedido R10-Z; sin GO implementación).
- Baseline de skills `@alephscript/skills-scriptorium` **0.3.3 → 0.3.4**
  (rango `0.x`, D-36; mecánico sin WP). 0.3.4 resuelve 3/4 puntos del
  handoff de zeus (semver DC-22, gate gobierno DC-23, back-links tema
  DC-24); Punto 4 (parser) sigue abierto en el mundo del paquete (su
  DC-25). Disponible pero **no cableado** aún: gate `verificar-changelog
  --role gobierno` (candidato follow-up para validar nuestro CHANGELOG).

---

## [Sprint 8 Ola A] — 2026-07-24

Publish-ready mesh · R8-Z PASS + GO Ola A · **U163 ✅ ∥ U167 ✅**.
Frontera: sin flip `private` · sin changesets de pub · sin `npm publish`.
Ola B (U164–U166) retenida sin GO.

### Added

- WP-U163 — POC publish-ready `@zeus/linea-system` (plantilla P0:
  `publishConfig.registry`, `files`, pines `@zeus/*`, JS-only, pack
  dry-run medible).

### Changed

- WP-U167 — triage P1 `@zeus/blobstore-client` **vía B**: democión a
  «mantener privado» (allowlist §3/§4 + `audit:publish-allowlist`
  coherente; acoplamiento harness / D-22).

---

## [Sprint 6] — 2026-07-20

Proyección backlog→Issues (skills 0.3.3) · GO usuario · D-38.

### Added

- WP-U154 — proyección `backlog→Issues` cableada (dry-run local,
  LOCAL-ONLY DC-15); gate de ceguera probado (exit 3/1/0/4);
  `plan/.sync-map.json` inicial. Baseline skills `0.3.1 → 0.3.3` (D-36).

### Changed

- D-38/D-39 — `CEGUERA_PATTERN` de gobierno: `custodio`/`vigía`/`vigilante`
  y `addenda` son publicables (roles de método + capa editorial de
  dominio); patrón residual `mediaci|marco|§interna|instancia-ejemplo`.

---

## [Sprint 5] — 2026-07-20

Adopción baseline skills 0.3.1 · D-37.

### Added

- WP-U149 — baseline `skills-scriptorium@0.3.1` + cita regla 15
- WP-U150 — gate `verificar-sitio.mjs` en Docs CI + slug `Z_SDK`
- WP-U151 — CHANGELOG de gobierno (grueso por ola/sprint)
- WP-U152 — docs página Proyecto + back-links por tema (`SITE_BACK`)
- WP-U153 — estación local de vigilancia (wrappers + checks 0.3.1)

---

## [Sprint 4] — 2026-07-20

Skills referencia versionada (`@alephscript/skills-scriptorium`) · D-35 / D-36.

### Added

- WP-U145 — dep registry `skills-scriptorium@0.3.0` (luego rango `0.x` · D-36)
- WP-U146 — `plan/roles/` → referencia versionada + calibración zeus
- WP-U147 — `.claude/skills/` runner local (`skills:sync`, gitignorado)
- WP-U148 — micro demolición `.cursor/` + copilot-instructions

---

## [Sprint 3] — 2026-07-19

GO I50 · D-33 / D-34.

### Added

- WP-U142 — recepción / triage §Nota Sprint 3
- WP-U143 — CNAME `docs/public/` (portal + catálogo)
- WP-U144 — consulta `npm ci` vs `npm install` (docs.yml catálogo)

---

## [Micros post-AMEND] — 2026-07-19

D-27 … D-32.

### Added

- WP-U135 — protocolo / ritual GitHub Actions
- WP-U136 — C8 residual startpacks
- WP-U138 — bug nav API HTML (SPA)
- WP-U139 — bug API links cuerpo md (SPA)
- WP-U140 — higiene rutas absolutas locales
- WP-U141 — ceguera token en reporte U140

### Removed

- WP-U137 — N/A (premisa incorrecta: Docs deploy saltado ≠ verde)

---

## [AMEND Sprint 2] — 2026-07-19

CAPA rev2 / verdad de canales · D-26.

### Changed

- WP-U132 — correctivo W-B′ (library docs · CAPA rev2)
- WP-U133 — C8 + C9 como criterio estándar de WPs de docs → PRACTICAS
- WP-U134 — archivar ENTREGA-* + regla de archivo

---

## [Sprint 2] — 2026-07-19

ADDENDA + CAPA · D-25.

### Added

- WP-U124 — CAPA W-A en `docs/index.md`
- WP-U125 — CAPA W-B en library/docs
- WP-U126 — `release-startpack.yml` (library)
- WP-U127 — higiene worktrees library
- WP-U128 — deps `@zeus/*` caret semver (library)
- WP-U129 — URL repo en `docs/guide/estado.md`
- WP-U130 — formalizar ciclo de sprint (PRACTICAS / roles)
- WP-U131 — docs regeneración web / publicar la web

---

## [Sprint 1] — 2026-07-18

Bug-fixing / CI · D-24.

### Added

- WP-U119 — CI main verde
- WP-U120 — prosa zeus docs
- WP-U121 — prosa library docs
- WP-U122 — registry password auth

### Changed

- WP-U55 ∥ WP-U123 — publish real → demoler deps `file:`

---

## [Post-U87 + estabilización] — 2026-07-18

### Added

- WP-U109–U117 — micro + editor + schema (post-U87)
- WP-U118 — estabilización mesa plan (archivo histórico)

---

## [Olas 0–10] — 2026-07-17 → 2026-07-18

Refundación por olas (detalle en `plan/BACKLOG-HISTORICO.md`).

### Added

- **Ola 0** — suelo firme: U00 gates · U01 tests núcleo · U02 identidad delta · U03 Z_SDK+CI · U102 tests herméticos CI
- **Ola 1** — contrato único / engine nace (U10–U13 y núcleo)
- **Ola 2** — un solo motor de vistas (U20–U24)
- **Ola 3** — un solo juego / session wire (U30–U32 · U56)
- **Ola 4** — resource/REST-driven (U40–U41)
- **Ola 5** — monorepo publicable + layout (U50–U54 · U51 layout)
- **Ola 6** — Z_SDK-games-library (U60–U62)
- **Ola 7** — plano de datos / volúmenes (U80–U84)
- **Ola 8** — feeds federados (U85)
- **Ola 9** — mundo del dramaturgo (U86–U87)
- **Ola 10** — peers WebRTC (U88–U90 · U93) + higiene remate D-22 (U103–U108 docs/CI/publish)

Fuente: agregación del tablero vivo (`plan/BACKLOG.md` remate) y del
histórico archivado (`plan/BACKLOG-HISTORICO.md`). Sin prosa inventada.
