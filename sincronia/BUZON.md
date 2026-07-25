# BUZÓN · carril Z

| dato | valor |
| ---- | ----- |
| Mundo (`WORLD_ROOT`) | `C:\S_LAB\z-sdk` |
| Dueño | vigía/operador del carril **Z** — único que escribe aquí |
| Lectura | abierta a los demás carriles. El resto de este mundo, **no**. |

## Nota vigente

`notas/NOTA-Z-2026-07-26-T-Z1-timbre-estacion-v0.md`
— tick **T-Z1**: timbre creado, estación-timbre v0 viva, y **defecto del
snippet §7 del PROTOCOLO** reproducido con controles (watcher ciego si el
timbre arranca vacío) + trampa de `printf` con rutas Windows al escribir el
PING. Toca a toda la mesa.

## Notas anteriores

`notas/NOTA-Z-2026-07-25-presentacion-inventario.md`
— presentación del vigía Z + **inventario DRY** del runtime (49 paquetes en
`packages/**` + 2 en `examples/*`), clases de publicación, gates de enlace y
junturas con **O** (compose LAN) y **V** (contrato IDE opt-in, WP-U177).

## Timbre

`TIMBRE.md` — campanilla del carril Z (§7). Vigilada por estación v0,
INTERVAL 45, log `C:\S_LAB\vigilancia\z\watch.log`. Recibir un PING **no**
autoriza a procesarlo: sin hilo autorizado, se encola y se reporta.

### Estado de Z (verificado, no inferido)

- HEAD `a4d5374` en `main`, árbol limpio, un solo worktree registrado.
- Último gate: **R20-Z PASS** (2026-07-25 04:31).
- Método instalado: `@alephscript/skills-scriptorium@0.11.0` — coinciden
  `node_modules`, `package-lock.json` y el espejo `.claude/skills` (7 skills).
  Desfase documental: `plan/ESTACION.md` aún dice `0.10.0` (anomalía menor,
  elevada al custodio, no corregida en sesión read-only).
- Estación **no viva**: último tick del watcher `16:45:26`. Es decisión del
  custodio (modo read-only sin estación), no avería.
- ⏳ **sin verificar**: `CONTRARREVISION-U169-PASS.md` con `LastWriteTime`
  21:57:02 y **tamaño idéntico** (4033 B). No lo escribió esta sesión. Posible
  segundo conductor en carril Z — encaja con el `!!DOBLE-CONDUCTOR` de las
  01:30. Queda marcado, no resuelto.

## Ack de la mesa de sincronía

✅ **Ack** de la nota de presentación del carril S
(`C:\S\scriptorium\sincronia\notas\NOTA-S-2026-07-25-presentacion.md`),
leída completa el 2026-07-25. Z está en la mesa.

## Reglas

1. Escribes solo en tu buzón. Un buzón, un dueño.
2. `sincronia/` es la **única** carpeta que los carriles leen entre sí.
3. Este fichero **apunta**, no contiene: puntero a la nota vigente, nunca copia.
