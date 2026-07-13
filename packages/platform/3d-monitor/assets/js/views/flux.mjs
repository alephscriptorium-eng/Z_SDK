/**
 * View "flux" — orbital client station. Leaves the "shape shoots ball at
 * center" grammar behind:
 *
 * - Every client is a labeled station node (name sprite + role halo), placed
 *   DETERMINISTICALLY from its identity (hash → bearing/height) on an orbit
 *   chosen by its role class (masters inner, service bots mid, clients outer),
 *   so the same actor always appears in the same place across reloads.
 * - Traffic runs through PIPES (persistent tubes) between correspondents:
 *   PING↔PONG exchanges, rabbit discovery mesh (payload.peers), spider RNFP
 *   federated channels, selection:cast toward the master, HORSE JSON-RPC.
 *   Pulses flow inside the tube; the tube itself shows who talks to whom.
 * - The black hole is not a prop: it FORMS from the announce buffer. Every
 *   RABBIT beacon adds a mote to an accretion swirl; past a threshold the
 *   buffer collapses into a hole whose mass tracks the excess, and an active
 *   hole consumes its own buffer until it evaporates.
 * - Horses finally exist: a HORSE preset offer turns the node into a forge
 *   with one orbiting tool-satellite per offered tool (labeled); tools/call
 *   requests flash the matching satellite.
 */

import * as THREE from 'three';
import {
  createViewerScene,
  setText,
  createCounters,
  readViewerConfig,
  connectRoom,
  emitterOf,
  classifyRole,
  roleStyle,
  createLabelSprite,
  createGlowSprite,
  createPipeNetwork
} from '../kit/index.mjs';

const CENTER = new THREE.Vector3(0, 2.4, 0);
const ORBIT_BY_ROLE = { master: 4.5, spider: 8.5, horse: 8.5, ping: 12.5, pong: 12.5, rabbit: 12.5, other: 10.5 };
const SILENCE_MS = 30_000;

// Announce buffer → black hole formation.
const MOTE_TTL = 25;          // seconds an announce survives in the buffer
const FORM_THRESHOLD = 8;     // motes needed for the buffer to collapse
const CONSUME_INTERVAL = 0.9; // an active hole eats one mote this often
const MAX_MOTES = 48;         // hard cap: TTL decay runs on rAF, which pauses
                              // in hidden tabs while announces keep arriving

const ROLE_SHAPES = {
  rabbit: () => new THREE.SphereGeometry(0.45, 16, 16),
  spider: () => new THREE.OctahedronGeometry(0.55),
  horse: () => new THREE.CylinderGeometry(0.4, 0.55, 0.9, 8),
  ping: () => new THREE.ConeGeometry(0.42, 0.95, 12),
  pong: () => new THREE.ConeGeometry(0.42, 0.95, 12),
  master: () => new THREE.IcosahedronGeometry(0.7, 1),
  other: () => new THREE.SphereGeometry(0.35, 10, 10)
};

function hashId(id) {
  let h = 5381;
  for (let i = 0; i < id.length; i += 1) h = ((h << 5) + h + id.charCodeAt(i)) >>> 0;
  return h;
}

function main() {
  const cfg = readViewerConfig();
  setText('hud-room', cfg.room);

  const stage = createViewerScene({
    camera: { position: [0, 15, 24], far: 600 },
    controls: { minDistance: 6, maxDistance: 140, maxPolarAngle: Math.PI / 2.05 }
  });
  const { scene } = stage;

  const pipes = createPipeNetwork(scene);
  const counters = createCounters({
    clients: 'hud-clients',
    pipes: 'hud-pipes',
    buffer: 'hud-buffer',
    horses: 'hud-horses',
    tools: 'hud-tools',
    events: 'hud-events'
  });

  function logLine(text) {
    setText('hud-flux-log', text);
  }

  // ---- station nodes --------------------------------------------------------
  const nodes = new Map(); // id -> node

  function placeFor(id, role) {
    const h = hashId(id);
    const angle = ((h % 3600) / 3600) * Math.PI * 2;
    const radius = ORBIT_BY_ROLE[role] ?? ORBIT_BY_ROLE.other;
    const y = role === 'master' ? 3.2 : 0.9 + (((h >>> 8) % 100) / 100) * 2.6;
    return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  }

  function ensureNode(id, roleHint) {
    let node = nodes.get(id);
    if (node) {
      node.lastSeen = performance.now();
      return node;
    }
    const role = roleHint ?? classifyRole('', { from: id });
    const style = roleStyle(role);
    const position = placeFor(id, role);

    const group = new THREE.Group();
    group.position.copy(position);

    const core = new THREE.Mesh(ROLE_SHAPES[role](), new THREE.MeshStandardMaterial({
      color: style.color,
      emissive: style.color,
      emissiveIntensity: 0.25,
      roughness: 0.35,
      metalness: 0.5,
      transparent: true
    }));
    const halo = createGlowSprite(style.css, { size: 2.2, opacity: 0.35 });
    const label = createLabelSprite(`${style.emoji} ${id}`, { color: style.css });
    label.position.y = 1.3;
    group.add(core, halo, label);
    scene.add(group);

    node = {
      id,
      role,
      group,
      core,
      halo,
      label,
      position,
      lastSeen: performance.now(),
      pulse: 0,
      spin: 0.2 + ((hashId(id) >>> 4) % 10) / 12,
      discoveryRing: null, // rabbits: halo torus scaled by known peers
      satellites: []       // horses: orbiting tool satellites
    };
    nodes.set(id, node);
    counters.bump('clients');
    return node;
  }

  function excite(node) {
    node.lastSeen = performance.now();
    node.pulse = 1;
  }

  /** Rabbits announce their peer set — the discovery ring grows with it. */
  function setDiscoveryRing(node, peerCount) {
    if (!peerCount) return;
    const radius = 0.8 + Math.min(peerCount, 8) * 0.12;
    if (node.discoveryRing) {
      node.group.remove(node.discoveryRing);
      node.discoveryRing.geometry.dispose();
      node.discoveryRing.material.dispose();
    }
    node.discoveryRing = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.03, 8, 40),
      new THREE.MeshStandardMaterial({
        color: roleStyle('rabbit').color,
        emissive: roleStyle('rabbit').color,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.7
      })
    );
    node.discoveryRing.rotation.x = Math.PI / 2;
    node.group.add(node.discoveryRing);
  }

  /** HORSE offer → forge: one orbiting labeled satellite per offered tool. */
  function buildForge(node, offer) {
    if (node.satellites.length) return; // already forged
    const tools = offer?.tools ?? [];
    const style = roleStyle('horse');
    tools.forEach((tool, i) => {
      const satGroup = new THREE.Group();
      const sat = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.22),
        new THREE.MeshStandardMaterial({
          color: style.color,
          emissive: style.color,
          emissiveIntensity: 0.5,
          roughness: 0.3,
          metalness: 0.7
        })
      );
      const tag = createLabelSprite(`⚙ ${tool.name}`, { color: style.css, size: 2.2 });
      tag.position.y = 0.45;
      satGroup.add(sat, tag);
      node.group.add(satGroup);
      node.satellites.push({
        group: satGroup,
        mesh: sat,
        name: tool.name,
        angle: (i / Math.max(1, tools.length)) * Math.PI * 2,
        radius: 1.5,
        flash: 0
      });
      counters.bump('tools');
    });
    counters.bump('horses');
    const presetName = offer?._meta?.preset?.name;
    logLine(`🐴 forge ${node.id}: ${tools.map((t) => t.name).join(', ')}${presetName ? ` (${presetName})` : ''}`);
  }

  function flashSatellite(node, toolName) {
    const sat = node.satellites.find((s) => s.name === toolName);
    if (sat) sat.flash = 1;
  }

  // ---- pipes ----------------------------------------------------------------
  function connectPipe(aId, bId, styleRole, opts = {}) {
    const a = ensureNode(aId);
    const b = ensureNode(bId);
    const style = roleStyle(styleRole);
    const created = !pipes.has(aId, bId);
    pipes.ensure(aId, bId, a.position, b.position, {
      color: style.color,
      cssColor: style.css,
      ...opts
    });
    if (created) counters.set('pipes', pipes.count());
    return { a, b };
  }

  function flow(fromId, toId, styleRole, opts = {}) {
    const { a } = connectPipe(fromId, toId, styleRole, opts);
    excite(a);
    pipes.pulse(fromId, toId, { cssColor: roleStyle(styleRole).css, ...opts });
  }

  // ---- announce buffer → black hole ------------------------------------------
  const motes = [];
  let consumeTimer = 0;
  let holeMass = 0; // eased scale target driver

  const holeCore = new THREE.Mesh(
    new THREE.SphereGeometry(1, 28, 28),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  holeCore.position.copy(CENTER);
  holeCore.scale.setScalar(0.001);
  const holeRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.06, 10, 60),
    new THREE.MeshBasicMaterial({ color: 0x8844ff, transparent: true, opacity: 0 })
  );
  holeRing.position.copy(CENTER);
  holeRing.rotation.x = Math.PI / 2.3;
  scene.add(holeCore, holeRing);

  function addAnnounce(fromId) {
    while (motes.length >= MAX_MOTES) killMote(0);
    const h = hashId(`${fromId}:${motes.length}:${Math.floor(performance.now())}`);
    const sprite = createGlowSprite('#00ff41', { size: 0.7, opacity: 0.9 });
    scene.add(sprite);
    motes.push({
      sprite,
      ttl: MOTE_TTL,
      angle: ((h % 628) / 100),
      radius: 2.2 + ((h >>> 8) % 100) / 70,
      speed: 0.8 + ((h >>> 16) % 100) / 120,
      y: CENTER.y + (((h >>> 4) % 40) - 20) / 40
    });
    counters.set('buffer', motes.length);
  }

  function killMote(i) {
    const mote = motes[i];
    scene.remove(mote.sprite);
    mote.sprite.material.map.dispose();
    mote.sprite.material.dispose();
    motes.splice(i, 1);
    counters.set('buffer', motes.length);
  }

  let holeWasActive = false;

  function updateHole(dt) {
    // Decay + orbit the buffer motes.
    for (let i = motes.length - 1; i >= 0; i -= 1) {
      const mote = motes[i];
      mote.ttl -= dt;
      if (mote.ttl <= 0) { killMote(i); continue; }
      mote.angle += dt * mote.speed;
      // Active hole pulls motes inward; latent buffer just swirls.
      if (holeMass > 0.05) mote.radius = Math.max(0.4, mote.radius - dt * 0.5);
      mote.sprite.position.set(
        CENTER.x + Math.cos(mote.angle) * mote.radius,
        mote.y,
        CENTER.z + Math.sin(mote.angle) * mote.radius
      );
    }

    // Collapse / evaporation dynamics.
    const excess = motes.length - FORM_THRESHOLD;
    const target = excess >= 0 ? 0.7 + excess * 0.09 : 0;
    holeMass += (target - holeMass) * Math.min(1, dt * 1.5);

    const active = holeMass > 0.05;
    if (active !== holeWasActive) {
      holeWasActive = active;
      logLine(active
        ? `🕳️ colapso: buffer=${motes.length} ≥ ${FORM_THRESHOLD} → agujero negro`
        : '💨 el agujero negro se evaporó (buffer drenado)');
    }
    setText('hud-hole', active ? `activo · masa ${holeMass.toFixed(2)}` : `latente (${motes.length}/${FORM_THRESHOLD})`);

    holeCore.scale.setScalar(Math.max(0.001, holeMass));
    holeRing.material.opacity = Math.min(0.9, holeMass);
    holeRing.scale.setScalar(Math.max(0.001, 0.6 + holeMass * 0.6));
    holeRing.rotation.z += dt * (0.4 + holeMass * 0.4);

    // An active hole feeds on its own buffer until it evaporates.
    if (active) {
      consumeTimer += dt;
      if (consumeTimer >= CONSUME_INTERVAL && motes.length) {
        consumeTimer = 0;
        killMote(0);
      }
    }
  }

  // ---- frame loop -------------------------------------------------------------
  stage.onFrame((rawDt) => {
    // Clamp: after a hidden-tab pause the first delta can be minutes long.
    const dt = Math.min(rawDt, 0.1);
    pipes.update(dt);
    updateHole(dt);

    const now = performance.now();
    for (const node of nodes.values()) {
      node.core.rotation.y += dt * node.spin;
      if (node.discoveryRing) node.discoveryRing.rotation.z += dt * 0.5;

      if (node.pulse > 0) {
        node.pulse = Math.max(0, node.pulse - dt * 1.8);
        const s = 1 + node.pulse * 0.5;
        node.core.scale.setScalar(s);
        node.halo.material.opacity = 0.35 + node.pulse * 0.45;
      }
      // Silent nodes dim instead of disappearing — identity stays readable.
      const silent = now - node.lastSeen > SILENCE_MS;
      const targetOpacity = silent ? 0.25 : 1;
      node.core.material.opacity += (targetOpacity - node.core.material.opacity) * Math.min(1, dt * 2);
      node.label.material.opacity = 0.4 + node.core.material.opacity * 0.6;

      for (const sat of node.satellites) {
        sat.angle += dt * 0.7;
        sat.group.position.set(Math.cos(sat.angle) * sat.radius, 0.35, Math.sin(sat.angle) * sat.radius);
        if (sat.flash > 0) {
          sat.flash = Math.max(0, sat.flash - dt * 1.5);
          sat.mesh.material.emissiveIntensity = 0.5 + sat.flash * 1.5;
          sat.mesh.scale.setScalar(1 + sat.flash * 0.8);
        }
      }
    }
  });
  stage.start();

  // ---- room wiring --------------------------------------------------------------
  const room = connectRoom(cfg);
  setText('hud-conn', '…');

  const pingByN = new Map(); // PING n -> emitter (to pair the PONG reply)

  room.onState(() => {
    setText('hud-conn', 'live');
    const master = ensureNode('master', 'master');
    excite(master);
    counters.bump('events');
  });

  room.onAny((event, payload) => {
    if (event === 'SET_STATE' || event === 'session:state') return; // via onState
    counters.bump('events');
    const from = emitterOf(payload, 'peer');

    switch (event) {
      case 'PING': {
        const node = ensureNode(from, 'ping');
        excite(node);
        if (payload?.n != null) pingByN.set(payload.n, from);
        return;
      }
      case 'PONG': {
        // Pair the reply with its PING emitter → conversation pipe.
        const asker = payload?.replyTo != null ? pingByN.get(payload.replyTo) : null;
        if (asker) {
          flow(from, asker, 'pong');
          pingByN.delete(payload.replyTo);
        } else {
          excite(ensureNode(from, 'pong'));
        }
        return;
      }
      case 'RABBIT': {
        const node = ensureNode(from, 'rabbit');
        excite(node);
        addAnnounce(from); // the announce buffer is what forms the black hole
        const peers = Array.isArray(payload?.peers) ? payload.peers : [];
        setDiscoveryRing(node, peers.length);
        for (const peer of peers) {
          if (peer && peer !== from) {
            flow(from, peer, 'rabbit', { radius: 0.035, lift: 0.5, size: 0.55, speed: 0.8 });
          }
        }
        return;
      }
      case 'SPIDER': {
        const msg = payload?.data ?? payload;
        const target = msg?.to || msg?.peerId || msg?.target || payload?.to;
        excite(ensureNode(from, 'spider'));
        if (target && target !== from && target !== '*') {
          flow(from, target, 'spider', { radius: 0.1, lift: 1.4 });
          logLine(`🕷️ canal federado ${from} ⇄ ${target}`);
        }
        return;
      }
      case 'HORSE': {
        const msg = payload?.data ?? payload;
        const horseFrom = msg?.from ?? from;
        if (msg?.method === 'offer') {
          const node = ensureNode(horseFrom, 'horse');
          excite(node);
          buildForge(node, msg.params);
          return;
        }
        if (msg?.jsonrpc) {
          const target = msg.to && msg.to !== '*' ? msg.to : null;
          if (target) flow(horseFrom, target, 'horse');
          else excite(ensureNode(horseFrom, 'horse'));
          if (msg.method === 'tools/call' && msg.params?.name && target) {
            flashSatellite(ensureNode(target, 'horse'), msg.params.name);
          }
          return;
        }
        excite(ensureNode(horseFrom, 'horse'));
        return;
      }
      case 'selection:cast': {
        const actor = payload?.actorId ?? payload?.data?.actorId ?? from;
        ensureNode('master', 'master');
        flow(actor, 'master', classifyRole('', { from: actor }));
        return;
      }
      default: {
        excite(ensureNode(from));
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    room.disconnect();
    pipes.dispose();
    stage.dispose();
  });
}

main();
