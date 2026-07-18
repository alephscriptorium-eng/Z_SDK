# WP-U88 · webrtc-signaling — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-18 |
| rama | `wp/u88-webrtc-signaling` |
| commit(s) | `869185b`, `b491a04`, `11bb3fd`, `26dd778` (+ este reporte) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se implementó señalización WebRTC sobre rooms del socket-server: paquete
`@zeus/webrtc-signaling` con `SignalingService` abstracta y
`SocketRoomSignalingService` (contrato `webrtc-offer|answer|ice-candidate|
join-room`, trickle ICE). `resolveIceServers` en `presets-sdk/env` lee
`ZEUS_WEBRTC_*`; Google STUN solo con `ZEUS_WEBRTC_ALLOW_GOOGLE_STUN=1` +
WARNING. Gate U00 nuevo `google-stun` (rojo sintético). E2e dos clientes
headless abren DataChannel vía room sin Google. Runbook coturn documentado
(⏳ sin VPS). No se copiaron `iceServers` hardcodeados de A/B.

## Archivos tocados

- `packages/engine/presets-sdk/src/env/index.mjs` — creado `resolveIceServers`
- `packages/engine/presets-sdk/test/env-ice-servers.mjs` — unit ICE/env
- `packages/engine/webrtc-signaling/**` — paquete nuevo (signaling + peer helper)
- `e2e/webrtc-signaling.mjs` — CA DataChannel dos headless
- `scripts/gates/scan.mjs` + `exceptions.mjs` + `test/gates/gates.test.mjs` — gate google-stun
- `.env.example` — vars `ZEUS_WEBRTC_*`
- `docs/mesh/coturn-runbook.md` + índices mesh/engine
- `.changeset/wp-u88-webrtc-signaling.md` — bump presets-sdk + webrtc-signaling
- `package.json` / `package-lock.json` — scripts + optional `@roamhq/wrtc`

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Unit `@zeus/webrtc-signaling` — OK (5)

```
# tests 5
# pass 5
# fail 0
```

### Unit `resolveIceServers` — OK (3)

```
# tests 3
# pass 3
# fail 0
```

### Gates — verde repo + rojo sintético google-stun

```
# Subtest: CA rojo (e): stun.l.google sintético detectado (WP-U88 / D-17)
ok 8 - CA rojo (e): stun.l.google sintético detectado (WP-U88 / D-17)

> zeus-sdk@0.1.0 gates
> node scripts/gates/run.mjs

gates: OK (0 offenders)
```

### E2e DataChannel sin Google — OK

```
Negotiating DataChannel (trickle ICE, no Google)...
e2e:webrtc-signaling OK — DataChannel open, ping delivered, no Google ICE
```

### Lint

```
✖ 12 problems (0 errors, 12 warnings)
```

(warnings preexistentes ajenos al WP; 0 errors)

### Runbook coturn en VPS

⏳ sin verificar — sin acceso al VPS del pub. Documentado en
`docs/mesh/coturn-runbook.md`.

### Preguntas CA (obligatorias)

| pregunta | respuesta |
| -------- | --------- |
| ¿DataChannel e2e dos headless vía room sin Google? | **Sí** — `npm run e2e:webrtc-signaling` OK |
| ¿gate rojo stun.l.google? | **Sí** — test sintético ok + `npm run gates` limpio |
| ¿iceServers solo desde env? | **Sí** — `resolveIceServers`; e2e fuerza lista vacía |
| ¿runbook coturn (o ⏳)? | **Documentado; ⏳ sin VPS** |

## Demolición

No se adaptó código de A/B con `iceServers` hardcodeados: el paquete nuevo
parte de la API abstracta + contrato de mensajes, sin defaults Google.
Grep fuera de `presets-sdk/src/env` (opt-in canónico) y docs/gates:

```
rg -n "stun\.l\.google" packages scripts examples --glob '!**/presets-sdk/src/env/**'
# solo README.md del paquete (docs) y comentarios del scanner de gates
```

Cero `ICE_SERVERS = [...]` / `waitForIceComplete` en el paquete (solo
comentarios de procedencia anti-B).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: e2e usa `13088` (exento como
      resto de e2e); runtime sale de `ZEUS_SCRIPTORIUM_URL` / rooms config
- [x] Cadenas if/switch que debieron ser tabla: mapas `ABSTRACT_TO_WIRE` /
      `WIRE_TO_ABSTRACT`
- [x] Duplicación: no se copió A/B; se portó la abstracción a mjs
- [x] console.log / código comentado / TODO sin backlog: no en producción;
      e2e usa `console.log` de progreso (patrón e2e)
- [x] Nombres fuera de glosario o de transición: no
- [x] Demolición completa (grep arriba): no hay iceServers Google en el
      paquete adaptado
- [x] Tests prueban comportamiento: wire map, filtro to/from, ICE env,
      DataChannel ping
- [x] Arranque real verificado: scriptorium programático + e2e
- [x] README/specs del paquete siguen siendo verdad: README nuevo
- [x] El diff contiene solo el alcance del WP: sí (se descartó ruido de
      line-endings en bins ajenos tras `npm install`)

## Hallazgos fuera de alcance

- En repo A, `sendWebRTCMessage` hace `emit(type.replace('webrtc-', ''))`
  mientras escucha `webrtc-offer` — quirk; nuestra impl emite el nombre
  completo y el relay lo reemite (no se «arregló» A; solo se documentó).
- `plan/recursos/*` no está materializado en el worktree (gitignored);
  se leyó desde el clone del repo principal.
- U89 (visor) / U90 (SSB signaling) siguen fuera; este WP deja la base.

## Dudas / bloqueos

Ninguno bloqueante. Coturn en VPS queda ⏳ hasta acceso ops.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
