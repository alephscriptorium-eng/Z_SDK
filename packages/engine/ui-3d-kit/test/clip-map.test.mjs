import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ALEPHILLO_SPEC_ADDITIVE,
  ALEPHILLO_SPEC_BASE,
  DEFAULT_CLIP_MAPS,
  POSE_TO_BASE,
  resolveClipMap,
  resolveBaseClip,
  resolveAdditiveClip,
} from '../src/puppet/clip-map.mjs';

// Real clip names verified by parsing the GLB JSON chunks (see clip-map.mjs).
const XBOT_CLIPS = ['agree', 'headShake', 'idle', 'run', 'sad_pose', 'sneak_pose', 'walk'];
const ROBOT_CLIPS = [
  'Dance', 'Death', 'Idle', 'Jump', 'No', 'Punch', 'Running',
  'Sitting', 'Standing', 'ThumbsUp', 'Walking', 'WalkJump', 'Wave', 'Yes',
];

test('DEFAULT_CLIP_MAPS covers canonical and placeholder GLBs', () => {
  assert.deepEqual(
    Object.keys(DEFAULT_CLIP_MAPS).sort(),
    ['RobotExpressive.glb', 'SK_Alephillo.glb', 'Xbot.glb'],
  );
  assert.equal(DEFAULT_CLIP_MAPS['SK_Alephillo.glb'].placeholderMesh, 'Xbot.glb');
});

test('SK_Alephillo shares Xbot clip map (mesh placeholder until ALP_* rig)', () => {
  const sk = DEFAULT_CLIP_MAPS['SK_Alephillo.glb'];
  const xbot = DEFAULT_CLIP_MAPS['Xbot.glb'];
  assert.equal(resolveBaseClip(sk, 'idle').clip, resolveBaseClip(xbot, 'idle').clip);
  assert.equal(resolveAdditiveClip(sk, 'nod_slow').clip, resolveAdditiveClip(xbot, 'nod_slow').clip);
});

test('every base pose (idle/walk/sit) is mapped for every GLB', () => {
  for (const [glb, clipMap] of Object.entries(DEFAULT_CLIP_MAPS)) {
    for (const pose of Object.keys(POSE_TO_BASE)) {
      const resolved = resolveBaseClip(clipMap, pose);
      assert.ok(resolved, `${glb}: base pose ${pose} unmapped`);
      assert.equal(typeof resolved.clip, 'string');
      assert.ok(resolved.clip.length > 0);
    }
  }
});

test('placeholder mapped clips exist in the GLBs (verified name lists)', () => {
  const real = {
    'Xbot.glb': XBOT_CLIPS,
    'SK_Alephillo.glb': XBOT_CLIPS,
    'RobotExpressive.glb': ROBOT_CLIPS,
  };
  for (const [glb, clipMap] of Object.entries(DEFAULT_CLIP_MAPS)) {
    if (!real[glb]) continue;
    for (const [specName, entry] of Object.entries(clipMap.base)) {
      assert.ok(
        real[glb].includes(entry.clip),
        `${glb} base ${specName} -> "${entry.clip}" not in GLB`,
      );
    }
    for (const [specName, entry] of Object.entries(clipMap.additive)) {
      assert.ok(
        real[glb].includes(entry.clip),
        `${glb} additive ${specName} -> "${entry.clip}" not in GLB`,
      );
    }
  }
});

test('additive entries follow spec ALP_ADD_* naming and declare additiveSafe', () => {
  for (const [glb, clipMap] of Object.entries(DEFAULT_CLIP_MAPS)) {
    const names = Object.keys(clipMap.additive);
    assert.ok(names.length > 0, `${glb}: no additive gestures`);
    for (const [specName, entry] of Object.entries(clipMap.additive)) {
      assert.match(specName, /^ALP_ADD_/, `${glb}: ${specName} not ALP_ADD_*`);
      assert.equal(typeof entry.additiveSafe, 'boolean', `${glb}: ${specName} missing additiveSafe`);
    }
  }
});

test('base entries use ALP_LOC_*, ALP_IDLE_*, or ALP_ADD_sit_start per spec', () => {
  for (const [glb, clipMap] of Object.entries(DEFAULT_CLIP_MAPS)) {
    for (const specName of Object.keys(clipMap.base)) {
      assert.ok(
        /^ALP_(LOC|IDLE)_/.test(specName) || specName === 'ALP_ADD_sit_start',
        `${glb}: ${specName} not a spec base-layer name`,
      );
    }
  }
});

test('Xbot sit falls back to idle and is flagged', () => {
  const resolved = resolveBaseClip(DEFAULT_CLIP_MAPS['Xbot.glb'], 'sit');
  assert.equal(resolved.specName, 'ALP_ADD_sit_start');
  assert.equal(resolved.clip, 'idle');
  assert.equal(resolved.fallback, true);
});

test('RobotExpressive maps sit to Sitting', () => {
  const resolved = resolveBaseClip(DEFAULT_CLIP_MAPS['RobotExpressive.glb'], 'sit');
  assert.equal(resolved.specName, 'ALP_ADD_sit_start');
  assert.equal(resolved.clip, 'Sitting');
  assert.equal(resolved.fallback, false);
});

test('resolveClipMap matches by url basename (paths, query strings)', () => {
  assert.equal(resolveClipMap('/assets/models/Xbot.glb'), DEFAULT_CLIP_MAPS['Xbot.glb']);
  assert.equal(
    resolveClipMap('https://host/x/RobotExpressive.glb?v=2'),
    DEFAULT_CLIP_MAPS['RobotExpressive.glb'],
  );
  assert.equal(resolveClipMap('C:\\models\\SK_Alephillo.glb'), DEFAULT_CLIP_MAPS['SK_Alephillo.glb']);
  assert.equal(resolveClipMap('/assets/models/Unknown.glb'), null);
  assert.equal(resolveClipMap(undefined), null);
});

test('resolveBaseClip accepts pose aliases and full spec names', () => {
  const map = DEFAULT_CLIP_MAPS['RobotExpressive.glb'];
  assert.equal(resolveBaseClip(map, 'walk').clip, 'Walking');
  assert.equal(resolveBaseClip(map, 'ALP_LOC_walk').clip, 'Walking');
  assert.equal(resolveBaseClip(map, 'idle').specName, 'ALP_IDLE_breathe');
  assert.equal(resolveBaseClip(map, 'fly'), null);
});

test('resolveAdditiveClip accepts short and spec names, reports poseFrame', () => {
  const xbot = DEFAULT_CLIP_MAPS['Xbot.glb'];
  const pockets = resolveAdditiveClip(xbot, 'hands_pockets');
  assert.equal(pockets.clip, 'sneak_pose');
  assert.equal(pockets.additiveSafe, true);
  assert.equal(pockets.poseFrame, 2);

  const robot = DEFAULT_CLIP_MAPS['RobotExpressive.glb'];
  const wave = resolveAdditiveClip(robot, 'ALP_ADD_wave');
  assert.equal(wave.clip, 'Wave');
  assert.equal(wave.additiveSafe, false, 'RobotExpressive emotes are override clips');
  assert.equal(resolveAdditiveClip(robot, 'nope'), null);
});
