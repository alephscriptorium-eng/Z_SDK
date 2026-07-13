/**
 * Ventanitas HTML (WP-24) — panel.mjs es DOM puro con doc/storage
 * inyectables, así que aquí se ejercita con stubs: persistencia de
 * {collapsed, x, y} en un localStorage falso, claves por vista, clamping
 * de posiciones y el ciclo colapsar/expandir sobre un DOM mínimo.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPanel,
  panelStorageKey,
  loadPanelState,
  savePanelState,
  clampToBounds
} from '../assets/js/kit/panel.mjs';

// ---- stubs ------------------------------------------------------------------

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    dump: () => Object.fromEntries(map)
  };
}

function fakeElement(tag) {
  const listeners = {};
  const el = {
    tagName: tag,
    id: '',
    className: '',
    textContent: '',
    type: '',
    hidden: false,
    style: {},
    children: [],
    parentNode: null,
    appendChild(child) {
      child.parentNode = el;
      el.children.push(child);
      return child;
    },
    remove() {
      if (el.parentNode) {
        el.parentNode.children = el.parentNode.children.filter((c) => c !== el);
        el.parentNode = null;
      }
    },
    setAttribute() {},
    addEventListener(name, fn) {
      (listeners[name] ??= []).push(fn);
    },
    dispatch(name, ev = {}) {
      for (const fn of listeners[name] ?? []) fn(ev);
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 40 })
  };
  return el;
}

function fakeDoc() {
  const body = fakeElement('body');
  return {
    body,
    createElement: (tag) => fakeElement(tag),
    getElementById: () => null
  };
}

// ---- funciones puras ----------------------------------------------------------

test('panelStorageKey: caudal:<view>:<id>', () => {
  assert.equal(panelStorageKey('tablero', 'ledger'), 'caudal:tablero:ledger');
  assert.equal(panelStorageKey(undefined, 'hud'), 'caudal:view:hud');
});

test('load/savePanelState: persiste y mezcla sobre un storage stub', () => {
  const storage = fakeStorage();
  const key = panelStorageKey('jugador', 'hud');

  assert.deepEqual(loadPanelState(storage, key), {});
  savePanelState(storage, key, { collapsed: true });
  assert.deepEqual(loadPanelState(storage, key), { collapsed: true });
  savePanelState(storage, key, { x: 40, y: 12 });
  assert.deepEqual(loadPanelState(storage, key), { collapsed: true, x: 40, y: 12 });
});

test('loadPanelState nunca lanza: JSON corrupto o storage roto ⇒ {}', () => {
  const storage = fakeStorage({ mala: '{no-json' });
  assert.deepEqual(loadPanelState(storage, 'mala'), {});
  assert.deepEqual(loadPanelState(null, 'x'), {});
  assert.deepEqual(
    loadPanelState({ getItem() { throw new Error('boom'); } }, 'x'),
    {}
  );
});

test('clampToBounds: el panel nunca se escapa del contenedor', () => {
  assert.deepEqual(clampToBounds(-50, -10, 100, 40, 800, 600), { x: 0, y: 0 });
  assert.deepEqual(clampToBounds(790, 590, 100, 40, 800, 600), { x: 700, y: 560 });
  assert.deepEqual(clampToBounds(10, 20, 100, 40, 800, 600), { x: 10, y: 20 });
});

// ---- createPanel sobre DOM stub -------------------------------------------------

test('createPanel: monta barra + cuerpo y persiste el colapso al togglear', () => {
  const doc = fakeDoc();
  const storage = fakeStorage();
  const mount = fakeElement('div');

  const panel = createPanel({
    id: 'ledger',
    title: '📜 ledger',
    collapsible: true,
    draggable: true,
    view: 'tablero',
    mount,
    doc,
    storage
  });

  assert.equal(panel.el.id, 'ledger');
  assert.ok(panel.el.className.includes('arg-panel'));
  assert.ok(panel.el.className.includes('draggable'));
  assert.ok(mount.children.includes(panel.el));
  assert.equal(panel.isCollapsed(), false);

  // el botón ▸/▾ es el segundo hijo de la barra
  const toggle = panel.bar.children.find((c) => c.className === 'arg-panel-toggle');
  assert.ok(toggle, 'falta el botón de colapso');
  assert.equal(toggle.textContent, '▾');

  toggle.dispatch('click', { stopPropagation() {} });
  assert.equal(panel.isCollapsed(), true);
  assert.ok(panel.el.className.includes('collapsed'));
  assert.equal(toggle.textContent, '▸');
  assert.deepEqual(loadPanelState(storage, panelStorageKey('tablero', 'ledger')), {
    collapsed: true
  });

  toggle.dispatch('click', { stopPropagation() {} });
  assert.equal(panel.isCollapsed(), false);
  assert.deepEqual(loadPanelState(storage, panelStorageKey('tablero', 'ledger')), {
    collapsed: false
  });
});

test('createPanel: el estado colapsado sobrevive a un "reload" (mismo storage)', () => {
  const storage = fakeStorage();
  const first = createPanel({
    id: 'hud',
    title: 'leyenda',
    view: 'jugador',
    mount: fakeElement('div'),
    doc: fakeDoc(),
    storage
  });
  first.setCollapsed(true);

  // reload: nuevo DOM, mismo storage
  const second = createPanel({
    id: 'hud',
    title: 'leyenda',
    view: 'jugador',
    mount: fakeElement('div'),
    doc: fakeDoc(),
    storage
  });
  assert.equal(second.isCollapsed(), true, 'el colapso debe sobrevivir al reload');
});

test('createPanel: una posición guardada se re-aplica al montar', () => {
  const storage = fakeStorage();
  savePanelState(storage, panelStorageKey('tablero', 'ledger'), { x: 33, y: 44 });

  const panel = createPanel({
    id: 'ledger',
    title: 'ledger',
    draggable: true,
    view: 'tablero',
    mount: fakeElement('div'),
    doc: fakeDoc(),
    storage
  });
  assert.equal(panel.el.style.left, '33px');
  assert.equal(panel.el.style.top, '44px');
  assert.equal(panel.el.style.right, 'auto');
});

test('createPanel: adopt mueve un nodo existente al cuerpo', () => {
  const doc = fakeDoc();
  const panel = createPanel({
    id: 'hud',
    title: 'leyenda',
    view: 'tablero',
    mount: fakeElement('div'),
    doc,
    storage: fakeStorage()
  });
  const hud = fakeElement('aside');
  panel.adopt(hud);
  assert.ok(panel.body.children.includes(hud));
});

test('createPanel: defaultCollapsed manda cuando no hay estado guardado', () => {
  const panel = createPanel({
    id: 'tracking',
    title: 'tracking',
    defaultCollapsed: true,
    view: 'jugador',
    mount: fakeElement('div'),
    doc: fakeDoc(),
    storage: fakeStorage()
  });
  assert.equal(panel.isCollapsed(), true);
});
