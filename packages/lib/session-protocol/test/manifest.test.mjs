import test from 'node:test';
import assert from 'node:assert/strict';
import { parse as yamlParse } from 'yaml';
import { buildSessionManifest } from '../spec/manifest.mjs';
import { EVENTS, SESSION_NAMESPACE, PROTOCOL_VERSION } from '../src/protocol.mjs';

test('buildSessionManifest shape', () => {
  const doc = yamlParse(buildSessionManifest());

  assert.equal(doc.version, PROTOCOL_VERSION);
  assert.equal(doc.namespace, SESSION_NAMESPACE);
  assert.ok(Array.isArray(doc.inbound));
  assert.ok(Array.isArray(doc.outbound));

  const inboundNames = doc.inbound.map((entry) => entry.name);
  const outboundNames = doc.outbound.map((entry) => entry.name);

  for (const [name, meta] of Object.entries(EVENTS)) {
    if (meta.direction === 'inbound') {
      assert.ok(inboundNames.includes(name), `missing inbound ${name}`);
    } else {
      assert.ok(outboundNames.includes(name), `missing outbound ${name}`);
    }
  }

  for (const entry of doc.inbound) {
    assert.equal(entry.direction, 'inbound');
    assert.ok(entry.schema);
    assert.equal(typeof entry.description, 'string');
  }

  for (const entry of doc.outbound) {
    assert.equal(entry.direction, 'outbound');
    assert.ok(entry.schema);
  }
});
