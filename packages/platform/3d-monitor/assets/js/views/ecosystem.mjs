/**
 * View "ecosystem" — the demo:bots fauna as first-class citizens.
 *
 * - Rabbits (🐰 RABBIT beacons), spiders (🕷️ SPIDER/RNFP) and horses
 *   (🐴 HORSE preset hub) get role-shaped, role-colored markers on the ring.
 * - Federated channels (spider RNFP invites/accepts) are drawn as persistent
 *   arcs between the two peers, with pulses travelling along them.
 * - The black hole: unclassified traffic falls into it instead of reaching
 *   the hub, and peers that go silent drift toward it until swallowed.
 */

import * as THREE from 'three';
import { createTrajectoryManager } from '@zeus/ui-3d-kit';
import {
  createViewerScene,
  setText,
  createCounters,
  readViewerConfig,
  connectRoom
} from '@zeus/view-kit';
import {
  channelFor,
  emitterOf,
  classifyRole,
  roleStyle,
  createRingLayout,
  createHub,
  createMarker,
  createBlackHole
} from '../monitor/index.mjs';

const CENTER = new THREE.Vector3(0, 0.5, 0);
const BLACK_HOLE_POS = new THREE.Vector3(0, 2.5, -16);
const SILENCE_MS = 45_000;   // silent peers start drifting into the black hole
const DRIFT_SPEED = 1.2;     // units/s while drifting
const SWALLOW_DIST = 1.6;

const ROLE_SHAPES = {
  rabbit: 'sphere',
  spider: 'octahedron',
  horse: 'box',
  ping: 'cone',
  pong: 'cone',
  master: 'icosahedron',
  other: 'sphere'
};

function main() {
  const cfg = readViewerConfig();
  setText('hud-room', cfg.room);

  const stage = createViewerScene({ camera: { position: [0, 16, 22] } });
  const { scene } = stage;

  const hub = createHub(scene, { position: CENTER });
  const blackHole = createBlackHole(scene, { position: BLACK_HOLE_POS, radius: 1.4 });

  const trajectories = createTrajectoryManager({ curvature: 3 });
  trajectories.setScene(scene);

  const ring = createRingLayout({ radius: 9, y: 0.5 });
  const counters = createCounters({
    rabbits: 'hud-rabbits',
    spiders: 'hud-spiders',
    horses: 'hud-horses',
    channels: 'hud-channels',
    swallowed: 'hud-swallowed',
    events: 'hud-events'
  });

  // ---- actors -------------------------------------------------------------
  const actors = new Map(); // actorId -> { mesh, position, role, lastSeen, drifting }
  let particleSeq = 0;

  function roleCounterKey(role) {
    return { rabbit: 'rabbits', spider: 'spiders', horse: 'horses' }[role] ?? null;
  }

  function relayout() {
    ring.layout([...actors.values()].filter((actor) => !actor.drifting));
  }

  function ensureActor(actorId, role) {
    let actor = actors.get(actorId);
    if (actor) {
      actor.lastSeen = performance.now();
      if (actor.drifting) {
        // It spoke again: rescue it from the black hole's pull.
        actor.drifting = false;
        relayout();
      }
      return actor;
    }
    const style = roleStyle(role);
    const mesh = createMarker(scene, { shape: ROLE_SHAPES[role] || 'sphere', color: style.color });
    actor = { mesh, position: new THREE.Vector3(), role, lastSeen: performance.now(), drifting: false };
    actors.set(actorId, actor);
    relayout();
    const key = roleCounterKey(role);
    if (key) counters.bump(key);
    return actor;
  }

  // ---- federated channels (spider RNFP) -----------------------------------
  const channels = new Map(); // "a|b" -> { line, curve, a, b, pulseAt }

  function channelKey(a, b) {
    return [a, b].sort().join('|');
  }

  function arcBetween(a, b) {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y += a.distanceTo(b) * 0.35 + 1.5;
    return new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
  }

  function ensureChannel(fromId, toId) {
    const key = channelKey(fromId, toId);
    if (channels.has(key)) return channels.get(key);
    const a = ensureActor(fromId, classifyRole('', { from: fromId }));
    const b = ensureActor(toId, classifyRole('', { from: toId }));
    const curve = arcBetween(a.position, b.position);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color: roleStyle('spider').color, transparent: true, opacity: 0.7 })
    );
    scene.add(line);
    const channel = { line, curve, a: fromId, b: toId, pulseAt: 0 };
    channels.set(key, channel);
    counters.bump('channels');
    setText('hud-channel-log', `${fromId} ⇄ ${toId}`);
    return channel;
  }

  function refreshChannelGeometry(channel) {
    const a = actors.get(channel.a);
    const b = actors.get(channel.b);
    if (!a || !b) return;
    channel.curve = arcBetween(a.position, b.position);
    channel.line.geometry.setFromPoints(channel.curve.getPoints(40));
  }

  // ---- traffic ------------------------------------------------------------
  function spawnTraffic(actorId, event, payload) {
    const role = classifyRole(event, payload);
    const actor = ensureActor(actorId, role);
    counters.bump('events');
    particleSeq += 1;
    const known = role !== 'other';
    // Unclassified traffic feeds the black hole; known fauna reports to the hub.
    trajectories.createMessageParticle(
      `${actorId}:${event}:${particleSeq}`,
      actor.position,
      known ? CENTER : blackHole.position,
      known ? channelFor(event) : 'app',
      known ? 0.8 : 1.4
    );
    if (!known) counters.bump('swallowed');
  }

  // ---- frame loop ----------------------------------------------------------
  stage.onFrame((dt) => {
    trajectories.updateParticles(dt);
    hub.rotation.y += dt * 0.4;
    blackHole.update(dt);

    const now = performance.now();
    for (const [actorId, actor] of actors) {
      if (actor.role === 'master') continue;
      if (!actor.drifting && now - actor.lastSeen > SILENCE_MS) {
        actor.drifting = true;
      }
      if (actor.drifting) {
        const toHole = blackHole.position.clone().sub(actor.position);
        const dist = toHole.length();
        if (dist < SWALLOW_DIST) {
          scene.remove(actor.mesh);
          actors.delete(actorId);
          const key = roleCounterKey(actor.role);
          if (key) counters.bump(key, -1);
          counters.bump('swallowed');
          relayout();
          for (const channel of channels.values()) refreshChannelGeometry(channel);
          continue;
        }
        actor.position.add(toHole.normalize().multiplyScalar(DRIFT_SPEED * dt));
        actor.mesh.position.copy(actor.position);
        actor.mesh.rotation.y += dt * 4; // spiral tumble on the way in
      }
    }

    // Periodic pulses along every open federated channel.
    for (const channel of channels.values()) {
      channel.pulseAt -= dt;
      if (channel.pulseAt <= 0) {
        channel.pulseAt = 2.5;
        const a = actors.get(channel.a);
        const b = actors.get(channel.b);
        if (a && b) {
          particleSeq += 1;
          trajectories.createMessageParticle(
            `chan:${channel.a}:${channel.b}:${particleSeq}`,
            a.position,
            b.position,
            'agent',
            1.2
          );
        }
      }
    }
  });
  stage.start();

  // ---- room wiring ----------------------------------------------------------
  const room = connectRoom(cfg);
  setText('hud-conn', '…');

  room.onState(() => {
    setText('hud-conn', 'live');
    ensureActor('master', 'master');
  });

  room.onRoomEvent('RABBIT', (payload) => {
    spawnTraffic(emitterOf(payload, 'rabbit'), 'RABBIT', payload);
  });

  room.onRoomEvent('SPIDER', (payload) => {
    const from = emitterOf(payload, 'spider');
    spawnTraffic(from, 'SPIDER', payload);
    // RNFP handshake → federated channel arc between the two peers.
    const peer = payload?.to || payload?.peerId || payload?.target;
    if (peer && peer !== from) ensureChannel(from, peer);
  });

  room.onRoomEvent('HORSE', (payload) => {
    spawnTraffic(emitterOf(payload, 'horse'), 'HORSE', payload);
  });

  room.onAny((event, payload) => {
    // SET_STATE (and its `session:state` re-broadcast) is handled by onState.
    if (event === 'SET_STATE' || event === 'session:state') return;
    if (['RABBIT', 'SPIDER', 'HORSE'].includes(event)) return; // handled above
    spawnTraffic(emitterOf(payload, 'peer'), event, payload);
  });

  window.addEventListener('beforeunload', () => {
    room.disconnect();
    trajectories.dispose();
    stage.dispose();
  });
}

main();
