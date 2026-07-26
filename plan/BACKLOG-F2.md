# BACKLOG F2 · proyección del carril Z hacia el mundo acabado

| dato | valor |
| ---- | ----- |
| Emisor | vigía **Z** · `WORLD_ROOT = C:\S_LAB\z-sdk` |
| Fecha | 2026-07-26 |
| Tick | `F2-Z` · encargo `INFORME-R4` §2 |
| Formato | método `swarm-orquestacion`: **lane · WP · BRIEF · CA tentativo · prioridad** |
| Relación con `plan/BACKLOG.md` | **no lo sustituye.** El backlog vigente (hasta `U178`) es gobierno cerrado; esto es **proyección F2** a la espera de aprobación. |
| Numeración | ids provisionales `F2-Z-nn`. **El número `U` definitivo lo asigna el orquestador** al aceptar: un vigía no numera backlog. |
| Estado | **nada abierto.** Todo espera aprobación o descarte del custodio. |

## Cómo veo mi mundo acabado

Cinco frases, para que se pueda juzgar si los lanes llevan ahí:

1. **Las 51 piezas se usan.** Ninguna pieza del runtime es invisible para
   quien la consume: o está en el catálogo, o está documentada como librería,
   o está retirada a conciencia.
2. **Se entra sin permiso y se actúa con permiso.** El transporte es anónimo;
   la peer-card concede capacidades, no cable.
3. **Los datos son locales de verdad.** Una ronda arranca con la red
   desconectada, sobre un root cercado con manifiesto sellado; el histórico
   entró una vez y quedó trazado.
4. **La federación no crea autoridad.** Ningún nodo manda por su posición, y
   todo relay deja rastro de lo que no dejó pasar.
5. **El mundo se explica solo.** Doc, contrato y código dicen lo mismo, y el
   canal documentado funciona al ejecutarlo.

---

## Lane A · Superficie del runtime — de 2/51 a 51/51

Objetivo: que ninguna pieza sea invisible. Tag `core`.

| id | WP | BRIEF | CA tentativo | prio |
| -- | -- | ----- | ------------ | ---- |
| F2-Z-01 | Ficha de runtime por servicio | Ocho columnas por pieza (MCP/librería · en catálogo · engine/mesh · comando · puerto y cómo se cambia · disco · deps de arranque · peercard emite/consume). Cita de fichero por celda. | Ninguna celda por inferencia; `grep` de la cita resuelve en el árbol. | **P0** |
| F2-Z-02 | Ampliar `launcher://catalog` · ola 1 | Entradas para `socket-server` y `ciudad-lifecycle`. Puerto por `presets-sdk/env`, cero literales. | `health` verificado de facto por entrada nueva; catálogo sigue sin literales. | **P0** |
| F2-Z-03 | Ampliar catálogo · ola 2 (UIs) | `editor-ui`, `player-ui`, `player-3d-ui`, `3d-monitor`, `cache-browser`, `firehose-browser` como entradas declaradas. | Cada UI arranca desde catálogo sin comando a mano; puerto por env. | P1 |
| F2-Z-04 | Presentar los 17 invisibles | Tres tandas temáticas (transporte · autoridad/juego · kits de UI) con qué resuelve cada una y quién debería consumirla. | Cada pieza queda o consumida, o documentada como librería, o propuesta para retiro. | P1 |
| F2-Z-05 | Entradas sin `workspace` del catálogo | Las 4 `arg-player`/`pozo`/`solve` no son lanzables (*Player-MCP lives in games-library*). Decidir: cablear spawn externo o retirarlas del catálogo. | `launcher://catalog` no ofrece nada que no se pueda arrancar. | P1 |
| F2-Z-06 | `deps` de arranque declaradas | Hoy las 14 entradas declaran `deps: []`. Declarar el orden real donde exista. | Arranque en frío del catálogo completo sin fallos por orden. | P2 |
| F2-Z-07 | Retiro consciente de piezas muertas | Auditar qué del censo no tiene consumidor ni destino (candidato: `threejs-ui-lib` fuera del workspace npm). | Cada retiro con justificación escrita; cero retiros por silencio. | P2 |

## Lane B · Identidad y permiso — el cable no pide credencial

Objetivo: la política «apertura anónima base + peercard opt-in» realizada en código. Tag `BLOQUEA:`

| id | WP | BRIEF | CA tentativo | prio |
| -- | -- | ----- | ------------ | ---- |
| F2-Z-10 | **U93-bis · separar transporte de permiso** | Sacar los 4 tipos de `PEER_CARD_GATED_TYPES`; sin card → sesión anónima `role:null`; el rol se consulta en la acción. | (1) sin card conecta · (2) card válida concede en la acción · (3) **card inválida rechaza y NO degrada a anónimo** · (4) acción sin rol denegada con cable intacto. | **P0** |
| F2-Z-11 | Peercard en vivo + fila Z del grafo | Arrancar `socket-server` + cliente `rooms`; capturar `CLIENT_REGISTER` en las dos modalidades; marcar solo la fila Z. | Log literal con id reproducible en ambas modalidades; marca con ruta de evidencia. | **P0** |
| F2-Z-12 | Unificar el plano de peer-card | Hoy la lógica vive en 4 sitios (`protocol`, `rooms`, `webrtc-signaling/peer-card-gate`, `linea-editor/gate`) y `embajador-kit` tiene **0 consumidores**. Decidir camino único. | Un solo punto de emisión/consumo; `grep` de lógica duplicada = 0. | P1 |
| F2-Z-13 | Reúso de card entre niveles | Responder si edificio→barrio→ciudad reemite o reúsa, con el nivel base anónimo. Aporte al hilo Z·G. | Contrato escrito + test de que ningún relay eleva scopes. | P1 |
| F2-Z-14 | `seat` y firma de asiento | `verifyTravelingPeerCard` / `seatSignature` hoy solo se exigen si vienen. Definir cuándo son obligatorios. | Matriz de exigencia por acción; sin ambigüedad «si viene, valida». | P2 |
| F2-Z-15 | Revocación | Una card revocada debe perder capacidades sin cortar transporte (riesgo #3 de O). | Revocar en caliente: la sesión sigue, las acciones con rol caen. | P2 |

## Lane C · Transporte y federación — el poder que existe, se ve

Objetivo: relay transparente y sin autoridad por topología. Tag `core`.

| id | WP | BRIEF | CA tentativo | prio |
| -- | -- | ----- | ------------ | ---- |
| F2-Z-20 | Traza de lo descartado en el relay | `relay.mjs` deja caer todo evento fuera del allowlist de 8 **sin rastro** y suprime `MAKE_MASTER`. Loguear antes de tocar política. | Todo evento no propagado deja registro con motivo; cero descartes silenciosos. | **P0** |
| F2-Z-21 | Identidad en el puente | Un solo `bridgeClient` (`scriptorium-bridge`, secreto compartido) colapsa el emisor aguas arriba. Propagar origen. | Aguas arriba se distingue quién publicó; el barrio deja de hablar «como uno». | P1 |
| F2-Z-22 | Allowlist declarada, no incrustada | Los 8 eventos y `RELAY_UPSTREAM` viven en `config.mjs`; hacerlos contrato explícito y versionado. | Cambiar la allowlist es cambio de contrato, con test que lo detecta. | P1 |
| F2-Z-23 | Duplicación de reemisión | `emitDownstream` publica el mismo mensaje por `ROOM_MESSAGE` y por evento desenvuelto. | Un suscriptor a ambos no recibe dos veces, o la duplicidad queda documentada como contrato. | P2 |
| F2-Z-24 | Zonas como ámbito de suscripción | `zones` existe como filtro opaco en `connectAndJoin`; elevarlo a ámbito real (mismo topic en dos zonas = dos conversaciones). | Dos zonas con el mismo topic no se filtran mutuamente; fan-out medido. | P1 |
| F2-Z-25 | Signaling anónimo (WebRTC) | Tras F2-Z-10, offer/answer/ICE deben funcionar sin card, con STUN/TURN. | Handshake completo entre dos peers anónimos en LAN. | P1 |
| F2-Z-26 | Verificar coturn y pub SSB de facto | `coturn-runbook.md` y el signaling por DM SSB nunca se probaron contra sbot vivo. | Un `⏳` menos: evidencia de ejecución, no de documento. | P2 |

## Lane D · Plano de datos · adaptador local-first

Objetivo: los cuatro discos con driver, root cercado y arranque sin red. Tag `BLOQUEA:` en las P0.

| id | WP | BRIEF | CA tentativo | prio |
| -- | -- | ----- | ------------ | ---- |
| F2-Z-30 | **C-3 + sellado por hash (WP única)** | Compromiso de Z en R4. `counters.mjs` deja de mutar `volumes.json`; nace `volumes.state.json` regenerable; el manifiesto pasa a RO+hash; el import pobla `corpora`. | Manifiesto hasheable estable; medir no lo modifica; `firehose-core` sigue derivando stats. | **P0** |
| F2-Z-31 | Resolver único de root · env obligatorio | Unificar `presets-sdk/volumes` y el resolver ascendente de `linea-kit/validate.mjs`; el env deja de ser opcional (◆5 validado). | El root no depende del `cwd`; un pack instalado no puede secuestrar la resolución. | **P0** |
| F2-Z-32 | Contrato de import v1 | Formalizar `CONTRATO-IMPORT-PACK-v0`: verificar → staging → validar → fusionar por slot → sellar → reimport no-op → nunca symlink. | Los 7 pasos con test; colisión de `corpus id` aborta sin dejar root a medias. | **P0** |
| F2-Z-33 | Driver LINEAS | Índice `registry.yaml`, `nodos/`, `cache/` + **protección de curación**: el import no pisa `registro.md`/`delta.md`. | Import sobre root con curación humana: escribe lo que falta, reporta divergencia, no sobrescribe. | **P0** |
| F2-Z-34 | Driver FORCES | Índice `registry.json`, `force.json`, escenas `prompt/think/output`, cotas. Snapshot por hash. | `startpack-pozo` importa entero; colisión de corpus = error. | P1 |
| F2-Z-35 | Driver FIREHOSE | Es flujo: definir **unidad** (cursor/clave de evento) antes de tocar transporte. Unión, nunca sobrescritura. | Import incremental idempotente sobre 8.388 ficheros del censo. | P1 |
| F2-Z-36 | Driver SSB | Append-only por secuencia de feed; export de pub sin arrastrar claves. | Reimport no reordena; `grep` de secretos en el root = 0. | P1 |
| F2-Z-37 | CA local-first + réplica A→B | Import → **arranque con red desconectada** → reimport no-op → copia A→B mide igual → divergencia se reporta → **corrupción falla** (no arranca a medias) → cerco sin symlinks. | Los 7 pasos verdes con shape `pozo`; el 6 es el que suele faltar. | **P0** |
| F2-Z-38 | Porte one-off de la genealogía | `import-legado` (U176) es **pieza parcial**; faltan adaptadores para `linea-aleph` (~48 MB · 677 registros), FIREHOSE y FORCES. | `--check` verde antes de escribir; `registry.yaml` stale tratado como incompleto. | P1 |
| F2-Z-39 | Anclaje por contenido como **fuente de import** | git/rad/IPFS entran como origen y procedencia inerte, **jamás** como dependencia de arranque (cerco §10.8). Wikimedia encaja por `oldid` inmutable. | Un corpus anclado importa y luego arranca offline; cero URLs vivas en el root. | P2 |
| F2-Z-40 | `cache_wikitext` acotado | Materialización remota explícita: válida en juego, prohibida en arranque. | Arranque en frío sin red no invoca fetch; la herramienta sigue viva bajo demanda. | P1 |
| F2-Z-41 | Contrato de root VPS ≡ local | Mismo contrato lógico, paths distintos; gitignored y fuera del contexto de imagen Docker. | El mismo manifiesto valida en los dos hosts; `.dockerignore` verificado (segunda puerta). | P1 |

## Lane E · Canal, producto y verdad de la documentación

Objetivo: lo documentado funciona al ejecutarlo. Tag `core`.

| id | WP | BRIEF | CA tentativo | prio |
| -- | -- | ----- | ------------ | ---- |
| F2-Z-50 | Puente documental 4(b) | Mientras G implementa 4(a): declarar el `volumesRoot` del loader como **uso de desarrollo** y el contrato de import como único camino de producto. | Doc sin ningún camino que apunte el env a `node_modules`. | **P0** |
| F2-Z-51 | Reparar `VOLUMES/README.md` | Dos defectos míos: línea 24 (`npm install @zeus/startpack-delta` → E404) y línea 26 (env al `volumes/` del pack, contra el cerco). | Todo comando del README se ejecuta contra su canal real y resuelve (C8). | **P0** |
| F2-Z-52 | CA de canal limpio para C-4 | Condición del ◆2c: probar kit npm + pack Release desde consumidor limpio. | Instalar capacidad por npm y sembrar datos por Release, sin tocar el árbol de trabajo. | P1 |
| F2-Z-53 | `linea-editor` publish-ready (U178) | Sigue en PAUSA y es una de las 2 piezas realmente usadas; hoy se consume desde workspace. | Checklist §5 de la allowlist completo; GO de publish aparte. | P1 |
| F2-Z-54 | Allowlist como inventario vivo | `audit:publish-allowlist` contra registry en CI, no a mano. | El desfase allowlist↔registry se detecta antes del release, no después. | P2 |
| F2-Z-55 | Smoke de consumidor externo ampliado | Extender `smoke:external-consumer` a las piezas que O y V declaran usar. | Un consumidor limpio monta el conjunto declarado sin rutas locales. | P1 |
| F2-Z-56 | `DATOS.md` al día con el censo | Registrar los tres drifts (envase, registry stale, conteo de FORCES) en el plano de datos. | Ninguna cifra del doc contradice el censo. | P2 |

## Lane F · Ciudad en el runtime — dominio sin inventar dominio

Objetivo: sostener el modelo de G sin decidirlo. Tag `horizonte`.

| id | WP | BRIEF | CA tentativo | prio |
| -- | -- | ----- | ------------ | ---- |
| F2-Z-60 | `tree.{barrio,edificio,maquinaria}` (Z12) | El catálogo los reserva y los ignora. Activarlos cuando G fije qué es un barrio. | El árbol del catálogo refleja el modelo de G sin que Z invente semántica. | P1 |
| F2-Z-61 | Barrio como ámbito, no como proceso | Si un barrio no es proceso, el catálogo no debe sugerirlo. Alinear con zonas (F2-Z-24). | Ningún consumidor puede confundir barrio con servicio. | P1 |
| F2-Z-62 | Holón-7 completo | Las 7 marcas del grafo con entrada real de cada carril; Z sostiene el tubo. | 7/7 marcas con evidencia de log, ninguna por reporte. | **P0** |
| F2-Z-63 | Story-board y reparto en ronda | `story-board-schema` + `reparto-kit` conectados a una ronda real, no solo a fixtures. | Una ronda carga elenco y actos desde pack importado. | P2 |
| F2-Z-64 | Dramaturgo: curación en vivo | `delta_status: pending\|draft\|curated` operable desde el juego sin romper la protección de curación. | Curar en ronda y reimportar sin pérdida humana. | P2 |

## Lane G · Observabilidad, gates y estación

Objetivo: nada se declara sin verificar; nada se pierde al morir la ventana. Tag `core`.

| id | WP | BRIEF | CA tentativo | prio |
| -- | -- | ----- | ------------ | ---- |
| F2-Z-70 | Gate de arranque offline en CI | El CA de local-first como gate, no como acta. | CI corre una ronda sin red y falla si algo intenta salir. | P1 |
| F2-Z-71 | Falso positivo de la regla 15 | El espejo de skills inunda `anomalias.log` (R-1 de O). El fix es de método → porte del skill (L). | `anomalias.log` sin falsos positivos del espejo; watchers reanudables. | P1 |
| F2-Z-72 | Mapas `plan/MAPA-*` (territorio == mapa) | El mundo no tiene mapas; el pulso #19 no aplica hoy. Crearlos para que el territorio no crezca en silencio. | `verificar-territorio-mapa.sh` en verde; entrada sin fila = FAIL. | P2 |
| F2-Z-73 | Anomalía del segundo conductor | `CONTRARREVISION-U169-PASS.md` reescrito con tamaño idéntico y mtime nuevo, sin autor conocido. Cerrar o declarar. | Causa identificada, o registro explícito de que no se puede determinar. | P2 |
| F2-Z-74 | Reconciliación nunca por mtime/tamaño | Convertir la lección anterior en regla verificable del plano de datos. | Test que demuestra que mtime/size no deciden nada. | P1 |
| F2-Z-75 | Estación reanudable | Watchers parados por orden; dejar el arranque documentado y con lease propio (`timbre-watch.log`). | Relevo de ventana levanta estado desde bitácora sin preguntar. | P2 |

## Lane H · Fronteras con otros carriles

Objetivo: interfaces sin acoplamiento. Tag `core`.

| id | WP | BRIEF | CA tentativo | prio |
| -- | -- | ----- | ------------ | ---- |
| F2-Z-80 | Fichero de env de la demo **generado** | O propone, Z valida: se **genera** desde `presets-sdk/env`, no se transcribe (hay nombres construidos dinámicamente). | Añadir un servicio al runtime actualiza el fichero sin edición manual. | **P0** |
| F2-Z-81 | Cinco datos por servicio para O | Comando · puerto y cómo se cambia · disco · deps de arranque · peercard. Deriva de F2-Z-01. | O escribe compose con un patrón, no 17 casos. | **P0** |
| F2-Z-82 | Contrato IDE opt-in v2 | `reparto_required` y la forma del payload de denegación siguen siendo coincidencia verificada, no contrato (duda 5 de V). | El contrato fija ambos; V verifica contra runtime y coincide. | P1 |
| F2-Z-83 | Frontera L1/L2 desde el runtime | Qué cristaliza a L1 y qué muere con la sesión, en código y no solo en doctrina. | Un dato de L2 no llega a L1 sin cristalización explícita. | P1 |
| F2-Z-84 | Invariante de secretos en el plano de datos | `GATE-O-CLAVES` aplicado a VOLUMES: un volumen que necesita secreto para leerse está mal diseñado. | Gate que falla si material de identidad entra en un volumen o en el contexto de imagen. | **P0** |

---

## Conteo

| prioridad | WPs |
| --------- | --: |
| **P0** | **16** |
| **P1** | **23** |
| **P2** | **15** |
| **total** | **54** |

Por lane: A 7 · B 6 · C 7 · D 12 · E 7 · F 5 · G 6 · H 5.

## Dependencias que importan

```text
F2-Z-10 (U93-bis) ──> F2-Z-25 (signaling anonimo) ──> F2-Z-62 (holon-7 completo)
F2-Z-11 (peercard en vivo) ──> F2-Z-62
F2-Z-30 (C-3+hash) ──> F2-Z-32 (contrato import) ──> F2-Z-33..36 (drivers) ──> F2-Z-37 (CA local-first)
F2-Z-31 (resolver unico) ──> F2-Z-32
F2-Z-01 (ficha) ──> F2-Z-81 (5 datos O) y F2-Z-02 (catalogo ola 1)
F2-Z-50/51 (doc) <── depende de la frontera C1/C2 fijada con G
F2-Z-60/61 (Ciudad) <── depende de que G fije que es un barrio
```

## Lo que **no** encolo, y por qué

- **C-6 / P2P continuo**: es segundo acto por consenso 6/6. Encolarlo como WP
  ahora sería fingir que su especificación existe.
- **Cambio 4(a)**: es de **G** (banda major en `startpack-kit`). Yo encolo el
  puente (F2-Z-50), no la obra ajena.
- **Modelo de Ciudad, federación por tramos, GATE-O-CLAVES como gate de build**:
  son de mesa o de O. Encolo lo que en mi mundo se derive de ellos, no la
  decisión.

— vigía **Z**
