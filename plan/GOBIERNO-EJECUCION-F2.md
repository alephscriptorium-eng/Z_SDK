# GOBIERNO DE EJECUCIÓN — ÉPICA F2 (WP-U232 · P0)

Fuente de mandato: `plan/BACKLOG.md:320` (WP-U232) y épica F2 completa
(`plan/BACKLOG.md:197-360`). Alcance: los **66 WPs** de la épica
(`plan/BACKLOG.md:207-209`): U179–U231 (53) + U178 + U71R (reencuadres) +
U232–U242 (11 de la edición F2-unificada). Grafo de deps declarado por el
plan: `plan/BACKLOG.md:337-351`.

Convenciones de este documento:

- **deps int.** = otros U* de la épica. **deps ext.** = obra de otro mundo
  (owner citado, jamás prescrito — su obra se describe, no se dicta).
- **paths** = estimación honesta leyendo el árbol de este worktree; cada
  path citado existe (verificado 2026-07-31 sobre la rama
  `wp/u232-gobierno-f2`, base `2cd94f1`) salvo los marcados **(nuevo)**.
  Lo no determinable = `<pendiente>` + motivo.
- Ningún WP de F2 está despachado a fecha de este documento
  (`plan/BACKLOG.md:204`: «Estado global: nada abierto») salvo U232 (este).

---

## §1 · Mapa WP → deps → paths

### Lane A · Superficie del runtime (BACKLOG :218-227)

**U179 (P0 · :221) Ficha de runtime — matriz 51/51 explícita**
- deps int.: ninguna. Alimenta U233 y U228 (grafo :342-343).
- deps ext.: ninguna para redactar; el denominador «51» viene de la mesa
  (BACKLOG :211). **Drift observado:** el árbol tiene **48** manifests
  (`ls packages/*/*/package.json` → 48; grupos `editor/ engine/ mesh/`);
  la ficha debe reconciliar 51 vs 48 con evidencia, no heredar la cifra.
- paths: entregable documental **(nuevo)** — propuesta
  `plan/REPORTES/FICHA-RUNTIME-51.md`; lee (no edita)
  `packages/mesh/mcp-launcher/src/catalog.mjs:59` (`CATALOG_SEED`),
  `packages/engine/presets-sdk/src/env/index.mjs:239`
  (`resolveZeusMcpPorts`), `package.json:15-34` (scripts `start:*`).

**U180 (P0 · :222) Catálogo ola 1 (socket-server + ciudad-lifecycle)**
- deps int.: U233 (gate que lo mide, grafo :342). deps ext.: ninguna.
- paths: `packages/mesh/mcp-launcher/src/catalog.mjs` (seed :59; puertos ya
  por `resolveZeusMcpPorts` :14-49, cero literales según su cabecera :9),
  `packages/mesh/mcp-launcher/test/catalog.test.mjs`. Health por entrada:
  `packages/mesh/mcp-launcher/src/health.mjs`.

**U181 (P1 · :223) Catálogo ola 2 (6 UIs)**
- deps int.: U233; secuencial tras U180 (mismo fichero, ver §2).
- paths: `packages/mesh/mcp-launcher/src/catalog.mjs` + test; puertos UI:
  `packages/engine/presets-sdk/src/env/index.mjs:246`
  (`resolveZeusUiPorts`).

**U182 (P1 · :224) Presentar los 17 invisibles**
- deps int.: U233 (el manifest derivado da la lista real de invisibles).
- paths: documental **(nuevo)** + propuestas de retiro; candidatos
  observables sin consumidor claro en el árbol:
  `packages/mesh/blob-sync-harness/`, `packages/mesh/webrtc-viewer/`,
  `packages/mesh/oasis-webrtc/src/`. Lista definitiva `<pendiente>`:
  la produce U233, no este gobierno.

**U183 (P1 · :225) Entradas sin `workspace`**
- deps int.: U180 (catálogo estabilizado). deps ext.: si se cablea spawn
  externo hacia packs de juego, el pack es obra de la library (owner G) —
  solo se cita.
- paths: `packages/mesh/mcp-launcher/src/catalog.mjs:165` (`arg-player-uno`),
  `:176` (`arg-player-dos`), `:186` (`pozo-player`) — entradas con
  `spawnGroup` y sin campo `workspace` (propiedad opcional :25);
  `packages/mesh/mcp-launcher/src/process-manager.mjs` (spawn real, :3
  «No arbitrary spawn»).

**U184 (P2 · :226) `deps` de arranque declaradas**
- deps int.: U180 + U181 (entradas finales antes de declarar orden).
- paths: `packages/mesh/mcp-launcher/src/catalog.mjs` — medido:
  `grep -c "deps: \[\]"` = **14** (coincide con «hoy 14×deps:[]» del
  BACKLOG :226) + `packages/mesh/ciudad-lifecycle/src/catalog-extend.mjs`
  (6 hits más: :22 :49 :86 :102 :120 :171).

**U185 (P2 · :227) Retiro consciente**
- deps int.: U182 (auditoría) + U233 (cero invisibles al cierre).
- paths: candidato citado por el BACKLOG: `threejs-ui-lib` — vive en
  `packages/mesh/operator-ui/projects/threejs-ui-lib/` (con
  `package.json` y `ng-package.json` propios) y es referenciado por
  `packages/mesh/operator-bridge/src/index.mjs`; el retiro tocaría
  además `packages/mesh/operator-ui/angular.json` y
  `packages/mesh/operator-ui/package.json`.

### Lane B · Identidad y permiso (BACKLOG :229-238)

**U186 (P0 · :233) U93-bis · transporte ≠ permiso**
- deps int.: ninguna; desbloquea U197 → U218 (grafo :338).
- deps ext.: **paso 0 obligatorio** = pregunta estrecha a O (D-O11) sobre la
  frontera del `room-join`, y contrato de retorno a O (WP-O13) — obra de O,
  solo se cita (BACKLOG :233).
- paths: `packages/engine/webrtc-signaling/src/peer-card-gate.mjs:20-25`
  (`PEER_CARD_GATED_TYPES = ['offer','answer','ice-candidate','room-join']`),
  `packages/engine/webrtc-signaling/src/signaling-service.mjs:6` («offer/answer/ICE
  y room-join exigen peer-card válida»),
  `packages/engine/webrtc-signaling/src/messages.mjs:28`,
  `packages/engine/webrtc-signaling/test/peer-card-gate.test.mjs`.
  Lee `packages/engine/protocol/src/peer-card.mjs` (no lo edita: el corte
  de tipos gateados vive en el torno, no en protocol).

**U187 (P0 · :234) Peercard en vivo + fila Z del grafo**
- deps int.: ninguna dura; desbloquea U218 (grafo :339). Evita la ola de
  U192/U194 por vecindad de `config.mjs` (ver §2).
- deps ext.: la «fila Z del grafo» se marca en el artefacto del grafo
  holón-7 (custodio del grafo: HUB — cita, no prescripción; BACKLOG :287).
- paths: evidencia en vivo sobre
  `packages/mesh/socket-server/src/config.mjs:6` (`RELAY_UPSTREAM =
  ['CLIENT_REGISTER', …]`), cliente
  `packages/engine/rooms/src/index.mjs`; test/e2e de las 2 modalidades
  **(nuevo)** — propuesta `e2e/` o `packages/mesh/socket-server/test/`.

**U188 (P1 · :235) Unificar plano peer-card**
- deps int.: tras U186 (frontera fijada) y fuera de la ola de U197 (§2).
- paths (los «4 sitios» observados):
  `packages/engine/protocol/src/peer-card.mjs` +
  `packages/engine/protocol/src/peer-card-seat.mjs` (emisión/firma),
  `packages/engine/webrtc-signaling/src/peer-card-gate.mjs` (verificación),
  `packages/engine/embajador-kit/src/{emitir,consumir,firma-stub}.mjs`,
  `packages/engine/reparto-kit/src/permisos.mjs` (usa
  `verifyTravelingPeerCard`). **Corrección de premisa:** el BACKLOG :235
  dice «embajador-kit con 0 consumidores», pero hay 3 referencias vivas:
  `packages/mesh/operator-ui/fixtures/puerta-entry.mjs`,
  `packages/mesh/operator-ui/fixtures/puerta-smoke.mjs`,
  `packages/mesh/operator-ui/serve.mjs` — el WP debe re-medir antes de
  demoler.

**U189 (P1 · :236) Reúso de card entre niveles**
- deps int.: U186 + U187 (semántica de sesión fijada). Aporte al hilo Z·G:
  el modelo de niveles (edificio→barrio→ciudad) es conversación con G —
  cita, no prescripción.
- paths: `e2e/peer-card-chain.mjs` (existe), contrato **(nuevo)**
  documental; test de no-elevación en
  `packages/mesh/socket-server/test/` `<pendiente>` fichero exacto
  (depende del punto de relay elegido).

**U190 (P2 · :237) `seat` y firma de asiento**
- deps int.: U188 (un solo punto de verificación antes de endurecer).
- paths: `packages/engine/protocol/src/peer-card-seat.mjs:110-117`
  (hoy: `seatSignature missing`/`malformed` solo al verificar — la matriz
  de exigencia por acción no existe), consumidores:
  `packages/engine/webrtc-signaling/src/peer-card-gate.mjs`,
  `packages/engine/reparto-kit/src/permisos.mjs`.

**U191 (P2 · :238) Revocación**
- deps int.: U188 (camino único de emisión/consumo) + U190.
- paths: `packages/engine/protocol/src/peer-card.mjs` (frescura:
  `isPeerCardFresh` importado en peer-card-gate.mjs:12) +
  `packages/engine/webrtc-signaling/src/peer-card-gate.mjs`; mecanismo de
  revocación en caliente **(nuevo)** — `<pendiente>` diseño: la card se
  declara «credencial revocable» en prosa
  (`packages/engine/protocol/src/peer-card.mjs:2`) pero no existe lista ni
  verificación de revocación en el código (único otro hit de `revoc` en
  packages: `packages/mesh/ssb-system/src/types.mjs:18`
  `parliamentRevocation`, tipo de mensaje de dominio, ajeno).

### Lane C · Transporte y federación (BACKLOG :240-250)

**U192 (P0 · :244) Traza de lo descartado en relay**
- deps int.: ninguna. deps ext.: ninguna.
- paths: `packages/mesh/socket-server/src/relay.mjs:18` (`if (inner !==
  'MAKE_MASTER')` — supresión silenciosa) y `:43` (`if
  (RELAY_UPSTREAM.includes(event)) return;` — descarte sin rastro),
  `packages/mesh/socket-server/src/config.mjs:8`
  (`RELAY_DOWNSTREAM_TOP` = allowlist de 8: SET_STATE, deck:resolved,
  deck:error, catalog:servers, state, intent, ledger, track) + test.

**U193 (P1 · :245) Identidad en el puente**
- deps int.: tras U192 (mismo fichero, §2).
- paths: `packages/mesh/socket-server/src/relay.mjs:29`
  (`new SocketClient('scriptorium-bridge', …)` — emisor único que colapsa
  identidad) + test.

**U194 (P1 · :246) Allowlist como contrato**
- deps int.: tras U192 (misma zona); versiona lo que U192 hace trazable.
- paths: `packages/mesh/socket-server/src/config.mjs:6-8` → contrato
  versionado + test **(nuevo)**; posible proyección al spec:
  `packages/engine/protocol/spec/` `<pendiente>` (decisión de diseño del
  WP: contrato local vs spec compartido).

**U195 (P2 · :247) Duplicación de reemisión**
- deps int.: tras U196 (semántica de zonas puede cambiar el fan-out).
- paths: `packages/engine/socket-core/src/server.mjs` +
  `packages/engine/socket-core/src/client.mjs` (ambos emiten/reciben
  `ROOM_MESSAGE`; el doble-suscriptor recibe sobre + evento desenvuelto),
  `packages/engine/rooms/src/index.mjs`; tests de ambos paquetes.

**U196 (P1 · :248) Zonas como ámbito real**
- deps int.: ninguna dura; alimenta U217 (barrio=ámbito).
- paths: `packages/engine/rooms/src/index.mjs:47-78` (`zones` como interés
  opaco en CLIENT_SUSCRIBE) + `packages/engine/socket-core/src/server.mjs`
  (lado servidor del filtro) + tests.

**U197 (P1 · :249) Signaling anónimo WebRTC**
- deps int.: **U186** (grafo :338). deps ext.: STUN/TURN de despliegue =
  ops (owner O) — cita.
- paths: `packages/engine/webrtc-signaling/src/peer-card-gate.mjs` (retirar
  el gate de la antesala si U186 lo confirma),
  `packages/engine/webrtc-signaling/src/socket-room-signaling.mjs`,
  `packages/engine/presets-sdk/src/env/index.mjs` (ICE servers — test
  `packages/engine/presets-sdk/test/env-ice-servers.mjs` existe),
  `e2e/webrtc-signaling.mjs`.

**U198 (P2 · :250) coturn + pub SSB de facto**
- deps int.: U197. deps ext.: VPS/pub del operador (custodio) — la
  evidencia de ejecución exige entorno que el repo no contiene.
- paths: `docs/mesh/coturn-runbook.md` (runbook nunca ejecutado),
  `packages/engine/webrtc-signaling/src/ssb-private-signaling.mjs`
  (DM-signaling), `e2e/ssb-webrtc-signaling.mjs`. Evidencia contra sbot
  vivo `<pendiente>`: requiere tick de operador con pub real.

### Lane D · Plano de datos (BACKLOG :252-267) — **ola con contención propia**

**U199 (P0 · :256) C-3 + sellado-hash**
- deps int.: cabeza de la cadena (grafo :340). deps ext.: compromiso D-45
  de la mesa — cita.
- paths: `packages/engine/volumes-ops/src/counters.mjs:2` («Rewrite
  volumes.json counters from live measurement»), `:25`
  (`configPath = join(root, 'volumes.json')`), `:48` (`writeFileSync` sobre
  el manifiesto — la mutación a demoler); `VOLUMES/volumes.json` (RO+hash);
  **(nuevo)** `VOLUMES/volumes.state.json` (grep `volumes.state` = 0 hits
  hoy); `packages/engine/volumes-ops/src/{measure,ledger,contract}.mjs`;
  consumidor que debe seguir vivo:
  `packages/engine/firehose-core/src/loader.mjs` + test
  `packages/engine/firehose-core/test/browse-loader.test.mjs`.

**U200 (P0 · :257) Resolver único · env obligatorio**
- deps int.: → U201 (grafo :341).
- paths: `packages/engine/presets-sdk/src/volumes/resolve.mjs:9-13`
  («Honors ZEUS_VOLUMES_ROOT; defaults to MONOREPO_ROOT/VOLUMES» — el
  default a demoler como camino de producto),
  `packages/engine/linea-kit/src/validate.mjs:132` (resolver ascendente
  propio: `if (process.env.ZEUS_VOLUMES_ROOT) …`), tests de ambos.

**U201 (P0 · :258) Contrato de import v1**
- deps int.: U199 + U200 (grafo :340-341).
- deps ext.: `CONTRATO-IMPORT-PACK-v0` citado en BACKLOG :258 — en este
  árbol solo aparece nombrado en `plan/BACKLOG.md` y `sincronia/`
  (grep); el texto fuente v0 **no está** en `plan/` → primer acto del WP:
  materializarlo o citar su origen durable.
- paths: `packages/engine/volumes-ops/src/{contract,catalog,empty}.mjs`,
  pipeline de import **(nuevo)** (propuesta:
  `packages/engine/volumes-ops/src/import.mjs` + tests).

**U202 (P0 · :259) Driver LINEAS**
- deps int.: U201.
- paths: `VOLUMES/DISK_02/LINEAS/registry.yaml` (existe; fixture
  sintética), `packages/engine/linea-kit/src/loader.mjs:336-361`
  (`resolveRegistroDir`, sidecars `*.md` curados — la curación a proteger),
  `packages/engine/linea-kit/src/curation.mjs:44-48` (claves
  `curation_status`/`delta_status`), fixtures
  `packages/engine/linea-kit/test/fixtures/lineas/registry.yaml`.
  Nota honesta: `registro.md`/`delta.md` como ficheros **no existen** en
  las fixtures del árbol (find = 0); son artefactos del volumen vivo del
  operador — el driver debe protegerlos por contrato, con fixture nueva.

**U203 (P1 · :260) Driver FORCES**
- deps int.: U201. deps ext.: `startpack-pozo` = pack de la library
  (owner G) — cita.
- paths: `VOLUMES/DISK_03/FORCES/registry.json`,
  `packages/mesh/force-system/src/{loader,logic,config}.mjs`, fixtures
  `packages/engine/linea-kit/test/fixtures/forces/registry.json`.
  Censo FORCES: `plan/DATOS.md:226` («12 corpus»).

**U204 (P1 · :261) Driver FIREHOSE**
- deps int.: U201.
- paths: `packages/engine/feed-kit/src/jetstream-sync.mjs` (:22 opera bajo
  `ZEUS_VOLUMES_ROOT`), `packages/engine/feed-kit/bin/jetstream-sync.mjs`,
  `packages/engine/firehose-core/src/{schema,browse}.mjs`. La cifra
  «8.388 del censo» (BACKLOG :261) **no aparece** en `plan/DATOS.md` ni
  `VOLUMES/` (grep = 0) → `<pendiente>` fuente del censo; el WP debe
  citarla o re-medir.

**U205 (P1 · :262) Driver SSB**
- deps int.: U201.
- paths: `packages/mesh/ssb-system/src/{export,loader,sync-cli}.mjs`
  (export.mjs:34-44 emite `{key,value,content,corpus}` — verificar que
  ninguna clave privada viaja), test + fixture. Contexto:
  `plan/DATOS.md:72` (falta exportador SSB→JSON completo, WP-U84
  histórico).

**U206 (P0 · :263) CA local-first + réplica A→B**
- deps int.: U202–U205 (grafo :340); cierra la cadena.
- paths: runner de los 7 pasos **(nuevo)** (propuesta
  `e2e/local-first-ca.mjs` o `scripts/`), usa
  `packages/engine/volumes-ops/src/measure.mjs:63-127` (medición
  idéntica A→B) y el shape pozo de la library (owner G — cita).

**U207 (P1 · :264) Porte one-off de la genealogía**
- deps int.: U202 (driver LINEAS) + U204 (FIREHOSE) + U203 (FORCES).
- deps ext.: corpus fuente `linea-aleph` vive fuera del repo
  (`plan/DATOS.md:27`: «Fuente viva: `SCRIPTORIUM_V0/network-engine/
  linea-aleph/`»; formato en :38-41) — inyección por env del operador,
  como en U176.
- paths: `scripts/import-legado/{importar,escribir,fuente,ids,validar}.mjs`
  (tooling U176 existente, a extender con `--check`).

**U71R (P2 · :265) Anclaje por contenido = fuente de import**
- deps int.: U201 (el import es el único camino) + U206.
- paths: procedencia inerte en manifiesto:
  `VOLUMES/volumes.json:12-14` (`source.remotePath` con env — patrón a
  formalizar), `plan/DATOS.md:120` (clave natural `<oldid>.wikitext`);
  verificación «0 URLs vivas en root» **(nuevo)** gate/test.

**U208 (P1 · :266) `cache_wikitext` acotado**
- deps int.: U206 (arranque sin red probado antes de acotar la
  excepción).
- paths: `packages/mesh/linea-system/src/cache-wikitext.mjs` (existe como
  módulo dedicado), `packages/engine/linea-kit/src/tools/{conectar-satelite,
  segmentar}.mjs`, `packages/engine/linea-kit/src/loader.mjs`,
  `packages/mesh/linea-system/src/{linea-server,logic}.mjs`.

**U209 (P1 · :267) Root VPS ≡ local**
- deps int.: U199 (manifiesto hasheable) + U201.
- deps ext.: **ruta del volumen VPS = custodio** (grafo :349) — sin esa
  señal no hay despacho.
- paths: `.dockerignore` **(nuevo — verificado: no existe** en la raíz del
  worktree), `VOLUMES/README.md`, validación del mismo manifiesto en dos
  hosts `<pendiente>` (depende de la ruta VPS del custodio).

### Lane E · Canal y verdad de la documentación (BACKLOG :269-279)

**U210 (P0 · :273) Puente documental ◆4(b)**
- deps int.: arranca ya; **no cierra** sin U212 (BACKLOG :347).
- deps ext.: contraparte 4(a) en `startpack-kit` = obra de **G** (BACKLOG
  :347 y :358) — cita.
- paths: `docs/guide/` (grep `volumesRoot|ZEUS_VOLUMES_ROOT` en `docs/`
  = 0 hits hoy — el puente documental es prosa nueva, no corrección),
  `VOLUMES/README.md` (tras U211, ver §2).

**U211 (P0 · :274) Reparar `VOLUMES/README.md`**
- deps int.: ninguna. Los 2 defectos citados existen:
  `VOLUMES/README.md:24` (`npm install @zeus/startpack-delta` — E404 en
  registry, hecho de canal en BACKLOG :923) y `:26-27`
  (`ZEUS_VOLUMES_ROOT` apuntando al `volumes/` del pack — contra cerco).
- paths: `VOLUMES/README.md` (único fichero).

**U212 (P1 · :275) CA de canal limpio C-4**
- deps int.: U210/U211 (doc verdadera antes de probarla).
- deps ext.: pack por Release = canal de la library (owner G) — cita.
- paths: `scripts/smoke-external-consumer.mjs` (existe, a extender),
  `.github/workflows/release.yml` (cableo del CA).

**U178 (P1 · :276) `linea-editor` publish-ready**
- deps int.: reencuadre del WP existente; deps U168 ✅ + U169 ✅ y **GO
  implementación propio** (BACKLOG :453-462) — despacho condicionado.
- paths: según su brief existente
  `plan/REPORTES/briefs/WP-U178-publish-ready-linea-editor.md`:
  `packages/mesh/linea-editor/package.json`, changeset, matriz CI.

**U213 (P2 · :277) Allowlist como inventario vivo**
- deps int.: U236 (matriz de distribución da el criterio).
- paths: `scripts/audit-publish-allowlist.mjs` + `package.json:131`
  (`audit:publish-allowlist` ya existe como script) →
  `.github/workflows/ci.yml` (cableo en CI, hoy ausente).

**U214 (P1 · :278) Smoke consumidor externo ampliado**
- deps int.: ninguna dura; gana valor tras U233 (clases por manifest).
- paths: `scripts/smoke-external-consumer.mjs` (existe; ampliar a una
  pieza por clase: engine/servicio/app).

**U215 (P2 · :279) `DATOS.md` al día con el censo**
- deps int.: U199 (medición) + U203/U204 (cifras por driver).
- paths: `plan/DATOS.md` (FORCES :226; secciones firehose :71-77).

### Lane F · Ciudad en el runtime (BACKLOG :281-289)

**U216 (P1 · :285) `tree.{barrio,edificio,maquinaria}` (Z12)**
- deps int.: U180 (catálogo estable). deps ext.: **G fija qué es un
  barrio** (grafo :348) — despacho condicionado.
- paths: `packages/mesh/ciudad-lifecycle/src/catalog-extend.mjs:2-3`
  («tree fields + f1 city leaves (3 barrios)» ya seed) + `:8-22`
  (`ARBOL_F1.barrios`), `packages/mesh/ciudad-lifecycle/src/project.mjs`.

**U217 (P1 · :286) Barrio = ámbito, no proceso**
- deps int.: U196 (zonas) + U216 (mismo fichero → encadenado, §2).
- paths: `packages/mesh/ciudad-lifecycle/src/catalog-extend.mjs`,
  `packages/mesh/mcp-launcher/src/catalog.mjs` (que ningún consumidor
  confunda barrio con servicio), `packages/engine/rooms/src/index.mjs`
  (zonas, lectura).

**U218 (P0 · :287) Holón-7 completo**
- deps int.: U186, U187, U197 (grafo :338-339).
- deps ext.: **Z no marca 7/7 solo** — filas de HUB-022 (grafo), V18,
  O12, G50, fila L y fila custodio (BACKLOG :287): cada fila la marca su
  dueño; aquí solo se citan.
- paths: `packages/engine/lifecycle-kit/src/{aggregate-machine,cascade,
  intent-signal,leaf-machine,transitions}.mjs`,
  `packages/mesh/ciudad-lifecycle/src/{runtime,wake-sync}.mjs`; evidencia
  de log por marca **(nuevo)** en reporte.

**U219 (P2 · :288) Story-board + reparto en ronda**
- deps int.: U206 (pack importado como fuente de elenco/actos).
- paths: `packages/engine/story-board-schema/{schemas,src,test}/`,
  `packages/engine/reparto-kit/src/`, ronda real `<pendiente>` punto de
  cableado (depende del orquestador U234 y del juego G — cita).

**U220 (P2 · :289) Dramaturgo: curación en vivo**
- deps int.: U202 (protección de curación) + U219.
- paths: `packages/engine/linea-kit/src/curation.mjs:44-48`
  (`delta_status`), `packages/mesh/linea-editor/src/` (superficie de
  curación en juego), reimport vía driver U202.

### Lane G · Observabilidad, gates y estación (BACKLOG :291-300)

**U221 (P1 · :295) Gate de arranque offline en CI**
- deps int.: U206 (el CA local-first que se promueve a gate).
- paths: `.github/workflows/ci.yml` + runner del CA (el de U206).

**U222 (P1 · :296) Falso positivo regla 15**
- deps int.: ninguna. deps ext.: fix de método = porte del skill (owner
  **L**, BACKLOG :296) — cita.
- paths: `scripts/estacion/{run-watcher.sh,checks-031.sh}`,
  `plan/ESTACION.md`; el espejo `.claude/skills/` está gitignorado
  (contexto U147, BACKLOG :1169-1185).

**U223 (P1 · :297) Mapas `plan/MAPA-*` (#19)**
- deps int.: ninguna — «requisito del swarm F2» (BACKLOG :297) → ola
  temprana. Verificado: `ls plan/MAPA-*` = **no existen** hoy.
- paths: **(nuevos)** `plan/MAPA-RAIZ.md`, `plan/MAPA-REPO.md`,
  `plan/MAPA-TALLER.md` (plantillas del método, referencia
  `reference/plantillas/MAPA-*.md.tpl` del skill — cita de método, no
  path del repo) + gate `verificar-territorio-mapa` `<pendiente>` su
  ubicación (script del paquete de skills vs copia en `scripts/`).

**U224 (P2 · :298) Anomalía del segundo conductor**
- deps int.: ninguna.
- paths: `plan/REPORTES/entregas/CONTRARREVISION-U169-PASS.md` (existe);
  entregable forense **(nuevo)** en `plan/REPORTES/`.

**U225 (P1 · :299) Nunca reconciliar por mtime/tamaño**
- deps int.: U199 (el hash del manifiesto es la alternativa).
- paths: `packages/engine/volumes-ops/src/measure.mjs:20-98` (medición
  actual) + test **(nuevo)** «mtime/size no deciden nada»;
  `plan/PRACTICAS.md` si se asienta como regla.

**U226 (P2 · :300) Estación reanudable**
- deps int.: U222 (mismo territorio de estación → secuencial).
- paths: `scripts/estacion/run-watcher.sh`, `plan/ESTACION.md`;
  `timbre-watch.log` es runtime local (gitignorado, no en árbol).

### Lane H · Fronteras con otros carriles (BACKLOG :302-310)

**U227 (P0 · :306) Env de la demo generado**
- deps int.: ninguna dura. deps ext.: **O propone, Z valida** (BACKLOG
  :306) — el compose es obra de O; aquí solo el generador.
- paths: `packages/engine/presets-sdk/src/env/index.mjs:21`
  (`loadZeusEnv`), `:167` (`readEnvPort`), `:239-246` (resolvers MCP/UI);
  generador **(nuevo)** (propuesta `scripts/`); destino del env generado
  `<pendiente>` (lo fija el intercambio con O).

**U228 (P0 · :307) Cinco datos por servicio para O**
- deps int.: **U179** (grafo :343 — deriva de la ficha).
- deps ext.: consumidor = O (compose) — cita.
- paths: entregable documental **(nuevo)** derivado de la ficha U179
  (misma fuente de datos; propuesta `plan/REPORTES/` o `docs/mesh/`).

**U229 (P1 · :308) Contrato IDE opt-in v2**
- deps int.: ninguna dura (v1 cerrado). deps ext.: la «duda 5 de V» —
  verificación de V, cita.
- paths: `plan/REPORTES/CONTRATO-IDE-OPT-IN-v1.md` (existe),
  `packages/mesh/linea-editor/src/{gate,config,editor-server}.mjs`
  (`reparto_required` presente en los tres — grep) + payload de
  denegación + test `packages/mesh/linea-editor/test/reparto-autoria.test.mjs`.

**U230 (P1 · :309) Frontera L1/L2 desde el runtime**
- deps int.: U205 (driver SSB = el canal de cristalización).
- paths: `packages/mesh/ssb-system/src/{logic,export}.mjs`; contexto
  `plan/DATOS.md:77` («capa 2 … sobre SSB es hoy» — la frontera está en
  prosa, no en código); punto exacto de cristalización L2→L1
  `<pendiente>`: hoy no hay código que cristalice (grep `cristaliz` en
  `packages/*/*/src` = 0 hits; único hit de `"L1"` = un test de roles
  ajeno, `packages/engine/protocol/test/roles.test.mjs`); el WP lo crea.

**U231 (P0 · :310) Invariante de secretos en datos**
- deps int.: tras cierre de la ola de datos (gate sobre VOLUMES estable).
- deps ext.: GATE-O-CLAVES = doctrina de O (solo citada; grep en este
  árbol la sitúa únicamente en `plan/BACKLOG.md` y `sincronia/notas/`).
- paths: gate **(nuevo)** en `scripts/gates/` (patrón existente:
  `scripts/gates/{run,scan,exceptions}.mjs`), objetivo `VOLUMES/**` y
  contexto de imagen (cuando exista Dockerfile — hoy no hay
  `.dockerignore`, ver U209).

### Lane I · Gobierno, producto y aceptación v1 (BACKLOG :312-330)

**U232 (P0 · :320) Gobierno de ejecución F2** — este documento.
- paths: `plan/GOBIERNO-EJECUCION-F2.md` (este fichero).

**U233 (P0 · :321) Gate matriz 51/51**
- deps int.: **U179** (grafo :342); desbloquea U180–U185.
- paths: `scripts/gates/{run,scan,exceptions}.mjs` (patrón), gate nuevo
  **(nuevo)** `scripts/gates/` + manifest **derivado** (no transcrito) de
  los 48 `packages/*/*/package.json` + catálogo
  `packages/mesh/mcp-launcher/src/catalog.mjs:59`; reconciliación 51 vs
  48 obligatoria (ver U179).

**U234 (P0 · :322) Orquestador de runtime v1**
- deps int.: U180 (catálogo/deps como fuente).
- deps ext.: consumidores V (mando de ciudad V34) y O (compose O22) —
  grafo :345, solo citados.
- paths: `package.json:34` (`start:all` solo imprime `echo` — el hecho a
  demoler) y `:33` (`start:v1-zeus` ídem),
  `packages/mesh/mcp-launcher/src/{process-manager,start,health}.mjs`,
  `packages/mesh/ciudad-lifecycle/src/{runtime,start,server}.mjs`.

**U235 (P0 · :323) Aceptación Z-v1**
- deps int.: **último gate**: U206 + U218 + U233 + U234 (grafo :350).
- deps ext.: juego G cargado = pack de la library (owner G) — cita;
  actores/operador externo (test del operador, cara Z).
- paths: e2e **(nuevo)** (propuesta `e2e/aceptacion-z-v1.mjs`), usa
  `packages/engine/game-engine/src/map-engine.mjs:91` (`applyIntent`) como
  punto de intent observado; artifact inventory **(nuevo)**. La DoD que
  este e2e implementa es el §7 de este documento.

**U236 (P1 · :324) Matriz de distribución**
- deps int.: U233 (clases por pieza). deps ext.: consumidor V20
  (documento de puertas) — grafo :346, cita.
- paths: `plan/PUBLISH-ALLOWLIST.md` (existe) + matriz **(nuevo)**
  documental; verificación de canal: `scripts/gate-publish-ready.mjs`.

**U237 (P0 · :325) Licencia SPDX por workspace**
- deps int.: ninguna. deps ext.: **el custodio decide** la licencia
  (BACKLOG :325) — despacho tras esa decisión.
- paths: `package.json:157` (`"license": "AIPLv1"` — no es identificador
  SPDX válido), los 48 `packages/*/*/package.json` (48/48 con
  `"license": "AIPLv1"`, medido por grep), `LICENSE.md:1` («Animus
  Iocandi (composite)» — inconsistencia confirmada), docs.

**U238 (P1 · :326) SBOM / provenance / reproducibilidad**
- deps int.: U237 (licencia coherente antes de sellar artefactos).
- paths: `.github/workflows/release.yml`, tooling SBOM **(nuevo)** en
  `scripts/`.

**U239 (P0 · :327) Triage de vulnerabilidades**
- deps int.: ninguna dura. Contexto medido en cola residual:
  `plan/BACKLOG.md:1572` («npm audit: 53 vulns (6 críticas) preexistentes
  en árbol dev»).
- paths: `package-lock.json` (si hay bumps), veredictos **(nuevo)**
  documental en `plan/REPORTES/`; «explotable bloquea release» →
  `.github/workflows/release.yml`.

**U240 (P1 · :328) Backup/restore del plano de datos**
- deps int.: U206 (CA local-first como verificación post-restore) + U205
  (secuencias SSB preservadas).
- paths: scripts **(nuevo)** `scripts/`, opera sobre `VOLUMES/**` y
  `packages/engine/volumes-ops/src/measure.mjs` (verificación).

**U241 (P1 · :329) Resiliencia y presupuestos**
- deps int.: U234 (orquestador con el que se mata/recupera).
- paths: e2e de caída **(nuevo)**, presupuestos en
  `.github/workflows/ci.yml`.

**U242 (P1 · :330) Contrato de plugin/driver**
- deps int.: U201–U205 (el contrato que se prueba desde fuera).
- paths: `packages/engine/volumes-ops/src/contract.mjs`, driver externo
  fixture **(nuevo)** (fuera de `packages/` core o en `test/`); CA «cero
  ediciones en core» se mide por diff.

---

## §2 · Ficheros calientes (≥2 WPs → nunca misma ola)

| fichero/zona | WPs en conflicto | resolución en §3 |
| --- | --- | --- |
| `packages/mesh/mcp-launcher/src/catalog.mjs` | U180 · U181 · U183 · U184 · U185 · U217 (lectura+alineación) | olas 3→4→5→6→P2-b; U217 en C-ext |
| `packages/mesh/ciudad-lifecycle/src/catalog-extend.mjs` | U216 · U217 | encadenados (worker único) en C-ext |
| `packages/mesh/ciudad-lifecycle/src/runtime.mjs` | U234 · U218 | olas 2 y 5 |
| `packages/mesh/socket-server/src/relay.mjs` | U192 · U193 | olas 1 y 4 |
| `packages/mesh/socket-server/src/config.mjs` | U192 · U194 · U187 (evidencia) | U192 ola 1 · U194 ola 3; U187 (ola 2) solo lectura/evidencia — prohibido editarlo en su brief |
| `packages/engine/webrtc-signaling/src/peer-card-gate.mjs` | U186 · U197 · U188 · U190 · U191 | olas 1→3→4→P2-a→P2-b |
| `packages/engine/protocol/src/peer-card*.mjs` | U188 · U190 · U191 (U186 solo lee) | olas 4→P2-a→P2-b |
| `packages/engine/rooms/src/index.mjs` | U187 (lee) · U196 · U217 (lee) | edición solo U196 (ola 4) |
| `packages/engine/socket-core/src/server.mjs` | U196 · U195 | olas 4 y P2-a |
| `packages/engine/volumes-ops/src/*` | U199 · U201 · U225 · U242 · U240 (lee) | U199/U201 dentro del carril D; U225 ola 5; U242 ola 7 |
| `VOLUMES/volumes.json` + `VOLUMES/DISK_*` | U199 · U202 · U203 · U231 · U240 · U71R | carril D (worker único); U231 ola 4; U240 ola 7; U71R P2-b |
| `VOLUMES/README.md` | U211 · U210 · U209 | U211 ola 1 → U210 ola 2 → U209 C-ext |
| `packages/engine/linea-kit/src/loader.mjs` | U202 · U208 | carril D → ola 6 |
| `packages/engine/linea-kit/src/curation.mjs` | U202 · U220 | carril D → P2-b |
| `packages/mesh/linea-editor/src/*` | U229 · U178 · U220 | U229 ola 6; U178 C-ext (gate de despacho verifica que U229 cerró); U220 P2-b |
| `packages/engine/presets-sdk/src/env/index.mjs` | U227 · U197 (lee) · U234 (lee) | edición solo U227 (ola 2) |
| `package.json` (raíz) | U234 · U213 · U233 (posible script) · U237 (license) · U239 (lock) | un solo owner por ola: U237 ola 1 (solo campo `license`) · U234 ola 2 · U213 ola 8; U233 entrega gate invocable por `node` sin tocar package.json |
| `packages/*/*/package.json` (48 manifests) | U237 · cualquier WP que añada dep | regla de ola 1: **solo U237** toca manifests; el resto de briefs de la ola lo prohíben |
| `.github/workflows/ci.yml` | U221 · U241 · U213 · U233 (candidato) | U221 ola 5 → U241 ola 7 → U213 ola 8 |
| `.github/workflows/release.yml` | U212 · U239 · U238 | U212 ola 6 → U239 ola 7 → U238 ola 8 |
| `plan/PUBLISH-ALLOWLIST.md` | U236 · U213 (lee) · U178 | U236 ola 6; U178 C-ext |
| `scripts/gates/*` | U233 · U231 | olas 2 y 4 |
| `scripts/estacion/*` | U222 · U226 | ola 6 → P2-a |
| `scripts/smoke-external-consumer.mjs` | U214 · U212 (lee patrón) | U214 ola 5; U212 (ola 6) crea el suyo o reusa sin editar |
| `scripts/import-legado/*` | U207 · U71R | ola 5 → P2-b |

---

## §3 · Olas (lotes con alcance disjunto + orden por deps)

Regla general: gate al cierre de cada ola (revisión ordinaria +
contrarrevisión §5 donde aplique) antes de despachar la siguiente. Ningún
par de la misma ola comparte fichero de §2 en modo edición (verificación
en §CA, abajo).

**Carril D — ola de datos U199–U206 (contención propia, BACKLOG :320).**
**Worker único encadenado**: un solo worker, WPs secuenciales
U199 → U200 → U201 → U202 → U203 → U204 → U205 → U206, una rama por WP,
merge antes de abrir el siguiente. Nadie más toca
`packages/engine/volumes-ops/**`, `VOLUMES/**` (salvo `README.md`, owner
U211/U210), `packages/engine/presets-sdk/src/volumes/**`,
`packages/engine/linea-kit/src/{validate,loader,curation}.mjs`,
`packages/mesh/force-system/src/**`,
`packages/engine/feed-kit/src/jetstream-sync.mjs`,
`packages/engine/firehose-core/src/**`, `packages/mesh/ssb-system/src/**`
mientras el carril viva. Arranca con la ola 1; su gate propio **GD** =
CA local-first de U206 verde (7 pasos, BACKLOG :263).

| ola | WPs (∥ dentro de la ola) | precondición (deps §1) | gate |
| --- | --- | --- | --- |
| **0** | U232 (este) | — | aceptación U232 = DoD escrita antes del primer despacho |
| **1** | U179 ∥ U186 ∥ U192 ∥ U237 ∥ U211 ∥ U223 · arranca carril D | U232 ✅; U237 además: decisión de licencia del custodio | G1 |
| **2** | U233 ∥ U228 ∥ U187 ∥ U234 ∥ U210 ∥ U227 | U179 ✅ (U233, U228) · U180 no requerido para U234 (usa catálogo actual; re-verifica tras ola 3) | G2 |
| **3** | U180 ∥ U194 ∥ U197 · carril D cierra (U206) | U233 ✅ (U180) · U192 ✅ (U194) · U186 ✅ (U197) | G3 + GD |
| **4** | U181 ∥ U188 ∥ U193 ∥ U196 ∥ U231 | U180 ✅ (U181) · U186 ✅ (U188) · U192 ✅ (U193) · GD (U231) | G4 |
| **5** | U218 ∥ U183 ∥ U189 ∥ U221 ∥ U214 ∥ U225 ∥ U207 | U186+U187+U197 ✅ (U218; filas externas pueden quedar ⏳ con dueño citado) · U181 ✅ (U183) · U188 ✅ (U189) · GD (U221, U225, U207) | G5 |
| **6** | U184 ∥ U212 ∥ U236 ∥ U229 ∥ U222 ∥ U230 ∥ U208 ∥ U182 — **8 WPs: despacho en 2 tandas (6+2) bajo el mismo gate (§4)** | U183 ✅ (U184) · U210/U211 ✅ (U212) · U233 ✅ (U236, U182) · GD (U208, U230) | G6 |
| **7** | U239 ∥ U240 ∥ U241 ∥ U242 | U237 ✅ recomendado (U239) · GD (U240, U242) · U234 ✅ (U241) | G7 |
| **8** | U235 ∥ U238 ∥ U213 ∥ U215 | **U206 + U218 + U233 + U234 ✅** (U235, grafo :350) · U239 ✅ (U238) · U236 ✅ (U213) · GD (U215) | G8 = DoD Z-v1 §7 ejecutada |
| **P2-a** | U190 ∥ U195 ∥ U198 ∥ U224 ∥ U226 ∥ U219 | U188 ✅ (U190) · U196 ✅ (U195) · U197 ✅ (U198) · U222 ✅ (U226) · U206 ✅ (U219) | GP2a |
| **P2-b** | U185 ∥ U191 ∥ U220 ∥ U71R | U182+U233 ✅ (U185) · U190 ✅ (U191) · U202 ✅ (U220) · U201+U206 ✅ (U71R) | GP2b |
| **C-ext** (condicionada a señal externa; despacho individual al llegar) | U216→U217 (worker único encadenado: comparten `catalog-extend.mjs`) · U209 · U178 | señal de G «qué es un barrio» (U216/U217) · ruta VPS del custodio (U209) · GO impl. propio + D-42 (U178); el gate de despacho verifica además que U229 haya cerrado antes de U178 (fichero caliente `linea-editor`) | GC (uno por señal) |

Las olas P2-a/P2-b pueden intercalarse tras G6/G7 si hay capacidad, sin
adelantar nunca un WP a la ola donde su fichero caliente sigue ocupado
(§2). C-ext no tiene posición fija: cada señal externa abre su despacho,
con verificación de solape contra la ola activa en ese momento.

---

## §4 · Techo de workers por ola + criterio

**Techo: 6 workers de ola en paralelo + 1 worker fijo del carril D
(mientras viva) = 7 máximo simultáneos.**

Criterio:

1. **Revisión no se apila**: la revisión ordinaria es de un solo
   orquestador; >6 reportes por gate degrada la revisión a diagonal, que
   es exactamente lo que la contrarrevisión §5 no puede compensar.
2. **Contrarrevisión limitada**: máximo **3 WPs con contrarrevisión
   obligatoria por ola** (las olas 1–4 ya cumplen); si una ola excede,
   se despacha en tandas (ola 6: 8 WPs → tandas 6+2, la segunda entra
   cuando la primera tiene reporte entregado).
3. **Carril D no computa contra el techo de ola**: es 1 worker constante
   con territorio propio cerrado (§3), sin ficheros compartidos con las
   olas 1–2 por construcción.
4. **Un WP = un worker = una rama = un worktree** (regla 1 del método);
   el techo es de workers *simultáneos*, no de WPs por ola.
5. **C-ext no consume techo planificado**: se despacha al llegar la señal,
   ocupando hueco libre del techo vigente; si no hay hueco, espera.

---

## §5 · Contrarrevisión por riesgo (read-only, pre-aceptación)

Marco del mundo: `plan/PRACTICAS.md:300` («la contrarrevisión es
**obligatoria** cuando el WP toca…») + roles :322-324 (revisor distinto de
worker y orquestador, read-only; el PASS precede al ✅ pero no lo concede)
+ checklist existente `plan/REPORTES/CHECKLIST-CONTRARREVISION.md`.

Clases que **exigen contrarrevisión adversarial** en F2, y su prueba
mínima (siempre con la cara **hostil-omite**: probar la AUSENCIA — campo
omitido, firma no aportada, opt-in off — no solo el envío malformado; el
default de lo ausente **deniega**):

| clase (frontera de confianza) | WPs | prueba mínima del revisor (reproducida, no leída) |
| --- | --- | --- |
| **Relay / allowlist / federación** | U192 · U193 · U194 · U196 · U195 | inyectar evento fuera de allowlist y verificar rastro con motivo; **hostil-omite:** evento sin campo de origen/zona → no propaga y queda trazado; allowlist sin versión declarada → gate falla |
| **Peercard / identidad / permiso** | U186 · U187 · U188 · U189 · U190 · U191 · U218 (marcas de permiso) | card inválida **rechaza, no degrada a anónimo** (CA de U186, BACKLOG :233); **hostil-omite:** sin card → transporte sí, acción con rol **denegada**; `seatSignature` **no aportada** donde la matriz la exige → deniega (no «si viene, valida», peer-card-seat.mjs:110); relay no eleva scopes en cadena (U189) |
| **Secretos / datos** | U231 · U205 · U240 · U199 (sellado) | grep de claves privadas en export/tarball/manifiesto = 0 con conteo literal; **hostil-omite:** volumen sin manifiesto/hash → import aborta; restore sin verificación → falla, no «restaura a ciegas»; corrupción inyectada **falla** (paso 6 del CA U206) |
| **Licencia / publicación / canal** | U237 · U236 · U238 · U213 · U178 · U239 (bloqueo release) | SPDX válido en los 48+raíz y coherente con `LICENSE.md`; **hostil-omite:** manifest sin `license` → gate falla; pieza fuera de allowlist que aparece en canal → gate falla; vulnerabilidad crítica **sin veredicto** → release bloqueado (la ausencia de triage deniega) |
| **Gates que conceden** | U233 · U221 · U235 · U225 | fail-probe obligatoria: el revisor construye el caso rojo (pieza 52/pieza faltante; ronda con red; paso omitido de la DoD) y verifica exit ≠ 0; **hostil-omite:** fila sin evidencia ni ⏳ → gate falla, no advierte |
| **Migración / one-off con fuente externa** | U207 · U71R · U242 | `--check` verde antes de escribir; ceguera de vocabulario legado (conteo literal 0); driver externo montado **sin** ediciones en core (diff = solo fixture) |

WPs de F2 **sin** contrarrevisión obligatoria (revisión ordinaria basta):
U179, U180–U185, U197*, U198, U200–U204, U206*, U208–U212, U214–U217,
U219–U230, U232, U234, U241 — con dos asteriscos: U197 la hereda si
retira gates (clase peercard) y U206 la hereda como gate que concede
(fila 5) — el orquestador decide en el despacho, por defecto **sí** en
ambos.

Protocolo: el revisor es agente distinto de worker y orquestador,
**read-only** (sin commits, sin estados, sin merge); su PASS/DEVOLUCIÓN
numerada se adjunta al reporte del WP antes del ✅ (PRACTICAS :324).

---

## §6 · Plantilla BRIEF local (campos obligatorios de todo despacho Z)

Todo despacho de F2 usa esta plantilla; brief incompleto = no hay
despacho.

```markdown
# BRIEF · WP-U<nnn> · <título>   (ola <n> · prio <P0/P1/P2>)

## Calibración (obligatoria — sin ella no hay boot)
- WORLD_ROOT: <worktree del worker>
- CANONICAL_WORLD_ROOT: <mundo canónico — JAMÁS escribir>
- READ_ONLY_ROOTS: <lista>
- DOWNSTREAM_PATTERNS: <patrones>
- Rama: wp/u<nnn>-<slug> · worktree propio (un WP = un worker = una rama)

## Qué
<objetivo en ≤5 líneas, con cita BACKLOG ruta:línea>

## Fuera (fronteras duras)
<lo que este WP NO hace; incluye siempre: no editar plan/BACKLOG.md,
no tocar main, no push, no publish, no red salvo lo declarado>

## Deps verificadas
- internas: <U* ✅ con evidencia de merge>
- externas: <owner citado + señal recibida, o «ninguna»>

## ALCANCE_DIFF (cierre por §2)
<lista exacta de paths que puede tocar; los ficheros calientes de §2
ajenos a este WP están PROHIBIDOS aunque parezcan relacionados;
package.json (raíz o manifests) solo si este WP es su owner de ola>

## CA (verificables; ejes por tipo de WP)
1. <CA del BACKLOG endurecido>
2. <…>
- Evidencia literal exigida: toda afirmación con ruta:línea que un grep
  resuelva; lo no comprobado = <pendiente> + motivo.

## Demolición
<qué se borra en el mismo WP, o N/A razonado>

## Contrarrevisión
<sí (clase §5 + prueba mínima incl. hostil-omite) / no>

## Reporte
Último texto del worker = reporte: WP · rama · commits · CA uno a uno
con evidencia · desvíos · pendientes · riesgos. El worker no marca
estados en BACKLOG ni replanifica olas.
```

---

## §7 · DoD Z-v1 (derivada de U235 — escrita ANTES del primer despacho F2)

Definición de «hecho» del mundo acabado. Es la vara del gate G8 y del
e2e de U235 (BACKLOG :323). Cada paso exige **evidencia literal**
(comando + salida citada); ningún paso «por reporte».

Precondiciones de entorno: checkout limpio del tip (o tarballs de los
canales declarados en U236), **sin** rutas locales de máquina, **sin**
estado previo; la red solo se permite en el paso 1 (seed) — desde el
paso 2 el entorno corre **offline** (invariante 3 del mundo acabado,
BACKLOG :213-214).

1. **Instalación limpia** — desde checkout/tarballs limpios: install
   reproducible (lockfile respetado); artifact inventory generado (qué
   binarios/paquetes/ficheros quedaron y de qué canal salieron). Seed de
   datos por el contrato de import v1 (U201): pack → verificar → staging
   → validar → fusionar → sellar. Aquí termina la red.
2. **Runtime arriba** — el orquestador v1 (U234) levanta el perfil mínimo
   con un comando; health por entrada del catálogo responde
   (`packages/mesh/mcp-launcher/src/health.mjs`); cero órdenes de shell
   manuales.
3. **Juego G cargado** — un pack de juego real (obra de G, citada) queda
   cargado desde el root sellado; el manifiesto validado (hash U199)
   coincide antes y después de la carga: cargar no muta.
4. **Actores entran** — al menos dos actores: transporte sin credencial,
   acción con permiso (U186); card inválida rechazada sin degradar;
   evidencia de log con ids reproducibles (U187).
5. **Intent** — un actor emite un intent y el motor lo aplica
   (`packages/engine/game-engine/src/map-engine.mjs:91` `applyIntent`).
6. **Estado observado** — el estado resultante es observable por el canal
   contratado (no por inspección de disco); lo descartado por el relay
   deja rastro (U192).
7. **Restart → recupera** — parada limpia del orquestador (sin residuos:
   puertos libres, procesos muertos) y rearranque **offline**: el estado
   recuperado es el del paso 6 (no re-seed, no red); medir no modifica
   (U199) y la recuperación no reconcilia por mtime/tamaño (U225).
8. **Cierre** — CA local-first completo verde (los 7 pasos de U206,
   incluida corrupción-falla); artifact inventory final; cara Z del test
   del operador externo documentada.

Fallo de cualquier paso = DoD no cumplida; no hay «pasa con notas».

---

## Autoverificación de CA de U232

**CA1 — ningún WP huérfano de gate.** Recorrido de los 66:
- Carril D (gate GD): U199 U200 U201 U202 U203 U204 U205 U206 — 8
- Ola 0 (aceptación U232): U232 — 1
- Ola 1 (G1): U179 U186 U192 U237 U211 U223 — 6
- Ola 2 (G2): U233 U228 U187 U234 U210 U227 — 6
- Ola 3 (G3): U180 U194 U197 — 3
- Ola 4 (G4): U181 U188 U193 U196 U231 — 5
- Ola 5 (G5): U218 U183 U189 U221 U214 U225 U207 — 7
- Ola 6 (G6): U184 U212 U236 U229 U222 U230 U208 U182 — 8
- Ola 7 (G7): U239 U240 U241 U242 — 4
- Ola 8 (G8): U235 U238 U213 U215 — 4
- P2-a (GP2a): U190 U195 U198 U224 U226 U219 — 6
- P2-b (GP2b): U185 U191 U220 U71R — 4
- C-ext (GC): U216 U217 U209 U178 — 4
Total: 8+1+6+6+3+5+7+8+4+4+6+4+4 = **66** — cero huérfanos; cada lote
cierra bajo su gate nombrado.

**CA2 — alcance disjunto por ola.** Verificado par a par contra §2:
cada fichero caliente tiene **un solo editor por ola** (tabla §2, columna
«resolución»); los pares que comparten fichero están en olas distintas o
encadenados bajo worker único (U216→U217; carril D). Casos límite
resueltos por regla explícita de brief: ola 1 (solo U237 toca manifests),
U187 (config.mjs solo lectura), package.json raíz (owner único por ola),
workflows CI/Release (secuencia U221→U241→U213 y U212→U239→U238).

**CA3 — DoD escrita antes del primer despacho.** La DoD Z-v1 es el §7 de
este documento, commiteado con U232 en ola 0; el estado global de F2 es
«nada abierto» (`plan/BACKLOG.md:204`), por lo que ningún WP de obra F2
ha sido despachado antes de esta escritura.
