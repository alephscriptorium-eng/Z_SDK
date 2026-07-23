# REPLAN · Sprint 7 · ts-compat + extracción mcp-core-sdk

| dato | valor |
| ---- | ----- |
| Fecha | 2026-07-23 |
| Rol | orquestador-Z |
| Handoff | `C:\S_LAB\vigilancia\z\HANDOFF-APERTURA-ORQUESTADOR-Z.md` (+ copia `handoffs/`) |
| Tip auditado | `aa368b62d911b8dedc82a8af1a0a9d9315a35712` = `origin/main` |
| CI tip | CI `29969972042` success · Docs `29969971978` success |
| Gate | **R1-Z FAIL** · sin 🔶 / sin despacho hasta nuevo `Rn-Z PASS` |
| Proyección | DC-15 **LOCAL-ONLY** |

## Veredicto de triage (código vivo)

### Arco A · ts-compat — cinco paquetes tipados confirmados

| paquete | root `types` | subpaths sin `types` |
| ------- | ------------ | -------------------- |
| `@zeus/protocol` | sí | `./contract` `./roles` `./gates` `./acl` `./peer-card` **`./peer-card-seat`** `./node*` `./spec*` |
| `@zeus/presets-sdk` | sí | todos los subpaths (`./env` … `./horse`) |
| `@zeus/rooms` | sí | ninguno (solo `.`) |
| `@zeus/ui-3d-kit` | sí | `./node` |
| `@zeus/webrtc-signaling` | sí | `./peer-session` `./messages` `./peer-card-gate` |

Semilla «cinco paquetes» = estos cinco (validado en árbol; no en cuaderno externo).

Smoke U54 (`scripts/smoke-external-consumer.mjs`): tarball + Node/Bun — **no**
compila TypeScript desde registry.

Fase 2 (kits BARE del grafo directo de los cinco, publishables): p. ej.
`view-kit`, `game-engine`, `authority-kit`, `room-client-browser`,
`http-contract`, `ui-kit`, `app-shell`, `player-mcp-kit`, `socket-server`,
más fans de protocol (`acta-kit`, `parte-kit`, `embajador-kit`, …). Alcance
exacto del lote U157 = enumeración en el brief al despachar.

### Arco B · extracción — grafo de dependencia cruzada

| consumidor `@zeus/*` | dep runtime | superficie usada |
| -------------------- | ----------- | ---------------- |
| `@zeus/rooms` | `@alephscript/mcp-core-sdk` `^1.5.0` | `SocketClient` (`/client`): ctor, `.io`, `.room` |
| `@zeus/socket-server` | idem | `SocketServer` (`/server`): ctor, `createNamespace`, `.io`; `SocketClient` en relay |
| `@zeus/webrtc-signaling` | **sin** dep directa | solo `import()` de tipos hacia `/client` (vía rooms) |

Fuera del corte `@zeus/*` (residual, no bloquea el arco):
`package.json` raíz + `scripts/spec-generate.mjs` (`/spec`);
`examples/ping-pong-bots` (`/client`, `/channels`).

**Paquete propuesto:** `@zeus/socket-core` — superficie mínima client+server
que hoy vive en mcp-core-sdk; consumidores `@zeus/rooms` + `@zeus/socket-server`;
tipos para webrtc-signaling.

## Olas y dependencias

```text
[higiene custodio + Rn-Z PASS + GO implementación]
                │
    ┌───────────┼───────────────────────┐
    ▼           ▼                       ▼
  U155        U156                    U159
  protocol    presets/webrtc/ui-3d    scaffold socket-core
  types       types subpaths          (arco B)
    │           │                       │
    └─────┬─────┘                       │
          ▼                             ▼
        U157 (∥ opcional tras 155/156) U160 migrar + cortar dep
        .d.ts grafo cercano               │
          │                               ▼
          └──────────► U158 ◄────────── U161 smoke scope @zeus
                       smoke TS CI         + demolición residual
```

| WP | arco | est. | deps | eje |
| -- | ---- | ---- | ---- | --- |
| U155 | A·f1 | M | — | IV (subpath = contrato) |
| U156 | A·f1 | M | — | IV |
| U157 | A·f2 | L | U155+U156 | IV |
| U158 | A·f3 | M | U155+U156 (U157 refuerza) | C8 registry |
| U159 | B | L | — | I |
| U160 | B | M | U159 | I + II |
| U161 | B | M | U160 | I + II |

**Paralelismo post-PASS:** `U155 ∥ U156 ∥ U159`. Luego `U157 ∥ U160`.
`U158` tras tipado de los cinco; `U161` cierra B.

**Estimación total:** ~8–10 worker-días (sin contar higiene ni publish ops).

## CA transversales (todos los WP de producto)

- Changeset en todo paquete publicable tocado.
- Evidencia literal en reporte; lo no corrido = `<pendiente>`.
- Worktree bajo `C:\S_LAB\.worktrees\z\` + rama `wp/uNNN-*`.
- DC-15 local-only: **cero** Issues API.
- Identidad git solo por `-c user.name=Vigilante-Z -c user.email=…` si hace falta.

## Bloqueos pre-despacho (custodio / SOL)

1. ~~Diff init~~ — **resuelto** (working tree limpio fuera de `plan/`).
2. ~~Worktree FS huérfano~~ — **purgado** (`wp-sem-z-skills-0.8.0` ausente).
3. ~~Poda remota `wp/*`~~ — **hecho** (3 ramas borradas en origin).
4. Nuevo gate **`Rn-Z PASS`** (SOL vía custodio) — **pendiente**. AVISO:
   [AVISO-R2-Z-plan-listo.md](AVISO-R2-Z-plan-listo.md).
   Evidencia higiene:
   [ACTA-R1-Z-higiene-2026-07-23.md](ACTA-R1-Z-higiene-2026-07-23.md).

## Estado orquestador tras este replan

- BACKLOG: Sprint 7 con **U155–U161 ⬜** (sin 🔶).
- Briefs borrador en `plan/REPORTES/briefs/WP-U15*.md` … `WP-U161-*.md`.
- Higiene §8 local: cumplida tras GO custodio de purga (2026-07-23).
- **No** se abre obra hasta PASS + GO implementación. **No** Issues.
