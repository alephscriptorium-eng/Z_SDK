/**
 * Menú de contacto (WP-11) — render puro de oferta HORSE en 3 columnas.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePresetOffer } from '@zeus/presets-sdk/horse';
import { grifoCloakDef } from '@zeus/arg-domain/scenes/tap-cloaks';
import {
  renderContactMenu,
  bindContactMenu,
  setContactLive,
  formatContactLive
} from '../assets/js/kit/contact-render.mjs';

const { preset, catalog } = grifoCloakDef('grifo-a');
const offer = resolvePresetOffer(preset, catalog);

test('renderContactMenu: tres columnas PROMPTS / TOOLS / RESOURCES', () => {
  const html = renderContactMenu(offer, { liveText: 'esperando…' });
  assert.match(html, /contact-live/);
  assert.match(html, /PROMPTS/);
  assert.match(html, /TOOLS/);
  assert.match(html, /RESOURCES/);
  assert.match(html, /tap\.set_aperture/);
  assert.match(html, /data-tool="tap\.set_aperture"/);
  assert.match(html, /grifo-a-cloak/);
  assert.match(html, /esperando…/);
});

test('renderContactMenu: REST opcional', () => {
  const html = renderContactMenu(offer, {
    restActions: [{ id: 'list-presets', label: 'GET /api/mcp/presets' }]
  });
  assert.match(html, /contact-rest/);
  assert.match(html, /data-rest="list-presets"/);
});

test('bindContactMenu: dispara onTool con args del formulario', () => {
  const root = makeRoot(renderContactMenu(offer));
  let called = null;
  bindContactMenu(root, {
    onTool: (name, args) => { called = { name, args }; }
  });

  const input = root.querySelector('[data-tool-field="aperture"]');
  input.value = '0.6';
  root.querySelector('.contact-tool-btn')?.click();
  assert.equal(called?.name, 'tap.set_aperture');
  assert.equal(called?.args?.aperture, 0.6);
});

test('setContactLive: actualiza zona live', () => {
  const live = { textContent: '' };
  const root = { querySelector: (sel) => (sel === '#contact-live' ? live : null) };
  setContactLive(root, 'ok · aperture 0.6');
  assert.equal(live.textContent, 'ok · aperture 0.6');
});

test('formatContactLive: serializa resultado JSON-RPC', () => {
  const text = formatContactLive({ result: { content: [{ text: 'ok' }] } });
  assert.match(text, /ok/);
});

function makeRoot(html) {
  const nodes = [];

  for (const m of html.matchAll(/<input([^>]*)>/g)) {
    const attrs = parseAttrs(m[0]);
    nodes.push({
      tag: 'input',
      type: attrs.type ?? 'text',
      dataset: {
        tool: attrs['data-tool'],
        toolField: attrs['data-tool-field']
      },
      attrs,
      value: attrs.value ?? '',
      getAttribute(k) { return this.attrs[k] ?? null; },
      addEventListener() {}
    });
  }
  for (const m of html.matchAll(/<button([^>]*)>/g)) {
    const attrs = parseAttrs(m[0]);
    const listeners = [];
    nodes.push({
      tag: 'button',
      className: attrs.class ?? '',
      dataset: {
        tool: attrs['data-tool'],
        prompt: attrs['data-prompt'],
        resourceName: attrs['data-resource-name'],
        resourceUri: attrs['data-resource-uri'],
        rest: attrs['data-rest'],
        close: attrs['data-close']
      },
      attrs,
      listeners,
      addEventListener(name, fn) { listeners.push({ name, fn }); },
      click() { for (const l of listeners) if (l.name === 'click') l.fn(); }
    });
  }

  return {
    innerHTML: html,
    querySelector(sel) {
      if (sel === '.contact-tool-btn') {
        return nodes.find((n) => n.tag === 'button' && n.className.includes('contact-tool-btn'));
      }
      if (sel.startsWith('[data-tool-field')) {
        const key = sel.match(/"([^"]+)"/)?.[1];
        return nodes.find((n) => n.attrs['data-tool-field'] === key);
      }
      return null;
    },
    querySelectorAll(sel) {
      if (sel.includes('contact-prompt-btn')) return nodes.filter((n) => n.className?.includes('contact-prompt-btn'));
      if (sel.includes('contact-tool-btn')) return nodes.filter((n) => n.className?.includes('contact-tool-btn'));
      if (sel.includes('contact-resource-btn')) return nodes.filter((n) => n.className?.includes('contact-resource-btn'));
      if (sel.includes('contact-rest-btn')) return nodes.filter((n) => n.className?.includes('contact-rest-btn'));
      const toolSel = sel.match(/\[data-tool="([^"]+)"\]\[data-tool-field\]/);
      if (toolSel) {
        return nodes.filter((n) => n.tag === 'input' && n.attrs['data-tool'] === toolSel[1] && n.attrs['data-tool-field']);
      }
      return [];
    }
  };
}

function parseAttrs(tag) {
  const attrs = {};
  const re = /([\w:-]+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(tag))) attrs[m[1]] = m[2];
  return attrs;
}
