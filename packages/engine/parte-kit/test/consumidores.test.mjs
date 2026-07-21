import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { redactarParte } from '../src/redactar.mjs';
import { renderProsa } from '../src/render.mjs';
import { isParteDeCiudadShaped } from '../src/tipos.mjs';
import { estadoDesdeCenso } from '../src/from-mock.mjs';
import { CENSO_FIXTURE, fixture50 } from './fixtures.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const GOLDEN = join(__dir, 'snapshots', 'prosa-golden.md');

test('consumidor prosa → markdown golden', () => {
  const estado0 = estadoDesdeCenso(CENSO_FIXTURE, { tick: 10 });
  const { parte } = redactarParte(estado0, [
    { type: 'tick', tick: 11 },
    { type: 'barrio', id: 'BlocklyEditor', estado: 'vivo', gentesActivas: 1 },
    { type: 'work', barrioId: 'WiringEditor', texto: 'cableado plaza' }
  ]);
  const md = renderProsa(parte);
  if (!existsSync(GOLDEN)) {
    writeFileSync(GOLDEN, md, 'utf8');
  }
  const golden = readFileSync(GOLDEN, 'utf8');
  assert.equal(md, golden);
  assert.match(md, /# Parte de plaza/);
  assert.match(md, /## Titulares/);
});

test('consumidor JSON → schema tipos.mjs (isParteDeCiudadShaped)', () => {
  const { estado0, deltas } = fixture50();
  const { parte } = redactarParte(estado0, deltas);
  assert.equal(isParteDeCiudadShaped(parte), true);
  assert.equal(parte.version, 'parte/1');
  assert.ok(parte.titulares.length <= 5);
});

test('consumidor pendientes no vacío si hay latentes/rotos', () => {
  const estado0 = estadoDesdeCenso(CENSO_FIXTURE, { tick: 1 });
  const { parte } = redactarParte(estado0, [{ type: 'tick', tick: 2 }]);
  assert.ok(parte.pendientes.length > 0);
  assert.ok(parte.pendientes.every((p) => p.barrioId && p.texto));
  const ids = new Set(parte.pendientes.map((p) => p.barrioId));
  assert.ok(ids.has('BlocklyEditor') || ids.has('ScriptoriumVps') || ids.has('PrologEditor'));
});
