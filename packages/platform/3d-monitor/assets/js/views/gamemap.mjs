/**
 * View "gamemap" — live board for `npm run demo:game`.
 *
 * Renders the ACTUAL game the demo plays, not an abstraction of its traffic:
 * the vaivén-dos-nodos stage (node platforms, link corridor, sit anchors)
 * built with the ui-3d-kit stage pieces, and the robot actor as a GLB puppet
 * driven by the authority's GAME_STATE snapshots (tier-0 viewer, like the
 * `watch` role — this view never runs its own engine, L-session M2/M3).
 *
 * Flow it visualizes:
 *   walk-demo  → GAME_INTENT {walk, linkId, direction}  → intent GHOST pulse
 *                                                          runs ahead along
 *                                                          the corridor
 *   map-authority → GAME_STATE {tick, actors, anchors}  → puppet pose/position
 *                                                          (+ dead-reckoning
 *                                                          between updates)
 *
 * Extra readability: node/link/anchor name labels, occupancy glow on anchors,
 * a fading motion trail while the actor walks, and a HUD with tick/pose/
 * progress and intent/state counters.
 */

import * as THREE from 'three';
import {
  createNodeMesh,
  createAnchorMarker,
  createLinkCorridorBetween,
  createMapSceneAdapter,
  loadPuppet,
  sampleLink,
  linkDistance,
  vaivenDosNodos
} from '@zeus/ui-3d-kit';
import {
  createViewerScene,
  setText,
  createCounters,
  readViewerConfig,
  connectRoom,
  createLabelSprite,
  createGlowSprite,
  onChannelEvent
} from '../kit/index.mjs';

const SCENE = vaivenDosNodos;
const PUPPET_URL = '/models/SK_Alephillo.glb';
const CYAN = '#00d4ff';
const GREEN = '#00ff41';

/** Center of the stage in engine coords (to recenter under the camera). */
function stageCenter() {
  const xs = Object.values(SCENE.nodos).map((n) => n.entrada.x);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, z: 0 };
}

/** Minimal procedural puppet used when the GLB cannot load. */
function fallbackPuppet() {
  const object = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 0.7, 4, 12),
    new THREE.MeshStandardMaterial({ color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 0.3 })
  );
  body.position.y = 0.9;
  object.add(body);
  let pose = 'idle';
  let bob = 0;
  return {
    object,
    setPosition(p) { object.position.set(p.x, p.y, p.z); },
    setHeading(rad) { object.rotation.y = rad; },
    setBase(next) { pose = next; body.scale.y = next === 'sit' ? 0.6 : 1; },
    update(dt) {
      if (pose === 'walk') {
        bob += dt * 10;
        body.position.y = 0.9 + Math.sin(bob) * 0.08;
      }
    },
    dispose() {}
  };
}

function main() {
  const cfg = readViewerConfig();
  setText('hud-room', cfg.room);
  setText('hud-scene', SCENE.displayName ?? SCENE.id);

  const stage = createViewerScene({
    camera: { position: [10, 9, 16] },
    controls: { minDistance: 4, maxDistance: 90, maxPolarAngle: Math.PI / 2.05 }
  });
  const { scene } = stage;

  // All stage/puppet content lives in a group recentered on the map so the
  // orbit pivot (origin) matches the middle of the corridor.
  const center = stageCenter();
  const stageGroup = new THREE.Group();
  stageGroup.position.set(-center.x, 0, -center.z);
  scene.add(stageGroup);

  const counters = createCounters({ intents: 'hud-intents', states: 'hud-states' });

  function logLine(text) {
    setText('hud-game-log', text);
  }

  // ---- static stage from the scene definition -------------------------------
  for (const nodo of Object.values(SCENE.nodos)) {
    const mesh = createNodeMesh({ name: nodo.id, radius: 3 });
    mesh.position.set(nodo.entrada.x, nodo.entrada.y, nodo.entrada.z);
    stageGroup.add(mesh);
    const label = createLabelSprite(`⬢ ${nodo.displayName ?? nodo.id}`, { color: CYAN, size: 4 });
    label.position.set(nodo.entrada.x, 3.4, nodo.entrada.z);
    stageGroup.add(label);
  }

  for (const enlace of Object.values(SCENE.enlaces)) {
    const wp = enlace.waypoints;
    stageGroup.add(createLinkCorridorBetween(wp[0], wp[wp.length - 1], { width: 2 }));
    const mid = sampleLink(wp, 0.5);
    const label = createLabelSprite(`⇄ ${enlace.displayName ?? enlace.id}`, { color: GREEN, size: 3.4 });
    label.position.set(mid.x, 2.6, mid.z);
    stageGroup.add(label);
  }

  const anchorGlows = new Map(); // anchorId -> glow sprite (visible when occupied)
  for (const ancla of Object.values(SCENE.anclas)) {
    stageGroup.add(createAnchorMarker({ name: ancla.id, position: ancla.position, facing: ancla.facing }));
    const glow = createGlowSprite(GREEN, { size: 1.6, opacity: 0.7 });
    glow.position.set(ancla.position.x, 0.5, ancla.position.z);
    glow.visible = false;
    stageGroup.add(glow);
    anchorGlows.set(ancla.id, glow);
  }

  // ---- actors: GLB puppets driven by the authority snapshot ------------------
  const adapter = createMapSceneAdapter({
    scene: SCENE,
    root: stageGroup,
    puppetFactory: async (id) => {
      try {
        return await loadPuppet(PUPPET_URL, { scale: 1 });
      } catch (err) {
        console.warn(`[gamemap] GLB puppet failed for ${id}, using fallback:`, err.message);
        return fallbackPuppet();
      }
    }
  });

  const spawning = new Set();
  let primaryActorId = null;

  async function ensurePuppet(actor) {
    if (adapter.getPuppet(actor.id) || spawning.has(actor.id)) return;
    spawning.add(actor.id);
    try {
      const puppet = await adapter.spawnActor(actor.id);
      const tag = createLabelSprite(`🤖 ${actor.id}`, { color: CYAN, size: 3 });
      tag.position.y = 2.3;
      puppet.object?.add?.(tag);
    } finally {
      spawning.delete(actor.id);
    }
    if (!primaryActorId) primaryActorId = actor.id;
  }

  // ---- live state (authority) + dead reckoning between snapshots -------------
  let working = null; // latest GAME_STATE, locally advanced while walking

  function reflectPrimary() {
    const actor = working?.actors?.[primaryActorId];
    setText('hud-tick', working?.tick);
    setText('hud-actor', primaryActorId);
    if (!actor) return;
    setText('hud-pose', actor.pose);
    setText('hud-zone', actor.zone ?? '—');
    setText('hud-progress',
      actor.pose === 'walk' && actor.progress != null
        ? `${Math.round(actor.progress * 100)}% ${actor.linkId ?? ''}`
        : (actor.anchorId ? `@${actor.anchorId}` : '—'));
  }

  function onGameState(payload) {
    if (!payload?.actors) return;
    working = payload;
    counters.bump('states');
    setText('hud-reason', payload.reason ?? 'change');
    for (const actor of Object.values(payload.actors)) ensurePuppet(actor);
    for (const [anchorId, glow] of anchorGlows) {
      glow.visible = Boolean(payload.anchors?.[anchorId]?.occupiedBy);
    }
    reflectPrimary();
  }

  // ---- intent ghosts: the command races ahead along the corridor -------------
  const ghosts = [];

  function onGameIntent(payload) {
    counters.bump('intents');
    const who = payload?.from ?? '?';
    const intent = payload?.intent ?? '?';
    logLine(`🎮 ${who} → ${intent} ${payload?.linkId ?? payload?.anchorId ?? ''} ${payload?.direction ?? ''}`.trim());
    if (intent !== 'walk' || !payload?.linkId) return;
    const enlace = SCENE.enlaces[payload.linkId];
    if (!enlace) return;
    const sprite = createGlowSprite(CYAN, { size: 1.1 });
    stageGroup.add(sprite);
    ghosts.push({
      sprite,
      waypoints: enlace.waypoints,
      reverse: payload.direction === 'b-to-a',
      t: 0,
      dur: 1.1
    });
  }

  // ---- walk trail -------------------------------------------------------------
  const trail = [];
  let trailTimer = 0;

  function dropTrail(pos) {
    const sprite = createGlowSprite(GREEN, { size: 0.7, opacity: 0.7 });
    sprite.position.set(pos.x, pos.y + 0.4, pos.z);
    stageGroup.add(sprite);
    trail.push({ sprite, ttl: 0.9 });
  }

  // ---- frame loop ----------------------------------------------------------------
  stage.onFrame((rawDt) => {
    const dt = Math.min(rawDt, 0.1); // hidden-tab resume guard

    // Dead reckoning: advance walking actors between authority updates so the
    // 10 Hz snapshots read as continuous motion at render rate.
    if (working?.actors) {
      trailTimer += dt;
      for (const actor of Object.values(working.actors)) {
        if (actor.pose === 'walk' && actor.linkId && actor.progress != null) {
          const enlace = SCENE.enlaces[actor.linkId];
          if (enlace) {
            const dist = linkDistance(enlace.waypoints) || 1;
            const speed = enlace.walkSpeed ?? 1.2;
            actor.progress = Math.min(1, actor.progress + (dt * speed) / dist);
            if (trailTimer >= 0.12) {
              dropTrail(sampleLink(enlace.waypoints, actor.progress));
            }
          }
        }
      }
      if (trailTimer >= 0.12) trailTimer = 0;
      adapter.applySnapshot(working);
      reflectPrimary();
    }
    adapter.update(dt);

    for (let i = ghosts.length - 1; i >= 0; i -= 1) {
      const g = ghosts[i];
      g.t += dt;
      const k = Math.min(1, g.t / g.dur);
      const p = sampleLink(g.waypoints, g.reverse ? 1 - k : k);
      g.sprite.position.set(p.x, p.y + 0.7, p.z);
      g.sprite.material.opacity = 0.9 * (1 - k * 0.5);
      if (g.t >= g.dur) {
        stageGroup.remove(g.sprite);
        ghosts.splice(i, 1);
      }
    }

    for (let i = trail.length - 1; i >= 0; i -= 1) {
      const t = trail[i];
      t.ttl -= dt;
      if (t.ttl <= 0) {
        stageGroup.remove(t.sprite);
        trail.splice(i, 1);
        continue;
      }
      t.sprite.material.opacity = 0.7 * (t.ttl / 0.9);
      t.sprite.scale.setScalar(0.7 * (0.6 + t.ttl / 0.9));
    }
  });
  stage.start();

  // ---- room wiring ------------------------------------------------------------------
  // GAME_* events are bound through onChannelEvent, which listens BOTH to the
  // unwrapped per-room broadcast (current socket-server) and to the global
  // ROOM_MESSAGE envelope relay (older servers / demo playing in another
  // room), deduping when both arrive.
  const room = connectRoom(cfg);
  setText('hud-conn', '…');

  let lastStateAt = 0;
  let announcedSourceRoom = false;

  function trackSource(meta) {
    lastStateAt = performance.now();
    if (!announcedSourceRoom && meta.via === 'envelope' && meta.room && meta.room !== cfg.room) {
      announcedSourceRoom = true;
      setText('hud-room', `${cfg.room} (fuente: ${meta.room})`);
    }
  }

  onChannelEvent(room, 'GAME_STATE', (payload, meta) => {
    trackSource(meta);
    onGameState(payload);
  });
  onChannelEvent(room, 'GAME_INTENT', (payload, meta) => {
    trackSource(meta);
    onGameIntent(payload);
  });

  // Watchdog: silence is a message too — say what we are waiting for.
  const watchdog = setInterval(() => {
    if (working || (lastStateAt && performance.now() - lastStateAt < 6000)) return;
    logLine(`⏳ sin GAME_STATE en ${cfg.room} — ¿corre npm run demo:game? (su room = ZEUS_SCRIPTORIUM_ROOM, por defecto PUBLIC_ROOM; usa ?room= aquí para cambiar)`);
  }, 6000);

  window.addEventListener('beforeunload', () => {
    clearInterval(watchdog);
    room.disconnect();
    adapter.dispose();
    stage.dispose();
  });
}

main();
