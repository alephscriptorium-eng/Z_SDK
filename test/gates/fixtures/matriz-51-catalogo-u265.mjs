/**
 * WP-U265 — VECTOR GUARDADO: la columna «catálogo» de la matriz tal y como
 * estaba el día que se abrió la ficha, con el gate diciendo
 * `OK — 51/51 · 0 fallos` encima.
 *
 * Qué es. Las 16 celdas «catálogo» de `plan/MATRIZ-RUNTIME-51.md` en el commit
 * `0a441d1`, las de las 16 piezas que ESE MISMO DÍA tenían entrada en el
 * catálogo. Nueve afirmaban «no · grep → 0» o «sin entrada» —caducadas desde
 * U234 (4: `launcher`, `socket-server`, `cache-browser`, `firehose-browser`,
 * commit `c109948`), U180 (1) y U181 (4), sin que nada avisara— y las siete restantes
 * afirmaban la entrada pero sin anotar `kind` ni `health`, que es el dato del
 * que cuelga el `tipo` que la matriz publica.
 *
 * Por qué vendorizado y no `git show 0a441d1:...`. Precedente medido en U260:
 * `actions/checkout@v4` clona con `fetch-depth: 1` y pedir un objeto que no
 * sea HEAD responde `fatal: invalid object name` en el runner. Un vector que
 * sólo existe en local no es un vector.
 *
 * Cómo se usa: `test/gates/matriz-51.test.mjs` monta un contraste sintético
 * con estas celdas y exige que el gate ENROJEZCA. El día que deje de
 * enrojecer, el gate ha vuelto a ser ciego a esta clase de caducidad — que es
 * exactamente lo que pasaba antes de U265.
 *
 * No importa nada capaz de escribir: este fichero vive fuera del barrido del
 * guardián estático (`test/gates/arbol-inmutable.test.mjs`), y esa exclusión
 * se comprueba allí, no se supone.
 */

/** Procedencia del vector — commit y fichero de los que se copió literal. */
export const ORIGEN = {
  commit: '0a441d1',
  ruta: 'plan/MATRIZ-RUNTIME-51.md',
  columna: 'catálogo',
  fecha: '2026-08-02',
  nota:
    'estado con el que se abrió la ficha U265: 9 celdas caducadas + 7 sin ' +
    'anotar kind/health, y el gate en verde sobre las dos cosas'
};

/**
 * Las 16 celdas literales, con la línea que ocupaban en `ORIGEN.ruta`.
 * @type {{ pieza: string, linea: number, celda: string }[]}
 */
export const CELDAS_RANCIAS = [
  { pieza: "@zeus/editor-ui", linea: 91, celda: "no · grep `editor-ui` en catalog.mjs → 0 (la entrada `linea-editor` catalog.mjs:125 es otra pieza)" },
  { pieza: "@zeus/3d-monitor", linea: 97, celda: "no · grep `3d-monitor` en catalog.mjs → 0" },
  { pieza: "@zeus/cache-browser", linea: 100, celda: "no · grep → 0" },
  { pieza: "@zeus/ciudad-lifecycle", linea: 101, celda: "sin entrada propia · grep `ciudad` en catalog.mjs y catalog-extend.mjs → 0; **extiende** el catálogo con 6 hojas `workspace: null` (`packages/mesh/ciudad-lifecycle/src/catalog-extend.mjs:6`, `:96`)" },
  { pieza: "@zeus/console-monitor", linea: 102, celda: "**sí**: entrada `console-monitor` (`packages/mesh/mcp-launcher/src/catalog.mjs:155-163`, workspace `:157`)" },
  { pieza: "@zeus/firehose-browser", linea: 103, celda: "no · grep `firehose-browser` en catalog.mjs → 0 (la entrada `firehose` catalog.mjs:146 es linea-firehose)" },
  { pieza: "@zeus/force-system", linea: 104, celda: "**sí**: entrada `forces` (`packages/mesh/mcp-launcher/src/catalog.mjs:112-121`, workspace `:115`)" },
  { pieza: "@zeus/linea-editor", linea: 105, celda: "**sí**: entrada `linea-editor` (`packages/mesh/mcp-launcher/src/catalog.mjs:122-132`, workspace `:125`)" },
  { pieza: "@zeus/linea-firehose", linea: 106, celda: "**sí**: entrada `firehose` (`packages/mesh/mcp-launcher/src/catalog.mjs:143-153`, workspace `:146`)" },
  { pieza: "@zeus/linea-system", linea: 107, celda: "**sí**: `linea-espana` + `linea-wp-historia` (`packages/mesh/mcp-launcher/src/catalog.mjs:60-81`, workspace `:63` y `:74`)" },
  { pieza: "@zeus/mcp-launcher", linea: 108, celda: "**custodio del catálogo**, sin entrada propia (`packages/mesh/mcp-launcher/src/catalog.mjs:2`; grep `mcp-launcher` en CATALOG_SEED → 0); su puerto en buildPortTable (`src/catalog.mjs:342`)" },
  { pieza: "@zeus/player-3d-ui", linea: 112, celda: "no · grep → 0" },
  { pieza: "@zeus/player-ui", linea: 113, celda: "no · grep → 0" },
  { pieza: "@zeus/socket-server", linea: 114, celda: "no · grep `socket-server` en catalog.mjs → 0" },
  { pieza: "@zeus/solar-system", linea: 115, celda: "**sí**: `solar-sun`/`solar-moon`/`solar-earth` (`packages/mesh/mcp-launcher/src/catalog.mjs:83-111`, workspace `:85`, `:95`, `:105`)" },
  { pieza: "@zeus/ssb-system", linea: 116, celda: "**sí**: entrada `ssb` (`packages/mesh/mcp-launcher/src/catalog.mjs:133-142`, workspace `:136`)" }
];

/**
 * Las 9 que negaban tener entrada teniéndola — el corazón del vector.
 * Derivadas de `CELDAS_RANCIAS`, no transcritas otra vez: una lista copiada a
 * mano sería el mismo defecto que este fichero documenta.
 */
export const CADUCAS = CELDAS_RANCIAS.filter((c) => !c.celda.includes('**sí**')).map((c) => c.pieza);

/** Las 7 que afirmaban la entrada pero sin `kind` ni `health`. */
export const SIN_ANOTAR = CELDAS_RANCIAS.filter((c) => c.celda.includes('**sí**')).map((c) => c.pieza);
