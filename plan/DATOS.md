# DATOS — líneas, volúmenes y feeds (el plano de datos)

Refinamiento del 2026-07-15 (ronda «creación de nuevas líneas»). Este doc fija
el plano de datos sobre el que corren TODOS los juegos y da al swarm los
punteros canónicos para las olas 7–9. Los formatos NO se reinventan: ya
existen y funcionaron; aquí se inventarían y se dice dónde está cada verdad.

## 1. La idea

Una **línea** es una obra de datos: un **tronco** curado por un autor (nodos
con tesis, p. ej. P01–P24 de Villacañas) más **satélites** que lo conectan a
fuentes remotas con autoridad (historiales de Wikipedia por `oldid`, firehose
ATProtocol, feeds SSB). Los juegos no leen las líneas: **las inflan** —
cachear, etiquetar, curar y hacer milestone son acciones de juego que
materializan datos remotos en disco. Los **VOLUMES son del mesh, compartidos
por todos los juegos**: delta, pozo y los que traiga el dramaturgo agrandan el
mismo mapa.

La **segmentación** — trocear una fuente en nodos/registros/escenas con
anclas — NO la hacemos nosotros: damos **especificación de formatos +
herramientas + placeholders + starterkits** para que cada dramaturgo traiga
su línea (principio del reproductor transmedia: Scriptorium no es la
plataforma, es el sound system por el que pasa la señal narrativa).

## 2. Inventario de formatos canónicos (la spec del linea-kit)

Verificado 2026-07-15. Fuente viva: `SCRIPTORIUM_V0/network-engine/linea-aleph/`
(578 archivos, motor Python funcional). Fuentes migradas (recuperables por
git en network-engine): `git show 0b1c4a3~1:lineas-poder/...` (tronco) y
`git show e540702~1:zeus-presets-sdk/packages/linea-system/...` (capa MCP JS,
antecesora directa de nuestro `packages/mcp/linea-system`).

| formato | rol | fuente canónica |
| ------- | --- | --------------- |
| `nodos.yaml` | INPUT humano del tronco (partes, nodos con `id/años/etiqueta/tesis/articulos_wp`) | `0b1c4a3~1:lineas-poder/espana/nodos.yaml` |
| `manifest.json` (tronco) | salida de segmentar el tronco: meta + `nodos[]` con paths/urls | `0b1c4a3~1:lineas-poder/espana/manifest.json` |
| `nodos/Pxx/meta.json` | un nodo del tronco | ídem |
| `manifest.json` (satélite/historial) | **el formato central**: meta + `snapshots{previo,inicial,final,sc_cierre,actual}` + `ontology_sections` + `milestones[]` + `registros[]` | vivo: `network-engine/linea-aleph/manifest.json` |
| objeto `registro` | una edición: `oldid/parent_oldid/user/byte_delta/section/summary`, `milestone(+reasons)`, `urls{revision,diff_prev}`, `delta_status: pending\|draft\|curated` | ídem |
| `snapshots/<rol>/meta.json` | endpoint de línea con `cache_wikitext` + `fetched` | ídem |
| `cache/snapshots/<oldid>.wikitext` + `.meta.json` | el dato de autoridad cacheado + sidecar de provenance (`source_url`, `fetched_at`) | vivo: `linea-aleph/cache/snapshots/` |
| `nodo-sections.json` | **puente tronco↔satélite**: nodo → secciones WP (mapa curado) | `0b1c4a3~1:lineas-poder/espana/wp/historia/nodo-sections.json` |
| `registry.yaml` | catálogo multi-línea (`id, autor_tronco, nodo_prefix, referencia_wp_cima`) | vivo en `VOLUMES/DISK_02/LINEAS/registry.yaml` |
| `ontology-seeds.json` | semillas ontológicas (secciones × edit_count + viaje sugerido) | vivo: `linea-aleph/ontology-seeds.json` |
| `registro.md` / `delta.md` | capa de curación humana (front-matter YAML, `status: pending\|draft\|curated`) | vivo: `linea-aleph/registros/` |
| `raw/linea.md` / `raw/linea.json` | export crudo de historial (newest-first) | `0b1c4a3~1:lineas-poder/espana/fetch_wp_historia.py` |
| `volumes.json` | registry de VOLUMES (slots DISK, corpora, `readonly`, source/sync) | vivo: `VOLUMES/volumes.json` |
| `TransmediaEvent` / `transmedia.json` | contrato de evento transmedia (`source: stream\|chat\|room\|atproto\|bot…`, `editorialStatus: raw\|triaged\|canon\|rumor\|proposal\|discarded`) y sesión por bloques con `anchor` + consultas `linea_aleph` con `oldid` | `transmedia-system/analisis_transmedia_system.rev1.md` L342-354; `…/SPRINT01/GAME-XZZX/schema/transmedia.json.example` |

Regla de diseño heredada y vigente: **el wikitext (dato de autoridad) es la
verdad; el markdown es índice y curación**. Y la cadena de curación
`raw → triaged/labeled → canon` (TransmediaEvent) es la misma que nuestro
etiquetado-curado en juego: `labeled` del firehose, `delta_status` de las
líneas y `editorialStatus` transmedia son un solo concepto a unificar en el
linea-kit.

Motor de referencia para las herramientas (WP-U81): `segment_linea.py`
(historiales: milestones por reglas de `byte_delta`/keywords/editor),
`segment_poder.py` (troncos desde `nodos.yaml`), `fetch_wp_historia.py` +
`linea-aleph/scripts/{mw_client,history_common,fetch_snapshot,fetch_batch,…}.py`.
La API de lectura de referencia es nuestro `packages/mcp/linea-system`
(resources `linea://nodo/{year}`, `linea://wikitext/{oldid}`…, tool
`cache_wikitext` con fetch async — el patrón «pedir un dato remoto lo
materializa en disco» ya existe y es el que los juegos jugarán).

## 3. Las tres familias de feed

| familia | naturaleza | ejemplo | estado |
| ------- | ---------- | ------- | ------ |
| **estática con autoridad** | snapshots citables por revisión (`oldid`), cacheables verbatim | Wikipedias (linea-aleph, wp/historia) | operativa (DISK_02) |
| **stream** | firehose continuo, triage `raw→candidate→labeled→discarded` | ATProtocol (Firehose ONFALO) | volumen operativo (DISK_01, sync desde pipeline local); conexión ATProto directa pendiente |
| **gossip & peers** | log append-only replicado por gossip; ni estático ni firehose | SSB: pub OASIS (`BlockchainComPort`), mensajes tipados de **Tribes** (`tribe`, membership, invites) y **Parliament** (`parliamentProposal/Law/Candidature`, votos) | pub desplegado y sano en el VPS; **falta el exportador SSB→JSON** para montarlo en VOLUMES con el mismo procedimiento (WP-U84) |

El mismo procedimiento para las tres: exportar/sincronizar **JSON a disco**
en un slot DISK con entrada en `volumes.json` (readonly + provenance), y
exponerlo con un servidor MCP loader read-only (patrón linea-system /
linea-firehose). La capa 2 «BOE-Arrakis-Theater-Elenco» sobre SSB es hoy
nomenclatura de diseño (dossiers `aleph-scriptorium/sala/dossiers/
dossier-layer2-bridge/`), no código: queda en horizonte, no en olas.

## 4. Ciclo de vida de VOLUMES: crecer y vaciar

Los volúmenes **crecen por diseño** cuando los jugadores cachean/curan
(excavate ya lo hace con gate `APROBAR`; el DJ ganará `cache/curate/milestone`
en WP-U30). Falta la otra mitad del ciclo — **vaciar** — y es tanto operación
de admin como mecánica de juego (WP-U82/U83):

- **Medición**: tamaño por volumen/corpus/línea, expuesto como resource
  (REST + MCP desde una definición, ola 4).
- **Vaciado** con roles: `operator` = duro (purgar cache no curada, compactar
  corpus, retirar un volumen); `player`/`dj` = jugable (liberar espacio como
  acto del juego, con coste/beneficio en la trama y asiento en el ledger).
- **Lo curado pesa más que lo crudo**: el vaciado por defecto ataca
  `raw`/`discarded`/cache sin curar; lo `canon`/`curated` exige rol operator
  y quedar en el ledger. Nada se borra sin asiento.
- Las **tramas y CASOS** de delta y pozo integran ambos sentidos (crecer el
  mapa / vaciar el espacio) para que el ciclo completo sea experiencia, no
  mantenimiento (WP-U83).
- **El mapa ES el volumen proyectado**: cuando un jugador «agranda el mapa»
  (solicita cachear, cura, etiqueta) el mundo visible crece porque el volumen
  creció — cámaras que pasan a `cached`, islas que emergen, clusters que
  nacen. El vaciado debe tener la proyección inversa (el mundo encoge/se
  apaga donde se purgó). Regla para los juegos: ninguna geometría "de
  mentira" — lo que se ve en el mapa se corresponde con lo que hay en disco.

## 5. Files-first y alineación p2p (D-13/D-14)

**JSON en disco antes que infra anexa.** Ni dockers con base de datos ni
colectores de cola para el plano de datos de admins y jugadores: el estado
duradero son archivos (volumes.json, manifests, sidecars, ledger append-only
del Notario). El estado volátil de las rooms (los «dummy state» de hoy)
pasará en algún punto a alimentar colas de estado persistentes — pero esa
persistencia se diseña TAMBIÉN como archivos primero (ledger a disco, WP-20
del juego delta), y solo si los archivos se quedan cortos se considera infra.

**Alineación IPFS** para hacer p2p los volúmenes: la preparación es de
diseño, no de infraestructura —

1. **Inmutable y direccionable**: los objetos pesados ya son inmutables y
   con clave natural (`<oldid>.wikitext`, JSON de firehose por hash/rkey,
   mensajes SSB por hash). Se mantiene así: ningún formato nuevo puede
   requerir mutación in situ de un objeto pesado.
2. **Manifests como raíz**: `volumes.json`/manifests referencian objetos por
   ruta relativa (hoy) y toleran un campo `cid` opcional (mañana) — añadir
   IPFS será *pinnear y anotar*, no migrar.
3. **Transporte después**: publicar/pinnear VOLUMES en IPFS (o dat/hyper; se
   evalúa con evidencia) es un WP de horizonte (WP-U71), cuando el layout ya
   es content-addressable-friendly. Sin demonios nuevos en el mesh hasta
   entonces.

## 6. El dramaturgo y sus dos kits

**Dramaturgo** = la persona del mundo A (editor): quien diseña una
experiencia a partir de los elementos comunes. (El término viene de
transmedia-system, donde es la skill que construye escenarios de
bifurcación; aquí lo usamos como rol humano/agente de autoría.) Se le
entregan dos kits:

1. **Kit de línea (datos)** — WP-U80/U81: spec de formatos §2 + herramientas
   de segmentación + instrucciones de conexión (satélites MCP, remotos
   wiki/ATProto/SSB) + starterkit «crea tu línea» con placeholders.
2. **Kit de experiencia (juego narrativo)** — WP-U86: la **CARPETA
   DRAMATURGO** en la games-library, destilada de lo que ALEPH_ET_OMEGA y
   SOLVE_ET_COAGULA (`SCRIPTORIUM_V0/scriptorium-network-games/`) ya
   comparten: constitución `index.md` parametrizable, rejilla **REIC** de 4
   ejes intercambiables, cadenas en 4 capas
   (blockchain→agentchain→storychain→readerchain) con sus README-plantilla,
   `story-board.json` (actos→widgets→agentchain), specs UI `uichain/
   panel-*.prompt.md` (la plantilla más lista-para-dramaturgo:
   `SOLVE_ET_COAGULA/uichain/README.md`), árbol `AYUDA.md`, marcas
   epistémicas 🟢🟡🔴⚪ y hot files de estado.

**SOLVE ET COAGULA como tercer juego** (WP-U87): ya existe como obra
narrativa; el objetivo es *recrearlo con el editor + los dos kits* como
prueba de fuego del mundo A — un juego que entra al mesh sin que nosotros
escribamos su experiencia. Guiño no casual: el corpus vivo `linea-aleph` ES
el historial de ediciones de SolveCoagula en Wikipedia — el tercer juego se
juega sobre la línea de su propio autor. La regla de los dos juegos no se
toca: delta+pozo siguen siendo el mínimo vivo del engine; el tercero valida
al dramaturgo, no al engine.

## 7. Punteros externos (para no volver a buscar)

- Motor Python vivo: `SCRIPTORIUM_V0/network-engine/linea-aleph/` (+
  `CACHE_RUNBOOK.md`; formatos §2).
- Contratos migrados: network-engine commits `0b1c4a3` (borra lineas-poder) y
  `e540702` (borra zeus-presets-sdk) — recuperar con `git show <commit>~1:…`.
- Transmedia: `SCRIPTORIUM_V0/transmedia-system/analisis_transmedia_system.rev1.md`
  (manifiesto; TransmediaEvent), `SCRIPTORIUM-CORE/TRANSMEDIA-SYSTEM/dossier.md`
  (Zeus = catálogo de PRESETS — nuestro presets-sdk es su heredero).
- Juegos narrativos: `SCRIPTORIUM_V0/scriptorium-network-games/
  {ALEPH_ET_OMEGA,SOLVE_ET_COAGULA}` (plantillas §6.2).
- SSB: `aleph-scriptorium/BlockchainComPort/src/models/{tribes_model,
  parliament_model}.js` (mensajes tipados), `OASIS_PUB/docker-compose.pub.yml`
  (pub), `ScriptoriumVps/PATTERN-DOCKER/` (VPS: Node-RED rooms + Verdaccio +
  Caddy; el pub comparte red Docker `oasis-pub-scriptorium_oasis_pub_net`),
  dossiers de layer2 en `aleph-scriptorium/sala/dossiers/dossier-layer2-bridge/`.

## 8. Forces y cotas — la física que aporta el sistema

Refinamiento del 2026-07-15 (ronda «forces», D-19). Además de las líneas
(que traen los dramaturgos) el plano de datos tiene un tercer ingrediente,
aportado por EL SISTEMA — admins y operadores —: **entropía narrativa
acotada**. Como en §2, los formatos no se inventan: existen y están
verificados.

**Force** = corpus indexado que inyecta origen de mirada y lore en una
ronda. Formalmente es pariente de la línea: raw (logs de agente) →
segmentador → manifest + escenas `prompt/think/output` con anclas y
cobertura 100% verificable (el segmentador que devuelve `ok: true` es un
gate). La diferencia con una línea wiki: la fuente no es remota con
autoridad, es corpus propio autocontenido. Su metadata de activación es
declarativa (`force.json`): `viewpoint_origin`, `lore_hook`, `anchor_scene`,
`activation_triggers`, `pairs_with`; y el registry agregado declara
`session_budget` (máx. N forces activas, boot siempre ON) y exclusiones
(pares que jamás se activan juntos, p. ej. el par mito/verificador).

**Cotas** = dos corpus hermanos con rol especial que acotan el espacio donde
las forces perturban: **sima** (cota inferior: ruptura, discrepancia,
estados sin colapsar — el polo del COLAPSO de una ronda) y **cima** (cota
superior: confluencia, objetividad sistémica — el polo de la VICTORIA). Dan
cuerpo narrativo a los dos finales que el dominio ya contempla.

Mapeo al vocabulario del SDK:

| concepto force | concepto zeus |
| -------------- | ------------- |
| activar/desactivar una force | intent con rol `operator`/`dj`, asiento en ledger |
| `session_budget` + `pairs_with` + exclusiones | validación del reducer / config de room (nunca prosa) |
| escena ancla | track (deep-link a resource del corpus; no muta dominio) |
| corpus de force/cota | volumen read-only en VOLUMES + MCP loader (mismo procedimiento que §3) |
| registry de forces | entrada en volumes.json con provenance |

Reglas duras:

1. **Naming**: dentro de zeus se llaman **forces** — nunca «engines»
   (colisión venenosa con `engine/*`).
2. **Las forces concretas son DATOS, no código**: viajan por VOLUMES y
   start packs de la games-library; `engine/*` solo conoce el FORMATO
   force/cota (misma mecánica que la regla de los dos juegos: el formato
   jamás nombra una force concreta — gate).
3. **La entropía la aporta el sistema**: los intents de force son de rol
   `operator`/`dj`; el jugador la experimenta, no la emite.

**El corpus vive en casa** (importado y curado 2026-07-15): volumen
`VOLUMES/DISK_03/FORCES` — 12 corpus (boot `main` + `force-a..g` +
`force-xz/zx` + cotas `sima`/`cima`), 68 escenas, `registry.json` con las
reglas de activación, formato v0 documentado en su README. Curación aplicada
(ver `IMPORT_NOTES.md` del volumen): capa `trace` descartada (ruido de
tool-use), `raw` no viaja (lo curado entra; provenance por `source_lines`),
manifests unificados a un solo shape, IDs zeus, `pairs_with` con refs
tipadas (`force:`/`cota:`/`boot:`/`linea:` — las `linea:*` pueden apuntar a
líneas no montadas: conexión pendiente, no error). **El plan ya no depende
de codebases externas para las forces**: los orígenes (registry
`network-engine/engines/`, `sima-aleph/`, `cima-aleph/`; higiene del review
ENGINE-XZZX ya aplicada en origen y verificada al importar) quedan como
provenance histórica. DISK_03 viaja en git (excepción a la política de
VOLUMES: corpus curado pequeño, ~1,3 MB de texto — los datos pesados de
DISK_01/02 siguen gitignorados).

**El dramaturgo trae sus propias forces.** Las forces son conversaciones
capciosas indexadas: hilos que tocan un tema y avanzan enumerando los
argumentos que en el juego crean la tensión — la visión de un tema a través
de una force hace de la objetividad tierra inestable, y el juego reacciona
según cada agente. El pipeline (que WP-U81 convierte en herramienta, aquí
ensayado a mano): el dramaturgo **aporta sus contextos** (logs de
conversación con intención argumental) al segmentador → escenas con anclas
y cobertura; escribe su carta de activación (`force.json`: mirada, lore,
triggers, pares) y sus **líneas de cota** (los máximos y mínimos de SU
experiencia — el termómetro con el que el sistema sabe qué force activar y
cuándo); valida contra el schema (WP-U80) y monta el volumen. DISK_03 es el
fixture de referencia: si tu force valida donde validan estas, entra al
mesh. Spec de juego multi-bloque sobre forces trenzadas (candidato de
experiencia de dramaturgo, horizonte WP-U74):
`transmedia-system/SCRIPTORIUM-CORE/ENGINE-XZZX/Juego-spec-plan.md`.
