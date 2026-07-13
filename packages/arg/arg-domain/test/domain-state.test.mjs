import test from 'node:test';
import assert from 'node:assert/strict';

import { createArgDomainState, resolveFeeds, makeIntent, deltaV0 } from '../src/index.mjs';

function makeState() {
  return createArgDomainState({
    feeds: resolveFeeds({ mode: 'synthetic', seed: 11 }),
    gamemap: { id: 'gm-test', objetivo: { labeled: 1, excavated: 1 } }
  });
}

function actor(state, id) {
  return state.snapshot().actors[id];
}

function walkTo(state, actorId, nodeId, maxTicks = 400) {
  const res = state.applyIntent(makeIntent(actorId, 'move', { nodeId }));
  assert.equal(res.ok, true, `move ${actorId} → ${nodeId}: ${res.error}`);
  for (let i = 0; i < maxTicks; i++) {
    state.tick(0.1);
    if (actor(state, actorId).nodeId === nodeId) return;
  }
  assert.fail(`no llegó a ${nodeId}`);
}

test('nav-graph delta-v0: todo nodo alcanzable desde el spawn (WP-01)', () => {
  const state = makeState();
  const { nodos, enlaces } = state.nav;
  const seen = new Set([deltaV0.spawnNodeId]);
  const queue = [deltaV0.spawnNodeId];
  while (queue.length) {
    const node = queue.shift();
    for (const link of Object.values(enlaces)) {
      for (const next of [link.from === node ? link.to : null, link.to === node ? link.from : null]) {
        if (next && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
  }
  assert.equal(seen.size, Object.keys(nodos).length, 'nodos inalcanzables en el nav-graph');
});

test('bucle completo: join → cima → grifo → río → etiqueta → ledger → objetivo', () => {
  const state = makeState();
  assert.equal(state.applyIntent(makeIntent('uno', 'join')).ok, true);
  assert.equal(state.applyIntent(makeIntent('dos', 'join')).ok, true);
  assert.equal(actor(state, 'uno').nodeId, 'plaza');

  // tap:set desde la plaza es inválido (no-op)
  assert.equal(state.applyIntent(makeIntent('uno', 'tap:set', { tapId: 'grifo-a', aperture: 1 })).error, 'fuera_de_cima');

  walkTo(state, 'uno', 'terraza-a');
  walkTo(state, 'uno', 'cima-a');
  assert.equal(state.applyIntent(makeIntent('uno', 'tap:set', { tapId: 'grifo-a', aperture: 1 })).ok, true);

  // dos baja al embarcadero y monta el río
  walkTo(state, 'dos', 'terraza-a');
  walkTo(state, 'dos', 'embarcadero-a');
  for (let i = 0; i < 20; i++) state.tick(0.1); // que el grifo suelte gotas
  assert.equal(state.applyIntent(makeIntent('dos', 'ride', { riverId: 'rio-a' })).ok, true);
  assert.equal(actor(state, 'dos').pose, 'ride');

  // cabalga hasta tener gota debajo y etiqueta
  let labeled = false;
  for (let i = 0; i < 300 && !labeled; i++) {
    state.tick(0.1);
    const res = state.applyIntent(makeIntent('dos', 'label:cast', { label: 'agora' }));
    if (res.ok) labeled = true;
    if (!actor(state, 'dos').riding) break; // llegó a la desembocadura
  }
  assert.equal(labeled, true, 'nunca hubo gota bajo los pies');
  state.tick(0.1); // recoger el evento label en el ledger

  const out = state.drainOutbox();
  assert.ok(out.ledger.some((e) => e.kind === 'label'), 'ledger label');
  assert.ok(out.tracks.some((t) => t.actorId === 'dos' && t.hint === 'firehose-browser'), 'track de gota');
  assert.equal(actor(state, 'dos').score.labeled, 1);
});

test('desembocadura: el río suelta al jinete en la orilla', () => {
  const state = makeState();
  state.applyIntent(makeIntent('uno', 'join'));
  walkTo(state, 'uno', 'terraza-a');
  walkTo(state, 'uno', 'embarcadero-a');
  state.applyIntent(makeIntent('uno', 'ride', { riverId: 'rio-a' }));
  for (let i = 0; i < 800 && actor(state, 'uno').riding; i++) state.tick(0.1);
  assert.equal(actor(state, 'uno').riding, null);
  assert.equal(actor(state, 'uno').nodeId, 'orilla-mar');
  assert.equal(actor(state, 'uno').zone, 'mar');
});

test('cantera: caminar cámaras emite track, excavar abre pasillo y ledger', () => {
  const state = makeState();
  state.applyIntent(makeIntent('uno', 'join'));
  walkTo(state, 'uno', 'orilla-mar');
  walkTo(state, 'uno', 'cantera-entrada');
  walkTo(state, 'uno', 'camara-0-2');

  let out = state.drainOutbox();
  assert.ok(
    out.tracks.some((t) => t.ref.uri.startsWith('linea://nodo/') && t.hint === 'cache-browser'),
    'track de cámara cacheada'
  );

  // pasillo fantasma hacia arriba: excavar y esperar la apertura
  assert.equal(
    state.applyIntent(makeIntent('uno', 'move', { nodeId: 'camara-0-1' })).error,
    'pasillo_cerrado'
  );
  assert.equal(
    state.applyIntent(makeIntent('uno', 'excavate', { corridorId: 'pasillo-camara-0-1--camara-0-2' })).ok,
    true
  );
  for (let i = 0; i < 30; i++) state.tick(0.1);
  out = state.drainOutbox();
  assert.ok(out.ledger.some((e) => e.kind === 'excavate'), 'ledger excavate');
  walkTo(state, 'uno', 'camara-0-1'); // ahora sí
});

test('snapshot compacto: cabe en presupuesto con carga (G-ARG.5)', () => {
  const state = makeState();
  for (let i = 0; i < 8; i++) state.applyIntent(makeIntent(`bot-${i}`, 'join'));
  state.applyIntent(makeIntent('op', 'join'));
  walkTo(state, 'op', 'terraza-a');
  walkTo(state, 'op', 'cima-a');
  state.applyIntent(makeIntent('op', 'tap:set', { tapId: 'grifo-a', aperture: 1 }));
  for (let i = 0; i < 600; i++) state.tick(0.1); // ~60 s de gotas
  const snap = state.snapshot('change', { fullMaze: true });
  const bytes = Buffer.byteLength(JSON.stringify(snap));
  assert.ok(bytes < 32 * 1024, `snapshot ${bytes} bytes ≥ 32 KB`);
  assert.equal(snap.sceneId, 'delta-v0');
  assert.ok(Object.keys(snap.rivers['rio-a'].droplets.length ? snap.rivers : snap.rivers).length);
});

test('contacto: cerca del grifo en la cima abre contacto', () => {
  const state = makeState();
  state.applyIntent(makeIntent('uno', 'join'));
  walkTo(state, 'uno', 'terraza-a');
  walkTo(state, 'uno', 'cima-a');
  const res = state.applyIntent(makeIntent('uno', 'contact:request', { targetId: 'grifo-a' }));
  assert.equal(res.ok, true);
  const contacts = state.snapshot().contacts;
  assert.equal(Object.values(contacts)[0].state, 'open');
});
