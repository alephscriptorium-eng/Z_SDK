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
| **U252** ✅ | — | **La suite de gates MUTA EL REPO REAL y `node --test` la corre en paralelo** (hallado por el worker de U237-B3 al ver fallos intermitentes con **dos síntomas distintos**; confirmado por el orquestador al cerrar la ola 4). `test/gates/matriz-51.test.mjs` planta una pieza fantasma (`:98-112`) y **renombra fuera de sitio** `packages/mesh/blob-sync-harness/package.json` (`:137-153`). Latente hasta ahora porque **nadie observaba la ausencia de ese fichero**; la regla `licencia` de U237-B3 la hizo visible: `gates.test.mjs` corriendo en paralelo ve el manifiesto ausente y ofende. **Diagnóstico del orquestador**: cada fichero por separado 9/9, 27/27, 14/14; los tres **en serie** 50/50; **en paralelo 49/1**. Parche aplicado al cerrar la ola: `test:gates` pasa a `--test-concurrency=1` (`package.json:83`) — **serializa, no arregla**. El arreglo real es que la suite **no toque el árbol de trabajo**: enumerar desde el índice de git y aseverar contra el **estado commiteado**, que además es lo que viaja (patrón ya aplicado por U237-B3 a sus propias aserciones, `licencia.test.mjs`). Es trampa para cualquier WP futuro que afirme sobre el árbol vivo. — **Ejecutado 2026-08-01** (rama `wp/u252-gates-sin-mutar`, base `28397b8`, obra `1fdd3da`; [reporte](REPORTES/WP-U252-gates-sin-mutar.md)): **antes 49/1 · después 57/57 exit 0 sin el flag, tres corridas y `git status` a 0 líneas las tres**. Las probes (a)/(b) se montan sobre un árbol materializado desde el índice + `HEAD:`, con el propio gate copiado dentro para que su `REPO_ROOT` apunte allí y el **exit code** del CLI se siga ejercitando; parche `--test-concurrency=1` retirado. **Los CA vivos NO se mudaron** —al morir el mutador, leer el disco vuelve a ser seguro—, así que la vigilancia no se estrecha: se añade la del árbol que viaja, y se asevera que ambos dan **el mismo JSON byte a byte**. Guardián permanente `test/gates/arbol-inmutable.test.mjs` en dos mitades (estático con propagación de taint, que se pone rojo contra el fichero histórico `28397b8`; dinámico que censa mientras la suite corre en un hijo); atacado por su autor: destapó **un falso verde propio** (el hijo heredaba `NODE_TEST_CONTEXT` y salía 0 en 96 ms sin ejecutar nada) y 11 falsos positivos, ambos arreglados, y el ataque final con `fs['rename'+'Sync']` lo caza el dinámico nombrando ruta. **Ronda 2 (devolución)**: la contrarrevisión cegó **a los dos guardianes a la vez** con el idioma más corriente del repo (`import { join } from 'node:path'` sobre `plan/PUBLISH-ALLOWLIST.md`) — reproducido en verde 5/5 antes de tocar nada. Dos causas: el ancla no se propagaba por import **con nombre** de `node:path` (sí por el de `fs` — asimetría no escrita) ni por `fs.promises.*`; y el censo dinámico llamaba «conjunto de lectura» a **53 de 81** rutas. **Prueba que lo cierra: mi propio detector no cazaba los ofensores #5 y #6 de mi propio censo** (los `parte-kit`). Cerrado: `enlacesDeModulo()` resuelve espacio de nombres, nombres y alias de `node:path`/`node:url`/`node:fs`; censo desde `test/gates/conjunto-lectura.mjs`, fuente **única** compartida con la materialización; barrido estático ampliado a todo `test/gates/*.mjs`. Re-atacado con el vector literal del revisor: **rojo por las dos mitades**. Además M1 (una fuga era tautológica: sin ancla no podía girar nunca) · M2 (el hijo se lanzaba con la salida ignorada y **su código de retorno no se aseveraba**; la ventana temporal no cierra la clase porque un hijo vacuo cuesta 4-8 s **bajo carga** — ahora se exige `exit 0` y `# tests ≥ 40`) · M3 (un directorio sin rastrear provocaba un **rojo con mensaje mentiroso** culpando al arnés) · M4-M6. **Ruido medido al ampliar** a los 145 tests: 11 ofensas en 5 ficheros, 10 ciertas (= las 4 filas del censo) y 1 falsa (código dentro de una cadena). **Coste declarado**: el guardián dinámico re-ejecuta la suite, 4429 → 6140 ms (~1,4×), sin medir en CI. **Censo**: matriz-51 no era la única — quedan enrutados `test/release/release-u53.test.mjs:15,27,51` (`mkdtemp` con prefijo en la raíz del repo), los goldens self-healing de `parte-kit` sobre ficheros **rastreados** y `http-contract/test/core.test.mjs:101-112`; los tres fuera de ALCANCE_DIFF | `test:gates` verde **sin** `--test-concurrency=1` · cero mutaciones del árbol rastreado durante los tests | P1 |
| **U263** **`P0`** ✅ | **El flujo de publicación lleva su PROPIA copia de la matriz de tests, y ya divergió: publicar está ROJO desde hace dos WPs.** Hallado por el orquestador al cerrar la ola 8 (`gh api .../jobs`): `Release` falla en `test @zeus/linea-system` con `ZEUS_VOLUMES_ROOT is not set` — **el mismo fallo que U261 cerró en `ci.yml` y que `release.yml` no recibió**. Medido: `needs_volumes_root` aparece **8 veces en `ci.yml` y 0 en `release.yml`**, que tiene su matriz propia (`:47-48`). Los arreglos de U256 y U261 —el `include` y las dos guardas que impiden el verde mudo— **no llegaron ahí**. **Por qué es P0**: el flujo que falla es **el que entrega**. Y el defecto no es el fallo concreto sino **la duplicación**: dos listas de comprobaciones mantenidas a mano divergen siempre, y ésta ya lo hizo sin que nadie lo notara — la ola 8 se cerró leyendo el CI y dando el otro por bueno. **La solución ya existe y está probada en el mundo hermano**: `V_SDK` cerró el mismo problema con `scripts/verificacion-paridad.mjs`, que exige que **todo comando del flujo diario esté también en el de publicación Y antes del paso que publica** — atacada en sus dos direcciones. Portarla es la vía recomendada; unificar los dos flujos en uno reutilizable es la alternativa, con su precio. **Medir antes de elegir** — **ENTREGADO 2026-08-02** (rama `wp/u263-paridad-publicacion`, base `c241c22`, commit `518f937`; [reporte](REPORTES/WP-U263-paridad-publicacion.md)). **Estado antes, medido con el propio instrumento sobre el par commiteado**: **5 pasos** que `ci.yml` ejecuta y `release.yml` no (las 2 guardas de U256/U261, los 2 del sello de U258, el smoke TS de U158) y **5 entradas de matriz** (`linea-kit`, `volumes-ops` y las **tres** filas del `include`); sólo «quality» y «test» bloqueaban la publicación —`sello-root` y `smoke-ts-registry` **ni existían** allí—. **Vía elegida: portar `scripts/verificacion-paridad.mjs` ADAPTADO**, porque copiarlo tal cual mentiría en este repo: el original compara **números de línea** (allí `release.yml` era **un** job), y aquí son **cinco** con `needs`, donde la línea da **falso verde** (un paso en un job fuera del `needs` corre en PARALELO con la publicación) y **falso rojo** (mover el job que publica al principio no cambia nada). Así que el orden se comprueba sobre el **grafo de `needs`**. Dos reglas más que el original no necesitaba: la huella incluye el **`if:`** (copiar la guarda y apagarla con `if: false` cruzaba un cotejo de comandos) y hay **cobertura de MATRIZ**, sin la cual el instrumento era **ciego al defecto que vino a cerrar** —el comando es idéntico en los dos flujos y lo que faltaba era la FILA—. `EXCLUIDOS` **vacía**: en vez de perdonarle a la publicación los jobs que le faltaban, se le añadieron. Corre en **los dos** flujos (`ci.yml:38`, `release.yml:43`), así que la deriva se caza **al empujar**, no sólo al publicar (mejora sobre el original, que lo declaraba como límite). **Precio de la descartada (unificar con `workflow_call`)**: exige un **tercer fichero** en `.github/workflows/`, fuera de mi ALCANCE_DIFF —coste decisivo, y de proceso, no técnico—; y `on:`/`concurrency` son del llamador, así que **no** unifica los disparadores, que difieren de verdad. **Descartado como coste**: los nombres de required check, porque `main` **no está protegida** (`gh api …/protection` → 404) e inventarlo sería un coste falso. **Sigue siendo la vía correcta a medio plazo: con ella este script se borra.** **Vectores, 15 casos en verde** (`test/gates/paridad-publicacion.test.mjs`, ya cableado vía `test:gates` en los dos flujos, sin tocar `package.json`): paso ausente · paso nuevo sin traer · **guarda apagada con `if: false`** · job fuera del `needs` (da `ORDEN ROTO`, **no** `PARIDAD ROTA`) · matriz mutilada · `include` borrado (**el defecto original**) · **CRLF ≡ LF** (`core.autocrlf=true`: el operador ve CRLF y el runner LF) · y cuatro **fail-closed** a exit 2. **Que no cierra de más, aseverado**: una publicación con pasos propios añadidos sigue **verde** — la regla es de inclusión y orden, y exigir igualdad bloquearía toda publicación legítima. **Hallazgo no buscado**: `release.yml` en `HEAD` **no era YAML válido** — `'@zeus/ping-pong-bots'` seguido de **`\r\r\r\r\n`** en el objeto commiteado (`cb8b017…`), **el mismo defecto de CR sueltos que U256 limpió en `ci.yml` y nunca propagó aquí**; `ci.yml` 0 dobles-CR y parsea, `release.yml` 2 y no. La tesis del WP en su forma literal. El blob entregado parsea limpio. **El escáner, cotejado contra el parser `yaml`** (usado sólo en banco; no está declarado y no entra en la obra): 13 pasos, 27 workspaces, 3 `include`, mismo `needs` — coinciden. **La guarda de U252 se despertó y NO se desafiló**: el barrido estático de `test/gates/*.mjs` marcaba mis `writeFileSync` a temporales; bisecté hasta el mecanismo con su propia `ofensasDeFuente` y es **falso positivo suyo** (propaga el ancla **por nombre y sin ámbito**, y el literal `'ci.yml'` **contiene** un `ci` anclado entre `'` y `.`). Rodeado **cambiando mi idioma** —como U260—, sin tocar `MUTADORES` ni `scripts/gates/**`; y **demostrado que sigue afilada sobre mi fichero**: mutado para escribir de verdad sobre el árbol da **3, 1 y 1 ofensas**, y 0 tal como se entrega. **Higiene**: `lint` 0 errores (0 avisos míos) · `gates` OK (0 offenders) · `test:gates` **84/84** · los 3 rastreados de `packages/*/bin/` son el artefacto de `npm ci` con **0 inserciones/0 borrados** ya documentado en U256, y **no van en el commit** · sin `git stash`, sin `npx`, sin tocar `packages/**`, `package.json`, lockfile ni `VOLUMES/**` · `C:/S_LAB/v-sdk` **sólo leído**. **Fuera de la lista del brief, declarado**: `test/release/release-u53.test.mjs`, **una aserción** que fijaba `[quality, test]` con el corchete pegado y por tanto **prohibía añadir gates**; pasa a exigir inclusión de `quality` y `test` sin pinchar cuántos hay (la alternativa era debilitar el `needs` para que cupiera una regexp). **NO afirmo `Release` verde**: no debo empujar y `Release` sólo corre en `main` — entrego **causa cerrada y reproducida**, no CI verde. **Enrutable, mismo patrón**: `npm run test:release` **no lo ejecuta ningún flujo** y lleva un rojo preexistente (`.changeset/curated-sidecar-por-forma.md` pendiente, commiteado en `HEAD`, no mío) | `Release` verde en `main` · una divergencia entre los dos flujos **pone rojo** el gate, con vector · el flujo que publica corre lo mismo que el diario, y **antes** de publicar | **P0** |
| **U253a** ✅ | — | **Dos evasiones que ningún probe del carril D ve** (halladas por la contrarrevisión de U205, sin ofensor vivo hoy, verificadas abriendo fichero): **(1)** `resolveManifestPath()` es público (`manifest.mjs:35-37`, reexportado en `index.mjs:35`), así que `writeFileSync(resolveManifestPath(), x)` **no contiene ni el literal ni la constante** y ningún probe lo marca — es la misma ceguera que ya obligó a endurecer el probe en U205 (la ruta viajaba en una variable); **(2)** `ledger.mjs:16-20` devuelve `opts.ledgerPath` **verbatim y sin validar**, y `:43` apenda: vector concreto `importPack({…, ledger:{ledgerPath:'<root>/volumes.json'}})` **añade JSONL encima del manifiesto sellado** y nada lo impide. Territorio del carril **ACEPTADO 2026-08-02 como U253a** (rama `wp/u253-volumes-puerta-trasera`, obra `32f5ac9`, corrección `ec31477`, merge `4854a01`; CI **verde en la rama antes de fusionar**, run `30727905185`; 1 contrarrevisión con 4 bloqueantes + 10 menores). **El WP se partió en tres**: aquí el cerco; `U253b` la atomicidad de `importPack`; `U253c` el censo estático. **El brief del orquestador caducaba en dos puntos y el worker lo midió**: la cita `index.mjs:35` era la **:71**; y **el vector (2) no reproduce como estaba escrito** — sobre manifiesto sellado canónico el JSONL no llega a escribirse porque `appendOpsLedger` relee y `JSON.parse` revienta antes. Lo que sí ocurre es **peor**, y abrió `U253b`. **Vector (1) demostrado a escala de repo, no de laboratorio**: plantó un secuestrador vivo en `volumes-ops/src/` y **el censo de U205 pasó 26/26 con él dentro**; la sonda nueva lo caza por sello. **El bloqueante mayor, hallado por la contrarrevisión**: el cerco aceptaba un **flujo alterno NTFS** (`volumes.json:oculto.jsonl`) y el ledger escribía **dentro del artefacto sellado** — y **el sello sobrevive**, porque es sha256 del flujo principal, así que nada parecía roto: el asiento desaparecía del sitio donde se audita y `readOpsLedger` lo leía de vuelta sin quejarse. Un ledger paralelo invisible. **Caracterización grave**: el canal del inodo **sólo mira lo que ya existe**; contra la PRIMERA escritura no vigilaba nada. **El worker mejoró el arreglo prescrito**: puso el recorte de `basename` **el primero de todos los canales** —*«lo que hay que juzgar es el fichero sobre el que se acaba escribiendo, no la cadena que lo nombra»*— y añadió guarda propia (`ledger_path_flujo_alterno`) para el caso que el arreglo prescrito dejaba pasar (fichero base admisible con escondite detrás), **acotada a win32** porque en POSIX `:` es legítimo. Cuatro variantes de ADS denegadas, cada una con su código. **Censo de mutación: de 5 supervivientes a 8 mutantes y CERO.** Con una corrección de fondo: **el mutante M3-prima marcaba el comportamiento CORRECTO** — `..raro.jsonl` es legítimo dentro del root y el worker lo denegaba con un código que mentía; ahora se acepta, y lo que mata al mutante es la prueba en sentido contrario. *«El menor y el mutante eran la misma avería.»* **Su test 9 avalaba lo que no medía** (se titulaba «manifiesto intacto» y tenía `r.mutado` en la mano, omitiéndolo): ahora asevera `r.mutado === true`. **Una prueba suya nació inestable y NO la dejó pasar**: roja 2 de 6; reescrita y verificada en 13 ejecuciones limpias — *«una barrera que a veces ve y a veces no es peor que un hueco declarado, porque no se puede razonar sobre ella»*. **Retiró una frase suya que el ataque desmintió**: su sonda **no** es indiferente a la notación «por construcción» — le es indiferente **cómo se nombre** la ruta, no **cuándo termine** la escritura (`fs/promises.writeFile` sin `await` y `createWriteStream` la esquivan; `openSync`, `copyFileSync`, `renameSync`, `truncateSync` y `appendFileSync` **sí** los caza). **Declarados y no cerrados**: fallo abierto si `ino === 0` (sistema sin inodo, p.ej. SMB — el código está vigilado, el entorno no) · symlink a fichero `⏳` por `EPERM`, **confirmado por el contrarrevisor: tampoco él pudo** · reescritura de bytes idénticos invisible, con `mtime` **descartado por medición** — y la discrepancia del número entre los dos (19/30 y 26/30) es justamente por qué el número no valía. **Precio**: `ledgerPath` ya sólo admite `.jsonl` dentro del root — más estricto que lo pedido; **cero llamantes vivos**, verificado por los dos, y es opción de **montaje**, no campo de petición: sin superficie remota. Suite del paquete 194 → 216, censo del repo 27/27. Gate tras merge: **OK, 0 offenders** | probe que ancla la **operación** ✓ (3 notaciones + secuestrador vivo a escala de repo) · `ledgerPath` validado contra el cerco ✓ (por los dos lados y desde la primera escritura) | P1 |
| **U253b** ✅ | — | **Una importacion puede morir DESPUES de haber tocado el catalogo, y salir por la puerta equivocada** (hallado por la contrarrevision de U253, medido en cuatro filas). `import.mjs:736` llama `appendOpsLedger` **sin envolver**, despues de `sealManifest` (`:700`) y de la fusion. Con un `ledgerPath` denegado, `importPack` **lanza sin devolver `{ok}`**, con el manifiesto **ya resellado** y el corpus **ya aterrizado**, y **sin asiento de ledger**. Es exactamente lo que U255 existe para impedir: `import.mjs:35-58` dice **NOTHING LANDS HALFWAY** y era una frase. **Dos de las cuatro filas medidas funcionaban antes de U253** (salian `ok:true` con su asiento): el endurecimiento del cerco las convirtio en excepcion post-mutacion. **Regresion de U253, arreglo deliberadamente NO suyo** — meterlo en un WP de rutas obliga a razonar rollback de fusion; es linaje de U255. Coste estimado por el revisor: **una linea** — validar `ledgerOpts` al principio de `importPack`, antes de VERIFICAR, y devolver `{ok:false, step:'precondicion-ledger'}`. Con eso, el estrechamiento de `ledgerPath` deja de necesitar ser configurable ✅ **ACEPTADO 2026-08-02** (obra `0538af2`, corrección `515db90`, merge `714a18d`; CI **verde en la rama antes de fusionar**; 1 contrarrevisión con 4 bloqueantes + 7 menores). **El brief decía cuatro filas y enumeraba tres: el worker midió SEIS**, y tras la devolución **ocho entradas cubriendo los seis códigos** que el cerco sabe emitir. **El arreglo es de ORDEN, no de rutas**: `ledger-cerco.mjs` y `ledger.mjs` con **cero cambios** — la ruta se juzga como precondición antes de VERIFICAR → `{ok:false, step:'precondicion-ledger'}`. **Evidencia con hash del ÁRBOL ENTERO** (tipo + sha256 por fichero), no inspección: las filas pasan de árbol distinto a **árbol idéntico** con `steps: []`; y el revisor lo re-midió con **huella más fuerte** (añade modo y destino de enlace) — siguen idénticas, y **cero residuos fuera del root**. **Dos residuos que la precondición sola NO cubría, hallados por él**: `ledger_ilegible` (una línea corrupta revienta la relectura **sobre la ruta por defecto, sin proponer nada**) y `ledger_en_ruta_de_fusion` (ruta admisible que **la propia fusión sepulta**) — y **su primera versión miraba los `to` del plan y dejaba escapar el vector entero**, porque un volumen nuevo viaja como un solo rename de directorio; corregido a comparar contra **los ficheros que aterrizan**. **Tres bloqueantes propios, cerrados**: `ledgerPath` leído **dos veces** — la clase que `ledger.mjs:28-31` decía haber cerrado y él reabría un nivel más arriba · la guarda de fusión no miraba **ancestros**, y su comentario declaraba el conjunto cerrado en «DOS formas y ninguna más» **mientras el vector que faltaba vivía dentro de la zona que su propio control bendice** · y un `catch` mudo que desactivaba **las dos** guardas. Cuatro mutantes supervivientes, muertos. **LO QUE NO CIERRA, y es el reencuadre del WP** (de la contrarrevisión, escrito por el worker **en la cabecera de `import.mjs`**, no sólo en el reporte): *«es **una sola decisión aplazada** —qué hacer cuando el fallo sólo es conocible **después** de FUSIONAR— y **no se esquiva con más precondiciones**»*. **El WP cierra la familia conocible ANTES de fusionar** → `U253b` ✓; la de después → **`U268`**, con cuatro vectores que el worker midió él mismo para que la ficha nazca con evidencia propia. El cuarto es el que su censo **no podía ver porque contaba excepciones**: un `{ok:false, step:'no-link'}` **legítimo por contrato** emitido después de fusionar y sellar. **Higiene ejemplar**: sus tres guiones de medición **no entran en el diff a propósito** — el censo de U205 los habría marcado, y una entrada de allowlist para un andamio de usar y tirar habría sido **relajar el censo para acomodar su propio andamiaje**. Suite `volumes-ops` 216 → **240**; censo U205 **26/26** con `import.mjs` sin marcar; gate tras merge **OK, 0 offenders** | ninguna entrada denegada llega a mutar el root ✓ (**para lo conocible antes de fusionar**; lo de después, declarado y enrutado a `U268`) · `importPack` sale por su contrato o deja el root como lo encontró ✓ (árbol idéntico, hash del árbol entero) | **P0** |
| **U253c** ✅ | — | **El censo estatico sigue ciego, y necesita DOS cambios, no la linea que se propuso** (de U253 y su contrarrevision). El censo vive en `ssb-system/test/export.test.mjs` y no ve `resolveManifestPath()`: la propuesta `|resolveManifestPath` en `:397` caza tres de los cuatro ofensores **y no el cuarto** (composicion de cadena), **y ademas** `PRIMITIVAS_DE_ESCRITURA` **no incluye `fs/promises`**, asi que un `writeFile` asincrono es invisible aunque escriba el token. **Y el hallazgo que reabre lo que dabamos por cerrado**: una sonda por monkey-patch de `fs` **no intercepta `import { writeFileSync }` ni `import * as fs`**; `export.mjs:114` usa `import fs from`, asi que **el probe CA-5a de U205 funciona hoy POR ACCIDENTE** — el dia que ese fichero cambie su forma de importar, se queda ciego **en silencio**. Verificado por dos agentes independientes ✅ **ACEPTADO 2026-08-02** (obra `d6a8ad1`, corrección `51735fd`, merge `88f13fb`; CI **verde en la rama antes de fusionar**, run `30735560695`; 1 contrarrevisión con 4 bloqueantes + 7 menores). **La demostración es la joya, y se sostuvo el ataque**: mutó `src/export.mjs` en disco y midió con testigo independiente — **M3, la evasión con bytes idénticos, deja CA-5a VERDE mientras el export reescribe el manifiesto en cada ejecución**. Ni un rojo en la suite heredada. El probe de U205 funcionaba **por accidente**, confirmado. **Cobertura del censo, con ofensores ejecutados como módulos reales**: heredado **1/5**, la propuesta escrita **3/5**, el suyo **5/5**. **PERO el bloqueante mayor fue el mismo accidente contra SUS instrumentos nuevos**: un mutante con `openSync`+`writeSync` —sin ninguna sentencia `import`— reescribe el manifiesto con **41/41 verde**, pasando CA-5a, la sonda nueva y la guarda nueva **a la vez**. **Y retiró su propia tesis**: *«se cierra por los dos lados»* era falso, borrado del reporte **y del docstring**. La clase real quedó renombrada a lo que es — **la lista de primitivas es una enumeración CERRADA e INCOMPLETA** — con las cinco ausentes medidas como escritoras vivas e invisibles, y un test que mide que **la sonda está igual de ciega**, con control positivo. **No se ensanchó la lista del censo, a propósito**, y midiendo encontró una razón que refuerza la acotación: envolver `openSync` **ni siquiera es gratis en la sonda** — habría que inspeccionar los flags para no anotar **lecturas**, y el export lee el manifiesto legítimamente. **Las dos listas dejan de poder divergir en silencio**: cada mitad **declara en ejecución lo que envolvió** y un test exige que coincidan (15≄15, 7≄7) y que contengan al censo — su propio docstring lo pedía y él lo estaba incumpliendo. `fs/promises` envuelto: las cuatro notaciones pasan de invisibles a anotadas. **Único cambio en `src/`: un COMENTARIO**, y es el mejor del bloque — corrige un hecho caducado (`ssb-system` **sí** declara hoy `@zeus/volumes-ops`, añadida en `4494e22`) y **deja abierta explícitamente sólo la frase que toca una decisión ajena**. Su autocrítica al hacerlo: *«ensanché la frontera para no tocar nada, que es dejar prosa falsa en pie con una excusa»*. **La frase que queda como lección del programa**, literal en tres sitios — uno de ellos **justo antes del bloque donde alguien iría a ensanchar una lista creyendo que con eso cierra algo**: > **Mientras el instrumento sea una lista de nombres, el mutante que evade la lista existirá.** Suite 27 → **47**; gate del repo tras merge **OK, 0 offenders**. ✂ **Nota de entorno, no del WP**: correr esta suite en local sale ROJO por `ERR_MODULE_NOT_FOUND: ajv` — la dep **está en el lockfile y NO en el `node_modules` de esta máquina**; el `npm ci` local está incompleto (ya declarado por dos workers). CI instala limpio y sale verde | los cuatro ofensores cazados por el censo ✓ (5/5 de los suyos) · `fs/promises` en las primitivas ✓ · el probe de U205: **su dependencia queda declarada y con guarda que enrojece** ✓ (la segunda salida de las dos que ofrecía el CA) · **y la ceguera irreducible, declarada y medida** | **P0** |
| **U264** ✅ | — | **Nada en CI puede cazar hoy un `.d.ts` corrompido** (deuda declarada por U245 y confirmada por su contrarrevisión). El gate `linea-kit/test/gate-exports-types.mjs:107-112` sólo hace `existsSync`: una declaración **vacía** o **sintácticamente rota** pasa `PASS … 50 declarations` con `EXIT=0`, mientras `tsc` sobre ese mismo paquete escupe `TS2306: not a module` / `TS1138`. Y `types:check` —lo único que compila las declaraciones— **no lo corre `npm test` ni ningún workflow** (`ci.yml:164-165` sólo `npm test -w`). **No se cerró en U245 a propósito**: dar parser al gate le mete dependencia de `typescript` contra su diseño de cero dependencias y contra la prohibición de tocar el lockfile; y cablear `types:check` exige `ci.yml`, fuera de su alcance. Vía propuesta por el worker: `typescript` como devDependency del paquete + `test/types.test.mjs` bajo `node --test`, con lo que la matriz de CI lo cubriría sin tocar el workflow ✅ **ACEPTADO 2026-08-02** (obra `596addb`, correcciones `4693b68`+`d143b25`, merge `b693195`; **CI verde en la rama antes de fusionar y verde en el commit de merge** — con eso se cierra la **CA-3, que el worker dejó en ⏳ por no poder empujar**, y la cerró el orquestador, no él; 1 contrarrevisión con **1 bloqueante + 4 menores**). **EL HALLAZGO QUE NADIE PIDIÓ, Y ES EL VALOR DE LA FICHA**: cablear `types/check.mjs` a CI **tal y como estaba** habría metido **13 negativos vacíos**. Bajo un árbol de `npm ci` de verdad, los 13 `must-fail` de U245 salían `PASS … rejected` **por los 84 `@types/*` ambientales del monorepo**, no por las declaraciones que decían estar probando. Es decir: la ficha pedía cablear un instrumento que **habría pasado a verde por la razón equivocada 13 veces**. **La deuda, re-medida antes de tocar nada**: `EXIT=0` en el gate y `EXIT=2` en `tsc` **sobre el mismo árbol**, con la declaración vacía y con la rota. Y `types:check` **no existía como script** — U245 lo había retirado del manifiesto; **nada llamaba a `check.mjs`**. **Corrigió el número de la propia ficha con dato**: el BACKLOG citaba `TS1138`; con su corte sale `TS1010`/`TS1005`, **y el test asevera la familia `TS1xxx` —gramática— y no el número exacto**, que es lo correcto. **EL BLOQUEANTE: la cita que sostenía el hallazgo mayor era falsa.** `check.mjs` y el reporte atribuían los 181 errores a `@types/d3-array`. Medido: **180 de 36 ficheros ajenos, 1 propio; el mayor es `@types/webxr` con 44 y `d3-array` aporta 2** — salía impreso sólo porque **ordena primero**. **El total era correcto; la atribución no.** La causa real son los 84 ambientales bajo `--lib ES2022` sin DOM. **Y los cuatro menores son de la misma familia**: el filtro comparába **por subcadena de la línea entera** y ahora **parsea la posición del diagnóstico**, exigiendo que **todos** los errores sean atribuibles al objetivo por **dos vías que ambas hacen falta** (la vacía se informa en la posición de quien la importa; la rota, en la suya) · la aserción CA5 acoplaba los vectores al paquete real y **enrojecía culpando al gate de algo que no había hecho**: ahora compara contra la línea base del propio gate sobre copia intacta · el centinela `__sin-tipos-ambientales__` **aseverado en los dos ficheros**, porque un `mkdir` ajeno **revertía el mecanismo al estado vacuo en silencio**. **La segunda corrección cierra un hueco que ÉL MISMO destapó al acotar su frase**, y la contrarrevisión exigió el vector con la regla del programa — *un guardián sin negativo no está verificado*: `rota-con-nota.d.ts.vector` es el único de los cuatro que cae sobre las 19 del comodín, **conserva el docblock entero y bien cerrado** (o sea que la pierna J queda satisfecha **de verdad y no por accidente**) y rompe el código de debajo. Verificado **en las dos direcciones**: sin inyectar enrojece con su causa; borrándole la nota, la pierna J **sí** dispara. La ceguera medida es exactamente *«J satisfecha y aún así no lo ve»*. **Y separó en el reporte quién midió qué**, sin apropiárselo: de los 13 negativos vacíos él demostró **1**, la pierna entera era del revisor; los dos mecanismos en las dos direcciones, él midió **una**; y su justificación estaba **infra-declarada** — el probe sostiene **25 de 50 declaraciones**, la mitad de la superficie, no un caso. `typescript` entra como devDependency del paquete y el chequeo corre bajo `node --test`, o sea **por la vía que CI ya ejecuta**, sin flujo nuevo | una declaración vacía y una rota enrojecen CI ✓ (**verde en `b693195`, medido, no prometido**) · las dos con vector guardado ✓ (**cuatro vectores, uno por forma; entre las dos comprobaciones las 50 declaraciones quedan cubiertas**) · los 13 `must-fail` corren en CI ✓ **y se descubrió que los 13 eran vacíos antes de cablearlos** — la ficha habría comprado 13 falsos verdes | P1 |
| **U265** ✅ | — | **El gate de la matriz publica `tipo: MCP` para cuatro interfaces sin superficie MCP, y es ciego a su propia mentira** (hallado por U181 y su contrarrevisión; **enrutado a `U233`, que está CERRADO** — ficha propia abierta por el orquestador el 2026-08-02, ver ✂ abajo). `scripts/gates/matriz-51.mjs:472-474` hace `if (entrada) { tipo = 'MCP' }` con **precedencia máxima** sobre la rama `UI` de `:478`; y `:578` escribe siempre `/mcp/health` **ignorando `entry.healthPath`**. Son **el mismo `if`**, y por eso van juntos. MEDIDO restaurando el `catalog.mjs` previo a U181: filas `tipo: MCP` **12 → 16** y `/mcp/health` **12 → 16**, con el gate dando `OK — 51/51 · 0 fallos` **en los dos estados**. Contradice además a `mcp-launcher/test/catalog.test.mjs:198-202`, que afirma que esas cuatro **no** entran en `mcp.json` porque no tienen superficie MCP. **Por qué no lo cerró U181**: el `health` es una línea, pero el `tipo` exige que `parseSeedEntries` (`:233`) lea `kind`, que **hoy ni parsea**. Arrastra `plan/MATRIZ-RUNTIME-51.md:91,97,112,113`, que dicen «grep → 0» y hoy dan 1 (= **1 entrada**, 4 líneas) sin que ningún gate vea la caducidad, porque `parseContraste` (`:355-386`) sólo extrae nombres ✅ **ACEPTADO 2026-08-02** (obra `1d01d00`, reporte `bedab4d`, corrección `f388e12`+`cca7a21`, merge `174f724`; CI **verde en la rama antes de fusionar**, run `30740958526`; 1 contrarrevisión con 2 bloqueantes + 11 menores). **El worker corrigió el brief AL ALZA en dos sitios**: las entradas mal tipadas eran **7 y no 4** — tres ya mentían **desde U234**, o sea que el defecto es anterior a U181, que sólo lo ensanchó de 3 a 7 — y las filas caducadas del documento eran **9 y no 4**. **Antes/después**: `tipo: MCP` **16 → 9**, `/mcp/health` **16 → 9**, `/health` **0 → 7**, `UI` **2 → 8**; denominador **51/51 intacto**. El revisor lo reprodujo con `git archive` de las dos revisiones y midió **celda a celda**: cambian 67 celdas pero **sólo 7 filas cambian de tipo, y son las 7 mal tipadas**. **Cero regresiones.** **EL BLOQUEANTE, y es de manual**: la rama que demuestra que «la ceguera está cerrada» **no la ejercitaba ningún test** — se neutraliza, la suite sigue **25/25 verde**, y el gate **vuelve exactamente a la ceguera que esta ficha existía para cerrar**. Lo único que la sostenía era **una medida a mano del reporte**: *un grep de una vez*, que es literalmente lo que `MATRIZ-RUNTIME-51.md:36` prohíbe tres párrafos más arriba. Cerrado con **7 tests** (25 → 32) de unidad sobre la función ya exportada, **sin mover una línea del gate ni una cifra**. **Y una aritmética que se autorrefutaba en el documento publicado**: atribuía las nueve celdas a tres orígenes que sumaban **ocho**. `git log -S` demostró que uno aportó **cuatro y no tres** — `4+1+4 = 9`, y `44 − 9 = 35`, que es justo su cifra corregida. **Hizo más de lo pedido donde importaba**: en la pieza mixta no se limitó a corregir el comentario falso, **cerró el agujero** (se denuncia incondicionalmente, diga lo que diga el contraste); y **retiró una cifra por falsa en vez de dejarla fechada** — `disco 24/51` no se reproduce hoy por ninguna de las cinco lecturas del criterio, y elegir una entre cinco sería inventarla. **La asimetría que justifica los dos oráculos, escrita por fin** (la halló el revisor, no él): `health-vs-healthpath` es **ciego** a un defecto dentro de `healthDe`, porque derivación y comprobación **comparten esa función**, y lo salva el contraste. **No se endureció el parse de `healthPath: ''`**, a propósito: divergiría del runtime; la diferencia va a la **evidencia**, no al valor. Fallo abierto de clave duplicada **declarado** con su mitigación real (`no-dupe-keys` en CI) y el aviso de qué pasa si esa regla se relaja. Vector vendorizado con **suelo (9 y 7) y huella `sha256` de sus datos**; `matriz-51.test.mjs` **32/32**, `test/gates` **100/100**, `catalog.mjs` intacto. Tras merge: `gates: OK (0 offenders)` y **`matriz-51: OK — 51/51 · 0 fallos`** | `tipo` y `healthPath` derivados de `kind` ✓ · las 7 entradas con su tipo real ✓ · el gate **enrojece** contra el estado de ayer ✓ (23 = 9 + 14, cifra literal reproducida por el revisor) · documento re-medido al anotar ✓ (y una cifra **retirada por falsa** en vez de fechada) | **P0** |
| **U266** ⬜ | — | **El catálogo puede anunciar un puerto donde no hay nadie escuchando** (hallado por la contrarrevisión de U181; **enrutado a `U227`, que está CERRADO** — ficha propia, 2026-08-02). `presets-sdk/src/env/index.mjs:169-175` (`Number(raw)` + `Number.isFinite`) acepta `0`, `-1`, `65536`, `3.5`, `0x10`→16, `"  "`→0 y `"03012"`→3012. MEDIDO punta a punta con `ZEUS_PORT_EDITOR=0`: **el catálogo anuncia `0` y el bind real cae en un puerto efímero** (56206/59282 según la corrida), health 200 en el real y `fetch failed` en el anunciado. Es exactamente el defecto que U181 vino a cerrar, entrando por la puerta del valor mal formado. **Atenuante**: falla ruidosamente, no da falso verde. **Y dos hechos que hoy no están declarados en ningún sitio**: con `.env` y variable de proceso a la vez **gana el proceso** (dotenv sin `override`, medido: `.env=14012` + proceso `15012` → 15012), y **ceros a la izquierda y espacios cuelan** | un puerto mal formado **falla al arrancar**, no se anuncia · la precedencia `.env` vs proceso **escrita** donde se lea · vectores de los siete valores medidos | P1 |
| **U267** ✅ | — | **El intermitente histórico, con nombre y mecanismo determinista** (diagnosticado por U181 y **resuelto** por su contrarrevisión; **enrutado a `U234`, que está CERRADO** — ficha propia, 2026-08-02). Es `mcp-launcher/test/intentional-stops-read.test.mjs:101`, `intentionalStops: crash without stop ≠ intentional`. Causa: **puertos fijos** `PORT_A=19121` / `PORT_B=19122` (`:16-17`) con `healthTimeoutMs: 10_000` (`:104`). Reproducido **de forma determinista** ocupando `127.0.0.1:19121`: caen **las dos** pruebas del fichero con `Health check failed after launch … "port":19121,"ok":false,"error":"timeout"`. En máquina limpia: 10/10 pasadas de suite completa y 15/15 aisladas, todas verdes. Muerde por TIME_WAIT tras trasiego de puertos, hijo de fixture filtrado, o paralelismo en CI. Arreglo conocido: `port: 0` + `server.address().port`, **como ya hacen los paquetes hermanos** ✅ **ACEPTADO 2026-08-02** (obra `1fcf6db`, reporte `6047948`, merge `f43d356`; CI verde; **contrarrevisión sin bloqueantes** — la 5.ª de ~57 que pasa a la primera). **El intermitente que arrastrábamos sin nombre tiene número y ya no vuelve por la puerta por la que entraba.** Seis ficheros del launcher ataban puertos escritos a mano (19111/12, 19121/22, 19131/32, 13050/51, 14121/22 y el bloque 19861-66) y ahora piden puerto al SO. **La medida es simétrica y por eso convence**: con **los 16 puertos antes fijos ocupados a la vez en IPv4 Y en IPv6**, la suite entera sigue verde; **antes, ocupar UNO SOLO —el 19121— tumbaba las dos pruebas del fichero**. Determinismo: **12/12** pasadas de suite completa, **15/15** aisladas, **0/8** rondas en paralelo frente a **2/8 con el código de HEAD**. **Cero `src/` tocado.** **LA CA-5 EJERCIDA COMO MANDA LA REGLA DEL PROGRAMA**: desactivó su guardián **una aserción a una**, plantando SU regresión concreta, y comprobó que cae **esa y sólo esa** (5/5, con base y restauración a `exit=0` y ficheros repuestos **byte a byte, sin `git` y sin `stash`**). **Y la aserción #5 es la que justifica el diseño entero**: los seis ficheros **no tenían un `listen(19121)` visible** — tenían `const PORT_A = 19121` **a cien líneas del bind**. *Una guardia que sólo mirase `listen(` no habría visto nada de lo que arregló hoy.* **Alcance de la guardia declarado en su cabecera, no deducido**: defiende contra la **regresión distraída**, no contra un contribuyente hostil — no caza `String(19000+121)`, ni un puerto que llegue en variable, ni un `.env`; cerrarlo del todo exige AST. Y **evitó dos falsos positivos a propósito** (`assert.rejects` que nunca spawnea, `ProcessManager` que jamás lanza), *porque una guardia ruidosa se desactiva sola*. **EL CENSO ES LA OTRA MITAD Y TRAE DENOMINADOR**: quedan **16 de 239** ficheros de test con puerto fijo en 10 paquetes, **13 de 29** guiones `e2e/` y **1 fixture**, listados uno a uno. **Y destapa cinco colisiones que no son hipótesis sino el mismo número escrito en dos sitios** (19121/22 cerrada — era el intermitente; 14121/22 y 13050 a medias, cierra su lado; 14111/12 y 13004 **abiertas**). **LA RAZÓN DE FONDO, y es reutilizable**: `scripts/gates/scan.mjs:88-101` **exime `/test/` por diseño**, así que **los 22 ficheros eran invisibles al gate por construcción** y lo siguen siendo los 16 que quedan. No tocó el gate — es `src/` ajeno — y lo deja **como recomendación fechada, no como hallazgo cerrado**. **Declaró un roce que nadie le habría visto**: `npm ci` reescribió con LF tres `bin/*.mjs`, uno de ellos **`linea-kit`, territorio prohibido por su brief**. Contenido idéntico (`git hash-object` == `HEAD:<f>` en los tres, `--numstat` vacío) y restaurados con `git checkout --` sobre esos caminos exactos. *«Lo escribo porque un roce con `linea-kit`, aunque sea de saltos de línea y aunque esté deshecho, lo tiene que ver quien acepta.»* **Límites, y uno importa al aceptar**: `linea-launch.test.mjs` **no se ejecutó** — su `skip` preexistente lo apaga sin `VOLUMES/DISK_02/LINEAS/espana`; su cambio está verificado **por lectura y por la guardia, no por ejecución**, y es el único de los seis así · la ventana no-atómica del reservador sigue abierta y cerrarla exige tocar `ProcessManager` (`src/`) · **una sola máquina, un solo SO**: el 2/8 es de Windows y en un CI con más contención sería **peor, que es argumento A FAVOR del arreglo** | cero puertos fijos en tests de arranque ✓ (los seis del launcher; **los otros 16 censados con denominador, no descubiertos**) · el vector del puerto ocupado deja de tumbar la suite ✓ (**los 16 a la vez, IPv4 e IPv6**) · censo de los demás ✓ (**16/239 + 13/29 + 1**, uno a uno, con las 5 colisiones y **por qué el gate nunca los vio**) | **P1** |
| **U268** ✅ | — | **La decision aplazada: que hacer cuando el fallo solo es conocible DESPUES de fusionar** (nace de la contrarrevision de U253b, que lo cierra con la frase que reencuadra el problema: *«B1, C2 y las filas 8-10 son **una sola decision aplazada** —que hacer cuando el fallo solo es conocible despues de FUSIONAR— y **no se esquiva con mas precondiciones**»*). **U253b cierra la familia conocible ANTES de fusionar. Esta ficha es la de despues, y NO es una linea de codigo: es contrato.** **Cuatro entradas medidas, todas con corpus aterrizado, manifiesto resellado y cero asiento:** **(1)** `.ops-ledger.jsonl` de **solo lectura en la ruta POR DEFECTO** — `import.mjs:250-263` **lee** el ledger y **nunca comprueba que se pueda escribir**; sin ruta propuesta, sin getters, sin NTFS: `attrib +R` y `EPERM` con el root ya mutado. **Es el defecto del enunciado de U253b entrando por la puerta que no proponia nada.** **(2)** `syncVolumeCounters` (`:828`) con `volumes.state.json` en solo lectura. **(3)** el `walkTree` de NO-LINK (`:853`) con un subdirectorio del volumen sin permiso de listado. **(4)** y la peor forma posible: el `rmSync` del `finally` (`:897`) — un `EBUSY` **SUSTITUYE a un `return` de EXITO**, asi que **un import completado queda indistinguible de uno fallido** y el asiento ya esta escrito. Ademas, **medio-aterrizaje SIN excepcion**: `:856` devuelve `{ok:false, step:'no-link'}` **despues** de fusionar y sellar — cumple la letra del contrato y rompe *«Every failure leaves the root intact»*. **Las dos salidas honestas, y hay que elegir una con argumento**: (a) `deshacerFusion` de U255 —legitimo ahi— para revertir; (b) **declarar el medio-aterrizaje en el contrato**, con un `step` que lo nombre y un modo de recuperacion documentado. Una sonda de escribibilidad **no vale**: tendria que tocar el root antes de VERIFICAR y rompe la CA de byte-a-byte de U253a. **Precedente que obliga**: `import.mjs:35-58` promete **NOTHING LANDS HALFWAY** desde U255, y hoy es una frase para esta familia ✅ **ACEPTADO 2026-08-02** (obra `6c124e3`+`7cf0168`, devolución `d608b3c`, corrección de plataforma `01e5317`, merge `68cda6f`; **CI verde en la rama antes de fusionar** y verde en el commit de merge; 1 contrarrevisión con **2 bloqueantes + 4 menores**, más un rojo de CI. **La ficha pedía elegir entre (a) revertir y (b) declarar; el worker eligió (b) con una mezcla dicha**: se revierte **sólo cuando se PRUEBA que el sello no se ha movido — leyendo el sello del DISCO, no suponiéndolo por la fase** — y se declara en todo lo demás. **Y la causa de fondo no era de guardas sino de ORDEN**: entre `sealManifest` y `appendOpsLedger` corrían tres operaciones que podían lanzar y dejar el manifiesto sellado sin asiento. Movidas detrás del asiento, **cuatro de las seis entradas dejan de dejar el root sin arrancar** (E2, E3, E5 pasan de «no arranca» a «sí»). **Las entradas medidas fueron OCHO, no cuatro**: las 4 de la ficha, la quinta sin excepción, la de `sealManifest`, **y dos que nació el propio bloqueante** — sello ya movido, y sello escrito a medias por disco lleno. **EL BLOQUEANTE B1, y es el peor tipo que existe: la corrección DESTRUÍA DATOS y declaraba lo contrario.** Su tesis «revertir sólo mientras el sello no esté puesto» no estaba implementada, **estaba SUPUESTA**: `manifest.mjs` escribe en (b) y hashea en (d), así que hay una subventana en la que el sello YA cambió; el `catch` revertía sin preguntar, el corpus volvía al staging, el `finally` lo borraba, y el resultado decía `aterrizado:false, sellado:null` **mientras el manifiesto declaraba el import**. Peor que la base, que al menos dejaba los ficheros. Su propia frase al corregir: *«no estaba implementada: estaba SUPUESTA»*. **B2 era prosa**: «un PAR sin nada en medio» con tres cosas corriendo en medio. Cerrado moviendo el parte detrás del asiento **y con una red de última línea**; la frase reescrita a lo que el código hace. **Y CORRIGIÓ UNA AFIRMACIÓN SUYA DE MÁS**: había escrito que dos guardas «se sostienen entre ambas» como si el censo no aislara. **La contrarrevisión midió que cada una enrojece SOLA**; lo que necesita las dos amputaciones es **una sola conducta**, la de que la excepción llegue a escaparse. **EL ROJO DE CI, y la decisión que lo cierra vale para todo el programa**: el test asertó `EPERM` y Linux dio `EACCES`. **Rechazó ensanchar el conjunto**: *«aceptar `{EPERM, EACCES}` habría funcionado hoy y se habría roto el día de un tercer sistema — **sigue siendo una lista de constantes**, sólo que más larga. Es la misma trampa un peldaño más arriba.»* Introdujo `causaViaja(causa, donde)`, que asevera que `code`, `name` y `message` **están y no están vacíos, no CUÁLES son**; barrió 6 sitios (2 que el CI tocó, más `E3` que además arreglaba un `syscall` y `CA-3` que tenía un conjunto de 4 errnos) y **mantuvo 4 por valor a propósito**, porque son autoinyectados. **Censo de mutación de 9 amputaciones, 9/9 enrojecen** — y la #6 aisla el reorden: restaurado el orden de la base, el root **deja de arrancar**. La #5 no existiría sin la contrarrevisión. **Un enrojecimiento ajeno, tratado como toca**: el censo de U253b exigía «sin la guarda DEBE volver a lanzar», conducta que este WP elimina a propósito. **No se relajó: se re-apuntó a lo que la guarda protege** — que el root NO se toque — y se comprobó que sin ella el root sigue mutando. **U268 no vuelve redundantes las precondiciones de U253b.** **Límites declarados y no enterrados**: flujos alternos NTFS (misma ceguera que `ledger-cerco.mjs`, y el «byte a byte» del revert se afirma sobre contenido/tipo/modo/estructura, **los `mtime` no vuelven**) · cero concurrencia real — los bloqueos se plantan **desde el mismo proceso** y el `EBUSY` de un handle ajeno **no se reproduce** · `sellar_interrumpido` por el CÓMPUTO del sello **no tiene vector natural**, y por eso hay **un solo código en vez de una taxonomía inventada** · **tres fallos por INYECCIÓN** (se redirige el especificador del `import` dejando `import.mjs` byte a byte el entregado), con los tres intentos fallidos de vector natural **pegados con su salida literal**. `u268-atomicidad-post-fusion` **24/24**, paquete **262 pass / 0 fail / 2 skip preexistentes**, `gates: OK (0 offenders)` tras merge | la decisión elegida con su argumento escrito ✓ (**(b) con revert acotado y medido**, no supuesto) · las entradas declaradas en el contrato con su `step` propio y su recuperación ✓ (**8, no 4**; `step:'post-fusion'` con `aterrizado`/`sellado`/`asiento`/`recuperacion`/`causa`, y **5 recuperaciones EJECUTADAS, no descritas**) · el `finally` distinguible del éxito siempre ✓ (`limpiarStaging` no lanza nunca; rellena **por referencia** un objeto que ya viaja en el resultado) · `import.mjs` dice la verdad ✓ (cabecera reescrita; **la ficha citaba líneas de una revisión anterior a U253b, +57/+60**, y el worker lo midió en vez de adivinar) | **P0** |
| **U269** ⬜ | — | **El detector de claves necesita parseo real, no mas regex** (acotado por la contrarrevision de U231, que lo separa a proposito para que U231 no entre en carrera armamentistica). Tres formas corrientes del corpus **pasan** hoy, medidas: un valor dentro de un **array JSON** (`{"tokens": ["…"]}`) porque la comilla corta la clase del valor · un **YAML block scalar** (`api_key: |` con el valor en la linea siguiente) — y `VOLUMES/DISK_02/LINEAS/registry.yaml` **es YAML real** · y `ENV API_KEY valor` **sin `=`**, que esta dentro del corpus propio de `contexto-imagen`. **Por que va aparte**: el detector es barrido de texto crudo, y cubrir estas formas con mas expresiones regulares empeora la densidad de falsos positivos, que ya es **90 hallazgos en 1741 ficheros trackeados, todos falsos**. La via es **parsear JSON y YAML de verdad** en los formatos que lo admiten, y dejar el barrido crudo para el resto | las tres formas cazadas con parseo, no con regex · los 90 falsos positivos medidos **bajan**, y el numero se declara antes y despues · los siete falsos positivos censados en la contrarrevision de U231 como casos de contraprueba | P1 |
| **U254** ⏳ | — | **La fixture SSB del repo miente sobre la forma del dato** (hallada por U205, fijada por él como test permanente, verificada término a término por su contrarrevisión). `packages/mesh/ssb-system/fixtures/ssb-log.json` —**único material SSB del repo**— **no es un conjunto de feeds válido**: `sequence` es contador **GLOBAL** (alice `[1,2,3,5,8,10]`, bob `[4,7,9]`, carol `[6]`) y `previous` **cruza de feed 4 veces**, más 4 mensajes con `previous:null` y `sequence≠1`. Un pack con su export **no es importable** (`cadena_rota_en_pack`). Arrastra a cualquier CA que se apoye en ella. **NO MEDIDO y es la pregunta que decide el WP**: si el productor real del pub emite la secuencia **por feed o global** — no hay volcado real en el repo. Si fuera global, **la regla de cadena hay que redefinirla contra él**, no contra la fixture | fixture nueva que sí es un conjunto de feeds válido · la pregunta del productor real contestada con un volcado, no por lectura | P1 |
| **U255** ✅ | — | **`driver-lineas.mjs:152-193` carece de la guarda de ancestro bloqueante** que FIREHOSE sí añadió (`blockingAncestor`, `driver-firehose.mjs:367-375`). Hallada por la contrarrevisión de U202-B2 y **presente igual en la base** (no la introduce ningún WP de la ola 4). Vector: destino con un **fichero** donde el pack trae un **directorio** → el `mkdirSync` de la fase de aplicación lanza **EEXIST a mitad de los renames**, antes de sellar y **con el volumen a medias**. Viola el contrato del carril «todo error aborta antes del primer rename». ✎ El driver SSB de U205 **NO hereda el hueco** (medido: `destino_sin_clave` / `ruta_bloqueada_por_fichero`, árbol byte a byte idéntico, cero renames) — el que falta es el de LINEAS | destino con fichero donde el pack trae directorio → error en dry, root intacto · cero renames — **ENTREGADO 2026-08-02** (rama `wp/u255-import-a-medias`, base `c1f71b7`; [reporte](REPORTES/WP-U255-import-a-medias.md)). **El diagnóstico se reprodujo antes de tocar nada y era CIERTO**, con el camino del producto: `EEXIST` en el `mkdirSync`, **1 fichero ya renombrado**, manifiesto SIN re-sellar y **sin asiento en el ledger** — y `importPack` **LANZABA** en vez de devolver `{ok:false,step,error}`, que es la otra frase del contrato que se incumplía. **El inventario era SIETE vectores, no uno**, medidos todos por el camino del producto con el destino sha256 a sha256 antes y después: LINEAS·ancestro (`EEXIST`, 1 fichero aterrizado) · LINEAS·directorio donde el pack trae fichero (`EISDIR` en el dry) · **FORCES·el MISMO hueco** (`ENOTDIR`, **2 ficheros aterrizados** — el enunciado pedía comprobar si alguno más lo tenía, y lo tenía) · FORCES·fichero en la ruta de una unidad (`ENOTDIR` scandir) · genérico·slot de volumen que existe VACÍO (`EPERM` en Windows, legal en POSIX: divergencia de plataforma latente) · genérico·corpus con ancestro fichero (`EEXIST`) · **dos volúmenes ANIDADOS en el mismo pack** (`ENOENT`, 2 ficheros aterrizados). **Cinco de los siete dejaban el volumen a medias.** **Vía**: copiar `blockingAncestor` a LINEAS y FORCES cerraba 2 de 7 — **tres vectores no los puede ver NINGÚN driver** (el volumen sin familia no pasa por driver, el corpus tampoco, y el anidado ocurre en el bucle por volumen de `import.mjs`, que es la **deuda de U201 que `driver-firehose.mjs` declaraba por escrito «fuera del alcance de cualquier driver»** — se cierra aquí). Guarda estructural nueva sobre la LISTA ENTERA de renombrados en `src/fusion-guard.mjs`, **O(n·profundidad)** porque un plan de familia trae un movimiento por fichero; `blockingAncestor` se muda VERBATIM ahí y los **CUATRO** drivers lo importan (los cuerpos de FIREHOSE y SSB eran idénticos carácter a carácter; hay probe que falla si alguno vuelve a declarar el suyo). **Las guardas de driver NO se retiran: se completan** — dan el diagnóstico de la familia. **Dos sitios podían cerrar de más y no lo hacen, medidos**: (a) `registry.json` de FORCES es la **ÚNICA sobrescritura deliberada del carril** y una guarda «el destino no puede existir» habría roto su crecimiento incremental — se cierra DECLARÁNDOLA (`plan.overwrites`, tolerada sólo si las dos puntas son ficheros) en vez de prohibirla, con lo que la sobrescritura deja de ser un efecto de `renameSync` —que **PISA EN SILENCIO**, medido— y pasa a ser una línea del plan que se puede deshacer; (b) un slot VACÍO no es `slot_ocupado` (el contrato ya lo decía), así que se vacía antes de renombrar y las dos plataformas hacen lo mismo — con rojo que comprueba que un slot con UN fichero **sigue** siendo `slot_ocupado`. **La conducta propia de LINEAS intacta**: verde que mide divergencia REPORTADA con el fichero del destino byte a byte igual, `.md` curado descartado y byte a byte igual, y el nodo nuevo del mismo pack ATERRIZANDO. **Tercera capa, con su inventario**: lo que no se puede prever (permisos, fichero tomado por otro proceso, EXDEV, carrera) ya no deja el volumen a medias — `applyFusion` DESHACE los renombrados hechos, devuelve el fichero que un reemplazo declarado hubiera pisado (se APARTA al staging en vez de dejar que `renameSync` lo borre), retira sólo los directorios que quedan VACÍOS (`rmdirSync`, jamás `rm -r`) y **enumera en `sinDeshacer` lo que no pudo**, con probe que lo fuerza. **Suite volumes-ops 174 → 194** (192 pass, 0 fail, 2 skip de Windows); **10 de los 20 casos nuevos NO los pasa la base** (medido restaurando `src/` a HEAD y corriendo el mismo fichero). `lint` 0 errores / **18 warnings, el mismo número que la base**, `gates: OK`, `test:gates` 69/69, `e2e/local-first-ca.mjs` **7/7 con 14 vectores rojos**; linea-kit 43/43, presets-sdk 55/55, feed-kit 10/10, firehose-core 12/12, ssb-system 27/27, force-system 2/2, linea-system 3 (1 pass, 2 skip de U261). **Bytes de git, no del disco**: los 8 ficheros van a blob LF con **cero líneas mixtas** (disco−blob = nº de líneas exacto en los 5 editados) y la suite se corrió sobre **los blobs materializados** desde el índice — 194/192/0. **Sin cubrir, escrito**: permisos/bloqueos/EXDEV **no se PREVIENEN** (se deshacen, y lo que no se pueda deshacer se enumera ruta a ruta); un `kill -9` a mitad de la fusión **sigue** dejando el volumen a medias —ninguna capa lo cubre y haría falta un diario de intenciones en disco—; la ruta larga de Windows es **argumento de construcción, no medida** (el origen en staging es siempre más largo que el destino); el paso 7 NO-LINK sigue corriendo después de SELLAR (se ADELANTA el rechazo de enlaces del destino al dry en las cuatro familias, no se retira nada); `sobrescritura_imposible` es inalcanzable por orden dentro de los drivers y se conserva como última línea. **No afirmo CI verde**: la rama no se empuja. Enrutable P2: `hashTree` de `import.mjs` sigue siendo la fórmula de `hashUnitTree` en dos copias preexistentes — este WP **quita** una copia (`blockingAncestor`, de dos a una) en vez de añadir una tercera | P1 |
| **U256** ✅ | — | **Ni `linea-kit` ni `volumes-ops` corren en CI**: la matriz de `ci.yml:44-75` lista 25 workspaces y **no incluye ninguno de los dos** (verificado por dos agentes independientes). La única barrera automática de esa zona es `npm run gates`, que **no cubre lo que cubren esas suites** — constatación medida en U202-B2: de 10 vectores de ablandamiento de la curación, **el gate queda verde en 9**. Es decir: el carril de datos, que es el que toca el disco del usuario, es el menos vigilado por CI. Owner natural: el WP que ya tiene CI | los dos paquetes en la matriz · el test de curación y los del driver corriendo en CI | P1  — **Ejecutado 2026-08-01** (rama `wp/u256-ci-carril-datos`, base `846f01c`; [reporte](REPORTES/WP-U256-ci-carril-datos.md)): matriz **25 → 27** (`ci.yml:78-79`), **176 tests** (linea-kit 43 + volumes-ops 133) que hasta hoy sólo corrían si alguien se acordaba. **Listarlos no bastaba**: `linea-kit/test/forces-loader.test.mjs:56-80` resuelve el root de VOLUMES **seis** niveles arriba cuando la raíz del repo está a **cuatro**, así que en runner resuelve a `/home/runner/work/VOLUMES`, hace `console.log('skip live FORCES')` + `return` y **`node --test` lo cuenta como `pass`, no como `skip`** — un verde que no asevera nada y que **contar omitidos no destapa** (`# skipped 0`). Cerrado declarando `ZEUS_VOLUMES_ROOT` **sólo para esas dos entradas** vía `include` (`ci.yml:86-90,104`), no en el `env` común: para los 25 anteriores la variable pasaría de no-definida a definida y eso no está medido; con `include` la reciben **vacía**, y que vacía ≡ no-definida está medido en **25 de 25** (mismo exit code y mismo recuento pass/fail/skip). **Vector, no declaración**: con `bash -e -c 'npm test -w …'` —el mismo comando del step— sobre **clon nativo LF** dentro de `node:22`, romper el sello de `manifest.mjs` da **rc=1, 129/133**, y revertir vuelve a **rc=0**; un test con `assert.equal(1,2)` también **rc=1**. **Batería de 12 ablandamientos: 10 cazadas por el carril, 9 por el job dueño**; las 3 supervivientes (M01/M11/M12) están **en la misma función**, `linea-kit/src/validate.mjs::validate()`, que su propia suite nunca alimenta con un documento inválido — M01 sólo se caza **de rebote** desde `volumes-ops`. **Omitidos**: `# skipped 0` en Linux; los 2 `t.skip` de `import-ssb-driver.test.mjs:759,786` son sólo de Windows (FS insensible a la caja) y **en CI sí corren** ⇒ CI vigila más que el local. **Coste** (medianas de 5): linea-kit **1683 ms** + volumes-ops **4703 ms** = **≈6,4 s**, la mitad barata de la matriz (`protocol` 11312, `http-contract` 8382, `player-ui` **no terminó en 300 s**); reloj de pared marginal **≈0** por ser jobs paralelos, y en minutos de runner **domina `npm ci`** (213–389 s sin caché — **no medido en GH Actions**, que usa `cache: npm`). De paso: el `ci.yml` **commiteado no pasaba un parser YAML estricto** (3 bytes `CR` sueltos tras `ping-pong-bots`, `UNEXPECTED_TOKEN`); limpiados — es la única línea `-` del diff (20 inserciones, 1 borrado). **Sigue sin vigilarse**: los 3 vectores de `validate()`; el CLI publicado `zeus-linea-kit` (**ningún** test, e2e ni script lo invoca — única referencia fuera del propio fichero: `package-lock.json:39585`); y **2 de los 4 discos** (el repo sólo rastrea 15 ficheros bajo `VOLUMES/`, DISK_02 y DISK_03). **Pista declarada, no veredicto**: **7 workspaces ya listados** salen rojos o colgados en mi arnés (`3d-monitor` 15 fallos, `player-ui` timeout, …) — pero `@zeus/protocol` salía rojo por **culpa de mi arnés** (CRLF del árbol de Windows) y en clon nativo dio **40/40**, así que sin runner real no se puede atribuir: **merece su WP**. Higiene comprobada antes de acusar: las 3 líneas de `git status` son **cambio de modo 100644→100755** que hace `npm ci` en tres `bin/`, **0 insertions/0 deletions**, presentes antes de correr ningún test; las dos suites añaden **0 líneas**. Sin `git stash`, sin `npx`, sin tocar `src/**`, ningún `package.json`, ni `package-lock.json`, ni ficheros de test. **RONDA 2 (devolución)** — **retractación**: la ronda 1 declaró cuatro veces que no se podía observar un job real de GH Actions y **era falso**; `gh` estaba autenticado contra el repo desde el propio worktree. Consecuencia material: enrutaba un **WP fantasma** (7 workspaces «rojos») y usaba un techo de coste inventado. **Datos reales** (`gh run view 30702322459`, head `846f01c`): **24 de 25 jobs de test en VERDE** — 6 de los 7 «rojos» eran artefacto del banco (`player-ui` **68 s y pasa**, no timeout de 300 s). **Queda un rojo con nombre**: `@zeus/linea-system`, y falla por `ZEUS_VOLUMES_ROOT is not set` — la misma dependencia de entorno de este WP, en un workspace que **ya estaba** en la matriz; la palanca está en `include` y **no se usa a propósito** (dar la variable podría convertir el rojo en un omitido silencioso: hay que medirlo, es un WP). **Y `lint + gates` está ROJO en `main`**: `test/gates/arbol-inmutable.test.mjs:442-449` hace `git show 28397b8:…` y el commit **no existe en el runner** porque `actions/checkout@v4` clona superficial (`fetch-depth: 1`, no sobrescrito en los tres checkouts de `ci.yml`) → `fatal: invalid object name`. No es mío y no se toca; se cita porque **es la tesis de este WP: verde en local, rojo en CI** (acotado: salió success en `30697838778`, la intermitencia no está caracterizada). **Coste real, ya no estimado**: `npm ci` **con caché 48,9 s de media** (no 213-389 s del banco), paso `Test workspace` **mediana 1 s**, job completo **45-72 s**, run entero **155-234 s**; marginal **+2 jobs × ~60 s ≈ +7 %** de minutos de runner y **≈0 de reloj de pared**. **B2 · el arreglo no era observable**: si la variable no llegaba, la salida de CI era **idéntica** (mismo rc, mismo recuento, misma línea `ok 1 -`) — el entregable titular producía el mismo verde funcionara o no, que es el defecto que vino a cerrar un escalón arriba. Cerrado con una **guarda de tres `test -f`** (`ci.yml:109-120`) anclada en `matrix.workspace` —valor **original** de la matriz— y **no** en `matrix.needs_volumes_root`, para que si el `include` fallara la guarda **corra igual y se ponga roja** en vez de saltarse a sí misma; exige además `DISK_03/FORCES/registry.json`, que es **la precondición literal** de `forces-loader.test.mjs:62`. Vector en las cuatro direcciones: A llega **rc=0** · B vacía **rc=1** · C root incompleto **rc=1** · D sin guarda **indistinguible**. **M1 · el censo de verdes falsos estaba incompleto**: barridos 190 ficheros de test, hay **2 epílogos mudos** y el segundo es `validate-loader.test.mjs:193-194` —que la ronda 1 presentaba como «el hermano bueno»—; **los dos en `linea-kit`**, y la recomendación corregida es `t.skip(motivo)` en ambos, no sólo arreglar el resolvedor. **M2 · §7.2 sobre-afirmada**: era un barrido con `head -10` presentado como censo; el CLI `zeus-linea-kit` está en **README:24,43,44 y dos tutoriales publicados** (6 invocaciones `npx`) que **viajan al registry** vía `files` — no es un binario olvidado, es un CLI documentado al usuario y sin vigilancia. **M6 · el denominador**: 50 miembros, **49 con script `test`**, 27 en la matriz ⇒ **22 con tests fuera**, entre ellos **dos del propio carril**: `ssb-system` (dueño de `DISK_04/SSB` y de la fixture que U254 acusa) y `feed-kit` (escribe en el root vía sync). «25→27» no es cierre. **M3/M4/M5/M7/M8 declarados**: 7 consumidores no-test = 4 `src/` + 1 `bin/` + 2 `e2e/` (la ronda 1 mezcló cajones) · el «25 de 25» es censo de **filas**, no de poder discriminante — sólo **19** pueden alcanzar código que lee la variable (4 directos), **6 no pueden** y es cota superior · el discriminante vacía≠no-definida **sí existe** vía `dotenv@16.4.7` (`lib/main.js:325` salta toda clave ya presente; vacía **lo está**), enunciado **condicionado** porque en CI es inobservable (`.env` no rastreado) · las 3 líneas de `git status` son observación **del banco**, no verificada en runner · y con la variable, **editar `VOLUMES/DISK_02|03` a mano puede poner rojo el job** (`validate-loader.test.mjs:190-228` valida el árbol vivo y compara mtimes): es lo buscado, y acopla el job a los datos del repo | P1 |
| **U260** ✅ | — | **`lint + gates` ROJO en `main` — regresión introducida al mergear U252** (hallada por la contrarrevisión de U256 leyendo CI con `gh`, confirmada por el orquestador: `gh run view 30702322459` → 2 fallos de 27). `test/gates/arbol-inmutable.test.mjs:442-449` hace **`git show 28397b8:…`** para probar su guardián estático contra el defecto histórico real. En local el objeto existe; en el runner **`actions/checkout@v4` clona superficial** (`fetch-depth: 1`, no sobrescrito en los tres checkouts de `ci.yml`) y responde `fatal: invalid object name` → el test revienta. **Es la tesis de U256 demostrada sobre el guardián de otro WP: verde en local, rojo en CI** — y su propia contrarrevisión no lo cazó **porque corrió en local**, igual que el orquestador. ✎ Intermitencia observada y **no caracterizada**: salió `success` en un run anterior; averiguar por qué es parte del WP. Vía recomendada: **vendorizar el fichero histórico como fixture** que viaje con el repo, no `fetch-depth: 0` (paga clon completo en 27 jobs) ni omitir-con-motivo (desactiva la guarda justo donde importa) — **ENTREGADO** (`8c44fd8`, reporte `plan/REPORTES/WP-U260-gate-sin-commit-suelto.md`). **Causa confirmada término a término**, no reescrita: el runner imprime `fetch-depth: 1` en su propio log y el job muere con `# fail 1`, ese y sólo ese. **Vía: vendorizar** — `test/gates/fixtures/matriz-51-28397b8.mjs`, el blob `76003a3f…` **línea a línea entre comillas**, no como plantilla, por dos razones medidas: el auto-chequeo de fixtures (`arbol-inmutable.test.mjs:415-423`) prohíbe `import … node:fs` a principio de línea —y el histórico tiene seis—, y con `core.autocrlf` una plantilla se tragaría los CRLF **dentro** de la cadena. `ci.yml` **no tocado**. **Fidelidad comprobada, no prometida**: el test contrasta el SHA-1 con `git hash-object`, que es función del contenido y **no consulta la base de objetos**, así que vale IGUAL en el clon superficial. **Reproducido en `git clone --depth 1`**: antes, el mismo mensaje que CI (`fatal: invalid object name`, exit 1); después, **58/58, 0 omitidos, EXIT=0**, y `gates: OK (0 offenders)`. **El guardián sigue cazando**, atacado en el clon superficial: replantado el defecto histórico lo caza con sus 5 ofensas; desafilado `MUTADORES`, el test se pone rojo. ✎ **La «intermitencia» NO existía**: el `success` de `30697838778` es de `20a89f6`, donde `arbol-inmutable.test.mjs` **aún no existía** (entró en `1fdd3da`); `30702322459` es el **primer y único** run de CI que lo ha contenido. Los rojos anteriores eran el gate **two-games**, cerrado por U202-B2 — **el rojo se movió de paso, no reapareció; no hay segundo defecto**. ✎ **LÍMITE**: en clon superficial una manipulación coordinada (fixture + OID recalculado) que preserve las 5 líneas de la firma no se caza; en clon completo sí. ✎ **Falso positivo del guardián, anotado**: `^{commit}` en argumentos de `git` cuenta como subcomando que escribe (`:89-92`) — rodeado cambiando mi idioma, **no** desafilando la regla. ✎ **No afirmo CI verde**: no debo empujar, y CI sólo corre `main` porque los workers no empujan (§6.1) — cierre real tras merge. ✎ **Hermanos**: era el ÚNICO uso de un objeto no-HEAD en código ejecutable; los `git cat-file HEAD:<ruta>` de `test/gates/` son sanos en superficial (verificado). Enrutables aparte, P2: `forces-loader.test.mjs:58-64` (seis `..` caen 2 niveles por encima de la raíz ⇒ `ok` mudo) y `validate-loader.test.mjs:191-194` (mismo mecanismo, hoy acierta) | `lint + gates` verde en CI · el guardián sigue poniéndose rojo contra el defecto histórico · sin depender de que un objeto suelto sea alcanzable | **P0** |
| **U261** ✅ | — | **`test @zeus/linea-system` ROJO en `main`** — el único rojo real de los 7 que U256 sospechaba (los otros 6 eran artefacto de su banco). Causa con nombre: **`ZEUS_VOLUMES_ROOT is not set`**, `not ok 1/2`. Es **la misma dependencia de entorno que cierra U256** en un workspace que **ya estaba en la matriz**. El worker de U256 tenía la palanca en su `include` y **NO la usó a propósito**, con buen criterio: dar la variable **podría convertir el rojo en un omitido silencioso** — exactamente el defecto que U256 existe para cerrar. **Hay que medirlo antes de decidir**: si al recibir el root los 2 tests corren y aseveran, se da; si se auto-desactivan, el arreglo es otro. Aplicar la misma guarda de U256 (`test -f` sobre el root) es condición, no opción | los 2 tests **aseveran** en CI, no se omiten · guarda que impida el verde mudo · declarado qué valida y qué no — **ENTREGADO 2026-08-01** (rama `wp/u261-linea-system-ci`, base `4e155eb`, commit `86931eb`; [reporte](REPORTES/WP-U261-linea-system-ci.md)). **Diagnóstico verificado con `gh`, no heredado**: run `30708835271` (head `4e155eb`, la base misma) = **28 verdes / 1 rojo**, y el rojo es éste. **Muere en el IMPORT, no en un test**: `src/loader.mjs:28` (`DEFAULT_BASE_PATH = resolveLineasBasePath()`) resuelve el root en **tiempo de evaluación de módulo**, y los dos ficheros importan `../src/start.mjs` estáticamente ⇒ el proceso muere **antes** de que `node --test` evalúe ningún `skip`: **0 cuerpos, 0 aserciones**. La limitación ya estaba escrita en `src/start.mjs:28-34` (U206 ⑩); se confirma, no se redescubre. **LA MEDIDA ANTES DE DECIDIR, en condición de runner** (`node:22` Linux, clon superficial LF, `npm ci`, misma base): la palanca obvia —darle el root y nada más— da **`rc=0 · # pass 0 · # fail 0 · # skipped 2` ⇒ CERO aserciones**. **Se auto-desactivan**: el criterio del worker de U256 queda **medido**, no supuesto. Matiz que corrige el diagnóstico ambiental: **no** es el patrón «avisa y `return`» contado como `pass` de U256 — usan la opción `skip`, salen como `# SKIP` y `# skipped 2`, así que **contar omitidos SÍ los destaparía**; no mienten, **callan**. **Y el guardián YA se apagaba solo**: `live-volumes.mjs` envolvía todo en `catch { return false }`, colapsando «no declaraste el root» (entorno roto) y «el root no trae el corpus» (dato ausente) en la misma decisión; replicado el helper viejo, **ambos entornos rotos decidían OMITIR** ⇒ el rojo de hoy era **un accidente del orden de importación**, no el guardián funcionando. **Los 2 tests NO pueden aseverar en CI, hoy ni mañana**: exigen `lineaId: 'espana'` (`src/lineas.mjs:15,22`) y el candado de whitelist `.gitignore:18-24` sólo deja entrar a git `registry.yaml` y `demo/**` bajo DISK_02/LINEAS; `P06`/`Transfiguración carismática` no existen en ningún fixture del repo. **Vía**: (a) `requireLineasBasePath()` sin `try/catch` — root ausente o root que no es de LINEAS **lanzan**, sólo «root bueno sin espana» omite; (b) `smoke.mjs:404-426`, caso **complementario EXACTO** del omitido (corre justo cuando aquél se omite y viceversa ⇒ **el job nunca ejecuta cero cuerpos**), con **4 aserciones** sobre el root declarado y el **fail-closed nombrado** de `startAll()`, y **`t.plan(4)`** que lo pone ROJO si el cuerpo se va por una salida temprana —«4 aserciones» lo verifica el runtime, no un `console.log`—; (c) `ci.yml:101` mete el workspace en el `include` y `ci.yml:147-158` es su guarda, anclada en `matrix.workspace` (valor **original**) y **no** en `needs_volumes_root`, en **paso aparte** del de U256 porque su precondición es otra (`DISK_02/LINEAS/registry.yaml`, el fichero literal que el helper abre; exigirle `DISK_03/FORCES` sería rojo falso). **Aserciones: 0 → 4**, `rc=1 → rc=0`, `# pass 0 → # pass 1`, cuerpo al final verificado por máquina. **Vectores rojos, no declaraciones** — A nominal `rc=0` · **C** include no aplica: guarda **`rc=1`** y test **`rc=1`** · **D** root sin carril de LINEAS: guarda **`rc=1`** y test **`rc=1`** *(éste es el que el helper viejo se tragaba)* · **T** salida temprana: `plan expected 4 assertions but received 0` · **E** aparece `id:espana`: el fail-closed se aparta y **corren los dos titulares** (A/C/D en runner; T/E en banco). **PRECIO DECLARADO, sin rebaja**: los 2 tests titulares **siguen omitidos en CI para siempre** mientras el corpus viva fuera — el WP **no los enciende**, hace que su omisión **deje de ser todo lo que pasa**; el job **no valida NADA de la superficie MCP** (health, capabilities, tools, plantillas `linea://…`, puente `getResourceByUri`/`getPrompt`, 5+11 prompts, `server://card`, puerta de `execute-viaje`, caché de wikitext, mutex de POST) = las **86 aserciones** omitidas de `smoke.mjs` + la **1** de `resource-contract.test.mjs`; **valida el arranque del paquete, no el paquete**. Acopla además el job al fixture `demo` del repo. **No añadí caso a `resource-contract.test.mjs`** a propósito: lo único que puede aseverar sin corpus ya lo asevera `http-contract/test/mcp-resources.test.mjs:13` en un job verde de la misma matriz — habría sido cobertura duplicada disfrazada de nueva. **`presets-sdk` NO tocado**: el fail-closed de U200 es correcto. **No afirmo CI verde**: la rama no se empuja; el cierre real es su run. **Enrutable, mayor retorno pendiente de la zona**: `src/lineas.mjs` fija `lineaId: 'espana'` para los DOS servidores — hacerlo configurable convertiría **86 aserciones omitidas en ejecutables** contra un fixture. Higiene: lint 0 errores (ninguno en linea-system), `gates: OK`; las 3 líneas de `git status` en `bin/` de otros paquetes dan `git diff` **vacío** (suciedad de mtime de `npm ci`, comprobado antes de acusar) y **no van en el commit**; sin `git stash`, sin `npx`, sin tocar `src/**`, `VOLUMES/**`, `package.json` ni el lockfile | P1 |
| **U258** ✅ | — | **El root vivo del monorepo no está protegido por la guarda de arranque que U206 cableó.** Medido por el orquestador al aceptar U206: `VOLUMES/volumes.json` **no tiene `source.imported` ni `snapshot`** — es **anterior al contrato de import**, así que `assertVolumesRootBootable()` deja todos sus tramos de volumen en **«omitido honesto»** y **no puede detectar corrupción ahí**. Comportamiento **declarado** en la cabecera de `boot.mjs` y correcto por diseño (no se puede verificar integridad contra un sello que no existe), pero deja el hueco vivo: **el único root que el producto usa hoy pasa de largo**. Sonda del orquestador sobre copia del root de referencia: fichero de datos alterado → **arranca**; manifiesto editado a mano → **arranca**; manifiesto ausente → se niega (y eso es el fail-closed viejo de U199, no la guarda nueva). Arreglo: **sellar el root de referencia por la vía legítima** (`importPack`), o declarar por contrato que un root sin sello es no-arrancable — que es la vía dura y rompe el arranque de todo el monorepo hasta sellarlo. Decidir cuál **es parte del WP** | root de referencia sellado · la sonda de tres vectores del orquestador en ROJO sobre él · `npm run start:*` sigue arrancando — **ENTREGADO 2026-08-01** (rama `wp/u258-sellar-root-vivo`, base `822e13e`, commit `1a025b8`; [reporte](REPORTES/WP-U258-sellar-root-vivo.md)). **Diagnóstico reproducido antes de tocar nada**, con el camino del producto y los cuatro `volumeIds` cableados: los 6 vectores de dato y el del manifiesto **ARRANCAN** en los cuatro servicios; la única negativa es `manifiesto_ausente`, que es el fail-closed de U199. **Vía elegida: sellar por la vía legítima** (`importPack`), sin tocar el verificador. **Vía 1 «a secas» no bastaba y está medido**: el import sólo aporta `snapshot` en FORCES (`driver-lineas.mjs:193` no sella nada), así que **3 de los 6 vectores seguirían verdes** — `FORCES/registry.json` (fuera de toda unidad) y los dos de LINEAS. Por eso el paso SELLAR ancla también CONTENIDO: `source.imported.hashes` = sha256 por fichero **recomputado del DESTINO tras FUSIONAR**, nunca copiado de `pack.hashes` — la familia LINEAS conserva el fichero del destino cuando diverge y jamás pisa un `.md` curado, así que sellar el del pack anotaría una mentira y el root no arrancaría **por haber importado bien** (2 tests nuevos lo fijan). Leg nuevo `ficheros` en `verify.mjs`, verificado con la **misma primitiva exportada** (`sha256File`), y **omitido honesto con motivo** cuando no hay sello. **DESPUÉS, sobre los bytes del commit** (`git archive HEAD`): alterar cualquiera de los **13/13** ficheros sellados **NIEGA** el arranque al servicio dueño, y el manifiesto editado a mano lo niega a **los cuatro** (`sello_roto`). **Sin sellar: `firehose` y `ssb`** — 0 ficheros rastreados, directorio inexistente; **sellarlos los mata** (medido: `volumen[firehose]: volumen_ausente` ⇒ firehose-browser SE NIEGA), y su cobertura pasa a ser el sello del root, que **no tenían**. **Precio de la vía 2** (contrato «sin sello no arranca»): no es alternativa sino añadido —hay que sellar igual— y rompe **todo root externo** (`.env.example:71-74` manda los datos vivos fuera del monorepo) más los dos volúmenes que no pueden sellarse. **Dos ficheros fuera de ALCANCE_DIFF, declarados**: `.gitignore` (el ledger viaja RASTREADO: sin él, `ledger_ausente` deja a los cuatro servicios sin arrancar en un clon limpio — medido) y **`.gitattributes`**, que es el hallazgo caro: el repo no tenía ninguno y corre con `core.autocrlf=true`, así que el árbol de Windows llegaba en **CRLF** y el blob en **LF** (`registry.json` 864 vs 824 bytes) — **el primer sello que tomé habría puesto CI en rojo entero**, `fichero_corrupto` en los 13. Cerrado con `VOLUMES/** -text`, renormalizando y re-sellando; los 13 hashes coinciden con los bytes que entrega git y hay un test que lo vigila **por efecto**, no leyendo la config. **Producto**: 3 de 4 servicios arrancan de verdad (`startAll()`, handles cerrados); `linea-system` **falla idéntico antes y después** —`Line data not found for "espana"`, corpus que `.gitignore:26-32` prohíbe— y la guarda **pasa**: medido en las dos direcciones, no afirmado. **Escritores del manifiesto**: censo estático (CA-5c, allowlist de 6, y el script nuevo **no entra**), probe dinámico por ruta resuelta (CA-5a, 0 escrituras) y **medida directa sobre este root ya sellado**: `syncVolumeCounters` ×2 y `recordVolumeSync` dejan el manifiesto **INTACTO byte a byte** y el root arrancable. **Vigilancia**: `volumes-ops/test/sello-root-referencia.test.mjs` (9 casos: verde, cableado, **no-vacuo**, portabilidad contra el blob de git, y **21 vectores rojos**), que resuelve `VOLUMES/` desde `import.meta.url` y **falla** si el árbol no está en vez de auto-omitirse; **no puede saltarse a sí misma** (sobre copia SIN sellar: 13 fallos, exit 1). Más el job `sello-root` de `ci.yml`, fuera de la matriz, que comprueba con `git ls-files --error-unmatch` lo único que sólo un checkout demuestra: que manifiesto y ledger estén **TRACKEADOS**. **Suites**: volumes-ops 139→**148 (146 pass, 0 fail, 2 skip de Windows)**, linea-kit 43/43, ssb-system 27/27, presets-sdk 55/55, feed-kit 10/10, firehose-core 12/12, force-system 2/2; `lint` exit 0, `gates: OK`, `test:gates` 58/58, y **`e2e/local-first-ca.mjs` 7/7 con 13 vectores rojos**. **Sin cubrir, escrito**: el leg comprueba **pertenencia**, no igualdad de conjunto — deliberado y medido, porque `.gitignore:10-12` permite copias locales no rastreadas (`LINEAS/espana`, `forces/force-a..g`) y exigir igualdad dejaría a esos operadores sin arranque (verificado: ambas copias locales **ARRANCAN**); por lo mismo **no** sembré `corpora.files/bytes`. LINEAS sigue sin snapshot de unidad (**U259 no se cierra**). Higiene: los 3 `bin/` que marca `git status` tras `npm ci` dan `git diff --numstat` **vacío** (comprobado antes de acusar) y se restauraron; ninguna suite ensucia rastreados. **No afirmo CI verde**: la rama no se empuja; leído con `gh` que la base `822e13e` está en **success** (run `30711640317`), así que el rojo, si aparece, es mío. Enrutable P2: `hashTree` (`import.mjs:111-118`) y `hashUnitTree` (`driver-forces.mjs:72-78`) son la misma fórmula en dos copias preexistentes — no la empeoré, el leg nuevo usa la primitiva exportada | **P0** |
| **U259** ✅ | — | **La detección de corrupción cubre 1 de 4 familias.** Declarado por el worker de U206 sin que se le pidiera, y escrito en `verify.mjs`: sólo **FORCES** sella snapshot verificable, así que en **LINEAS y FIREHOSE** una corrupción equivalente **pasa los tres tramos** (snapshot omitido · corpora igual en `files`/`bytes` · familia = schema). Es la mitad del parque, y `GD` se abrió **declarándolo** (ver `GOBIERNO-EJECUCION-F2.md`, bloque de `GD`). Hermano menor: el paso 7 («cerco limpio») sólo se asevera sobre FORCES — el root LINEAS se barre **sin aserción** porque «0 URLs vivas» aún no distingue **procedencia registrada** de **ancla de arranque**; el interruptor `ZEUS_VOLUMES_CERCO=strict` ya existe y hoy daría 3 hallazgos sobre el root de referencia, dos de ellos legítimos | snapshot verificable en las 4 familias · corrupción detectada en cada una con su rojo · el predicado de URL viva distingue procedencia de ancla, escrito — **ENTREGADO 2026-08-01** (rama `wp/u259-sello-cuatro-familias`, base `bde9c12`; [reporte](REPORTES/WP-U259-sello-cuatro-familias.md)). **El diagnóstico se reprodujo antes de tocar nada y NO era el del enunciado**: tras U258 el hueco vivo ya no era «la corrupción pasa los tres tramos» sino **el ALTA**, y sólo FORCES lo cazaba porque su snapshot es un hash de CONJUNTO (el leg `ficheros` comprueba PERTENENCIA, lo dice él mismo). Medido sobre un root con las 4 familias CON árbol, por el camino del producto: `lineas·ALTA schema-VÁLIDA en la unidad`, `firehose·ALTA de unidad` y `ssb·ALTA de mensaje` **ARRANCABAN**. Dos causas distintas: **LINEAS no sellaba** y **FIREHOSE/SSB sellaban un cursor que nadie contrastaba** — por una tabla `SNAPSHOT_VERIFIERS` **mantenida a mano** en `verify.mjs` con una sola entrada, que es la juntura por la que las dos entraron en silencio como «omitidas». **Vía**: `snapshotOf()`/`verifySnapshot()` pasan a ser **CONTRATO del driver** (test que recorre `FAMILY_DRIVERS` y lo exige, para que no se reabra con la quinta familia); la tabla a mano desaparece; `importPack` sella **recomputando del DESTINO tras FUSIONAR** (regla de U258 con `hashes`, ahora una sola para las cuatro) y `verify.mjs` pide el verificador al driver. **Formas**: árbol-por-unidad en FORCES y LINEAS (unidad = entrada del índice: `registry.json`/`registry.yaml`), cursor O(1) por clave en FIREHOSE y SSB. **CUATRO ROJOS, uno por familia**, cada uno con su **NO VACUIDAD aseverada** (los tramos `ficheros`/`familia`/`corpora` NO ven el vector, así que el rojo es del tramo nuevo y no de rebote): `unidad_corrupta` ×2, `cursor_desviado` ×2, más `feed_desviado` **sin** `cursor_desviado` al reescribir `value.sequence` (la clave SSB es opaca: la posición de feed es la garantía central de la familia y ningún otro tramo la mira) y `indice_con_agujero` cuando el índice por clave no es completo — un cursor sobre un índice con huecos no rinde verde, doctrina D-F/D-G de los propios drivers. **Cursor EXACTO en FIREHOSE/SSB por decisión MEDIDA, no por comodidad**: un volumen sellado de esas familias **ya estaba congelado** (triage → `fichero_ausente`; crecimiento con corpora declarados → `corpus_desviado`), así que el exacto no añade clase de rotura nueva — añade la que faltaba y nombra la deriva en unidades. **Lo que NO se rompe, medido**: el alta FUERA del perímetro declarado sigue arrancando en LINEAS y FORCES (`LINEAS/espana`, `forces/force-*`, que `.gitignore`/A-15 permiten a propósito) — el perímetro es el ÍNDICE, no el directorio. **NO-OP con apagador silencioso, cerrado**: el gate decidía sólo por `packHash`, así que un root anterior al contrato respondía «ya sellado» y **nunca** anclaba el snapshot — era literalmente el root del repo. Se añade una condición **de FORMA, no de VALOR**, y la distinción evita un blanqueo: comparar valores habría hecho que un volumen CORROMPIDO dejara de ser no-op y el import re-sellara la corrupción (aseverado: con un ALTA plantada, sigue `noop:true` y el arranque sigue negándose). **Root de referencia RE-SELLADO** con `scripts/sello-root.mjs` (`moved: 0`, idempotente): LINEAS gana `snapshot {demo}` y **los dos valores de FORCES no cambian ni un carácter** — prueba por efecto de que mover el cuerpo del hash y cambiar el momento del sello no movió nada. **PREDICADO DE URL VIVA reescrito** (la otra mitad del WP), cuatro exenciones con REGLA: **I1** host parseado (vacío o `${…}`) — **estrecha** la de U206 y ahí había agujero real: `https://${TOKEN}@servidor.real/x` **estaba exenta** («empieza por `https://${`») y el literal ni se capturaba entero porque el patrón cortaba en `}`; **hoy pasa y con la regla nueva CAE**; **I2** valor completo en JSON que **coordina** un par nombre=valor con su registro (`?oldid=2` junto a `oldid: 2`) — no apunta a un servicio, apunta al MISMO objeto que el registro describe; **I3** `source.imported.origin`, heredada **sin ensanchar** (ensanchar una exención es debilitar una guarda); **I4** `.md` suelto en la RAÍZ (categoría `manifiesto_de_root` que el constructor de packs ya declara) **y** dentro de un enlace Markdown. **12 casos medidos con test**, incluidos los límites: coordenada que no casa, endpoint, URL en prosa, ancestro lejano, URL desnuda en el README, `.md` de DATOS bajo un disco, **YAML sin I2** (fallo-cerrado: sin estructura leída no hay exención) y **ledger/estado de raíz que se siguen barriendo enteros** — el alcance de U206 no se recorta. Resultado: el root de referencia queda con **0 hallazgos de cerco** y hay test de que **no es vacuo**; `ZEUS_VOLUMES_CERCO=strict` deja de ser un interruptor impulsable-en-teoría, y el **paso 7 del CA pasa de «informativo» a ASERCIÓN sobre el root LINEAS**, con rojo propio. **Bytes que entrega git, no los del disco**: el snapshot se reconstruye ENTERO desde `git ls-files` + `git show :<ruta>` (el índice, que es lo que se convierte en commit) y coincide en las 3 unidades — observador nuevo junto al de U258. **Producto**: arranque REAL (mismo fichero que `npm run start:*`, proceso aparte) contra el root sellado **y** contra una copia sin sellar — 3 de 4 arrancan en las dos caras y `linea-system` falla **idéntico** (`Line data not found for "espana"`, U261), **no por la guarda**. `firehose` y `ssb` **siguen sin sellar** por la misma razón medida de U258 (sellarlos los mata: `volumen_ausente`); lo que ganan es que sus familias **ya tienen verificador**, así que un root de operador con esos volúmenes CON árbol sí queda cubierto. **Suites**: volumes-ops 148→**174 (172 pass, 0 fail, 2 skip de Windows)**, linea-kit 43/43, ssb-system 27/27, presets-sdk 55/55, feed-kit 10/10, firehose-core 12/12, force-system 2/2, linea-system 3 (1 pass, 2 skip de U261); `lint` 0 errores / 18 warnings (**mismo número que la base**), `gates: OK`, `test:gates` 58/58, y **`e2e/local-first-ca.mjs` 7/7 con 14 vectores rojos** (eran 13). **Fuera de ALCANCE_DIFF y declarado**: `volumes-ops/README.md`, cuyas frases «el snapshot sólo lo sella FORCES» y «los binarios no se escanean» quedaban **falsas** contra el código de este árbol (la segunda ya lo era desde U206·m4). **Sin cubrir, escrito**: el alta fuera del perímetro declarado; un volumen sellado de FIREHOSE/SSB no crece sin re-importar (ya era así por otros dos tramos); el predicado **no** es a prueba de adversario (I2 se puede fabricar — mismo estatuto que el ledger) ni cubre YAML; los dos volúmenes sin árbol. **No afirmo CI verde**: la rama no se empuja. Enrutable P2: queda **una** copia de la fórmula del hash de árbol (`import.mjs`), no dos — este WP movió el cuerpo a `src/unit-tree.mjs` en vez de añadir una tercera; unificar la última exige medir el caso de los enlaces | **P1** |
| **U257** ✅ | — | **`GateRule` desincronizado** entre `scripts/gates/scan.mjs:32` (**7** alternativas, tras el alta de `licencia`) y `scripts/gates/exceptions.mjs:16` (**6**). Confirmado por la contrarrevisión de U237-B3 y declarado por su worker como deuda, no descuido. Hoy **inocuo** —no hay `tsconfig` en raíz ni typecheck en CI que lo muerda—, pero es exactamente la clase de desfase que muerde el día que se añade el typecheck. Arreglo: `GateRule` a **módulo único** del que importen los dos — **Ejecutado 2026-08-01** (rama `wp/u257-gaterule-modulo-unico`, base `bde9c12`): eran **cuatro** copias, no dos (el typedef de `scan.mjs:33` —la cita del BACKLOG decía `:32`, que está en blanco—, el literal de `byRule` en `runAllGates`, el typedef de `exceptions.mjs:16` **y la prosa de su cabecera**, `:11`, que ningún typecheck habría mirado nunca). Aguantaron dos altas de regla (`11bb3fd`, `bd02d70`) y se partieron en la tercera (`e7a608d`, alta de `licencia` sólo en `scan.mjs`). Lista única en `scripts/gates/reglas.mjs`; los dos consumidores delegan con `import('./reglas.mjs').GateRule` y `byRule` se deriva de `GATE_RULES`. Guardián `test/gates/reglas-unicas.test.mjs` (11 tests): ata unión↔array en orden, barre `scripts/gates/**` y `test/gates/**` contra los cuatro disfraces de la lista —incluido este mismo fichero—, y ata los extremos (claves vivas de `byRule` · todo `rule:` emitido o invocado). **Equivalencia medida**: `gates` 0 offenders antes y después; con `EXCEPTIONS` vaciada en runtime, **94 ofensas crudas idénticas** (huella `c67cdd7220d4af0e`, 33 rutas); 38 excepciones y 31+1 exports sin cambios; `test:gates` **58/58 → 69/69**; `lint` 0 errores. **7 ataques**: 6 rojos y **1 fuga real cerrada** (delegar a un módulo fuera del barrido daba 11/11 en verde con la lista otra vez partida). Gemelos hallados y **no tocados**: `SKIP_DIRS` triple y **ya divergido** (`scan.mjs:23-32` 8 entradas sin `.angular` vs `matriz-51.mjs:67-77` y `conjunto-lectura.mjs:42-45` con 9) · `REPO_ROOT` ×3 · escape de regex ×2 · terna MCP ×3 · exentos de ruta ×6/×3 en `scan.mjs`. Reporte: `plan/REPORTES/WP-U257-gaterule-modulo-unico.md` | una sola definición · añadir una regla obliga a tocar un solo sitio | P2 |
| **U202-B2** ✅ | — | **`npm run gates` en rojo desde antes de la ola 3** (hallado por U180) — **Ejecutado 2026-08-01** (rama `wp/u202b2-gates-twogames`, base `87bd93f`): `gates: FAIL (3 offender(s))` → **`gates: OK (0 offenders)` EXIT 0**, `test:gates` **22/23 → 23/23** (el que fallaba era `gates.test.mjs:34`, «CA verde: runAllGates limpio»). **Atribución corregida**: la ficha decía «introducidos por `ca698d0`» y era falsa para 2 de los 3 — `git show ca698d0 --stat` lista 6 ficheros y **ninguno es `curation.mjs`**; `git blame` pone `curation.mjs:56` y `:68` en **`b051991a`** (padre de `ca698d0`) y sólo `driver-lineas.mjs:21` en **`ca698d03`**. Mismo WP (U202), dos commits: **`b051991a` 2/3 + `ca698d03` 1/3**. El error venía arrastrado de `WP-U180-catalogo-ola1.md:327`. Arreglo por **forma, no por excepción**: `isCuratedSidecarPath` pasa a `base.endsWith('.md')` — **ensanche estricto** (ninguna ruta protegida deja de estarlo), siguiendo el precedente del propio paquete (`loader.mjs:361` «Avoids hardcoding game-named filenames in engine code»). `exceptions.mjs` y `scan.mjs` **intactos**. Hallazgo de paso: el predicado **no decide si se pisa** — `merge` nunca mueve sobre un fichero existente, sólo elige el cajón del reporte (probado sobre el driver real). Suites: linea-kit 36/36 → **40/40**, volumes-ops **56/56** con 0 ediciones de sus tests | `npm run gates` verde · offenders 0 | P1 |
| U181 ✅ | 03 | Catálogo ola 2 (UIs) | `editor-ui`, `player-ui`, `player-3d-ui`, `3d-monitor`, `cache-browser`, `firehose-browser` **ACEPTADO 2026-08-02** (rama `wp/u181-catalogo-seis-uis`, obra `0ec3033`, correccion `4bd1a69`, merge `ce1ca5b`; CI **verde en la rama antes de fusionar**; 1 contrarrevision con 2 bloqueantes + 6 menores). **Eran CUATRO altas, no seis**: `cache-browser` y `firehose-browser` ya estaban de alta por U234 y **se verifican, no se duplican** (23 entradas, 23 ids unicos, carga de U234 intacta). **Correccion del brief por el worker, y era la que decidia el WP**: la variable **no es `ZEUS_MCP_*` sino `ZEUS_PORT_*`** — estas seis viven en el bloque UI mesh (`presets-sdk/src/env/index.mjs:72-92`, overrides `:95-109`), no en el MCP. **Y lo grave que el brief del orquestador escondia**: `ZEUS_MCP_FIREHOSE` **si existe** (`:61`) y mueve el *MCP firehose* (3008), **no** `firehose-browser` (3016) — seguir el encargo al pie de la letra **habria movido otro servicio en silencio**. Su assert `notEqual(table.firehose, table.firehoseBrowserUi)` blinda esa confusion. **Punta a punta en las seis**: puerto raro por `ZEUS_PORT_*` mueve **catalogo y bind juntos**, health 200, y el puerto por defecto **queda libre** (curl exit 7 + netstat sin fila). Literales de puerto en `catalog.mjs`: **0**. `status all` 15 → 19 filas. **La trampa de U180 no existe en las seis, y esta MEDIDA** (no razonada): `.env` de raiz con los seis overrides, arranque sin pasar nada por proceso, las seis bindean en el puerto raro — todas pasan por `createAppConfig → resolveRuntimeConfig → loadZeusEnv()`. Confirmado por barrido independiente: cero `bin`, un solo `.listen()` por paquete, cero `process.env` crudo, `getConfig()` incondicional. **REGRESION PROPIA, declarada por el worker como suya**: su alta hace que `matriz-51.mjs:472-474` publique **`tipo: MCP` para cuatro UIs sin superficie MCP** — la presencia en catalogo tiene precedencia maxima sobre la rama `UI` de `:478`. Medido restaurando la base: filas `MCP` **12 → 16** y `/mcp/health` **12 → 16**, con el gate **ciego** (`51/51, 0 fallos` en los dos estados) y en contradiccion con su propio test `:198-202`. Es el **mismo `if`** cuya otra mitad si habia visto: *«di el defecto por conocido y no lei la condicion entera»*. **No arreglado a proposito** (exige que `parseSeedEntries:233` lea `kind`, que hoy ni parsea) → **U233, como un unico item** `tipo`+`healthPath` derivados de `kind`, 7 entradas afectadas; subsume su O1. **Enrutados**: `plan/MATRIZ-RUNTIME-51.md:91,97,112,113` dicen «grep → 0» y hoy dan 1 — re-medido al anotar, y **precisado**: 4 lineas son **1 entrada** · CA-2 acotada a **puerto bien formado** (con `ZEUS_PORT_EDITOR=0` el catalogo anuncia 0 y el bind cae en efimero; causa raiz `readEnvPort`, dueño **U227**; **gana el proceso** sobre `.env`, y ceros a la izquierda y espacios cuelan) · `PORT_TABLE` congelada, de 1 fila UI rancia a 6 · **el intermitente historico RESUELTO**: `intentional-stops-read.test.mjs:101`, causa **puertos fijos 19121/19122** con espera de 10 s, reproducido ocupando el puerto, arreglo `port:0` + `server.address().port`, dueño **U234** · `player-ui` no arranca sola (`server.mjs:760` espera transporte **antes** del `listen` de `:793`): `deps` esta vacio en **las 23** entradas, o sea uniformemente vacio y no selectivamente falso, y `orchestrator.mjs:168-169` lo declara con dueño **U184** — **menor, no bloqueante**. Desviacion aceptada: 2 filas de mas en `buildPortTable` (las de las UIs ya existentes) — **con el argumento corregido**, porque el original era falso: la tabla no detecta colisiones en ningun punto del repo; quien las caza es el barrido de catalogo. Se quedan por superficie documental de `launcher://ports`. Gate tras merge: **OK, 0 offenders** | cada UI arranca desde catalogo ✓ (6/6) · puerto por env ✓ (0 literales) · health de facto por entrada ✓ (200 en las seis, cero ⏳) | P1 |
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
| U196 ✅ | 24 | Zonas como ámbito real | `zones` de filtro opaco a ámbito (mismo topic × 2 zonas = 2 conversaciones) **ACEPTADO 2026-08-02** (rama `wp/u196-zonas-ambito-real`, obra `c39707d`, correccion `51fe30d`, merge `8193b98`; CI **verde en la rama antes de fusionar**, run `30727653862`; 1 contrarrevision con 1 bloqueante + 4 menores). **El encargo se quedaba corto**: `zones` no era un filtro opaco, era un campo **INERTE** — `socket-core/src/server.mjs:269` esta tipado `{room?, out?}` y no lo leia en ninguna rama. Llegaba al servidor y caia al suelo; el unico recorte vivo estaba en cliente, y alli **ausencia y `'*'` significaban «todas»**, justo lo prohibido. Ahora la zona es **sufijo de canal** (`sala` + `norte` → `sala::z:norte`), sala de socket.io distinta, **cero ediciones en `@zeus/socket-core`**. **Fan-out MEDIDO** contando escrituras del adaptador en el servidor, no observaciones del cliente: cubrir una sala con 6 suscriptores pasa de **36 entregas (30 descartadas en cliente) a 6, cero descartes**; sin zonas no cambia nada. Memoria: +1 canal por zona. **El bloqueante y su leccion**: `assertZoneId` prohibia el separador en la zona pero `assertRoom` aceptaba **cualquier** cadena, asi que entrar a la sala `SALA::z:norte` sin zona caia en **el mismo canal** que `SALA`+zona `norte` — **un canal, dos sids**, verificado contra servidor real. Y el `room` es entrada externa (`?room=` **con precedencia maxima**, comentado en el codigo como «always wins»). Al cerrarlo, el worker hallo **mas** de lo señalado: la rama «sin zona» de `emitRoomEvent`/`setState`/`makeMaster` **no pasaba por ningun guardia**, que es la mitad emisora del vector. Guardia ahora en las **cuatro puertas** (verificado por el orquestador abriendo fichero). **Mayusculas: SENSIBLE, con argumento y no por comodidad** — plegar uniria dos ambitos que el llamante declaro separados, y **unir ambitos es ensanchar**, la unica direccion que este WP no se permite; todo el resto del diseño empuja al ambito mas pequeño ante la duda. **Limites DECLARADOS y que viajan en el tarball** (README y `types/`, no solo en el reporte, que es donde el worker los habia puesto y no se publica): el aislamiento es **intra-servidor** — `socket-server/src/relay.mjs:70` reparte a namespace entero ignorando `payload.room` (sondeado: 0 repartos por canal, 2 a namespace); son **TRES** los emisores de `CLIENT_SUSCRIBE {room}` a pelo, no dos (el tercero, `webrtc-viewer/.../browser-signaling.mjs:276`, lo hallo el worker al corregir); y **ambito ≠ permiso**. **Censo de mutacion: de 3 supervivientes a 8 mutantes y CERO**. Suite 36/36; consumidores re-corridos **despues** del guardia por si rechazaba algun nombre vivo: 190 tests verdes en 9 paquetes; cero salas del repo con `::`. Gate del repo tras merge: **OK, 0 offenders**. Higiene: desmonto el mismo sus 1352 junctions **uno a uno**, nunca borrado recursivo, verificando antes y despues que el repo principal conservaba sus dependencias | fan-out medido ✓ (36→6) · zonas no se filtran mutuamente ✓ (intra-servidor, con el limite declarado donde viaja) | P1 |
| **U251** ✅ | — | **Entregado 2026-08-01 · DEVUELTO y CORREGIDO** (rama `wp/u251-menores-signaling` · reporte `plan/REPORTES/WP-U251-menores-signaling.md`).  **Devolución cerrada**: los 3 bloqueantes y los 5 menores, con 5 rojos nuevos. **B1 — el inventario del retrato era el defecto**: `userId` SÍ decide lo que se exige después y estaba fuera. Medido: en SSB un `connect()` que LANZA **acuñaba la identidad** que satisface `requireSsbId` (el `joinRoom` la estampa como `ssbId` en una card que no lo trae); en socket **deshacía el arreglo del propio defecto (1)** al reescribir el `userId` que gobierna `claimedFrom`. Ahora el retrato lleva **8 campos**, no 5. **B2**: `setPeerCard()` escribía la política y DESPUÉS validaba y lanzaba — mismo fail-open de (4) por la vía directa que `connect()` no cubre; ahora **valida antes de escribir**. **B3**: §9.3 registraba como «fail-closed» algo que falla **ABIERTO** — medí UNA alternancia y generalicé. Corregida y **ficha U262 abierta** (fila siguiente), con 2 pruebas de evidencia en la suite que **deben invertirse al cerrarla**. **M5**: `_allowTrickle` (dejaba el trickle ICE encendido sobre SSB, 0→1 publicaciones) y `_transport` (el `sendOffer` siguiente publicaba la peer-card **con token dentro** por el transporte que instaló la llamada fallida) van al retrato; `_client` queda fuera **medido y con motivo**. **M1/M2/M3/M4**: acotadas 4 afirmaciones falsas o más anchas que la evidencia — el candado pasó de campo público a **método** público (3 bypasses medidos, no 1); `_policyRestore()` es una 2.ª vía de escritura (fail-closed, pero mi comentario lo negaba); el README ya **no** dice que los invariantes valgan en los dos gemelos (el de navegador incumple 2, con tabla medida); y el 9/9 de paridad es **sobre `admission` y nada más** — en `requireSsbId` los gemelos divergen. Suite **48/48 → 75/75**, **18 rojos** demostrados contra la base en las dos rondas. — **6/6 cerrados, 0 descartados**, **13 vectores rojos** demostrados antes del arreglo. Suite `@zeus/webrtc-signaling` **48/48 → 67/67** (+19). Los dos fail-open primero: **(1)** `joinRoom` juzga ya el `from` que saca al cable (`claimedFrom: this.userId`) — el `join-room` anónimo con `userId` de forma feed SSB deja de sacar el claim, y **queda documentado** que `anonymous` es incompatible con esa forma de identidad; **(4)** los dos `connect()` envuelven su cuerpo entero con `_policySnapshot()`/`_policyRestore()` — un connect que lanza ya no deja antesala abierta ni `requireSsbId` rebajado (el vector SSB derribaba la exigencia estructural del carril). Luego: **(3)** `setPeerCard` lee cada opt UNA vez (`requireSsbId`/`requireSeatSignature`/`role`) y la inmunidad de `connect()` pasa de accidental a deliberada; **(2)** candado SSB en dos mitades — `#admission` **privado** + el torno leyendo por `getAdmission()`, que el carril SSB **fuerza a la constante `peer-card`** (los dos bypasses del README, campo y prototipo, ya no mueven el veredicto); **(5)** divergencia de gemelos **medida**: los 4 valores que separaban a las implementaciones son `admission` falsy (`''`/`0`/`NaN`/`false`) — el navegador ya era el correcto (lanza) y **Node le sigue**; paridad posterior **9/9**; **(6)** tipos estrechados (`setAdmission(mode:'peer-card')`, `getAdmission():'peer-card'`, opciones SSB completas) con sensor `tsc --noEmit` sobre fixture. **Frontera intacta**: `assertSignalingPeerCard`/`peer-card-gate.mjs` con **0 líneas tocadas**, consumidores verdes sin tocar (blob-sync-harness 11/11, blobstore-client 19/19, oasis-webrtc 3/3), gemelo navegador 17/17, e2e anónimo OK y vector `frontera` que mide que el anónimo no obtiene nada nuevo. **Abierto**: el gemelo `browser-signaling.mjs` conserva (1) y (3) — `packages/mesh/**`, otro reparto; arreglos portables tal cual. — ficha original: **Seis menores de U197** (todos con vector reproducible, **ninguno abre admisión anónima → permiso**; el WP se aceptó con ellos enrutados): **(1)** `joinRoom` no pasa `claimedFrom` (`socket-room-signaling.mjs:148-153`, `browser-signaling.mjs:270`) al revés que `_gatedOutbound` → el `join-room` anónimo **saca al cable el `from`** y luego `sendOffer` **lanza**: el modo anónimo es **inusable** para quien tenga `userId` con forma de feed SSB, y nada lo documenta · **(2)** endurecer el candado SSB de verdad (campo privado o forzar el modo en las opciones) — hoy es un `override` sobre campo público · **(3)** doble lectura del opt (`signaling-service.mjs:127`, `browser-signaling.mjs:125`): un **getter alternante** tira la exigencia declarada (fail-open); `connect()` es inmune **por accidente**, por el spread · **(4)** un `connect()` que **lanza** deja las exigencias **ya rebajadas** (`ssb-private-signaling.mjs:111-116`, `socket-room-signaling.mjs:85-89`): fail-open · **(5)** quinta divergencia de gemelos con modo falsy (`''`/`0`/`NaN`): Node acepta en silencio, navegador lanza — ambas seguras, **no idénticas** · **(6)** el candado es **invisible para TypeScript** (`types/index.d.ts:148-151`): un consumidor TS ve `setAdmission('anonymous')` como legal, justo en la capa donde se enteraría en build; y faltan `requireSsbId`/`requireSeatSignature`/`admission` en las opciones SSB | (1) y (4) primero: son los dos fail-open · cada uno con su caso rojo · README y tipos coherentes con el alcance real | P1 |
| **U262** ✅ | — | **Entregado 2026-08-02** (rama `wp/u262-lectura-multiple` · reporte `plan/REPORTES/WP-U262-lectura-multiple.md`). **Cerrada la CLASE, no los dos vectores.** Barrido con proxies contadores sobre `opts` y sobre la card en todas las ramas del torno: **24 lecturas múltiples** encontradas (16 en `peer-card-gate.mjs`, 1 ENTRE llamadas, 7 en la capa de servicio), **6 con fail-open medido** — los 2 de ficha y **4 que la ficha no listaba**. El nuevo grande: `card.scopes` se leía **11 veces** vía `@zeus/protocol`, y con un getter alternante **una card que sólo acredita `player` pasaba una exigencia de `operator`** (devolvía `{ok:true, role:player}`) — el mismo fail-open por el lado de la CARD; más un índice alternante DENTRO de `scopes` (×2) con idéntico resultado; y los dos extractores (`peerCardFromMessage`, `ssbIdFromMessage`) **devolvían una card / un feed distintos de los que acababan de comprobar**. Arreglo de clase: **dos fotos al entrar** — `readGateOpts` (8 claves, lista cerrada a propósito) y `materializePeerCard` (campos propios enumerables + copia de arrays) — y la decisión entera sobre la foto; `verifyTravelingPeerCard` verifica **la foto**, que es exactamente la vista que la firma de asiento cubre (`Object.keys`). La capa de servicio deja de releer para sacar al cable: `handleMessage`, `_gatedOutbound` y `joinRoom` anuncian el `ssbId` **que el torno acaba de juzgar**, no una relectura. **Cero movimiento de veredicto**: diferencial base-vs-arreglo con valores fijos, **656 veredictos** (16 formas de card × 19 juegos de `opts` × 2 APIs + extractores), **0 diferencias**; los **2** únicos movimientos medidos (card con campos heredados del prototipo / campos propios no enumerables) van **los dos a DENEGAR**, y son formas que nunca pudieron llevar asiento verificable. **No se cerró de más**: la card multi-rol sigue concediendo `role:operator` cuando se exige `player` (legal desde U93), y card congelada / getter estable / campo oculto no enumerable siguen pasando. **Las 2 pruebas de evidencia INVERTIDAS**, no borradas (`u251-devolucion.test.mjs:243-320`), con su vector intacto y una sonda `deepEqual` contra el veredicto del valor fijo. **8 rojos** demostrados contra la base (2 de evidencia + 6 de la suite nueva), y el **sensor de clase** deja rojo cualquier lectura doble futura aunque nadie escriba el vector — que es lo que faltó en U251. Suite **75/75 → 85/85**; consumidores del portero sin tocar y verdes (`blob-sync-harness` 11/11, `blobstore-client` 19/19, `oasis-webrtc` 3/3, gemelo de navegador `webrtc-viewer` 17/17); **frontera intacta** (vector `frontera` de U251 verde + `e2e:webrtc-signaling-anonimo` OK: cero cards, cero permisos); `npm run gates` OK y eslint limpio. **Abierto**: `@zeus/protocol` sigue releyendo los mismos campos (inofensivo porque ahora recibe la foto; otro reparto), y la card que se JUZGA no es el objeto que se GUARDA/ENVÍA — cerrarlo exigiría que el torno devolviera su foto y que los llamantes la adoptaran, o sea rehacer el portero, fuera de alcance a propósito. — ficha original: **El portero de tarjetas lee sus `opts` varias veces — y una de esas ramas falla ABIERTO** (abierta por la **devolución de U251**; evidencia medida en `plan/REPORTES/WP-U251-menores-signaling.md` §11.3 y en `packages/engine/webrtc-signaling/test/u251-devolucion.test.mjs` — 2 pruebas «evidencia U262» **verdes hoy que deben INVERTIRSE al cerrar la ficha**). `assertSignalingPeerCard` (`packages/engine/webrtc-signaling/src/peer-card-gate.mjs:80-97`) lee `opts.role` **2 veces** en la rama que acredita y `opts.expectedSsbId` **3 veces**. Con un `opts` de getters alternantes, medido: **(a)** `role` alternando `operator`→`player` ⇒ devuelve `{ok:true, role:'player'}` **habiendo exigido `operator`** — y ése es el portero que consume el carril LAN de blobs (`packages/mesh/blob-sync-harness/src/lan-gate.mjs:23`); **(b)** `expectedSsbId` alternando `AJENO`→`AJENO`→`PROPIO` ⇒ una card de **otro feed** pasa un amarre exigido a un feed distinto. Con el valor **fijo** los dos deniegan correctamente: es defecto de **lectura repetida**, no de política. ⚠ **Por qué existe esta ficha y no una nota**: U251 registró esta rama como «fail-closed» tras medir **UNA sola** alternancia (`operator`→`undefined`, que sí cierra) y usó ese dato para **no abrir ficha**. El dato era falso. **Explotabilidad hoy baja** —exige entregar al portero un objeto con getters, y hoy sólo recibe literales—, de ahí P2, no P1. **Fuera del alcance de U251 a propósito**: `assertSignalingPeerCard` es también el portero del carril LAN de blobs, así que tocarlo cambia el veredicto de un consumidor ajeno y eso quiere su propio WP. | leer cada `opt` **una vez** al entrar (copia local) · **cero movimiento de veredicto** con valores fijos (sondas deepEqual contra base) · las 2 pruebas de evidencia **invertidas** · consumidores del portero verdes (`blob-sync-harness`, `blobstore-client`) | P2 |
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
| **U231** ✅ | 84 | Invariante de secretos en datos | **ACEPTADO 2026-08-02** (obra `d14c130`, corrección `4275f8b`, merge `ff8adf3`; CI **verde en la rama antes de fusionar**; 1 contrarrevisión con 4 bloqueantes + 8 menores). **`GATE-O-CLAVES` no existía como script**: el WP **construye** el invariante, no aplica uno. Y el worker corrigió la medición del orquestador — está citado en **8 ficheros, no 3**, y **los dos que se me pasaron eran los únicos con doctrina utilizable**: sin ellos habría implementado por analogía. **Tres reglas dentro de `npm run gates`** (`scripts/gates/claves.mjs`). **Cero detección por entropía, con razón medida**: el árbol está lleno de sha256 legítimos y un umbral los enrojece todos. **Sin lista de excepciones, y no es postura**: la doctrina dice «sin excepción», y está **mecanizado** — una entrada que nombre estas reglas **es ella misma la ofensa**. El revisor reintentó **nueve** formas de bypass (mayúsculas, comodín, getter, prefijo de ruta, array…): **ninguna eximió**. Es lo que mejor aguantó. **Los cuatro bloqueantes, con su ironía**: **(1)** `npm run lint` salía **ROJO** por dos **U+200B** que el propio worker metió para que el JSDoc no se cerrara — exactamente lo que el lint no pasado habría cazado. Cerró **la clase**: guardián de espacios irregulares que **no necesita `node_modules`**, que era el hueco por el que entró; y esta vez pasó lint **con control positivo** (fichero testigo con el defecto → rojo), porque un verde sin control no prueba nada. **(2)** La mitigación del límite grande **no existía**: `--root` sólo llegaba al censo, no al barrido, y el CLI contestaba **«problemas: 0» sobre un root con una clave plantada**. *Un límite declarado con una salida rota no es un límite declarado: es un falso verde con documentación.* Cerrado, y **siete tests lanzan el CLI como proceso** — los de antes llamaban a las funciones, y por eso nunca vieron que faltaba el cable. **(3)** El léxico era **sólo inglés** en un repo escrito en castellano cuya regla se llama `clave-en-volumen`: `clave`, `contraseña`, `secreto`, `credencial`, `auth` y ocho más **pasaban** — y la doctrina que el módulo cita habla de «credenciales». Ampliado **sólo el léxico**, con la asimetría **medida y no de gusto**: `clave` suma +17 falsos positivos, `key` a secas sumaría **+196**. Los siete falsos positivos entraron como contraprueba **antes** de ampliar, con gemelos que **sí** deben caer para probar que la precisión no se compró aflojando. **(4)** Las tres formas de corpus → **`U269`**, sin tocar la clase del valor. **LA CASCADA, que es lo mejor del WP y nadie pidió**: al aprender castellano, el detector destapó un fallo propio — **decodificaba en `latin1` «porque los patrones son ASCII»**, así que `contraseña` en UTF-8 se leía mal y **el campo con tilde se le escapaba al gate**. Lo cazó **sólo el test que corre por el camino real**; el del detector aislado pasaba, porque allí la cadena nunca toca el disco. Su conclusión, que es la lección del bloque: **probar la función no es probar el camino**. **Y corrigió una afirmación suya de la primera vuelta**: decía «hoy hay uno» sobre las lecturas de entorno; son **dos, y la segunda es dinámica**, con lo que esa superficie **deja de ser enumerable leyendo código** — y tenía un test verde fijando el subconteo como si fuera el inventario. **Abierto y sin enterrar**: `U269` · el límite grande sigue siendo **opt-in** (la mitigación existe y está probada, pero nadie corre `--barrido --root` automáticamente) · `.env` añadido a la fuerza · historial de git **no auditado y sin afirmación en ninguna dirección**. `test/gates` **144/144**, `gates: OK (0 offenders)` tras merge | gate falla si identidad entra en volumen o contexto de imagen ✓ (con vector plantado, y **los dos contextos plausibles** de imagen exigidos cerrados) · volumen que exige secreto para leerse ✓ (censo: 4 volúmenes, 4 localizadores, **cero**) | **P0** |

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
| U243 | Spike PODs/Solid · líneas como RDF (horizonte VOLUMES) | hay PRs pendientes (zeus) que integran el mundo POD/Solid; `ZEUS_VOLUMES_ROOT` podría quedar **sobreseído** por un cluster de pods (por jugador / por servicio / por agente) modelando las líneas como RDF. Insumo externo (solo lectura, fuera del cerco): la gestión del grafo graphdb del paradigma de holones (ALEPH.instructions, OASIS) **✎ 2026-08-02 (al promover la cola A)**: el solape con el intake queda resuelto y **esta fila NO se absorbe**. `WP-SDK-L03` (s-sdk) se lleva el **diseño** de la capa SOLID —wire sellado frente a vista JSON-LD/SHACL, identidad triple no fusionada, `PodProtocol` con providers, WAC/ACP con relay sin autoridad—; U243 conserva la pregunta que sólo Z puede contestar: **si `ZEUS_VOLUMES_ROOT` queda sobreseído por un cluster de pods en runtime**. Se alimenta de L03; no lo duplica. Su bloqueo `hasta U206` **ya no aplica** (U206 aceptado en la ola 5) | informe de viabilidad + decisión de mesa · no toca runtime ni contratos v1 · **no reimplementa el diseño de L03, lo cita** | P2 |

| U244 ✅ | **Triaje del intake externo `WPS_QUEUE` — cola A** (programa holónico LORE-HM) | **CERRADO POR PROMOCIÓN, 2026-08-02** (orden del product owner: *«vamos a cambiar una carpeta pendiente de encolar por una rama sólida de WPs»*). El triaje que esta fila pedía **se ejecutó**: el Anfitrión leyó el material completo —`plan.md` (6 fases), `DRAFT/PLAN.md`, `solid-city.md`, los dos planes de mesa, `barrio-bartley.md` y la cantera `CIUDAD`— y lo repartió por dueño en vez de dejarlo encolado. **La premisa de esta fila era falsa y queda corregida**: escribí que el programa quedaba parado por una decisión de reparto pendiente, y el propio material ya la tiene tomada — **LORE-HM no crea holón 08 ni `L_SDK`, no amplía el reparto**: `e-sdk` **ya es el holón 03** y tiene su plan (`C:\S_LAB\e-sdk\plan\`), `a-sdk` entra **RO import-once** (holón 05, cantera) y Network-Engine (holón 04) **se sella como fuente histórica**, no se adopta como runtime. **Partición resultante**: obra del playground → hub, lane `LORE-HM`, `WP-HUB-100`–`111` con gate `GHM` · lengua, capa SOLID, vocabulario y sellado → `s-sdk`, lane `LENGUA`, `WP-SDK-L01`–`L05` · frontera de tipos → **ya promovida** aquí como `U245`–`U249` · provider real de Document Machine → **obra de E**, fuera de nuestro reparto (aquí sólo su puerto y la contingencia determinista). **Solape con U243 resuelto**: `WP-SDK-L03` absorbe el **diseño** de la capa SOLID; U243 queda **aparte** y se alimenta de él, porque su pregunta es otra —si `ZEUS_VOLUMES_ROOT` queda sobreseído por un cluster de pods en runtime— y esa es arquitectura de Z | triaje ejecutado ✓ · partición por mundo y ownership ✓ · nada despachado sin GO ✓ (las 17 fichas nacen sin worker) | P2 → **cerrado** |

### Cola promovida — frontera TypeScript (intake `WPS_QUEUE` cola B, 2026-07-31)

**Promovida a ids canónicos por el orquestador** (autorización del custodio: «el B cuando quieras encolar»). Origen y briefs candidatos: `C:\S_LAB\s-sdk\WPS_QUEUE\QUEUE-B-ZEUS-TIPADO\` (`ZT01–ZT05` = ids locales de la cola, **ya remapeados aquí**; su calibración de worktrees y su lectura del freeze están caducadas — manda el gobierno de Z).

**Ventana de despacho: después de `GD`** (carril D cerrado en U206). Razón dura: `@zeus/linea-kit` es territorio vivo del carril D (U200 y U202 editaron su `src/`), y la campaña de tipos declara *cero cambios en runtime* — despacharla ahora sería programar una colisión. `acta-kit` (U246) no comparte territorio y **puede adelantarse si hace falta hueco**.

| id | ZT | WP | deps | frontera dura | CA de cierre | P |
| -- | -- | -- | ---- | ------------- | ------------ | - |
| U245 ✅ | ZT01 | Tipos públicos completos de `@zeus/linea-kit` (todos los subpaths). **ACEPTADO 2026-08-02** (rama `wp/u245-tipos-linea-kit`, obra `0257308`, corrección `25a49fd`, id `ba9a56c`, merge `356d4dd`; CI **verde en la rama antes de fusionar**, run `30728274692`; 1 contrarrevisión con 4 bloqueantes + 7 menores). De **cero** `.d.ts` a **50 declaraciones**; los diez subpaths con condición `types`, `types` en raíz y `"types"` en `files`. **Diff de runtime CERO, verificado por el orquestador sobre `main` tras el merge**: los tres árboles idénticos — `src` `b2e67b41`, `schemas` `1278f990`, `bin` `fb1f4c49`. (Un `sha256sum` del árbol de trabajo da 50 falsos positivos por `core.autocrlf`: la comparación autoritativa es la de árboles de git, y el worker lo advirtió.) **EL BLOQUEANTE MAYOR, y es la mejor demostración de la tesis del método que ha dado el programa**: las declaraciones del comodín `./schemas/*` **APAGAN una comprobación que el paquete SIN tipos ya tenía**. Sin `.d.ts`, TypeScript emite `TS1543` al importar un JSON en ESM sin atributo; con la declaración puesta, la condición `types` lo convence de que es un módulo normal, **calla**, y Node revienta en ejecución con `ERR_IMPORT_ATTRIBUTE_MISSING`. **El contraejemplo era el propio consumidor de CA1**, que compilaba a 0 errores y fallaba al ejecutarse. Un tipo que promete más que el runtime hace literalmente que el consumidor deje de comprobar. **Y el worker declara lo que NO consiguió**: *«no he conseguido que TypeScript vuelva a cazarlo, y no lo escondo: la condición `types` **es** lo que apaga la regla»*. Lo compensó por tres vías: las 19 declaraciones lo documentan, `test/json-import-attribute.test.mjs` lo fija **en runtime y en CI** (las 19 rechazan la forma desnuda, las 19 cargan con atributo) y una **pierna J** del gate exige que la nota siga escrita. **Los otros tres**: `acceptWalks` declaraba `from`/`to`/`hop` requeridos y **devolvía la entrada tal cual** (`hop` → `undefined`, `from` → `number`) — el peor sitio posible, porque esa función existe para que el consumidor deje de comprobar; ahora el resultado se tipa **por la entrada** · `unknown` usado como «cualquier objeto» cuando `null` y `undefined` **son miembros de `unknown`** (seis TypeError reproducidos) → `Record<string, unknown>` · `ParteEntry.id: string` requerido contra un schema que **no promete ni una propiedad** → `id?: unknown`. **Halló un quinto caso que la devolución no listaba** (`segmentarViaje` no normaliza `editorAllowlist` array→Set). **Pieza añadida que nadie pidió**: `test/types/must-fail/`, **13 casos que deben NO compilar** — *«un chequeo que sólo sabe decir compila nunca se entera de que una declaración dejó de morder»*. Y su README explica **por qué no hay caso para el bloqueante mayor**: TypeScript no puede cazarlo, y poner uno que pasara sería **justo la evidencia falsa que esos ficheros existen para evitar**. **Retiró su propia desviación de alcance** (`scripts.types:check` apuntaba a un fichero que `files` excluye): el diff del manifiesto cae ahora **exactamente** dentro de la frontera dura. **Devuelto una segunda vez por un identificador**: su deuda apuntaba a `WP-U246`, que ya es `acta-kit`. Su observación al corregirlo es más fina que la corrección: la cita viajaba en la **cabecera del gate**, o sea que la referencia falsa se habría propagado **desde el código**, no sólo desde el reporte. Reasignada a **`U264`**. **Deuda declarada con nombre — `U264`**: el gate es **ciego a la declaración corrupta** (sólo hace `existsSync`), y `types:check` no lo corre `npm test` ni ningún workflow, así que **nada en CI puede cazar hoy un `.d.ts` corrompido`**. No cerrado a propósito: dar parser al gate le mete dependencia de `typescript` contra su diseño de cero dependencias. `npm pack`: 104 ficheros, 50 declaraciones dentro, `test/` fuera. Cero `any`, cero `Function`, cero `@ts-*`. Changeset `patch`. Gate tras merge: **OK, 0 offenders**. **Desbloquea al swarm LORE-HM** (`WP-HUB-100` y `105` exigen reusar estos schemas) | GD | cero cambios en `src/**`, schemas y carril D ✓ (tres tree hashes idénticos, verificado en `main`) | cada export JS con condición `types` resoluble bajo `NodeNext` ✓ (los diez, con traza de resolución) · gate exports↔declarations que **falla** en las dos direcciones ✓ (+ 5 vectores que el worker no eligió) | P1 |
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
