# Brief — WP-U90 · El pub como mediador (señalización SSB)

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U90 · El pub como mediador (señalización SSB)
Rama: wp/u90-ssb-webrtc-signaling
Worktree: .worktrees/wp-u90-ssb-webrtc-signaling
Reporte: plan/REPORTES/WP-U90-ssb-webrtc-signaling.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U90-ssb-webrtc-signaling.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — Ola 10; lote-10b; dep U88 ✅;
paralelo con U89 (otro worktree; superficies distintas):
- Segunda implementación de la `SignalingService`: mensajes SSB privados
  (`type: 'webrtc-signal'`, cifrado `ssb-box`, DM al feedId del peer)
  para que **nuestro pub haga de mediador** entre dos usuarios OASIS.
- El módulo `/webrtc` del repo B deja el copy-paste y usa este
  transporte (necesita endpoint backend sobre el `sbot`; hoy el módulo
  es solo frontend).
- Basta offer+answer completos (**sin trickle**) para tolerar la
  latencia del gossip.
- CA (literal BACKLOG):
  · dos identidades SSB contra el pub negocian un DataChannel sin
    servidor de señalización central ni copy-paste
  · documentado como PR candidato upstream al fork
- Demolición: el flujo copy-paste del módulo en nuestra adaptación
  (el fork original queda intacto en recursos/).

Alcance orientativo:
- Nueva impl SignalingService (hermana de SocketRoomSignalingService
  de U88) sobre transporte SSB privado / pub.
- Adaptar módulo `/webrtc` de B: sustituir textarea copy-paste por
  esta señalización; endpoint backend sobre sbot si hace falta.
- Offer+answer completos, sin trickle ICE (latencia gossip).
- iceServers siguen D-17 / U88: desde presets-sdk/env; sin Google en
  prod.
- Referencia SOLO LECTURA en plan/recursos/simple-ssb-webrtc/ (repo B).
  Fork original en recursos/ intacto; nuestra adaptación demuele
  copy-paste.
- NO implementar U89 (visor Angular / botones juego / bulk cache) —
  otro WP del lote; no pisar su superficie.
- NO tocar plan/BACKLOG.md.
- Ola 9 sigue bloqueada — no tocar U70/U86/U87.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-17 (pub SSB como mediador; sin Google)
- plan/recursos/README.md + plan/recursos/simple-ssb-webrtc/
- packages/engine/webrtc-signaling/ (U88 — SignalingService abstracta
  a extender; SocketRoom queda; esta es la 2ª impl)
- plan/REPORTES/WP-U88-webrtc-signaling.md
- pub / sbot / integración OASIS existente en el monorepo (si hay)

Notas del orquestador:
- Lote-10b paralelo: U90 = mediación SSB + módulo /webrtc; U89 = visor
  mesh + botones juego. Partición clara — no solapar.
- Coturn VPS sigue ⏳ (ops); no bloquea este CA (señalización SSB, no
  TURN).
- Pregunta obligatoria (CA): ¿dos identidades SSB negocian DataChannel
  sin copy-paste ni signaling central? ¿PR candidato upstream
  documentado? ¿copy-paste demolido en la adaptación? Evidencia
  literal (o ⏳ honesto).
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
