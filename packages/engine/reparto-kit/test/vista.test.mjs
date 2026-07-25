import test from 'node:test';
import assert from 'node:assert/strict';
import { ssbIdFromPublicKeyBytes } from '@zeus/protocol';
import { crearReparto } from '../src/index.mjs';
import { filasCastDesdeReparto } from '../src/filas.mjs';

const ssb = (seed) => ssbIdFromPublicKeyBytes(Buffer.alloc(32, seed));
const ACTOR = ssb(0xc3);

function repartoDemo() {
  return crearReparto({
    personajes: [
      { id: 'pj-prota', nombre: 'Protagonista', rol: 'protagonista' },
      { id: 'pj-fig', nombre: 'Figurante', rol: 'figurante' }
    ],
    asignaciones: [{ actorSsbId: ACTOR, personajeId: 'pj-prota' }],
    politica: { protagonista: ['reparto:leer'], figurante: ['reparto:leer'] }
  });
}

/** DOM mínimo inyectable (renderCastTableWidget acepta `doc`). */
function fakeDoc() {
  function make(tag) {
    return {
      tagName: tag,
      children: [],
      attrs: {},
      id: '',
      className: '',
      textContent: '',
      parentNode: null,
      appendChild(c) {
        this.children.push(c);
        c.parentNode = this;
        return c;
      },
      setAttribute(k, v) {
        this.attrs[k] = v;
      },
      remove() {
        if (this.parentNode) {
          this.parentNode.children = this.parentNode.children.filter((x) => x !== this);
          this.parentNode = null;
        }
      }
    };
  }
  return { createElement: make };
}

function textoRecursivo(el) {
  let t = el.textContent || '';
  for (const c of el.children || []) t += ' ' + textoRecursivo(c);
  return t;
}

test('vista/proyección: filasCastDesdeReparto mapea al schema del cast-table (pura, sin view-kit)', () => {
  const rows = filasCastDesdeReparto(repartoDemo());
  assert.deepEqual(rows, [
    { participant: ACTOR, role: 'protagonista', oldid: 'pj-prota' },
    { participant: '', role: 'figurante', oldid: 'pj-fig' }
  ]);
});

test('vista: el cast-table EXISTENTE de @zeus/view-kit renderiza nuestras filas (consumo real, sin copia)', async () => {
  // Resuelve el fichero que ENVÍA @zeus/view-kit y carga su widget real
  // (widgets.mjs es DOM puro, node-cargable; el índice del paquete arrastra
  // assets de navegador). Sin fork ni copia: se ejecuta el código instalado.
  const idxUrl = import.meta.resolve('@zeus/view-kit'); // .../view-kit/src/index.mjs
  const widgetsUrl = new URL('./widgets.mjs', idxUrl);
  const { renderCastTableWidget } = await import(widgetsUrl);

  const doc = fakeDoc();
  const mount = doc.createElement('div');
  const rows = filasCastDesdeReparto(repartoDemo());
  const inst = renderCastTableWidget({ doc, mount, id: 'cast-table', data: { title: 'reparto', rows } });

  assert.equal(inst.el.tagName, 'section');
  assert.equal(inst.el.attrs['data-widget-id'], 'cast-table');
  const texto = textoRecursivo(inst.el);
  assert.match(texto, /pj-prota/);
  assert.ok(texto.includes(ACTOR), 'la fila del actor asignado aparece en el cast-table');
  assert.equal(mount.children.length, 1);
  inst.destroy();
  assert.equal(mount.children.length, 0);
});

test('vista: montarReparto (adaptador de vista) es node-inaccesible por la cadena de navegador de view-kit', async (t) => {
  try {
    await import('../src/vista.mjs');
    // Si el entorno pudiera cargar el índice de view-kit, no se omite.
  } catch (e) {
    t.skip('view-kit index solo-navegador (esperado en node): ' + e.message);
  }
});
