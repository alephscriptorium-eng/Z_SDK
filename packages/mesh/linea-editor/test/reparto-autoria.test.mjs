/**
 * WP-U175 · Autoría gateada por reparto sobre linea-editor.
 *
 * Extiende el gate ÚNICO existente (token, eje V) con la cara de reparto (U173:
 * evaluarPermiso/puede sobre peer-card con ssbId, exigirSeat) y verifica que el
 * export emite personajes refs coherentes con story-board-schema (U174, AJV).
 *
 * Verde/rojo: actor con personaje asignado + asiento válido PUEDE autorar; actor
 * sin personaje, sin asiento o con asiento inválido NO. Un solo gate: el mismo
 * `requireMutationApproval` lleva ambas caras en un único objeto `gate`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makePeerCard, roleScope } from '@zeus/protocol';
import { resolveMcpApprovalToken } from '@zeus/presets-sdk';
import {
  generateSeatKeyPair,
  signTravelingPeerCard,
  verifyTravelingPeerCard
} from '@zeus/protocol/peer-card-seat';
import { crearReparto } from '@zeus/reparto-kit';
import {
  runCrearLineaGated,
  runExportStoryBoardGated,
  MUTATION_TOOL_CREAR_LINEA
} from '../src/tools.mjs';
import {
  requireMutationApproval,
  evaluateRepartoAuthorship,
  AUTHORSHIP_PERMISO
} from '../src/gate.mjs';
import { buildPersonajesRefs, lineToStoryBoard } from '../src/export-story-board.mjs';
import {
  resolveRequireReparto,
  REQUIRE_REPARTO_ENV
} from '../src/config.mjs';
import { editorInfo } from '../src/editor-server.mjs';
import { validateStoryBoard, validateStoryBoardFile } from '@zeus/story-board-schema';

const NOW = 1_700_000_000_000;

/** Corre `fn` con la política servidor-side de reparto en on/off, restaurando env. */
function withRequireReparto(value, fn) {
  const prev = process.env[REQUIRE_REPARTO_ENV];
  if (value == null) delete process.env[REQUIRE_REPARTO_ENV];
  else process.env[REQUIRE_REPARTO_ENV] = value;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env[REQUIRE_REPARTO_ENV];
    else process.env[REQUIRE_REPARTO_ENV] = prev;
  }
}

function tmpLineas() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'linea-editor-u175-'));
}

/** Peer-card firmada (asiento válido) cuyo ssbId es el actor. */
function signedCard(seat, { now = NOW, ttlMs = 3_600_000, expiresAt } = {}) {
  const base = makePeerCard({
    roomId: 'sala',
    endpoint: 'https://endpoint.example',
    token: 'tok',
    scopes: [roleScope('player'), 'presence:join'],
    issuedAt: now,
    expiresAt: expiresAt ?? now + ttlMs,
    ssbId: seat.ssbId
  });
  return signTravelingPeerCard(base, seat.privateKey, seat.ssbId);
}

/** Peer-card SIN asiento (sin seatSignature). */
function unsignedCard(ssbId, { now = NOW, ttlMs = 3_600_000 } = {}) {
  return makePeerCard({
    roomId: 'sala',
    endpoint: 'https://endpoint.example',
    token: 'tok',
    scopes: [roleScope('player'), 'presence:join'],
    issuedAt: now,
    expiresAt: now + ttlMs,
    ssbId
  });
}

/**
 * Reparto fijo: A interpreta protagonista (autora) + figurante (solo lee);
 * la política concede `reparto:interpretar` al protagonista y solo lee al figurante.
 */
function repartoFijo(actorA) {
  return crearReparto({
    personajes: [
      { id: 'pj-prota', nombre: 'Protagonista', rol: 'protagonista' },
      { id: 'pj-antagonista', nombre: 'Antagonista', rol: 'antagonista' },
      { id: 'pj-fig', nombre: 'Figurante', rol: 'figurante' }
    ],
    asignaciones: [
      { actorSsbId: actorA, personajeId: 'pj-prota' },
      { actorSsbId: actorA, personajeId: 'pj-fig' }
    ],
    politica: {
      protagonista: ['reparto:leer', 'reparto:interpretar', 'reparto:dirigir'],
      antagonista: ['reparto:leer', 'reparto:interpretar'],
      figurante: ['reparto:leer']
    }
  });
}

// ───────────────────────── CA1 · autoría permitida/denegada (verde/rojo) ─────

test('CA1 verde: actor con personaje asignado + asiento válido PUEDE autorar (crear_linea)', () => {
  const lineasRoot = tmpLineas();
  const seat = generateSeatKeyPair();
  const card = signedCard(seat);
  assert.equal(verifyTravelingPeerCard(card).ok, true);
  const reparto = repartoFijo(seat.ssbId);

  const res = runCrearLineaGated({
    id: 'autoria-ok',
    lineasRoot,
    approve: true,
    approvalToken: resolveMcpApprovalToken(),
    reparto,
    card,
    personajeId: 'pj-prota',
    now: NOW,
    overwrite: true
  });

  assert.equal(res.ok, true);
  assert.equal(res.approved, true);
  // gate único, cara reparto poblada (reparto aportado en esta llamada):
  assert.equal(res.gate.reparto_supplied, true);
  assert.equal(res.gate.reparto.motivo, 'concedido');
  assert.equal(res.gate.reparto.permiso, AUTHORSHIP_PERMISO);
  assert.equal(res.gate.reparto.actor_ssb_id, seat.ssbId);
  assert.equal(res.gate.reparto.rol, 'protagonista');
  assert.equal(res.gate.reparto.exigir_seat, true);
  // y la cara token sigue presente en el MISMO objeto gate (cero gate paralelo):
  assert.ok(res.gate.gate_line);
  assert.ok(fs.existsSync(path.join(lineasRoot, 'autoria-ok', 'manifest.json')));
});

test('CA1 rojo: actor SIN personaje en el reparto NO puede autorar → personaje_no_en_reparto', () => {
  const lineasRoot = tmpLineas();
  const seatA = generateSeatKeyPair();
  const seatB = generateSeatKeyPair(); // B no tiene asignaciones
  const reparto = repartoFijo(seatA.ssbId);

  const res = runCrearLineaGated({
    id: 'autoria-no-personaje',
    lineasRoot,
    approve: true,
    approvalToken: resolveMcpApprovalToken(),
    reparto,
    card: signedCard(seatB),
    personajeId: 'pj-prota',
    now: NOW,
    overwrite: true
  });

  assert.equal(res.ok, false);
  assert.equal(res.rule, 'linea-editor.reparto_personaje_no_en_reparto');
  assert.equal(res.decision.motivo, 'personaje_no_en_reparto');
  assert.equal(res.gate.reparto.motivo, 'personaje_no_en_reparto');
  // denegado ⇒ NO se escribió volumen:
  assert.ok(!fs.existsSync(path.join(lineasRoot, 'autoria-no-personaje')));
});

test('CA1 rojo: card SIN asiento con exigirSeat forzado → seat_ausente', () => {
  const lineasRoot = tmpLineas();
  const seat = generateSeatKeyPair();
  const reparto = repartoFijo(seat.ssbId);

  const res = runCrearLineaGated({
    id: 'autoria-seat-ausente',
    lineasRoot,
    approve: true,
    approvalToken: resolveMcpApprovalToken(),
    reparto,
    card: unsignedCard(seat.ssbId), // sin seatSignature
    personajeId: 'pj-prota',
    now: NOW,
    overwrite: true
  });

  assert.equal(res.ok, false);
  assert.equal(res.rule, 'linea-editor.reparto_seat_ausente');
  assert.equal(res.decision.motivo, 'seat_ausente');
  assert.ok(!fs.existsSync(path.join(lineasRoot, 'autoria-seat-ausente')));
});

test('CA1 rojo: asiento inválido (ssbId manipulado post-firma) → seat_invalido', () => {
  const lineasRoot = tmpLineas();
  const seat = generateSeatKeyPair();
  const intruso = generateSeatKeyPair();
  // El reparto asigna el personaje al ssbId intruso: sin verificación de asiento
  // se colaría; con asiento verificado NO (la firma no cubre el ssbId manipulado).
  const reparto = crearReparto({
    personajes: [{ id: 'pj-prota', nombre: 'Protagonista', rol: 'protagonista' }],
    asignaciones: [{ actorSsbId: intruso.ssbId, personajeId: 'pj-prota' }],
    politica: { protagonista: ['reparto:interpretar'] }
  });

  const firmada = signedCard(seat);
  const tampered = { ...firmada, ssbId: intruso.ssbId };
  assert.equal(verifyTravelingPeerCard(tampered).ok, false);

  const res = runCrearLineaGated({
    id: 'autoria-seat-invalido',
    lineasRoot,
    approve: true,
    approvalToken: resolveMcpApprovalToken(),
    reparto,
    card: tampered,
    personajeId: 'pj-prota',
    now: NOW,
    overwrite: true
  });

  assert.equal(res.ok, false);
  assert.equal(res.rule, 'linea-editor.reparto_seat_invalido');
  assert.equal(res.decision.motivo, 'seat_invalido');
  assert.equal(res.gate.reparto.seat_error, 'seatSignature mismatch');
  assert.ok(!fs.existsSync(path.join(lineasRoot, 'autoria-seat-invalido')));
});

test('CA1 rojo: personaje asignado pero el rol NO concede autorar → rol_sin_permiso', () => {
  const lineasRoot = tmpLineas();
  const seat = generateSeatKeyPair();
  const reparto = repartoFijo(seat.ssbId);

  const res = runCrearLineaGated({
    id: 'autoria-rol',
    lineasRoot,
    approve: true,
    approvalToken: resolveMcpApprovalToken(),
    reparto,
    card: signedCard(seat),
    personajeId: 'pj-fig', // figurante solo lee
    now: NOW,
    overwrite: true
  });

  assert.equal(res.ok, false);
  assert.equal(res.rule, 'linea-editor.reparto_rol_sin_permiso');
  assert.equal(res.decision.motivo, 'rol_sin_permiso');
});

// ───────────────────────── Gate ÚNICO · cero mecanismo paralelo ──────────────

test('gate único: la cara token se aplica ANTES que la de reparto (token_mismatch corta)', () => {
  const seat = generateSeatKeyPair();
  const reparto = repartoFijo(seat.ssbId);
  const denied = requireMutationApproval({
    toolName: MUTATION_TOOL_CREAR_LINEA,
    approve: true,
    approvalToken: 'TOKEN-INCORRECTO',
    reparto,
    card: signedCard(seat),
    personajeId: 'pj-prota',
    now: NOW
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.rule, 'linea-editor.token_mismatch');
  // aun cortando por token, el objeto gate declara que la llamada trae reparto:
  assert.equal(denied.gate.reparto_supplied, true);
  // no hay un segundo mecanismo: la cara reparto solo se evalúa tras el token
  assert.equal(denied.gate.reparto, undefined);
});

test('gate único: sin reparto se comporta como el gate token-only previo (retro-compat)', () => {
  const ok = requireMutationApproval({
    toolName: MUTATION_TOOL_CREAR_LINEA,
    approve: true,
    approvalToken: resolveMcpApprovalToken()
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.gate.reparto_required, false); // política servidor OFF por defecto
  assert.equal(ok.gate.reparto_supplied, false);
  assert.equal(ok.gate.reparto, undefined); // sin cara reparto cuando no se aporta
});

test('evaluateRepartoAuthorship: un reparto mal formado deniega sin lanzar → reparto_no_shaped', () => {
  const r = evaluateRepartoAuthorship({
    reparto: { version: 'reparto/1' }, // sin personajes/asignaciones/politica
    card: signedCard(generateSeatKeyPair()),
    personajeId: 'pj-prota',
    now: NOW
  });
  assert.equal(r.decision.ok, false);
  assert.equal(r.decision.motivo, 'reparto_no_shaped');
});

// ───────────────────────── CA2 · export valida contra story-board-schema U174 ─

test('CA2 verde: export con reparto emite personajes refs y VALIDA contra U174 (AJV)', () => {
  const lineasRoot = tmpLineas();
  const seat = generateSeatKeyPair();
  const card = signedCard(seat);
  const reparto = repartoFijo(seat.ssbId);
  const token = resolveMcpApprovalToken();

  // 1) crear la línea (token-only) para tener un lineDir con manifest.
  const creada = runCrearLineaGated({
    id: 'export-personajes',
    lineasRoot,
    approve: true,
    approvalToken: token,
    overwrite: true
  });
  assert.equal(creada.ok, true);

  // 2) export gateado por reparto (autor autorizado) → board con personajes refs.
  const exported = runExportStoryBoardGated({
    lineDir: creada.lineDir,
    approve: true,
    approvalToken: token,
    reparto,
    card,
    personajeId: 'pj-prota',
    now: NOW
  });

  assert.equal(exported.ok, true);
  assert.equal(exported.validation.ok, true); // AJV verde en memoria
  // el board lleva el bloque personajes (U174):
  assert.ok(exported.board.personajes);
  assert.equal(exported.board.personajes.reparto, 'reparto://export-personajes/reparto.json');
  const ids = exported.board.personajes.refs.map((r) => r.personajeId).sort();
  assert.deepEqual(ids, ['pj-antagonista', 'pj-fig', 'pj-prota']);
  // refs-only: cada ref es exactamente { personajeId } (sin nombre/rol corpus)
  for (const ref of exported.board.personajes.refs) {
    assert.deepEqual(Object.keys(ref), ['personajeId']);
  }
  // 3) re-validación del fichero escrito en disco contra el schema U174:
  const fromDisk = validateStoryBoardFile(exported.outPath);
  assert.equal(fromDisk.ok, true, JSON.stringify(fromDisk.errors));
  // 4) payload horse: personajes como ids (refs-only), sin corpus:
  assert.deepEqual([...exported.refs.personajes].sort(), ['pj-antagonista', 'pj-fig', 'pj-prota']);
  assert.equal(exported.refs.reparto, 'reparto://export-personajes/reparto.json');
  // refs-only: ids planos (string), sin claves ni valores de corpus (nombre/rol).
  assert.equal(exported.refs.personajes.every((x) => typeof x === 'string'), true);
  const horseJson = JSON.stringify(exported.refs);
  assert.equal(/"nombre"|"rol"/.test(horseJson), false); // claves de corpus ausentes
  assert.equal(/Protagonista|Antagonista|Figurante/.test(horseJson), false); // nombres (capital) ausentes
});

test('CA2 retro-compat: export SIN reparto no lleva personajes y sigue validando U174', () => {
  const lineasRoot = tmpLineas();
  const token = resolveMcpApprovalToken();
  const creada = runCrearLineaGated({
    id: 'export-sin-reparto',
    lineasRoot,
    approve: true,
    approvalToken: token,
    overwrite: true
  });
  const exported = runExportStoryBoardGated({
    lineDir: creada.lineDir,
    approve: true,
    approvalToken: token
  });
  assert.equal(exported.ok, true);
  assert.equal(exported.board.personajes, undefined);
  assert.equal(exported.personaje_count, 0);
  assert.equal(validateStoryBoardFile(exported.outPath).ok, true);
});

test('U174 refs-only: buildPersonajesRefs descarta corpus; el schema rechaza refs con nombre/rol', () => {
  const reparto = repartoFijo(generateSeatKeyPair().ssbId);
  const refs = buildPersonajesRefs(reparto, 'reparto://x/reparto.json');
  for (const r of refs.refs) assert.deepEqual(Object.keys(r), ['personajeId']);

  // nuestro board (refs-only) valida:
  const bueno = lineToStoryBoard({ id: 'x', nodos: [] }, { reparto, repartoUri: 'reparto://x/reparto.json' });
  assert.equal(validateStoryBoard(bueno).ok, true);

  // un board con corpus embebido en la ref (nombre/rol) NO valida (strict U174):
  const malo = { ...bueno, personajes: { refs: [{ personajeId: 'pj-prota', nombre: 'X', rol: 'Y' }] } };
  const v = validateStoryBoard(malo);
  assert.equal(v.ok, false);

  // reparto vacío → sin bloque personajes (no fuerza campo):
  assert.equal(buildPersonajesRefs({ personajes: [] }, 'reparto://x'), null);
  assert.equal(buildPersonajesRefs(undefined), null);
});

// ─────────── Flag servidor-side: exigir reparto (política del despliegue) ─────

test('flag OFF (default): mutación sin reparto PERMITIDA (retro-compat; llamador cooperativo)', () => {
  withRequireReparto(undefined, () => {
    assert.equal(resolveRequireReparto(), false);
    const lineasRoot = tmpLineas();
    const res = runCrearLineaGated({
      id: 'flag-off',
      lineasRoot,
      approve: true,
      approvalToken: resolveMcpApprovalToken(),
      overwrite: true
    });
    assert.equal(res.ok, true);
    assert.equal(res.gate.reparto_required, false);
    assert.ok(fs.existsSync(path.join(lineasRoot, 'flag-off', 'manifest.json')));
  });
});

test('flag ON: mutación sin reparto DENEGADA reparto_requerido, sin escritura en volumen', () => {
  withRequireReparto('1', () => {
    assert.equal(resolveRequireReparto(), true);
    const lineasRoot = tmpLineas();
    const token = resolveMcpApprovalToken();

    // crear_linea sin reparto → denegado ANTES de escribir (check→write intacto).
    const denied = runCrearLineaGated({
      id: 'flag-on-sin',
      lineasRoot,
      approve: true,
      approvalToken: token,
      overwrite: true
    });
    assert.equal(denied.ok, false);
    assert.equal(denied.rule, 'linea-editor.reparto_requerido');
    assert.equal(denied.decision.motivo, 'reparto_requerido');
    assert.equal(denied.gate.reparto_required, true);
    assert.equal(denied.gate.reparto.motivo, 'reparto_requerido');
    assert.ok(!fs.existsSync(path.join(lineasRoot, 'flag-on-sin')));

    // export_story_board sin reparto → también denegado (misma política).
    const expDenied = runExportStoryBoardGated({
      lineDir: path.join(lineasRoot, 'inexistente'),
      approve: true,
      approvalToken: token
    });
    assert.equal(expDenied.ok, false);
    assert.equal(expDenied.rule, 'linea-editor.reparto_requerido');
  });
});

test('flag ON: mutación CON reparto válido PERMITIDA (autor autorizado) y escribe volumen', () => {
  withRequireReparto('true', () => {
    const lineasRoot = tmpLineas();
    const seat = generateSeatKeyPair();
    const okRes = runCrearLineaGated({
      id: 'flag-on-con',
      lineasRoot,
      approve: true,
      approvalToken: resolveMcpApprovalToken(),
      reparto: repartoFijo(seat.ssbId),
      card: signedCard(seat),
      personajeId: 'pj-prota',
      now: NOW,
      overwrite: true
    });
    assert.equal(okRes.ok, true);
    assert.equal(okRes.gate.reparto_required, true);
    assert.equal(okRes.gate.reparto.motivo, 'concedido');
    assert.ok(fs.existsSync(path.join(lineasRoot, 'flag-on-con', 'manifest.json')));
  });
});

test('editor://info refleja el estado REAL del flag (reparto_required true|false)', () => {
  const off = withRequireReparto(undefined, () => editorInfo({ lineasRoot: '/tmp/x' }));
  assert.equal(off.gate.reparto_required, false);
  assert.equal(off.gate.reparto.required, false);
  assert.equal(off.gate.reparto_policy_env, REQUIRE_REPARTO_ENV);

  const on = withRequireReparto('on', () => editorInfo({ lineasRoot: '/tmp/x' }));
  assert.equal(on.gate.reparto_required, true);
  assert.equal(on.gate.reparto.required, true);
  assert.ok(on.gate.reparto.motivos_deny.includes('reparto_requerido'));
});
