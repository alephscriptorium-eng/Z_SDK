/**
 * Capa de actores — gestiona un puppet por actor del snapshot (híbrido por
 * tier): 'stick' → monigote procedural; 'puppet' → GLB via loadPuppet de
 * ui-3d-kit con fallback a stick si el GLB falla. Posición interpolada
 * (lerp hacia el position del snapshot, heading por el desplazamiento),
 * pose→setBase, emote→playAdditive, label sprite con el id, y anillo de
 * cloak (toro fino orbitando) cuando el actor lleva cloak.
 */

import * as THREE from 'three';
import { loadPuppet } from '@zeus/ui-3d-kit';
import { createStickPuppet, colorForActorId } from './stick-puppet.mjs';

const PUPPET_URL = '/models/SK_Alephillo.glb';

/** Poses del contrato sin clip GLB directo → fallback razonable. */
const GLB_POSE_FALLBACK = { ride: 'sit', swim: 'walk', menu: 'idle' };

function makeCloakRing(color) {
  const holder = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.025, 5, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 })
  );
  ring.rotation.x = Math.PI / 2 - 0.35; // aro inclinado, orbita al girar el holder
  holder.add(ring);
  holder.position.y = 1.15;
  holder.visible = false;
  return holder;
}

/**
 * @param {THREE.Object3D} parent grupo/escena donde montar
 * @param {object} [opts]
 * @param {string} [opts.puppetUrl] GLB para tier 'puppet'
 * @returns {{ applySnapshot(snap): void, update(dt:number): void, getPosition(id:string): {x:number,y:number,z:number}|null, dispose(): void }}
 */
export function createActorsLayer(parent, opts = {}) {
  const puppetUrl = opts.puppetUrl ?? PUPPET_URL;

  /** id → entrada */
  const entries = new Map();

  function spawnStick(id) {
    const puppet = createStickPuppet({ color: colorForActorId(id) });
    puppet.setLabel(id);
    parent.add(puppet.object);
    return puppet;
  }

  function ensure(actor) {
    let entry = entries.get(actor.id);
    if (entry) return entry;

    // Todos arrancan como stick (visible al instante); el tier 'puppet'
    // intenta el GLB en segundo plano y lo sustituye si carga.
    entry = {
      id: actor.id,
      puppet: spawnStick(actor.id),
      isStick: true,
      pos: { ...actor.position },
      target: { ...actor.position },
      heading: 0,
      lastPose: null,
      lastEmote: null,
      ring: makeCloakRing(colorForActorId(actor.id))
    };
    entry.puppet.object.position.set(entry.pos.x, entry.pos.y, entry.pos.z);
    entry.puppet.object.add(entry.ring);
    entries.set(actor.id, entry);

    if (actor.tier === 'puppet') {
      loadPuppet(puppetUrl, { scale: 1 })
        .then((glb) => {
          const current = entries.get(actor.id);
          if (!current) { glb.dispose(); return; }
          current.puppet.object.remove(current.ring);
          current.puppet.dispose();
          current.puppet = glb;
          current.isStick = false;
          current.lastPose = null;
          glb.setLabel?.(actor.id);
          glb.object.add(current.ring);
          glb.setPosition(current.pos);
          parent.add(glb.object);
        })
        .catch((err) => {
          console.warn(`[view-kit] GLB puppet falló para ${actor.id}, se queda el stick:`, err.message);
        });
    }
    return entry;
  }

  function applyPose(entry, actor) {
    if (actor.pose !== entry.lastPose) {
      let ok = entry.puppet.setBase(actor.pose);
      if (!ok && !entry.isStick) {
        const fallback = GLB_POSE_FALLBACK[actor.pose];
        if (fallback) ok = entry.puppet.setBase(fallback);
      }
      entry.lastPose = actor.pose;
    }
    if (actor.emote && actor.emote !== entry.lastEmote) {
      entry.puppet.playAdditive(actor.emote);
    }
    entry.lastEmote = actor.emote ?? null;
  }

  return {
    /** Proyecta los actores del snapshot (alta/baja/pose/emote/cloak). */
    applySnapshot(snap) {
      if (!snap.actors) return;
      for (const actor of Object.values(snap.actors)) {
        const entry = ensure(actor);
        entry.target = { ...actor.position };
        entry.ring.visible = actor.cloak != null;
        applyPose(entry, actor);
      }
      // baja de los ausentes
      for (const [id, entry] of entries) {
        if (!snap.actors[id]) {
          entry.puppet.dispose();
          entries.delete(id);
        }
      }
    },

    /** Interpolación de posición/heading + animación de puppets y anillos. */
    update(dt) {
      const k = 1 - Math.exp(-dt * 9); // lerp suave independiente del frame rate
      for (const entry of entries.values()) {
        const dx = entry.target.x - entry.pos.x;
        const dy = entry.target.y - entry.pos.y;
        const dz = entry.target.z - entry.pos.z;
        entry.pos.x += dx * k;
        entry.pos.y += dy * k;
        entry.pos.z += dz * k;
        entry.puppet.setPosition(entry.pos);

        // heading por el desplazamiento (solo si se mueve de verdad)
        const speed = Math.hypot(dx, dz);
        if (speed > 0.05) {
          const targetHeading = Math.atan2(dx, dz);
          let diff = targetHeading - entry.heading;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          entry.heading += diff * Math.min(1, dt * 7);
          entry.puppet.setHeading(entry.heading);
        }

        entry.ring.rotation.y += dt * 1.8; // el aro orbita
        entry.puppet.update(dt);
      }
    },

    /** Posición interpolada actual de un actor (o null). */
    getPosition(id) {
      const entry = entries.get(id);
      return entry ? { ...entry.pos } : null;
    },

    dispose() {
      for (const entry of entries.values()) entry.puppet.dispose();
      entries.clear();
    }
  };
}
