# Brief — WP-U54 · Consumidores externos anónimos

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U54 · Consumidores externos anónimos
Rama: wp/u54-external-consumers
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u54-external-consumers
Reporte: plan/REPORTES/WP-U54-external-consumers.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U54-external-consumers.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Smoke externo: instalar desde **tarballs** (`npm pack` / `file:`) o
  directorio limpio fuera del workspace — NO exigir registry live.
- Si el CA pide «instalando SOLO del registry»: sin acceso swarm →
  ⏳ honesto + smoke equivalente con tarballs/file documentado.
  NO inventar publish ni inventar consumidores con nombre propio (D-18).

WP completo (de plan/BACKLOG.md) — Ola 5 lote-5b; dep U50 ✅, U10 ✅; D-18:
- El registry es frontera pública: terceros (JS/TS, Bun, Node) construyen
  sobre `@zeus/*` sin hablar con nosotros.
- Paquetes publicables llevan **tipos `.d.ts`** (generados de los schemas
  del protocolo) en los tarballs.
- Docs de handshake para clientes externos:
  · `ZEUS_SCRIPTORIUM_URL`
  · auth `{token, room, user}`
  · eventos del contrato
  Documentado en el **portal** (U41 ✅).
- Smoke de consumo: proyecto externo mínimo (fuera del workspace),
  instalando SOLO del registry (o tarball/file equivalente en swarm),
  se une a una room y emite un intent tipado.
- CA:
  · smoke reproducible con evidencia (Node y Bun)
  · tipos presentes en los tarballs (`release:dry` los verifica)
  · handshake documentado en el portal
- Demolición: n/a.

Alcance orientativo:
- Generar/emitir `.d.ts` para paquetes publicables que exponen el
  protocolo (mínimo `@zeus/protocol`; extender a kits que el smoke use).
- Extender `release:dry` (o chequeo hermano) para fallar si faltan
  `.d.ts` prometidos en `files`/`exports`/`types`.
- Ejemplo/smoke fuera del workspace (p.ej. bajo `examples/` o temp dir
  documentado) — Node + Bun.
- Página/sección portal: handshake anónimo (sin nombrar consumidores
  concretos — D-18).

Regla de los dos juegos (PRACTICAS §1.11):
- No introducir nombres de juego en paquetes engine; `gates` verde.
- El smoke puede usar un game id genérico / de prueba; no acoplar a
  features de delta/pozo.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-18 (consumidores anónimos; frontera tipada)
- plan/ARQUITECTURA.md §5 (monorepo publicable)
- packages/engine/protocol/ (schemas + exports post-U10/U50/U51)
- scripts/release-dry.mjs (verificar tipos en tarball)
- docs/ / portal VitePress (U41 — dónde documentar handshake)
- room-client-browser / authority-kit (APIs de unión a room + intent)

Notas del orquestador:
- Lote-5b paralelo con U53. U52 es la última — NO tocar U52.
- Conflicto blando con U53: ambos pueden tocar `release:dry` / packs.
  U54 es dueño de `.d.ts` + smoke + docs handshake; U53 de changesets
  + CI release. Particionar diffs; merge preferido U53 primero si hay
  choque en el script de pack.
- Hallazgo U50 diferido: CA registry ⏳ — este WP puede cerrar el smoke
  vía tarball; no desbloquear publish real.
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Smoke/e2e headless por
  defecto.
- Pregunta obligatoria (CA): ¿`.d.ts` en tarballs (release:dry)? ¿smoke
  Node + Bun con evidencia? ¿handshake en portal? ¿install-from-registry
  = ⏳ o tarball/file documentado (NO publish)?
- NO editar plan/BACKLOG.md.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
