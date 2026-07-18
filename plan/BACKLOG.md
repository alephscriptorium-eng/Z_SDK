# BACKLOG — refundación por olas

Convención: WPs autocontenidos con **CA** (criterios de aceptación
verificables) y **Demolición** (lo que se borra en el mismo WP). Estados:
⬜ pendiente · 🔶 en curso (agente + fecha) · ✅ aceptado (solo orquestador).
Dependencias explícitas; dentro de una ola, lo no dependiente es paralelizable.

El backlog de features del juego **delta** vive aparte en
`packages/arg/spec/BACKLOG.md` (fases 1.6/2) y puede avanzar en paralelo:
la refundación está ordenada para no pisarlo (delta ya habla el patrón bueno).

**Historia de olas 0–10 + colas cerradas:** [BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md)
(archivado WP-U118). Balance: [RE-PLAN.md](RE-PLAN.md). Acta:
[ENTREGA-2026-07-18c.md](ENTREGA-2026-07-18c.md).

---

## Remate — estado swarm (2026-07-18 · estabilización U118)

> **Refundación drenada** (olas 0–10 + higiene + remate D-22 / A-14–A-15).
> **Frente post-refundación (capa B)** drenado en código: U109–U117 ✅.
> **0 DA** abiertas. **0 🔶**. Línea de producto en **`main`**.
> Publish real ⏳ ops → U55 — **no 🔶**. DNS custom U106/U107 ⏳ ops.
> Diferidos U87 §5–6 → [DECISIONES.md](DECISIONES.md) / horizonte (**sin GO**).

| Frente | WP | Estado |
| ------ | --- | ------ |
| Olas 0–10 + higiene + remate D-22 | U00…U108 | ✅ (detalle en histórico) |
| Post-U87 — micro + editor + schema | **U109–U117** | ✅ |
| Estabilización mesa plan (colas/archivo) | **U118** | ✅ |
| Publish real → demoler `file:` | ops + **U55** | gated registry+token |
| Sidecar blob live U100/U101 | — | diferido D-22 |

**⬜ / bloqueados:**
- **U55** — demoler `file:` (dep **publish real**; **no 🔶** hasta tick ops)

**En curso:** — (ningún WP 🔶)

**Next steps (solo con GO usuario):**
1. Ops: `NPM_TOKEN` + registry → desbloquea **U55**
2. Ops: Custom domain / HTTPS `z-sdk.escrivivir.co` · `games.z-sdk.escrivivir.co`
3. Residuales abajo (peer-card / STOP_SERVICES / higiene) — **sin GO** → sin WP
4. Diferidos §5–6 / horizonte U71–U74 — no inventar micros

**NO subir:** ramas `wp/*` (ya mergeadas) · `claude/*`.

---

## WP-U118 · Estabilización mesa plan — ✅

- ✅ **WP-U118 · Estabilización mesa `plan/`** — aceptado (orquestador /
  2026-07-18). Archiva olas/colas cerradas en
  [BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md); compacta remate + una cola
  residual viva; punteros claros a RE-PLAN / ENTREGA-18c; scrub vocabulario
  externo ajeno → idioma zeus (frente / capa B / ola). **Sin** activar
  U55, ops, diferidos §5–6, micros peer-card / STOP_SERVICES.
  **CA:** BACKLOG vivo legible; histórico consultable; 0 🔶; scrub
  vocabulario externo ajeno → 0 hits en `plan/`.
  **Demolición:** ruido de remate (next-steps ✅ interminables) y ~33
  secciones «Cola hallazgos» del tablero vivo (viven en histórico).

---

## Cola residual viva (sin GO → sin 🔶 / sin WP nuevo)

Candidatos de higiene; **no** abrir frente sin GO explícito del usuario.

- Viewer fabrica peer-card local (cara ciega / residual U93) — firma SSB vs
  micro «visor pide card»
- `ZEUS_STOP_SERVICES` / stop targets pozo·solve (residual U109 / presets)
- Harness U100 cid hex → formato SSB `&…sha256` (live diferido D-22)
- CRLF `spec-sync` / `types-sync` Windows; dual-emit `arg:*`; flake e2e DJ
- (U102) `resolveStopServicePorts` switch→tabla; fixture firehose duplicada;
  linea-system fixture mínima; `ZEUS_SCRIPTORIUM_ROOM` en room-client
- (U114) env sibling library sin link `@zeus/startpack-kit` (ops/link)
- Residuales de olas en [BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md) (colas
  por WP) — no reabrir en bloque

---

## Ops gated (fuera del swarm hasta tick)

- **⬜ WP-U55 · Demoler deps `file:`** — tras publish real
  (`NPM_TOKEN` + registry `npm.scriptorium.escrivivir.co`). Detalle CA en
  histórico (Ola 5).
- DNS / Custom domain ⏳: `z-sdk.escrivivir.co` (U106) ·
  `games.z-sdk.escrivivir.co` (U107)
- Sidecar / `ZEUS_BLOB_*` — **DIFERIDO** D-22

---

## Horizonte (post-refundación, no tomar aún)

- **WP-U71 · VOLUMES p2p** — content-addressable (IPFS candidato); transporte
  sobre layout inmutable (DATOS.md §5).
- **WP-U72 · Persistencia del estado de rooms** — snapshot/ledger → colas
  files-first (D-13).
- **WP-U73 · El teatro de la capa 2 SSB** — identidad SSB / puente L1↔L2;
  depende spikes externos.
- **WP-U74 · Juego trenzado sobre forces** — myth-maker/debunker sobre
  U86 + U91/U92; candidata horizonte.
- **(diferido U87 §5 · sin WP)** linea-aleph vivo — DECISIONES §abiertas.
- **(diferido U87 §6 · sin WP)** skills stub network-engine — DECISIONES.
