# Brief — WP-U100 · Spike blob-sync Oasis 2-nodos

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U100 · Spike blob-sync Oasis 2-nodos
Rama: wp/u100-blob-sync-spike
Worktree: .worktrees/wp-u100-blob-sync-spike
Reporte: plan/REPORTES/WP-U100-blob-sync-spike.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U100-blob-sync-spike.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — D-21 fila 5; lote-transporte-12a;
serie (U101 NO asignado; no implementar U101):
- Spike barato de sync content-addressed (`ssb-blobs` / chunks) entre
  dos nodos antes de comprometer el carril saliente.
- Necesita cliente/pub levantado (ops). Zeus registra evidencia y CA
  de validación cuando el pub entregue el entorno; **no** implementa
  el servicio de blobs en este WP.
- Peer-card U93 = **portero del carril** LAN (D-21 fila 4 (b)): el
  spike debe respetar / documentar ese control de acceso; no reabrir
  ni reimplementar el torno U93.
- CA (literal BACKLOG):
  · acta/reporte con evidencia de sync 2-nodos (o ⏳ honesto si el
    pub aún no entrega)
  · verdicto «despeja / no despeja» compromiso de U101
  · cero código de producto del sidecar en monorepo zeus salvo
    harness de validación mínimo si hace falta
- Demolición: n/a (spike).

Alcance orientativo:
- Spike / evidencia / acta — NO producto del sidecar en monorepo.
- Harness de validación mínimo solo si hace falta para el CA.
- Documentar dependencia ops (cliente/pub levantado); ⏳ honesto si
  el entorno no está.
- Enganche LAN: peer-card U93 como portero (referencia D-20/D-21;
  no tocar código del torno salvo lectura/docs de enganche).
- NO implementar U101 (carril saliente hermano U84).
- NO re-abrir U84 (entrante SSB→VOLUMES ya ✅).
- NO horizonte U71 (p2p pleno).
- NO Ola 6 / credenciales.
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- Spike de transporte Oasis / blobs es infra mesh/ops, no dominio de
  juego. Cero nombres exclusivos de delta/pozo en harness si se añade.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-21 (filas 2–6; especialmente fila 5 spike y
  fila 4 peer-card portero; fila 3 → U101 diferido)
- plan/DECISIONES.md D-20, D-14 (peer-card; manifests/`cid`)
- plan/BACKLOG.md WP-U93 ✅ (portero del carril) + cola hallazgos U93
- plan/BACKLOG.md WP-U84 ✅ (entrante; hermano que U101 espejará)
- plan/REPORTES/WP-U93-peer-card.md
- plan/REPORTES/WP-U84-ssb-volumes.md
- plan/DATOS.md §5 (files-first / content-addressed) si aplica

Notas del orquestador:
- Lote-transporte-12a serie: solo U100. U101 depende de U100 — NO
  asignado aún.
- Pregunta obligatoria (CA): ¿evidencia sync 2-nodos (o ⏳ honesto)?
  ¿veredicto despeja/no despeja U101? ¿cero producto sidecar salvo
  harness mínimo? ¿peer-card U93 tratado como portero (doc/enganche)?
  Evidencia literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
