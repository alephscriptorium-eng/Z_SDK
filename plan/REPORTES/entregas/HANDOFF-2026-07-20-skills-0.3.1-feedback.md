# HANDOFF (saliente) — feedback a skills-scriptorium tras adoptar 0.3.1

| dato | valor |
| ---- | ----- |
| origen | mundo consumidor zeus-sdk (orquestador) |
| destino | diseñador/mantenedor de `@alephscript/skills-scriptorium` |
| fecha | 2026-07-20 |
| versión evaluada | `0.3.1`; **revisado de nuevo contra `0.3.3`** (los 3 puntos siguen abiertos) |
| estado | **pendiente de validación** — esperando feedback del diseñador |
| canal de envío | ⏳ sin definir (lo fija el custodio; esta nota queda asentada en disco) |

Nota escrita con ceguera (regla 14): sin rutas locales, sin identificadores
de instancia. Solo método + versiones.

---

## Contexto

zeus-sdk adoptó 0.3.1 con rango `0.x` (pin de major). Al aplicar los tres
frentes nuevos (regla 15, CHANGELOG derivado, site-web WP-01/06/08) sobre un
mundo real —monorepo npm-workspaces con changesets y portal VitePress
propio— aparecen **tres puntos a validar**. No bloquean la adopción; se
elevan como mejora del skill para consumidores no triviales.

---

## Punto 1 — Semver: la regla 15 es contrato nuevo servido como *patch*

**Observación.** 0.3.1 añade la **regla 15** al contrato del método
(`reglas-metodo-v03` → `v04`). El propio CHANGELOG del paquete calificó de
**minor** el añadido anterior (reglas 13–14, en 0.2.0 → 0.3.0). Por
coherencia, ampliar el contrato con la regla 15 debería ser **`0.4.0`**, no
un patch `0.3.1`.

**Por qué importa.** El paquete ahora recomienda consumo por **rango**
(un consumidor con `0.x` recibe reglas de método nuevas dentro de un patch,
sin señal semver). Un consumidor que quisiera congelar el contrato del
método no tiene una frontera minor donde fijarse.

**Propuesta (a validar):** re-etiquetar como `0.4.0`, **o** fijar doctrina
explícita en el CHANGELOG/README: «añadir o modificar una regla de método =
minor; patch = solo correcciones sin cambio de contrato».

**Evidencia reforzada en `0.3.3`.** WP-11 (0.3.2) introduce un *badge* que
muestra «versión de método de `swarm-orquestacion` = **v0.4.0**» mientras
el **paquete** publicado sigue en **`0.3.3`**. La divergencia
método-vs-semver-de-paquete ya es explícita en el propio portal, pero **sin
reconciliar**: un consumidor por rango `0.x` recibe método v0.4 dentro de
parches 0.3.x. Refuerza la propuesta: o el paquete sube a `0.4.0`, o el
README fija que «versión de método» y «semver de paquete» son ejes
distintos y declara la correspondencia.

## Punto 2 — El gate de CHANGELOG asume mundo de un solo paquete

**Observación.** La práctica «CHANGELOG derivado del backlog» + el gate
`verificar-changelog.mjs` asumen **un `BACKLOG` ↔ un `CHANGELOG`** con
WP-ids. En un monorepo con **changesets** el modelo real es distinto:

- N `CHANGELOG.md` **por paquete publicable**, **máquina-generados** por
  changesets (keyed por SHA de commit, no por WP-id).
- Un plano de **gobierno** aparte (el `BACKLOG` del plan) que sí habla en
  WP-ids.

El gate tal cual, apuntado a los changelogs de paquete, marcaría **todos**
los WP ✅ del backlog como «ausentes» (falsos positivos), porque esos
changelogs no referencian WP-ids de forma exhaustiva.

**Propuesta (a validar):** que la práctica y el gate distingan
explícitamente **«CHANGELOG de gobierno»** (derivado del `BACKLOG`, uno por
mundo) de **«CHANGELOG de paquete»** (changesets/semver, N por monorepo), y
que el gate sea **parametrizable/opt-in** al primero — no que asuma que solo
existe un changelog. Sin esto, el skill no es adoptable *verbatim* en
monorepos con release automatizado.

## Punto 3 — «Enlaces al back» (WP-08) no debe resolverse por página

**Observación (elevada por el custodio del mundo consumidor).** WP-08
—enlaces al back (repo/registry/CI) en cada página + página «Proyecto»—
tal como se entiende invita a **hardcodear el mismo bloque de enlaces en
cada página** (en un portal de 25 páginas, 25 veces el mismo dato). Eso es
un antipatrón: duplicación que se desincroniza (drift) en cuanto una URL
cambia.

**Propuesta (a validar):** los enlaces al back son un asunto de **tema /
layout**, no de contenido de página. Deben declararse **una sola vez** y
renderizarse en todas las páginas vía **cabecera/pie del tema** o
**componente compartido**, con **placeholders reutilizables** (repo,
registry, CI como variables del sitio). El método del skill debería
entregar WP-08 como config de tema + placeholders, no como texto por
página. Si el objetivo es que cada página *muestre* el back, que sea el
footer/nav quien lo haga con una fuente única.

**Corolario para el generador:** si además el generador emite enlaces
**defectuosos por página** (ej. slug del repo inconsistente entre páginas),
la corrección correcta es **regenerar la pipeline con las instrucciones
nuevas** (fuente única de la URL), no parchear página a página.

---

## Qué hace zeus mientras tanto (no espera al feedback)

- Adopta 0.3.1 como baseline (D-37).
- Regla 15: ya cumplida de facto; se cita como contrato.
- CHANGELOG de gobierno: se crea **de raíz, granularidad por ola/sprint**
  (grueso), no changelog de paquete — evita el choque del Punto 2.
- site-web: instala el gate `verificar-sitio.mjs`; los back-links se
  resuelven **a nivel de tema** (coherente con el Punto 3, sin esperar al
  rediseño del skill).
- Vigilancia: se materializa estación con los checks 0.3.1.

Estos tres puntos quedan **abiertos esperando feedback**; su resolución en
el paquete puede simplificar la calibración local de zeus más adelante.

---

## Punto 4 — El parser de `proyectar-backlog.mjs` exige un formato de bullet no documentado

**Observación (al adoptar 0.3.2/0.3.3 en un backlog real).** El parser de
`proyectar-backlog.mjs` solo reconoce bullets con la forma
`- <estado> **WP-XX · título**` (ID y título dentro del mismo `**…**`). Un
backlog vivo mezcla estilos —`- <estado> **WP-XX** (prosa)` o
`**WP-XX** — prosa`— y esos WP **no se parsean** (en un backlog real, ~16
de ~47 bullets quedaron fuera; la proyección `--alcance abiertos` salió
vacía aunque había trabajo abierto).

**Propuesta (a validar):** o el método **documenta el contrato de formato**
del bullet como requisito duro (y el gate de changelog/vigía lo verifica),
o el parser se **flexibiliza** para aceptar el ID fuera del `**…**` y el
título tras `·`/`—`/`(`. Un requisito de formato implícito hace que la
proyección falle en silencio (0 proyectados) en vez de avisar.

**Corolario de ceguera (relacionado con el Punto 2/3).** En un backlog de
gobierno real, el propio vocabulario del método («custodio», «vigía», etc.)
vive legítimamente en el markdown. El gate de ceguera —correctamente—
**bloquea** proyectar eso a un tracker público. Implica que el método
debería decir explícitamente: **proyectar a tracker público exige un
backlog blindado**, o recomendar tracker privado. Hoy el consumidor lo
descubre al chocar con el `exit 1`.

## Revisión contra 0.3.2 / 0.3.3 (2026-07-20)

Releases posteriores fueron por **otro eje** (proyección del backlog a
GitHub Issues: WP-09/10/12) y **no tocan** los tres puntos: siguen abiertos.

- **Punto 1** — reforzado (ver «Evidencia en 0.3.3» arriba: badge v0.4.0 vs
  paquete 0.3.3).
- **Punto 2 y 3** — sin cambios; el gate de CHANGELOG y WP-08 (back-links)
  no se han revisado.
- **Convergencia a favor (no es queja):** WP-11 recomienda **gitignorar**
  la copia `.claude/skills` (fuente = `node_modules`). Es exactamente la
  decisión que zeus tomó por su cuenta antes de esta release — señal de que
  la dirección es correcta.
- **Interés de adopción (aparte del feedback):** la proyección
  backlog→Issues (opt-in, con gate de ceguera y aviso del vigía ante
  proyección no declarada) es candidata a evaluar en zeus en un lote futuro.
