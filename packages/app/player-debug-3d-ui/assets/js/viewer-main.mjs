/**
 * player-debug-3d-ui browser entry (ESM, resolved via the page import map).
 *
 * NON-MAP scene: radial room-traffic visualization. Every known room client
 * sits on a circle around the origin; every observed room event spawns a
 * particle travelling from the emitter marker toward the center, reusing the
 * kit's TrajectoryManager. Demonstrates the kit serving a non-map scene.
 *
 * NOTE: `import 'three'` / `@zeus/ui-3d-kit` resolve in the BROWSER via the
 * import map — `node --check` parses this file without resolving imports.
 */

import * as THREE from 'three';
import {
  createSceneManager,
  createTrajectoryManager
} from '@zeus/ui-3d-kit';
import { createBrowserRoomClient } from '/assets/room-client/room-client.browser.mjs';
import { readInjectedRoomConfig } from '/assets/room-client/dev-room-config.mjs';

const RING_RADIUS = 8;
const CENTER = new THREE.Vector3(0, 0.5, 0);

// Map raw event names → a trajectory channel color bucket.
const EVENT_CHANNEL = {
  PING: 'sys',
  PONG: 'sys',
  HORSE: 'agent',
  'selection:cast': 'game',
  SET_STATE: 'ui',
  ROOM_MESSAGE: 'app'
};

function readViewerConfig() {
  return readInjectedRoomConfig('viewer-config');
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value == null ? '—' : String(value);
}

function main() {
  const cfg = readViewerConfig();
  const container = document.getElementById('viewer-stage');
  const canvas = document.getElementById('viewer-canvas');

  const sceneManager = createSceneManager({
    background: 0x05050a,
    grid: true,
    camera: { fov: 60, near: 0.1, far: 500, position: [0, 14, 18] },
    controls: { minDistance: 4, maxDistance: 120, maxPolarAngle: Math.PI / 2 }
  });
  if (canvas) canvas.style.display = 'none';
  sceneManager.init(container);
  const scene = sceneManager.getScene();

  // Center hub marker.
  const hub = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.8, 1),
    new THREE.MeshBasicMaterial({ color: 0x00ff41, wireframe: true })
  );
  hub.position.copy(CENTER);
  scene.add(hub);

  const trajectories = createTrajectoryManager({ curvature: 3 });
  trajectories.setScene(scene);

  // Known clients → markers placed on a circle.
  const markerGeo = new THREE.SphereGeometry(0.4, 12, 12);
  const clients = new Map(); // clientId -> { mesh, position }
  let eventCount = 0;

  function markerColorFor(index) {
    const hue = (index * 0.137) % 1;
    return new THREE.Color().setHSL(hue, 0.7, 0.55);
  }

  function ensureClient(clientId) {
    if (clients.has(clientId)) return clients.get(clientId);
    const index = clients.size;
    const angle = (index / Math.max(1, index + 1)) * Math.PI * 2;
    // Re-layout all markers evenly once we know the new count.
    const mesh = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: markerColorFor(index) }));
    const entry = { mesh, position: new THREE.Vector3(), angle };
    scene.add(mesh);
    clients.set(clientId, entry);
    relayoutClients();
    setText('hud-clients', clients.size);
    return entry;
  }

  function relayoutClients() {
    const n = clients.size;
    let i = 0;
    for (const entry of clients.values()) {
      const angle = (i / n) * Math.PI * 2;
      entry.position.set(Math.cos(angle) * RING_RADIUS, 0.5, Math.sin(angle) * RING_RADIUS);
      entry.mesh.position.copy(entry.position);
      i += 1;
    }
  }

  function spawnTraffic(clientId, event) {
    const entry = ensureClient(clientId);
    const channel = EVENT_CHANNEL[event] || 'app';
    eventCount += 1;
    setText('hud-events', eventCount);
    trajectories.createMessageParticle(
      `${clientId}:${event}:${eventCount}`,
      entry.position,
      CENTER,
      channel,
      0.8
    );
  }

  sceneManager.onBeforeRender((dt) => {
    trajectories.updateParticles(dt);
    hub.rotation.y += dt * 0.4;
  });
  sceneManager.startRenderLoop();

  // Room wiring.
  const room = createBrowserRoomClient(cfg);
  let heartbeat = 0;

  function emitterOf(payload, fallback) {
    if (payload && typeof payload === 'object') {
      return payload.usuario || payload.user || payload.from || payload.clientId || fallback;
    }
    return fallback;
  }

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
  for (const event of ['PING', 'PONG', 'HORSE', 'selection:cast']) {
    room.onRoomEvent(event, (payload) => spawnTraffic(emitterOf(payload, event), event));
  }
  room.onAny((event, payload) => {
    if (event === 'SET_STATE') return; // handled by onState
    if (['PING', 'PONG', 'HORSE', 'selection:cast'].includes(event)) return; // handled above
    spawnTraffic(emitterOf(payload, 'peer'), event);
  });

  room.connect()
    .then(() => setText('hud-conn', 'connected'))
    .catch((err) => {
      console.warn('[debug-viewer] room connect failed:', err);
      setText('hud-conn', 'offline');
    });

  window.addEventListener('beforeunload', () => {
    room.disconnect();
    trajectories.dispose();
    sceneManager.dispose();
  });
}

main();
