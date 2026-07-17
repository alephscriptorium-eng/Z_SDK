# WP-U20 · view-kit — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U20) |
| fecha | 2026-07-17 |
| rama | `wp/u20-view-kit` |
| commit(s) | `4ad240e` feat(view-kit) · `e340c04` refactor(arg-console)! · `45a95d3` docs(reportes) |
| estado propuesto | listo para revisión |
| push | no intentado |
| browsers | no launch (`ZEUS_OPEN_BROWSER` no set) |

## Qué se hizo

Se creó `@zeus/view-kit` en `packages/lib/view-kit` (ubicación provisional
hasta WP-U51): kit browser-safe servido por import-map (`/view-kit`).
Contiene escena, HUD, room, channel-events, labels, log-panel, stick-poses/
puppet, panel, actors-layer, horse-client, cloak-panel, contact-render.
arg-console monta el paquete y las vistas tablero/jugador lo importan.
Las piezas acopladas a `@zeus/arg-domain` (delta-stage, gotas, inspector,
intent-client, sea-action) viven en `assets/js/delta/` junto a las vistas.
Se demuele `assets/js/kit/`.

**¿pozo puede consumir @zeus/view-kit tal cual?** Sí, para escena / HUD /
paneles / stick / room / actors / HORSE-cloak-contact. No incluye escenario
ni inspector de dominio (siguen en el juego). Corte D-8 / gate arg-import.

## Archivos tocados

- creado `packages/lib/view-kit/**` — paquete + tests + README + paths.node
- creado `packages/arg/arg-console/assets/js/delta/**` — helpers de vista delta
- borrado `packages/arg/arg-console/assets/js/kit/**` — demolición
- modificado `arg-console` server/shell/vistas/tests — consumo import-map
- modificado `eslint.config.mjs` — globals browser para view-kit/src
- modificado `package.json` / lock — script `test:view-kit`, workspace
- creado `plan/REPORTES/WP-U20-view-kit.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm test -w @zeus/view-kit` → exit 0:

```
# tests 30
# pass 30
# fail 0
```

- `npm run test:arg-console` → exit 0:

```
# tests 32
# pass 32
# fail 0
```

(incluye `GET /view-kit/index.mjs → 200` y cadena de imports sin 404)

- `npm run e2e:arg` (sin `ZEUS_OPEN_BROWSER`) → exit 0 (2ª corrida):

```
✅ G-ARG-E2E.1 consola · health 200, shells ok
…
✅ G-ARG-E2E.10 track:cast · firehose://synthetic/5/0#brindis
🟢 e2e CAUDAL: todos los gates en verde
```

(1ª corrida: flaky G-ARG-E2E.10 timeout; reintento verde — hallazgo)

- `npm run lint` → exit 0 (0 errors; 16 warnings preexistentes ajenos).
- `npm run gates` → `gates: OK (0 offenders)`.

- Vista humana / captura de `demo:arg`: ⏳ sin verificar (swarm headless;
  `ZEUS_OPEN_BROWSER` no set; CA permite anotación honesta).

## Demolición

1. `packages/arg/arg-console/assets/js/kit/` → eliminado entero.

```
$ ls packages/arg/arg-console/assets/js/kit
ls: cannot access '.../assets/js/kit': No such file or directory

$ rg -n "assets/js/kit" packages/arg --glob '!**/node_modules/**'
(sin matches)
```

Referencias vivas a `assets/js/kit` en **3d-monitor** (ancestro) quedan
fuera de alcance — WP-U22.

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no nuevos; room-client sigue
      por paths absolutos `/assets/room-client/…` (patrón previo).
- [x] Cadenas if/switch que debieron ser tabla: no introducidas.
- [x] Duplicación con otros paquetes: 3d-monitor aún tiene kit hermano
      (U22); no se copió — se extrajo el de arg-console.
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: prefijo panel
      `delta:` → `vk:` (quita nombre de juego); sin legacy/v2/old.
- [x] Demolición completa (grep arriba): kit de arg-console cero refs.
- [x] Tests prueban comportamiento: unitarios migrados + server chain.
- [ ] Arranque real verificado: e2e levanta console (health/shells);
      mirada visual demo:arg ⏳.
- [x] README del paquete escribe el contrato import-map.
- [x] Diff solo alcance U20 (salvo hallazgo flaky e2e ajeno).

## Hallazgos fuera de alcance

- `e2e:arg` G-ARG-E2E.10 flaky (1ª corrida rojo, 2ª verde) — timing
  track:cast; no tocado en este WP.
- `packages/platform/3d-monitor` aún tiene `assets/js/kit/` propio —
  demolición prevista en WP-U22.
- Colisión de nombre: arg-console `src/view-kit/` (SSR defineView) ≠
  `@zeus/view-kit` (browser). U21 puede alinear/renombrar el SSR.
- LOC real del kit era ~2.6k (BACKLOG citaba ~4.6k).
- Clave localStorage de paneles cambió (`vk:…`): posiciones guardadas
  del usuario se resetean (aceptable en extracción).

## Dudas / bloqueos

Ninguna. Listo para revisión del orquestador.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
