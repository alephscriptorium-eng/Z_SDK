# Brief — WP-U85 · Familias de feed unificadas en el engine

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U85 · Familias de feed unificadas en el engine
Rama: wp/u85-feed-families
Worktree: .worktrees/wp-u85-feed-families
Reporte: plan/REPORTES/WP-U85-feed-families.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U85-feed-families.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — Ola 8; lote-8b; dep U84 ✅:
- La interfaz de feeds (hoy en el juego delta, patrón arg-feeds §4) se
  generaliza a las tres naturalezas de DATOS.md §3 (estática/stream/gossip)
  con la cadena de curación unificada de U80.
- Conexión ATProto directa (jetstream → DISK_01) como implementación de
  referencia del stream, con degradación a sintético intacta.
- CA (literal BACKLOG):
  · delta y pozo consumen feeds por la interfaz común (dos juegos =
    regla cumplida)
  · e2e de degradación auto→sintético
  · un feed SSB y uno ATProto navegables desde un juego en demo
- Demolición: lo genérico de feeds que quede duplicado en el juego delta.

Alcance orientativo:
- Interfaz común en engine para las tres naturalezas
  (estática / stream / gossip); delta y pozo consumen esa interfaz
  (regla de los dos juegos).
- ATProto jetstream → DISK_01 como referencia del stream; degradación
  a sintético intacta (e2e auto→sintético obligatorio).
- Feeds SSB (U84 / DISK_04) y ATProto navegables en demo desde un juego.
- Demoler duplicados genéricos de feeds que queden en delta tras subir
  la interfaz al engine.
- NO tocar plan/BACKLOG.md.
- NO implementar olas 9+ ni WPs ajenos.

Regla de los dos juegos (PRACTICAS §1.11):
- La abstracción de feeds vive en engine/* y NO nombra conceptos
  exclusivos de delta/pozo. Gate. Ambos juegos consumen la interfaz
  común — si solo sirve a uno, no es engine.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DATOS.md §3 (tres familias de feed) y §5 (files-first)
- plan/VISION.md (familias de feed / satélites)
- plan/ARQUITECTURA.md (dónde vive engine vs games/delta feeds)
- packages/games/delta/arg-feeds/ (patrón actual a generalizar)
- packages/engine/linea-kit/ + linea-firehose / SSB loader (U80/U84)
- plan/REPORTES/WP-U84-ssb-volumes.md (DISK_04/SSB ya operativo)

Notas del orquestador:
- Lote-8b serie: solo U85. Cierra ola 8 cuando ✅.
- Pregunta obligatoria (CA): ¿interfaz común estática/stream/gossip?
  ¿jetstream→DISK_01 + degradación sintético? ¿e2e auto→sintético?
  ¿feed SSB + ATProto navegables en demo? ¿delta y pozo por la
  interfaz? Evidencia literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
