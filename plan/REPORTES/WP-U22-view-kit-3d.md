# WP-U22 · view-kit-3d — reporte

| dato | valor |
| ---- | ----- |
| agente | worker (chat WP-U22) |
| fecha | 2026-07-17 |
| rama | `wp/u22-view-kit-3d` |
| commit(s) | `798d4b1` refactor(3d-monitor)! · `4e334bd` refactor(player-3d-ui) · `d5434d4` docs(reportes) |
| estado propuesto | listo para revisión |
| push | no intentado |
| browsers | no launch (`ZEUS_OPEN_BROWSER` no set) |

## Qué se hizo

Se migraron las vistas de `3d-monitor` y el entry de `player-3d-ui` a
`@zeus/view-kit` (import-map `/view-kit`), siguiendo el patrón de arg-console
post-U20. Se demuele `packages/platform/3d-monitor/assets/js/kit/` entero: lo
duplicado (scene/hud/room/labels/log/channel-events) desaparece; lo específico
del tráfico demo:bots (channels/roles, ring, markers, pipes) se mueve a
`assets/js/monitor/`. Diff neto `master...HEAD`: **+130 / −472 (net −342)**.

**¿pozo puede montar una vista 3d mínima solo con `@zeus/view-kit`?** Sí:
escena, HUD, room, labels, log-panel, onChannelEvent. Los helpers de
`assets/js/monitor/` nombran roles demo:bots (ping/pong/rabbit/…) — no van al
engine; pozo no los necesita.

**¿Apps o `examples/`?** Recomendación: **seguir como apps/mesh**
(`platform/3d-monitor`, `app/player-3d-ui`). Son visores del sistema (D-9 /
ARQUITECTURA §2): rooms vivas, themes, health, e2e de sesión. Lo didáctico
del view-kit debería vivir en `examples/` como escenas/configs mínimas
reutilizadas por esos visores — no mover los portales enteros sin evidencia.
Decisión del orquestador/usuario; aquí no se movió nada a `examples/`.

## Archivos tocados

- borrado `packages/platform/3d-monitor/assets/js/kit/{scene,hud,room,labels,log-panel,channel-events,index}.mjs` — demolición del ancestro duplicado
- renombrado `kit/{channels,ring-layout,markers,pipes}.mjs` → `assets/js/monitor/`
- creado `assets/js/monitor/index.mjs` — barrel de helpers del monitor
- modificado vistas `default|ecosystem|flux|gamemap|bots-log` — imports `@zeus/view-kit` + `../monitor`
- modificado `3d-monitor` server/shell/package/README/tests — montaje `/view-kit`, cadena de imports
- borrado `3d-monitor/test/channel-events.test.mjs` — cubierto por `@zeus/view-kit`
- modificado `player-3d-ui` viewer-main/server/shell/package/README/tests — consume view-kit
- modificado `packages/lib/view-kit/README.md` — lista consumidores
- creado `plan/REPORTES/WP-U22-view-kit-3d.md` — este reporte

## Evidencia

> Regla CASOS.md: no inventes observaciones. Salida literal o `⏳ sin verificar`.

- `npm test -w @zeus/3d-monitor` → exit 0:

```
# tests 15
# pass 15
# fail 0
```

- `npm test -w @zeus/player-3d-ui` → exit 0:

```
# tests 18
# pass 18
# fail 0
```

- `npm test -w @zeus/view-kit` → exit 0:

```
# tests 30
# pass 30
# fail 0
```

- `npm run e2e:player-3d` (sin `ZEUS_OPEN_BROWSER`) → exit 0:

```
   G-3D.1 OK: player-3d-ui health + shell (importmap + #viewer-config)
   G-3D.2 OK: 3d-monitor health
   G-3D.3 OK: selections.last + byActor[e2e-actor-alpha] carry targetId …
e2e player-3d-demo: OK (G-3D.1, G-3D.2, G-3D.3)
```

- `npm run lint` → exit 0 (0 errors; 16 warnings preexistentes ajenos).
- `npm run gates` → `gates: OK (0 offenders)`.

- Diff neto:

```
$ git diff --numstat master...HEAD | awk '{a+=$1;d+=$2} END {print "+"a, "-"d, "net", a-d}'
+130 -472 net -342
```

- Vista humana de demos 3d: ⏳ sin verificar (swarm headless;
  `ZEUS_OPEN_BROWSER` no set).

## Demolición

1. `packages/platform/3d-monitor/assets/js/kit/` → eliminado entero.

```
$ ls packages/platform/3d-monitor/assets/js/kit
ls: cannot access '.../assets/js/kit': No such file or directory

$ rg -n "assets/js/kit" packages/platform/3d-monitor packages/app/player-3d-ui --glob '!**/node_modules/**'
(sin matches)

$ rg -n "from ['\"].*kit/index" packages/platform/3d-monitor/assets --glob '!**/node_modules/**'
(sin matches)
```

Quedan referencias históricas en `plan/ARQUITECTURA.md` / `plan/BACKLOG.md`
(cola U20) — fuera de alcance del worker (BACKLOG solo orquestador).

## Auto-revisión (PRACTICAS.md §3 — con honestidad, no mecánica)

- [x] Puertos/URLs/rutas/rooms hardcodeados: no nuevos; mismos resolvers
      presets-sdk / `#viewer-config`.
- [x] Cadenas if/switch que debieron ser tabla: no introducidas (channels
      ya era tabla `EVENT_CHANNEL` / `ROLE_STYLES`).
- [x] Duplicación con otros paquetes: demolido el overlap con view-kit;
      monitor helpers no están en view-kit (roles demo:bots — no D-8).
- [x] console.log / código comentado / TODO sin backlog: no.
- [x] Nombres fuera de glosario o de transición: `monitor/` (no kit/legacy/v2).
- [x] Demolición completa (grep arriba): cero refs vivas a `assets/js/kit`
      en los paquetes migrados.
- [x] Tests prueban comportamiento: server chain 200 + e2e G-3D.*; unit
      channel-events sigue en view-kit.
- [ ] Arranque real verificado: e2e levanta player-3d + 3d-monitor (health/
      shells); mirada visual ⏳.
- [x] README de 3d-monitor / player-3d-ui / view-kit actualizados.
- [x] Diff solo alcance U22 (no arg-console config, no authority-kit).

## Hallazgos fuera de alcance

- `plan/ARQUITECTURA.md` §1 aún describe kit de arg-console / solape con
  3d-monitor como deuda «hoy» — desactualizado post-U20/U22; orquestador
  puede refrescar en master.
- Colisión de nombre SSR `src/view-kit/` (defineView) vs `@zeus/view-kit`
  (browser) sigue en 3d-monitor — mismo hallazgo U20; U21 puede alinear.
- A-05 dual-wire lateral (cola ola 2) — no tocado.
- `channels.mjs` / roles demo:bots podrían eventualmente vivir junto a un
  example `demo:bots` si el monitor se adelgaza; no mover ahora.

## Dudas / bloqueos

Ninguno. CA cumplido localmente; push no intentado.

---

## Revisión del orquestador

_(la rellena el orquestador: aceptado ✅ / devuelto con comentarios)_
