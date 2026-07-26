# NOTA · T-Z1 · timbre + estación v0 · **con defecto del snippet §7**

| dato | valor |
| ---- | ----- |
| Emisor | vigía del carril **Z** · estación `C:\S_LAB\vigilancia\z` |
| Mundo | `C:\S_LAB\z-sdk` — codebase **zeus-sdk** |
| Fecha | 2026-07-26 |
| Tick | `T-Z1 · TO=Z · ALCANCE=leer PROTOCOLO §7-§8 + crear sincronia\TIMBRE.md + arrancar estación v0 sobre tu timbre + PING a S (HILO=-)` |
| Audiencia | **Anfitrión** (dueño de PROTOCOLO) · **S** · y por rebote **G**, **L**, **V**, **O** |

---

## 1 · Alcance ejecutado

▸ **PROTOCOLO §7-§8 leído** (documento completo + `HILOS.md`). Hilos abiertos
hoy: ninguno. Por tanto todo PING que reciba con `HILO=-` se **encola y se
reporta**, no se procesa (§5 · §7).

▸ **`C:\S_LAB\z-sdk\sincronia\TIMBRE.md` creado.** Campanilla append-only,
formato único de §7. Cero pings recibidos al cierre de esta nota.

▸ **Estación-timbre v0 arrancada** sobre mi propio timbre, INTERVAL 45, log en
`C:\S_LAB\vigilancia\z\watch.log`. Evidencia del arranque:

```text
[2026-07-26 00:26:05] estacion-timbre v0 Z: arranque (snippet corregido) · timbre=sincronia/TIMBRE.md · base=0 ping(s)
[2026-07-26 00:26:05] tick
```

▸ **PING a S** emitido con `HILO=-` y `REF` a esta nota.

## 2 · ⛔ Defecto del snippet de estación v0 (§7) — afecta a toda la mesa

**El watcher que publica el PROTOCOLO nace ciego si el timbre arranca vacío.**
No es teoría: lo arranqué literal, lo medí y lo reproduje aislado.

Causa: `grep -c` **sale con código 1 cuando cuenta 0**. En la línea

```text
N=$( [ -f "$T" ] && grep -c '^PING ' "$T" || echo 0 )
```

con timbre sin pings, `grep` imprime `0` **y** falla, así que el `|| echo 0`
añade **otro** `0`. Resultado: `N` no vale `0`, vale `0\n0`. A partir de ahí
`[ "$M" -gt "$N" ]` es un error de expresión entera, cae siempre por el `else`
y **ningún ping se anuncia jamás**.

Probe reproducible (control positivo + falso negativo), salida literal:

```text
== CONTROL NEGATIVO: snippet §7 con timbre de 0 pings ==
N_original=[0
0]
M_original=[1]
original: NO DETECTA (falso negativo)

== CONTROL POSITIVO: snippet corregido ==
N_fix=[0]
M_fix=[1]
fix: DETECTA 1 ping(s)

== FALSO NEGATIVO del fix: sin pings nuevos no debe avisar ==
fix: silencio correcto
```

Corrección mínima (dos líneas, misma forma, portable Git Bash):

```bash
N=0; [ -f "$T" ] && N=$(grep -c '^PING ' "$T" || true)
M=0; [ -f "$T" ] && M=$(grep -c '^PING ' "$T" || true)
```

**Clase del defecto, no instancia:** cualquier carril que haya arrancado su
estación con el timbre **vacío** está hoy en falso silencio. El síntoma es
cruel: el log tiquea con normalidad, así que parece sana. Quien arrancó con
al menos un ping ya presente (caso de **S**, que pingó su propio timbre a las
00:22) funciona **por casualidad**, no por diseño — y volverá a romperse si
rota el timbre a `notas/` y queda a cero.

**Verificación de facto para cada carril**, sin tocar nada:

```text
grep -n 'base=' <OUT_DIR>/watch.log | tail -1
```

Si la línea de arranque muestra `base=0` partida en dos renglones
(`base=0` / `0 ping(s)`), tu estación es de las ciegas.

## 3 · ⚠️ Dos avisos menores, con su consecuencia al lado

1. **Plantilla a columna 0.** Mi primer `TIMBRE.md` incluía la línea de
   formato `PING <YYYY-MM-DD HH:MM> · …` dentro de un bloque de ejemplo. El
   watcher la contó como ping real (`base=1`), lo que se habría comido el
   primer ping legítimo. Corregido indentando el ejemplo. **Consecuencia para
   la mesa:** ningún timbre debe contener una línea que empiece por `PING ` y
   no lo sea. Vale la pena decirlo en §7.
2. **Trampa al escribir el PING: `printf` se come las rutas Windows.** Mi
   primer PING salió partido en dos renglones porque `printf` interpreta
   `\n` dentro de `…\sincronia\notas\…` como salto de línea. **No es solo
   mío:** en el timbre de S, la línea de **O** de las 00:24 quedó truncada en
   `…\o-sdk\sincronia` por la misma mordida (la dejo intacta, no es mía).
   Cualquier ruta con `\n`, `\t`, `\b` o `\f` lo sufre — y `\notas` lo tiene
   por definición del propio protocolo. Forma segura:
   `printf '%s\n' "PING … REF=C:\ruta\notas\x.md" >> TIMBRE.md`.
   Reparé mi línea; ninguna ajena fue tocada.
3. **`watch.log` compartido.** §7 manda escribir en `<OUT_DIR>/watch.log`, que
   en mi mundo es el mismo log que usa la estación de sesión del método. Hoy
   no colisiona (la de sesión está parada), pero si alguien la relanza habrá
   **dos escritores en el mismo fichero** y el lease de liveness dejará de
   decir *quién* está vivo. Mi línea de arranque declara el tipo de estación
   para poder distinguirlas; no es suficiente si coinciden.

## 4 · Lo que pido

◆ **Al custodio → Anfitrión:** corregir el snippet de §7 y hacer **broadcast**.
No es cosmético: mientras no se corrija, la campanilla de la mesa puede estar
apagada en varios carriles a la vez y todos creyendo que suena.

◆ **Al custodio:** ¿aviso yo a **G** y **L** vía PING a sus timbres, o prefieres
que salga del Anfitrión como corrección de protocolo? No lo hago sin tick:
serían escrituras en mundos ajenos y §7 solo me autoriza **una línea** de PING,
que sin nota referida no informa de nada.

★ **Recomendación (default si nadie dice lo contrario):** que §7 añada la regla
«ninguna línea del timbre que empiece por `PING ` puede ser plantilla» y que la
estación v0 escriba en un log propio (`timbre.log`) en vez de compartir
`watch.log`.

⏳ **Abierto de mi carril, sin resolver:** quién reescribió
`CONTRARREVISION-U169-PASS.md` a las 21:57 del 25/07 con tamaño idéntico. No
fui yo. Sigue marcado como posible segundo conductor.

## 5 · Handoff operativo

```text
T-Z1 · carril Z · 2026-07-26 00:26
ESTADO GO=✅; CHECK_PROTOCOLO_7_8=✅; CHECK_TIMBRE=✅; CHECK_ESTACION_V0=✅; CHECK_PING_S=✅; PASS_PROBE_SNIPPET=✅

BACKLOG
- TIMBRE de Z creado: C:\S_LAB\z-sdk\sincronia\TIMBRE.md (0 pings recibidos).
- Estacion-timbre v0 viva: INTERVAL 45, log C:\S_LAB\vigilancia\z\watch.log, base=0.
- Defecto §7 reproducido y corregido en local; snippet original deja el watcher ciego con timbre vacio.
- PING emitido al timbre de S con HILO=- y REF a esta nota.

GATES
- G1 §5 sigue intacto: recibir PING no autoriza procesar. HILO=- -> encolar y reportar.
- G2 lease: estacion viva si el ultimo tick tiene edad < 2xINTERVAL (90 s).
- G3 probe del snippet: control positivo (detecta 1) + falso negativo (silencio) ambos verdes.
- G4 timbre: ninguna linea que empiece por 'PING ' puede ser plantilla o ejemplo.
- G5 push prohibido. Git local solo bajo GO-GIT-Z, y solo sincronia/.
- G6 append seguro: printf '%s\n' "<linea>" >> TIMBRE.md. printf con la ruta en el formato
  parte la linea en \notas / \test / \bin. Ya mordio a Z (reparado) y a O (linea 00:24 truncada).

ALCANCES
- Z hizo: leer §7-§8, crear timbre, arrancar estacion v0, probar el snippet, PING a S.
- Z NO hizo: avisar a G/L (mundos ajenos, requiere tick), editar PROTOCOLO (es del Anfitrion),
  arrancar la estacion de sesion del metodo, abrir hilo, push.

SECUENCIA
1. Anfitrion corrige §7 (dos lineas) y hace broadcast a S/O/V/G/L/Z.
2. Cada carril verifica su arranque: grep -n 'base=' <OUT_DIR>/watch.log | tail -1
3. Carril con base partida en dos renglones = estacion ciega -> reiniciar con el fix.
4. Custodio decide quien avisa a G y L.
5. Z re-verifica de facto el primer PING real que reciba y lo reporta.
```

— vigía **Z** · zeus-sdk
