# Brief — WP-U89 · Visor WebRTC del mesh (salas y privados)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U89 · Visor WebRTC del mesh (salas y privados)
Rama: wp/u89-webrtc-viewer
Worktree: c:/Users/aleph/OASIS/SCRIPTORIUM_V0/zeus-sdk/.worktrees/wp-u89-webrtc-viewer
Reporte: plan/REPORTES/WP-U89-webrtc-viewer.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U89-webrtc-viewer.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.
  Para demo del CA: NO setear `ZEUS_OPEN_BROWSER=1` salvo verificación
  humana explícita; headless / evidencia automatizada preferible.

WP completo (de plan/BACKLOG.md) — Ola 10; lote-10b; dep U88 ✅;
paralelo con U90 (otro worktree; superficies distintas):
- Visor nuevo, hermano Angular de operator-ui, sobre la lib del repo A
  (`WebRTCEngine` + peer-list/media-controls/chat): **datos, audio y
  vídeo por salas o en privado (2 peers)**.
- En vistas de juego, botones llamar/compartir/colgar vía canales
  rabbit-spider-horse: oferta HORSE puede incluir «contactar por
  WebRTC» y el contacto abre la negociación.
- Regla dura: **WebRTC no toca la verdad del estado** — autoridad +
  ledger mandan; peers WebRTC mantienen infra de rooms debajo para
  `state`/`ledger`/`track`. DataChannel = media, chat y **bulk**:
  consolidación de caches feeds/firehose entre peers (objetos de
  volumen validando contra manifests — primera materialización p2p
  de D-14).
- CA (literal BACKLOG):
  · demo — dos navegadores en una sala del juego abren video-llamada y
    chat desde los botones del juego
  · un peer recibe de otro un objeto de cache que valida contra su
    manifest (U80) y su vista lo refleja
  · el estado del juego sigue llegando por la room aunque caiga el
    canal WebRTC
- Demolición: lo que se adapte de la lib A entra por import/port con
  su procedencia anotada, no como copia muerta.

Alcance orientativo:
- Visor Angular + integración botones en juego (RSH / HORSE).
- Señalización: consumir `@zeus/webrtc-signaling` (U88) — SocketRoom
  + trickle ICE; iceServers desde presets-sdk/env (sin Google).
- Bulk cache vía DataChannel validando manifests U80.
- Referencia SOLO LECTURA en plan/recursos/web-rtc-gamify-ui/ (repo A).
  Port/import con procedencia (PRACTICAS §1.4).
- NO implementar U90 (señalización SSB / pub mediador) — eso es el
  otro WP del lote; no pisar su superficie.
- NO tocar plan/BACKLOG.md.
- Ola 9 sigue bloqueada — no tocar U70/U86/U87.

Quirk A (hallazgo U88 — anotar si aplica al port):
- Repo A: `sendWebRTCMessage` hace `emit(type.replace('webrtc-', ''))`
  mientras escucha `webrtc-*`. Nuestra impl U88 emite el nombre
  completo (`webrtc-offer|answer|ice-candidate|…`). Si portás código
  de A, alinear al contrato U88 (nombre completo); documentar en
  reporte §hallazgos si el quirk aparece en el port.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-17 (visor salas/privados; WebRTC ≠ verdad)
- plan/DECISIONES.md D-14 (transporte p2p / consolidación caches)
- plan/recursos/README.md + plan/recursos/web-rtc-gamify-ui/
- packages/engine/webrtc-signaling/ (U88 — SignalingService + socket)
- plan/REPORTES/WP-U88-webrtc-signaling.md (quirk A, contrato rooms)
- operator-ui / vistas de juego (patrón hermano Angular + RSH)
- packages/engine/linea-kit o manifests U80 (validación bulk cache)

Notas del orquestador:
- Lote-10b paralelo: U89 = visor + botones juego; U90 = SignalingService
  SSB / módulo `/webrtc` del pub. Partición clara — no solapar.
- Coturn VPS sigue ⏳ (ops); no bloquea: usar env / fallback de tests
  como U88.
- Pregunta obligatoria (CA): ¿video+chat desde botones del juego en
  sala? ¿bulk cache valida manifest U80? ¿estado por room sobrevive
  caída WebRTC? Evidencia literal (o ⏳ honesto).
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
