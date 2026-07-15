# VISION — de codebase frankenstein a herramienta de crear juegos

## El punto de partida (2026-07-15)

zeus-sdk creció por olas: sesión Scriptorium (player-ui como master), visores
3D, catálogo MCP de presets, y finalmente el ARG del delta (`packages/arg/*`),
que llegó el último y se convirtió en lo primero. **delta** demostró el patrón
bueno:
**dominio puro + autoridad única + intents + ledger + gates + playbook validable
por agentes MCP**. El resto de la codebase habla dialectos anteriores del mismo
idioma.

No refundamos en un repo nuevo: las librerías núcleo están vivas y bien
consumidas, y la infraestructura (e2e, pipeline OpenAPI/AsyncAPI/VitePress,
flujo de swarm) vale más que un `git init` limpio. Refundamos **en el sitio**:
el patrón de delta se asciende a motor del SDK y todo lo demás converge hacia
él — y lo que queda sustituido, **se borra en el mismo movimiento**.

## Principios (no negociables)

1. **Creamos de cero, no versionamos un producto.** Prohibido `legacy`, `v2`,
   `-old`, `-new`, capas de compatibilidad y aliases de transición en nombres
   de paquetes, archivos, exports o eventos. La cosa nueva lleva EL nombre; la
   vieja muere.
2. **Sin vías muertas.** Cada WP incluye su *Demolición*: borrar lo que
   sustituye. Al final de cada ola, cero paquetes huérfanos, cero código
   comentado «por si acaso», cero TODO sin entrada en un backlog.
3. **Un solo juego, un solo contrato.** El Tablero (player-ui) no es otro
   juego: es el manipulador de líneas del mismo mundo. Cachear, etiquetar,
   curar y hacer milestone son intents del mismo dominio que abrir un grifo o
   excavar. Un único protocolo `state | intent | track | ledger`, una
   autoridad por room, todos los demás son vistas que emiten intents.
4. **Resource/REST-driven.** Toda capacidad se expone tres veces desde UNA
   definición: ruta REST (OpenAPI), evento de room (AsyncAPI) o
   resource/resource-template MCP. Los docs se generan del contrato, nunca a
   mano.
5. **La validación es parte del juego.** Un juego sin CASOS.md + acta de
   validación no tiene release. El método CASOS (agente ejecuta evidencia MCP,
   humano verifica checklist visual, cada ⚠️/❌/💡 genera tarea trazable) es un
   producto del SDK, no un extra del primer juego.
6. **La regla de los dos juegos.** El SDK mantiene SIEMPRE al menos dos juegos
   (`delta`, grande; `pozo`, mínimo) y nada entra en `engine/*` hasta que
   ambos lo consumen. Motivo: el modo de fallo conocido del swarm es
   canonizar el ejemplo cuando se le pide abstracción — con dos consumidores
   reales, el ejemplo no puede hacerse pasar por el contrato. Corolario con
   gate: el engine jamás nombra un juego concreto.
7. **Files-first.** El plano de datos de admins y jugadores es **JSON en
   disco** (volumes.json, manifests, sidecars, ledger append-only) antes que
   infra anexa: ni dockers con base de datos ni colectores de cola. Los
   objetos pesados son inmutables y direccionables (alineación p2p/IPFS por
   diseño, transporte después). Detalle en [DATOS.md](DATOS.md) §5.

## Los dos mundos

La herramienta sirve a dos públicos relacionados pero distintos. La
arquitectura objetivo los separa en dos vías sobre un motor común:

### A · El editor de juegos (crear)

Donde se **define** un juego: escenas y nav-graphs, reducers y reglas, presets
y cloaks, gamemaps, labelsets, casos de validación. Habita aquí `editor-ui`
(hoy CRUD de presets; evoluciona a editor de gamemap/release) y la autoría de
specs. Su salida es un **game** empaquetado.

La persona de este mundo es el **dramaturgo**: cualquier jugador que trae una
línea nueva (su segmentación, sus satélites) y diseña una experiencia sobre
los elementos comunes. No hacemos su segmentación: le damos especificación de
formatos, herramientas, placeholders y starterkits (los dos kits de
[DATOS.md](DATOS.md) §6). El objetivo final del mundo A: que SOLVE ET
COAGULA lo cree un dramaturgo con el editor, no nosotros a mano.

### B · El mesh de operación (jugar y operar)

Donde se **corre** un juego: socket-server, la autoridad, los visores (tablero,
jugador encarnado, manipulador de líneas, visor de operador), los MCP de
jugador para agentes, los browsers de datos (cache/firehose) y los servidores
MCP de corpus. Habitan aquí operadores del sitio (operator-ui), DJs
(player-ui) y jugadores (arg-console/vistas + arg-player-mcp).

## Glosario (nombres canónicos; no inventar sinónimos)

| término | definición |
| ------- | ---------- |
| **engine** | las librerías genéricas del SDK (`packages/engine/*` en el layout objetivo): protocol, authority-kit, player-mcp-kit, view-kit, playbook-kit, game-engine, rooms, presets-sdk, http-contract, ui-kit, ui-3d-kit… |
| **game** | un juego definido sobre el engine: dominio puro + escena + reducer + vistas + feeds + CASOS.md. |
| **delta** | el primer juego (antes «CAUDAL», nombre retirado en D-8): el ARG del delta de datos — grifos, ríos, mar, cantera. `packages/arg/*` hoy; `games/delta` en el objetivo. |
| **pozo** | el segundo juego, mínimo a propósito (un pozo, pocos nodos, un intent con ledger): existe para forzar la regla de los dos juegos. |
| **games-library** | el repo independiente `Z_SDK-games-library` (ola 6) donde se distribuyen los juegos y sus datos pesados (start packs vía Releases + registry propio; ver ARQUITECTURA §6). |
| **room** | canal de una partida en el socket-server; UNA autoridad por room, N vistas/actores. |
| **autoridad** | el único proceso que muta dominio (tick + reducer + snapshot + ledger). Todo lo demás emite intents y proyecta. |
| **intent** | petición de mutación firmada por un actor; la autoridad la reduce o la ignora (rechazo silencioso explicable por dry-run). |
| **ledger** | registro append-only de hechos del dominio; la fuente de evidencia y de scoring. |
| **track** | pista de navegación (deep-link honesto) hacia un recurso de datos; no muta dominio. |
| **rol** | capacidad de un actor en la room: `player`, `dj` (manipulador de líneas), `operator`. Los intents declaran qué roles pueden emitirlos. |
| **ronda** | una partida de principio a fin (colapso/victoria); produce ledger + acta. |
| **start pack** | datos semilla versionados con los que arranca una ronda. |
| **línea** | obra de datos: un tronco curado + satélites que lo conectan a fuentes remotas con autoridad. Las trae el dramaturgo; los juegos las inflan. ⚠️ No confundir con las «líneas concurrentes» de una sesión en los docs de transmedia-system (live connection / transcripciones / público-chat): aquellas, en nuestro vocabulario, son **canales de sesión**. |
| **tronco** | la espina curada por un autor: nodos con tesis y rangos (formato `nodos.yaml` → manifest; ej. P01–P24 de Villacañas). |
| **satélite** | conexión de un tronco a una fuente remota (historial WP por `oldid`, firehose ATProto, feed SSB), servida por un MCP loader read-only; el puente es `nodo-sections.json`. |
| **segmentación** | trocear una fuente en nodos/registros/escenas con anclas y milestones. La hace el dramaturgo con el kit de línea; nosotros damos formatos y herramientas (DATOS.md §2). |
| **force** | corpus indexado de entropía narrativa que inyecta EL SISTEMA (roles `operator`/`dj`), no el jugador: logs de agente segmentados en escenas con anclas + metadata de activación declarativa (`force.json`: triggers, `pairs_with`, escena ancla) + presupuesto por registry. ⚠️ Nunca llamarlas «engines» — colisión con `engine/*`. Detalle en DATOS.md §8. |
| **cota** | corpus que acota el espacio de una ronda: **sima** (cota inferior — ruptura/discrepancia; el polo del colapso) y **cima** (cota superior — confluencia; el polo de la victoria). Formato hermano de la force, con rol `cota` en el registry (DATOS.md §8). |
| **volumen** | dataset canónico en disco bajo un slot DISK, registrado en `volumes.json`, **compartido por todos los juegos del mesh**. Crece al cachear/curar; se vacía con CRUD por roles (DATOS.md §4). |
| **vaciado** | la mitad olvidada del ciclo: liberar espacio. Duro para `operator`, jugable para `player`/`dj`; siempre con asiento en el ledger. |
| **familias de feed** | las tres naturalezas de fuente: estática con autoridad (wiki), stream (ATProto), gossip & peers (SSB). Mismo procedimiento: JSON a disco + volumes.json + MCP loader (DATOS.md §3). |
| **dramaturgo** | la persona del mundo A: autor de líneas y diseñador de experiencias con los dos kits (línea y experiencia). |
| **release** | game + start pack + versiones de paquetes publicadas en el registry + **acta de validación en verde**. Sin acta no hay release. |
| **mesh** | la malla de servicios operada (socket-server, autoridad, visores, MCP, browsers). |
| **acta** | registro de una pasada de validación según el método CASOS (plantilla VALIDACION). |
| **demolición** | borrado del camino sustituido, dentro del mismo WP que lo sustituye. |
| **gate** | invariante ejecutable (test, a menudo grep) que se pone rojo si se viola una regla de arquitectura o de prácticas. |
