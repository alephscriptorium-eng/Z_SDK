/**
 * Vista "jugador" — la vista encarnada (UX.md §jugador).
 *
 * El mismo delta pero desde la perspectiva del actor (?actor=uno): cámara
 * chase suave detrás del monigote (Alt = inspección orbital libre), input
 * de teclado que SOLO emite arg:intent (la vista jamás muta local — P2), y
 * tres overlays DOM estética terminal: menú de contacto (grifo → tapSet;
 * actor → esqueleto de oferta HORSE, WP-11), panel de cloak (Q, WP-12) y
 * franja inferior de tracking (arg:track del propio actor).
 *
 * Controles: WASD/flechas mover · E río · 1..3 etiquetar · Espacio
 * contacto · Q cloak · X emote · Alt inspección.
 */

import * as THREE from 'three';
import { deltaV0, buildCanteraTopology, buildNavGraph } from '@zeus/arg-domain/scenes/delta-v0';
import { EVENTS, EMOTES, resolveTrackRef, buildTrackBrowserUrl } from '@zeus/arg-domain';
import {
  createViewerScene,
  setText,
  readViewerConfig,
  connectRoom,
  onChannelEvent,
  createDeltaStage,
  createRiverDroplets,
  createActorsLayer,
  createIntentClient
} from '../kit/index.mjs';

const CAMERA_OFFSET = { x: 0, y: 6, z: 9 };
const TRACK_MAX = 3;

// ---- overlays DOM (estética terminal) --------------------------------------

function makeOverlay(id, className) {
  const el = document.createElement('div');
  el.id = id;
  el.className = `arg-overlay ${className}`;
  el.hidden = true;
  document.getElementById('viewer-stage').appendChild(el);
  return el;
}

function shortUri(uri, max = 34) {
  if (!uri) return '—';
  return uri.length <= max ? uri : `…${uri.slice(-max)}`;
}

function main() {
  const cfg = readViewerConfig();
  const actorId = cfg.actor || 'uno';
  setText('hud-room', cfg.room);
  setText('hud-actor', actorId);

  // Nav-graph completo (nodos ∪ cámaras) para elegir vecinos con WASD.
  // Importar la escena/topología NO es correr motores (G-ARG.1): la
  // autoridad sigue siendo la única verdad — aquí solo se eligen destinos.
  const topology = buildCanteraTopology(deltaV0.cantera);
  const nav = buildNavGraph(deltaV0, topology);

  const stage = createViewerScene({
    camera: { position: [0, 10, 14], far: 500 },
    controls: { minDistance: 3, maxDistance: 120, maxPolarAngle: Math.PI / 2.05 },
    fog: { near: 18, far: 130 } // lo lejano se atenúa, lo cercano se intensifica
  });
  const { scene, camera, controls } = stage;

  const world = new THREE.Group();
  scene.add(world);

  const delta = createDeltaStage(world, deltaV0);
  const droplets = createRiverDroplets(world, deltaV0);
  const actors = createActorsLayer(world);

  // ---- room + intents --------------------------------------------------------
  const room = connectRoom(cfg, { user: `jugador-${actorId}` });
  setText('hud-conn', '…');
  const intents = createIntentClient(room, actorId);

  // join idempotente en cada (re)conexión
  room.getSocket().on('connect', () => intents.join());

  // ---- estado proyectado -------------------------------------------------------
  let lastSnap = null;
  let lastStateAt = 0;
  let elapsed = 0;
  const tracks = []; // últimas 3 arg:track propias

  function ownActor() {
    return lastSnap?.actors?.[actorId] ?? null;
  }

  /** Grifo más cercano al actor (por posición del snapshot). */
  function nearestTap(actor) {
    let best = null;
    let bestDist = Infinity;
    for (const tap of Object.values(deltaV0.taps)) {
      const p = deltaV0.nodos[tap.summitNodeId].position;
      const d = Math.hypot(p.x - actor.position.x, p.y - actor.position.y, p.z - actor.position.z);
      if (d < bestDist) { best = tap; bestDist = d; }
    }
    return { tap: best, dist: bestDist };
  }

  // ---- overlays ----------------------------------------------------------------
  const contactMenu = makeOverlay('contact-menu', 'contact-menu');
  const cloakPanel = makeOverlay('cloak-panel', 'cloak-panel');
  const trackPanel = makeOverlay('track-panel', 'track-panel');
  trackPanel.hidden = false;
  trackPanel.innerHTML = '<div class="track-title">⛓ tracking</div><div class="track-lines">— aún sin pisar ningún recurso —</div>';

  let cloakOpen = false;

  function renderCloakPanel() {
    if (!cloakOpen) { cloakPanel.hidden = true; return; }
    const actor = ownActor();
    const cloak = actor?.cloak ?? null;
    cloakPanel.innerHTML = [
      '<div class="overlay-title">🧥 CLOAK — inventario</div>',
      cloak
        ? `<pre class="overlay-pre">${JSON.stringify(cloak, null, 2)}</pre>`
        : '<p class="overlay-muted">sin cloak equipado — vas desnudo por el delta</p>',
      '<p class="overlay-muted">presets ampliables — WP-12</p>',
      '<p class="overlay-hint">[Q] cerrar</p>'
    ].join('');
    cloakPanel.hidden = false;
  }

  let currentContactId = null;

  function renderContactMenu() {
    const contacts = lastSnap?.contacts ?? {};
    let found = null;
    for (const [id, c] of Object.entries(contacts)) {
      if (c.state === 'open' && (c.a === actorId || c.b === actorId)) {
        found = { id, other: c.a === actorId ? c.b : c.a };
        break;
      }
    }
    if (!found) {
      currentContactId = null;
      contactMenu.hidden = true;
      return;
    }

    const isNew = found.id !== currentContactId;
    currentContactId = found.id;
    const tapDef = deltaV0.taps[found.other];

    if (tapDef) {
      const live = lastSnap?.taps?.[found.other] ?? { aperture: 0, pressure: 0, state: 'ok' };
      if (isNew) {
        contactMenu.innerHTML = [
          `<div class="overlay-title">⚙ CONTACTO · ${found.other}</div>`,
          `<div class="contact-live" id="contact-live"></div>`,
          '<div class="contact-tools">',
          '  <span class="overlay-muted">tap.set_aperture:</span>',
          ...[0, 0.3, 0.6, 1].map((v) => `  <button class="arg-btn" data-aperture="${v}">${v}</button>`),
          '</div>',
          '<button class="arg-btn arg-btn-close" data-close="1">cerrar contacto</button>'
        ].join('\n');
        contactMenu.querySelectorAll('[data-aperture]').forEach((btn) => {
          btn.addEventListener('click', () => intents.tapSet(found.other, Number(btn.dataset.aperture)));
        });
        contactMenu.querySelector('[data-close]').addEventListener('click', () => {
          intents.contactClose(found.id);
          contactMenu.hidden = true;
        });
      }
      const liveEl = contactMenu.querySelector('#contact-live');
      if (liveEl) {
        liveEl.textContent = `apertura ${Number(live.aperture).toFixed(2)} · presión ${Number(live.pressure).toFixed(2)}${live.state !== 'ok' ? ` · ${live.state.toUpperCase()}` : ''}`;
      }
    } else if (isNew) {
      const otherActor = lastSnap?.actors?.[found.other];
      contactMenu.innerHTML = [
        `<div class="overlay-title">🤝 CONTACTO · ${found.other}</div>`,
        `<pre class="overlay-pre">${JSON.stringify(otherActor?.cloak ?? null, null, 2)}</pre>`,
        '<p class="overlay-muted">oferta HORSE — WP-11</p>',
        '<button class="arg-btn arg-btn-close" data-close="1">cerrar contacto</button>'
      ].join('\n');
      contactMenu.querySelector('[data-close]').addEventListener('click', () => {
        intents.contactClose(found.id);
        contactMenu.hidden = true;
      });
    }
    contactMenu.hidden = false;
  }

  function renderTrackPanel() {
    const lines = tracks.map((t) => {
      const emoji = t.hint === 'firehose-browser' ? '🌊' : '🗿';
      const resolved = resolveTrackRef(t.ref);
      const href = resolved ? buildTrackBrowserUrl(resolved, cfg.browsers, { actor: actorId }) : null;
      const openBtn = href
        ? ` <a class="arg-btn arg-btn-link" href="${href}" target="_blank" rel="noopener">abrir en navegador</a>`
        : '';
      return `<div class="track-line">${emoji} ${t.zone} · ${t.ref?.kind ?? '?'} · ${shortUri(t.ref?.uri, 60)}${openBtn}</div>`;
    });
    trackPanel.innerHTML = `<div class="track-title">⛓ tracking</div><div class="track-lines">${
      lines.length ? lines.join('') : '— aún sin pisar ningún recurso —'
    }</div>`;
  }

  // ---- HUD -----------------------------------------------------------------------
  function reflectHud() {
    const actor = ownActor();
    if (!actor) return;
    setText('hud-zone', actor.zone);
    setText('hud-pose', actor.pose + (actor.emote ? ` +${actor.emote}` : ''));
    setText('hud-score', `${actor.score?.labeled ?? 0} etiquetadas · ${actor.score?.excavated ?? 0} excavadas`);
    const { tap, dist } = nearestTap(actor);
    if (tap && lastSnap?.taps?.[tap.id]) {
      const live = lastSnap.taps[tap.id];
      setText('hud-tap', `${tap.id} (${dist.toFixed(1)}m) · ap ${live.aperture.toFixed(2)} · pr ${live.pressure.toFixed(2)}`);
    }
    const latest = tracks[0];
    setText('hud-droplet', actor.riding && latest ? shortUri(latest.ref?.uri) : latest ? shortUri(latest.ref?.uri) : '—');
  }

  // ---- eventos de room (G-ARG.2) ----------------------------------------------
  onChannelEvent(room, EVENTS.STATE, (snap) => {
    lastSnap = snap;
    lastStateAt = performance.now();
    setText('hud-conn', 'connected');
    delta.applySnapshot(snap);
    droplets.applySnapshot(snap);
    actors.applySnapshot(snap);
    renderContactMenu();
    if (cloakOpen) renderCloakPanel();
    reflectHud();
  });

  onChannelEvent(room, EVENTS.TRACK, (track) => {
    if (track?.actorId !== actorId) return;
    tracks.unshift(track);
    if (tracks.length > TRACK_MAX) tracks.pop();
    renderTrackPanel();
  });

  // ---- input de teclado (solo intents) -------------------------------------------
  const KEY_VECTORS = {
    KeyW: { x: 0, z: -1 }, ArrowUp: { x: 0, z: -1 },
    KeyS: { x: 0, z: 1 }, ArrowDown: { x: 0, z: 1 },
    KeyA: { x: -1, z: 0 }, ArrowLeft: { x: -1, z: 0 },
    KeyD: { x: 1, z: 0 }, ArrowRight: { x: 1, z: 0 }
  };

  /**
   * WASD → move: la tecla se interpreta relativa a la cámara y se elige el
   * vecino del nav-graph cuya dirección mejor alinee. Solo desde nodo (si
   * el actor va por enlace o río, se ignora).
   */
  function moveTowards(keyVec) {
    const actor = ownActor();
    if (!actor || !actor.nodeId || actor.riding || actor.linkId) return;
    const node = nav.nodos[actor.nodeId];
    if (!node) return;

    // base de cámara proyectada al plano XZ
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
    fwd.normalize();
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x).negate(); // derecha de cámara
    const wish = new THREE.Vector3()
      .addScaledVector(fwd, -keyVec.z)
      .addScaledVector(right, keyVec.x);
    if (wish.lengthSq() < 1e-6) return;
    wish.normalize();

    // vecinos alcanzables desde el nodo actual
    let best = null;
    let bestDot = 0.25; // umbral: no ir a un vecino casi perpendicular
    for (const link of Object.values(nav.enlaces)) {
      let neighborId = null;
      if (link.from === actor.nodeId) neighborId = link.to;
      else if (link.to === actor.nodeId) neighborId = link.from;
      if (!neighborId) continue;
      const np = nav.nodos[neighborId].position;
      const dir = new THREE.Vector3(np.x - node.position.x, 0, np.z - node.position.z);
      if (dir.lengthSq() < 1e-6) continue;
      dir.normalize();
      const dot = dir.dot(wish);
      if (dot > bestDot) {
        bestDot = dot;
        best = neighborId;
      }
    }
    if (best) intents.move(best);
  }

  /** E: ride en embarcadero / dismount montado. Nada más en v0. */
  function handleUse() {
    const actor = ownActor();
    if (!actor) return;
    if (actor.riding) {
      intents.dismount();
      return;
    }
    if (actor.nodeId) {
      for (const rio of Object.values(deltaV0.rios)) {
        if (rio.embarkNodeId === actor.nodeId) {
          intents.ride(rio.id);
          return;
        }
      }
    }
  }

  /** Espacio: contact:request al contactable más próximo (≤ contactRadius). */
  function handleContact() {
    const actor = ownActor();
    if (!actor) return;
    const me = actor.position;
    let best = null;
    let bestDist = deltaV0.contactRadius;

    for (const [id, other] of Object.entries(lastSnap?.actors ?? {})) {
      if (id === actorId) continue;
      const d = Math.hypot(other.position.x - me.x, other.position.y - me.y, other.position.z - me.z);
      if (d <= bestDist) { best = id; bestDist = d; }
    }
    for (const tap of Object.values(deltaV0.taps)) {
      const p = deltaV0.nodos[tap.summitNodeId].position;
      const d = Math.hypot(p.x - me.x, p.y - me.y, p.z - me.z);
      if (d <= bestDist) { best = tap.id; bestDist = d; }
    }
    if (best) intents.contactRequest(best);
  }

  let emoteIndex = 0;
  let inspecting = false;

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    if (ev.altKey || ev.code === 'AltLeft' || ev.code === 'AltRight') {
      inspecting = true;
      if (ev.code.startsWith('Alt')) ev.preventDefault();
    }

    if (KEY_VECTORS[ev.code]) {
      moveTowards(KEY_VECTORS[ev.code]);
      return;
    }
    switch (ev.code) {
      case 'KeyE':
        handleUse();
        break;
      case 'Space':
        ev.preventDefault();
        handleContact();
        break;
      case 'KeyX':
        intents.emote(EMOTES[emoteIndex % EMOTES.length]);
        emoteIndex += 1;
        break;
      case 'KeyQ':
        cloakOpen = !cloakOpen;
        renderCloakPanel();
        break;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3': {
        const n = Number(ev.code.slice(-1));
        const label = deltaV0.labelset[n - 1];
        if (label) intents.labelCast(label);
        break;
      }
      default:
        break;
    }
  });

  window.addEventListener('keyup', (ev) => {
    if (ev.code === 'AltLeft' || ev.code === 'AltRight') {
      inspecting = false;
      ev.preventDefault();
    }
  });

  // ---- cámara chase ----------------------------------------------------------------
  const lookTarget = new THREE.Vector3();

  function chaseCamera(dt) {
    const pos = actors.getPosition(actorId);
    if (!pos) return;
    if (inspecting) {
      // Alt: OrbitControls libre alrededor del actor
      controls.enabled = true;
      controls.target.lerp(new THREE.Vector3(pos.x, pos.y + 1, pos.z), Math.min(1, dt * 5));
      return;
    }
    controls.enabled = false;
    const k = 1 - Math.exp(-dt * 4);
    camera.position.lerp(
      new THREE.Vector3(pos.x + CAMERA_OFFSET.x, pos.y + CAMERA_OFFSET.y, pos.z + CAMERA_OFFSET.z),
      k
    );
    lookTarget.lerp(new THREE.Vector3(pos.x, pos.y + 1, pos.z), Math.min(1, dt * 6));
    camera.lookAt(lookTarget);
    controls.target.copy(lookTarget); // que Alt arranque orbitando donde mirábamos
  }

  // ---- frame loop --------------------------------------------------------------------
  stage.onFrame((rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    elapsed += dt;
    delta.update(dt, elapsed);
    droplets.update(dt);
    actors.update(dt);
    chaseCamera(dt);
  });
  stage.start();

  // Watchdog de silencio (3 s sin arg:state).
  const watchdog = setInterval(() => {
    if (!lastStateAt || performance.now() - lastStateAt > 3000) {
      setText('hud-conn', 'silencio…');
    }
  }, 1000);

  window.addEventListener('beforeunload', () => {
    clearInterval(watchdog);
    room.disconnect();
    actors.dispose();
    droplets.dispose();
    stage.dispose();
  });
}

main();
