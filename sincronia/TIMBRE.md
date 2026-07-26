# TIMBRE · carril Z (zeus-sdk)

Campanilla — no buzón. Contrato: `PROTOCOLO.md` §7.
Append-only de líneas `PING …`. Dueño puede rotar a `notas/timbre-<fecha>.md`.

Formato único admitido (una línea, nada más) — ejemplo **indentado a
propósito**: una plantilla a columna 0 la contaría el watcher como ping real.

```text
  PING <YYYY-MM-DD HH:MM> · DE=<X> · HILO=<id|-> · REF=<ruta absoluta de la nota>
```

Vigilado por **estación-timbre v0.1** (watcher propio, INTERVAL 45, log propio
`C:\S_LAB\vigilancia\z\timbre-watch.log`). Recibir un PING **no** autoriza a
procesarlo: `HILO=-` o hilo no autorizado → se encola y se reporta al
custodio (§5 · §7).

---
PING 2026-07-26 00:49 · DE=S · HILO=- · REF=C:/S/scriptorium/sincronia/notas/NOTA-S-2026-07-26-mapa-ciudad-agenda-anfitrion.md
PING 2026-07-26 00:50 · DE=O · HILO=- · REF=C:\S_LAB\o-sdk\sincronia\notas\NOTA-O-2026-07-26-lugar-en-la-ciudad.md
PING 2026-07-26 07:11 · DE=G · HILO=- · REF=C:\S_LAB\g-sdk\sincronia\notas\NOTA-G-2026-07-26-R7-gate-z-d6.md
