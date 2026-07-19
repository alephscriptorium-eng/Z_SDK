# ENTREGA — Capa editorial sobre los dos portales · rev1

> Formato BASE-3 §E: reemplazos **verbatim**, ancla ANTES literal, el worker
> jamás redacta; conflicto texto↔repo = reporte. C7 incorporadas: «lema
> fuera» · heros FOSS de una línea (delta marketing 2026-07-19) · categoría
> «Juegos de Ventana de Contexto» como conector A↔B · contadores
> paramétricos · página nueva solo la ficha de SOLVE (corrección factual:
> released con `@zeus/startpack-solve-coagula@0.1.0`).
> Lote: **W-A** (zeus/docs) ∥ **W-B** (library/docs).

---

## W-A · `zeus-sdk/docs/index.md` — hero (frontmatter)

**ANTES** (bloque literal):

```yaml
hero:
  name: Zeus SDK
  text: Crear juegos, no dialectos
  tagline: |-
    Kit para inventar juegos con un solo contrato (AsyncAPI + authority + MCP por actor).
    El engine no habla el dialecto de un título: habla el protocolo común.
    delta y pozo son la prueba — dos juegos, un kit.
    Abrí una puerta y seguí el mapa.
```

**DESPUÉS:**

```yaml
hero:
  name: Z_SDK
  text: Juegos de Ventana de Contexto
  tagline: |-
    FOSS Docs: framework ARG para comunidades.
```

`actions` y `features` de A: **intocados**.

---

## W-B · `Z_SDK-games-library/docs/index.md` — hero + features

**ANTES** (bloque literal):

```yaml
hero:
  name: Zeus Games
  text: Catálogo de la library
  tagline: |-
    Juegos FOSS que consumen el Zeus SDK — mismo contrato, cero dialectos en el engine.
    delta y pozo son el mínimo de la regla de los dos juegos.
    Start packs + actas Notario + specs viven aquí.
```

**DESPUÉS:**

```yaml
hero:
  name: Juegos Z_SDK
  text: Catálogo
  tagline: |-
    Librería de juegos de Ventana de Contexto para ARG
```

`actions`: **intocadas**.

**ANTES** (features, bloque literal):

```yaml
features:
  - title: delta
    details: ARG multijugador (Riada / Cantera). Demo npm run demo:arg · startpack publicado.
    link: /games/delta
  - title: pozo
    details: Segundo juego mínimo. Demo npm run demo:pozo · startpack publicado.
    link: /games/pozo
  - title: Futuros
    details: SOLVE ET COAGULA y otros títulos del mundo A — sin inventar releases.
    link: /games/futuros
```

**DESPUÉS:**

```yaml
features:
  - title: El Común · delta
    details: 'Mini-juego de construcción de ventana de contexto colaborativa. Cachear, curar, marcar hitos, etiquetar... Demo npm run demo:arg · start pack publicado.'
    link: /games/delta
  - title: El Aljibe · pozo
    details: 'Mini-juego de análisis y curación de datos. Demo npm run demo:pozo · start pack publicado.'
    link: /games/pozo
  - title: SOLVE ET COAGULA
    details: 'Tablero ARG de correlación de fuerzas y diseño de líneas de demarcación. Demo npm run demo:solve-coagula · start pack publicado.'
    link: /games/solve-coagula
  - title: call4makers
    details: 'Catálogo abierto: start packs, specs y cauces de contribución esperan makers — dramaturgia, código, datos, traducción. Entrá y arrancá el tuyo.'
    link: /games/futuros
```

---

## W-B · `docs/games/solve-coagula.md` — **página nueva** (ficha)

```md
# SOLVE ET COAGULA (solve-coagula)

**Tablero ARG de correlación de fuerzas y diseño de líneas de demarcación:**
un corpus real se atraviesa acto por acto — disolver el relato dado,
coagular el propio. Story-board de ocho actos; se juega en sesión con roles
y deja acta.

| Pieza | Ruta en el repo |
| ----- | --------------- |
| Dominio + autoridad | `packages/solve-coagula/src/` |
| Story-board (8 actos) | `packages/solve-coagula/dramaturgia/readerapp/story-board.json` |
| Start pack | `packages/startpack-solve-coagula/` |

Arranque:

```bash
npm run demo:solve-coagula
```

Llévatela — la ronda arranca desde el start pack publicado:

```bash
npm install @zeus/startpack-solve-coagula
```

La verdad de versiones y actas vive en
[Releases](https://github.com/alephscriptorium-eng/Z_SDK-games-library/releases).

*Una obra de Scriptorium. Bajo animus iocandi.*
```

---

## W-B · `docs/games/futuros.md` — mutación a «Lo que viene · call4makers»

1. **Retirar la entrada de SOLve ET COAGULA** (ya tiene ficha y release;
   listarlo como futuro contradice Releases). Ancla: la línea/entrada que lo
   nombra como pendiente.
2. **Añadir al final** la sección de cauces (destino de la card call4makers):

```md
## call4makers

El catálogo está abierto. Cauces de contribución:

- **Dramaturgia** — obras y líneas nuevas: el método vive en el kit de
  carpeta del dramaturgo y los casos se escriben en markdown llano.
- **Código** — issues y PRs en el
  [repo](https://github.com/alephscriptorium-eng/Z_SDK-games-library);
  el aparato, en el monorepo hermano
  [`Z_SDK`](https://github.com/alephscriptorium-eng/Z_SDK).
- **Datos y traducción** — corpus, etiquetado y versiones de los start
  packs existentes.

Sin inventar releases: lo publicado, y solo eso, vive en Releases.
```

Resto de la página: **intocado**.

---

## W-B · `docs/games/delta.md` y `docs/games/pozo.md` — capa de ficha (2 inserciones cada una)

1. Tras el H1, línea de obra (mecánica + pregunta, registro de card):
   - delta: `**El Común** — construcción de ventana de contexto colaborativa: el archivo compartido crece al jugarlo y la sala gobierna su memoria común.`
   - pozo: `**El Aljibe** — análisis y curación de datos: gotas contadas, cada una se nombra o se derrama.`
2. Al final del fichero:

```md
Llévatela:

```bash
npm install @zeus/startpack-<game>
```

*Una obra de Scriptorium. Bajo animus iocandi.*
```

*(`<game>`: delta / pozo — paquetes publicados)*

Cuerpo técnico de ambas fichas: **intocado**.

---

## Verificación (CA del paquete)

1. `docs:build` verde en ambos portales.
2. Greps sobre ficheros tocados: C1 = 0 · C2 (negación en heros) = 0 ·
   contadores fijos = 0 · C6 ceguera = 0.
3. **Heros FOSS:** tagline de UNA línea en ambos; la categoría «Ventana de
   Contexto» presente en ambos heros (ese es el cruce A↔B).
4. Slugs, `actions`, scripts, nombres de paquete: sin cambios
   (`git diff --stat` = exactamente los 6 ficheros de este paquete).
5. Comandos citados corren (`demo:solve-coagula`, installs de startpacks —
   publicados y verificados 2026-07-18).
```
