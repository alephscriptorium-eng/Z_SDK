# HANDOFF (saliente) — feedback a skills-scriptorium tras adoptar 0.3.1

| dato | valor |
| ---- | ----- |
| origen | mundo consumidor zeus-sdk (orquestador) |
| destino | diseñador/mantenedor de `@alephscript/skills-scriptorium` |
| fecha | 2026-07-20 |
| versión evaluada | `0.3.1` (registry propio) |
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
