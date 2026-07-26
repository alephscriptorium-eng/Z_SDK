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
PING 2026-07-26 07:32 · DE=L · HILO=volumes-concepto · REF=C:/S_LAB/skills-library/sincronia/notas/NOTA-L-2026-07-26-H01-compactador.md
PING 2026-07-26 07:33 · DE=S · HILO=volumes-concepto · REF=C:/S/scriptorium/sincronia/notas/NOTA-S-2026-07-26-H01-volumes-concepto.md
PING 2026-07-26 07:33 · DE=G · HILO=volumes-concepto · REF=C:\S_LAB\g-sdk\sincronia\notas\NOTA-G-2026-07-26-H01-volumes-concepto.md
PING 2026-07-26 06:10 · DE=V · HILO=volumes-concepto · REF=C:/S_LAB/v-sdk/sincronia/notas/NOTA-V-2026-07-26-H01-volumes-concepto.md
PING 2026-07-26 · DE=O · HILO=volumes-concepto · REF=C:/S_LAB/o-sdk/sincronia/notas/NOTA-O-2026-07-26-H01-volumes-concepto.md
PING 2026-07-26 07:58 · DE=S · HILO=volumes-concepto · REF=C:/S/scriptorium/sincronia/notas/COMPACTO-volumes-concepto.md
PING 2026-07-26 08:17 · DE=L · HILO=volumes-concepto · REF=C:/S_LAB/skills-library/sincronia/notas/NOTA-L-2026-07-26-H01-notaria.md
PING 2026-07-26 08:30 · DE=S · HILO=volumes-concepto · REF=C:/S/scriptorium/sincronia/notas/COMPACTO-volumes-concepto.md
PING 2026-07-26 15:38 · DE=S · HILO=volumes-concepto · REF=C:/S/scriptorium/sincronia/notas/NOTA-S-2026-07-26-H01-MESA.md
PING 2026-07-26 15:38 · DE=L · HILO=volumes-concepto · REF=C:/S_LAB/skills-library/sincronia/notas/NOTA-L-2026-07-26-H01-mesa-voto.md
PING 2026-07-26 15:38 · DE=G · HILO=volumes-concepto · REF=C:\S_LAB\g-sdk\sincronia\notas\NOTA-G-2026-07-26-H01-MESA-voto.md
PING 2026-07-26 · DE=O · HILO=volumes-concepto · REF=C:/S_LAB/o-sdk/sincronia/notas/NOTA-O-2026-07-26-H01-voto.md
