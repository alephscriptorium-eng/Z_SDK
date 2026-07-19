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
- [ ] Si el WP toca docs públicas con comandos o listas de canal: ¿C8 y C9
      (§8) cumplidos? (comando ejecutado contra el canal real; sin lista
      manual de eventos futuros sin fuente/caducidad)

Regla de evidencia (heredada de CASOS.md y va en serio): **no inventes
observaciones**. Pega la salida real. Si no lo ejecutaste, escribe
`⏳ sin verificar` y por qué. Incluye **Actions** cuando el WP dispara
runner: salida de `gh run list` / `gh run view` (run_id + conclusion) —
misma literalidad que tests/lint. Si paths-ignore U104: **N/A** (no inventes
un verde).

## 4. Formato de reporte

Copia [REPORTES/PLANTILLA.md](REPORTES/PLANTILLA.md) a
`REPORTES/WP-<id>-<slug>.md` y rellénala entera (incluye subsección
**Evidencia CI**). Reportes que no se aceptan:
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

**CI en `wp/*` (Actions):** tras push, el workflow CI corre en la rama salvo
`paths-ignore` U104 (`plan/**`, `**.md`). Verde local (`lint` / `gates` /
tests) **no** sustituye el gate remoto cuando el runner aplica. Evidencia:
`gh run list --branch <rama>` → run_id + conclusion, o **N/A** si el ignore
aplica. Docs (`docs/**`) tiene workflow propio; ver roles ORQUESTADOR /
REVISION / WORKER. **Tip de `main` sin run asociado = push faltante =
rojo** (no asumir Pages/CI del tip local; fallo 2026-07-19 U132 library
ahead sin `git push`).

## 6. Commits

Esta codebase y sus repos hermanos siguen **versionado semántico integrado
en CI/CD** (ARQUITECTURA §5, WP-U53). El histórico que el swarm escribe es el
que changesets + el workflow de release consumen:

- **Commits convencionales**: `tipo(alcance): resumen` — tipos
  `feat|fix|refactor|test|docs|chore`; alcance = paquete tocado
  (`feat(protocol): roles en makeIntent`). Ruptura de API o demolición:
  `refactor(x)!:` o footer `BREAKING CHANGE:` — durante la 0.x el «!» no
  dispara majors, pero deja el rastro que el changelog necesitará.
- Un WP puede tener varios commits, pero cada commit compila y cuenta UNA
  cosa; nada de `wip`, `fix2`, `arreglos`.
- **Changeset obligatorio** en todo WP que toque un paquete **publicable**
  (`packages/engine/*` sin `private: true`): `npx changeset` con bump
  (`patch`/`minor`/`major`) + nota de changelog. El pipeline
  (`.github/workflows/release.yml`) acumula changesets → bump por paquete →
  changelog → `npm publish` al registry propio + tag + GitHub Release, solo
  con pipeline verde y secrets `NPM_USERNAME` + `NPM_PASSWORD` (basic-auth
  `_password`, D-24). Verificación local sin publish:
  `npm run release:changeset-dry`. Los juegos y el mesh/editor siguen
  privados y no se publican desde aquí.

## 7. Ciclo de sprint (gobernanza)

El swarm trabaja por **sprints** (lotes con GO del usuario). El ciclo ya
probado — formalizado aquí — es obligatorio para orquestador y workers.
Detalle operativo de roles en [roles/README.md](roles/README.md).

### Entrada

- Un sprint arranca solo con **lote + GO explícito** del usuario
  (entrega/`ENTREGA-…`, decisión en `DECISIONES.md`, o mensaje claro).
- Sin GO: no hay 🔶 nuevos ni briefs de lote. Candidatos viven en
  «Cola residual viva» u horizonte — no se inventan frentes.

### Ejecución

- El orquestador parte el lote en WPs con **CA verificables**, marca 🔶 en
  `main`, rellena briefs y (si hay paralelo) worktrees.
- Un WP = un chat worker = una rama. El worker entrega reporte + evidencia;
  **Devuelto es legítimo** (REVISION → CORRECCION en la misma rama).
- No se cierra un sprint «en silencio» mientras queden WPs ⬜/🔶 del lote
  o reportes sin revisión.

### Cierre — estado declarado siempre

Al terminar (o al pausar) un sprint, el orquestador **declara el estado**
en el remate de `BACKLOG.md` y, si el sprint tiene carpeta `ENTREGA-…`,
en un acta de cierre. Fórmula — **nunca silencio**:

| Fórmula | Cuándo |
| ------- | ------ |
| `IDLE sin pendientes` | Lote del sprint ✅; 0 🔶; sin tick externo bloqueando el cierre |
| `esperando: <tick> de <quién>` | Falta revisión/merge, GO de otro lote, tick ops/usuario, DNS, secrets, etc. |

Ejemplos: `esperando: revisión U130 de orquestador` ·
`esperando: CI verde de runner` ·
`esperando: DNS custom domain de ops` · `IDLE sin pendientes`.

Si el remate espera pipeline: usar `esperando: CI|Docs de <rama/WP>` hasta
`gh run` en conclusion `success` (o N/A paths-ignore).

### Retro

- Hallazgos de reportes del sprint → **registro de residuales**
  (`BACKLOG.md` §Cola residual viva), no colas nuevas «por WP» en el
  tablero vivo.
- Residuales **sin GO** no abren 🔶. El siguiente sprint los toma solo si
  el usuario los incluye en un lote con GO.

## 8. Docs — C8 / C9 (criterio de aceptación estándar)

WPs que toquen **docs públicas** (portales, fichas, guías con comandos
copiables o tablas de canal/versión) se aceptan o se **devuelven** también
contra C8 y C9. Son citables por workers y por el orquestador en revisión
(mismo rango que §1: incumplimiento = WP devuelto). Origen: método WEBS,
incidente de canales 2026-07-19.

### C8 — Canal real de cada comando

Todo comando **copiable** se **ejecuta** contra su canal antes de entregar.
«Publicado» es ambiguo: GitHub Release ≠ registry npm ≠ tarball. Los
canales gated solo se anuncian en la página de estado — no como canal
operativo en fichas ni como bloque `bash` que el lector pueda copiar y
fallar.

Evidencia mínima en el reporte: salida literal del comando (o del grep CA
del WP) contra el canal que la página afirma. Si el canal no está
operativo hoy, el texto no lo presenta como tal.

**Pages vs local:** un `docs:build` / preview local **no** prueba el portal
en GitHub Pages. Si el WP afirma o depende del sitio desplegado, cotejar
Actions Docs (`gh run`) o la URL pública — no sustituir con solo build
local. (No añade gate nuevo; acota C8 al canal real.)

**Nav / SPA vs assets estáticos:** un enlace (menú **o** cuerpo md) a un
asset estático (p. ej. Redoc/OpenAPI en `public/api/*.html`) se verifica
**navegándolo** (clic in-app o e2e del router), no solo con `curl`. `curl`
prueba el servidor; el bug puede vivir en el router del cliente
(`cleanUrls`, SPA). Canal de verificación = canal de uso. CA de bug = la
**clase** (todo enlace interno a ese asset), no solo la instancia
reportada; grep de control `href="/api/` sin `target` en `docs/**`.

### C9 — Listas manuales dependientes de eventos futuros

Una lista o tabla **manual** que depende de eventos futuros (nuevos
releases, nuevos juegos, estado de publish…) = **rot en potencia**. Antes
de entregar, una de estas tres:

1. se **genera** de la fuente (script / datos vivos), o
2. se **borra** dejando link a la fuente única (p. ej. página de Releases), o
3. lleva **caducidad** explícita (fecha o condición de invalidación).

Duplicar a mano lo que ya vive en Releases, registry o una página de
estado es C9 incumplido.

### Candidata — auditoría de verdad re-ejecutable

El inventario WEBS/CANTERA/01 rev1 (clases ESTABLE / VIVA-OK / ROT /
ROT-FUTURO cotejables por comandos: `gh release list`, `npm view`,
existencia de rutas/scripts citados) es una **auditoría de verdad
re-ejecutable**. Queda como **candidata** a práctica periódica o a gate de
`docs:build` — hoy no es gate instalado ni checklist obligatorio; C8 y C9
sí lo son. El orquestador/vigilante puede usarla como contraste post-merge
de WPs de docs. Formalizarla como gate = WP futuro con GO.
