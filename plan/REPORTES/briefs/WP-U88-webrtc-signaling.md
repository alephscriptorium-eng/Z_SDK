# Brief — WP-U88 · Señalización WebRTC vía nuestro mesh + ICE propio

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U88 · Señalización WebRTC vía nuestro mesh + ICE propio
Rama: wp/u88-webrtc-signaling
Worktree: .worktrees/wp-u88-webrtc-signaling
Reporte: plan/REPORTES/WP-U88-webrtc-signaling.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U88-webrtc-signaling.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — Ola 10; lote-10a; dep U10 ✅;
paralelizable con olas 7–9 (D-17; recursos en plan/recursos/):
- Señalización viaja por lo que ya tenemos: implementación de la
  `SignalingService` abstracta del repo A (`web-rtc-gamify-ui`) sobre las
  **rooms del socket-server** (contrato `webrtc-offer/answer/
  ice-candidate/join-room/…`, con trickle ICE — NO `waitForIceComplete`
  de B).
- ICE: coturn (STUN+TURN FOSS) en VPS junto al pub; `iceServers` SIEMPRE
  desde `presets-sdk/env` (`ZEUS_WEBRTC_STUN`, `ZEUS_WEBRTC_TURN*`).
- STUN Google solo tras flag explícito
  `ZEUS_WEBRTC_ALLOW_GOOGLE_STUN=1` + WARNING gigante; jamás en producción.
- Gate U00 amplía: `stun.l.google` en código = rojo.
- CA (literal BACKLOG):
  · e2e — dos clientes headless negocian DataChannel vía señalización por
    room (sin Google)
  · runbook coturn en VPS documentado y probado (⏳ honesto si no hay acceso)
  · gate rojo con STUN google sintético
- Demolición: los `iceServers` hardcodeados en lo que se adapte de A/B.

Alcance orientativo:
- Impl. SignalingService sobre rooms socket-server (adoptar contrato de
  mensajes del repo A; trickle ICE).
- iceServers desde presets-sdk/env; Google STUN solo con flag + WARNING.
- Gate U00 rojo para `stun.l.google` (sintético en tests).
- e2e dos clientes headless DataChannel sin Google.
- Runbook coturn: ⏳ OK si no hay acceso VPS (documentar + honesto).
- Demoler iceServers hardcodeados en lo adaptado de A/B.
- Referencia SOLO LECTURA en plan/recursos/ (web-rtc-gamify-ui,
  simple-ssb-webrtc) — lo reutilizado entra con procedencia anotada
  (PRACTICAS §1.4), no copy-paste silencioso.
- NO tocar plan/BACKLOG.md.
- NO implementar U89/U90 (dep U88) ni Ola 9 (bloqueada por Ola 6).

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-17 (WebRTC mediación propia, sin Google)
- plan/recursos/README.md (repos A/B, hallazgos STUN hardcodeado,
  SignalingService abstracta, contrato mensajes)
- plan/recursos/web-rtc-gamify-ui/ (repo A — SignalingService,
  WebRTCEngine, contrato webrtc-*)
- plan/recursos/simple-ssb-webrtc/ (repo B — referencia; no trickle;
  iceServers hardcodeados a demoler en adaptación)
- presets-sdk/env (dónde viven ZEUS_WEBRTC_*)
- packages del socket-server / rooms (transporte de señalización)
- plan/REPORTES o gates U00 (patrón gate rojo a ampliar)

Notas del orquestador:
- Lote-10a serie: solo U88. U89/U90 NO asignar (dep U88).
- Ola 9 sigue bloqueada por Ola 6 pausada — no tocar U70/U86/U87.
- Pregunta obligatoria (CA): ¿DataChannel e2e dos headless vía room sin
  Google? ¿gate rojo stun.l.google? ¿iceServers solo desde env?
  ¿runbook coturn (o ⏳)? Evidencia literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
