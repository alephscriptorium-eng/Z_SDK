# WP-U90 · ssb-webrtc-signaling — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-18 |
| rama | `wp/u90-ssb-webrtc-signaling` |
| commit(s) | `d143022`, `86fdf69`, `f8ea0fd` |
| estado propuesto | listo para revisión |

## Qué se hizo

Se implementó la segunda `SignalingService`: `SsbPrivateSignalingService` sobre
DMs SSB `type: 'webrtc-signal'` (ssb-box / `recps`) con bus in-memory que
simula el pub como mediador, más `createSbotPrivateTransport` duck-typed.
Negociación DataChannel con offer+answer completos (`trickle: false` /
`negotiateDataChannelComplete`). Adaptación del módulo `/webrtc` de B en
`@zeus/oasis-webrtc` sin textareas copy-paste ni Google STUN; endpoint HTTP
sobre el transporte; documentado como PR candidato upstream. Fork en
`plan/recursos/simple-ssb-webrtc/` intacto.

## Archivos tocados

- `packages/engine/webrtc-signaling/src/ssb-private-transport.mjs` — creado (bus + sbot adapter)
- `packages/engine/webrtc-signaling/src/ssb-private-signaling.mjs` — creado (2ª SignalingService)
- `packages/engine/webrtc-signaling/src/peer-session.mjs` — `waitForIceComplete` + `trickle` opt
- `packages/engine/webrtc-signaling/src/index.mjs` + `types/` + README — exports U90
- `packages/engine/webrtc-signaling/test/ssb-signaling.test.mjs` — unit SSB
- `packages/mesh/oasis-webrtc/**` — adaptación `/webrtc` + API + UPSTREAM_PR.md
- `e2e/ssb-webrtc-signaling.mjs` — CA DataChannel vía DMs
- `packages/engine/presets-sdk/src/env/index.mjs` — slot `oasisWebrtc` / `ZEUS_PORT_OASIS_WEBRTC`
- `.env.example`, `package.json`, `eslint.config.mjs`, docs mesh/engine
- `.changeset/wp-u90-ssb-webrtc-signaling.md`

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Unit `@zeus/webrtc-signaling` — OK (11)

```
# tests 11
# pass 11
# fail 0
```

### Unit `@zeus/oasis-webrtc` — OK (3)

```
# tests 3
# pass 3
# fail 0
```

### E2e DataChannel vía SSB privados — OK

```
Negotiating DataChannel via SSB private webrtc-signal (complete SDP, no trickle)...
e2e:ssb-webrtc-signaling OK — DataChannel open via pub-mediated SSB DMs, ping delivered, no copy-paste, no Google ICE
```

### Gates — OK

```
gates: OK (0 offenders)
```

### Lint (archivos del WP)

```
npx eslint packages/mesh/oasis-webrtc packages/engine/webrtc-signaling/src/ssb-*.mjs …
EXIT_eslint:0
```

(repo-wide `npm run lint` sigue con warnings ajenos preexistentes; 0 errors en
superficies U90 tras globals browser para `oasis-webrtc/public`).

### Preguntas CA (obligatorias)

| pregunta | respuesta |
| -------- | --------- |
| ¿Dos identidades SSB negocian DataChannel sin signaling central ni copy-paste? | **Sí** — e2e con `createInMemorySsbPrivateBus` (pub mediador) + `SsbPrivateSignalingService`; ping OK |
| ¿PR candidato upstream documentado? | **Sí** — `packages/mesh/oasis-webrtc/docs/UPSTREAM_PR.md` |
| ¿Copy-paste demolido en la adaptación? | **Sí** — grep abajo; fork en recursos/ no tocado |
| ¿Offer+answer sin trickle? | **Sí** — `negotiateDataChannelComplete`; `sendIceCandidate` no-op por defecto |

## Demolición

Flujo copy-paste demolido en `@zeus/oasis-webrtc` (vista + cliente). Fork
original intacto (gitignored en `plan/recursos/`).

```
rg -n "offer-code|answer-code|btn-copy-offer|function encode\(|btoa\(|stun\.l\.google" \
  packages/mesh/oasis-webrtc packages/engine/webrtc-signaling
# solo menciones en tests (assert false) y docs/UPSTREAM_PR.md
```

Cero `stun.l.google` en código de la adaptación.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: puerto vía `resolveZeusUiPorts().oasisWebrtc` /
      `ZEUS_PORT_OASIS_WEBRTC`; e2e sin socket-server de señalización
- [x] Cadenas if/switch → tablas: `ABSTRACT_TO_SSB_SIGNAL` / `SSB_SIGNAL_TO_ABSTRACT`
- [x] Duplicación: se reutiliza `SignalingService` de U88; no se copió B a ciegas
- [x] console.log / código comentado / TODO sin backlog: start/e2e usan log de progreso
- [x] Nombres de transición: no
- [x] Demolición completa (grep arriba): sí en la adaptación
- [x] Tests de comportamiento: DM solo a recps, filtro to/from, HTTP inbox, e2e ping
- [x] Arranque: e2e Node + unit HTTP; UI browser ⏳ no abierta (`ZEUS_OPEN_BROWSER` opt-in)
- [x] README/docs del paquete: actualizados + UPSTREAM_PR
- [x] Diff solo alcance WP: sí (se descartó churn LF en bins ajenos tras npm install)

## Hallazgos fuera de alcance

- Coturn VPS sigue ⏳ (ops); no bloquea CA de señalización SSB.
- `@zeus/ssb-system` es export files-first, no demonio sbot: el bridge real al
  pub vive en `createSbotPrivateTransport(sbot)` + HTTP de oasis-webrtc;
  integración contra sbot OASIS en vivo queda para ops/PR upstream.
- U89 (visor Angular) no tocado (partición lote-10b).

## Dudas / bloqueos

Ninguno bloqueante. Apertura del PR en GitHub del fork = paso humano (política:
NO gh).

---

## Revisión del orquestador

**Veredicto: Aceptado ✅** (autoriza merge; BACKLOG ✅ lo marca el orquestador
en master al mergear — no en esta revisión).

### Verificado (2026-07-18)

- Diff `master...wp/u90-ssb-webrtc-signaling`: alcance WP (28 files); **no**
  toca `plan/BACKLOG.md`; **no** toca `plan/recursos/` (fork B intacto /
  gitignored).
- `SsbPrivateSignalingService` + `createSbotPrivateTransport` /
  `createInMemorySsbPrivateBus`; tipo `webrtc-signal` + `recps`.
- Offer+answer completos: `negotiateDataChannelComplete` / `trickle: false`;
  `sendIceCandidate` no-op salvo `allowTrickle`.
- Adaptación `@zeus/oasis-webrtc`: sin textareas/copy-paste/`btoa`; ICE vía
  presets; `docs/UPSTREAM_PR.md` presente (candidato upstream).
- Re-CA orquestador: `@zeus/webrtc-signaling` 11/11; `@zeus/oasis-webrtc`
  3/3; `e2e:ssb-webrtc-signaling` OK; `gates` OK (0 offenders).
- PRACTICAS §1–3 / §6: puertos vía slot `oasisWebrtc`; tablas de señales;
  commits convencionales; demolición grep OK en adaptación.
- Auto-revisión honesta (sbot vivo / UI browser ⏳).

### Hallazgos → cola (no bloquean aceptación)

1. **Puerto default 3022 en colisión con U89** (WIP): U90
   `oasisWebrtc` / `ZEUS_PORT_OASIS_WEBRTC=3022`; U89 (worktree)
   `webrtcViewer` / `ZEUS_PORT_WEBRTC_VIEWER=3022`. Resolver al merge
   (slots distintos + puertos default distintos).
2. **Solape de archivos con U89** (WIP, no en commits aún): ambos tocan
   `presets-sdk/src/env/index.mjs`, `webrtc-signaling/package.json`,
   `.env.example`, root `package.json`. U90 además redefine fuentes de
   `@zeus/webrtc-signaling` (`peer-session`, SSB). **Serializar merge**
   U90 → U89 (o rebase U89 tras U90) y reconciliar exports subpath que
   U89 añade (`./peer-session`, `./messages`).
3. Coturn VPS / sbot OASIS en vivo: siguen ⏳ (ops); no bloquean CA de
   señalización (bus in-memory = mediador de prueba).

### Merge

Orden sugerido vs U89: **U90 primero** (cambios profundos en
`@zeus/webrtc-signaling`), luego U89 rebasado — especialmente por (1)(2).
Push: no intentado. BACKLOG: permanece 🔶 hasta merge + ✅ en master.
