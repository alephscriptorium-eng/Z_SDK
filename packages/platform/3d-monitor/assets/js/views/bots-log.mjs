/**
 * View "bots-log" — visual log of `npm run demo:bots` by role.
 *
 * - One 3D column per role (ping, pong, rabbit, spider, horse, master,
 *   other) in a row; each column grows with its event count and pulses on
 *   activity, with a particle to the hub.
 * - A DOM log panel narrates every event with role colors and a payload
 *   summary (PING expr, PONG answer, RABBIT peers, SPIDER intent, casts…).
 */

import * as THREE from 'three';
import { createTrajectoryManager } from '@zeus/ui-3d-kit';
import {
  createViewerScene,
  setText,
  createCounters,
  readViewerConfig,
  connectRoom,
  channelFor,
  emitterOf,
  classifyRole,
  roleStyle,
  KNOWN_ROLES,
  createHub,
  createLogPanel
} from '../kit/index.mjs';

const HUB_POS = new THREE.Vector3(0, 6, -6);
const LANE_SPACING = 3.2;
const MAX_BAR_HEIGHT = 10;
const HEIGHT_PER_EVENT = 0.25;

/** One-line human summary of a bot payload for the DOM log. */
function summarize(event, payload) {
  const p = payload && typeof payload === 'object' ? payload : {};
  switch (event) {
    case 'PING':
      return `#${p.n ?? '?'} · ${p.expr ?? '?'}`;
    case 'PONG':
      return p.error
        ? `#${p.n ?? '?'} · error: ${p.error}`
        : `#${p.n ?? '?'} · ${p.expr ?? '?'} = ${p.answer ?? '?'}`;
    case 'RABBIT':
      return `beacon · peers=${Array.isArray(p.peers) ? p.peers.length : 0}`;
    case 'SPIDER':
      return p.intent ? `intent=${p.intent}` : 'channel traffic';
    case 'HORSE':
      return p.intent || p.tool || 'preset hub';
    case 'selection:cast':
      return `cast → ${p.targetId ?? p.data?.targetId ?? '?'} (${p.label ?? p.data?.label ?? 'sin label'})`;
    case 'SET_STATE':
      return `snapshot seq=${p.seq ?? '?'}`;
    default: {
      const keys = Object.keys(p);
      return keys.length ? `{${keys.slice(0, 4).join(', ')}}` : '';
    }
  }
}

function main() {
  const cfg = readViewerConfig();
  setText('hud-room', cfg.room);

  const stage = createViewerScene({ camera: { position: [0, 12, 20] } });
  const { scene } = stage;

  const hub = createHub(scene, { position: HUB_POS });

  const trajectories = createTrajectoryManager({ curvature: 2 });
  trajectories.setScene(scene);

  const log = createLogPanel('view-log', { max: 250 });
  const counters = createCounters(
    Object.fromEntries(KNOWN_ROLES.map((role) => [role, `hud-${role}`]))
  );

  // One column (lane) per role, in a row facing the camera.
  const lanes = new Map(); // role -> { mesh, base, pulse }
  KNOWN_ROLES.forEach((role, i) => {
    const style = roleStyle(role);
    const x = (i - (KNOWN_ROLES.length - 1) / 2) * LANE_SPACING;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1, 1.6),
      new THREE.MeshBasicMaterial({ color: style.color, transparent: true, opacity: 0.75 })
    );
    // Grow upward: keep the base on the floor, scale on Y.
    mesh.position.set(x, 0.5, 4);
    scene.add(mesh);
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.15, 2),
      new THREE.MeshBasicMaterial({ color: style.color })
    );
    pedestal.position.set(x, 0.07, 4);
    scene.add(pedestal);
    lanes.set(role, { mesh, base: new THREE.Vector3(x, 0.5, 4), pulse: 0 });
  });

  let particleSeq = 0;

  function record(event, payload) {
    const role = classifyRole(event, payload);
    const style = roleStyle(role);
    const lane = lanes.get(role) ?? lanes.get('other');
    const count = counters.bump(role);

    // Column height ~ activity (capped), plus a short pulse flash.
    const height = Math.min(MAX_BAR_HEIGHT, 1 + count * HEIGHT_PER_EVENT);
    lane.mesh.scale.y = height;
    lane.mesh.position.y = height / 2;
    lane.pulse = 1;

    particleSeq += 1;
    const top = lane.base.clone();
    top.y = height;
    trajectories.createMessageParticle(
      `${role}:${event}:${particleSeq}`,
      top,
      HUB_POS,
      channelFor(event),
      0.7
    );

    const who = emitterOf(payload, role);
    log.append({
      badge: `${style.emoji} ${who}`,
      color: style.css,
      text: `${event} · ${summarize(event, payload)}`
    });
  }

  stage.onFrame((dt) => {
    trajectories.updateParticles(dt);
    hub.rotation.y += dt * 0.4;
    for (const lane of lanes.values()) {
      if (lane.pulse > 0) {
        lane.pulse = Math.max(0, lane.pulse - dt * 2);
        lane.mesh.material.opacity = 0.75 + lane.pulse * 0.25;
      }
    }
  });
  stage.start();

  // Room wiring: everything goes through the same recorder.
  const room = connectRoom(cfg);
  setText('hud-conn', '…');

  room.onState((snapshot, envelope) => {
    setText('hud-conn', 'live');
    record('SET_STATE', { seq: envelope?.seq ?? snapshot.seq, usuario: 'master' });
  });

  room.onAny((event, payload) => {
    // SET_STATE is handled by onState; the runtime re-broadcasts the same
    // snapshot as `session:state`, so skip both to avoid double entries.
    if (event === 'SET_STATE' || event === 'session:state') return;
    record(event, payload);
  });

  window.addEventListener('beforeunload', () => {
    room.disconnect();
    trajectories.dispose();
    stage.dispose();
  });
}

main();
