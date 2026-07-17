/**
 * Monigote stick (WP-07) — el módulo three (stick-puppet.mjs) no corre en
 * node, así que aquí se testea lo testeable: stick-poses.mjs, la cinemática
 * paramétrica PURA (tiempo → ángulos por articulación) que el puppet aplica.
 * Ciclos periódicos, límites articulares y decaimiento de la capa aditiva.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  basePose,
  additivePose,
  blendPose,
  zeroPose,
  emoteWeight,
  STICK_POSES,
  STICK_EMOTES,
  WALK_PERIOD_SEC,
  EMOTE_DURATION_SEC
} from '../src/stick-poses.mjs';

const JOINT_KEYS = Object.keys(zeroPose());

function assertPoseShape(pose, label) {
  for (const key of JOINT_KEYS) {
    assert.equal(typeof pose[key], 'number', `${label}.${key} debe ser número`);
    assert.ok(Number.isFinite(pose[key]), `${label}.${key} debe ser finito`);
  }
}

test('todas las poses base devuelven la forma completa de articulaciones', () => {
  for (const name of STICK_POSES) {
    for (const t of [0, 0.31, 1.7, 12.9]) {
      assertPoseShape(basePose(name, t), `${name}@${t}`);
    }
  }
});

test('pose desconocida cae a idle (nunca crash, nunca congelado)', () => {
  const idle = basePose('idle', 2.5);
  const rara = basePose('pose-inventada', 2.5);
  assert.deepEqual(rara, idle);
});

test('walk es periódico: misma fase ⇒ misma pose', () => {
  for (const t of [0.1, 0.33, 0.5]) {
    const a = basePose('walk', t);
    const b = basePose('walk', t + WALK_PERIOD_SEC);
    for (const key of JOINT_KEYS) {
      assert.ok(Math.abs(a[key] - b[key]) < 1e-9, `walk.${key} no es periódico en t=${t}`);
    }
  }
});

test('walk alterna piernas y brazos en contrafase', () => {
  const p = basePose('walk', WALK_PERIOD_SEC / 4); // pico de la zancada
  assert.ok(p.legSwingL > 0.3, 'pierna izquierda adelante en el pico');
  assert.ok(p.legSwingR < -0.3, 'pierna derecha atrás en el pico');
  assert.ok(p.armSwingL < -0.2 && p.armSwingR > 0.2, 'brazos en contrafase con las piernas');
});

test('límites articulares: ninguna articulación pasa de π en ninguna pose', () => {
  for (const name of STICK_POSES) {
    for (let t = 0; t < 8; t += 0.05) {
      const p = basePose(name, t);
      for (const key of JOINT_KEYS) {
        if (key === 'bob' || key === 'crouch') continue; // unidades de mundo, no radianes
        assert.ok(Math.abs(p[key]) <= Math.PI, `${name}.${key}=${p[key]} fuera de límites en t=${t}`);
      }
    }
  }
});

test('idle respira: la pose varía suavemente con el tiempo', () => {
  const a = basePose('idle', 0);
  const b = basePose('idle', 0.9);
  assert.notDeepEqual(a, b, 'idle no debe ser una estatua');
});

test('la envolvente del emote sube, sostiene y decae a 0 exactamente', () => {
  assert.equal(emoteWeight(-0.1), 0);
  assert.equal(emoteWeight(EMOTE_DURATION_SEC), 0);
  assert.equal(emoteWeight(EMOTE_DURATION_SEC + 1), 0);
  assert.ok(emoteWeight(0.075) > 0 && emoteWeight(0.075) < 1, 'rampa de subida');
  assert.equal(emoteWeight(EMOTE_DURATION_SEC / 2), 1, 'sostiene a peso completo');
  assert.ok(emoteWeight(EMOTE_DURATION_SEC - 0.1) < 1, 'rampa de bajada');
});

test('la capa aditiva decae a la pose cero fuera de su ventana', () => {
  for (const name of STICK_EMOTES) {
    assert.deepEqual(additivePose(name, EMOTE_DURATION_SEC), zeroPose(), `${name} debe morir a duración`);
    assert.deepEqual(additivePose(name, -0.5), zeroPose(), `${name} no existe antes de empezar`);
    // muestrear varios instantes: los sinusoides cruzan cero puntualmente
    let activity = 0;
    for (const t of [0.4, 0.6, 0.75, 0.9]) {
      const pose = additivePose(name, t);
      assertPoseShape(pose, `additive ${name}@${t}`);
      activity = Math.max(activity, JOINT_KEYS.reduce((sum, key) => sum + Math.abs(pose[key]), 0));
    }
    assert.ok(activity > 0.05, `${name} debe hacer ALGO durante el emote`);
  }
});

test('blending aditivo: base + cero = base; base + emote suma articulación a articulación', () => {
  const base = basePose('walk', 0.2);
  assert.deepEqual(blendPose(base, zeroPose()), { ...zeroPose(), ...base });

  const add = additivePose('nod', 0.6);
  const mixed = blendPose(base, add);
  for (const key of JOINT_KEYS) {
    assert.ok(Math.abs(mixed[key] - (base[key] + add[key])) < 1e-12, `blend.${key}`);
  }
});

test('emote desconocido = capa cero (no-op, nunca crash)', () => {
  assert.deepEqual(additivePose('emote-inventado', 0.5), zeroPose());
});
