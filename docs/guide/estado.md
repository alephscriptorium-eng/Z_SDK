# Estado del swarm (histórico)

Esta página concentra **ids de WP**, **decisiones (D-##)**, **olas** y
**verificaciones pendientes (⏳)**. Las demás páginas del portal describen
producto; aquí vive el rastro de planificación.

Fuente viva del tablero: [`plan/BACKLOG.md`](https://github.com/alephscriptorium-eng/Z_SDK/blob/main/plan/BACKLOG.md)
· decisiones: [`plan/DECISIONES.md`](https://github.com/alephscriptorium-eng/Z_SDK/blob/main/plan/DECISIONES.md).

## Decisiones citadas en el portal

| Id | Qué fija (resumen) |
| -- | ------------------ |
| D-8 | Regla paramétrica de juegos de referencia: el engine sirve a ≥2 juegos independientes o no es engine |
| D-17 | ICE propio (coturn FOSS); sin Google STUN en producción |
| D-18 | Frontera pública = registry `@zeus/*` para consumidores anónimos |
| D-24 | Sprint 1: heros/lemas de marca EXENTOS del scrub P1-sin-negación |

## WPs / olas que dejaron rastro en docs

| Id / ola | Tema |
| -------- | ---- |
| ola 4 / WP-U40 | RouteEntry → proyección resource MCP (`@zeus/http-contract`) |
| ola 5 / WP-U53 | Pipeline de publish / changesets |
| ola 6 / WP-U61 | Juegos viven en `Z_SDK-games-library`; monorepo = engine + editor + mesh + examples |
| WP-U51 | Layout conceptual engine/editor/mesh (move físico de carpetas según backlog) |
| WP-U86 | Kit CARPETA DRAMATURGO en la library |
| WP-U87 | SOLVE ET COAGULA (tercer juego de referencia en la library) |
| WP-U88 | coturn / ICE env (`resolveIceServers`) |
| WP-U90 | Señalización WebRTC + DMs SSB vía pub (`oasis-webrtc`) |
| WP-U107 | Catálogo público games (Pages library) |

## Verificaciones pendientes

| Tema | Estado |
| ---- | ------ |
| Install-from-registry live (consumidor externo) | ⏳ hasta credencial durable + publish verde (ver Sprint 1 / U122→U55) |
| coturn en VPS de producción | ⏳ ops: credenciales/acceso al VPS del pub |

## Lectura recomendada

- Regla de juegos: [guide/two-games](/guide/two-games)
- Handshake externo: [guide/external-handshake](/guide/external-handshake)
- Runbook coturn: [mesh/coturn-runbook](/mesh/coturn-runbook)
