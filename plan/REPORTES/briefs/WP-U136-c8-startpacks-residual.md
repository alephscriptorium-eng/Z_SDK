# Brief — WP-U136 · Fix C8 residual `docs/startpacks.md`

_Plantilla: `plan/roles/BRIEF.md`. Pegar con `plan/roles/WORKER.md`._

Origen: **D-28** · GO **usuario** (lote AMEND D-26–D-28). Hallazgo C8
del vigilante (hallazgo ≠ GO). Residual C8 de U132 (cola).
Repo principal: `Z_SDK-games-library`. **U137 cerrado N/A** — no paralelo.

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U136 · Alinear fence Registry startpacks con patrón 2c / C8
Rama zeus: wp/u136-c8-startpacks-residual
Worktree zeus: .worktrees/wp-u136-c8-startpacks-residual
Rama library: wp/u136-c8-startpacks-residual
Worktree library: (library)/.worktrees/wp-u136-c8-startpacks-residual
Reporte: plan/REPORTES/WP-U136-c8-startpacks-residual.md (en zeus)

1 WP = este chat. NO editar plan/BACKLOG.md.
Leer plan/PRACTICAS.md entero (zeus) — §8 C8 obligatorio.
Reporte desde plan/REPORTES/PLANTILLA.md (zeus).
Commits convencionales en ambos repos según toque.
NO mezclar con U137 / U135.
NO tocar packages/* de producto ni workflows.

Política:
- Commits + push OK en ramas WP (library docs + zeus reporte).
- NO merge a main. NO ✅ BACKLOG.
- Espíritu CAPA §2c / C8 PRACTICAS §8 — no inventar canal operativo.

Paths:
- Library: (library)
- Zeus (reporte): (zeus-sdk)

Contexto (leer; NO copiar a plan/):
- `nota externa recibida (temp-review, 2026-07-19)` (WEBS/ENTREGA-CAPA/01-PAQUETE-CAPA)
  §2c Registry + §3 startpacks + Verificación C8
- Hecho de canal: @zeus/startpack-* → 404 en npm; operativo = tarball Release

Problema:
- docs/startpacks.md ~L38–41: `### Registry` + fence bash
  `npm install @zeus/startpack-delta` (copiable · canal 404).
- U132/CAPA rev2 corrigió prosa de canales en startpacks pero no ese fence.

Fix (mínimo):
- Alinear con patrón 2c del paquete: doctrina + estado → Futuros;
  canal operativo = tarball Release (ya hay sección debajo).
- Una línea / bloque doctrinal — NO fence copiable npm-por-nombre.
- Mencionar estado en futuros/releases está OK (doctrinal C8).

CA verificables:
1. En library: `rg -n 'npm install @zeus/startpack' docs/` → 0 hits en
   bloques copiables operativos (fences bash/sh). Hits doctrinales en
   prosa de Registry 2c / futuros / releases OK si no son fence ejecutable.
2. Preferencia orquestador: grep estricto `npm install @zeus/startpack`
   en docs/ → 0 en cualquier fence ```bash / ```sh; si queda en prosa
   inline doctrinal (como releases.md 2c), documentar en reporte.
3. `npm run docs:build` verde (library).
4. Diff acotado a startpacks.md (+ reporte zeus). No reabrir U132.

Demolición: fence `### Registry` con `npm install @zeus/startpack-*`
como canal operativo copiable.

Empieza: sitúate en worktrees, lee PRACTICAS §8 + CAPA §2c/§3, arregla,
verifica CA, reporta, push ramas. NO merge.
```
