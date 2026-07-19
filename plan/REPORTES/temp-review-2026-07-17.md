Review de U11+U12 entregada:

**Addendas actualizadas (nota externa recibida / ADDENDA):**

-   `A-02` --- **reescrita, es el hallazgo de peso.** Sigue abierta: dos olas después, `makeEnvelope` no lo usa nadie; U11 (`authority-kit`) importa las constantes del protocolo pero no la función que fuerza `game`. El contrato único cumple en 1 de 4 eventos. Lo bueno: el anclaje se desplazó al kit → el fix es en **un solo sitio** (`startAuthority` exige `game` y envuelve), y todos los dominios heredan. Desembargada.
-   `A-05` --- nueva. El transporte "acepta evento desnudo o envuelto + dedup" está reinventado **3 veces** (arg-console, 3d-monitor, y ahora player-mcp-kit en Node, bespoke). + un WP menor de simetría dual-wire jugador/autoridad.

**Limpio, dicho:** la extracción de casos-md a playbook-kit (U13) fue quirúrgica; `player-mcp-kit` bien acotado (no conoce el wire, todo inyectado). Las fronteras entre kits están bien; el corte débil es **vertical** --- el contrato que nadie termina de cumplir.

**Como vigía:** ola 2 ya arrancó (`u20-view-kit`). Cacé el residuo vacío de U12 (benigno, Windows) y afiné la doctrina: tres clases de huérfano, solo la tercera (carpeta con contenido vivo sin registro) es el incidente real que vigilamos. Sin conflictos, sin relanzamientos, sin pérdida de contacto en todo el lote 1b paralelo.

Patrón que va emergiendo para el re-plan: **la librería-base se diseña bien, pero la integración queda medio cableada** (A-02 es el caso tipo). Vale la pena vigilarlo en cada kit nuevo. Sigo de centinela sobre U20.

Muy bien. Veo que hay una desviación. Si quieres que nos comuniquemos con el orquestador para parar el swarm, rehacer el plan o algo, podríamos hacerlo. Tu valora.

Antes de valorar necesito un dato duro: ¿hay algún WP **próximo** que dependa de que `state/track/ledger` lleven `game`? Eso es lo que separa "deuda diferible" de "se está construyendo sobre arena". Miro el BACKLOG read-only.

Map remaining backlog waves

Encontrado el dato decisivo: **WP-U23 - "pozo, el segundo juego"** (dep U10--U13, U20), pendiente en Ola 2. Ese es el punto donde `game` deja de ser latente: con dos juegos publicando a la misma sala, `state/track/ledger` sin `game` no se pueden distinguir. Leo U23 y U20 para medir cuán cerca está.

Read U20 and U23 detail

Ya puedo valorar con fundamento. **Mi recomendación: no parar el swarm, no rehacer el plan, no contactar al orquestador ahora.** Cuatro razones, la tercera es la que decide:

**1\. No es un fallo activo, es deuda latente.** Con un solo juego (delta), un envelope sin `game` no rompe nada --- nadie tiene que distinguir de qué juego es un snapshot. El swarm mergea limpio, sin los incidentes de ayer. No hay incendio.

**2\. El plan ya se autocorrige --- y esto es lo importante.** WP-U23 ("pozo, el segundo juego") lleva escrita esta regla dura: *"se construye solo importando engine/* --- si para hacer pozo hay que tocar el engine, ese cambio es un hallazgo (mejora del SDK) y se hace como WP aparte"*, y se declara *"el gate viviente de la regla de los dos juegos"*. Traducción: cuando pozo intente publicar `state/track/ledger` en la sala junto a delta, **chocará** con que no llevan `game` para distinguirse, y el propio worker lo reportará como WP de mejora del SDK. **A-02 emergerá sola, desde dentro, por el canal previsto** --- sin que zeus sepa que existimos. El plan ya tiene el sensor puesto justo donde el defecto se vuelve real.

**3\. Parar es exactamente el riesgo que vigilamos.** Nuestra doctrina: el vigía ruidoso empuja al orquestador a intervenir, y esa intervención es el mecanismo que rompió ayer. Parar un swarm sano por deuda diferible sería autoinfligir el incidente que vinimos a prevenir.

**4\. El fix se abarata con el tiempo.** A-02 se centralizó en `authority-kit` (un solo sitio). Cuantos más dominios nazcan sobre ese kit, más los cubre el fix único. No hay bola de nieve; no hay prisa.

**Qué hago en su lugar:** A-02 ya está madura y lista. La **ventana natural de entrega** es cuando el orquestador cierre ola 1 y antes de asignar U23 --- ahí el custodio (tú) le pasas A-02 como WP de la cola de mejoras, y pozo nace ya cumpliendo el contrato en los 4 eventos. Entrega, no interrupción.

**Lo único que me haría cambiar de opinión:** si veo que U23 arranca y su worker *parchea* `game` desde el propio juego (violando su regla dura) en vez de reportarlo como hallazgo. Eso sí sería señal de inyectar A-02 al BACKLOG antes --- pero aun entonces como WP de cola, nunca como parada. Lo vigilo cuando U23 entre.

En una línea: **el plan es más listo que la desviación; déjalo correr y entrega A-02 en el hueco entre ola 1 y U23.**