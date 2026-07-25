/**
 * Tests del importador one-off (WP-U176) con fixtures SINTÉTICAS neutras.
 * `node --test`. No hay rutas de máquina ni vocabulario de origen aquí.
 *
 * El patrón de ceguera se construye en runtime desde códigos de carácter, para
 * no persistir jamás el token literal del legado en el árbol público.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { leerFuente } from '../fuente.mjs';
import { importarObra, importarCorpus } from '../importar.mjs';
import { validarItem, validarBundle } from '../validar.mjs';
import { escribirBundle } from '../escribir.mjs';
import { isRepartoShaped, validarReparto } from '@zeus/reparto-kit';
import { validateStoryBoardFile } from '@zeus/story-board-schema/validate';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(DIR, 'fixtures');
const JSON_SRC = path.join(FIX, 'corpus.json');
const OBRA_SRC = path.join(FIX, 'obra-md');

// Patrón de ceguera del legado, ensamblado desde códigos (nunca literal).
const cc = (...codes) => String.fromCharCode(...codes);
const TOKENS = [
  cc(110, 111, 118, 101, 108, 105, 115, 116), //  vetado A
  cc(110, 111, 118, 101, 108, 97), //             vetado B
  cc(78, 111, 118, 101, 108, 105, 115, 116, 69, 100, 105, 116, 111, 114) // vetado C
];
const CEGUERA = new RegExp(TOKENS.join('|'), 'gi');

function fuente() {
  return leerFuente({ jsonPath: JSON_SRC, obraDir: OBRA_SRC });
}

test('lee ambas fuentes → obras neutras (JSON + markdown)', () => {
  const obras = fuente();
  assert.equal(obras.length, 2);
  const [json, md] = obras;
  assert.equal(json.personajes.length, 2);
  assert.equal(json.escenas.length, 2);
  assert.equal(json.capitulos.length, 2);
  assert.equal(md.personajes.length, 0);
  assert.equal(md.capitulos.length, 2); // dos ficheros .md
});

test('story-board VALIDA contra AJV de @zeus/story-board-schema (verde)', () => {
  const bundle = importarCorpus(fuente());
  const report = validarBundle(bundle, CEGUERA);
  for (const it of report.items) {
    const sb = it.checks.find((c) => c.formato === 'story-board');
    assert.equal(sb.ok, true, `${it.lineId}: ${sb.errors.join('; ')}`);
  }
});

test('reparto VALIDA contra el validador de @zeus/reparto-kit (shape + ceguera)', () => {
  const bundle = importarCorpus(fuente());
  for (const it of bundle.items) {
    assert.ok(isRepartoShaped(it.reparto), `${it.lineId}: shape`);
    assert.equal(it.reparto.version, 'reparto/1');
    assert.deepEqual(it.reparto.asignaciones, []); // asignaciones vacías (actores después)
    const cg = validarReparto(it.reparto, CEGUERA);
    assert.equal(cg.ok, true, `${it.lineId}: ceguera ${cg.matches.join(',')}`);
  }
});

test('formatos de línea VALIDAN contra schemas de @zeus/linea-kit', () => {
  const bundle = importarCorpus(fuente());
  const report = validarBundle(bundle, CEGUERA);
  assert.equal(report.registro.ok, true, report.registro.errors.join('; '));
  for (const it of report.items) {
    for (const c of it.checks) {
      assert.equal(c.ok, true, `${it.lineId}/${c.formato}: ${c.errors.join('; ')}`);
    }
  }
  assert.equal(report.ok, true);
});

test('IDs zeus deterministas: mismo input → misma salida', () => {
  const a = importarCorpus(fuente());
  const b = importarCorpus(fuente());
  assert.deepEqual(
    a.items.map((i) => i.lineId),
    b.items.map((i) => i.lineId)
  );
  // Estructuras completas idénticas (reparto es congelado → comparar plano).
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  // Y los ids llevan forma zeus <prefijo>-<slug>-<hash8>.
  assert.match(a.items[0].lineId, /^linea-[a-z0-9-]+-[0-9a-f]{8}$/);
  assert.match(a.items[0].reparto.personajes[0].id, /^pj-[a-z0-9-]+-[0-9a-f]{8}$/);
});

test('personajes del story-board son refs-only al reparto (U174)', () => {
  const bundle = importarCorpus(fuente());
  const json = bundle.items[0];
  const idsReparto = new Set(json.reparto.personajes.map((p) => p.id));
  assert.ok(json.board.personajes.refs.length > 0);
  for (const ref of json.board.personajes.refs) {
    assert.ok(idsReparto.has(ref.personajeId), 'ref apunta a un personaje del reparto');
    assert.deepEqual(Object.keys(ref), ['personajeId']); // refs-only: sin corpus embebido
  }
});

test('e2e: escribe a dir temporal y el story-board.json valida desde fichero', () => {
  const bundle = importarCorpus(fuente());
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'u176-'));
  try {
    const escrito = escribirBundle(bundle, out);
    assert.ok(escrito.escritos.includes('LINEAS/registry.yaml'));
    for (const it of bundle.items) {
      const boardFile = path.join(out, 'LINEAS', it.lineId, 'story-board.json');
      const r = validateStoryBoardFile(boardFile);
      assert.equal(r.ok, true, `${it.lineId}: ${r.errors?.join('; ')}`);
      const reparto = JSON.parse(
        fs.readFileSync(path.join(out, 'LINEAS', it.lineId, 'reparto.json'), 'utf8')
      );
      assert.ok(isRepartoShaped(reparto));
    }
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('CEGUERA: cero tokens del legado en el bundle serializado completo', () => {
  const bundle = importarCorpus(fuente());
  const blob = JSON.stringify(bundle);
  const hits = blob.match(CEGUERA) || [];
  assert.equal(hits.length, 0);
});

test('CEGUERA (guard): el validador SÍ marca un patrón que aparece en el blob', () => {
  // Prueba de que el mecanismo de ceguera funciona (patrón neutro trigger).
  const bundle = importarCorpus(fuente());
  const it = bundle.items[0];
  const trigger = new RegExp('lumen', 'gi'); // aparece en un nombre sintético
  const cg = validarReparto(it.reparto, trigger);
  assert.equal(cg.ok, false);
  assert.ok(cg.matches.length > 0);
});

test('worksKey override localiza la colección de obras sin auto-detección', () => {
  const obras = leerFuente({ jsonPath: JSON_SRC, worksKey: 'obras' });
  assert.equal(obras.length, 1);
  assert.equal(obras[0].titulo, 'El atlas de las brumas');
  const item = importarObra(obras[0]);
  assert.equal(validarItem(item, CEGUERA).ok, true);
});

test('IMPORT_NOW inyectado se refleja en generated_at (y sigue determinista)', () => {
  const obras = fuente();
  const a = importarCorpus(obras, { now: '2026-07-25T00:00:00.000Z' });
  const b = importarCorpus(obras, { now: '2026-07-25T00:00:00.000Z' });
  assert.equal(a.items[0].board.generated_at, '2026-07-25T00:00:00.000Z');
  assert.equal(a.items[0].linea.manifestTronco.meta.generated_at, '2026-07-25T00:00:00.000Z');
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  // Sin now → sin generated_at (determinismo puro).
  const c = importarCorpus(obras);
  assert.equal(c.items[0].board.generated_at, undefined);
});
