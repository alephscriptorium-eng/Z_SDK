/**
 * View "default" — the original radial room-traffic scene, rebuilt on the
 * view kit. Every known room client sits on a circle around the origin;
 * every observed room event spawns a particle travelling from the emitter
 * marker toward the center via the ui-3d-kit TrajectoryManager.
 *
 * Business logic here; reusable elements (stage, HUD, ring, markers, room
 * wiring, channel classification) come from ../kit/.
 */

import * as THREE from 'three';
import { createTrajectoryManager } from '@zeus/ui-3d-kit';
import {
  createViewerScene,
  setText,
  readViewerConfig,
  connectRoom,
  channelFor,
  emitterOf,
  createRingLayout,
  createHub,
  createMarker,
  colorForIndex
} from '../kit/index.mjs';

const CENTER = new THREE.Vector3(0, 0.5, 0);

function main() {
  const cfg = readViewerConfig();
  setText('hud-room', cfg.room);

  const stage = createViewerScene();
  const { scene } = stage;

  const hub = createHub(scene, { position: CENTER });

  const trajectories = createTrajectoryManager({ curvature: 3 });
  trajectories.setScene(scene);

  const ring = createRingLayout({ radius: 8, y: 0.5 });
  const clients = new Map(); // clientId -> { mesh, position }
  let eventCount = 0;

  function ensureClient(clientId) {
    if (clients.has(clientId)) return clients.get(clientId);
    const mesh = createMarker(scene, { shape: 'sphere', color: colorForIndex(clients.size) });
    const entry = { mesh, position: new THREE.Vector3() };
    clients.set(clientId, entry);
    ring.layout(clients.values());
    setText('hud-clients', clients.size);
    return entry;
  }

  function spawnTraffic(clientId, event) {
    const entry = ensureClient(clientId);
    eventCount += 1;
    setText('hud-events', eventCount);
    trajectories.createMessageParticle(
      `${clientId}:${event}:${eventCount}`,
      entry.position,
      CENTER,
      channelFor(event),
      0.8
    );
  }

  stage.onFrame((dt) => {
    trajectories.updateParticles(dt);
    hub.rotation.y += dt * 0.4;
  });
  stage.start();

  // Room wiring.
  const room = connectRoom(cfg);
  setText('hud-conn', '…');
  let heartbeat = 0;

  room.onState((snapshot, envelope) => {
    setText('hud-conn', 'live');
    heartbeat += 1;
    setText('hud-heartbeat', heartbeat);
    setText('hud-seq', envelope?.seq ?? snapshot.seq);
    const phase = snapshot.sessionMachine?.phase
      ?? snapshot.phase
      ?? snapshot.machine?.state
      ?? snapshot.state;
    setText('hud-phase', phase);
    const selLog = snapshot.selections?.log ?? snapshot.selection?.log;
    if (selLog) {
      const last = Array.isArray(selLog) ? selLog[selLog.length - 1] : selLog;
      const el = document.getElementById('hud-selection-log');
      if (el) el.textContent = typeof last === 'string' ? last : JSON.stringify(last);
    }
    // The master itself is a traffic emitter.
    spawnTraffic('master', 'SET_STATE');
  });

  // Raw traffic → particles. Bind known channel events and a catch-all.
  const BOUND = ['PING', 'PONG', 'HORSE', 'selection:cast'];
  for (const event of BOUND) {
    room.onRoomEvent(event, (payload) => spawnTraffic(emitterOf(payload, event), event));
  }
  room.onAny((event, payload) => {
    if (event === 'SET_STATE') return; // handled by onState
    if (BOUND.includes(event)) return; // handled above
    spawnTraffic(emitterOf(payload, 'peer'), event);
  });

  window.addEventListener('beforeunload', () => {
    room.disconnect();
    trajectories.dispose();
    stage.dispose();
  });
}

main();
