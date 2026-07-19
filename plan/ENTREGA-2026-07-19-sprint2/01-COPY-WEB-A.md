# Copy final — Web A · `zeus-sdk/docs` (WP-W1)

> Aplicar **verbatim** (reglas en `00-PAQUETE.md`). Cada entrada localiza el
> punto por su bloque **ANTES** literal. `config.mjs`, sidebar y nav de este
> portal **no se tocan**.

---

## 1 · `docs/index.md` — frontmatter completo

Reemplazar **todo el frontmatter** (de `---` a `---`) por:

```yaml
---
layout: home
hero:
  name: Zeus SDK
  text: Crear juegos, no dialectos
  tagline: |-
    El aparato de Scriptorium. Un solo contrato —AsyncAPI + authority + MCP por actor—
    y un engine que no habla el dialecto de ningún título: habla el protocolo común.
    La crew monta la sesión desde la sombra; el relato lo ponen las obras.
    Abrí una puerta y seguí el mapa.
  actions:
    - theme: brand
      text: Guía
      link: /guide/getting-started
    - theme: alt
      text: Contratos
      link: /contracts/asyncapi
    - theme: alt
      text: Juegos
      link: /games/
features:
  - title: Guía
    details: Arrancá, recorré el mapa del monorepo y conocé la regla que mantiene honesto al engine.
    link: /guide/getting-started
  - title: Contratos
    details: 'La verdad vive en su fuente: AsyncAPI del envelope, OpenAPI/Redoc de rutas, resources MCP. Enlazado, no copiado.'
    link: /contracts/asyncapi
  - title: Juegos
    details: Los juegos de referencia consumen el engine tal cual — un kit, muchas piezas. Su cara de obra vive en el catálogo.
    link: /games/
---
```

Notas: `hero.name` y `hero.text` quedan idénticos a los actuales (el lema está
exento y se conserva). `actions` idénticas. Solo cambian `tagline` y los tres
`details`.

---

## 2 · `docs/guide/getting-started.md` — línea de marco

**ANTES** (H1 seguido directo de la sección):

```md
# Arranque rápido

## Requisitos
```

**DESPUÉS:**

```md
# Arranque rápido

De cero al aparato andando: lo mínimo para instalar, levantar el portal y
tocar un contrato vivo.

## Requisitos
```

---

## 3 · `docs/guide/layout.md` — línea de marco

**ANTES:**

```md
# Mapa del monorepo

Layout canónico
```

**DESPUÉS:**

```md
# Mapa del monorepo

El territorio de un vistazo: qué vive dónde y por qué. El árbol manda; este
mapa solo lo señala.

Layout canónico
```

---

## 4 · `docs/guide/two-games.md` — línea de marco (la tesis se conserva)

**ANTES:**

```md
# Regla de juegos de referencia

El engine se valida con
```

**DESPUÉS:**

```md
# Regla de juegos de referencia

La regla que mantiene honesto al engine:

El engine se valida con
```

El resto de la página (incluida la frase «es el ejemplo con disfraz») queda
**intacto**: ya es voz de la casa.

---

## 5 · `docs/guide/external-handshake.md` — línea de marco

**ANTES:**

```md
# Handshake externo — consumidores anónimos

La frontera pública del SDK
```

**DESPUÉS:**

```md
# Handshake externo — consumidores anónimos

Una sola promesa: con el contrato y el registry alcanza; nadie te pregunta
quién sos.

La frontera pública del SDK
```

---

## 6 · `docs/engine/index.md` — frase-marco

**ANTES:**

```md
# Engine

Lo genérico y publicable del SDK. Vive en `packages/engine/*`.
```

**DESPUÉS:**

```md
# Engine

El corazón del aparato: lo que es de todos los juegos y de ninguno.
Lo genérico y publicable del SDK. Vive en `packages/engine/*`.
```

La tabla de paquetes y la frase de cierre («El engine habla el protocolo
común…») quedan **intactas**.

---

## 7 · `docs/engine/protocol.md` — frase-marco

**ANTES:**

```md
Envelope canónico del runtime de juego:
```

**DESPUÉS:**

```md
La lengua franca del aparato: un envelope y cuatro eventos; todo lo demás es
dialecto. Envelope canónico del runtime de juego:
```

---

## 8 · `docs/engine/authority-kit.md` — frase-marco

**ANTES:**

```md
Autoridad genérica: loop de tick,
```

**DESPUÉS:**

```md
El kit pone el pulso; tu juego pone las reglas.
Autoridad genérica: loop de tick,
```

---

## 9 · `docs/engine/player-mcp-kit.md` — frase-marco

**ANTES:**

```md
Patrón **un MCP por actor** con semántica verificable:
```

**DESPUÉS:**

```md
Cada actor con su propia boca — y ninguna jugada sin evidencia.
Patrón **un MCP por actor** con semántica verificable:
```

---

## 10 · `docs/engine/playbook-kit.md` — frase-marco

**ANTES:**

```md
Método **CASOS** como producto del SDK (no un extra del primer juego):
```

**DESPUÉS:**

```md
El método que convierte «funciona» en un acta: casos verificables, mitad
agente, mitad ojo humano.
Método **CASOS** como producto del SDK (no un extra del primer juego):
```

---

## 11 · `docs/engine/view-kit.md` — frase-marco

**ANTES:**

```md
Kit de vistas **3D + HTML** browser-safe.
```

**DESPUÉS:**

```md
Las vistas son del kit; la escena es de tu juego.
Kit de vistas **3D + HTML** browser-safe.
```

---

## 12 · `docs/engine/http-contract.md` — frase-marco

**ANTES:**

```md
Fuente de verdad de rutas REST: manifiestos **RouteEntry** →
```

**DESPUÉS:**

```md
La ruta se escribe una vez; lo demás son proyecciones, no copias.
Fuente de verdad de rutas REST: manifiestos **RouteEntry** →
```

---

## 13 · `docs/engine/rooms-presets.md` — frase-marco

**ANTES** (H1 seguido directo de la primera sección):

```md
# Rooms y presets

## `@zeus/rooms`
```

**DESPUÉS:**

```md
# Rooms y presets

Las rooms son las mesas; los presets, la forma de ponerlas sin inventar
puertos a mano.

## `@zeus/rooms`
```

---

## 14 · `docs/editor/index.md` — marco ampliado

**ANTES:**

```md
# Editor — mundo A

Crear juegos y releases. Hoy: `packages/editor/editor-ui` (CRUD de presets →
camino hacia editor de gamemap/release).
```

**DESPUÉS:**

```md
# Editor — mundo A

Mundo A es donde se crea: aquí el dramaturgo prepara la obra antes de que
nadie se siente a jugarla. Presets, gamemaps, releases — la cocina del
sistema, no su escenario.

Hoy: `packages/editor/editor-ui` (CRUD de presets → camino hacia editor de
gamemap/release).
```

Bloque de comandos y enlace Redoc: **intactos**.

---

## 15 · `docs/mesh/index.md` — marco

**ANTES:**

```md
# Mesh — mundo B

Operar y jugar: transporte, UIs de malla, browsers de volúmenes, monitores.
```

**DESPUÉS:**

```md
# Mesh — mundo B

Mundo B es donde se opera y se juega: la sesión en vivo. Transporte, UIs de
malla, browsers de volúmenes, monitores — lo que sostiene la mesa mientras
las obras suenan.
```

Tabla de piezas: **intacta**.

---

## 16 · `docs/games/index.md` — marco

**ANTES:**

```md
# Games

Juegos de referencia que consumen el mismo engine
([regla](/guide/two-games)):
```

**DESPUÉS:**

```md
# Games

Juegos de referencia que consumen el mismo engine
([regla](/guide/two-games)). Aquí se ven como consumidores del contrato —
backstage. Su cara pública, como obras del catálogo, vive en la library
([games.z-sdk.escrivivir.co](https://games.z-sdk.escrivivir.co)):
```

Tabla y párrafo de cierre: **intactos**.

---

## 17 · `docs/playbook/index.md` — línea de marco

**ANTES:**

```md
# Método playbook (CASOS)

Un juego con release lleva `CASOS.md` + acta de validación. El método:
```

**DESPUÉS:**

```md
# Método playbook (CASOS)

Ningún release sin acta: así demuestra una obra, caso a caso, que hace lo
que dice.

Un juego con release lleva `CASOS.md` + acta de validación. El método:
```

---

**Fuera de alcance de W1 (cero diff):** `guide/estado.md`, `contracts/*`,
`games/delta.md`, `games/pozo.md` (backstage técnico), `mesh/coturn-runbook.md`,
`api/`, `dist/`, `.vitepress/config.mjs`.
