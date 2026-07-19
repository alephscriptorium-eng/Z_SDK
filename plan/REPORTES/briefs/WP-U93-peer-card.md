# Brief — WP-U93 · Peer-card como torno del carril WebRTC

_Plantilla: `plan/roles/BRIEF.md`. Pegar en chat nuevo junto con `plan/roles/WORKER.md`._

---

```text
(rol) plan/roles/WORKER.md

WP: WP-U93 · Peer-card como torno del carril WebRTC
Rama: wp/u93-peer-card
Worktree: .worktrees/wp-u93-peer-card
Reporte: plan/REPORTES/WP-U93-peer-card.md

1 WP = este chat. NO editar plan/BACKLOG.md (solo orquestador, en master).
Leer plan/PRACTICAS.md entero antes de implementar.
Reporte desde plan/REPORTES/PLANTILLA.md → plan/REPORTES/WP-U93-peer-card.md.
Commits convencionales: tipo(alcance): resumen (PRACTICAS §6).
NO mezclar con packages/games/delta/spec/BACKLOG.md (features delta; otro backlog).

Política de swarm (dura) — OBLIGATORIA en este WP:
- NO git push.
- NO gh pr / gh pr create.
- NO npm publish real (ni al registry propio ni a npmjs).
- Navegador: `ZEUS_OPEN_BROWSER` es **opt-in**. Solo abre si `=1`;
  unset / `0` / vacío / otro valor = no abrir. Headless por defecto.

WP completo (de plan/BACKLOG.md) — D-20; dep U88–U90 ✅; A-11/D-21
NO bloquean este WP (frontera explícita):
- Cadena puente: autoridad de sala **emite** peer-card al join
  (`makePeerCard`); `webrtc-signaling` **exige** card válida
  (rol/frescura vía `peerCardGrantsRole`, `isPeerCardFresh`) antes de
  retransmitir offer/answer/ICE.
- Documentar punto de enganche SSB (extensión futura: asiento /
  credencial en grafo Oasis / follows) — sin implementar el puente ni
  blobs ni sidecar.
- DataChannel = carril datos / VOLUMES LAN (D-17; fila 1 A-11 /
  complementario a `ssb-blobs` WAN). Con D-21 fila 4 (b): el sidecar
  pub respetará este peer-card como portero LAN — aquí solo el torno.
- Sustituye identidad plana (`userId`/`peerId`/`displayName`) en el
  handshake que el card cubra.
- CA (literal BACKLOG):
  · autoridad **emite** al join **y** signaling **exige** (ambos
    extremos — anti media cadena / A-02)
  · test rechaza card caducada o sin rol
  · e2e cadena completa emite-y-exige; e2e WebRTC verde
  · README de webrtc-signaling nombra el hook SSB como extensión
    explícita (cero código SSB nuevo)
- Demolición: campos de identidad ad-hoc del handshake que el card
  sustituya.

Alcance orientativo:
- `@zeus/protocol` — `makePeerCard` / helpers ya existen; consumidores
  de producción fuera de protocol.
- Autoridad (authority-kit / autoridad de sala delta) — emitir card
  al join.
- `@zeus/webrtc-signaling` — validar antes de offer/answer/ICE;
  README hook SSB.
- Tests unitarios + e2e cadena completa.
- NO implementar U100 (spike blobs) ni U101 (saliente hermano U84).
- NO implementar puente SSB real ni blobs ni sidecar del pub.
- NO tocar Ola 6 / credenciales.
- NO editar plan/BACKLOG.md.

Regla de los dos juegos (PRACTICAS §1.11):
- Peer-card y torno WebRTC son engine/mesh genéricos. No meter nombres
  ni lógica exclusiva de delta/pozo en protocol ni webrtc-signaling.
  Verificar que ambos juegos siguen verdes si tocas callers.

Lecturas extra (además de PRACTICAS + WP en BACKLOG):
- plan/DECISIONES.md D-17, D-20, D-21 (frontera A-11; peer-card portero)
- packages/engine/protocol/src/peer-card.mjs (+ test peer-card)
- packages/engine/webrtc-signaling/ (signaling + README)
- plan/REPORTES/WP-U88-webrtc-signaling.md
- plan/REPORTES/WP-U90-ssb-webrtc-signaling.md
- Grep makePeerCard / join / offer|answer|ICE en authority + signaling

Notas del orquestador:
- Prep 🔶 en master; worker aún no lanzado al escribir el brief.
- Independiente de U100/U101 (transporte Oasis post A-11) — no
  mezclar alcance.
- Pregunta obligatoria (CA): ¿emite-y-exige en ambos extremos?
  ¿test caducada/sin rol? ¿e2e cadena + e2e WebRTC verdes? ¿README
  hook SSB sin código SSB nuevo? Evidencia literal.
- NO editar plan/BACKLOG.md.
- NO push.

Empieza: sitúate en la rama/worktree, lee PRACTICAS entero, luego implementa.
```
