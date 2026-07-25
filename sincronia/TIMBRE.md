# TIMBRE · carril Z (zeus-sdk)

Campanilla — no buzón. Contrato: `PROTOCOLO.md` §7.
Append-only de líneas `PING …`. Dueño puede rotar a `notas/timbre-<fecha>.md`.

Formato único admitido (una línea, nada más) — ejemplo **indentado a
propósito**: una plantilla a columna 0 la contaría el watcher como ping real.

```text
  PING <YYYY-MM-DD HH:MM> · DE=<X> · HILO=<id|-> · REF=<ruta absoluta de la nota>
```

Vigilado por **estación-timbre v0** (watcher propio, INTERVAL 45,
`C:\S_LAB\vigilancia\z\watch.log`). Recibir un PING **no** autoriza a
procesarlo: `HILO=-` o hilo no autorizado → se encola y se reporta al
custodio (§5 · §7).

---
