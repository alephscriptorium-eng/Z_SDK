# PRACTICAS — lectura obligatoria antes de tocar código

Este documento existe porque el código de agente tiene modos de fallo
conocidos y repetidos. No es una guía de estilo: es la lista de cosas por las
que un WP **se devuelve**. El orquestador revisa contra esto.

## 1. Anti-monkey-code (reglas duras)

1. **Cero puertos/URLs/rutas hardcodeados.** Todo puerto sale de
   `presets-sdk/env` (`resolveZeusUiPorts`, `resolveZeusMcpPorts`) y toda URL
   de room de `ZEUS_SCRIPTORIUM_URL` vía `@zeus/rooms`. Si el resolver no
   cubre tu caso, se amplía el resolver — no se escribe `3021` en el código.
   (Excepción: docs y specs pueden citar puertos concretos como ejemplo.)
2. **Tablas y maps, no cadenas de if/else-if o switch crecientes.** El patrón
   de la casa es la tabla de handlers del reducer
   (`packages/games/delta/arg-domain/src/reducer.mjs`): objeto `{ intent: handler }`.
   Tres o más ramas sobre el mismo discriminante = tabla. Sin excepciones «es
   que solo son cuatro casos» — el quinto lo añade otro que no leyó esto.
3. **Dominio puro.** Reducers y motores sin red, sin fs, sin `Date.now()`
   escondido (el tiempo entra como argumento), sin efectos. Efectos solo en
   los bordes (autoridad, servers, launchers).
4. **Reutiliza o extrae, nunca copies.** Si necesitas algo que ya existe en
   otro paquete, impórtalo; si no está exportado, exportarlo ES parte de tu
   WP; si es de otro mundo (regla de dependencia §ARQUITECTURA 4), propón en
   el reporte extraerlo a `engine/`. Copy-paste entre paquetes = WP devuelto.
5. **Nada de nombres de transición.** Prohibido `legacy`, `v2`, `-old`,
   `-new`, `-final`, `2`, `Copy`, código comentado «por referencia», y
   re-exports de compatibilidad. La demolición del WP borra el original; git
   es la referencia histórica.
6. **Errores explicables.** Un rechazo o fallo debe poder explicarse: sigue el
   patrón del dry-run del reducer (devolver la regla probable), y los
   deep-links honestos (`ghost` / `「sintético」`, jamás un ENOENT crudo al
   usuario).
7. **Browser-safe vs node-only separados** por paquete o subpath export, como
   `arg-domain` (puro) vs `arg-feeds` (node). No se mete `fs` en un paquete
   que hoy corre en navegador.
8. **Snapshot con presupuesto.** Todo estado que viaje por room respeta un
   presupuesto medible (patrón G-ARG.5: arrays compactos, diffs). Si tu WP
   agranda el snapshot, el reporte trae el número antes/después.
9. **Los docs acompañan al código.** Si cambias contrato, rutas o eventos,
   regeneras specs (`spec:generate:*`) y actualizas el README del paquete en
   el mismo WP. Un README que miente es peor que ninguno.
10. **Tests en el mismo WP.** Unit para lógica, e2e si tocas protocolo o
    procesos. Un WP sin tests nuevos sobre lo nuevo no se acepta (salvo WPs
    de pura demolición/movimiento, que se verifican con los tests existentes
    en verde).
11. **La regla de los dos juegos** (D-8; el antídoto contra canonizar el
    ejemplo). El SDK tiene dos juegos, `delta` y `pozo`, y el engine sirve a
    los dos o no es engine:
    - `engine/*` **jamás nombra un juego concreto** ni sus conceptos
      exclusivos (grifo, cantera, pozo…). Si tu abstracción necesita saber a
      qué juego sirve, no es una abstracción: es el ejemplo con disfraz. Hay
      gate (WP-U00.d).
    - Si generalizas algo desde delta, pregunta obligatoria en el reporte:
      «¿pozo puede consumir esto tal cual?». Si la respuesta es no, la
      generalización está mal cortada.
    - Todo WP que toque engine deja verdes los tests de AMBOS juegos (cuando
      pozo exista, WP-U23).
    - Lo específico de un juego vive en su paquete de juego. Mover algo de
      juego a engine «porque quizá sirva» está prohibido: se mueve cuando el
      segundo consumidor existe de verdad.

## 2. Alcance

- Haz el WP, todo el WP (incluida demolición) y solo el WP.
- Lo que descubras por el camino — bugs ajenos, código muerto, ideas — va a la
  sección *hallazgos* de tu reporte. El orquestador decidirá si se convierte
  en WP. **No lo arregles de pasada**: los arreglos de pasada son la fuente
  nº 1 de regresiones sin test.
- Si el WP resulta estar mal especificado (falta una dependencia, el CA es
  imposible, el código real contradice el plan), **para y repórtalo**. Un WP
  reinterpretado en silencio es más caro que un WP parado.

## 3. Auto-revisión obligatoria (el «tiempo de mirar lo hecho»)

Al dar por terminada la implementación, **para de escribir código**. Relee el
diff completo (`git diff main...HEAD`), archivo a archivo, contra este
checklist, y corrige lo que caiga. Después rellena el checklist en tu reporte
con honestidad — se acepta un «lo vi y lo dejé porque X», no se acepta un ✅
mecánico:

- [ ] ¿Algún puerto, URL, ruta absoluta o nombre de room hardcodeado?
- [ ] ¿Alguna cadena if/else-if/switch que debería ser tabla/map?
- [ ] ¿Duplico algo que ya existía en otro paquete (búscalo antes de responder)?
- [ ] ¿Dejé `console.log` de depuración, código comentado, TODO sin backlog?
- [ ] ¿Nombres fuera del glosario de VISION.md o de transición (v2/old/new)?
- [ ] ¿La demolición está completa? (`grep` del símbolo/paquete borrado: cero
      referencias vivas)
- [ ] ¿Los tests prueban comportamiento (entradas→salidas) o solo que «no
      explota»?
- [ ] ¿Funciona el arranque afectado de verdad? (levantaste el proceso/demo y
      lo miraste, no solo unit tests)
- [ ] ¿README/specs del paquete siguen siendo verdad?
- [ ] ¿El diff contiene SOLO el alcance del WP?

Regla de evidencia (heredada de CASOS.md y va en serio): **no inventes
observaciones**. Pega la salida real. Si no lo ejecutaste, escribe
`⏳ sin verificar` y por qué.

## 4. Formato de reporte

Copia [REPORTES/PLANTILLA.md](REPORTES/PLANTILLA.md) a
`REPORTES/WP-<id>-<slug>.md` y rellénala entera. Reportes que no se aceptan:
sin evidencia literal, sin auto-revisión, sin sección de demolición, o que
describen intenciones («se debería…») en vez de hechos.

## 5. Gates ejecutables

El WP-U00 instala gates automáticos (patrón `grep-gates` del ARG, WP-15) que
ponen en rojo las violaciones de §1 detectables por grep: puertos hardcodeados
fuera de `presets-sdk/env` y de docs, nombres de transición en código nuevo,
imports que violan las reglas de dependencia de ARQUITECTURA §4. Los gates
corren con `npm run gates` y en los e2e. Si tu WP necesita una excepción
legítima, se anota en el archivo de excepciones del gate CON comentario de por
qué — nunca desactivando el gate. Desde WP-U03, los gates corren también en CI
sobre cada rama `wp/*`: lo que aquí es criterio de devolución, allí es rojo.

## 6. Commits

Tras las olas, esta codebase y sus repos hermanos siguen **versionado
semántico integrado en CI/CD** (ARQUITECTURA §5). El histórico que el swarm
escribe HOY es el que las herramientas de release leerán mañana — el formato
se adopta desde ya, no en la ola 5:

- **Commits convencionales**: `tipo(alcance): resumen` — tipos
  `feat|fix|refactor|test|docs|chore`; alcance = paquete tocado
  (`feat(protocol): roles en makeIntent`). Ruptura de API o demolición:
  `refactor(x)!:` o footer `BREAKING CHANGE:` — durante la 0.x el «!» no
  dispara majors, pero deja el rastro que el changelog necesitará.
- Un WP puede tener varios commits, pero cada commit compila y cuenta UNA
  cosa; nada de `wip`, `fix2`, `arreglos`.
- Cuando exista el pipeline (WP-U53), todo WP que toque un paquete publicable
  añadirá además su **changeset** (declaración de bump + nota de changelog);
  hasta entonces, el commit convencional basta.
