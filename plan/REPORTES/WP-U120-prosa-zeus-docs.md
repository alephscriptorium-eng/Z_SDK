# WP-U120 · prosa-zeus-docs — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (Cursor Grok) |
| fecha | 2026-07-18 |
| rama | `wp/u120-prosa-zeus-docs` |
| commit(s) |  (+ este tip) |
| estado propuesto | listo para revisión |

## Qué se hizo

Se refactorizó la prosa del portal `docs/` (~23 md): nueva
`docs/guide/estado.md` concentra WP-U## / D-## / olas / ⏳; las páginas
doctrinales describen producto. Se corrigieron bloques de comando rotos
(anotaciones fuera del bash; demos vía `cd ../Z_SDK-games-library`). La
regla «dos juegos» pasó a forma paramétrica (≥2 juegos de referencia).
Tabla mínima de paquetes engine + puntero a `packages/engine/*/package.json`.
P1-sin-negación en doctrinales; heros/lemas de `docs/index.md` intactos
(D-24). Sidebar VitePress enlaza estado. Sin tocar library docs ni código
de producto.

## Archivos tocados

- creado `docs/guide/estado.md` — estado/swarm (ids, olas, ⏳)
- modificado `docs/guide/{getting-started,layout,two-games,external-handshake}.md`
- modificado `docs/{index,editor/index,playbook/index}.md`
- modificado `docs/engine/{index,http-contract,protocol,authority-kit,rooms-presets}.md`
- modificado `docs/games/{index,delta,pozo}.md`
- modificado `docs/mesh/{index,coturn-runbook}.md`
- modificado `docs/contracts/{asyncapi,mcp-resources}.md`
- modificado `docs/.vitepress/config.mjs` — nav Guía + etiqueta
- creado `plan/REPORTES/WP-U120-prosa-zeus-docs.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- Spot-check scripts citados en bloques (existencia en `package.json` raíz):

```
OK docs:dev
OK docs:build
OK lint
OK gates
OK start:socket-server
OK start:cache-browser
OK start:firehose
OK start:player
OK start:player-3d
OK start:3d-monitor
OK start:editor
OK start:oasis-webrtc
OK smoke:external-consumer
OK spec:generate
OK spec:asyncapi:html
OK spec:redoc
OK spec:generate:all
OK e2e:webrtc-signaling
```

- `npm run docs:build` → exit 0 (specs + Redoc + AsyncAPI HTML + VitePress
  `build complete in 18.92s`). Specs regenerados en `packages/**/spec` se
  descartaron del commit (ruido EOL / fuera de alcance prosa).

- Grep CA doctrinales (excluida `guide/estado.md`):

```
$ rg -n 'WP-U|D-[0-9]|ola [0-9]|⏳|puede estar|consultado 20' docs/ --glob '*.md' -g '!**/estado.md'
ZERO hits
```

- Heros intactos (`docs/index.md`):

```
text: Crear juegos, no dialectos
delta y pozo son la prueba — dos juegos, un kit.
```

- Demos library (`npm run demo:arg` / `demo:pozo` tras `cd ../Z_SDK-games-library`):
  ⏳ sin verificar en este worktree (scripts documentados como en README raíz;
  spot-check de existencia de scripts library no corrido aquí).

## Demolición

Prosa de estado/swarm mezclada en doctrinales; anotaciones dentro de bloques
bash; contador fijo «dos juegos» como doctrina; números de puerto muertos en
tablas de producto (`:3025` / `:4131` en getting-started).

```
$ rg -n 'WP-U|D-[0-9]|ola [0-9]|⏳' docs/ --glob '*.md' -g '!**/estado.md'
(sin hits)

$ rg -n 'demo:arg \(en Z_SDK|test:arg' docs/
(sin hits)
```

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: ejemplos de puerto docs apuntan a
  `.env.example` / presets-sdk; quitados `:3025`/`:4131` de tabla producto.
  Hero/URLs de catálogo público (dominio objetivo) se mantienen como docs.
- [x] Cadenas if/switch que debieron ser tabla: N/A (solo markdown).
- [x] Duplicación con otros paquetes: N/A.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: no `legacy`/`v2`; «dos juegos»
  queda solo en hero (exento D-24) y en estado histórico.
- [x] Demolición completa (grep arriba): sí en doctrinales.
- [x] Tests prueban comportamiento: N/A (WP docs); CA = docs:build + grep.
- [x] Arranque real verificado: docs:build sí; demos library ⏳.
- [x] README/specs del paquete: no tocados (README raíz fuera de alcance).
- [x] El diff contiene solo el alcance del WP: sí (`docs/` + reporte).

## Hallazgos fuera de alcance

- `README.md` raíz sigue con WP-U## / D-8 / demos con prosa de estado — no es
  el portal VitePress; candidato a scrub aparte o U121-adjunto.
- Playbook runner en library (`zeus-playbook-run`) spot-check ⏳: depende de
  workspaces/instalación library.
- `docs:build` regenera specs con churn EOL en Windows — no commitear de
  pasada.

## Dudas / bloqueos

Ninguno. Listo para revisión orquestador.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
