> **ASENTADO EN LA CODEBASE POR ORDEN DEL CUSTODIO (2026-08-03).** Este plan
> nació en `C:\S_META\F3\FC3-plan.md`. **`S_META` no se sube y no sobrevive a un
> cambio de máquina** — es zona de paso, no de custodia (`scriptorium/sincronia/PROTOCOLO.md §10-bis`).
> Las tres referencias a `C:\S_META\…` del original se han **reapuntado** a su
> destino durable; si el original vuelve a moverse, manda esta copia.
>
> **FASE 0 · PASO 1 YA ESTÁ SATISFECHO. No lo re-derives: éstos son los datos.**
>
> | señal exigida | valor |
> | ------------- | ----- |
> | `<TIP_U269_MERGE>` | **`2c167dc`** |
> | CI del commit de merge | **verde** · run `30775257811` · `2026-08-03T00:46:14Z` |
> | acta de aceptación | `fae7460` · fila `U269` en **✅** en `plan/BACKLOG.md` |
> | contrarrevisión final | **6.ª vuelta, cero bloqueantes** (`plan/REPORTES/WP-U269-detector-con-parseo.md`) |
> | tip de `main` al corte | `fae7460` |
>
> **Y el paso 2 también, salvo la prueba de quiescencia que exige el propio plan.**
> Al congelar: **cero salas, cero ramas `wp/*`, cero sucio y todo en remoto** en
> los cuatro mundos. `U270` y `V103` permanecen ⬜ como pide el alcance. El punto
> de restauración, con el **censo de trampas de esta máquina**, está en
> `scriptorium/sincronia/FREEZE-2026-08-03.md` — **§3 ① es literalmente el
> defecto que motiva el censo de procesos del paso 2**.
>
> ⚠ **DOS CORTES DISTINTOS, Y NO SE MEZCLAN** *(corregido 2026-08-03 tras la
> revisión de la ventana FC3, que lo cazó — y el defecto era mío)*:
>
> - **Baseline de código al corte** = **`2c167dc`** en `z-sdk`. La campaña audita
>   Z, así que **el baseline es uno solo y está congelado**. Es el único tip que
>   esta cabecera fija.
> - **Tips documentales** (hub, skills, V) **NO son baseline y SIGUEN MOVIÉNDOSE**
>   — de hecho se movieron mientras se asentaban estos mismos documentos. **No se
>   copian aquí a mano**: se leen de `FREEZE-2026-08-03.md §0`, que es su fuente
>   única.
>
> *La primera versión de esta cabecera los mezcló en una tabla y dos caducaron en
> veinte minutos. Es la regla de la casa —`L-H12 §13`, una cifra medida a mano
> caduca— pisada dentro del documento que la transporta.*

## Plan: Matriz forense FC1→FC2 y fundamento FC3

Después de aceptar U269 y detener el swarm Z·V, construir una matriz histórica de las identidades de paquete de Z mediante la unión del cierre FC1, el diseño original FC2 y el árbol exacto del corte. La matriz separará hechos observados, subsunción planificada, contradicciones y recomendaciones; ningún agente decidirá retiros ni modificará producto. En paralelo se levantará un **ledger de herencia FC2→FC3** para conservar fichas halladas, bloqueos entre mundos, mecanismos vivos y límites no demostrados que no caben en una fila de paquete. La obra se divide entre agentes background con reportes disjuntos, un único integrador y contrarrevisión read-only.

**Alcance y anclas**

- FC1 no significa la F1 de la reunión. Es la refundación Z y su capa B: ancla de cierre original post-U87 `bd5f46c`; ancla primaria para inventario final de código FC1 `5e9cc7c` (U117); cierre documental U118 mediante `plan/RE-PLAN.md`, `plan/BACKLOG-HISTORICO.md`, `plan/REPORTES/WP-U118-plan-stabilization.md` y `plan/REPORTES/entregas/ENTREGA-2026-07-18c.md`.
- FC2 significa la proyección “mundo acabado” nacida en INFORME-R4 y unificada en INFORME-R5. El integrador debe resolver y registrar el sello/commit exacto de R5 desde CUADERNOS; no debe usar el `BACKLOG-F2.md` vivo como si fuera el snapshot original.
- Corte significa el commit de merge exacto de U269, con CI verde y acta aceptada. Se registra como `<TIP_U269_MERGE>` al ejecutar; U270, V103 y cualquier trabajo posterior quedan fuera.
- Universo de filas: `identidades de paquete en FC1 ∪ identidades de paquete en FC2 original ∪ identidades presentes al corte U269`. Incluye paquetes retirados, renombrados, movidos, fusionados, divididos, nuevos y la pieza Angular anidada. No se limita a las 51 actuales.
- La matriz audita Z. Los otros mundos sólo aparecen como consumidores, subsumidores o dependencias citadas; no se auditan sus backlogs completos.
- El ledger de herencia **no amplía el baseline**: U270, U271, V103 y otros hallazgos posteriores a U269 se registran como material que cruza la juntura, nunca como hechos del corte ni como WPs aprobados de FC3.
- `C:\S\scriptorium\sincronia\informes\FC3-revision-holon-ZV.md` *(asentado; nació en `S_META\F3\`)* es notaría del holón abarcado: donde aporta una medición reproducible, ésta entra como evidencia a revalidar; donde aporta criterio, queda como recomendación y no prevalece sobre el diseño FC3.

**Esquema obligatorio de cada fila**

1. `lineage_id` estable, independiente del nombre actual.
2. Identidad FC1: nombre, path, tipo, estado y anclas U/WP.
3. Transición FC1→FC2: `sin_cambio | renombrado | movido | dividido | fusionado | retirado | nuevo`.
4. Identidad en FC2 original y en el corte U269.
5. Consumo observado por clase: `produccion`, `bin/CLI`, `e2e`, `fixture`, `test`, `documental`, `ninguno`; cada arista con consumidor y cita.
6. Superficie/distribución: catálogo, comando/start, publicación, app/servicio/lib, privada/anidada.
7. Tratamiento FC2: WP donde es sujeto, WP donde sólo es dependencia, subsumidor planificado y estado del WP.
8. Subsunción real al corte: paquete/caso de uso consumidor y evidencia ejecutable; separada de la subsunción planificada.
9. Contradicciones: ambas afirmaciones y sus fuentes, sin resolver por inferencia.
10. Veredicto observado: `activo_directo | subsumido_real | infraestructura | fixture_demo | futuro_sin_cable | huerfano | retirado | desconocido`.
11. Recomendación no vinculante: `mantener | integrar | retirar | migrar | diferir | decidir`, con razón y dueño de decisión.
12. Confianza y cobertura: `alta | media | baja`, huecos y evidencia faltante.
13. Origen del tratamiento: `planificada | hallada`; una ficha planificada nace de visión/backlog, una hallada nace de medición, incidente o contrarrevisión. Si confluyen ambos orígenes, se registran los dos con sus anclas.
14. Dependencias cross-world: `bloquea`, `bloqueada_por`, mundo propietario y evidencia. Una dependencia sólo citada dentro del backlog de otro mundo no se considera visible en el punto de restauración.
15. Mecanismos vivos asociados: guardián/censo/verificador, ruta, owner de mantenimiento, forma de invocación y mutante que lo apaga entero.
16. Límite demostrado: qué prueba realmente la evidencia y qué afirmación más ancha **no** demuestra.

**Reglas de evidencia**

- Una dependencia declarada no prueba consumo de producción: exige import/require/import dinámico resoluble e invocación desde `src/**` o `bin/**` fuera de comentarios.
- `test/**`, `fixtures/**` y `e2e/**` son clases separadas aunque ejecuten código real. Una fixture servida por un runtime se marca `fixture_servida`, no producción.
- Comentarios, README y menciones de package name son documentales, nunca aristas de consumo.
- Un `subsumido_real` exige consumidor ejecutable al corte; un WP futuro sólo da `subsumido_planificado`.
- La ausencia no se afirma por un grep único. Se combinan manifests estructurados, imports estáticos, imports dinámicos y revisión manual de candidatos no resolubles.
- Esa combinación de métodos no se presenta como lista exhaustiva. El censo parte del conjunto que declaran las fuentes únicas —manifests, workspaces, catálogo, allowlist y superficies publicadas— y exige desenlace para cada elemento. Cuando sea posible, se añade una ley sobre el resultado en vez de otra lista de formas sintácticas.
- Toda cifra lleva snapshot y método. Las divergencias `390/392`, `55/66/67` y otras cifras vivas se registran por corte, no se reconcilian mezclando fechas.
- Todo estado heredado de un handoff se marca `foto` hasta re-medirlo. Una cifra, branch, sala o estado de WP heredado de otra sesión no se registra como `medido` por haber sido citado.
- Cada instrumento nuevo debe poder ser inutilizado de forma controlada: su mutante de apagado total tiene que poner rojo un caso que invoque la implementación real. Un control positivo que simula el fallo en lugar de llamar al instrumento no acredita vigilancia.
- En una devolución, el revisor repite los vectores anteriores **y añade al menos uno nuevo**. Todas las ablaciones se vuelven a ejecutar después del último cambio del worker.
- Los hechos documentales se anclan por commit, fichero, token y cardinalidad esperada; las coordenadas se derivan. Un número de línea escrito a mano no es identidad del hecho.
- `MATRIZ-RUNTIME-51.md` es evidencia del corte, no autoridad sobre FC1. `RE-PLAN.md`/U118 gobiernan FC1; INFORME-R4/R5 y sus backlogs sellados gobiernan el diseño FC2.

**Steps**

### Fase 0 · Corte verificable

1. Confirmar U269 aceptado: reporte final, contrarrevisión sin bloqueantes, merge, CI verde del commit de merge y fila del BACKLOG en ✅. Registrar commit, run-id y fecha. No empezar la campaña si falta una señal.
2. Detener el swarm Z·V y probar estado quiescente: cero workers/claims, cero procesos de suites, cero worktrees o ramas de obra no resueltos y salas podadas o declaradas. La prueba enumera también procesos del sistema operativo cuyo command line o cwd apunte a los mundos/worktrees; estado Git limpio no prueba ausencia de procesos colgados. La poda se ejecuta después del censo de procesos y desenlaza junctions uno a uno. U270 y V103 permanecen ⬜.
3. Crear el expediente de campaña y los WPs canónicos sólo después del corte. El orquestador es el único que toca BACKLOG y crea worktrees; workers no empujan. El código de producto y los backlogs históricos son read-only.
4. Capturar un punto de restauración FC2→FC3 con dos inventarios separados:
   - **baseline del corte:** sólo hechos aceptados hasta U269;
   - **material de juntura:** fichas posteriores o excluidas (`U270`, `U271`, `V103`), P0 no demostrados, mecanismos vivos y bloqueos cross-world. Registrar no significa aprobarlos para FC3.

### Fase 1 · Fijar snapshots y universo

5. Ejecutar tres censos en paralelo, cada uno en worktree propio y con reporte exclusivo:
   - **Agente HISTORIA-FC1:** inventario de manifests en `5e9cc7c`, comparación secundaria con `bd5f46c`, WPs U00–U118, identidades extinguidas y transiciones conocidas. Puede usar sólo Git read-only (`ls-tree`, `show`, `diff`, `log`) y exports desechables prefijados por WP+rol.
   - **Agente DISEÑO-FC2:** recuperar el snapshot sellado R5, extraer las identidades y tratamientos de la proyección original Z, y mapear ids provisionales F2-Z a U179–U242 sin adoptar addendas posteriores como diseño original.
   - **Agente CORTE-U269:** inventario estructurado del árbol exacto del merge U269, incluidos 50 workspaces y la Angular anidada, roles, superficies y distribución.
6. El integrador une los tres censos por linaje, no sólo por nombre. Publica un universo provisional con tablas de alias/tombstones y cuadre: cada identidad de cada snapshot pertenece exactamente a una fila; cero omitidas y cero duplicadas. Siempre que la genealogía lo permita, `lineage_id` se deriva de anclas estables y no se mantiene como segunda lista manual. Este paso bloquea el análisis paralelo siguiente.

### Fase 2 · Análisis paralelo sin solape

7. Despachar cinco agentes background sobre el universo bloqueado, cada uno escribiendo únicamente su reporte bajo `plan/REPORTES/forense-fc1-fc2/`:
   - **Agente ENGINE:** filas cuyo corte actual o ancestro FC1 pertenece a `packages/engine/**`; reconstruye consumo por clases y transición. Foco obligatorio en `player-mcp-kit`, `playbook-kit`, `acta-kit`, `parte-kit`, `authority-kit`, `embajador-kit`, `lifecycle-kit`, `game-engine`, `test-utils`, `room-client-browser`, `view-kit`, `ui-kit`, `ui-3d-kit` y `app-shell`.
   - **Agente SUPERFICIES:** `packages/mesh/**`, `packages/editor/**`, `examples/**` y la Angular anidada; reconstruye consumo, catálogo/comandos/distribución y papel como subsumidores. Debe distinguir `threejs-ui-lib` consumida por `dev-app` de “consumidor externo”.
   - **Agente PLAN-FC2:** para todas las filas, mapea sujeto/dependencia de WPs, subsunción planificada, prioridades y estado al corte. No inspecciona consumidores para evitar mezclar intención con realidad.
   - **Agente DISTRIBUCIÓN:** publicación, allowlist, manifests, catálogo, start scripts, servicios/apps/libs y consumidores limpios; no emite veredictos de producto.
   - **Agente HERENCIA-FC2:** produce el ledger separado. Clasifica fichas `planificada|hallada`, reconstruye bloqueos cross-world, inventaría mecanismos vivos y sus owners, y enumera límites no demostrados. Debe incluir como candidatos a preservar —sin aprobarlos— `U235`, `V86`, `V84`, `V82`, `V26`, `V20`, `U239`, `U218↔V18`, `V103`, `U270` y `U271`.
8. Cada agente entrega también una lista de afirmaciones que no pudo probar y contradicciones plan↔grafo. No modifica la matriz final ni decide recomendaciones. Los scratchpads/temporales se prefijan por WP **y por rol** (`<wp>-w-*`, `<wp>-cr-*`, `<wp>-int-*`); compartir directorio no concede permiso para borrar el material de otro rol.

### Fase 3 · Integración única

9. El integrador combina los cinco reportes con el universo y produce dos representaciones de la matriz:
   - `plan/MATRIZ-FORENSE-FC1-FC2.json`: snapshot estructurado, una fila por linaje, fuentes y enum cerrados.
   - `plan/MATRIZ-FORENSE-FC1-FC2.md`: vista humana generada/contrastada desde el JSON, resumen de trayectorias, paquetes no subsumidos, contradicciones y candidatos para FC3.
10. Producir, desde el mismo snapshot y sin mezclarlos con las filas de paquete, los artefactos de herencia:
   - `plan/HERENCIA-FC2-FC3.json` y `.md`: fichas planificadas/halladas, estado `corte|post-corte`, owner y recomendación no vinculante;
   - `plan/REPORTES/forense-fc1-fc2/ACOPLAMIENTOS-CROSS-WORLD.md`: grafo de bloqueos; incluye como vector obligatorio `U218↔V18` y las restantes marcas de holón-7;
   - `plan/REPORTES/forense-fc1-fc2/MECANISMOS-VIVOS.md`: ruta, invocación, owner, estado de cableado, mutante y fecha de última prueba;
   - `plan/REPORTES/forense-fc1-fc2/LIMITES-NO-DEMOSTRADOS.md`: lo que FC2 no acreditó, separado de defectos abiertos.
11. Crear `plan/REPORTES/forense-fc1-fc2/PUNTOS-CIEGOS.md` con causas de diseño, no sólo paquetes: presencia≠destino, visibilidad 51/51≠subsunción, retiro relegado a U185/P2, premisas falsas, ausencia de retrospectiva FC1, diferencia entre “planificado” y “real”, y fichas halladas sin defensor de producto.
12. Crear `plan/REPORTES/forense-fc1-fc2/DECISIONES-PENDIENTES.md`. Las recomendaciones quedan pendientes del custodio; no se cambian paquetes, estados FC2 ni backlog FC3 en esta campaña.

### Fase 4 · Contrarrevisión adversarial

13. **Revisor UNIVERSO**, read-only: reconstruye de manera independiente los tres denominadores y ataca omisiones, aliases erróneos y dobles filas. Debe plantar/cotejar al menos un paquete retirado, uno renombrado, uno nuevo y la Angular anidada. Cero omisiones es bloqueante.
14. **Revisor CONSUMO/SUBSUNCIÓN**, read-only y paralelo con 13: ataca todas las filas `ninguno`, `fixture_demo`, `subsumido_real`, `huerfano` y `retirar`. Vectores obligatorios: dependencia sin import, comentario con package name, import dinámico, fixture servida, CLI/bin, e2e y consumidor fuera de Z. Cada falso positivo o falso negativo es bloqueante.
15. **Revisor INSTRUMENTOS/HERENCIA**, read-only y paralelo con 13–14: apaga por mutación cada control nuevo, verifica que el positivo invoque la implementación real, reconstruye al menos un bloqueo cross-world desde ambos extremos y comprueba que una ficha `hallada` no desaparezca al filtrar sólo visión de producto. Ataca además coordenadas derivadas, cardinalidad de anclas y owners ausentes.
16. Si hay devolución, corrige el agente dueño del reporte; el integrador regenera todas las vistas. Los revisores repiten sus vectores anteriores **y añaden al menos uno nuevo por vuelta**. Las ablaciones se ejecutan después del último cambio. Los revisores no editan ni conceden aceptación.

### Fase 5 · Cierre de la campaña

17. El orquestador verifica la matriz y el ledger contra sus JSON y reportes, ejecuta los controles de cuadre y acepta los WPs. Ambos se declaran **actas de corte**, no censos vivos: cambios posteriores no los reescriben.
18. Emitir acta con: anclas FC1/FC2/U269, denominadores por snapshot, distribución de veredictos, contradicciones abiertas, mecanismos vivos y owner, límites no demostrados, decisiones del custodio y lista de entradas propuestas para FC3. Esta lista alimenta la planificación posterior, pero no la sustituye.
19. El acta no puede afirmar cierre de producto completo si no existe evidencia equivalente al reto U235. Si se decide no heredarlo, el límite queda escrito como **producto extremo a extremo no demostrado**, no como descarte silencioso.

**Relevant files**

- `C:\S_LAB\z-sdk\plan\RE-PLAN.md` — veredicto y lecciones de FC1.
- `C:\S_LAB\z-sdk\plan\BACKLOG-HISTORICO.md` — olas 0–10 y paquetes/WPs históricos.
- `C:\S_LAB\z-sdk\plan\REPORTES\entregas\ENTREGA-2026-07-18c.md` — cierre U117/U118 y anclas `bd5f46c`/`5e9cc7c`.
- `C:\S_LAB\z-sdk\plan\REPORTES\WP-U118-plan-stabilization.md` — compactación que fija el cierre documental FC1.
- `C:\S\scriptorium\sincronia\informes\INFORME-R4.md` — encargo que origina FC2.
- `C:\S\scriptorium\sincronia\informes\INFORME-R5.md` — edición F2 unificada original.
- `C:\S\scriptorium\plan\PLAN-SCRIPTORIUM-V1.md` — costura multi-mundo y subsumidores previstos.
- `C:\S_LAB\z-sdk\plan\BACKLOG.md` — ids canónicos y estado al corte.
- `C:\S_LAB\z-sdk\plan\GOBIERNO-EJECUCION-F2.md` — deps, olas y tratamientos FC2.
- `C:\S_LAB\z-sdk\plan\MATRIZ-RUNTIME-51.md` — inventario runtime cercano al corte, sólo evidencia fechada.
- `C:\S_LAB\z-sdk\package.json` y manifests de workspaces — universo/distribución al corte.
- `C:\S_LAB\skills-library\skills\swarm-orquestacion\reference\ejes-ca.md` — cableado, destino, dedup y segundo consumidor.
- `C:\S_LAB\skills-library\skills\swarm-orquestacion\reference\revision-adversarial.md` — protocolo de revisión read-only.
- `C:\S\scriptorium\sincronia\informes\FC3-revision-holon-ZV.md` — notaría medida del holón FC2 abarcado; fuente de vectores y límites, no backlog FC3.
- `C:\S\scriptorium\sincronia\informes\FC2-HANDOFF-foto-0140.md` — foto operativa del relevo, **de las 01:40 y con filas ya caducadas señaladas en su cabecera**; todo estado se re-mide antes de registrarlo.
- `C:\S\scriptorium\sincronia\FREEZE-2026-08-03.md` — punto de restauración y trampas de máquina.
- `C:\S_LAB\v-sdk\plan\ANCLAS.json` y `C:\S_LAB\v-sdk\scripts\anclas-censo.mjs` — precedente para anclar hechos y derivar coordenadas/cardinalidad.
- `C:\S_LAB\v-sdk\scripts\cobertura-trinquete.mjs` — precedente de trinquete bidireccional y rechazo de informes rancios.
- `C:\S_LAB\z-sdk\test\gates\conservacion.mjs` — precedente de ley sobre resultado; su límite se registra explícitamente.
- `C:\S_LAB\skills-library\plan\BACKLOG-F2.md` (`L-H12`) — lecciones durables de instrumentos y contrarrevisión FC2.

**Verification**

1. Gate de inicio: U269 ✅, merge CI verde, acta cerrada y swarm quiescente, incluido censo de procesos del SO por command line/cwd.
2. Cuadre de universo por snapshot: todos los manifests/identidades FC1, FC2 y U269 están asignados exactamente una vez.
3. Validación estructural del JSON: enums cerrados, ids únicos, campos obligatorios y fuentes no vacías; Markdown y JSON tienen igual número y mismos `lineage_id`.
4. Controles de consumo: cada arista `produccion` tiene manifest+import/invocación; cada ausencia declara métodos usados y huecos dinámicos revisados.
5. Controles de subsunción: `subsumido_real` exige consumidor ejecutable; `subsumido_planificado` exige WP/CA citado; no se mezclan.
6. Ablación de instrumentos: cada control de cuadre, enums, consumo, subsunción, anclas y herencia tiene un mutante que lo apaga entero y hace rojo un control positivo que invoca la implementación real.
7. Conservación de herencia: todas las fichas seleccionadas `planificada|hallada` tienen owner o decisión pendiente; el filtro por origen no pierde ninguna y los bloqueos cross-world cuadran desde ambos extremos.
8. Anclas documentales: cada hecho protegido conserva token+fichero+cardinalidad; moverlo actualiza coordenada derivada y cambiar su composición enrojece.
9. Contrarrevisiones UNIVERSO, CONSUMO/SUBSUNCIÓN e INSTRUMENTOS/HERENCIA en PASS sin bloqueantes; cada vuelta documenta el vector nuevo añadido.
10. Cierre: ninguna edición de `packages/**`, workflows, manifests, FC1 histórico o backlogs de otros mundos; sólo expediente, matrices, ledger y reportes de la campaña.

**Decisions**

- La campaña cubre linajes de paquetes Z, no los 392 WPs de todos los mundos.
- FC1 usa `5e9cc7c` como snapshot primario de código y U118 como cierre documental; `bd5f46c` conserva el cierre original post-U87.
- FC2 se lee desde su sello R5, no desde documentos vivos con addendas posteriores.
- U269 está dentro del baseline ya cerrado; U270/V103 quedan fuera.
- Git mutable sobre raíces canónicas permanece prohibido para workers. Tras probar freeze, el orquestador puede crear worktrees; el análisis histórico usa Git read-only y scratchpads desechables.
- La matriz separa observación, intención y recomendación. Sólo el custodio convierte recomendaciones en decisiones de FC3.
- Compactar/archivar FC1/FC2 y oficializar protocolo son campañas posteriores; esta entrega prepara sus entradas sin ejecutarlas.
- El ledger de herencia no decide qué entra en FC3: evita que un cambio de ciclo descarte por silencio fichas halladas, bloqueos entre mundos o mecanismos sin owner.
- `U235`, los seis P0 de entrega (`V86`, `V84`, `V82`, `V26`, `V20`, `U239`), `U218↔V18` y las fichas halladas `V103`/`U270`/`U271` quedan **preservados como caminos a decidir**, no aprobados por esta campaña.


## Addenda FC3-LORE-HM-01 · Caso de aceptación transversal

**Origen y estatuto**

- Handoff manual del representante ALEPH/LORE-HM, recibido tras fijar el supuesto de split en U269. Se acepta como evidencia, hipótesis y fuente de candidatos; no como autoridad para redefinir FC3 ni como permiso de despacho.
- LORE-HM es un **consumidor-wrapper y caso de aceptación transversal**. No es un séptimo mundo, no crea holón 08 ni `L_SDK`, no posee contratos Zeus y no convierte Network-Engine en runtime.
- Regla anti-canibalización: LORE-HM sólo puede bloquear el cierre de las **familias de contrato que importe, ejecute y pruebe desde canal limpio**. No es DoD global de todos los paquetes ni arrastra automáticamente U246–U249, E01–E13, U243 o el dossier bridge a FC3.
- Su incorporación definitiva al backlog FC3 depende de la matriz forense y de las decisiones PO de esta addenda.

### Estado heredado contrastado

- El baseline sigue siendo el merge aceptado de U269; su commit/run-id se materializa en Fase 0. U270, V103 y cualquier reparación posterior quedan fuera.
- `@zeus/linea-kit` es hoy el único paquete Zeus consumido realmente por el playground LORE-HM (`@scriptorium/prueba-hm-kit`, dependencia `0.3.0`). U245 y U264 sostienen su frontera tipada y su vigilancia de declaraciones.
- El playground ejecuta y sella la cadena Onfalo→Bartleby→VectorMock→Línea→Grafo→Universo→Corto, pero Bartleby, VectorMock, cristalización, ceremonia y provider son simulacro declarado. Su wire, vista semántica, negativos y trazabilidad son evidencia propia; todavía no prueban `@zeus/protocol`, `@zeus/rooms`, `@zeus/acta-kit`, `@zeus/linea-system`, `@zeus/force-system` ni un provider E publicado.
- La contingencia ejecutable tiene forma de `LocalPodProvider` más handlers deterministas; no existe en el árbol una clase `DeterministicDocumentMachineProvider`. La matriz debe conservar esa discrepancia de nombre.
- En E-SDK siguen ⬜ E00–E13. E01 define la SPEC de línea; E11 crea la boca conversación→línea; E12 gira Document Machine hacia `@voz`, pero el backlog no define todavía un puerto público intercambiable `DocumentMachineProvider`. E12 es intención de producto, no contrato de sustitución demostrado.
- El diseño S distingue wire JSON autoritativo y vista JSON-LD/RDF no autoritativa; identidad WebID/PeerCard/ssbId y `PodProtocol` están diseñados, mientras implementación L03/SOLID permanece hipótesis en sus artefactos. Debe revalidarse el estado real antes de declararlo cerrado.
- U243 no absorbe SOLID: consume el diseño L03 y responde sólo si el runtime Z conserva `ZEUS_VOLUMES_ROOT`, lo sustituye por pods o adopta forma híbrida.
- `zeus-bridge` es una tesis/dossier de consumidor de `@zeus/*`, no un consumidor implementado de LORE-HM ni de E. B01/B11/B12/B21 siguen como candidatos; su valor es certificar registry, rooms outbound-only y volúmenes RO sin revivir Network-Engine.

### Mapa de paquetes dirigido por el caso

| paquete/familia | pasado y consumo al corte | función futura candidata | subsumidor real/planificado | warning que la matriz debe resolver |
| --- | --- | --- | --- | --- |
| `linea-kit` | consumo real desde playground; tipos U245 y control U264 | lengua de líneas y validación de manifests | LORE-HM + `linea-system`/`force-system` | correctamente subsumido; probar desde registry limpio |
| `linea-system` | MCP vivo; U247 pendiente | fachada MCP de líneas para consumidor externo | ninguno LORE-HM hoy | U247 sólo entra si un consumidor ejecuta recurso/operación real |
| `force-system` | MCP vivo; U248 pendiente | fachada MCP sólo para un escenario que necesite fuerzas | ninguno LORE-HM hoy | no viajar pegado a U247 por simetría estética |
| `acta-kit` | cero consumidor real encontrado; U246 pendiente | acta bilateral H/M sólo si se cablea | sólo planificado | tipar antes de productor/consumidor viola Ejes I/IV |
| `parte-kit` | consumo real en `operator-bridge` | parte/campana operativa y lectura | `operator-bridge` | asimetría: tiene consumidor y no está en la cola tipada |
| `player-mcp-kit` | sin consumidor productivo; fixture TS | patrón MCP actor si aparece actor real | ninguno | catálogo mantiene actores no lanzables/`workspace:null`; posible huérfano |
| `playbook-kit` | consumo real por `editor-ui` para coherencia de packs; CLI/e2e propios | validador del editor | `editor-ui` | separar función viva de antigua vía MCP/CASOS si quedó sin actores |
| `lifecycle-kit` | consumo real por `ciudad-lifecycle` | infraestructura XState genérica | `ciudad-lifecycle` | correctamente subsumido; no necesita épica propia |
| `game-engine` | múltiples consumidores UI/editor/examples | infraestructura de juego | `ui-3d-kit`, apps y examples | correctamente subsumido |
| `test-utils` | múltiples consumidores test/dev | infraestructura CI | suites mesh/engine | no confundir ausencia de producto con orfandad |
| `authority-kit` | E2E y consumidores de emisión; tipos existentes | autoridad/issue PeerCard canónico | parcialmente real | plano fragmentado con `protocol`, `embajador-kit`, `reparto-kit` y signaling; U188 debe reencuadrarse |
| `embajador-kit` | fixtures vivas y puerta operator-ui, sin consumidor productivo inequívoco | credencial mínima sólo si queda camino único | planificado | firma stub, tipos ausentes y antigua premisa “0 consumidores” falsa/incompleta |
| `protocol`/`rooms` | contratos publicados y tipados | frontera de tercero anónimo | candidatos `zeus-bridge` y LORE-HM futuro | una mención o wrapper local no cuenta como segundo consumidor |

### Encaje vinculante propuesto

- **Consume hoy:** `linea-kit` y sus schemas publicados.
- **Puede consumir en FC3, si el escenario lo exige:** fachada de `linea-system`, provider E publicado, `protocol`/`rooms` para una ceremonia conectada y una familia acta/parte resuelta.
- **Prueba hoy:** escenario, causalidad, wire propio, vista semántica, sellos, ACL/tipestate locales, negativos y sustitución determinista.
- **No prueba todavía:** canal npm limpio extremo a extremo, provider E, MCP Zeus, autoridad PeerCard real, Solid real, vector real ni criptografía real.
- **No posee:** implementación E, contratos Zeus, runtime Solid/U243, federación bridge, catálogo de Z ni Network-Engine.
- Política de dos consumidores: se aplica **por contrato público**. Un consumidor cuenta sólo si instala desde registry/tarball declarado, importa y ejecuta el paquete sin rutas de fuente. El playground cuenta como consumidor únicamente en modo clean-room; una fixture local o wrapper que copie shapes no cuenta.

### Candidatos de backlog FC3 posteriores a la matriz

| candidato | owner | dependencias | CA de cierre | demolición/retirada |
| --- | --- | --- | --- | --- |
| `FC3-FOR-01` · matriz FC1→FC2 | planificación global | Fase 0 | universo completo y dos contrarrevisiones PASS | ninguna |
| `FC3-Z-PLAZA` · disposición acta/parte | Z | matriz + decisión DPO-02 | productor y consumidor real antes de tipos; C8 por paquete que siga | retirar kit huérfano o adaptadores duplicados; no tipar por inercia |
| `FC3-Z-MCP-LINEA` | Z | consumidor LORE-HM limpio identificado | install registry, `strict/noImplicitAny`, llamada MCP real y payload validado | adaptador local equivalente |
| `FC3-Z-MCP-FORCE` | Z | caso de uso explícito distinto de línea | mismo CA, independiente | retirar candidatura si nadie consume |
| `FC3-Z-IDENTIDAD` | Z | matriz + evidencia U188/U186/U187 | un camino de emisión/consumo; scopes y firma atacados; segundo consumidor limpio | stubs/copias y puertas paralelas sin dueño |
| `FC3-E-PROVIDER-PORT` | E y repo origen Document Machine | E00∥E01; E11 para aceptación de boca; DPO-01 | interfaz pública, paquete de canal, provider sintético ejecutable y sin rutas a codebases ajenas | acople directo al repo origen y APIs privadas |
| `FC3-E-VOZ` | E | provider port + E11 | corpus sintético→informe→`@voz` con citas a líneas | contingencia de producto anterior |
| `FC3-HM-ACEPTACION` | HUB+S | provider E + contratos Z/S publicados | instalación limpia; cambio de provider sin cambio de escenario, semántica ni evidencia; cadena H/M sellada | `LocalPodProvider` del camino producto, source paths y shapes vendidas; mocks permanecen sólo en tests |
| `FC3-EXT-ZEUS` | destino según DPO-04 | registry y contratos Z elegidos | tercero anónimo instala y ejecuta rooms/protocol/manifest sin sibling paths | cero runtime/plataforma nueva en Network-Engine |
| `FC3-Z-SOLID-SPIKE` | Z | L03 revalidado + baseline local-first | decisión medida conservar/sustituir/híbrido; no toca runtime | ninguna; spike sólo decide |

### Campaña instrumental FC3-0

No es una ola de producto: construye y ataca los instrumentos que permitirán decidir. Corre en paralelo con la fijación de snapshots, pero no puede modificar el universo ni adelantar recomendaciones. Cada probe declara su control positivo, el mutante que apaga el instrumento entero y la diferencia entre `PASS`, `FAIL` y «no se ejecutó»:

1. **Matriz forense**: agentes HISTORIA-FC1, DISEÑO-FC2 y CORTE-U269 de Fase 1.
2. **Probe de canal limpio**: en temporal fuera de repos, resolver/instalar y clasificar `linea-kit`, `linea-system`, `force-system`, `protocol`, `rooms`, `acta-kit` y `parte-kit`; compilar con `strict/noImplicitAny` y ejecutar sólo superficies ya publicadas. Resultado = evidencia, no arreglo.
3. **Auditoría de puerto E**: derivar interface mínima `DocumentMachineProvider` del escenario y contrastarla con E01/E11/E12 y el repo origen; entregar gap, no código.
4. **Auditoría de costura LORE-HM**: baseline de escenario/semántica/evidencia y lista exacta de puntos que dependen de `LocalPodProvider`, mocks, HMAC o source paths.
5. **Spike documental bridge**: medir qué paquetes y servicios puede consumir hoy un tercero limpio; no implementar B10/B11/B12 ni escribir en Network-Engine.
6. **Ledger de herencia FC2→FC3**: clasificar `planificada|hallada`, reconstruir bloqueos cross-world y registrar mecanismos vivos con owner/mutante. Debe contrastar al menos `U235`, la lane de entrega V+U239, `U218↔V18` y `V103`/`U270`/`U271`.

Salida: universo forense, instrumentos falsables, capacidad real del canal, contrato mínimo de provider, baseline de sustitución, ledger de herencia y decisiones PO reducidas. Ningún paquete ni backlog FC2 se toca.

## Registro de decisiones PO · Addenda FC3-LORE-HM-01

Las siguientes decisiones no pueden cerrarse sólo midiendo el árbol. Cada una tiene default fail-closed y recomendación. Se toman **después de FC3-0**, salvo que se indique lo contrario.

### DPO-FC3-01 · Forma del provider Document Machine

- **A · WP nuevo de puerto + E12 como primer consumidor**: `FC3-E-PROVIDER-PORT` publica interfaz/adaptador desde el repo origen; E12 conserva `@voz` como producto que lo consume.
- **B · Ampliar/reencuadrar E12**: E12 crea puerto, implementación y `@voz` en una sola ficha.
- **C · Diferir provider real**: LORE-HM permanece simulacro y no puede cerrar aceptación de producto.
- **Default fail-closed:** C mientras no haya GO E ni nombre/canal publicable.
- **Recomendado:** **A**, porque separa contrato intercambiable de experiencia `@voz`, respeta “un origen por pieza” y evita un WP de tres responsabilidades.
- **Momento:** tras auditoría de puerto E; antes de cualquier demolición del provider contingente.

### DPO-FC3-02 · Destino de `acta-kit` y familia plaza

- **A · Financiar cableado antes de tipos**: identificar productor y al menos un consumidor real; después decidir tipos de `acta-kit` y, por simetría medida, `parte-kit`.
- **B · Mantener U246 como campaña de tipos aislada**: mejora superficie aunque siga sin cable.
- **C · Retirar `acta-kit`** y conservar `parte-kit`, que sí tiene consumidor.
- **D · Fusionar contrato acta/parte** sólo si la matriz demuestra duplicación semántica y un destino canónico.
- **Default fail-closed:** si FC3-0 no encuentra owner de producto, **C** queda propuesta automática; no se despacha U246.
- **Recomendado:** **A con salida C**. B viola los Ejes I/IV; D requiere evidencia que hoy no existe.
- **Momento:** inmediatamente después de la matriz; bloquea `FC3-Z-PLAZA`.

### DPO-FC3-03 · Identidad pública de LORE-HM y provider E

- **A · Contrato LORE-HM público de S** (nombre candidato `@logos/lore-hm`) y provider E en paquete de su repo origen; dos releases separados.
- **B · LORE-HM interno en S** y sólo provider E público; el playground consume fuente local.
- **C · Absorber lengua en paquete E**.
- **Default fail-closed:** no publicar hasta dos consumidores clean-room y decisión de nombre; continuar con paquetes privados/fixtures claramente marcados.
- **Recomendado:** **A** tras los dos smokes. Mantiene lengua/notaría en S y ejecución en E; B impide probar canal, C mezcla ownership.
- **Nota:** DA-5 de E sigue bloqueando nombres de publicaciones E; la decisión de `@logos/lore-hm` es separada y no la resuelve DA-5.

### DPO-FC3-04 · Hogar durable de `zeus-bridge`

- **A · Harness clean-room en HUB** derivado del dossier, instalación aislada y sin runtime persistente.
- **B · Repo consumidor mínimo independiente** dedicado a certificación de `@zeus/*`.
- **C · Implementar B10/B11/B12 dentro de Network-Engine**.
- **D · Diferir el bridge** y conservar sólo el dossier.
- **Default:** **A** para FC3-0 por coste bajo y frontera clara.
- **Recomendado:** **A→B** si el bridge pasa y se necesita independencia organizativa durable. **C no recomendado**: revive la incubadora como plataforma y contradice el handoff.
- **Momento:** después del probe de canal; no bloquea provider E porque consume otra frontera.

### DPO-FC3-05 · Qué contingencias deben desaparecer en FC3

- **A · Sustituir sólo el provider de producto**; conservar VectorMock, LocalPodProvider y firmas falsas exclusivamente en suites/fixtures, fuera del camino de aceptación real.
- **B · Exigir además vector, Solid y criptografía reales en el mismo FC3.**
- **C · Permitir contingencias en el camino declarado de producto.**
- **Default/recomendado:** **A**. FC3 debe retirar el provider contingente del escenario real y source paths; los mocks siguen siendo instrumentos de test honestos.
- **Escalado:** B sólo con GO explícito y presupuesto propio; C no cierra la condición propuesta por LORE-HM.

### DPO-FC3-06 · Relación L03/SOLID con U243

- **A · Conservar `ZEUS_VOLUMES_ROOT`; pods como adapter adicional.**
- **B · Sustituir el root por cluster de pods.**
- **C · Híbrido por contrato**: root local-first canónico + providers Pod/Solid para sync/proyección, sin fuente única remota.
- **Default fail-closed:** **A** hasta que L03 esté revalidado y U243 mida alternativas.
- **Recomendado para el spike:** contrastar **C** contra A; B sólo si demuestra boot offline, integridad, restore y costes mejores sin romper FC2.
- **Momento:** posterior al provider E mínimo; no bloquea FC3-0 ni U247.

### DPO-FC3-07 · Herencia de U247/U248/U249

- **A · Separar por demanda real**: U247 entra con consumidor de línea; U248 espera consumidor de fuerzas; U249 certifica sólo el conjunto realmente publicado.
- **B · Mantener campaña conjunta U247+U248+U249.**
- **C · Diferir toda la campaña MCP.**
- **Default/recomendado:** **A**. Evita que la simetría de paquetes sustituya al caso de uso.
- **Momento:** tras probe clean-room; no reabre IDs FC2, se remapea a candidatos FC3.

### DPO-FC3-08 · Peso de LORE-HM en la DoD global

- **A · Gate transversal acotado**: bloquea sólo contratos que consume/prueba y el provider E asociado.
- **B · Convertir LORE-HM en aceptación global de FC3.**
- **C · Mantenerlo opcional/horizonte.**
- **Default/recomendado:** **A**. B reproduce el patrón que canibalizó FC2; C pierde el segundo consumidor que justifica el caso.
- **Momento:** decisión de fundación FC3, antes de escribir el backlog definitivo.

### DPO-FC3-09 · Alcance productivo de `player-mcp-kit` y vía MCP de `playbook-kit`

- **A · Integrar ambos en un actor real LORE-HM u otro caso**, con imports desde canal y e2e de intención/evidencia.
- **B · Conservar `playbook-kit` sólo como validador del editor y retirar/archivar la vía MCP; proponer retirada de `player-mcp-kit` si sigue sin consumidor.
- **C · Declararlos infraestructura futura sin consumidor.**
- **Default fail-closed:** **B** si la matriz confirma cero actor productivo; no inventar actor para salvar paquetes.
- **Recomendado:** **B**, salvo evidencia nueva de un consumidor real. C perpetúa el punto ciego; A sólo si nace de producto, no de rescate.

### DPO-FC3-10 · Plano PeerCard

- **A · Camino canónico en `protocol`+`authority-kit`; `embajador-kit` se absorbe o queda adapter mínimo sin firma propia.**
- **B · Mantener los cuatro sitios con contrato explícito y gates de paridad.**
- **C · Elegir `embajador-kit` como fachada pública y ocultar las piezas inferiores.**
- **Default:** no demoler hasta matriz+revisión de consumidores.
- **Recomendado:** **A**, sujeto a la contrarrevisión de U188 y a demostrar que las fixtures operator-ui siguen por un único camino. B paga deriva permanente; C necesita consumidores públicos que hoy no existen.

### DPO-FC3-11 · Reto de producto completo U235

- **A · Heredarlo como P0 FC3**: instalación limpia → runtime → juego → actores → intent → estado → restart → recuperación, offline tras seed.
- **B · Ejecutarlo como diagnóstico antes de fijar prioridades**: el primer fallo observado ordena el backlog FC3; después se decide su hito final.
- **C · Diferirlo** y declarar que FC3 no acredita producto extremo a extremo.
- **Default fail-closed:** sin A o B, el acta debe decir **producto completo no demostrado**; no puede inferir cierre a partir de piezas verdes.
- **Recomendado:** **B→A**. Usarlo primero como instrumento de priorización y conservarlo luego como hito de aceptación evita planificar transporte sin destino.
- **Momento:** tras cerrar la matriz y antes de ordenar las primeras olas de producto.

### DPO-FC3-12 · P0 de entrega Z·V

- **A · Heredar una lane protegida de entrega** con `V86`, `V84`, `V82`, `V26`, `V20` y `U239`, conservando dependencias y prioridad hasta medirlas.
- **B · Repriorizarlos con el resto**, pero exigir decisión individual y evidencia antes de bajar cualquier P0.
- **C · Diferir la entrega pública** y declarar que el editor sigue sin salida para terceros.
- **Default fail-closed:** no bajar prioridad por ausencia de demo vistosa; cada movimiento exige veredicto y efecto sobre consumidor externo.
- **Recomendado:** **A**, sujeto al cuadre de dependencias de la matriz. Es la frontera medida entre «funciona aquí» y «funciona para otro».
- **Momento:** fundación del backlog FC3, después del ledger de herencia.

### DPO-FC3-13 · Superficie holónica `U218↔V18`

- **A · Preservar la épica acoplada** hasta obtener 7/7 marcas por evidencia propia, con las dependencias HUB/O/G/L/custodio visibles en el punto de restauración.
- **B · Dividir por mundo** manteniendo un gate global que impida cierres parciales presentados como 7/7.
- **C · Diferir la superficie holónica** y declarar qué capacidades dejan de validarse.
- **Default fail-closed:** no podar `V18` ni declarar `U218` diferido hasta reconstruir las seis dependencias desde ambos extremos.
- **Recomendado:** **A**; B sólo si el gate global existe y tiene mutante de apagado. La marca la pone cada holón y se observa desde fuera; un reporte no cuenta.
- **Momento:** después del mapa cross-world y antes de cualquier retirada/repriorización en V.

### DPO-FC3-14 · Fichas halladas y deuda de instrumentos

- **A · Resolver antes de las olas de producto** `V103`, `U270` y `U271`, y asignar owner a los mecanismos vivos heredados.
- **B · Crear lane de mantenimiento FC3** con SLA/caducidad explícita y bloqueo sólo sobre la superficie afectada.
- **C · Diferir cada ficha individualmente** con owner, fecha de revalidación y límite que permanece abierto.
- **Default fail-closed:** ninguna ficha `hallada` desaparece por no pertenecer a la visión de producto; sin decisión queda en el ledger con owner pendiente, no se da por subsumida.
- **Recomendado:** **A** para los fallos de instrumento baratos y ya reproducidos; **B** para mecanismos durables. C sólo con coste medido.
- **Momento:** al convertir el ledger de herencia en backlog FC3.

### DPO-FC3-15 · Estatuto de los instrumentos de FC3

- **A · Gate metodológico obligatorio**: todo instrumento de aceptación trae control positivo real, mutante de apagado total, owner y ablación post-último cambio.
- **B · Aplicarlo sólo a instrumentos de riesgo independiente**, clasificados por el orquestador.
- **C · Mantener revisión manual** sin gate común.
- **Default fail-closed:** un instrumento sin prueba de que puede enrojecer produce evidencia `sin verificar`, nunca PASS.
- **Recomendado:** **A** para los instrumentos que firman la matriz/ledger; B para ayudas exploratorias que no conceden estado. C reproduce el punto ciego de FC2.
- **Momento:** antes de despachar FC3-0.

**Decisiones resolubles sin PO**

- Revalidar si L03/L04/L05 están aceptados, mergeados o sólo descritos: se resuelve por snapshot, reportes y CI, no por elección.
- Verificar consumidores y tipos de cada paquete: se resuelve con matriz y clean-room.
- Determinar si el provider contingente es `LocalPodProvider` y dónde se invoca: se resuelve por código.
- Determinar si bridge instala/ejecuta paquetes hoy: se resuelve con probe, no con decisión.
- Revalidar el estado operativo heredado del handoff FC2 y marcar cada fila `foto|medido`: se resuelve contra árbol, procesos, reportes y CI.
- Derivar coordenadas de hechos anclados y comprobar su cardinalidad: se resuelve con instrumento, no con decisión.
- Identificar mecanismos vivos, forma de invocación, owner actual y si están cableados: se resuelve inspeccionando código/workflows y ejecutando sus mutantes.
- Distinguir fichas `planificada|hallada`: se resuelve por la fuente de alta y la primera evidencia, sin decidir todavía su prioridad FC3.
