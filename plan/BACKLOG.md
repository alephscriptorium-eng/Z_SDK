# BACKLOG — refundación por olas

Convención: WPs autocontenidos con **CA** (criterios de aceptación
verificables) y **Demolición** (lo que se borra en el mismo WP). Estados:
⬜ pendiente · 🔶 en curso (agente + fecha) · ✅ aceptado (solo orquestador).
Dependencias explícitas; dentro de una ola, lo no dependiente es paralelizable.

El backlog de features del juego **delta** vive aparte en
`packages/arg/spec/BACKLOG.md` (fases 1.6/2) y puede avanzar en paralelo:
la refundación está ordenada para no pisarlo (delta ya habla el patrón bueno).

**Historia de olas 0–10 + colas cerradas:** [BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md)
(archivado WP-U118). Balance: [RE-PLAN.md](RE-PLAN.md). Acta cierre:
[ENTREGA-2026-07-18c.md](REPORTES/entregas/ENTREGA-2026-07-18c.md). Sprint 1 bug-fixing:
[ENTREGA-2026-07-18d-sprint1.md](REPORTES/entregas/ENTREGA-2026-07-18d-sprint1.md) · **D-24**.
Sprint 2 (ADDENDA + CAPA):
[ENTREGA-2026-07-19-sprint2/](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/) · **D-25**.
**AMEND Sprint 2** (CAPA rev2 · verdad de canales): **D-26** · fuentes
canónicas en `WEBS/ENTREGA-CAPA/` (no copiar a `plan/`).
**GO Sprint 3 / I50:** **D-33** · §Nota recibida · recepción **U142** ✅.
**GO implementación U143 ∥ U144:** **D-34**.
**Ratificación ex post U162 (acotada):** **D-41** (despachado sin GO;
conservar auditoría; no precedente; no U163–U167).
**Skills referencia versionada:** **D-35** (adoptar
`@alephscript/skills-scriptorium@0.3.0`; `plan/roles/` copia operativa).
**GO Sprint 4 — ejecución diferida D-35** (usuario · 2026-07-20):
instalación + migración skills · **U145 ∥ U146 → U147**. Procedimiento
probado: emmanuel `WP-I60` (activación skill, 0.2.0) adaptado a 0.3.0.
**GO publish condicionado P0×4:** **D-42** (activación solo al cumplir
condiciones; sin publish antes). **DA-S21 / plan R13-Z:** **D-43**
(tercer frente Dramaturgo + Zigurat — **solo planificación**).
**Ratificación Issues #16–#53 / sync-map (`46c3e5c`):** **D-44**
(excepción DC-15 acotada; LOCAL-ONLY por defecto; sin Issues nuevos;
sin impl./despacho/publish).

---

## Remate — estado swarm (2026-07-25 · **R14-Z PASS** · **PUBLISH FINAL P0×4 DONE** · **PAUSA parcial (resto)**)

> **PUBLISH FINAL P0×4 DONE** (relanzar post-pausa · orden custodio ·
> 2026-07-25): tip **`e8c5ac2`**. Versiones registry **0.1.1** ×4
> (dejan E404). Changeset `d42-go-publish-p0x4` **consumido**. Aviso:
> [AVISO-PUBLISH-FINAL-P0-DONE.md](REPORTES/entregas/AVISO-PUBLISH-FINAL-P0-DONE.md)
> (espejo `vigilancia/z/`). Pausa histórica:
> [AVISO-PAUSA-PUBLISH-FINAL-R14.md](REPORTES/entregas/AVISO-PAUSA-PUBLISH-FINAL-R14.md).
> **R13 intacto** (sin abrir U172–U178 / U73).
>
> Cadena Release: relanzar `64175cb` → Version PR Release
> **`30134377681`** (success · PR **#54**) → merge `e8c5ac2` → publish
> Release **`30134579637`** (success) · CI tip **`30134579623`**
> (success). Cancelado histórico: `30133867581`. Flip
> `private:false` P0×4 (`b717123`) · bump `3b6eb2f` → **0.1.1**.
> `gate:publish-ready` post-publish **OK**.
>
> **R14-Z PASS** (vigía Z · Dionisos / gorro de SOL · 2026-07-25):
> [GATE-R14-Z-PASS.md](REPORTES/entregas/GATE-R14-Z-PASS.md)
> (espejo `vigilancia/z/GATE-R14-Z-PASS.md`). Anclas: base `4090dab` ·
> obra `ce5b3c8` · remate obra `36393df`. U168–U171 ✅ · olas A→B→C ·
> pre-GO Release `30131689030` · contrarrevisión PASS · U170 = mecanismo.
>
> **U168–U171 ✅** (Sprint 9 / R12 obra cerrada). Pedido gate origen:
> [AVISO-R12-Z-obra-cerrada-pedido-gate.md](REPORTES/entregas/AVISO-R12-Z-obra-cerrada-pedido-gate.md).
> **PAUSA PARCIAL** sigue para R13 · U172–U178 · U73 · demoliciones
> (publish P0×4 **cerrado**). Aviso parcial:
> [AVISO-PAUSA-PARCIAL-U168-U171.md](REPORTES/entregas/AVISO-PAUSA-PARCIAL-U168-U171.md)
> (espejo `vigilancia/z/`). Corte global de origen:
> [AVISO-PAUSA-CORTE-TECNICO.md](REPORTES/entregas/AVISO-PAUSA-CORTE-TECNICO.md).
>
> Olas ejecutadas: **A** `U168 ∥ U170` → **B** `U169` → **C** `U171`
> → **Publish** D-42 P0×4 **DONE**. Replan:
> [REPLAN-2026-07-24-r12-major-band.md](REPORTES/entregas/REPLAN-2026-07-24-r12-major-band.md).
>
> **R13-Z PASS** de planificación vigente (espejo
> `vigilancia/z/GATE-R13-Z-PASS.md`; remate tip `4090dab`) — **no** es GO
> implementación R13. **R13 intacto**: **0** despacho U172–U177/U73.
>
> **R12-Z PASS · skills-scriptorium 0.10.0 adoptado.** R12-Z PASS de
> planificación vigente (`f2aab3f` + sello `2ef0d79` · remate
> `66c3696`). Adopción `@0.10.0` (D-36 `>=0.10.0 <1.0.0`) + contrato
> Node raíz **`engines.node >=22.0.0`** — tip adopción **`b348c59`** ·
> CI **`30128202345`** · Docs **`30128202336`** (PASS).
>
> Contexto: **R11-Z PASS** —
> [GATE-R11-Z-PASS.md](REPORTES/entregas/GATE-R11-Z-PASS.md). **Sprint 8
> CERRADO**. **U165 ✅** no reabrir. Tip Sprint 8: `289b7fe`. IDLE previo:
> [AVISO-IDLE-Z.md](REPORTES/entregas/AVISO-IDLE-Z.md). Allowlist:
> [PUBLISH-ALLOWLIST.md](PUBLISH-ALLOWLIST.md). **U162** ✅ (D-41 · no
> precedente). **DC-15 LOCAL-ONLY** por defecto; **D-44** excepción
> acotada solo Issues **#16–#53** + `plan/.sync-map.json` de `46c3e5c`
> (conservar; sin Issues nuevos). Aviso adopción engines:
> [AVISO-ADOPCION-0.10-engines-node22.md](REPORTES/entregas/AVISO-ADOPCION-0.10-engines-node22.md).
>
> **GO publish condicionado P0×4 (D-42) → GO FINAL DONE** (relanzar
> post-pausa). C8: `npm view` **0.1.1** ×4 en registry propio. Fuente:
> [ADDENDA-R12-Z-GO-PUBLICACION-ALLOWLIST.md](REPORTES/entregas/ADDENDA-R12-Z-GO-PUBLICACION-ALLOWLIST.md)
> · checklist
> [CHECKLIST-GO-PUBLISH-P0.md](REPORTES/CHECKLIST-GO-PUBLISH-P0.md).
> `linea-editor` = WP publish-ready **separado U178** ⬜ (PAUSA). Clases
> privadas **por decisión de producto = excluidas** (allowlist §4 · D-42).
>
> **Tercer frente Dramaturgo + Zigurat (D-43 · DA-S21 asentada ·
> `2eb4784`):** cola **R13-Z** — épica **U73** ⬜ + **U172–U177** ⬜.
> HOLD de autoridad **levantado**. Hold **operativo** = **PAUSA** (fuera
> de U168–U171) + **sin GO implementación R13**. **R13 intacto** en esta
> secuencia. Replan:
> [REPLAN-2026-07-24-r13-dramaturgo-zigurat.md](REPORTES/entregas/REPLAN-2026-07-24-r13-dramaturgo-zigurat.md).
> Fuente:
> [ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md](REPORTES/entregas/ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md).
>
> **Sprint 6 CERRADO** (GO usuario · 0.3.3): **U154** ✅ mergeado
> (`1a24a60`) — proyección backlog→Issues montada y validada en
> **dry-run local**; CA re-verificadas de facto (gate: exit 3/1/0/4;
> `custodio` en WP-U139 atrapado; 0 issues en `Z_SDK`). **Adopción 0.3.3**
> mecánica hecha (`c6d9ffb`, D-36). **OA-1 RESUELTA** (canal handoff =
> entrega manual). **OA-2 RESUELTA** (**D-38** · vía a · GO usuario):
> roles `custodio`/`vigía`/`vigilante` publicables → fuera de
> `CEGUERA_PATTERN`; patrón residual
> `mediaci|marco|addenda|§interna|instancia-ejemplo` (+ locales runtime).
> Consecuencia: proyección pública **desbloqueada en vocabulario**
> *cuando* el texto pase el gate; **no** es GO de Issues reales
> (DC-15 / LOCAL-ONLY hasta GO aparte). **D-39:** `addenda` también
> publicable (falso positivo dominio); patrón residual vigente
> `mediaci|marco|§interna|instancia-ejemplo` → gate `todos` exit 0.
> **Handoff:** 3/4 puntos **resueltos en skills 0.3.4** (semver DC-22 ·
> gate gobierno DC-23 · back-links tema DC-24, verificados de facto);
> **Punto 4 (parser)** trasladado al mundo del paquete (su **DC-25**,
> pendiente de triaje) — en zeus = cola residual (formato bullets).
>
> **Sprint 4–5 CERRADOS** (ver histórico abajo). Publish npm startpacks =
> residual (NO WP) · diferidos U87 §5–6 sin GO · persistencia custom
> domain Pages ⏳ post-deploy U143 (no bloquea).

| Frente | WP | Estado |
| ------ | --- | ------ |
| Olas 0–10 + higiene + remate D-22 | U00…U108 | ✅ (histórico) |
| Post-U87 — micro + editor + schema | **U109–U117** | ✅ |
| Estabilización mesa plan | **U118** | ✅ |
| **Sprint 1** — CI / prosa / registry | **U119–U122** | ✅ |
| Publish real → demoler `file:` | **U55** ∥ **U123** | ✅ |
| **Sprint 2 A** — capa editorial CAPA | **U124** ∥ **U125** | ✅ |
| **Sprint 2 B** — higiene (4 micros) | **U126–U129** | ✅ |
| **Sprint 2 C** — plantilla sprint | **U130** | ✅ |
| **Sprint 2 D** — docs regeneración web | **U131** | ✅ |
| **AMEND Sprint 2 A** — W-B′ verdad canales | **U132** | ✅ |
| **AMEND Sprint 2 B** — C8/C9 → PRACTICAS | **U133** | ✅ |
| **AMEND Sprint 2 C** — archivar ENTREGA-* | **U134** | ✅ |
| **Micro** — protocolo GitHub Actions | **U135** | ✅ |
| **Micro** — C8 residual startpacks | **U136** | ✅ |
| **Micro** — Docs deploy saltado ≠ verde | **U137** | N/A |
| **Micro** — bug nav API HTML (SPA) | **U138** | ✅ |
| **Micro** — bug API links cuerpo md | **U139** | ✅ |
| **Micro** — higiene rutas absolutas locales | **U140** | ✅ |
| **Micro** — ceguera token en reporte U140 | **U141** | ✅ |
| **Sprint 3** — recepción / triage GO I50 | **U142** | ✅ |
| **Sprint 3** — CNAME `docs/public/` (ambos repos) | **U143** | ✅ |
| **Sprint 3** — consulta `npm ci` vs `npm install` (catálogo) | **U144** | ✅ |
| **Sprint 4** — dep registry `skills-scriptorium@0.3.0` | **U145** | ✅ |
| **Sprint 4** — `plan/roles/` → referencia versionada (I60) | **U146** | ✅ |
| **Sprint 4** — `.claude/skills/` runner local (dep U145) | **U147** | ✅ |
| **Sprint 4** — micro demolición `.cursor/`+copilot | **U148** | ✅ |
| **Sprint 5** — baseline 0.3.1 + regla 15 citada | **U149** | ✅ |
| **Sprint 5** — gate `verificar-sitio.mjs` + slug roto | **U150** | ✅ |
| **Sprint 5** — CHANGELOG gobierno (grueso, por ola) | **U151** | ✅ |
| **Sprint 5** — docs: página Proyecto + back-links por tema | **U152** | ✅ |
| **Sprint 5** — materializar estación de vigilancia | **U153** | ✅ |
| **Sprint 6** — proyección backlog→Issues (local-only dry-run) | **U154** | ✅ |
| **Sprint 7 A** — ts-compat (types subpaths + d.ts + smoke TS) | **U155–U158** | ✅ U155–U158 · CERRADO |
| **Sprint 7 B** — extracción `@zeus/socket-core` / corte mcp-core | **U159–U161** | ✅ U159–U161 |
| **Post-Sprint 7** — auditoría publish-ready / allowlist | **U162** | ✅ |
| **Sprint 8 A** — publish-ready mesh (Ola A) | **U163 ∥ U167** | ✅ · **CERRADO** |
| **Sprint 8 B** — publish-ready mesh (Ola B) | **U164–U166** | ✅ · **CERRADO** (R11-Z PASS) |
| **Sprint 9 / R12** — major-band + contrarrevisión + prep pub | **U168–U171** | ✅ · **CERRADO** (Olas A–C) |
| **Cola publish P1** — publish-ready `linea-editor` (D-42) | **U178** | ⬜ · **PAUSA** (tras U168+U169; GO impl. propio) |
| **R13-Z** — tercer frente Dramaturgo + Zigurat (D-43) | **U73 épica · U172–U177** | ⬜ · **PAUSA** · R13-Z PASS planificación · **sin GO impl. R13** · intacto |
| Sidecar blob live U100/U101 | — | diferido D-22 |

**AMEND Sprint 2:** **A ∥ B ∥ C** — lote ✅.

**En curso:** ninguno. **PUBLISH FINAL P0×4 DONE** · **PAUSA parcial**
(R13/U172–U178/U73). U168–U171 ✅. Tip `e8c5ac2` · Release publish
`30134579637` · C8 **0.1.1** ×4. **U178** ⬜ PAUSA. **R13** intacto.
Adopción **0.10.0** + `engines.node >=22.0.0`.
**Cerrado N/A:** **U137** (premisa incorrecta; ver abajo) · ítems
Sprint 3 ya resueltos en main (guard base · dist/ · gap paths ·
economía CI) — ver triage U142.
**Aceptado:** **Sprint 8** ✅ (R11-Z PASS) · **U165** ✅ · **U164** ✅ ·
**U166** ✅ · **U163** ✅ · **U167** ✅ · **U162** ✅ · **U158** ✅ ·
**U161** ✅ · **U160** ✅ · **U157** ✅ · **U159** ✅ · **U156** ✅ ·
**U155** ✅ · **U154** ✅ · **U153** ✅ · **U151** ✅ · **U152** ✅ ·
**U150** ✅ · **U149** ✅ · sprints 1–5 (ver histórico).
**D-35** / **D-37** · **D-41** (U162 ex post acotado).

**NO subir:** ramas `wp/*` mergeadas · `claude/*`.

---

## ÉPICA F2 — mundo acabado (⬜ proyección apilada · cherry-pick del custodio · 2026-07-26 · D-45)

Origen: encargo `INFORME-R4` §2 de la mesa Scriptorium («imagina tu
WORLD_ROOT acabado; sed generosos») + **orden expresa del custodio** de
fusionar la proyección al plan. Fuente durable: repo `scriptorium-cuadernos`
rama `z_sdk-vigilancia`. Consenso vinculante: **D-45**.

**Estado global: nada abierto.** Cada WP es ⬜ hasta GO del custodio; los P0
son los que **desbloquean a otros carriles** (holón-7, contrato de datos,
verdad de la doc, fronteras O/V). Ids `F2-Z-nn` conservados por trazabilidad
con la sala. **66 WPs** = 53 nuevos (U179–U231) + 2 reencuadres (U178 ·
U71R) + **11 de la edición F2-unificada** (U232–U242 · Anfitrión + revisión
Temis: gobierno, gate 51/51, orquestador, aceptación, licencia, seguridad).

> **Mundo acabado (5 invariantes):** (1) las 51 piezas se usan — nada
> invisible; (2) se entra sin permiso y se actúa con permiso; (3) una ronda
> arranca con la red desconectada sobre root cercado y sellado; (4) la
> federación no crea autoridad y todo relay deja rastro de lo que cortó;
> (5) doc, contrato y código dicen lo mismo.

### Lane A · Superficie del runtime — de 2/51 a 51/51 (`core`)

| U | F2 | WP | BRIEF | CA tentativo | prio |
| - | -- | -- | ----- | ------------ | ---- |
| **U179** ✅ | 01 | Ficha de runtime — **matriz 51/51 explícita** | **`plan/MATRIZ-RUNTIME-51.md`** — 51 filas (26 engine · 1 editor · 21 mesh · 2 examples · 1 anidada `threejs-ui-lib`): **denominador reconciliado: 51 = 50 workspace + 1 anidada**; 0 `<pendiente>` (negativos con patrón grep declarado). 3 datos para U233: flota declarada > materializada (4+6 `workspace:null`) · puerto ciudad-lifecycle **fuera** de `presets-sdk/env` (server.mjs:13-16, verificado por orquestador) · el porte de peercard vive solo en el cliente `rooms`. Aceptado por el orquestador 2026-07-31 (rama `wp/u179-matriz-51`) | ninguna celda por inferencia ✓ · 51 filas ✓ (`grep -c` = 51) · citas grep-ables ✓ (muestreo 20 del worker + verificación del orquestador) | **P0** |
| **U180** ✅ | 02 | Catálogo ola 1 | **Ejecutado**: alta de `ciudad-lifecycle` en `mcp-launcher/src/catalog.mjs:232-244` (puerto por `presets-sdk/env`, fila en `buildPortTable`); `socket-server` **ya estaba de alta por U234 — se verifica, no se duplica**. `health` de facto **200 en las dos** vía el orquestador de U234, cero `⏳`. Literales de puerto **3 → 0** (grep re-ejecutado por el orquestador sobre los 3 ficheros = 0; gate `scanHardcodedPorts` 0 offenders); prueba de punta a punta: `ZEUS_MCP_CIUDAD_LIFECYCLE=13951` mueve **catálogo y bind** a la vez. Cierra de paso una divergencia real: `ciudad-lifecycle` leía el puerto **sin cargar el `.env` de raíz**, así que catálogo y bind podían discrepar. U234 re-verificado (20 pass/0 fail, `status all` 15 filas, orden topológico estable, 0 residuos) · `matriz-51` EXIT=0 (re-ejecutado por el orquestador). Aceptado 2026-07-31 (rama `wp/u180-catalogo-ola1`, merge `94b9b06`) | `health` de facto por entrada ✓ · sin literales ✓ | **P0** |
| **U234-B1** ✅ | — | **ACEPTADO 2026-08-01** (merge `a6b6202`, contrarrevisión adversarial **PASS a la primera** + ronda de cierre de 4 menores). **El alcance creció al medir: había DOS lectores ciegos, no uno** — además del `netstat` IPv4-only, `waitPortFree` sondeaba siempre `e.host||'localhost'` y **todas** las entradas del catálogo traen `host:'localhost'`, así que un residuo en `127.0.0.1` o `0.0.0.0` salía **declarado libre**; no era latente, era hoy. Arreglo: `['-ano']` en una pasada (40 ms vs 73 y vs 140 de la doble) + `portReleased()`, oráculo de doble lector. **El parseo no se tocó: ya era agnóstico de familia. Ningún servicio cambia de bind.** Matriz de falsación revirtiendo cada mitad: ninguna CA de polizón (reproducida por el contrarrevisor). Vectores ajenos que resistieron: **UDP en ambas familias → cero falsos «ocupado»** (el guard de estado cae esas filas antes del test de columnas) · dos PIDs en familias distintas, los dos muertos · **PID 0 y 4 no matados** · PID desaparecido entre censo y disparo · IPv6 con `%scope` de 35 chars que desborda columna · locale español. Fortaleza no declarada por el worker: **el veredicto sale del oráculo, no de `killed[].ok`**, lo que lo hace inmune a que `isAlive` mienta por EPERM. Cierre: **3 de los 4 menores eran defectos de la frase** (el comentario del oráculo prometía cazar pids ≤ 4 y no los caza — vector vivo en el **puerto 139** de esta máquina; CA-6 nombraba dos cosas y su invariante no tenía guardia, ahora **CA-9**, que salió ROJA en su primera ejecución; cabecera con 7 claves de 9). El cuarto sí era de código: en POSIX `lsof` ausente daba **«no hay listeners» en vez de «no pude mirar»** (fail-open silencioso, degradando a la variante que el propio worker demostró insuficiente) → `ENUM_NO_DISPONIBLE`, con la calibración fina de que **un exit ≠ 0 NO es error** (lsof sale 1 sin sockets). Verificado por el orquestador: ENOENT real → lanza; exit 1 sin error → lista vacía. ✎ **Alcance honesto de CA-9 medido por el orquestador y escrito en el test**: caza el enumerador que nombra el binario con **literal**, **no** el que lo construye. **No medido**: rama POSIX (no hay máquina); y `lsof` sin root sólo ve sockets del usuario invocante — contrato de **visibilidad** distinto, no sólo de familia. **Nota del operador**: el radio de la escoba creció; `stop` alcanza procesos IPv6 antes invisibles (relay WSL, port-forward Docker en `[::]`). Suites 21→**28**. ✎ Regresión mía al mergear, arreglada en `fb07dc3`: un comentario nuevo llevaba puertos literales y el gate lo cazó — verifiqué la suite y mis vectores, **pero no el gate del monorepo** | `stop` mata también el listener IPv6 ✓ · CA re-probada sobre `[::1]` ✓ · vector rojo antes / verde después ✓ | **P0** |
| ~~**U234-B1**~~ (histórico) | — | **Defecto vivo en el orquestador de U234** (hallado por U180, reproducido sobre la base sin sus cambios): `orchestrator.mjs:228` usa `netstat -ano -p tcp` (**solo IPv4**) y `socket-server` escucha en `[::1]:3017` → `status` declara `listening:false` con el servicio vivo, y `stop` sale EXIT 1 con `residualPids:[]` (salida contradictoria) **dejando el proceso huérfano**. La CA «stop sin residuos» de U234 se demostró sobre fixture IPv4, que es justo el caso que no falla. El escape del operador sí funciona (`npm run stop:services`, `stop-ports.sh:7`, sin filtro). Corrección de una línea | `stop` mata también el listener IPv6 · CA re-probada sobre `[::1]` | **P0** |
| **U237-B3** ✅ | — | **La licencia no viajó al lock** (hallado por U197). **Cifras recontadas por el worker; las heredadas comparaban universos distintos**: el desajuste eran **51/51** entradas de workspace del lock —**denominador de este WP: 51 = raíz + 50 directorios de lock, sin la anidada**— de las que 49 decían `"AIPLv1"` y **2 (`examples/game-demos`, `examples/ping-pong-bots`) no declaraban nada**; las «50 entradas» del grep eran 49 de workspace **+ 1 de registry ajeno** (`node_modules/@alephscript/mcp-core-sdk`), y «48» eran los `packages/*/*`, que **omite los 2 miembros de `examples/*`** (los miembros son 50). Los 52 manifiestos ya estaban bien: **no se tocó ningún `package.json`**. **Divergencia NO intencional** — `LICENSE.md:8` («all packages receive the identical license treatment»); «composite» califica al contenido (GPL-3.0-or-later + Animus Iocandi), no a una composición por paquete. **Causa: manifiestos cambiados sin regenerar el lock** (`bab559e` tocó 52 manifests y **0** el lock; el último commit del lock es `a4d5374`, 6 días antes). **Ejecutado**: `npm install --package-lock-only --no-audit --no-fund` → **3091→3091 claves, 0 altas/bajas, cero drift de `version`/`resolved`/`integrity`**; única línea no-licencia del diff: `is-unicode-supported` `extraneous`→`dev` (bundled de `@changesets/cli`, misma versión). Gate nuevo **regla `licencia`** en `scan.mjs` (no existía **ninguna** comprobación de licencias en CI): cruza **tres** fuentes —lado lock (claves de workspace), lado manifiesto, y **enumeración de todos los manifiestos rastreados**— por campo parseado, no por texto. **Devuelto una vez y corregido**: la contrarrevisión adversarial confirmó lock y aritmética enteros con parser propio, y encontró **dos bloqueantes en el gate nuevo** — (B1) `lock.packages ?? {}` sin validar permitía silenciarlo entero con universo vacío, y el vector `lockfileVersion:1` **también pasaba `npm ci`** con exit 0, o sea un estado alcanzable donde la licencia no viaja y todo sale verde; (B2) la garantía «por construcción» era **más ancha que el código** (universo real = claves de lock + una ruta a mano ⇒ todo manifiesto nuevo exento en silencio). Cerrados: validación de forma y de presencia de la raíz, enumeración por índice de git con exención **por clase de ruta escrita** (no lista negra), guarda de entrada no-objeto, `LICENSE.md` validado de verdad (vacío/directorio/otra licencia), y sin `return` temprano. **11 guardas fail-closed enumeradas, sin afirmar exhaustividad.** `test/gates/licencia.test.mjs` **27/27** con las dos caras rojas y los 5 vectores de B1. Línea base declarada: `npm run gates` **ya salía 1** por 3 offenders `two-games` de U202-B2 — `two-games` = 3 antes y después, `byRule.licencia` = `[]`, suite estable en **5 ejecuciones** (50 casos, 1 fallo, el preexistente). Rama `wp/u237b3-licencia-lock`; reporte `plan/REPORTES/WP-U237-B3-licencia-lock.md` | lock 51/51 con el puntero ✓ (`51 0 []`) · `AIPLv1` en el lock 50→**1** (el ajeno) ✓ · gate lee ambas fuentes y falla por las dos caras ✓ · **ninguna versión movida** ✓ (diff semántico) · cero invasión del carril D ✓ | **P0** |
| **U252** 🔶 | — | **La suite de gates MUTA EL REPO REAL y `node --test` la corre en paralelo** (hallado por el worker de U237-B3 al ver fallos intermitentes con **dos síntomas distintos**; confirmado por el orquestador al cerrar la ola 4). `test/gates/matriz-51.test.mjs` planta una pieza fantasma (`:98-112`) y **renombra fuera de sitio** `packages/mesh/blob-sync-harness/package.json` (`:137-153`). Latente hasta ahora porque **nadie observaba la ausencia de ese fichero**; la regla `licencia` de U237-B3 la hizo visible: `gates.test.mjs` corriendo en paralelo ve el manifiesto ausente y ofende. **Diagnóstico del orquestador**: cada fichero por separado 9/9, 27/27, 14/14; los tres **en serie** 50/50; **en paralelo 49/1**. Parche aplicado al cerrar la ola: `test:gates` pasa a `--test-concurrency=1` (`package.json:83`) — **serializa, no arregla**. El arreglo real es que la suite **no toque el árbol de trabajo**: enumerar desde el índice de git y aseverar contra el **estado commiteado**, que además es lo que viaja (patrón ya aplicado por U237-B3 a sus propias aserciones, `licencia.test.mjs`). Es trampa para cualquier WP futuro que afirme sobre el árbol vivo. — **Ejecutado 2026-08-01** (rama `wp/u252-gates-sin-mutar`, base `28397b8`, obra `1fdd3da`; [reporte](REPORTES/WP-U252-gates-sin-mutar.md)): **antes 49/1 · después 57/57 exit 0 sin el flag, tres corridas y `git status` a 0 líneas las tres**. Las probes (a)/(b) se montan sobre un árbol materializado desde el índice + `HEAD:`, con el propio gate copiado dentro para que su `REPO_ROOT` apunte allí y el **exit code** del CLI se siga ejercitando; parche `--test-concurrency=1` retirado. **Los CA vivos NO se mudaron** —al morir el mutador, leer el disco vuelve a ser seguro—, así que la vigilancia no se estrecha: se añade la del árbol que viaja, y se asevera que ambos dan **el mismo JSON byte a byte**. Guardián permanente `test/gates/arbol-inmutable.test.mjs` en dos mitades (estático con propagación de taint, que se pone rojo contra el fichero histórico `28397b8`; dinámico que censa mientras la suite corre en un hijo); atacado por su autor: destapó **un falso verde propio** (el hijo heredaba `NODE_TEST_CONTEXT` y salía 0 en 96 ms sin ejecutar nada) y 11 falsos positivos, ambos arreglados, y el ataque final con `fs['rename'+'Sync']` lo caza el dinámico nombrando ruta. **Ronda 2 (devolución)**: la contrarrevisión cegó **a los dos guardianes a la vez** con el idioma más corriente del repo (`import { join } from 'node:path'` sobre `plan/PUBLISH-ALLOWLIST.md`) — reproducido en verde 5/5 antes de tocar nada. Dos causas: el ancla no se propagaba por import **con nombre** de `node:path` (sí por el de `fs` — asimetría no escrita) ni por `fs.promises.*`; y el censo dinámico llamaba «conjunto de lectura» a **53 de 81** rutas. **Prueba que lo cierra: mi propio detector no cazaba los ofensores #5 y #6 de mi propio censo** (los `parte-kit`). Cerrado: `enlacesDeModulo()` resuelve espacio de nombres, nombres y alias de `node:path`/`node:url`/`node:fs`; censo desde `test/gates/conjunto-lectura.mjs`, fuente **única** compartida con la materialización; barrido estático ampliado a todo `test/gates/*.mjs`. Re-atacado con el vector literal del revisor: **rojo por las dos mitades**. Además M1 (una fuga era tautológica: sin ancla no podía girar nunca) · M2 (el hijo se lanzaba con la salida ignorada y **su código de retorno no se aseveraba**; la ventana temporal no cierra la clase porque un hijo vacuo cuesta 4-8 s **bajo carga** — ahora se exige `exit 0` y `# tests ≥ 40`) · M3 (un directorio sin rastrear provocaba un **rojo con mensaje mentiroso** culpando al arnés) · M4-M6. **Ruido medido al ampliar** a los 145 tests: 11 ofensas en 5 ficheros, 10 ciertas (= las 4 filas del censo) y 1 falsa (código dentro de una cadena). **Coste declarado**: el guardián dinámico re-ejecuta la suite, 4429 → 6140 ms (~1,4×), sin medir en CI. **Censo**: matriz-51 no era la única — quedan enrutados `test/release/release-u53.test.mjs:15,27,51` (`mkdtemp` con prefijo en la raíz del repo), los goldens self-healing de `parte-kit` sobre ficheros **rastreados** y `http-contract/test/core.test.mjs:101-112`; los tres fuera de ALCANCE_DIFF | `test:gates` verde **sin** `--test-concurrency=1` · cero mutaciones del árbol rastreado durante los tests | P1 |
| **U253** ⏳ | — | **Dos evasiones que ningún probe del carril D ve** (halladas por la contrarrevisión de U205, sin ofensor vivo hoy, verificadas abriendo fichero): **(1)** `resolveManifestPath()` es público (`manifest.mjs:35-37`, reexportado en `index.mjs:35`), así que `writeFileSync(resolveManifestPath(), x)` **no contiene ni el literal ni la constante** y ningún probe lo marca — es la misma ceguera que ya obligó a endurecer el probe en U205 (la ruta viajaba en una variable); **(2)** `ledger.mjs:16-20` devuelve `opts.ledgerPath` **verbatim y sin validar**, y `:43` apenda: vector concreto `importPack({…, ledger:{ledgerPath:'<root>/volumes.json'}})` **añade JSONL encima del manifiesto sellado** y nada lo impide. Territorio del carril | probe que ancla la **operación** (escritura sobre la ruta del manifiesto), no su notación · `ledgerPath` validado contra el cerco | P1 |
| **U254** ⏳ | — | **La fixture SSB del repo miente sobre la forma del dato** (hallada por U205, fijada por él como test permanente, verificada término a término por su contrarrevisión). `packages/mesh/ssb-system/fixtures/ssb-log.json` —**único material SSB del repo**— **no es un conjunto de feeds válido**: `sequence` es contador **GLOBAL** (alice `[1,2,3,5,8,10]`, bob `[4,7,9]`, carol `[6]`) y `previous` **cruza de feed 4 veces**, más 4 mensajes con `previous:null` y `sequence≠1`. Un pack con su export **no es importable** (`cadena_rota_en_pack`). Arrastra a cualquier CA que se apoye en ella. **NO MEDIDO y es la pregunta que decide el WP**: si el productor real del pub emite la secuencia **por feed o global** — no hay volcado real en el repo. Si fuera global, **la regla de cadena hay que redefinirla contra él**, no contra la fixture | fixture nueva que sí es un conjunto de feeds válido · la pregunta del productor real contestada con un volcado, no por lectura | P1 |
| **U255** ⏳ | — | **`driver-lineas.mjs:152-193` carece de la guarda de ancestro bloqueante** que FIREHOSE sí añadió (`blockingAncestor`, `driver-firehose.mjs:367-375`). Hallada por la contrarrevisión de U202-B2 y **presente igual en la base** (no la introduce ningún WP de la ola 4). Vector: destino con un **fichero** donde el pack trae un **directorio** → el `mkdirSync` de la fase de aplicación lanza **EEXIST a mitad de los renames**, antes de sellar y **con el volumen a medias**. Viola el contrato del carril «todo error aborta antes del primer rename». ✎ El driver SSB de U205 **NO hereda el hueco** (medido: `destino_sin_clave` / `ruta_bloqueada_por_fichero`, árbol byte a byte idéntico, cero renames) — el que falta es el de LINEAS | destino con fichero donde el pack trae directorio → error en dry, root intacto · cero renames | P1 |
| **U256** ⏳ | — | **Ni `linea-kit` ni `volumes-ops` corren en CI**: la matriz de `ci.yml:44-75` lista 25 workspaces y **no incluye ninguno de los dos** (verificado por dos agentes independientes). La única barrera automática de esa zona es `npm run gates`, que **no cubre lo que cubren esas suites** — constatación medida en U202-B2: de 10 vectores de ablandamiento de la curación, **el gate queda verde en 9**. Es decir: el carril de datos, que es el que toca el disco del usuario, es el menos vigilado por CI. Owner natural: el WP que ya tiene CI | los dos paquetes en la matriz · el test de curación y los del driver corriendo en CI | P1 |
| **U257** ⏳ | — | **`GateRule` desincronizado** entre `scripts/gates/scan.mjs:32` (**7** alternativas, tras el alta de `licencia`) y `scripts/gates/exceptions.mjs:16` (**6**). Confirmado por la contrarrevisión de U237-B3 y declarado por su worker como deuda, no descuido. Hoy **inocuo** —no hay `tsconfig` en raíz ni typecheck en CI que lo muerda—, pero es exactamente la clase de desfase que muerde el día que se añade el typecheck. Arreglo: `GateRule` a **módulo único** del que importen los dos | una sola definición · añadir una regla obliga a tocar un solo sitio | P2 |
| **U202-B2** ✅ | — | **`npm run gates` en rojo desde antes de la ola 3** (hallado por U180) — **Ejecutado 2026-08-01** (rama `wp/u202b2-gates-twogames`, base `87bd93f`): `gates: FAIL (3 offender(s))` → **`gates: OK (0 offenders)` EXIT 0**, `test:gates` **22/23 → 23/23** (el que fallaba era `gates.test.mjs:34`, «CA verde: runAllGates limpio»). **Atribución corregida**: la ficha decía «introducidos por `ca698d0`» y era falsa para 2 de los 3 — `git show ca698d0 --stat` lista 6 ficheros y **ninguno es `curation.mjs`**; `git blame` pone `curation.mjs:56` y `:68` en **`b051991a`** (padre de `ca698d0`) y sólo `driver-lineas.mjs:21` en **`ca698d03`**. Mismo WP (U202), dos commits: **`b051991a` 2/3 + `ca698d03` 1/3**. El error venía arrastrado de `WP-U180-catalogo-ola1.md:327`. Arreglo por **forma, no por excepción**: `isCuratedSidecarPath` pasa a `base.endsWith('.md')` — **ensanche estricto** (ninguna ruta protegida deja de estarlo), siguiendo el precedente del propio paquete (`loader.mjs:361` «Avoids hardcoding game-named filenames in engine code»). `exceptions.mjs` y `scan.mjs` **intactos**. Hallazgo de paso: el predicado **no decide si se pisa** — `merge` nunca mueve sobre un fichero existente, sólo elige el cajón del reporte (probado sobre el driver real). Suites: linea-kit 36/36 → **40/40**, volumes-ops **56/56** con 0 ediciones de sus tests | `npm run gates` verde · offenders 0 | P1 |
| U181 | 03 | Catálogo ola 2 (UIs) | `editor-ui`, `player-ui`, `player-3d-ui`, `3d-monitor`, `cache-browser`, `firehose-browser` | cada UI arranca desde catálogo; puerto por env | P1 |
| U182 | 04 | Presentar los 17 invisibles | 3 tandas (transporte · autoridad/juego · kits UI): qué resuelve y quién consume | cada pieza: consumida, documentada como lib, o propuesta a retiro | P1 |
| U183 | 05 | Entradas sin `workspace` | las 4 `arg/pozo/solve` no lanzables: cablear spawn externo o retirar | el catálogo no ofrece nada inarrancable | P1 |
| U184 | 06 | `deps` de arranque declaradas | hoy 14×`deps:[]`; declarar orden real donde exista | arranque en frío completo sin fallos de orden | P2 |
| U185 | 07 | Retiro consciente | auditar piezas sin consumidor ni destino (candidato: `threejs-ui-lib`) | cada retiro con justificación; cero por silencio | P2 |

### Lane B · Identidad y permiso — el cable no pide credencial (`BLOQUEA:`)

| U | F2 | WP | BRIEF | CA tentativo | prio |
| - | -- | -- | ----- | ------------ | ---- |
| **U186** ✅ | 10 | **U93-bis · transporte ≠ permiso** | **Frontera confirmada** (`plan/REPORTES/U186-paso0-frontera-room-join.md`): el `room-join` gateado = SOLO antesala WebRTC (greps = 0 en rooms/socket-core, re-verificados por contrarrevisión); **los 4 tornos SE QUEDAN** — el leak real era `connect()` degradando en silencio una card inválida presentada: corregido (valida ANTES de abrir el cable; `getSessionRole()` re-valida al momento). Pregunta de política a O (D-O11) + contrato de retorno O13 escritos, con ✎: **amarre identidad↔card** (card bearer, herencia U93 — no defecto de U186) añadido a la resolución de O. **Contrarrevisión adversarial PASS sin defectos** (mutación hostil cazada por CA3+caso rojo · 13 shapes basura rechazan · firma ausente deniega en los 3 caminos · card falsy presentada ≠ ausente, también rechaza). Aceptado 2026-07-31 (rama `wp/u186-transporte-permiso`; 30/30 tests) | (0)✓ frontera escrita · (1)✓ · (2)✓ · (3)✓ **rechaza, no degrada** · (4)✓ cable intacto · contrato O13 ✓ | **P0** |
| **U187** ✅ | 11 | Peercard en vivo + fila Z del grafo | **Ejecutado**: e2e `socket-server/test/peercard-vivo.test.mjs` contra servidor REAL (sonda TCP del revisor lo confirma) + cliente `rooms`: modalidad A anónima (clave `peerCard` AUSENTE de verdad, ni null) · modalidad B card viaja INTACTA (deepStrictEqual 8 campos, en vuelo y retenida). Ids reproducibles como formato+semilla (declarado honesto). **Caso rojo asertado sin tapar**: el servidor ACEPTA card malformada en silencio (grep peerCard en su src = 0 — la verificación vive en consumidores; endurecer = U188/U193, sus briefs deben citar que este test caerá a propósito). **Contrarrevisión adversarial PASS** (2 mutaciones cazadas · realidad verificada · cero contrabando). Marca Z **estampada por el orquestador en el grafo del hub** con autoría del worker. Aceptado 2026-07-31 (rama `wp/u187-peercard-vivo`; 10/10) | log literal ×2 runs ✓ · id reproducible ✓ · marca con ruta de evidencia ✓ (1/7 del holón) | **P0** |
| U188 | 12 | Unificar plano peer-card | lógica en 4 sitios: camino único. **✎ premisa corregida (U232, 2026-07-31): `embajador-kit` NO tiene 0 consumidores — 3 referencias vivas en `operator-ui` (fixtures/puerta-entry.mjs · puerta-smoke.mjs · serve.mjs); re-medir antes de demoler** | un punto de emisión/consumo; grep duplicados = 0 | P1 |
| U189 | 13 | Reúso de card entre niveles | edificio→barrio→ciudad: ¿reemite o reúsa? con base anónima. Aporte al hilo Z·G | contrato escrito + test de que ningún relay eleva scopes | P1 |
| U190 | 14 | `seat` y firma de asiento | cuándo `seatSignature` es obligatoria (hoy: «si viene, valida») | matriz de exigencia por acción, sin ambigüedad | P2 |
| U191 | 15 | Revocación | card revocada pierde capacidades sin cortar transporte | revocar en caliente: sesión sigue, acciones con rol caen | P2 |

### Lane C · Transporte y federación — el poder que existe, se ve (`core`)

| U | F2 | WP | BRIEF | CA tentativo | prio |
| - | -- | -- | ----- | ------------ | ---- |
| **U192** ✅ | 20 | Traza de lo descartado en relay | **Ejecutado**: ledger agregado por clave dirección\|evento\|motivo (count/first/last, consola anti-inundación 1.ª+cada 100 — 250 descartes→3 líneas, medido por revisor); 6 puntos de corte trazados; **política intacta probada** (0 ediciones a config.mjs; 23 sondas deepEqual contra base; contrarrevisión verificó equivalencia semántica línea a línea y que el test CAE ante mutación de política Y de traza). **Contrarrevisión adversarial PASS**. Hallazgo emergente: eco ping ida-y-vuelta real ahora visible (→U194/U195). Obs. a futuro: ledger sin cota de memoria (→U241) · inner truthy no-string propaga sin traza, herencia de base (→U194) · cita de base corregida ✎ (412673c era hash de otro repo → 4210b12). Aceptado 2026-07-31 (rama `wp/u192-traza-relay`) | todo lo no propagado deja registro con motivo ✓ (e2e puente real) · política sin cambio ✓ (probado, no afirmado) | **P0** |
| U193 | 21 | Identidad en el puente | `scriptorium-bridge` único colapsa emisor aguas arriba: propagar origen. **⚠ Aviso de U194 para su brief**: el censo de la allowlist ancla `relay.mjs` **por forma** (número de vías `localNs.emit(` + sello sha256 del fichero normalizado), así que **editarlo obliga a re-anclar dos constantes**. Es deliberado — cambiar la propagación **es** cambio de contrato — y el mensaje de fallo trae el sello nuevo; pero que venga en el brief y no se lo encuentre. Hereda además el **hueco del sobre**: `emitDownstream` reemite cualquier nombre interno sin consultar la allowlist (U194 lo dejó declarado y con un test «HUECO ABIERTO» que cae a propósito cuando se cierre) | aguas arriba se distingue quién publicó | P1 |
| **U194** ✅ | 22 | Allowlist como contrato | **ACEPTADO 2026-08-01** (merge `b95c42b`, 4 rondas · 4 contrarrevisiones). Verificado por el orquestador: **23/23**, sello anclado `c842ca2f` **sin mover** —el último arreglo ensanchó cobertura y **no re-ancló**, que era su afirmación falsable— y **vector hostil propio**: una puerta `.mts` plantada en `src/` cae y sale **nombrada** con su cuenta de emisiones. La allowlist **dejó de ser un `Set`** (closure + objeto congelado; `Set.prototype` la rechaza por receptor incompatible: 21 sondas, ninguna entra) · el censo ancla **la forma del despacho**, no el nombre del evento, con enumerador **único, compartido y recursivo** sobre las seis extensiones que el runtime ejecuta · el **hueco del sobre** queda declarado con un test que asserta el bypass **sin taparlo** y cae a propósito cuando U193 lo cierre · `relay.mjs` con **0 ediciones** en cuatro vueltas. Los cuatro bloqueantes fueron el **mismo** fallo —alcance declarado más ancho que el implementado— y **ninguno error de lógica**. ✎ Histórico de la devolución: **Entregado y devuelto** (tip `91b962c`): el artefacto es bueno — **el sello resiste** (no forjable por coma, orden, caja, espacios ni `\n`; la partición `downstream(N)`+join hace imposible la inyección por coma), el **gate fail-closed en carga** cierra **todas** las rutas incluido `require()` y el subpath profundo, la identidad `===` y la segunda lista caen con rojos, hostil-omite ruidoso en sus tres caras, `relay.mjs` **0 ediciones** confirmado. Pero **dos bypass sin editar un solo fichero**: **D1** el corpus de sondas (`relay-contract.test.mjs:82`) extrae literales con regex que **no ve backticks ni concatenación** → `event === \`evento:colado\`` pasa 17/17, refutando el «se delata a sí mismo» · **D2** `Object.freeze` no toca el slot interno de un `Set`: `Set.prototype.add.call(RELAY_DOWNSTREAM_TOP,…)` amplía la allowlist en caliente (probado e2e contra puente real), refutando «inmutable en runtime». **D3** (veracidad): `emitDownstream` (`relay.mjs:95`) reemite **cualquier** nombre interno sin consultar la allowlist — heredado de la base y **no empeorado**, pero el test «pasa exactamente el contrato y nada más» y la CA «la AUSENCIA no pasa» son falsos sin acotar → renombrar, acotar y **enrutar el hueco del sobre** a quien tenga `relay.mjs`. Menores: borrar el gate entero es silencioso · con la versión subida el único cazador es una lista literal ajena. Los 8 eventos + `RELAY_UPSTREAM` explícitos y versionados. **Ola 3, despachado 2026-07-31** (`wp/u194-allowlist-contrato`, worktree `wt/z-u194`) · **contrarrevisión obligatoria** (clase relay/allowlist): añadir y quitar un evento deben poner el test en rojo, y borrar la guarda también | cambiar allowlist = cambio de contrato con test | P1 |
| U195 | 23 | Duplicación de reemisión | `ROOM_MESSAGE` + evento desenvuelto llegan 2 veces al doble-suscriptor | no duplica, o la duplicidad es contrato documentado | P2 |
| U196 | 24 | Zonas como ámbito real | `zones` de filtro opaco a ámbito (mismo topic × 2 zonas = 2 conversaciones) | fan-out medido; zonas no se filtran mutuamente | P1 |
| **U251** ⏳ | — | **Seis menores de U197** (todos con vector reproducible, **ninguno abre admisión anónima → permiso**; el WP se aceptó con ellos enrutados): **(1)** `joinRoom` no pasa `claimedFrom` (`socket-room-signaling.mjs:148-153`, `browser-signaling.mjs:270`) al revés que `_gatedOutbound` → el `join-room` anónimo **saca al cable el `from`** y luego `sendOffer` **lanza**: el modo anónimo es **inusable** para quien tenga `userId` con forma de feed SSB, y nada lo documenta · **(2)** endurecer el candado SSB de verdad (campo privado o forzar el modo en las opciones) — hoy es un `override` sobre campo público · **(3)** doble lectura del opt (`signaling-service.mjs:127`, `browser-signaling.mjs:125`): un **getter alternante** tira la exigencia declarada (fail-open); `connect()` es inmune **por accidente**, por el spread · **(4)** un `connect()` que **lanza** deja las exigencias **ya rebajadas** (`ssb-private-signaling.mjs:111-116`, `socket-room-signaling.mjs:85-89`): fail-open · **(5)** quinta divergencia de gemelos con modo falsy (`''`/`0`/`NaN`): Node acepta en silencio, navegador lanza — ambas seguras, **no idénticas** · **(6)** el candado es **invisible para TypeScript** (`types/index.d.ts:148-151`): un consumidor TS ve `setAdmission('anonymous')` como legal, justo en la capa donde se enteraría en build; y faltan `requireSsbId`/`requireSeatSignature`/`admission` en las opciones SSB | (1) y (4) primero: son los dos fail-open · cada uno con su caso rojo · README y tipos coherentes con el alcance real | P1 |
| **U197** ✅ | 25 | Signaling anónimo WebRTC | **Entregado 2026-07-31** (rama `wp/u197-signaling-anonimo`). Decisión que gobierna el WP: el brief permitía retirar el torno si U186 lo confirmaba y **U186 no lo confirmó** — leyendo a los consumidores se ve por qué era imposible: `assertSignalingPeerCard` **también es el portero del carril LAN de blobs por DataChannel** (`blob-sync-harness/src/lan-gate.mjs`), así que ablandarlo habría abierto el transporte de blobs a cualquier anónimo. Se deja intacto y se añade **encima** `assertSignalingAdmission` con dos modos (`peer-card` por defecto · `anonymous`). Doctrina: **admisión ≠ permiso**, corolario de *transporte ≠ permiso*. CA1 de facto con socket-server y `wrtc` reales (`offer 1 · answer 1 · ICE 8`, DataChannel entregando); CA2 por **ausencia** (`hasOwnProperty` false en los 5 frames, y el cable **tampoco** lleva `anonymous:true` porque una autodeclaración no verificable sería otro claim); CA3 con 5 pruebas de no-escalada. Suites 30→45 y 6→13, **las 30 previas de U186 sin una sola modificación**. tras U186: offer/answer/ICE sin card, con STUN/TURN. **Ola 3, despachado 2026-07-31** (`wp/u197-signaling-anonimo`, worktree `wt/z-u197`) · **contrarrevisión obligatoria** (clase identidad/permiso): la CA que más pesa es que el anónimo que completa handshake **no** obtenga por ello acceso a lo protegido | handshake completo entre 2 peers anónimos en LAN | P1 |
| U198 | 26 | coturn + pub SSB de facto | runbook y DM-signaling nunca probados contra sbot vivo | evidencia de ejecución, no de documento | P2 |

### Lane D · Plano de datos · adaptador local-first (`BLOQUEA:` en P0)

| U | F2 | WP | BRIEF | CA tentativo | prio |
| - | -- | -- | ----- | ------------ | ---- |
| **U199** ✅ | 30 | **C-3 + sellado-hash (compromiso D-45)** | **Ejecutado**: `counters.mjs` ya no muta `volumes.json`; nacen `src/manifest.mjs` (sha256, RO runtime, fail-closed) y `src/state.mjs` (`volumes.state.json`, gitignorado); retorno superset-compatible (consumidores vivos). **Contrarrevisión adversarial PASS** (caso rojo cae · hash independiente idéntico · matriz hostil 4/4 aborta limpio, corrupción NO se repara · cero contrabando · cero escritores no declarados). Escritores restantes citados para los eslabones: `jetstream-sync.mjs:119` (syncedAt rompe hash → U204) · `ssb export.mjs:173-207` (**inventa manifiesto si falta**, contra contrato → U205) · consumidor `browse.mjs:32,112` lee contadores del manifiesto (→U201 «import pobla corpora»). Aceptado 2026-07-31 (rama `wp/u199-c3-sellado`) | manifiesto hasheable estable ✓ · medir no modifica ✓ (contenido, no mtime) · firehose-core deriva stats ✓ (11/11) | **P0** |
| **U200** ✅ | 31 | Resolver único · env obligatorio | **Ejecutado (◆5)**: canónico en `presets-sdk/src/volumes/resolve.mjs` — sin env → «not operable» (fail-closed U199); env→`node_modules` **rechazado citando cerco §10.8**; default de producto demolido. `linea-kit`: walk ascendente por cwd **eliminado** (grep cwd = 0, verificado por orquestador); mismo contrato env-only con desvío razonado (sin dep fantasma: package.json congelado — cabecera declara el canónico para cuando gane la dep). Caso rojo bilateral: pack plantado en node_modules no secuestra (a/b/c). Suites 6 paquetes verdes (linea-kit 36/36 re-ejecutado por orquestador). Riesgos citados a U202 (resolución at-import de linea-system → lazy) · U204 (smoke force-system) · U205 (mensaje CLI + manifiesto inventado) · U201 (import = único escritor, sin default). Aceptado 2026-07-31 (rama `wp/u200-resolver-unico`) | root no depende del cwd ✓ (chdir ×2) · un pack no secuestra ✓ · sin env aborta honesto ✓ | **P0** |
| **U201** ✅ | 32 | Contrato de import v1 | **Ejecutado**: `plan/CONTRATO-IMPORT-PACK-v1.md` (v0 hallado en nota de mesa, [cita inerte]; supersesiones declaradas: staging DENTRO del root · import pobla corpora medidos · symlink = rechazo · denylist identidad) + `volumes-ops/src/import.mjs` (`importPack` 7 pasos; `sealManifest` = **único escritor legítimo**; intent `import_pack` rol `operator`, hostil-omite verificado). Colisión aborta sin root a medias (probado con hash+árbol) · no-op por packHash · junction rechazada en Windows sin privilegios. 16/16 + 4 suites vecinas verdes (re-verificado por orquestador). Riesgos a U202-U205 citados: drivers = detect→validate→index→merge ENCIMA (familia desconocida = error) · reconciliación por soporte (FIREHOSE une, curación jamás se pisa) · escritores legados feed-kit/ssb a migrar · grep `sealManifest\|writeFileSync.*volumes\.json` fuera de import.mjs como probe de contrarrevisión de drivers. Aceptado 2026-07-31 (rama `wp/u201-import-v1`) | 7 pasos con test ✓ (verde+rojo) · colisión sin root a medias ✓ | **P0** |
| **U202** ✅ | 33 | Driver LINEAS — **Ejecutado**: `volumes-ops/src/{driver-lineas,drivers}.mjs` (semilla U242: el driver devuelve un PLAN, `importPack` ejecuta, `sealManifest` sigue único) + predicado `isCuratedSidecarPath` en `linea-kit/curation.mjs` (regla derivada del loader real). Paso `familia` en el contrato observable; validación con schemas reales de linea-kit; escribe-lo-que-falta ✓ · divergencia reportada con root intacto ✓ · **curación jamás pisada** ✓ (byte a byte; caso rojo cae) · familia desconocida = error ANTES de staging ✓. 22/22 + 4 suites vecinas (re-verificado por orquestador; probe escritor único = solo re-export). Riesgos a U203 citados: FORCES = soporte RO-inmutable → regla hash-igualdad, NO heredar merge LINEAS · detect por registry.json · escenas .md NO son curación. Aceptado 2026-07-31 (rama `wp/u202-driver-lineas`) | `registry.yaml`, nodos, cache + **protección de curación** | import escribe lo que falta, reporta divergencia, no pisa `registro.md`/`delta.md` | **P0** |
| U203 ✅ | 34 | Driver FORCES | **Ejecutado**: `volumes-ops/src/driver-forces.mjs` — **RO-inmutable** (H-01 §④): unidad nueva aterriza · idéntica no-op · distinta = `colision_force` que aborta en dry (byte a byte probado); escenas `.md` = soporte RO, cero camino de curación; `registry.json` reemplazable solo como superconjunto sin colisiones; **snapshot por hash sellado en `source.imported.snapshot`** (el driver no sella — escritor único intacto, re-verificado). Rojo genuino de desarrollo: el schema real rechazó un `kind` inventado → se corrigió el test, no el schema. 27/27 + 4 suites vecinas. **⏳ con dueño: CA contra `startpack-pozo` REAL es de G, cierra en U206.** Riesgos a U204 citados (unión aditiva por clave Z-D9 · el escritor legado `jetstream-sync:119` con `syncedAt` DEBE morir o pasar por sealManifest · detect sin firma en disco · sync vivo = estado, manifiesto solo por import). Aceptado 2026-07-31 (rama `wp/u203-driver-forces`) — **carril D CONGELADO aquí (freeze); siguiente eslabón U204 al reinicio** | pack entero ✓ (fixture forma-canónica) · colisión = error sin root a medias ✓ | P1 |
| **U204** ✅ | 35 | Driver FIREHOSE | **ACEPTADO 2026-08-01** (merge `0dc2ea3`, 3 rondas · 3 contrarrevisiones) — **carril D 6/8**. Verificado por el orquestador: `indexByKey` decide **por contenido, sin puerta de extensión**; driver **29/29 con 0 skipped**; volumes-ops **56/56**. **Z-D9 resuelto y sostenido**: clave = AT-URI **derivado** de la terna, inyectividad cerrada **por construcción** (resistió homóglifos, zero-width, `%2F`, solidus fullwidth, NFC/NFD y un rkey de 100.000 caracteres, con round-trip íntegro), **una sola vía de producción**, y `uri` que **corrobora, no produce**. El índice del destino queda **sin agujeros por las tres vías** halladas —profundidad, enlaces y nombre de fichero— y en las tres se tomó la **vía fuerte**, con su precio declarado (un volumen con material sin clave queda no importable hasta que el operador lo retire, citando la ruta). **Mató el escritor legado en vez de reencaminarlo**: reencaminarlo habría legitimado que un sync escriba el manifiesto. ✎ Histórico de la devolución: **Entregado y devuelto por contrarrevisión adversarial** (2026-07-31, tip `8a01920`): resiste mucho (159/159 exacto · cero escritores no declarados, comprobado por contenido y rutas derivadas · demolición real contrastada contra la base · sello estable bajo sync vivo · cota a 8.388 con aserciones · cero contrabando · las dos afirmaciones «fuera de alcance» ciertas de facto), pero caen dos afirmaciones de cabecera con vector reproducible: **D1 la clave AT-URI no es inyectiva** (`did`+`collection`+`rkey` concatenados con `/` sin validar → dos registros distintos rinden la misma clave y **el segundo se descarta en silencio**, con un `dedup` que miente; + `trim` y fallback de `uri` que acepta cualquier string) · **D2 la raíz del volumen no la valida nadie** (`if (!isUnitSlot(rel)) continue` en `validate`/`indexByKey`/`merge` → fichero de raíz aterriza sin validación y una unidad en raíz **no deduplica**: mismo registro duplicado, `snapshot.units` descuadrado). Menores: **D3** el volumen sí queda a medias (renames sin transacción, `importPack` lanza en vez de devolver `{ok:false}`; heredado de U201 pero amplificado a 8.388 renames) · **D4** `recordVolumeSync` es fallo **abierto** con docstring que promete lo contrario. Devuelto al mismo worker, misma rama, commits nuevos; los vectores pasan a probes permanentes. Es flujo: definir **unidad** (cursor/clave) antes de tocar transporte; unión, nunca sobrescritura. **Despachado 2026-07-31 al deshielo** (rama `wp/u204-driver-firehose`, worktree `C:\S_LAB\wt\z-u204`, base `26d1470`): brief = los riesgos que U203 le cita (unión aditiva por clave = Z-D9 · **matar o reencaminar el escritor legado `feed-kit/src/jetstream-sync.mjs:119` cuyo `syncedAt` rompe el hash** · detect sin firma en disco · sync vivo = estado, manifiesto solo por import) | import incremental idempotente sobre los 8.388 del censo | P1 |
| **U205** ✅ | 36 | Driver SSB | **ACEPTADO 2026-08-01** (merge `aea3fc0`, 1 contrarrevisión + 2 rondas) — **carril D 7/8**. volumes-ops 56→**104** (102 + 2 skip declarados), ssb-system 4→**27**. **La decisión que ordena el WP, escrita antes de tocar código: la regla es del VOLUMEN, no de un escritor** — al matar el borrado destructivo el export pasó a ser el 2.º escritor del mismo volumen. Dos niveles: **admisión de la unidad** (clave · coordenada de feed · ruta canónica · unicidad de clave **y de posición**) que aplican **los dos**, y **coherencia del conjunto** (la cadena) donde el import aborta y el export mide y declara sin tirar dato — asimetría **medida**, no supuesta. Las dos tensiones resueltas: el exportador **deja de borrar**, y el escritor legado del manifiesto queda **muerto sin sustituto** (precedente U204: matar, no reencaminar). **Bloqueantes que cayeron**, todos en la juntura y ninguno en el driver: la posición **no era inviolable** (el export bifurcaba y `indexVolume` pisaba en silencio — la garantía central se medía contra un índice que ya mentía; el cursor pasa de `<autor>:<max>` a `<autor>:<min>:<max>:<count>`) · un **`dedup` que mentía** (la clase D1 de U204 trasladada a destino↔pack; `snapshot.destFueraDeLayout` **desaparece**: contar lo inalcanzable era la coartada) · el export producía volúmenes que **su propio driver** declaraba no importables. **Última vuelta, hallada por el orquestador**: al corregir eliminó `colision_ruta` diciendo «imposible por construcción, `messageFileName` es inyectiva» — **cierto como cadena, falso como ruta**: base64url distingue caja y el FS no. Vector ejecutado: dos claves válidas distintas → un solo fichero, `validate` ok y `merge` planificando **dos** movimientos de lo que es **uno** (mensaje perdido en silencio, conteo que dice dos). **Alcanzable sin malicia**: pack construido en Linux, importado en Windows. Agravante: la contrarrevisión anterior había **certificado esa guarda como resistente**. Cerrado en los **cuatro** sitios donde se decide «esta ruta está libre», en los **dos** escritores; alcance del plegado **medido** (cubre la caja, no Unicode — y no hace falta: el nombre canónico es base64url, ASCII puro donde NFC y NFD coinciden, **propiedad del alfabeto**); rechaza **también en FS sensible a la caja** a propósito, porque un volumen válido sólo en Linux no es replicable. **30 mutaciones**, con **abstención declarada**: 2 no se pueden plantar en NTFS y hacen `t.skip` **con motivo** (verificado: salen nombradas, nunca verde silencioso). ✎ Corrigió un error **mío** del brief con probe A/B. **No medido y es la pregunta que hereda U254**: si el productor real emite la secuencia por feed o global | reimport no reordena ✓ · grep secretos = 0 **en el corpus del repo** ✓ · posición de feed inmutable ✓ · escritor legado muerto **en `src/`** ✓ | P1 |
| **U206** | 37 | CA local-first + réplica A→B | import → **arranque sin red** → no-op → copia A→B mide igual → divergencia reportada → **corrupción falla** → cerco limpio. **✎ REENCUADRE 2026-08-01 (decisión ⑧ + reconocimiento previo, ver `DECISIONES.md`)**: (a) **el pozo real NO es importable** — manifiesto de esquema `v0` sin `name` ni `hashes`, rechazado con `pack_manifest_incompleto`; el productor no existe en G y sus WPs están en P0 **sin arrancar**, una declarando que **bloquea esto**. **Z construye el adaptador** leyendo el pozo en SOLO LECTURA (los 8 ficheros son **byte a byte** los de la fixture con la que cerró U203: falta el descriptor, no los datos). (b) **«7 pasos verdes con shape pozo» era INFALSABLE**: el paso 5 pide divergencia y el pozo trae **un único volumen FORCES**, familia que **por diseño no tiene camino de divergencia**. La shape debe declarar **dos** volúmenes: el pozo para 1-4, 6 y 7, y uno con divergencia (LINEAS o FIREHOSE) para el 5. (c) pasos 2 (arranque sin red) y 6 (corrupción falla) son **construcción íntegra**: hoy no existe nada — el fail-closed de U199 es de **ausencia**, no de **corrupción**. (d) hereda de U205: `feedsSha256` es O(1) y **no implica completitud**, y `clave_divergente`/`reescritura_de_feed` implican que **una réplica entre nodos bifurcados no converge sola** — necesitará política explícita de resolución, **que no existe**. (e) el `e2e/feed-families-demo.mjs` ya estaba rojo antes de U205 (`:65`), arreglo conocido de una línea de semilla, **sin dueño** → candidato natural, porque U206 ya vive en `e2e/` | **dos** volúmenes con la shape declarada · los 7 pasos, con el 5 sobre la familia que sí diverge · «sin red» con **predicado escrito** (cero salidas a destino no-loopback), no «cero sockets» | **P0** |
| **U207** | 38 | Porte one-off de la genealogía | U176 = pieza parcial; faltan adaptadores `linea-aleph` (~48 MB · 677 reg), FIREHOSE, FORCES. **Da ID al diferido «U87 §5 · linea-aleph vivo»** | `--check` verde antes de escribir; registry stale = incompleto | P1 |
| **U71R** | 39 | Anclaje por contenido = fuente de import | **reencuadre de WP-U71** bajo cerco §10.8: git/rad/IPFS solo origen + procedencia inerte; jamás dependencia de arranque; wikimedia encaja por `oldid` | corpus anclado importa y arranca offline; 0 URLs vivas en root | P2 |
| U208 | 40 | `cache_wikitext` acotado | materialización remota explícita válida en juego, prohibida en arranque | arranque en frío sin red no invoca fetch; herramienta viva bajo demanda | P1 |
| U209 | 41 | Root VPS ≡ local | mismo contrato lógico, paths distintos; gitignored + fuera del contexto Docker. **Decisión ④ (custodio 2026-07-31): reencolado al final — cero VPS hasta réplica local validada (U206); la subida será desde imágenes (dockerhub); horizonte PODs → U243** | el mismo manifiesto valida en ambos hosts; `.dockerignore` verificado | P2 **DEFERRED** |

### Lane E · Canal y verdad de la documentación (`core`)

| U | F2 | WP | BRIEF | CA tentativo | prio |
| - | -- | -- | ----- | ------------ | ---- |
| **U210** ✅◐ | 50 | Puente documental ◆4(b) | **Entregado**: `docs/guide/volumes-y-datos.md` (tres momentos instalar→sembrar→sincronizar · volumesRoot=solo-dev · env a root propio · sello U199 · citas verificadas) + puntero desde `VOLUMES/README.md` + sidebar VitePress. ✎ orquestador al aceptar: referencia a U201 actualizada (mergeó en paralelo — contrato ya existe) + coletilla de default en README:48 corregida (U200: sin default). **◐ cierre condicionado** (declarado en el propio doc): ◆4(a) obra de G en startpack-kit · U212 CA de canal. Aceptado-parcial 2026-07-31 (rama `wp/u210-puente-doc`) | cero env→node_modules ✓ (grep 0) · comandos C8 ✓ · estado parcial declarado ✓ | **P0** |
| **U211** ✅ | 51 | Reparar `VOLUMES/README.md` | 2 defectos eliminados (E404 npm fuera → canal Release declarado externo honesto · env jamás al pack) + hallazgo: `ZEUS_STARTPACK_ROOT` era variable muerta (0 lectores) — retirada. Ecos menores fuera de alcance anotados: `volumes.json:4,:11` (→ carril D) · `.env.example:60` · `.gitignore:13` (limpieza en ola posterior). Aceptado por el orquestador 2026-07-31 (rama `wp/u211-volumes-readme`) | grep `npm install @zeus`=0 ✓ · `node_modules`=0 ✓ · import v1 declarado obra en curso (U201), no prometido ✓ — verificado por orquestador | **P0** |
| U212 | 52 | CA de canal limpio C-4 | condición ◆2c: kit npm + pack Release desde consumidor limpio | instalar capacidad por npm y sembrar datos por Release sin tocar el árbol | P1 |
| **U178** | 53 | `linea-editor` publish-ready | **= WP-U178 existente** (cola P1 · D-42): sigue en PAUSA y es 1 de las 2 piezas realmente usadas | checklist §5 allowlist completo; GO publish aparte | P1 |
| U213 | 54 | Allowlist como inventario vivo | `audit:publish-allowlist` contra registry en CI | desfase allowlist↔registry detectado pre-release | P2 |
| U214 | 55 | Smoke consumidor externo ampliado | cubrir consumidores limpios **representativos de las tres clases** — engine (lib), servicio (start) y app (UI) — no solo lo que O/V declararon | consumidor limpio monta el conjunto sin rutas locales · una pieza por clase como mínimo | P1 |
| U215 | 56 | `DATOS.md` al día con el censo | registrar los 3 drifts (envase · registry stale · conteo FORCES) | ninguna cifra del doc contradice el censo | P2 |

### Lane F · Ciudad en el runtime — dominio sin inventar dominio (`horizonte`)

| U | F2 | WP | BRIEF | CA tentativo | prio |
| - | -- | -- | ----- | ------------ | ---- |
| U216 | 60 | `tree.{barrio,edificio,maquinaria}` (Z12) | reservados e ignorados: activar cuando G fije qué es un barrio | el árbol refleja el modelo de G sin que Z invente semántica | P1 |
| U217 | 61 | Barrio = ámbito, no proceso | alinear catálogo con zonas (U196) | ningún consumidor confunde barrio con servicio | P1 |
| **U218** | 62 | Holón-7 completo | las 7 marcas del grafo con entrada real; Z sostiene el tubo. **Z no marca 7/7 solo**: deps HUB-022 (grafo) · V18 · O12 · G50 · fila L · fila custodio | 7/7 con evidencia de log, ninguna por reporte · cada fila la marca su dueño | **P0** |
| U219 | 63 | Story-board + reparto en ronda | conectados a ronda real, no solo fixtures | una ronda carga elenco y actos desde pack importado | P2 |
| U220 | 64 | Dramaturgo: curación en vivo | `delta_status` operable en juego sin romper protección de curación | curar en ronda y reimportar sin pérdida humana | P2 |

### Lane G · Observabilidad, gates y estación (`core`)

| U | F2 | WP | BRIEF | CA tentativo | prio |
| - | -- | -- | ----- | ------------ | ---- |
| U221 | 70 | Gate de arranque offline en CI | el CA local-first como gate, no como acta | CI corre una ronda sin red y falla si algo sale | P1 |
| U222 | 71 | Falso positivo regla 15 | espejo de skills inunda `anomalias.log` (R-1); fix de método → porte del skill (L) | log sin falsos positivos; watchers reanudables | P1 |
| U223 ✅ | 72 | Mapas `plan/MAPA-*` (#19) | **`plan/MAPA-{RAIZ,REPO,TALLER}.md`** — 10 territorios verificados con `comm` (diff vacío); apuntan a MATRIZ/GOBIERNO sin duplicar; gate propuesto (2 ubicaciones), no cableado (✎ orquestador: medir contra `git ls-files`, no `ls` vivo). **Hallazgos registrados**: `package.json:124` script `e2e:playbook-kit` → fichero inexistente (huella rota) · 2 huellas sin referencia npm · **`.env` TRACKEADO en git** → inspección del custodio + U231/U227. Aceptado por el orquestador 2026-07-31 (rama `wp/u223-mapas-territorio`) | mapas completos ✓ (muestreo raíz verificado por orquestador: 27/27 del repo; +2 solo runtime) · owners citados ✓ · gate propuesto sin cablear ✓ | **P1** |
| U224 | 73 | Anomalía del segundo conductor | `CONTRARREVISION-U169-PASS.md` reescrito 25/07 21:57 tamaño idéntico, autor desconocido | causa identificada, o registro de indeterminable | P2 |
| U225 | 74 | Nunca reconciliar por mtime/tamaño | convertir la lección U224 en regla verificable del plano de datos | test: mtime/size no deciden nada | P1 |
| U226 | 75 | Estación reanudable | watchers parados por orden: arranque documentado con lease propio (`timbre-watch.log`) | relevo de ventana levanta estado desde bitácora sin preguntar | P2 |

### Lane H · Fronteras con otros carriles (`core`)

| U | F2 | WP | BRIEF | CA tentativo | prio |
| - | -- | -- | ----- | ------------ | ---- |
| **U227** ✅ | 80 | Env de la demo **generado** | **Ejecutado**: núcleo puro `presets-sdk/src/env/generate-env.mjs` + CLI `scripts/generar-env.mjs --check`; **`.env.example` = salida canónica generada** (cabecera no-editar-a-mano; ratificación de O pendiente como intercambio). Byte-reproducible (sha idéntico ×2, re-verificado por orquestador) · **0 claves perdidas** (57→67; las 10 nuevas COMENTADAS — el contrato de cobertura del custodio intacto) · claves fuera de la fuente única preservadas en sección «no-generada», jamás inventadas. **Slot ciudad-lifecycle añadido a la fuente única** (hallazgo U179 cerrado; E1 de U228 pasa a histórica). Señales: `--check` sin cablear a CI (→U233/U221) · espejo `KNOWN_ZEUS_PORTS` de scan.mjs sin 3050/3051 (→U233) · discovery incluye 3051 (excluible a petición de O, 1 línea). Aceptado 2026-07-31 (rama `wp/u227-env-generado`; 55/55 + 12/12 + gates OK) | añadir servicio → aparece sin edición manual ✓ (test sintético) · reproducible ✓ · cobertura intacta ✓ | **P0** |
| **U228** ✅ | 81 | Cinco datos por servicio para O | **`plan/REPORTES/U228-cinco-datos-servicios-O.md`** — patrón único + **19 servicios / 22 puertos** (cuadre explícito 19+8+24=51 contra la MATRIZ); excepciones etiquetadas con evidencia (E1 ciudad-lifecycle fuera del env central →U227 · V3 multi-server: linea ×2, solar ×3 — O no asume 1 puerto/servicio · inverso: 10 entradas de flota declarada sin pieza); sección «lo que O no debe asumir» (GATE-O-CLAVES citado · ◆5 · manifiesto RO). Al aceptar U227: E1 pasa a histórica (línea de actualización pendiente). Aceptado 2026-07-31 (rama `wp/u228-cinco-datos`) | patrón único, cero excepciones sin declarar ✓ · celdas con cita resoluble ✓ · describe-no-prescribe ✓ | **P0** |
| U229 | 82 | Contrato IDE opt-in v2 | `reparto_required` + payload de denegación: hoy coincidencia verificada, no contrato (duda 5 de V) | contrato fija ambos; V verifica y coincide | P1 |
| U230 | 83 | Frontera L1/L2 desde el runtime | qué cristaliza a L1 y qué muere con la sesión, en código | dato L2 no llega a L1 sin cristalización explícita | P1 |
| **U231** | 84 | Invariante de secretos en datos | GATE-O-CLAVES aplicado a VOLUMES: volumen que exige secreto para leerse = mal diseñado | gate falla si identidad entra en volumen o contexto de imagen | **P0** |

### Lane I · Gobierno, producto y aceptación v1 (edición F2-unificada)

*Lo que 66 WPs necesitan para no despacharse sobre arena — la capa que la
revisión meta encontró ausente. U210/U211 (puente doc) no cierran sin la
contraparte de G (4a) y el CA de canal limpio (U212).*

| U | WP | BRIEF | CA tentativo | prio |
| - | -- | ----- | ------------ | ---- |
| **U232** ✅ | Gobierno de ejecución F2 | **`plan/GOBIERNO-EJECUCION-F2.md`** — mapa 66 WPs con citas, 25 ficheros calientes, carril D (worker único U199→U206) + 12 lotes bajo gate, techo 6+1, contrarrevisión 6 clases con hostil-omite, BRIEF §6, **DoD Z-v1 §7**. Aceptado por el orquestador 2026-07-31 (rama `wp/u232-gobierno-f2`) | ningún WP huérfano ✓ (66/66 bajo gate nombrado, suma verificada) · alcance disjunto ✓ (un editor por fichero y ola) · DoD escrita antes del primer despacho ✓ | **P0** |
| **U233** ✅ | **Gate matriz 51/51** | **Ejecutado con circuito completo**: `scripts/gates/matriz-51.mjs` (+`--json` para U180–U185) — 51 derivadas del árbol vivo, 10 flota-declarada VISIBLES, 3 excluidas con motivo. **Contrarrevisión DEVOLVIÓ** (el parser concedía en falso: comillas dobles/comentarios — 3 vectores con EXIT=0) → **corrección aceptada**: ambas comillas · comentarios fuera antes de la marca · no-parseable = `catalogo-parse` ruidoso · los vectores del revisor son **probes permanentes** (14/14) · +controles `contraste-total`/duplicados y `celda-sin-valor`. **Verificación de integración del orquestador: gate VERDE sobre main con el catálogo ampliado por U234** (EXIT=0). Limitación documentada: entradas de catálogo literales (spread = falla cerrada). Aceptado 2026-07-31 (rama `wp/u233-gate-matriz`) | 51 derivadas ✓ · falla si falta una ✓ (6 probes rojas re-ejecutadas) · cero invisibles ✓ · concesión-en-falso extirpada ✓ | **P0** |
| **U234** ✅ | Orquestador de runtime v1 | **Ejecutado**: `mcp-launcher/src/orchestrator.mjs` — start/stop/status/health por perfil (`minimo`/`v1-zeus`/`all`), orden topológico de deps (Kahn, desempate estable), stdout=JSON único / stderr=progreso / exit 0-1-2; los echos de `start:all`/`start:v1-zeus` DEMOLIDOS. Windows resuelto de verdad: stop = pid grabado + barrido netstat por puerto de catálogo + `taskkill /T /F` + re-bind probado + `residues:[]`. Catálogo crece: entrada `launcher` + 3 `kind:service` (puertos del env central vía `uiPort`). Desvío razonado aceptado: `minimo` = launcher+solar (linea exige volumen vivo y forces exige ◆5 — **el orquestador NO puentea gates**, rollback total probado). **Contrato V34/O22 en cabecera** (riesgos citados: la verdad operativa es `status`, no el pid del wrapper; stop barre puertos de catálogo — compose debe respetar la fuente única; exit 1 = nada quedó arrancado). Aceptado 2026-07-31 (rama `wp/u234-orquestador-v1`; 18 pass + 1 skip preexistente, re-verificado) | perfil mínimo arriba con health por entrada ✓ · stop sin residuos ✓ (re-bind ×4) · catálogo/deps como fuente ✓ (grep 0 literales) | **P0** |
| **U235** | Aceptación Z-v1 | e2e de sistema que hoy no existe: instalación limpia → runtime → juego G cargado → actores entran → intent → estado observado → **restart → recupera**. Desde checkout/tarballs limpios, offline tras seed | ciclo completo con evidencia literal · artifact inventory · cara Z del test del operador externo | **P0** |
| U236 | Matriz de distribución | por clase: engine→npm · services→images/start · UIs→apps · fixtures→packs. **V20 (documento de puertas) es su consumidor directo** | cada pieza con canal verificable · cero «publicado» ambiguo | P1 |
| **U237** ✅ | Licencia SPDX por workspace | **Ejecutado (decisión ② custodio)**: 52/52 manifests (raíz+50+anidada) = `SEE LICENSE IN LICENSE.md` — npm rechaza `LicenseRef-`, verificado con su validador; el composite SPDX `(GPL-3.0-or-later AND LicenseRef-Animus-Iocandi)` queda documentado en `LICENSE.md` §0. **Contrarrevisión adversarial PASS** (recuento propio 52/52 + fixture excluida defendible · hostil-omite en vivo · vehículo re-validado · cero contrabando). Obs. asentadas: (A) la anidada era `MIT`→composite (defendible: `private:true`, obra propia, la decisión cubre el workspace entero) · (B) **capa tarball pendiente**: LICENSE.md no entra en los packs y el texto GPL es URL viva → lo resuelven U238/U213/U236. Cara Z del acta única; L·O·G·HUB citarán este patrón. Aceptado 2026-07-31 (rama `wp/u237-licencia-spdx`) | 52/52 mismo valor ✓ · vehículo validado de facto ✓ · LICENSE/docs coinciden ✓ · diff limpio (54 ficheros, 1 línea/manifest) ✓ | **P0** |
| U238 | SBOM / provenance / reproducibilidad | artefactos verificables desde tip y canal | dos builds comparan · SBOM por paquete publicado | P1 |
| **U239** | Triage de vulnerabilidades | las 53/6 críticas históricas de deps: clasificar explotable/no-aplica con evidencia | cero críticas sin veredicto · explotable **bloquea release** | **P0** |
| U240 | Backup/restore del plano de datos | restore en root limpio; curación humana y secuencias SSB preservadas | ciclo backup→wipe→restore→CA local-first verde | P1 |
| U241 | Resiliencia y presupuestos | caída de relay/pub/driver con recuperación medida; CPU/mem/snapshot presupuestados | cada caída con comportamiento declarado y test · presupuestos en CI | P1 |
| U242 | Contrato de plugin/driver | probar que un driver **externo** (o fixture) se añade sin tocar el núcleo — la extensibilidad como hecho, no como intención | segundo driver monta por contrato · cero ediciones en core | P1 |
| U243 | Spike PODs/Solid · líneas como RDF (horizonte VOLUMES) | hay PRs pendientes (zeus) que integran el mundo POD/Solid; `ZEUS_VOLUMES_ROOT` podría quedar **sobreseído** por un cluster de pods (por jugador / por servicio / por agente) modelando las líneas como RDF. Insumo externo (solo lectura, fuera del cerco): la gestión del grafo graphdb del paradigma de holones (ALEPH.instructions, OASIS) | informe de viabilidad + decisión de mesa · no toca runtime ni contratos v1 | P2 **DEFERRED** hasta U206 |

| U244 | **Triaje del intake externo `WPS_QUEUE` — cola A** (programa holónico LORE-HM) | **Sigue encolado, no promovido** (decisión ⑥ del custodio, 2026-07-31): programa multi-mundo que cruza `e-sdk`, `a-sdk` y Network-Engine — mundos **fuera del reparto actual**; ampliar el reparto es decisión del custodio, no consecuencia de aceptar el intake. **Solapa con U243** (PODs/Solid · líneas como RDF): al abrirlo hay que decidir si lo absorbe, lo alimenta o queda aparte. Cerco y 6 preguntas numeradas: `s-sdk/WPS_QUEUE/ENCOLADO.md` (**T-S01**) | veredicto del custodio · partición por mundo y ownership · **nada se despacha sin GO** | P2 **DEFERRED** al final (tras O) |

### Cola promovida — frontera TypeScript (intake `WPS_QUEUE` cola B, 2026-07-31)

**Promovida a ids canónicos por el orquestador** (autorización del custodio: «el B cuando quieras encolar»). Origen y briefs candidatos: `C:\S_LAB\s-sdk\WPS_QUEUE\QUEUE-B-ZEUS-TIPADO\` (`ZT01–ZT05` = ids locales de la cola, **ya remapeados aquí**; su calibración de worktrees y su lectura del freeze están caducadas — manda el gobierno de Z).

**Ventana de despacho: después de `GD`** (carril D cerrado en U206). Razón dura: `@zeus/linea-kit` es territorio vivo del carril D (U200 y U202 editaron su `src/`), y la campaña de tipos declara *cero cambios en runtime* — despacharla ahora sería programar una colisión. `acta-kit` (U246) no comparte territorio y **puede adelantarse si hace falta hueco**.

| id | ZT | WP | deps | frontera dura | CA de cierre | P |
| -- | -- | -- | ---- | ------------- | ------------ | - |
| U245 | ZT01 | Tipos públicos completos de `@zeus/linea-kit` (todos los subpaths) | GD | cero cambios en `src/**`, schemas y carril D | cada export JS con condición `types` resoluble bajo `NodeNext` · gate exports↔declarations que **falla** al retirar un `.d.ts` o añadir subpath sin declaración | P1 |
| U246 | ZT02 | Tipos públicos completos de `@zeus/acta-kit` | — | íd. | íd. | P1 |
| U247 | ZT03 | Tipos de fachada MCP `@zeus/linea-system` | U245 | íd. | íd. | P1 |
| U248 | ZT04 | Tipos de fachada MCP `@zeus/force-system` | U245 | íd. | íd. | P1 |
| U249 | ZT05 | Certificación C8 de los cuatro paquetes publicados | Release U245–U248 | íd. | consumidor limpio compila con `strict`/`noImplicitAny`/`tsc --noEmit`, sin `file:` ni tarball local ni `any` de escape | P1 |

Transversales heredadas del intake y **ratificadas**: `unknown` donde no haya garantía verificable (nunca `any` de escape) · changeset `patch` por paquete tocado · `npm pack --dry-run` confirma que `types/**` entra en el tarball · contrarrevisión independiente que intente refutar resolución de subpaths, exactitud de firmas y frontera del diff. **Publish sigue bajo GO explícito del custodio** (decisión ③: Marketplace DEFERRED, registry nuevo).

### Conteo y dependencias (edición F2-unificada)

**73 WPs** · P0 **22** · P1 **35** · P2 **16** *(F2-unificada +11; 2026-07-31:
+U243 spike PODs/RDF · U209→P2 DEFERRED — decisión ④ · +U244 triaje del
intake `WPS_QUEUE` cola A (encolado, no promovido) · **+U245–U249 = cola B
promovida a ids canónicos, ventana de despacho tras GD**)*.

```text
U186 (U93-bis) ──▶ U197 (signaling anónimo) ──▶ U218 (holón-7)
U187 (peercard en vivo) ──▶ U218
U199 (C-3+hash) ──▶ U201 (import v1) ──▶ U202–U205 (drivers) ──▶ U206 (CA local-first)
U200 (resolver único) ──▶ U201
U179 (ficha 51/51) ──▶ U233 (gate) ──▶ U180–U185 (catálogo/retiro)
U179 ──▶ U228 (5 datos O)
U232 (gobierno) ──▶ TODO despacho de swarm
U234 (orquestador) ──▶ V34 (mando ciudad) · O22 (compose consume)
U236 (matriz distribución) ──▶ V20 (documento de puertas)
U210/U211 (doc) — arrancan ya; NO CIERRAN sin 4a de G + U212 (CA canal)
U216/U217 (Ciudad) ◀── esperan que G fije qué es un barrio
U209 (root VPS) ◀── DEFERRED al final (decisión ④): U206 validada + subida vía imágenes · horizonte U243
U235 (aceptación) ◀── último gate; consume U206+U218+U233+U234
```

### Registro de lo NO encolado (obra ajena · no se pierde)

| qué | dueño | dónde queda |
| --- | ----- | ----------- |
| C-6 · P2P/réplica continua | mesa · tick nuevo | segundo acto por consenso 6/6 |
| Cambio ◆4(a) en `startpack-kit` (banda major) | **G** | Z solo hace el puente U210 |
| Modelo de Ciudad · federación por tramos · GATE-O-CLAVES como gate de build | mesa / **O** | Z encola solo lo derivado en su mundo |

---

## Sprint 9 / R12-Z — major-band P0×4 · contrarrevisión · prep pub (**PAUSA parcial · GO impl. · 2026-07-25**)

Fuente: **R11-Z PASS** + **R12-Z PASS** + **GO implementación U168–U171**
(TICK custodio · PAUSA parcial) +
[ADDENDA-R12-Z-REVISION-SEMVER-IDLE.md](REPORTES/entregas/ADDENDA-R12-Z-REVISION-SEMVER-IDLE.md).
Detalle: [REPLAN-2026-07-24-r12-major-band.md](REPORTES/entregas/REPLAN-2026-07-24-r12-major-band.md).
Pedido SOL (histórico plan): [AVISO-R12-Z-plan.md](REPORTES/entregas/AVISO-R12-Z-plan.md).
PAUSA parcial: [AVISO-PAUSA-PARCIAL-U168-U171.md](REPORTES/entregas/AVISO-PAUSA-PARCIAL-U168-U171.md).

**Estado:** **U168–U171 ✅** · Sprint 9 / R12 **obra cerrada**. **GO
publish FINAL P0×4 DONE** (tip `e8c5ac2` · **0.1.1** ×4). **No**
reabre Sprint 8 ni U165. **No** abre R13 / U172–U178 / U73.

**Fronteras duras:** sin `npm publish` manual · sin flip/changeset/
publish de `linea-editor` ni excluidos §4 · R13/U172–U178/U73 intactos
(PAUSA parcial).

**GO publish FINAL (D-42):** **DONE** — evidencia en
[AVISO-PUBLISH-FINAL-P0-DONE.md](REPORTES/entregas/AVISO-PUBLISH-FINAL-P0-DONE.md)
· checklist
[CHECKLIST-GO-PUBLISH-P0.md](REPORTES/CHECKLIST-GO-PUBLISH-P0.md).

| ola | WPs | deps | paralelismo |
| --- | --- | ---- | ----------- |
| **A** | U168 · U170 | Sprint 8 ✅ · R12-Z PASS + GO impl. | U168 ∥ U170 |
| **B** | U169 | U168 ✅ | secuencial (posee gate) |
| **C** | U171 | U168 ✅ + U169 ✅ | prep pub (sin publish real) |
| Publish | — | **DONE** (Release `30134579637`) | P0×4 @ **0.1.1** |

### WP-U168 · Migrar P0×4 a major-band — ✅

- ✅ **WP-U168 · Migrar P0×4 a major-band** — aceptado (orquestador /
  2026-07-25). Merge `3689ccf`. Tip obra `e626188`. Contrarrevisión
  PASS:
  [REPORTES/entregas/CONTRARREVISION-U168-PASS.md](REPORTES/entregas/CONTRARREVISION-U168-PASS.md).
  Reporte:
  [REPORTES/WP-U168-major-band-p0.md](REPORTES/WP-U168-major-band-p0.md).
  Brief:
  [REPORTES/briefs/WP-U168-major-band-p0.md](REPORTES/briefs/WP-U168-major-band-p0.md).
  P0×4 en major-band; allowlist §5 alineada; `private: true` intacto;
  gate sigue midiendo pin exacto hasta U169. **Eje:** IV.

### WP-U169 · Gate publish-ready major-band — ✅

- ✅ **WP-U169 · Adaptar gate publish-ready a major-band** — aceptado
  (orquestador / 2026-07-25). Merge `0cdf888`. Tip obra `98f21bf`.
  Contrarrevisión PASS:
  [REPORTES/entregas/CONTRARREVISION-U169-PASS.md](REPORTES/entregas/CONTRARREVISION-U169-PASS.md).
  Reporte:
  [REPORTES/WP-U169-gate-major-band.md](REPORTES/WP-U169-gate-major-band.md).
  Gate P0×4 OK major-band; 6 fail-probes exit 1. **Eje:** IV + C8.

### WP-U170 · Contrarrevisión WPs de riesgo — ✅

- ✅ **WP-U170 · Persistir contrarrevisión independiente** — aceptado
  (orquestador / 2026-07-25). Merge `317a504`. Tip obra `87a17ac`.
  PRACTICAS §9 + checklist
  [REPORTES/CHECKLIST-CONTRARREVISION.md](REPORTES/CHECKLIST-CONTRARREVISION.md).
  Reporte:
  [REPORTES/WP-U170-contrarrevision-riesgo.md](REPORTES/WP-U170-contrarrevision-riesgo.md).
  Brief:
  [REPORTES/briefs/WP-U170-contrarrevision-riesgo.md](REPORTES/briefs/WP-U170-contrarrevision-riesgo.md).
  Aplica a U168/U169/U171. Cero `packages/**`. **Eje:** IV (proceso).

### WP-U171 · Preparar publicación (sin publish) — ✅

- ✅ **WP-U171 · Preparar publicación P0×4 (checklist / changesets dry)**
  — aceptado (orquestador / 2026-07-25). Merge `90914c3`. Tip obra
  `2388668`. Contrarrevisión PASS:
  [REPORTES/entregas/CONTRARREVISION-U171-PASS.md](REPORTES/entregas/CONTRARREVISION-U171-PASS.md).
  Checklist:
  [REPORTES/CHECKLIST-GO-PUBLISH-P0.md](REPORTES/CHECKLIST-GO-PUBLISH-P0.md).
  Reporte:
  [REPORTES/WP-U171-prep-publicacion.md](REPORTES/WP-U171-prep-publicacion.md).
  Dry-run sin changesets pendientes; `private: true` intacto; cero
  publish. **Eje:** IV.

---

## Cola publish-ready P1 — `linea-editor` (D-42 · ⬜ · 2026-07-24)

Fuente: **D-42** +
[ADDENDA-R12-Z-GO-PUBLICACION-ALLOWLIST.md](REPORTES/entregas/ADDENDA-R12-Z-GO-PUBLICACION-ALLOWLIST.md)
(§ P1 encolado aparte) + allowlist §3 P1. **Entrega distinta del lote
P0×4** (no fusionar con U171 ni con la evolución funcional del paquete
en U175). Su publish solo se activa tras el **PASS de este WP** (GO
publish condicionado D-42 propio).

### WP-U178 · Publish-ready `@zeus/linea-editor` (P1) — ⬜

- ⬜ **WP-U178 · Publish-ready `@zeus/linea-editor` (P1)** — pendiente.
  Est. M. Dep: **U168 ✅ + U169 ✅** (major-band + gate adaptado) · GO
  implementación propio. Brief:
  [REPORTES/briefs/WP-U178-publish-ready-linea-editor.md](REPORTES/briefs/WP-U178-publish-ready-linea-editor.md).
  **Qué:** `publishConfig` + `files` explícito · tarball limpio medido
  (`npm pack --dry-run`) · decisión JS-only documentada · major-band en
  deps internas `@zeus/*` · changeset · matriz CI/Release · gate
  online/C8. **Fuera:** flip `private` · `npm publish` (solo tras PASS
  propio + condiciones D-42) · lote P0×4 · reabrir U166 · evolución
  funcional (dueño U175). **Contrarrevisión** obligatoria. **Eje:** IV.

---

## R13-Z — tercer frente Dramaturgo + Zigurat (planificación · hold operativo · D-43 · 2026-07-24)

Fuente: **DA-S21 asentada · `2eb4784`** (**D-43**)
+ [ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md](REPORTES/entregas/ADDENDA-R13-Z-TERCER-FRENTE-DRAMATURGO.md)
(espejo `vigilancia/z/`). Detalle:
[REPLAN-2026-07-24-r13-dramaturgo-zigurat.md](REPORTES/entregas/REPLAN-2026-07-24-r13-dramaturgo-zigurat.md).
Pedido SOL: [AVISO-R13-Z-pedido-PASS.md](REPORTES/entregas/AVISO-R13-Z-pedido-PASS.md).
Hold histórico: [AVISO-R13-Z-plan-hold.md](REPORTES/entregas/AVISO-R13-Z-plan-hold.md).

**Estado:** **solo planificación** — WPs **⬜** · **0 🔶** · **0
workers** · **0** código. HOLD de autoridad **levantado** (DA-S21
autoriza planificar). Hold **operativo** vigente: **PAUSA** +
**reintento R13-Z emitido** + **sin despacho** (R12-Z PASS + adopción
0.10.0 ya vigentes; orquestador **no** declara R13 PASS).

**Bloqueo duro (tercer frente):** no abrir implementación hasta
(1) **R12 cerrado**, (2) **R13-Z PASS**, (3) **GO implementación
aparte**. Sin publicación de paquetes en este frente.

**Camino A (DRY — extender antes de crear):** absorber el dominio
narrativo en contratos y paquetes existentes — proyección
RouteEntry→MCP de `@zeus/http-contract` · identidad/seats existentes
(`@zeus/protocol` / authority-kit) · `@zeus/story-board-schema` ·
`@zeus/linea-editor` · componentes de reparto existentes · épica
Zigurat histórica (U73). **No** reconstruir el editor legado, **no**
duplicar schemas, **no** convertir Zigurat en capa federada completa.
Ownership externo (sin WP en zeus): archivo del editor legado / DAS-1 /
extensión VS Code · sidecar/pub. Rutas fuente del legado = **solo
lectura**; ningún vocabulario ni artefacto legado al código público.

| ola | WPs | deps | paralelismo |
| --- | --- | ---- | ----------- |
| **A** | U172 · U173 | R12 cerrado · R13-Z PASS + GO impl. | U172 ∥ U173 |
| **B** | U174 | U173 ✅ | secuencial (posee schema) |
| **C** | U175 | U172 ✅ + U173 ✅ + U174 ✅ | secuencial (posee linea-editor src) |
| **D** | U176 | U173 ✅ + U174 ✅ | ∥ U175 posible (archivos disjuntos) |
| **E** | U177 | contratos U173–U175 ✅ (diseño ∥) | cierre diseño épica U73 |

### ÉPICA U73 · Zigurat — teatro de la capa 2 (acotada) — ⬜

- ✅ **ÉPICA U73 · Zigurat acotada (teatro de la capa 2)** —
  **CERRADA-POR-DISEÑO** (2026-07-25, con U177 ✅). Ejecutada vía
  **U172–U177, los seis ✅** (gates R16–R20). Diseño sellado en
  `REPORTES/CONTRATO-IDE-OPT-IN-v1.md` Parte II: qué entra
  (mutaciones-tools · reparto/permisos · personajes en board ·
  autoría gateada · import · contrato IDE), qué no entra (capa
  federada completa → hook D-20/U93 · identidad nueva · extensión
  IDE · publish U178), cinco invariantes de frontera, cuatro puntos
  de extensión con deuda consciente registrada.

### WP-U172 · Proyector MCP de mutaciones HTTP — ✅

- ✅ **WP-U172 · Proyectar mutaciones HTTP como herramientas MCP** —
  aceptado (vigía-emulado / 2026-07-25). Rama
  `wp/u172-proyector-mcp-mutaciones` · tip obra `35e6ea4` · merge
  `97a504a`. Contrarrevisión independiente: **DEVOLUCIÓN (1
  bloqueante: payload crudo vs parsed.data, repro con campo
  inyectado; 2 menores) → corrección misma rama → PASS** (revisor
  re-ejecutó su repro: campo extra ya no viaja). Suite en main:
  36/36. Runner: worker Opus + contrarrevisión Sonnet (Fable en
  orquestación · directiva ahorro custodio). Patrón gemelo
  preexistente en middleware.mjs anotado como candidato a WP futuro.
  Est. M. Ola A (∥ U173). Brief:
  [REPORTES/briefs/WP-U172-proyector-mcp-mutaciones.md](REPORTES/briefs/WP-U172-proyector-mcp-mutaciones.md).
  **Qué:** extender la proyección RouteEntry→MCP existente de
  `@zeus/http-contract` (hoy resources/readers GET) para proyectar
  mutaciones (POST/PUT) como **tools** MCP con validación de envelope y
  gate visible; probes verde/rojo. **Fuera:** proyector nuevo paralelo ·
  UI · publish. **Contrarrevisión** obligatoria (contrato). **Eje:** I.

### WP-U173 · Kit de reparto y permisos de dominio — ✅

- ✅ **WP-U173 · Kit de reparto y permisos de dominio** — aceptado
  (vigía-emulado / 2026-07-25). Rama `wp/u173-kit-reparto-permisos` ·
  tip obra `2069bfb` · merge `7c1d8a8`. Paquete
  **`@zeus/reparto-kit`** (nombre validado en contrarrevisión), shape
  `reparto/1` congelado, 1 actor (ssbId) – N personajes.
  Contrarrevisión independiente: **DEVOLUCIÓN (1 bloqueante:
  seatSignature inválida obtenía «concedido», repro cripto en vivo; 3
  menores) → corrección misma rama (verifyTravelingPeerCard del
  protocol + exigirSeat + test réplica del ataque) → PASS** + higiene
  pre-merge (byte NUL → escape visible, misma semántica). Suite en
  main: 28 pass / 1 skip legítimo. Deuda documentada: consumo de
  view-kit vía resolve interno (candidato: exponer ./widgets en
  view-kit). Runner: worker Opus + contrarrevisión Sonnet. Est. M.
  Ola A (∥ U172). Brief:
  [REPORTES/briefs/WP-U173-kit-reparto-permisos.md](REPORTES/briefs/WP-U173-kit-reparto-permisos.md).
  **Qué:** kit de reparto (personajes/roles del dominio narrativo) +
  permisos sobre identidad/seats **existentes** (`@zeus/protocol`
  peer-card/seat · authority-kit), reutilizando componentes de reparto
  existentes (view-kit); sin identidad nueva. **Fuera:** federación ·
  identidad nueva · UI nueva · publish. **Contrarrevisión** obligatoria
  (contrato/permisos). **Eje:** I.

### WP-U174 · Personajes en story-board — ✅

- ✅ **WP-U174 · Referencias de personajes en story-board** — aceptado
  (vigía-emulado / 2026-07-25). Rama `wp/u174-personajes-story-board`
  · tip obra `34719bb` · merge `5932a0a`. Campo `personajes` opcional
  en ambos dialectos (refs-only estricto; retro-compat verificada).
  Contrarrevisión independiente: **PASS directo** (reproducción total:
  14/14 · editor-ui 15/2skip · linea-editor 6/6 contra el schema
  nuevo · 17 casos adversariales propios incl. dialecto aleph) con
  **1 obs menor follow-up**: puntero `reparto` sin format/maxLength
  (candidato `format:"uri"`). Junctions creados y desmontados con
  constancia (worker y revisor). Runner: worker Opus + contrarrevisión
  Sonnet. Est. S/M. Ola B. Brief:
  [REPORTES/briefs/WP-U174-personajes-story-board.md](REPORTES/briefs/WP-U174-personajes-story-board.md).
  **Qué:** extender `@zeus/story-board-schema` con referencias de
  personajes (refs al reparto U173); validación AJV + fixtures; los
  consumidores existentes siguen validando. **Fuera:** schema nuevo
  paralelo · publish. **Contrarrevisión** obligatoria (schema).
  **Eje:** I.

### WP-U175 · Autoría gateada sobre linea-editor — ✅

- ✅ **WP-U175 · Autoría gateada por reparto sobre `linea-editor`** —
  aceptado (vigía-emulado / 2026-07-25). Rama
  `wp/u175-autoria-gateada-linea-editor` · tip obra `039b8d1` ·
  merge `d932efe`. Gate único extendido (dos caras) + **política
  servidor-side `ZEUS_LINEA_EDITOR_REQUIRE_REPARTO`** (env fresco,
  no debilitable por args; default OFF con README como advertencia
  de seguridad; despliegues dramaturgo DEBEN activarla).
  Contrarrevisión: **DEVOLUCIÓN (bloqueante: bypass e2e por omisión
  de reparto) → corrección (flag servidor) → PASS** (revisor repitió
  su ataque en ambos estados + 3 inyecciones de debilitamiento
  denegadas). Suite en main: 21/21. Runner: worker Opus +
  contrarrevisión Sonnet. Est. M. Ola C. Brief:
  [REPORTES/briefs/WP-U175-autoria-gateada-linea-editor.md](REPORTES/briefs/WP-U175-autoria-gateada-linea-editor.md).
  **Qué:** extender la autoría gateada existente de
  `@zeus/linea-editor` (gate visible / approvalToken) con permisos por
  reparto (U173) y personajes (U174); export story-board coherente.
  **Fuera:** publish-ready (dueño **U178** — entrega distinta, no
  fusionar) · reconstruir el editor legado · publish. **Contrarrevisión**
  obligatoria. **Eje:** I + IV.

### WP-U176 · Importador de corpus legado (one-off) — ✅

- ✅ **WP-U176 · Importador one-off de corpus legado** — aceptado
  (vigía-emulado / 2026-07-25). Rama `wp/u176-importador-corpus-legado`
  · tip obra `825486c` · merge `ad1fac8`. Tooling
  `scripts/import-legado/` (obra→línea + story-board con personajes
  U174 + reparto U173; IDs zeus deterministas D-19; fuentes SOLO por
  env del operador; fixtures sintéticas). Contrarrevisión:
  **DEVOLUCIÓN (evidencia CA1 no reproducible desde HEAD; código
  correcto) → regeneración + forense honesto del hash (NUL-join vs
  espacio-join, verificado empíricamente por el revisor) → PASS**.
  Suite: 11/11 · ceguera enmascarada 0 (U141/D-32) · 0 rutas locales.
  Ejecución real contra el corpus = tick del operador (env inyectado).
  Follow-up de higiene del revisor: 4 citas inertes preexistentes en
  reportes viejos, candidatas a enmascarado retroactivo (wishlist).
  Runner: worker Opus + contrarrevisión Sonnet. Est. M. Ola D. Brief:
  [REPORTES/briefs/WP-U176-importador-corpus-legado.md](REPORTES/briefs/WP-U176-importador-corpus-legado.md).
  **Qué:** tooling one-off que lee las rutas fuente del legado **solo
  lectura** y emite los formatos existentes (linea-kit / story-board +
  reparto); prueba de ceguera obligatoria — ningún vocabulario ni
  artefacto legado en el código público (conteo literal **0**).
  **Fuera:** archivo del legado (ownership externo) · corpus fuente en
  git · publish. **Contrarrevisión** obligatoria (migración + ceguera).
  **Eje:** II (+ ceguera transversal).

### WP-U177 · Contrato consumo IDE opt-in + cierre diseño Zigurat — ✅

- ✅ **WP-U177 · Contrato de consumo IDE opt-in + cierre de diseño de
  la épica U73** — aceptado (2026-07-25). Worker = vigía-emulado
  (tick custodio; cascada del brief: Fable ✓). Rama
  `wp/u177-contrato-ide-cierre-zigurat` · tip obra `5d5289a` · merge
  `4e970ef`. Entregable: `REPORTES/CONTRATO-IDE-OPT-IN-v1.md` (5
  fases · tabla de verificación 11 filas contra artefactos reales ·
  cláusulas transversales) + cierre de diseño de la épica.
  Contrarrevisión con MANDATO DE CERO DEFERENCIA (worker=orquestador):
  **DEVOLUCIÓN (catálogo deny 5 de 8; 2 citas imprecisas) →
  corrección + cláusula viva (motivos_deny de editor://info manda en
  runtime) → PASS** literal-a-literal. Ceguera 0. Est. M. Ola E.
  Brief:
  [REPORTES/briefs/WP-U177-contrato-ide-cierre-zigurat.md](REPORTES/briefs/WP-U177-contrato-ide-cierre-zigurat.md).
  **Qué:** contrato de consumo IDE **opt-in** documentado (sin
  implementar extensión) + cierre de diseño de la épica U73 Zigurat
  acotada (qué entra / qué no / puntos de extensión, incl. hook SSB
  D-20). **Fuera:** implementar extensión IDE (ownership externo) ·
  capa federada completa · publish. **Eje:** IV (diseño/contrato).

---

## Sprint 8 — publish-ready mesh (CERRADO · R11-Z PASS · 2026-07-24)

Fuente: plan U162 + allowlist + **R8-Z PASS** (Ola A) + **GO
implementación Ola A** + **R9-Z PASS** (cierre Ola A) + **R10-Z PASS**
+ **GO implementación Ola B** (custodio) + **R11-Z FAIL** + **R11-Z
FAIL reintento** (corregido: semver raíz) → **U165 ✅** → **R11-Z
PASS**. Detalle olas/deps:
[REPLAN-2026-07-24-sprint8.md](REPORTES/entregas/REPLAN-2026-07-24-sprint8.md).
Gates: [GATE-R11-Z-PASS.md](REPORTES/entregas/GATE-R11-Z-PASS.md) ·
[GATE-R11-Z-FAIL-REINTENTO.md](REPORTES/entregas/GATE-R11-Z-FAIL-REINTENTO.md) ·
[GATE-R11-Z-FAIL.md](REPORTES/entregas/GATE-R11-Z-FAIL.md) ·
[GATE-R10-Z-PASS.md](REPORTES/entregas/GATE-R10-Z-PASS.md) ·
[GATE-R9-Z-PASS.md](REPORTES/entregas/GATE-R9-Z-PASS.md) ·
`vigilancia/z/GATE-R8-Z-PASS.md`.

**Sprint 8 CERRADO / IDLE de obra.** No reabrir U165 ni olas A/B.
Siguiente frente = Sprint 9 / R12-Z (planificación arriba).

**Fronteras duras (hasta GO publish aparte):** sin flip `private` ·
sin changesets de publicación · sin `npm publish`. **No** reabre U162
como GO previo legítimo (D-41). **No** reabre U164/U165/U166.

| ola | WPs | deps | paralelismo |
| --- | --- | ---- | ----------- |
| **A** | U163 · U167 | U162 ✅ | U163 ∥ U167 (**✅ cerrada**) |
| **B** | U164 · U166 · U165 | U163 ✅ | U164 ✅ · U166 ✅ → **U165 ✅** (semver raíz) |
| Publish | — | GO aparte | private + changesets de pub + npm publish |

### WP-U163 · POC publish-ready `@zeus/linea-system` — ✅

- ✅ **WP-U163 · POC publish-ready `@zeus/linea-system`** — aceptado
  (orquestador / 2026-07-24). Est. M. Dep: U162 ✅. Ola A. Rama
  `wp/u163-poc-publish-ready-linea-system` · tip rama `5f0a5d5` · merge
  `8d3820e`. Brief:
  [REPORTES/briefs/WP-U163-poc-publish-ready-linea-system.md](REPORTES/briefs/WP-U163-poc-publish-ready-linea-system.md).
  Reporte:
  [REPORTES/WP-U163-poc-publish-ready-linea-system.md](REPORTES/WP-U163-poc-publish-ready-linea-system.md).
  **Qué:** plantilla P0 — `publishConfig`, `files`, pines `@zeus/*`,
  JS-only, pack dry-run 8 files. **Fuera:** private · publish ·
  changesets de pub. **Eje:** IV.

### WP-U164 · Replicar P0 (firehose / force / ssb) — ✅

- ✅ **WP-U164 · Replicar P0: linea-firehose, force-system, ssb-system**
  — aceptado (orquestador / 2026-07-24). Est. M. Dep: **U163 ✅**
  (∥ **U166**; antes de aceptar U165). Ola B. Rama
  `wp/u164-replicar-p0-publish-ready` · tip `246ba77` · merge `6a2a409`.
  Brief:
  [REPORTES/briefs/WP-U164-replicar-p0-publish-ready.md](REPORTES/briefs/WP-U164-replicar-p0-publish-ready.md).
  Reporte:
  [REPORTES/WP-U164-replicar-p0-publish-ready.md](REPORTES/WP-U164-replicar-p0-publish-ready.md).
  **Qué:** mismo checklist POC ×3; ssb sin fixtures en tarball.
  **Fuera:** private · publish · changesets de pub · allowlist · gate
  U165. **Eje:** IV.

### WP-U165 · Gate pre-publicación mesh allowlist — ✅

- ✅ **WP-U165 · Gate pre-publicación mesh allowlist** — aceptado
  (orquestador / 2026-07-24 · **re-✅** tras R11-Z FAIL reintento /
  semver raíz). Est. S. Dep: **U163 ✅** + **U164 ✅** + **U166 ✅**.
  Ola B. Rama `wp/u165-semver-root-devdep` · tip obra `1bfd9b8` ·
  merge `289b7fe`. Brief:
  [REPORTES/briefs/WP-U165-gate-prepub-mesh-allowlist.md](REPORTES/briefs/WP-U165-gate-prepub-mesh-allowlist.md).
  Reporte:
  [REPORTES/WP-U165-gate-prepub-mesh-allowlist.md](REPORTES/WP-U165-gate-prepub-mesh-allowlist.md).
  Gate FAIL reintento:
  [REPORTES/entregas/GATE-R11-Z-FAIL-REINTENTO.md](REPORTES/entregas/GATE-R11-Z-FAIL-REINTENTO.md).
  Prev sensor: tip `5a3c4d9` · merge `b550510`. **Qué (esta
  corrección):** `semver` como **devDependency raíz** + lock;
  `npm ls semver --depth=0` → `semver@7.8.5` exit 0; re-gate P0×4 +
  probes ×6 OK. Allowlist **solo lectura**. **Fuera:** publish ·
  changesets de pub · enmendar allowlist (dueño = U166). **Eje:** IV
  + C8. Cierre: **R11-Z PASS**
  ([GATE-R11-Z-PASS.md](REPORTES/entregas/GATE-R11-Z-PASS.md)) ·
  **no reabrir**.

### WP-U166 · Triage P1 linea-editor + console-monitor — ✅

- ✅ **WP-U166 · Triage P1 linea-editor + console-monitor** — aceptado
  (orquestador / 2026-07-24). Est. M. Dep: **U163 ✅** (∥ **U164**;
  antes de aceptar U165). Ola B. Rama
  `wp/u166-triage-p1-linea-editor-console-monitor` · tip `43169ee` ·
  merge `25cf693`. Brief:
  [REPORTES/briefs/WP-U166-triage-p1-linea-editor-console-monitor.md](REPORTES/briefs/WP-U166-triage-p1-linea-editor-console-monitor.md).
  Reporte:
  [REPORTES/WP-U166-triage-p1-linea-editor-console-monitor.md](REPORTES/WP-U166-triage-p1-linea-editor-console-monitor.md).
  **Qué:** exports/console-monitor; decidir publicabilidad o deslistar;
  **posee** enmiendas allowlist/audit P1. **Fuera:** private · publish ·
  changesets de pub · gate U165 · P0. **Eje:** IV.

### WP-U167 · Triage P1 blobstore-client (o deslistar) — ✅

- ✅ **WP-U167 · Triage P1 blobstore-client (o deslistar)** — aceptado
  (orquestador / 2026-07-24). Est. M. Dep: U162 ✅. Ola A (∥ U163).
  Rama `wp/u167-triage-blobstore-client` · tip rama `00c8bc7` · merge
  `f46743b`. Brief:
  [REPORTES/briefs/WP-U167-triage-blobstore-client.md](REPORTES/briefs/WP-U167-triage-blobstore-client.md).
  Reporte:
  [REPORTES/WP-U167-triage-blobstore-client.md](REPORTES/WP-U167-triage-blobstore-client.md).
  **Qué:** **vía B** — democión P1→mantener privado (allowlist §3/§4 +
  audit). **Fuera:** private · publish · changesets de pub. **Eje:** IV.

---

## Sprint 7 — ts-compat + extracción (CERRADO / IDLE · 2026-07-24 · U155–U161 ✅)

Fuente handoff apertura orquestador-Z (R1-Z). Detalle triage + olas:
[REPLAN-2026-07-23-sprint7-ts-extraccion.md](REPORTES/entregas/REPLAN-2026-07-23-sprint7-ts-extraccion.md).
**Gate Ola 1:** `R2-Z PASS`. **Gate Ola 2:** `R3-Z PASS`.
**Gate Ola 3 (apertura):** `R4-Z PASS`
(`vigilancia/z/GATE-R4-Z-PASS.md` · tip `30136cb`) + GO secuencial
custodio — solo **U161**; U158 tras Release verde y R5-Z PASS.
**Gate remate U158:** `R5-Z PASS` (`vigilancia/z/GATE-R5-Z-PASS.md` ·
tip `ff2557c`). **Ola 1:** U155 ✅ · U156 ✅ · U159 ✅. **Ola 2:**
U157 ✅ · U160 ✅ (tip merge `53af36b`). **Ola 3:** U161 ✅.
**Remate:** U158 ✅ · merge `e62a990` · CI `30071337545` success.
**Cierre SOL:** **R6-Z PASS** (`vigilancia/z/GATE-R6-Z-PASS.md`).
**Sprint 7 CERRADO / IDLE** — 0 🔶; sin obra abierta. DC-15 LOCAL-ONLY.

### (A) Compatibilidad TypeScript `@zeus/*`

#### WP-U155 · `@zeus/protocol` types en subpaths — ✅

- ✅ **WP-U155 · Condiciones `"types"` en subpaths de `@zeus/protocol`
  (primero `./peer-card-seat`)** — aceptado (orquestador / 2026-07-23).
  Rama `wp/u155-protocol-types-subpaths` tip `6b3308d` · merge
  `54d60d2`. Est. M. Brief:
  [REPORTES/briefs/WP-U155-protocol-types-subpaths.md](REPORTES/briefs/WP-U155-protocol-types-subpaths.md).
  Reporte:
  [REPORTES/WP-U155-protocol-types-subpaths.md](REPORTES/WP-U155-protocol-types-subpaths.md).
  Re-smoke: `npm test -w @zeus/protocol` 40/40. **CA:** cumplidos.
  **Demolición:** exports string-only en subpaths JS públicos — ✅.
  **Eje:** IV. CI remoto ⏳ al push.

#### WP-U156 · types subpaths presets / webrtc / ui-3d — ✅

- ✅ **WP-U156 · `"types"` en subpaths de `@zeus/presets-sdk`,
  `@zeus/webrtc-signaling`, `@zeus/ui-3d-kit`** — aceptado
  (orquestador / 2026-07-23). Rama
  `wp/u156-types-subpaths-presets-webrtc-ui3d` tip `602fcf1` · merge
  `3c7d15d`. Est. M. `@zeus/rooms` = N/A. Brief:
  [REPORTES/briefs/WP-U156-types-subpaths-presets-webrtc-ui3d.md](REPORTES/briefs/WP-U156-types-subpaths-presets-webrtc-ui3d.md).
  Reporte:
  [REPORTES/WP-U156-types-subpaths-presets-webrtc-ui3d.md](REPORTES/WP-U156-types-subpaths-presets-webrtc-ui3d.md).
  Re-smoke: presets 43 · webrtc 22 · ui-3d 24. **CA:** cumplidos.
  **Eje:** IV. Deferidos horse/contract/http-contract → residual. CI ⏳.

#### WP-U157 · `.d.ts` grafo cercano (fase 2) — ✅

- ✅ **WP-U157 · Declaraciones `.d.ts` kits publicables BARE del grafo
  de los cinco tipados** — aceptado (orquestador / 2026-07-23 · Ola 2).
  Rama `wp/u157-dts-grafo-cercano` tip `7554472` · merge `2567189`.
  Est. L. Dep: U155+U156 ✅. Brief:
  [REPORTES/briefs/WP-U157-dts-grafo-cercano.md](REPORTES/briefs/WP-U157-dts-grafo-cercano.md).
  Reporte:
  [REPORTES/WP-U157-dts-grafo-cercano.md](REPORTES/WP-U157-dts-grafo-cercano.md).
  Lote cerrado ×9: view-kit, game-engine, authority-kit,
  room-client-browser, http-contract, ui-kit, app-shell, player-mcp-kit,
  socket-server. Re-smoke orquestador: http-contract 20/20. **CA:**
  cumplidos. **Eje:** IV. Residuales fans protocol / deferidos U156 →
  cola. CI ⏳.

#### WP-U158 · smoke TS desde registry + CI — ✅

- ✅ **WP-U158 · Consumidor TypeScript limpio desde registry (C8) en
  CI** — aceptado (orquestador-Z / 2026-07-24 · R5-Z PASS). Est. M.
  Dep: U155+U156 ✅ (U157 refuerza; U161 publish resuelve costura).
  Brief:
  [REPORTES/briefs/WP-U158-smoke-ts-registry-ci.md](REPORTES/briefs/WP-U158-smoke-ts-registry-ci.md).
  Rama `wp/u158-smoke-ts-registry` tip `cad90a6` · merge `e62a990`.
  Reporte:
  [REPORTES/WP-U158-smoke-ts-registry.md](REPORTES/WP-U158-smoke-ts-registry.md).
  **CA:** install `@zeus/*` tipados **desde registry real**
  (`https://npm.scriptorium.escrivivir.co`) GREEN; `tsc --noEmit` sin
  `any` de escape exit 0; cableado CI. Run main `30071337545` success,
  job registry `89412677473` success (no skip). **Demolición:** N/A
  (añade gate; U54/U161 intacto).

### (B) Extracción dependencia cruzada `@alephscript/mcp-core-sdk`

Grafo confirmado: dep runtime en `@zeus/rooms` + `@zeus/socket-server`;
tipos en `@zeus/webrtc-signaling`. Paquete destino: **`@zeus/socket-core`**.

#### WP-U159 · scaffold `@zeus/socket-core` — ✅

- ✅ **WP-U159 · Paquete propio con SocketClient/SocketServer (superficie
  usada)** — aceptado (orquestador / 2026-07-23). Rama
  `wp/u159-socket-core-scaffold` tip `6080b5e` · merge `46c6de2`.
  Est. L. Brief:
  [REPORTES/briefs/WP-U159-socket-core-scaffold.md](REPORTES/briefs/WP-U159-socket-core-scaffold.md).
  Reporte:
  [REPORTES/WP-U159-socket-core-scaffold.md](REPORTES/WP-U159-socket-core-scaffold.md).
  Re-smoke: 6/6 · IMPORTS_MCP=0. **CA:** cumplidos. **Eje:** I
  (cableado producción = U160). CI ⏳.

#### WP-U160 · migrar + cortar dep en `@zeus/*` — ✅

- ✅ **WP-U160 · rooms + socket-server → socket-core; cortar
  `@alephscript/mcp-core-sdk` en packages Zeus** — aceptado
  (orquestador / 2026-07-23 · Ola 2). Rama
  `wp/u160-migrar-corte-mcp-core` tip `dcf0a3c` · merge `53af36b`.
  Est. M. Dep: U159 ✅. Brief:
  [REPORTES/briefs/WP-U160-migrar-corte-mcp-core.md](REPORTES/briefs/WP-U160-migrar-corte-mcp-core.md).
  Reporte:
  [REPORTES/WP-U160-migrar-corte-mcp-core.md](REPORTES/WP-U160-migrar-corte-mcp-core.md).
  Re-smoke orquestador: rooms + socket-server verdes; IMPORTS_MCP=0 /
  PKG_JSON=0 en `packages`; SocketClient/Server solo en socket-core.
  **CA:** cumplidos. **Ejes:** I + II. Residuales root/examples → U161.
  CI ⏳.

#### WP-U161 · smoke scope solo `@zeus` + demolición residual — ✅

- ✅ **WP-U161 · Smoke consumidor un solo scope `@zeus` + cierre
  demolición** — aceptado (orquestador-Z / 2026-07-23 · Ola 3).
  Rama `wp/u161-smoke-zeus-only` tip `3474872` · merge `229c034`.
  Est. M. Dep: U160 ✅. Brief:
  [REPORTES/briefs/WP-U161-smoke-zeus-only-demolicion.md](REPORTES/briefs/WP-U161-smoke-zeus-only-demolicion.md).
  Reporte:
  [REPORTES/WP-U161-smoke-zeus-only.md](REPORTES/WP-U161-smoke-zeus-only.md).
  **CA:** cumplidos (smoke solo-`@zeus` exit 0; tabla demolición +
  excepciones ops `/spec` `/channels` operator-ui lock; tests+smoke).
  **Ejes:** I + II. U158 posterior ✅; Sprint 7 cerrado.

---

## Post-Sprint 7 — auditoría publish (U162 ✅ · despachado sin GO → ratificado ex post · 2026-07-24)

Fuente (archivada en repo; espejo vigilancia):
[ADDENDA-R5-Z-AUDITORIA-PUBLISH.md](REPORTES/entregas/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md)
(`vigilancia/z/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md`). Gate cierre Sprint 7:
`vigilancia/z/GATE-R6-Z-PASS.md` (+ copia
[GATE-R6-Z-PASS.md](REPORTES/entregas/GATE-R6-Z-PASS.md)). **Sprint 7
permanece CERRADO / IDLE** — no reabre U155–U161. **U162** fue
**despachado sin GO** de ronda (`854ed4e` afirmó GO inexistente); custodio
**ratifica ex post (acotado)** solo para conservar la auditoría (**D-41** ·
2026-07-24 · no precedente · no autoriza U163–U167). **R7-Z FAIL** de
gobierno:
[ACTA-R7-Z-INCIDENTE-despacho-sin-GO-U162.md](REPORTES/entregas/ACTA-R7-Z-INCIDENTE-despacho-sin-GO-U162.md).
Corrección registrada → **R7-Z PASS**
([GATE-R7-Z-PASS.md](REPORTES/entregas/GATE-R7-Z-PASS.md); no GO
implementación; no reabre U162 como GO previo). Frontera dura del WP:
**cero** flip `private` · **cero** npm publish. DC-15 LOCAL-ONLY.

### WP-U162 · Auditoría publish-ready y allowlist de paquetes Zeus — ✅

- ✅ **WP-U162 · Auditoría publish-ready y allowlist de paquetes Zeus** —
  aceptado (orquestador · 2026-07-24 · **despachado sin GO → ratificado
  ex post acotado D-41**). Tip rama `891379d` · merge `696ffff`. Est. L.
  Dep: post-U158 ✅ · Sprint 7 IDLE · R6-Z PASS. Fuente:
  [REPORTES/entregas/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md](REPORTES/entregas/ADDENDA-R5-Z-AUDITORIA-PUBLISH.md).
  Brief:
  [REPORTES/briefs/WP-U162-auditoria-publish-allowlist.md](REPORTES/briefs/WP-U162-auditoria-publish-allowlist.md).
  Reporte:
  [REPORTES/WP-U162-auditoria-publish-allowlist.md](REPORTES/WP-U162-auditoria-publish-allowlist.md)
  (PASS técnico). Fuente única:
  [PUBLISH-ALLOWLIST.md](PUBLISH-ALLOWLIST.md). **Resultado:** inventario
  reproducible 49/49 = 29 publicados + 7 candidatos + 13 privados;
  `npm view` y `npm pack --dry-run` medidos para P0/P1; gates OK.
  Plan U163–U167 → **encolado ⬜** bajo GO planificación Sprint 8
  (no GO implementación; ver § Sprint 8). **CA técnicos:** cumplidos.
  **Proceso:** R7-Z FAIL → corrección → **R7-Z PASS**. **Frontera U162:**
  cero cambios `private`, cero publish, cero workflows/changesets de
  release. **Demolición:** n/a. **Eje:** IV.

---

## AMEND Sprint 2 — CAPA rev2 / verdad de canales (GO · 2026-07-19 · D-26)

Fuente canónica (**leer en WEBS; no copiar a `plan/`**):
`nota externa recibida (temp-review, 2026-07-19)` (WEBS/ENTREGA-CAPA/00-NOTA) +
`nota externa recibida (temp-review, 2026-07-19)` (WEBS/ENTREGA-CAPA/01-PAQUETE-CAPA)
(rev2). Tip claim `main` ~`cb5f675`. Nada reabre U124/U125 ✅ — WPs nuevos.
**Hecho de canal:** `@zeus/startpack-*` → 404 en registry npm; canal
operativo = tarball del GitHub Release.

### (A) Correctivo W-B′ — verdad de canales

#### WP-U132 · Correctivo W-B′ (library docs · CAPA rev2) — ✅

- ✅ **WP-U132 · Aplicar CAPA rev2 verbatim (6 ficheros library/docs)** —
  aceptado (orquestador / 2026-07-19). Tip library `c55955bb` · zeus merge
  `852f8d1`. Brief:
  [REPORTES/briefs/WP-U132-wb-prime-canales.md](REPORTES/briefs/WP-U132-wb-prime-canales.md).
  Reporte:
  [REPORTES/WP-U132-wb-prime-canales.md](REPORTES/WP-U132-wb-prime-canales.md).
  Fichas → tarball Release; releases sin tabla + registry doctrinal;
  startpacks dos canales; nav/sidebar solve. Residual C8
  `startpacks.md:41` → **U136** ✅. **CA:**
  cumplidos acotados al verbatim. **Demolición:** npm-por-nombre operativo
  en fichas + tabla manual releases — ✅.

### (B) Método WEBS → PRACTICAS

#### WP-U133 · Portar C8/C9 a PRACTICAS — ✅

- ✅ **WP-U133 · C8 + C9 como criterio estándar de WPs de docs** —
  aceptado (orquestador / 2026-07-19). Tip `f1a71a2`. Brief:
  [REPORTES/briefs/WP-U133-practicas-c8-c9.md](REPORTES/briefs/WP-U133-practicas-c8-c9.md).
  Reporte:
  [REPORTES/WP-U133-practicas-c8-c9.md](REPORTES/WP-U133-practicas-c8-c9.md).
  PRACTICAS §8 C8/C9 + checklist §3 + plantilla + punteros WORKER/REVISION;
  candidata CANTERA/01 (prosa). **CA:** citables por workers. **Demolición:**
  N/A (gobernanza).

### (C) Higiene plan/ — archivar handoffs

#### WP-U134 · Archivar ENTREGA-* + regla handoffs — ✅

- ✅ **WP-U134 · Mover ENTREGA-* de raíz plan/ + regla de archivo** —
  aceptado (orquestador / 2026-07-19). Tip merge `84e43d6` · revisión
  `4f351f8`. Brief:
  [REPORTES/briefs/WP-U134-archivar-entregas.md](REPORTES/briefs/WP-U134-archivar-entregas.md).
  Reporte:
  [REPORTES/WP-U134-archivar-entregas.md](REPORTES/WP-U134-archivar-entregas.md).
  ENTREGA-* → `REPORTES/entregas/`; links actualizados; regla handoffs en
  `roles/ORQUESTADOR.md`. **CA:** `ls plan/` limpio; 0 links rotos.
  **Demolición:** ENTREGA-* en raíz de `plan/` — ✅.

---

## Micro — protocolo GitHub Actions (GO · 2026-07-19 · D-27)

Fuente: investigación swarm (Fase 0 + (b) ligera). Solo gobernanza `plan/`.
Canónico: `gh run list` / `gh run view`. **No** Cursor-in-CI · **no** MCP /
Automations obligatorios en este WP.

#### WP-U135 · Protocolo Actions (`gh`) en roles + PRACTICAS — ✅

- ✅ **WP-U135 · Ritual / evidencia / gates CI vía Actions** — aceptado
  (orquestador / 2026-07-19). Tip merge `d00af86` · revisión `ed98ddf`. Brief:
  [REPORTES/briefs/WP-U135-protocolo-actions-gh.md](REPORTES/briefs/WP-U135-protocolo-actions-gh.md).
  Reporte:
  [REPORTES/WP-U135-protocolo-actions-gh.md](REPORTES/WP-U135-protocolo-actions-gh.md).
  Ritual `gh run*` en roles + PRACTICAS; PLANTILLA Evidencia CI; N/A U104;
  prohibido secrets/dispatch publish. **CA:** cumplidos. **Demolición:**
  N/A (gobernanza).

---

## Micros post-AMEND — C8 residual + Docs (GO usuario · 2026-07-19 · D-28)

Amparados por **GO usuario** del lote AMEND (**D-26–D-28**). El
**vigilante** aporta hallazgos/devoluciones — **nunca** GO. **U136** ✅.
**U137** cerrado N/A (premisa incorrecta). Fuentes CAPA: leer
`WEBS/ENTREGA-CAPA/01-PAQUETE-CAPA.md` § startpacks (no copiar a `plan/`).

#### WP-U136 · Fix C8 residual `docs/startpacks.md` — ✅

- ✅ **WP-U136 · Alinear fence Registry startpacks con patrón 2c / C8** —
  aceptado (orquestador / 2026-07-19). Library merge `b463a1a` (tip WP
  `b3efec1`) + **`git push origin main`**. Zeus reporte tip `276ee14`.
  Brief:
  [REPORTES/briefs/WP-U136-c8-startpacks-residual.md](REPORTES/briefs/WP-U136-c8-startpacks-residual.md).
  Reporte:
  [REPORTES/WP-U136-c8-startpacks-residual.md](REPORTES/WP-U136-c8-startpacks-residual.md).
  Fence `npm install @zeus/startpack-delta` demolido; prosa 2c como
  `releases.md`. Greps: 0 fences bash/sh; hits doctrinales OK. Actions
  rama Docs/CI `29689322704`/`29689322686` success (protocolo b).
  **CA:** cumplido. **Demolición:** fence Registry operativo npm-por-nombre.

#### WP-U137 · Docs deploy saltado = fallo visible — N/A

- **N/A · WP-U137** — cerrado (orquestador / 2026-07-19). Premisa del
  hallazgo vigilante era incorrecta: deploy saltado con run verde en
  **rama** es correcto (build-only; deploy solo-`main`). Causa real del
  tip no servido = **`main` local ahead sin `git push`** (U132
  `c55955b`). **No** implementar gate genérico «skip=rojo» (rompería
  builds de rama). Sin código útil en ramas/worktrees → N/A (no
  re-scope). Brief archivado con STOP:
  [REPORTES/briefs/WP-U137-docs-deploy-gate.md](REPORTES/briefs/WP-U137-docs-deploy-gate.md).
  Nota:
  [REPORTES/WP-U137-docs-deploy-gate.md](REPORTES/WP-U137-docs-deploy-gate.md).
  Worker `f92b3a9b`: **no reanudar** con premisa vieja.

---

## Micro — bug nav API HTML / SPA (GO usuario · 2026-07-19 · D-29)

Fuente (**leer; no copiar a `plan/`**):
nota externa recibida (temp-review, 2026-07-19) (`ENTREGA-2026-07-19b-bug-api-nav.md`).
Repo: **zeus-sdk** (`docs/.vitepress/config.mjs` + PRACTICAS §8 C8).
Library: verificar (hoy **no** enlaza `/api/` — N/A código). Tip claim
`~5a0079c`. **No** desactivar `cleanUrls` global.

#### WP-U138 · Menú «API HTML» 404ea (SPA vs assets) — ✅

- ✅ **WP-U138 · Nav API HTML → enlaces externos al router SPA** —
  aceptado (orquestador / 2026-07-19). Merge tip `aa2b940` (fix
  `cb55c3d`). Rama `wp/u138-api-nav-spa`. Reporte:
  [REPORTES/WP-U138-api-nav-spa.md](REPORTES/WP-U138-api-nav-spa.md).
  Brief:
  [REPORTES/briefs/WP-U138-api-nav-spa.md](REPORTES/briefs/WP-U138-api-nav-spa.md).
  `target: '_blank'` + `rel` ×6 en nav «API HTML»; PRACTICAS C8 nav/SPA;
  Playwright 6/6; Docs `29690453464` · CI `29690453486` success.
  Residual: links inline md → **WP-U139** (D-30).

---

## Micro — bug API links cuerpo md / SPA (GO usuario · 2026-07-19 · D-30)

Fuente (**leer; no copiar a `plan/`**):
nota externa recibida (temp-review, 2026-07-19) (`ENTREGA-2026-07-19c-bug-api-nav-cuerpo.md`).
Seguimiento de U138 ✅ (nav arreglado; **no reabrir**). Misma raíz SPA vs
assets; superficie = **cuerpo** markdown. Tip claim `~acbb7ed`.
**GO = usuario** (pase custodio); vigilante = hallazgo/CA, no GO.

#### WP-U139 · Links `/api/*.html` en cuerpo md 404ean — ✅

- ✅ **WP-U139 · Cuerpo md → enlaces externos al router SPA** —
  aceptado (orquestador / 2026-07-19). Merge tip `a493214` (WP tip
  `6fb223c` / claim `bc0b2ac`). Rama `wp/u139-api-nav-cuerpo`. Brief:
  [REPORTES/briefs/WP-U139-api-nav-cuerpo.md](REPORTES/briefs/WP-U139-api-nav-cuerpo.md).
  Reporte:
  [REPORTES/WP-U139-api-nav-cuerpo.md](REPORTES/WP-U139-api-nav-cuerpo.md).
  5 md cuerpo (ADDENDA + mesh + protocol) → `target="_blank"`; PRACTICAS
  C8 clase; Playwright 12/12; Docs rama `29691867603` success · CI N/A
  U104. Grep clase: 0 `href="/api/` sin `target`. Residual U138 cerrado.

---

## Micro — higiene rutas absolutas locales (GO · 2026-07-19 · D-31)

Fuente (**archivada en repo; citar ruta interna**):
[REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md](REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md)
(§Nota «Higiene · rutas absolutas…»; GO I5 externo). Repo público:
rutas de máquina local en `plan/` = deuda de portabilidad/privacidad.
**Prioridad:** antes del próximo push a `main`.

#### WP-U140 · Scrub rutas absolutas locales en plan/ — ✅

- ✅ **WP-U140 · Sustituir rutas absolutas de máquina local por cita
  neutral** — aceptado (orquestador / 2026-07-19). Merge tip `32e5124`
  (WP tip `465ba99`). Rama `wp/u140-scrub-rutas-locales`. Brief:
  [REPORTES/briefs/WP-U140-scrub-rutas-locales.md](REPORTES/briefs/WP-U140-scrub-rutas-locales.md).
  Alcance: cada cita de ruta local → «nota externa recibida
  (temp-review, &lt;fecha&gt;)», conservando texto pegado. CA **por
  clase** (no solo lista): grep repo patrones (1)/(2) de la §Nota = 0
  — incluye hit `WP-U122`. Guía futura: notas externas pegadas en
  `plan/REPORTES/` y citadas por ruta interna. **Demolición:** rutas
  absolutas de máquina local como procedencia en el árbol público.
  **Adenda vigía (pre-✅):** el alcance incluye la propia entrega
  archivada
  (`REPORTES/entregas/ENTREGA-2026-07-19-higiene-rutas-locales.md`);
  ejemplo de patrón = forma redactada sin nombre de repo (`C:` +
  `\Users\...\<externo>\...`, partido); CA **sin eximir** ese fichero.
  **Residual post-✅:** evidencia de grep del reporte citaba el token
  (nombre-repo-externo) en claro → **WP-U141** ✅ (cerrado).

---

## Micro — ceguera token en reporte U140 (GO residual · 2026-07-19 · D-32)

Fuente (**archivada en repo; citar ruta interna**):
[REPORTES/entregas/ENTREGA-2026-07-19-ceguera-reporte-u140.md](REPORTES/entregas/ENTREGA-2026-07-19-ceguera-reporte-u140.md)
(§Nota «Enmascarar token…»; residual post-U140). El reporte U140 ✅
reintroduce el needle al documentar CA. Regla: evidencia de grep se
enmascara siempre.

#### WP-U141 · Enmascarar token en reporte U140 — ✅

- ✅ **WP-U141 · Sustituir menciones literales del token
  (nombre-repo-externo) por máscara neutra en
  `plan/REPORTES/WP-U140-scrub-rutas-locales.md`** — aceptado
  (orquestador / 2026-07-19). Rama `wp/u141-ceguera-reporte-u140`.
  Tip WP `2fd869b` · merge `dcd7892`. Brief:
  [REPORTES/briefs/WP-U141-ceguera-reporte-u140.md](REPORTES/briefs/WP-U141-ceguera-reporte-u140.md).
  Alcance: **solo** ese reporte (+ reporte WP-U141; sin reintroducir
  token). CA: grep del token = 0 en **todo** el repo, incluido el
  reporte U140. **Demolición:** token literal en evidencia/prosa del
  reporte U140. No reabre scrub de rutas (U140 ✅).

---

## Sprint 4 — instalación/migración skills (GO · 2026-07-20 · ejecución diferida D-35)

> GO usuario en chat orquestador. Ejecuta la parte que **D-35 dejó fuera**
> («requiere GO + WP aparte»). Procedimiento de referencia: emmanuel
> **WP-I60** (activación skill 0.2.0) — adaptado aquí a **0.3.0** con dos
> deltas del usuario: dep real en `package.json` (consumo multi-IDE desde
> `node_modules`) y materialización `.claude/skills/` para el runner
> Claude Code. Paralelismo: **U145 ∥ U146** (archivos disjuntos) →
> **U147** (dep U145).

### WP-U145 · Dependencia registry `@alephscript/skills-scriptorium@0.3.0` — ✅

- ✅ **WP-U145** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u145-dep-skills-scriptorium` tip `2b4eee3` (dep `b7110ad`).
  **Merge pendiente de GO usuario**; al pushear, `package*.json`
  dispara CI → exigir success (condición en la revisión). Reporte (en
  la rama):
  `plan/REPORTES/WP-U145-dep-skills-scriptorium.md`. CA1–CA3 ✅.
  Hallazgos → cola residual. Brief:
  [REPORTES/briefs/WP-U145-dep-skills-scriptorium.md](REPORTES/briefs/WP-U145-dep-skills-scriptorium.md).
  Añadir `@alephscript/skills-scriptorium` **versión exacta `0.3.0`**
  (devDependency, sin `^`) en `package.json` raíz + `npm install`
  (registry ya en `.npmrc`). **CA:** (1)
  `node_modules/@alephscript/skills-scriptorium/skills/vigilancia/SKILL.md`
  existe; (2) `npm view …@0.3.0 version` exit 0; (3) diff solo
  `package.json` + `package-lock.json` + reporte. **Demolición:** n/a.

### WP-U146 · `plan/roles/` → referencia versionada + calibración zeus — ✅

- ✅ **WP-U146** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u146-roles-referencia` tip `67fefd4`. **Merge pendiente de GO
  usuario** (CI = N/A por U104, solo `plan/`). CA1–CA5 ✅ (CA5 con
  medida honesta filtrando token propio). Reporte (en la rama):
  `plan/REPORTES/WP-U146-roles-referencia.md`. Hallazgos: `.cursor/`
  desactualizado → candidato **U148**; token en historial `main` →
  decisión usuario; prosa README → cola residual. Brief:
  [REPORTES/briefs/WP-U146-roles-referencia.md](REPORTES/briefs/WP-U146-roles-referencia.md).
  Replicar I60: `git rm` de los 5 prompts genéricos; `roles/README.md` →
  referencia versionada **0.3.0** (`skills/swarm-orquestacion` +
  `skills/vigilancia`) + **calibración local zeus** (delta no cubierto
  por el paquete); coser `plan/README.md` y `plan/PRACTICAS.md`.
  **CA (I60 adaptado):** CA1 dedup (grep prompts = exit 1) · CA2
  `npm view …@0.3.0` resoluble · CA3 calibración visible sin abrir el
  paquete · CA4 diff solo `plan/` · CA5 ceguera. **Demolición:** los 5
  prompts copiados (ORQUESTADOR, WORKER, REVISION, CORRECCION, BRIEF).

### WP-U147 · `.claude/skills/` — materialización runner local — ✅

- ✅ **WP-U147** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u147-claude-skills` tip `81036fa` (base = rama U145 `2b4eee3`;
  merge **U145 → U147** obligado). **Merge pendiente de GO usuario**;
  al pushear, `scripts/**`+`package.json` disparan CI → exigir success.
  CA1–CA4 ✅ + verificación de facto: el runner del orquestador
  **descubrió las 3 skills** al materializarse el espejo. Reporte (en
  la rama): `plan/REPORTES/WP-U147-claude-skills.md`. Rama
  `wp/u147-claude-skills`. Brief:
  [REPORTES/briefs/WP-U147-claude-skills.md](REPORTES/briefs/WP-U147-claude-skills.md).
  Script `scripts/sync-claude-skills.mjs` (npm script `skills:sync`):
  copia `node_modules/@alephscript/skills-scriptorium/skills/*` →
  `.claude/skills/` + README de procedencia (fuente = paquete, no
  editar a mano). **CA:** `.claude/skills/vigilancia/SKILL.md` existe e
  idéntico a `node_modules`; script idempotente; procedencia visible.
  **Demolición:** n/a.

---

## Sprint 6 — proyección backlog→Issues (GO usuario · 2026-07-20 · 0.3.3)

**Modo declarado (DC-15):** zeus opera **LOCAL-ONLY**. Ninguna proyección
a GitHub sin GO explícito del usuario **por acción**. `Z_SDK` es repo
**público** → gate de ceguera obligatorio antes de cualquier API.

### WP-U154 · Montar proyección backlog→Issues (dry-run local) — ✅

- ✅ **WP-U154** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u154-proyeccion-backlog` merge `1a24a60`. CA1–CA4 re-verificadas de
  facto por el orquestador (exit 3/1/0/4 remedidos; `custodio`@WP-U139;
  `.sync-map.json={}`; `gh issue list`=[]). Reporte:
  `plan/REPORTES/WP-U154-proyeccion-backlog.md`. Hallazgos → OA-2 (vocab
  público) + cola residual (formato bullets). Brief:
  [REPORTES/briefs/WP-U154-proyeccion-backlog.md](REPORTES/briefs/WP-U154-proyeccion-backlog.md).
  **(histórico del brief abajo)**

- (brief) **WP-U154** (worker background · 2026-07-20). Rama
  `wp/u154-proyeccion-backlog`. **Qué:** cablear la herramienta del paquete
  `proyectar-backlog.mjs` (0.3.3, WP-09/10/12) como npm script; definir la
  calibración local de zeus: `CEGUERA_PATTERN` (tokens de marco + locales
  prohibidos en cara pública), `--alcance abiertos` (solo ⬜/🔶; los ~140
  ✅ no se proyectan), ubicación `plan/.sync-map.json`. Ejecutar
  **`export --dry-run`** (sin API) y capturar salida literal como evidencia.
  **FRONTERA DURA:** `PROYECCION_GITHUB=1` / crear-cerrar issues reales =
  **fuera de alcance**; requiere GO explícito aparte (cara pública). El
  worker **no** toca la API de GitHub. **CA:** npm script existe; dry-run
  corre y lista los WP abiertos que proyectaría (salida literal); gate de
  ceguera activo (sin patrón → rehúsa; con patrón → 0 hits, probado);
  `.sync-map.json` vacío/inicial; cero issues creados (evidencia:
  `gh issue list` sin novedades). **ALCANCE_DIFF:** `package.json` (script),
  `plan/.sync-map.json`, calibración en `plan/roles/README.md` o config,
  `.gitignore` si aplica, reporte. **Eje:** ceguera (transversal).
  **Demolición:** n/a.

---

## Sprint 5 — adopción 0.3.1 (GO · 2026-07-20 · D-37) — ✅

Lote GO · 2026-07-20. MUNDO_RAIZ = zeus-sdk. Merge stack vía **U152**
(trae U149+U150). U151 ∥ U153 indep. post-stack.

### WP-U149 · Baseline 0.3.1 + regla 15 citada — ✅

- ✅ **WP-U149** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u149-baseline-031` tip `9290073` (en main vía stack U152).
  Reporte:
  [REPORTES/WP-U149-baseline-031.md](REPORTES/WP-U149-baseline-031.md).
  Brief:
  [REPORTES/briefs/WP-U149-baseline-031.md](REPORTES/briefs/WP-U149-baseline-031.md).
  **Qué:** (1) fijar `package-lock.json` en 0.3.1 + `npm run skills:sync`
  (espejo local, gitignorado); (2) citar la **regla 15**
  (`reglas-metodo-v04`) en `plan/roles/README.md` §Runners/IDEs y
  checklist cierre ola v0.4 en `plan/PRACTICAS.md §7`. **CA:**
  verificados de facto (npm view 0.3.1 · grep regla 15 · lock 0.3.1 ·
  gates OK). **ALCANCE_DIFF** OK · ceguera OK. **Eje:** ninguno
  (gobierno). **Nota CI:** lockfile dispara CI al push.

### WP-U150 · Gate `verificar-sitio.mjs` en docs CI + slug roto — ✅

- ✅ **WP-U150** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u150-gate-sitio` tip `9ef2eaf` (en main vía stack U152).
  Reporte:
  [REPORTES/WP-U150-gate-sitio.md](REPORTES/WP-U150-gate-sitio.md).
  Brief:
  [REPORTES/briefs/WP-U150-gate-sitio.md](REPORTES/briefs/WP-U150-gate-sitio.md).
  **Qué:** `verificar-sitio.mjs` post-`docs:build` en `docs.yml` + script
  `docs:verify`; slug monorepo unificado a `Z_SDK` (remoto real;
  `zeus-sdk` 404). **CA:** fail-probe exit 1 · build+verify verdes ·
  ALCANCE OK. **Eje:** site-web. **Nota CI:** exigir run_id Docs tras
  push (`.github/**`).

### WP-U151 · CHANGELOG de gobierno (grueso, por ola) — ✅

- ✅ **WP-U151** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u151-changelog-gobierno` tip `7f0103f` · merge `d32c4a5`.
  Reporte:
  [REPORTES/WP-U151-changelog-gobierno.md](REPORTES/WP-U151-changelog-gobierno.md).
  Brief:
  [REPORTES/briefs/WP-U151-changelog-gobierno.md](REPORTES/briefs/WP-U151-changelog-gobierno.md).
  **Qué:** `CHANGELOG.md` raíz Keep a Changelog, grueso por ola/sprint
  (1–4 + olas 0–10), derivado BACKLOG; sin `verificar-changelog.mjs`.
  **CA:** formato OK · sprints presentes · packages/* intactos. **Eje:**
  ninguno. **Nota CI:** paths-ignore N/A probable.

### WP-U152 · Docs: página Proyecto + back-links por tema — ✅

- ✅ **WP-U152** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u152-docs-back` tip `9c5b842` (ff a main; trae U149+U150).
  Reporte:
  [REPORTES/WP-U152-docs-back.md](REPORTES/WP-U152-docs-back.md).
  Brief:
  [REPORTES/briefs/WP-U152-docs-back.md](REPORTES/briefs/WP-U152-docs-back.md).
  **Qué:** `docs/proyecto.md` en nav/sidebar; back-links vía `SITE_BACK`
  en `themeConfig` (socialLinks/footer) — una fuente, 0 hardcode por
  página. **CA:** nav OK · grep registry solo en config · verificar-sitio
  verde (33 html). **Eje:** site-web. **Nota CI:** Docs tras push.

### WP-U153 · Materializar estación de vigilancia — ✅

- ✅ **WP-U153** — aceptado (orquestador / 2026-07-20). Rama
  `wp/u153-estacion-vigilancia` tip `4458380` · merge `bd62759`.
  Reporte:
  [REPORTES/WP-U153-estacion-vigilancia.md](REPORTES/WP-U153-estacion-vigilancia.md).
  Brief:
  [REPORTES/briefs/WP-U153-estacion-vigilancia.md](REPORTES/briefs/WP-U153-estacion-vigilancia.md).
  **Qué:** wrappers `scripts/estacion/*` invocan `watcher.sh` del
  paquete; `.vigilancia/` gitignorado; checks 0.3.1. **CA:** pulso
  literal · ignore OK · checks ejecutados (CHANGELOG cruz operativo
  post-U151). **Eje:** vigilancia. Hallazgos → cola residual.

---

## ENTREGA Sprint 3 / GO I50 (GO · 2026-07-19 · D-33) + GO U143∥U144 (D-34)

> **§Nota recibida** (2026-07-19). Archivada:
> [REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md).
> Triage orquestador (U142 ✅): 4 ítems previos → N/A; **U143** ∥
> **U144** con **GO implementación D-34**. Recurso registry opcional
> (no WP). **U142** ✅ intacto.

### WP-U142 · Recepción / triage Sprint 3 — ✅

- ✅ **WP-U142 · Recibir §Nota ciega Sprint 3, archivar y proponer
  WPs por ítem** — aceptado (orquestador / 2026-07-19 · **D-33**).
  Nota:
  [REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint3.md).
  **CA:** nota archivada (ruta interna); mapa triage abajo; ceguera
  intacta; U141 no tocado. **Demolición:** n/a (recepción).

### Triage (mapa ítem → WP / N/A)

| # §Nota | Ítem | Destino | Estado |
| ------- | ---- | ------- | ------ |
| 1 | CNAME en `docs/public/` (portal + catálogo) | **WP-U143** | ✅ · **D-34** |
| 2 | `npm ci` vs `npm install` en docs.yml del catálogo (consulta) | **WP-U144** | ✅ · **D-34** |
| — | Guard de `base` (MSYS) | N/A | ya en `config.mjs` |
| — | `dist/` en índice (library) | N/A | 0 ficheros |
| — | Gap `paths: docs/**` | N/A | documentado (WP-U104 / D-22 + dispatch) |
| — | Economía CI (paths-ignore / concurrency) | N/A | ya en ci.yml |
| — | Oferta `@alephscript/skills-scriptorium` | recurso · no WP | **D-35** adoptó `@0.3.0` como referencia versionada; `plan/roles/` copia operativa |

### WP-U143 · CNAME `docs/public/` (ambos repos) — ✅

- ✅ **WP-U143 · Commitear `docs/public/CNAME` con el dominio de cada
  portal** — aceptado (orquestador / 2026-07-19 · **D-34**). Brief:
  [REPORTES/briefs/WP-U143-cname-docs-public.md](REPORTES/briefs/WP-U143-cname-docs-public.md).
  Reporte:
  [REPORTES/WP-U143-cname-docs-public.md](REPORTES/WP-U143-cname-docs-public.md).
  Zeus CNAME `bbad244` · merge `4d2d805` · library `963841f` · merge
  `a25ca08`. Dominios: `z-sdk.escrivivir.co` /
  `games.z-sdk.escrivivir.co`. Docs+CI success en ramas WP.
  Persistencia Settings→Pages: ⏳ post-deploy. **CA:** ls-files +
  contenido ✅; Settings ⏳. **Demolición:** n/a.

### WP-U144 · Consulta `npm ci` en docs.yml del catálogo — ✅

- ✅ **WP-U144 · Alinear o documentar `npm install` vs `npm ci` en
  docs.yml del catálogo** — aceptado (orquestador / 2026-07-19 ·
  **D-34** · opción A). Brief:
  [REPORTES/briefs/WP-U144-npm-ci-consulta.md](REPORTES/briefs/WP-U144-npm-ci-consulta.md).
  Reporte:
  [REPORTES/WP-U144-npm-ci-consulta.md](REPORTES/WP-U144-npm-ci-consulta.md).
  Library tip merge `ad9627c` (`npm ci` en `docs.yml`) · Docs Actions
  `29704186751` success. Zeus solo reporte. **U143** no tocado.

---

## Sprint 2 — ADDENDA + CAPA (GO · 2026-07-19 · D-25) — ✅

Fuente canónica:
[00-ADDENDA.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/00-ADDENDA.md) +
[01-PAQUETE-CAPA.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/01-PAQUETE-CAPA.md)
([00-INDICE.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/00-INDICE.md)).
Paquete marketing WEBS/ENTREGA-SPRINT2 →
[SUPERADA-marketing-webs-sprint2/](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/SUPERADA-marketing-webs-sprint2/)
(no aplicar). **Heros/lemas: CAPA los cambia** (prioridad ADDENDA sobre
exención D-24 / marketing SUPERADO).

### (A) Capa editorial — CAPA verbatim

#### WP-U124 · Capa editorial W-A (hero zeus) — ✅

- ✅ **WP-U124 · Aplicar CAPA W-A en `zeus-sdk/docs/index.md`** —
  aceptado (orquestador / 2026-07-19). Rama `wp/u124-copy-web-a` merge
  `53f976e`. Reporte:
  [REPORTES/WP-U124-copy-web-a.md](REPORTES/WP-U124-copy-web-a.md).
  Hero CAPA verbatim (`Z_SDK` / Ventana de Contexto / tagline FOSS 1 línea);
  `actions`/`features` intocados; lema antiguo demolido en index.
  **CA:** cumplido (docs:build Windows quirk → residual preserveSymlinks).
  **Demolición:** N/A (reemplazo verbatim del bloque hero).

#### WP-U125 · Capa editorial W-B (library docs) — ✅

- ✅ **WP-U125 · Aplicar CAPA W-B en library/docs (5 ficheros)** —
  aceptado (orquestador / 2026-07-19). Rama `wp/u125-copy-web-b` (zeus
  reporte + library). Reporte:
  [REPORTES/WP-U125-copy-web-b.md](REPORTES/WP-U125-copy-web-b.md).
  Verbatim CAPA W-B; `config.mjs` intocado; residual nav/sidebar OK.
  **Demolición:** entrada SOLVE como «futuro» en `futuros.md` (ya released).

### (B) Higiene — 4 micros (∥ A)

#### WP-U126 · YAML `release-startpack.yml` — ✅

- ✅ **WP-U126 · Arreglar o demoler `release-startpack.yml` (library)** —
  aceptado (orquestador / 2026-07-19). Rama library
  `wp/u126-release-startpack-yml` merge `542b2ad` + reporte zeus
  `cb683f7`. Reporte:
  [REPORTES/WP-U126-release-startpack-yml.md](REPORTES/WP-U126-release-startpack-yml.md).
  Opción (a): prosa cabecera comentada; parser YAML OK; Notario vía canónica.
  **CA:** cumplido. **Demolición:** N/A (opción a).

#### WP-U127 · Higiene worktrees library — ✅

- ✅ **WP-U127 · Retirar worktrees/dirs huérfanos library** —
  aceptado (orquestador / 2026-07-19). Tip claim `0f9b53f` + revisión;
  higiene FS library (sin merge producto). Reporte:
  [REPORTES/WP-U127-higiene-worktrees.md](REPORTES/WP-U127-higiene-worktrees.md).
  `u107-review` + `wp-u121-*` + `wp-u123-*` fuera de `git worktree list` y
  `.worktrees/`. Sprint 2 activos intactos. **CA:** cumplido.
  **Demolición:** worktree/dirs obsoletos nombrados.

#### WP-U128 · Deps `@zeus/*` caret semver — ✅

- ✅ **WP-U128 · Fijar `"*"` → caret de versiones publicadas (library)** —
  aceptado (orquestador / 2026-07-19). Rama library `wp/u128-zeus-deps-semver`
  merge `0d99e89` + reporte zeus `7c432a8`. Reporte:
  [REPORTES/WP-U128-zeus-deps-semver.md](REPORTES/WP-U128-zeus-deps-semver.md).
  7 package.json + lock; cero `"*"` en deps `@zeus` de `packages/`.
  **CA:** cumplido. **Demolición:** rangos `"*"` en esos package.json.

#### WP-U129 · Links portal `zeus-sdk` → `Z_SDK` — ✅

- ✅ **WP-U129 · URL repo en `docs/guide/estado.md` (cola U120)** —
  aceptado (orquestador / 2026-07-19). Rama `wp/u129-estado-repo-links`
  merge `cf6699d`. Reporte:
  [REPORTES/WP-U129-estado-repo-links.md](REPORTES/WP-U129-estado-repo-links.md).
  2 links portal → `Z_SDK`; `docs:build` OK en reporte.
  **CA:** cumplido. **Demolición:** URLs `zeus-sdk` incorrectas en ese fichero.

### (C) Gobernanza — al cierre

#### WP-U130 · Plantilla de sprint (PRACTICAS/roles) — ✅

- ✅ **WP-U130 · Formalizar ciclo de sprint en `plan/PRACTICAS.md` o roles/**
  — aceptado (orquestador / 2026-07-19). Tip claim `2b448be`. Brief:
  [REPORTES/briefs/WP-U130-plantilla-sprint.md](REPORTES/briefs/WP-U130-plantilla-sprint.md).
  Reporte:
  [REPORTES/WP-U130-plantilla-sprint.md](REPORTES/WP-U130-plantilla-sprint.md).
  PRACTICAS §7 + punteros roles; acta
  [02-ACTA-CIERRE.md](REPORTES/entregas/ENTREGA-2026-07-19-sprint2/02-ACTA-CIERRE.md) estrena
  fórmula. **CA:** cumplido. **Demolición:** N/A (gobernanza).

### (D) Docs — regeneración web («pipeline» documental)

#### WP-U131 · Documentar publicar la web — ✅

- ✅ **WP-U131 · Página `docs/guide/publicar-la-web.md` (+ puntero library)** —
  aceptado (orquestador / 2026-07-19). Tip claim zeus `2a41a0c` · library
  `2014816`. Brief:
  [REPORTES/briefs/WP-U131-publicar-la-web.md](REPORTES/briefs/WP-U131-publicar-la-web.md).
  Reporte:
  [REPORTES/WP-U131-publicar-la-web.md](REPORTES/WP-U131-publicar-la-web.md).
  Ciclo VitePress → Actions `docs.yml` → Pages + catálogo ← Releases.
  **CA:** página en portal; comandos corren; calza con `docs.yml` real;
  library enlaza o replica en corto — cumplido.
  **Demolición:** N/A (docs nuevas).

---

## Sprint 1 — bug-fixing (GO · ENTREGA-18d · D-24) — ✅

Fuente: [ENTREGA-2026-07-18d-sprint1.md](REPORTES/entregas/ENTREGA-2026-07-18d-sprint1.md).
Heros/lemas de marca **EXENTOS** (D-24). Cerrado en código.

### WP-U119 · CI main verde (4 workspaces) — ✅

- ✅ **WP-U119 · Diagnosticar y dejar CI de main verde** — aceptado
  (orquestador / 2026-07-18). Merge `c58d5ea` · tip WP `3d45b8b`.
  Reporte:
  [REPORTES/WP-U119-ci-main-verde.md](REPORTES/WP-U119-ci-main-verde.md).
  Root causes: http pin+EOL · linea demo≠espana · firehose deferred corpora ·
  editor throw sin library. Patrón U102; re-smoke orquestador fail 0.
  Run CI remoto en main tras merge: ⏳ seguimiento.
  **CA:** cumplido en código (4 WS verdes local; skips ⏳ documentados).
  **Demolición:** throw module-level library; pin `0.1.0`; skip linea débil.

### WP-U120 · Prosa portal zeus/docs — ✅

- ✅ **WP-U120 · Refactor prosa `docs/` (zeus, ~23 md)** — aceptado
  (orquestador / 2026-07-18). Merge `e9b5047` · tip WP `7703768`.
  Reporte:
  [REPORTES/WP-U120-prosa-zeus-docs.md](REPORTES/WP-U120-prosa-zeus-docs.md).
  `guide/estado.md` nueva; doctrinales scrub; heros intactos; `docs:build`
  + grep → 0 (re-smoke orquestador).
  **CA:** cumplido. **Demolición:** prosa swarm en doctrinales; puertos
  muertos en tablas producto. Residual: links blob `estado.md` → `Z_SDK`.

### WP-U121 · Prosa portal library/docs — ✅

- ✅ **WP-U121 · Refactor prosa `Z_SDK-games-library/docs/` (~6 md)** —
  aceptado (orquestador / 2026-07-18). Library merge tip `2314b8e` · zeus
  reporte `b196075`+. Reporte:
  [REPORTES/WP-U121-prosa-library-docs.md](REPORTES/WP-U121-prosa-library-docs.md).
  Releases=mecanismo+GitHub vivo; startpacks separa publish; `file:`
  provisional; futuros=estado; heros intactos. Re-smoke `docs:build` +
  grep → 0.
  **CA:** cumplido. **Demolición:** fechas/versiones a mano; publish-⏳ en
  doctrina. Hallazgo: scrub README raíz library → cola residual.

### WP-U122 · Auth durable registry (`_password`) — ✅

- ✅ **WP-U122 · `release.yml` → patrón `_password` (basic-auth)** —
  aceptado (orquestador / 2026-07-18). Merge `286ca02`. Reporte:
  [REPORTES/WP-U122-registry-password-auth.md](REPORTES/WP-U122-registry-password-auth.md).
  Secrets `NPM_USERNAME` + `NPM_PASSWORD` → `.npmrc` `:\_password=`;
  demolido JWT/`NPM_TOKEN`/`NODE_AUTH_TOKEN`/`registry-url` en job release;
  skip ⏳ sin secrets; contrato test pass. `npm view` ⏳ hasta ops.
  **CA:** skip path cumplido; publish real = ops post-merge.
  **Demolición:** cumplida en `release.yml`. Hallazgo: `ARQUITECTURA.md`
  §5 aún cita `NPM_TOKEN` → cola residual.

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

- (U154) **formato de bullets del backlog vs parser de proyección:** ~16
  bullets usan `**WP-XX**` (prosa) en vez de `**WP-XX · título**` que exige
  `proyectar-backlog.mjs`; no se parsean. Candidato: unificar formato del
  backlog, o esperar parser flexibilizado (Punto 4 del handoff al diseñador).
- (U153) **falso positivo regla 15:** `skills:sync` deja markdowns de
  método bajo `.claude/skills/`; watcher 0.3.1 los eleva como RESIDUO —
  feedback diseñador (excluir espejo) o no materializar espejo en
  `.claude/` (solo `node_modules`)
- (U153) huérfanos FS `.worktrees/wp-u12|u23|u89-*` sin registro git
  (basura preexistente) — higiene residual
- ~~Viewer fabrica peer-card local (cara ciega / residual U93) — firma SSB vs
  micro «visor pide card»~~ — **CERRADO** (GO-4 · **D-40**): firma del
  conector = «visor pide card»; SSB = extensión U93 diferida.
- `ZEUS_STOP_SERVICES` / stop targets pozo·solve (residual U109 / presets)
- Harness U100 cid hex → formato SSB `&…sha256` (live diferido D-22)
- CRLF `spec-sync` / `types-sync` Windows; dual-emit `arg:*`; flake e2e DJ
- (U102) `resolveStopServicePorts` switch→tabla; fixture firehose duplicada;
  linea-system fixture mínima; `ZEUS_SCRIPTORIUM_ROOM` en room-client
- (U114) env sibling library sin link `@zeus/startpack-kit` (ops/link)
- (U121) scrub `README.md` raíz library (WP-U/D-#/file: temporal) — fuera
  del portal VitePress; coherencia repo↔portal
- (U120) links blob en `docs/guide/estado.md` → **WP-U129 ✅**; scrub README
  raíz zeus (misma clase) queda residual
- (U126) workflow `release-startpack` solo `delta|pozo` en dispatch; Notario
  también sketch/solve-coagula/plaza — candidato micro si hace falta
- (U122) `plan/ARQUITECTURA.md` §5 aún cita `NPM_TOKEN` (gate publish ya
  es `_password` en `release.yml`)
- (U124) VitePress 1.6.4 + Windows: `docs:build` falla por case `C:`/`c:`
  tras `realpath` → candidate
  `vite: { resolve: { preserveSymlinks: true } }` en
  `docs/.vitepress/config.mjs` (no aplicar sin GO)
- (U125) nav/sidebar `solve-coagula` — **cerrado por U132 ✅**
- (U131) VitePress en worktree Windows: path largo falla dead-links; library
  no gitignorea `docs/.vitepress/cache/` (zeus sí) — candidato higiene
- (U132) C8 residual `startpacks.md:41` → **WP-U136** ✅ (D-28)
- (U138) nav API HTML SPA 404 → **WP-U138** ✅ (D-29); residual inline
  cuerpo → **WP-U139** ✅ (D-30 · cola cerrada)
- (U145) lockfile `main` desincronizado con versiones workspace (npm lo
  realineó de pasada) — candidato: regenerar/verificar lockfile en CI
- (U145) `npm audit`: 53 vulns (6 críticas) preexistentes en árbol dev —
  candidato triage
- (U145) EOL `bin/*.mjs` reescritos por `npm install` (ruido git) —
  candidato `.gitattributes` con `eol` explícito
- ~~(U145) `engines.node >=22` del paquete skills vs `>=18` del raíz~~ —
  **RESUELTO** (GO custodio · 2026-07-24): raíz elevado a
  `engines.node >=22.0.0` (alineado con skills-scriptorium 0.10.0)
- (U146) `.cursor/README.md` + `.cursor/rules/*.mdc` citan prompts
  borrados de `plan/roles/` — candidato **micro-WP U148** (repuntar
  adaptador a roles/README + paquete); conviene en el lote de merge
- (U146) prosa antigua `plan/README.md` («toma un WP… márcalo 🔶»)
  contradice protocolo (🔶 lo marca el orquestador) — costura futura
- ~~(U146) token en historial de `main`~~ — **RESUELTO** (GO usuario
  2026-07-20): reescritura local pre-push; nunca llegó a origin.
  Aclarado: era ruta local con identificador del custodio (ceguera,
  clase U140/D-32), **no** una credencial
- ~~(post-sprint4) `plan/recursos/*` untracked ensucian lint local~~ —
  **RESUELTO** (GO usuario 2026-07-20): clones retirados del disco;
  eran referencia de ola 10 ya consumida (U88/U90 ✅), 0 cambios
  locales; procedencia + re-clone en `plan/recursos/README.md`
- (U147) test permanente del sync (fixture + tmpdir) — no estaba en CA;
  candidato si se quiere blindar
- (U147) workflow anidado inerte en ejemplo `site-web` del paquete —
  arreglo pertenece a la librería (ticket ya abierto allí)
- Residuales de olas en [BACKLOG-HISTORICO.md](BACKLOG-HISTORICO.md) (colas
  por WP) — no reabrir en bloque

---

## Post-publish — demoler `file:` (GO · 2026-07-18) — ✅

Evidencia ops: `npm view @zeus/protocol` → **0.2.0** registry propio.

### WP-U55 · Demoler deps `file:` operator-ui/threejs-ui-lib — ✅

- ✅ **WP-U55 · Demoler deps `file:`** — aceptado (orquestador /
  2026-07-18). Merge tip `aa1c76d` (+ publish bridge vía Actions).
  Reporte:
  [REPORTES/WP-U55-demoler-file-deps.md](REPORTES/WP-U55-demoler-file-deps.md).
  `@zeus/operator-bridge@0.1.0` publicado; operator-ui/threejs-ui-lib
  sin `file:`; smoke registry OK.
  **CA:** cumplido. **Demolición:** `file:` en esos package.json — ✅.

### WP-U123 · Library retiro `file:` / `.deps` → registry — ✅

- ✅ **WP-U123 · Retiro puente `file:`/`.deps` en games-library** —
  aceptado (orquestador / 2026-07-18). Library merge `08da7f6` · zeus
  reporte `80019b4`. Reporte:
  [REPORTES/WP-U123-retiro-file-deps.md](REPORTES/WP-U123-retiro-file-deps.md).
  Install limpio sin `file:`; tests EXIT 0; **`.deps` = fallback DEV
  documentado** (demos/e2e mesh).
  **CA:** cumplido. **Demolición:** file: raíz + preinstall — ✅.

## Ops gated (fuera del swarm hasta tick)

- DNS / Custom domain ⏳: `z-sdk.escrivivir.co` (U106) ·
  `games.z-sdk.escrivivir.co` (U107)
- Sidecar / `ZEUS_BLOB_*` — **DIFERIDO** D-22
- Publish mesh resto (post operator-bridge) — residual

---

## Horizonte (post-refundación, no tomar aún)

- ~~**WP-U71 · VOLUMES p2p**~~ — **reencuadrado** como **U71R** en la
  ÉPICA F2 (D-45 · cerco §10.8): el ancla de contenido (git/rad/IPFS) es
  **fuente de import + procedencia inerte**, jamás dependencia de arranque.
  El transporte p2p continuo = **C-6, segundo acto de mesa** (sin WP hasta
  su especificación).
- **WP-U72 · Persistencia del estado de rooms** — snapshot/ledger → colas
  files-first (D-13).
- ~~**WP-U73 · El teatro de la capa 2 SSB**~~ — **reactivada** como
  **ÉPICA U73 · Zigurat acotada** ⬜ (D-43; ver § R13-Z arriba). El
  puente SSB L1↔L2 completo sigue dependiendo de spikes externos
  (punto de extensión D-20/U93, fuera de la épica acotada).
- **WP-U74 · Juego trenzado sobre forces** — myth-maker/debunker sobre
  U86 + U91/U92; candidata horizonte.
- **(diferido U87 §5 · sin WP)** linea-aleph vivo — DECISIONES §abiertas.
- **(diferido U87 §6 · sin WP)** skills stub network-engine — DECISIONES.
