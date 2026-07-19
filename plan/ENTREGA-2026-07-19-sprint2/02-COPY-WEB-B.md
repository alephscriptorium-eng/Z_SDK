# Copy final — Web B · `Z_SDK-games-library` (WP-W2)

> Aplicar **verbatim** (reglas en `00-PAQUETE.md`). Incluye una **página
> nueva** (`docs/games/solve-coagula.md`) y ajustes de
> `docs/.vitepress/config.mjs`. Los slugs (`delta`, `pozo`, `solve-coagula`),
> scripts y nombres de paquete **no cambian**: los títulos de obra
> (**El Común · El Aljibe · SOLVE ET COAGULA**) son capa editorial pública.

---

## 1 · `docs/index.md` — fichero completo

Reemplazar **todo el fichero** por (el envoltorio de 4 backticks es solo de
este paquete; el fichero destino empieza en `---`):

````md
---
layout: home
hero:
  name: Zeus Games
  text: Juegos libres para jugar con tu gente
  tagline: |-
    Las obras del sistema transmedia Scriptorium: piezas de sus dramaturgos,
    hechas con vibecoding. El kit que las sostiene no manda el relato.
    Jugalas — y si te quedan chicas, llevátelas: montalas con tu comunidad.
  actions:
    - theme: brand
      text: Releases
      link: /releases
    - theme: alt
      text: Start packs
      link: /startpacks
    - theme: alt
      text: Repo
      link: https://github.com/alephscriptorium-eng/Z_SDK-games-library
features:
  - title: El Común
    details: 'El archivo es el terreno y jugarlo lo hace crecer: gobernás la riada entre todos o se inunda. El feed deja de consumirte; tu gente lo cultiva.'
    link: /games/delta
  - title: El Aljibe
    details: 'El juego pequeño y hondo: un pozo, gotas contadas. Cada una se nombra o se derrama. La atención como bien escaso.'
    link: /games/pozo
  - title: SOLVE ET COAGULA
    details: 'La obra alquímica: disolver el relato dado, coagular el propio. Un corpus real se atraviesa acto por acto.'
    link: /games/solve-coagula
  - title: Lo que viene
    details: 'El catálogo está abierto: hay juegos migrando hacia aquí. Sin inventar releases — la verdad vive en Releases.'
    link: /games/futuros
---

## Cómo usar este catálogo

1. Elegí una **obra** → su ficha te cuenta quién es, qué te deja y cómo
   llevarla a tu comunidad.
2. ¿Vas a montarla? **[Releases](/releases)** dice qué hay publicado (verdad
   viva en GitHub Releases: `@zeus/startpack-<game>`, acta, tarball);
   **[Start packs](/startpacks)** trae los datos para arrancar.
3. ¿Vas a operar o a crear la tuya? El aparato vive en el monorepo hermano
   [`Z_SDK`](https://github.com/alephscriptorium-eng/Z_SDK)
   (portal docs: `z-sdk.escrivivir.co`).

Clone limpio:

```bash
git clone https://github.com/alephscriptorium-eng/Z_SDK-games-library.git
cd Z_SDK-games-library
npm install
npm test
```

`npm install` resuelve `@zeus/*` desde el registry propio. Para demos/e2e
que spawnean mesh no publicado, enlazá el monorepo hermano
(`npm run setup:zeus-sdk` / `ZEUS_SDK_ROOT` / sibling `../zeus-sdk`) — ver
[El Común · mesh local](/games/delta#mesh-local-fallback-dev).
````

Nota: `actions` y bloque de clone quedan funcionalmente como estaban; el
anchor `#mesh-local-fallback-dev` no cambia porque la sección técnica de
`delta.md` no se toca.

---

## 2 · `docs/games/delta.md` — ficha nueva, cuerpo técnico intacto

Reemplazar **desde el inicio del fichero hasta la línea anterior a**
`| Pieza | Ruta en el repo |` por:

```md
# El Común (delta)

> *El archivo que crece jugando.* Obra del sistema transmedia Scriptorium ·
> slug técnico: `delta`.

**Carácter.** El juego donde el archivo es el terreno y jugarlo lo hace
crecer: una riada de información que se gobierna entre todos — o se inunda.

**La pieza.** Una obra de la crew de Scriptorium, montada sobre volúmenes
vivos. Dos fuerzas: el agua — la Riada, ríos de microposts sin etiquetar que
cristalizás al vuelo — y la piedra — la Cantera, un laberinto de galerías que
crece al excavarlo. Lo que cristaliza queda en El Notario; lo caótico se
pierde.

**¿En qué es Team Human?** Invierte quién sirve a quién: en vez de que el
feed te consuma, tu comunidad cultiva el feed. El archivo se vuelve común.

**Municiones.** *Aporta:* práctica de leer y curar información en grupo, bajo
presión. *Salen:* un corpus propio que queda en manos de quien lo jugó — El
Notario no lo posee nadie de fuera.

**Llevalo a tu comunidad.** Una room, tu gente, y un start pack con datos
para arrancar. El caudal no se gobierna en soledad: convocá.

**Puerta técnica.** Specs `CONTRATO.md` · `CASOS.md` · `LORE.md` en
`packages/delta/spec/`. Para operar en serio: el portal del aparato
([z-sdk.escrivivir.co](https://z-sdk.escrivivir.co)). Piezas y arranque, aquí
abajo.

```

**Todo lo demás intacto**, empezando por la tabla `| Pieza | Ruta en el repo |`
y siguiendo con `## Cómo jugarlo / levantarlo`, la sección
`### Mesh local (fallback DEV)` y el bloque de start pack.

---

## 3 · `docs/games/pozo.md` — ficha nueva, cuerpo técnico intacto

Reemplazar **desde el inicio del fichero hasta la línea anterior a**
`| Pieza | Ruta en el repo |` por:

```md
# El Aljibe (pozo)

> *La disciplina de la gota.* Obra del sistema transmedia Scriptorium ·
> slug técnico: `pozo`.

**Carácter.** El juego pequeño y hondo: un pozo, gotas contadas. Cada una se
nombra (se cosecha) o se derrama. Nada más; todo ahí.

**La pieza.** La obra más desnuda del catálogo, de la crew de Scriptorium: un
solo actor, un feed que gotea y dos gestos — sacar una gota y etiquetarla, o
vaciar de golpe. Vaciar cuesta: se pierde el agua que se podría haber
cosechado.

**¿En qué es Team Human?** La atención como bien escaso: contra el scroll
infinito, un pozo con fondo. Cosechar es un acto de cuidado; derramar, una
pérdida real.

**Municiones.** *Aporta:* el hábito de nombrar en vez de acumular. *Salen:*
la conciencia de que lo no atendido se derrama — no es gratis.

**Llevalo a tu comunidad.** Es un rito breve: proponelo una tarde cualquiera.
Uno juega; el resto mira el nivel del agua.

**Puerta técnica.** Spec `CASOS.md` en `packages/pozo/spec/`. Para operar:
el portal del aparato ([z-sdk.escrivivir.co](https://z-sdk.escrivivir.co)).
Piezas y arranque, aquí abajo.

```

**Todo lo demás intacto** desde la tabla `| Pieza | Ruta en el repo |`.

---

## 4 · `docs/games/solve-coagula.md` — PÁGINA NUEVA (crear)

Contenido completo del fichero nuevo (envoltorio de 4 backticks solo de este
paquete):

````md
# SOLVE ET COAGULA (solve-coagula)

> *Disolver el relato dado, coagular el propio.* Obra del sistema transmedia
> Scriptorium · slug técnico: `solve-coagula`.

**Carácter.** La obra alquímica del catálogo: un corpus real se disuelve en
actos y se coagula en relato. No se scrollea — se atraviesa, acto por acto.

**La pieza.** Una obra de la crew de Scriptorium, la del dramaturgo por
excelencia: un vestíbulo, actos que se abren (act-0 «Constructor» en
adelante) y un story-board sobre un corpus vivo — el historial completo de un
artículo real.

**¿En qué es Team Human?** Contra el consumo pasivo de contenido, recomponer
sentido: quien lee no es audiencia — es quien coagula.

**Municiones.** *Aporta:* un método para deshacer un relato dado y rehacerlo
— alfabetización crítica jugada, no predicada. *Salen:* una obra legible y
compartible, hecha de una fuente que era ruido.

**Llevalo a tu comunidad.** Montá tu corpus y abrí tus actos: la plantilla
[CARPETA DRAMATURGO](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/kits/carpeta-dramaturgo)
instancia una obra nueva desde cero.

**Puerta técnica.** Spec en `packages/solve-coagula/spec/`. Para operar: el
portal del aparato ([z-sdk.escrivivir.co](https://z-sdk.escrivivir.co)).

## Cómo jugarlo / levantarlo

Desde la raíz de `Z_SDK-games-library`:

```bash
npm install
npm run demo:solve-coagula
```

Publicación (start pack / release): verdad viva en [Releases](/releases).
````

---

## 5 · `docs/games/futuros.md` — marco + reconciliación de filas

**5a — línea de marco.** ANTES:

```md
# Futuros

> **Página de estado** (no doctrina).
```

DESPUÉS:

```md
# Futuros

El catálogo está abierto: hay juegos en curso y juegos migrando hacia aquí.
Esta página es su estado, no su promesa.

> **Página de estado** (no doctrina).
```

**5b — fila SOLVE ET COAGULA.** Ahora tiene ficha propia y demo en el árbol.
ANTES (fila de la tabla):

```md
| SOLVE ET COAGULA | en curso | Tercer juego; kit [CARPETA DRAMATURGO](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/kits/carpeta-dramaturgo) |
```

DESPUÉS:

```md
| SOLVE ET COAGULA | jugable en repo | Ficha: [SOLVE ET COAGULA](/games/solve-coagula) · kit [CARPETA DRAMATURGO](https://github.com/alephscriptorium-eng/Z_SDK-games-library/tree/main/kits/carpeta-dramaturgo) |
```

*(La celda «Estado» es territorio del swarm: si la verdad viva dice otra
cosa, ajustad la celda de estado — el resto de la fila se aplica tal cual.)*

**5c — filas nuevas** (añadir al final de la misma tabla, tal cual):

```md
| Fundación | pendiente de migrar | Juego = línea de N capítulos; necesita backend de volumen markdown (aún inexistente) |
| Periódico | pendiente de migrar | Juego = línea de noticias sobre firehose/ATproto (backend ya existente) |
```

El resto de la página (fila sketch, fila publish registry, sección CARPETA
DRAMATURGO) queda **intacto**.

---

## 6 · `docs/startpacks.md` — línea de marco

**ANTES:**

```md
# Start packs — consumo y release

Cada release de datos es un paquete
```

**DESPUÉS:**

```md
# Start packs — consumo y release

Los datos para arrancar una obra vienen empaquetados: instalás, apuntás y
jugás sobre volúmenes de verdad.

Cada release de datos es un paquete
```

---

## 7 · `docs/.vitepress/config.mjs` — tres reemplazos

**7a — description.** ANTES:

```js
  description:
    'Catálogo FOSS de juegos Zeus (delta, pozo) — start packs, specs y cómo jugar',
```

DESPUÉS:

```js
  description:
    'Las obras del sistema transmedia Scriptorium — El Común, El Aljibe, SOLVE ET COAGULA — juegos libres para jugar con tu gente',
```

**7b — nav · items de «Juegos».** ANTES:

```js
        items: [
          { text: 'delta', link: '/games/delta' },
          { text: 'pozo', link: '/games/pozo' },
          { text: 'Futuros', link: '/games/futuros' }
        ]
```

DESPUÉS:

```js
        items: [
          { text: 'El Común (delta)', link: '/games/delta' },
          { text: 'El Aljibe (pozo)', link: '/games/pozo' },
          { text: 'SOLVE ET COAGULA', link: '/games/solve-coagula' },
          { text: 'Futuros', link: '/games/futuros' }
        ]
```

**7c — sidebar · items de «Juegos».** ANTES:

```js
        items: [
          { text: 'delta (ARG)', link: '/games/delta' },
          { text: 'pozo', link: '/games/pozo' },
          { text: 'Futuros', link: '/games/futuros' }
        ]
```

DESPUÉS:

```js
        items: [
          { text: 'El Común (delta)', link: '/games/delta' },
          { text: 'El Aljibe (pozo)', link: '/games/pozo' },
          { text: 'SOLVE ET COAGULA', link: '/games/solve-coagula' },
          { text: 'Futuros', link: '/games/futuros' }
        ]
```

`title`, `footer`, `socialLinks`, `base` y todo lo demás del config:
**intactos**.

---

**Fuera de alcance de W2 (cero diff):** `docs/releases.md` (solo confirmar
que su disclaimer de verdad viva sigue intacto), `packages/*`, scripts de
`package.json`, workflows.
