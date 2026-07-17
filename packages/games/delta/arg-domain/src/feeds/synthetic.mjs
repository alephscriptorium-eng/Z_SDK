/**
 * Feeds sintéticos deterministas (contrato §4): misma seed ⇒ mismas gotas y
 * mismo laberinto. Misma interfaz que los feeds reales (WP-14), para que la
 * demo corra en cualquier máquina sin volúmenes montados.
 */

/** PRNG determinista (mulberry32). */
export function createRng(seed = 1) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TEMAS = ['asamblea', 'archivo', 'rumor', 'acta', 'brindis', 'protesta', 'inventario'];

/**
 * Firehose sintético: secuencia infinita de refs de micropost.
 * @returns {{ kind:string, nextDroplets(count:number):object[], commitLabel(ref,label):Promise }}
 */
export function createSyntheticFirehoseFeed({ seed = 1 } = {}) {
  const rng = createRng(seed);
  let index = 0;
  return {
    kind: 'synthetic',
    nextDroplets(count = 1) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const tema = TEMAS[Math.floor(rng() * TEMAS.length)];
        out.push({
          kind: 'micropost',
          corpus: 'raw',
          index,
          uri: `firehose://synthetic/${seed}/${index}#${tema}`
        });
        index += 1;
      }
      return out;
    },
    // En sintético etiquetar no muta ningún volumen: cristaliza solo en juego.
    commitLabel(_ref, _label) {
      return Promise.resolve({ ok: true, committed: false, mode: 'synthetic' });
    }
  };
}

/**
 * Cantera sintética: refs tipo linea (años) y un "start pack" fijo — la fila
 * de entrada abierta y el resto en fantasma, listo para excavar.
 */
export function createSyntheticMazeSource({ seed = 1, baseYear = 1874 } = {}) {
  return {
    kind: 'synthetic',
    /**
     * @param {{chambers:Record<string,object>, corridors:Record<string,object>}} topology
     */
    loadMaze(topology) {
      const chamberRefs = {};
      const chamberStates = {};
      for (const chamber of Object.values(topology.chambers)) {
        const year = baseYear + chamber.col * 12 + chamber.row * 4;
        chamberRefs[chamber.id] = { kind: 'nodo', uri: `linea://nodo/${year}`, index: year };
        chamberStates[chamber.id] = 'ghost';
      }
      const corridorStates = {};
      for (const corridor of Object.values(topology.corridors)) {
        corridorStates[corridor.id] = 'ghost';
      }
      // Start pack: la fila de entrada (row máximo) está excavada.
      const rows = Math.max(...Object.values(topology.chambers).map((c) => c.row));
      for (const corridor of Object.values(topology.corridors)) {
        const a = topology.chambers[corridor.a];
        const b = topology.chambers[corridor.b];
        if (a.row === rows && b.row === rows) corridorStates[corridor.id] = 'open';
      }
      for (const chamber of Object.values(topology.chambers)) {
        if (chamber.row === rows) chamberStates[chamber.id] = 'cached';
      }
      return { seed, chamberRefs, chamberStates, corridorStates };
    },
    excavateCorridor(_corridor, _approval) {
      return Promise.resolve({ ok: true, committed: false, mode: 'synthetic' });
    }
  };
}

/**
 * Resolución de feeds (contrato §4). `real` llega con WP-14; `auto` degrada
 * a sintético con aviso para que la demo nunca se quede sin mundo.
 */
export function resolveFeeds({ mode = 'auto', seed = 1, logger = console } = {}) {
  if (mode === 'real') {
    throw new Error(
      'feeds real: usar resolveRuntimeFeeds de arg-feeds en la autoridad (WP-14). Usa mode "auto" o "synthetic" en arg-domain.'
    );
  }
  if (mode === 'auto') {
    logger.warn?.('[arg-domain] feeds auto → sintético (feeds reales llegan con WP-14)');
  }
  return {
    mode: 'synthetic',
    firehose: createSyntheticFirehoseFeed({ seed }),
    mazeSource: createSyntheticMazeSource({ seed })
  };
}
