# WP-U89 · webrtc-viewer — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (swarm) |
| fecha | 2026-07-18 |
| rama | `wp/u89-webrtc-viewer` |
| commit(s) | _(tras commits de este WP)_ |
| estado propuesto | listo para revisión |

## Qué se hizo

Se entregó el visor WebRTC del mesh (`@zeus/webrtc-viewer`), hermano de
operator-ui: motor `WebRTCEngine` adaptado de repo A (`web-rtc-gamify-ui` @
`4b9271b`) sobre señalización U88 (nombres wire completos, sin quirk A),
componentes Angular anotados (peer-list / media-controls / chat), shell ESM
servido por `serve.mjs`, validación bulk cache U80 vía
`@zeus/linea-kit/validate`, y botones llamar/compartir/colgar en la vista
jugador (HORSE contact restActions). WebRTC no toca la verdad de estado: el
visor mantiene cliente de room de juego aparte. Puerto `webrtcViewer` en
`DEFAULT_ZEUS_UI_MESH` / `ZEUS_PORT_WEBRTC_VIEWER`.

## Archivos tocados

- `packages/mesh/webrtc-viewer/**` — paquete nuevo (engine, bulk, browser shell, Angular projects, serve, tests, README)
- `e2e/webrtc-viewer.mjs` — CA chat + bulk U80 + state tras hangup
- `packages/engine/presets-sdk/src/env/index.mjs` — slot UI `webrtcViewer` + stop list
- `packages/engine/webrtc-signaling/package.json` — export `./peer-session` (browser-safe)
- `packages/games/delta/arg-console/**` — botones WebRTC en contacto + import map + viewer-config
- `.changeset/wp-u89-webrtc-viewer.md` — bump presets-sdk + webrtc-signaling
- `.env.example`, `package.json`, `eslint.config.mjs` — puerto, scripts, globals browser

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

### Unit `@zeus/webrtc-viewer` — OK (6)

```
# tests 6
# pass 6
# fail 0
```

### E2e CA — OK (chat + bulk U80 + state after hangup)

```
e2e:webrtc-viewer OK — chat + bulk U80 + state after hangup; viewer health green
note: getUserMedia video path exists in WebRTCEngine; Node e2e is data/chat (⏳ two-browser A/V)
```

### Gates

```
gates: OK (0 offenders)
```

### Lint (paquete / archivos tocados)

```
npx eslint packages/mesh/webrtc-viewer … → exit 0
```

### Demo dos navegadores video+chat desde botones del juego

⏳ sin verificar en este chat (política `ZEUS_OPEN_BROWSER` unset; e2e headless
cubre chat DataChannel + botones generan URL con `action=webrtc-call|share|hangup`).
Ruta getUserMedia existe en `WebRTCEngine.connectToPeer({ useVideo, useAudio })`
y el shell browser tiene controles llamar/compartir/colgar.

### Preguntas CA (literal)

| pregunta | evidencia |
| -------- | --------- |
| ¿video+chat desde botones del juego en sala? | Botones HORSE en `jugador.mjs` → URL visor; chat DataChannel e2e OK; video A/V dos browsers ⏳ |
| ¿bulk cache valida manifest U80? | e2e + `/api/validate-cache` + `validateCacheObject('cache-sidecar-meta')` OK |
| ¿estado por room sobrevive caída WebRTC? | e2e emite `state` tras `hangup` y el observer lo recibe OK |

## Demolición

- Defaults Google STUN de A **no** entraron al motor Zeus (`iceServers: []`
  salvo `resolveIceServers`).
- Quirk A (`emit(type.replace('webrtc-', ''))`) **no** se portó: browser +
  SocketRoom usan nombres wire completos.
- Procedencia anotada en engine/UI (`Procedencia: … @ 4b9271b`,
  `data-provenance`), no copia muerta de la lib A.

```
rg -n "stun\\.l\\.google" packages/mesh/webrtc-viewer
→ (sin matches en el paquete; solo GOOGLE_STUN_URLS en presets-sdk/env como U88)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: puerto vía `DEFAULT_ZEUS_UI_MESH.webrtcViewer` / env; rooms de e2e aisladas
- [x] Cadenas if/switch que debieron ser tabla: `WEBRTC_REST_HANDLERS` / actions table
- [x] Duplicación: reusa `@zeus/webrtc-signaling`, `resolveIceServers`, `linea-kit/validate`, `room-client-browser`
- [x] console.log / código comentado / TODO sin backlog: sin logs de depuración añadidos
- [x] Nombres fuera de glosario o de transición: sin v2/old/legacy
- [x] Demolición completa: sin Google STUN en el visor; sin quirk A
- [x] Tests prueban comportamiento: chat texto, validate ok/fail, state post-hangup
- [ ] Arranque real dos browsers A/V: ⏳ (headless data/chat sí)
- [x] README del paquete refleja el contrato
- [x] Diff = alcance U89 (no U90 / no BACKLOG)

## Hallazgos fuera de alcance

- Angular host `ng build` no se ejecutó en este WP (toolchain Angular no
  instalada en el paquete); runtime operativo = shell ESM + fuentes Angular
  bajo `projects/` (hermano operator-ui). Candidato: WP para `npm --prefix
  packages/mesh/webrtc-viewer` install + build:all como CI job.
- Quirk A documentado en U88: confirmado al portar — nuestra impl no lo
  reproduce (hallazgo cerrado para el port U89).
- Coturn VPS sigue ⏳ (ops), igual que U88.

## Dudas / bloqueos

Ninguno bloqueante. El CA de “dos navegadores video” queda ⏳ honesto;
orquestador puede pedir demo humana con `ZEUS_OPEN_BROWSER=1` + fake devices.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
