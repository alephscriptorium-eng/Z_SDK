/**
 * Registro de widgets story-board (WP-U113) — DOM stub como panel.test.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWidgetRegistry,
  createDefaultWidgetRegistry,
  CAST_TABLE_WIDGET_IDS,
  renderCastTableWidget,
  mountStoryWidgets
} from '../src/widgets.mjs';

function fakeElement(tag) {
  const el = {
    tagName: tag,
    id: '',
    className: '',
    textContent: '',
    href: '',
    rel: '',
    children: [],
    parentNode: null,
    attrs: {},
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
    setAttribute(k, v) {
      el.attrs[k] = String(v);
    },
    getAttribute(k) {
      return el.attrs[k] ?? null;
    }
  };
  return el;
}

function fakeDoc() {
  const body = fakeElement('body');
  return {
    body,
    createElement: (tag) => fakeElement(tag)
  };
}

test('createWidgetRegistry: tabla has/get/register/ids', () => {
  const reg = createWidgetRegistry();
  assert.equal(reg.has('panel-elenco'), false);
  assert.equal(reg.get('x'), null);

  const stub = () => ({ el: fakeElement('div'), id: 'x', destroy() {} });
  reg.register('x', stub);
  assert.equal(reg.has('x'), true);
  assert.equal(reg.get('x'), stub);
  assert.deepEqual(reg.ids(), ['x']);
});

test('renderCastTableWidget: tabla con filas + badge cache', () => {
  const doc = fakeDoc();
  const mount = fakeElement('div');
  const { el, id, destroy } = renderCastTableWidget({
    doc,
    mount,
    id: 'panel-elenco',
    data: {
      title: 'Elenco demo',
      rows: [
        {
          participant: 'Participante-A',
          role: 'constructor',
          axis: 'R',
          oldid: '42',
          href: 'https://example.test/42',
          cached: true
        },
        {
          participant: 'Participante-B',
          role: 'UT',
          axis: 'E',
          oldid: '7',
          cached: false
        }
      ]
    }
  });

  assert.equal(id, 'panel-elenco');
  assert.equal(el.getAttribute('data-widget-id'), 'panel-elenco');
  assert.ok(el.className.includes('vk-widget-cast-table'));
  assert.ok(mount.children.includes(el));

  const title = el.children.find((c) => c.className === 'vk-widget-title');
  assert.equal(title?.textContent, 'Elenco demo');

  const table = el.children.find((c) => c.className === 'vk-cast-table');
  assert.ok(table);
  const tbody = table.children.find((c) => c.tagName === 'tbody');
  assert.equal(tbody.children.length, 2);

  const firstOldid = tbody.children[0].children[3];
  const link = firstOldid.children.find((c) => c.tagName === 'a');
  assert.equal(link?.textContent, '42');
  assert.equal(link?.href, 'https://example.test/42');
  const badgeOk = firstOldid.children.find((c) =>
    String(c.className).includes('cached')
  );
  assert.equal(badgeOk?.textContent, 'cacheado');

  const secondBadge = tbody.children[1].children[3].children.find((c) =>
    String(c.className).includes('miss')
  );
  assert.equal(secondBadge?.textContent, 'no cacheado');

  destroy();
  assert.equal(mount.children.includes(el), false);
});

test('renderCastTableWidget: vacío explícito', () => {
  const doc = fakeDoc();
  const { el } = renderCastTableWidget({
    doc,
    data: { rows: [], emptyLabel: 'sin participantes' }
  });
  const empty = el.children.find((c) => c.className === 'vk-widget-empty');
  assert.equal(empty?.textContent, 'sin participantes');
});

test('createDefaultWidgetRegistry: cast-table canónico + alias panel-elenco', () => {
  const reg = createDefaultWidgetRegistry();
  assert.deepEqual(CAST_TABLE_WIDGET_IDS, ['cast-table', 'panel-elenco']);
  assert.equal(reg.has('cast-table'), true);
  assert.equal(reg.has('panel-elenco'), true);
  assert.equal(reg.get('cast-table'), reg.get('panel-elenco'));
  assert.equal(reg.get('cast-table'), renderCastTableWidget);
});

test('createDefaultWidgetRegistry: monta por id neutro cast-table', () => {
  const doc = fakeDoc();
  const mount = fakeElement('div');
  const reg = createDefaultWidgetRegistry();

  const inst = reg.render('cast-table', {
    doc,
    mount,
    data: {
      rows: [{ participant: 'A', role: 'aliado', oldid: '1', cached: true }]
    }
  });
  assert.equal(inst.id, 'cast-table');
  assert.equal(inst.el.getAttribute('data-widget-id'), 'cast-table');
  assert.ok(inst.el.className.includes('vk-widget-cast-table'));
  assert.ok(mount.children.includes(inst.el));
});

test('createDefaultWidgetRegistry: alias panel-elenco mismo render', () => {
  const doc = fakeDoc();
  const mount = fakeElement('div');
  const reg = createDefaultWidgetRegistry();

  const inst = reg.render('panel-elenco', {
    doc,
    mount,
    data: {
      rows: [{ participant: 'A', role: 'aliado', oldid: '1', cached: true }]
    }
  });
  assert.equal(inst.el.getAttribute('data-widget-id'), 'panel-elenco');
  assert.ok(inst.el.className.includes('vk-widget-cast-table'));
  assert.ok(mount.children.includes(inst.el));
});

test('renderCastTableWidget: fallback id neutro cast-table', () => {
  const doc = fakeDoc();
  const { el, id } = renderCastTableWidget({
    doc,
    data: { rows: [] }
  });
  assert.equal(id, 'cast-table');
  assert.equal(el.getAttribute('data-widget-id'), 'cast-table');
});

test('mountStoryWidgets: declara ids del story-board; unknown → placeholder', () => {
  const doc = fakeDoc();
  const mount = fakeElement('div');
  const reg = createDefaultWidgetRegistry();
  const { instances, destroy } = mountStoryWidgets({
    registry: reg,
    widgets: ['panel-elenco', 'panel-heatmap'],
    dataById: {
      'panel-elenco': {
        rows: [{ participant: 'P', role: 'neutro', oldid: '9', cached: false }]
      }
    },
    mount,
    doc
  });

  assert.equal(instances.length, 2);
  assert.equal(instances[0].el.getAttribute('data-widget-id'), 'panel-elenco');
  assert.equal(instances[1].el.getAttribute('data-widget-id'), 'panel-heatmap');
  assert.ok(String(instances[1].el.textContent).includes('sin runtime'));
  assert.equal(mount.children.length, 2);

  destroy();
  assert.equal(mount.children.length, 0);
});

test('registry.render unknown id sin montar registry entry', () => {
  const doc = fakeDoc();
  const reg = createWidgetRegistry();
  const inst = reg.render('panel-modulo', { doc });
  assert.ok(inst.el.className.includes('vk-widget-unknown'));
});
