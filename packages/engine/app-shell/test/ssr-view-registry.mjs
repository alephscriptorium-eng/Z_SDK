import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defineView,
  createViewRegistry,
  renderViewLayout
} from '../src/ssr-view-registry.mjs';

test('defineView requires id and entry', () => {
  assert.throws(() => defineView(null), /id is required/);
  assert.throws(() => defineView({ id: 'x' }), /entry is required/);
});

test('defineView normalizes defaults including defaultRoom and logPanelPlacement', () => {
  const view = defineView({ id: 'demo', entry: '/assets/js/views/demo.mjs', title: 'Demo' });
  assert.equal(view.id, 'demo');
  assert.equal(view.title, 'Demo');
  assert.equal(view.logPanel, false);
  assert.equal(view.logPanelPlacement, 'stage');
  assert.equal(view.defaultRoom, null);
  assert.deepEqual(view.elements, []);
  assert.deepEqual(view.styles, []);
  assert.equal(view.hud, null);
});

test('createViewRegistry indexes and rejects duplicates', () => {
  const a = defineView({ id: 'a', entry: '/a.mjs' });
  const b = defineView({ id: 'b', entry: '/b.mjs' });
  const registry = createViewRegistry([a, b]);
  assert.equal(registry.has('a'), true);
  assert.equal(registry.get('b').entry, '/b.mjs');
  assert.equal(registry.list().length, 2);
  assert.throws(() => createViewRegistry([a, a]), /duplicate view id "a"/);
});

test('renderViewLayout injects viewer-config and entry; stage logPanel stays inside stage', () => {
  const view = defineView({
    id: 'tablero',
    title: 'Tablero',
    emoji: '🗺️',
    entry: '/assets/js/views/tablero.mjs',
    logPanel: true,
    hud: { fields: [{ id: 'hud-conn', label: 'conn', value: '…' }] }
  });

  let captured;
  const out = renderViewLayout(view, {
    template: (title, content, opts) => {
      captured = { title, content, opts };
      return { title, content, opts };
    },
    importMap: { '@zeus/view-kit': '/view-kit/index.mjs' },
    viewerConfig: { room: 'R1', sessionId: 's' }
  });

  assert.equal(out.title, 'Tablero');
  assert.equal(captured.opts.currentPage, 'view:tablero');
  assert.deepEqual(captured.opts.styles, ['/assets/css/viewer.css']);

  const html = stringify(captured.content);
  assert.match(html, /id="viewer-canvas"/);
  assert.match(html, /id="viewer-hud"/);
  assert.match(html, /id="view-log"/);
  assert.match(html, /id="viewer-config"/);
  assert.match(html, /"view":"tablero"/);
  assert.match(html, /"room":"R1"/);
  assert.match(html, /src="\/assets\/js\/views\/tablero\.mjs"/);
  assert.match(html, /type="importmap"/);
  // stage placement: view-log inside viewer-stage, no viewer-split
  assert.match(html, /id="viewer-stage"[^>]*>[\s\S]*id="view-log"/);
  assert.doesNotMatch(html, /class="viewer-split"/);
});

test('renderViewLayout split logPanel uses viewer-split sibling column', () => {
  const view = defineView({
    id: 'bots-log',
    entry: '/assets/js/views/bots-log.mjs',
    logPanel: true,
    logPanelPlacement: 'split'
  });

  const out = renderViewLayout(view, {
    template: (_t, content) => content,
    importMap: {},
    viewerConfig: {},
    themes: ['dark'],
    currentTheme: 'dark'
  });

  const html = stringify(out);
  assert.match(html, /class="viewer-split"/);
  assert.match(html, /id="view-log"/);
  assert.match(html, /id="viewer-stage"/);
});

/** hyperaxe nodes expose .outerHTML or nested children — stringify for asserts */
function stringify(node) {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (typeof node.outerHTML === 'string') return node.outerHTML;
  if (typeof node.toString === 'function' && node.toString !== Object.prototype.toString) {
    const s = node.toString();
    if (s && s !== '[object Object]') return s;
  }
  if (Array.isArray(node)) return node.map(stringify).join('');
  if (node.childNodes) return [...node.childNodes].map(stringify).join('');
  if (node.children) return [...node.children].map(stringify).join('');
  try {
    return JSON.stringify(node);
  } catch {
    return String(node);
  }
}
