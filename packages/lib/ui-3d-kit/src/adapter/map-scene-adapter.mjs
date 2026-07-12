/**
 * Map ↔ scene adapter: binds map-engine snapshots to puppets.
 *
 * Deliberately DECOUPLED from three.js (no `three` import) so it can be
 * unit-tested under node --test with stub puppets. Puppets are duck-typed:
 *   { object?, setPosition({x,y,z}), setHeading?(rad), setBase(pose),
 *     update?(dt), dispose?() }
 * `loadPuppet()` from src/puppet/puppet.mjs satisfies this contract.
 *
 * Positions come from the engine snapshot; while an actor walks a link the
 * adapter re-samples the link waypoints with `sampleLink` (vendored engine
 * math) using the actor's progress, and derives heading from the local
 * tangent.
 */

import { sampleLink } from '@zeus/game-engine';

const POSES = new Set(['idle', 'walk', 'sit']);

/**
 * @param {object} deps
 * @param {object} deps.scene engine scene definition (nodos/enlaces/anclas),
 *   e.g. `vaivenDosNodos` from src/engine/scenes/.
 * @param {(id: string, opts: object) => object|Promise<object>} deps.puppetFactory
 *   creates a puppet for an actor (may be async, e.g. wraps loadPuppet).
 * @param {object} [deps.sceneManager] optional; if given (or `deps.root`),
 *   spawned puppet `.object`s are added to sceneManager.getScene() / root
 *   (duck-typed `.add/.remove`).
 * @param {object} [deps.root] optional Object3D-like container.
 */
export function createMapSceneAdapter({ scene, puppetFactory, sceneManager, root } = {}) {
  if (!scene) throw new Error('createMapSceneAdapter: scene (engine def) is required');
  if (typeof puppetFactory !== 'function') {
    throw new Error('createMapSceneAdapter: puppetFactory is required');
  }

  const puppets = new Map(); // actorId -> puppet

  function getContainer() {
    return root ?? sceneManager?.getScene?.() ?? null;
  }

  function headingFromTangent(from, to) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    if (dx === 0 && dz === 0) return null;
    return Math.atan2(dx, dz); // three.js convention: +Z forward, Y-up
  }

  function applyActor(actor) {
    const puppet = puppets.get(actor.id);
    if (!puppet) return;

    let position = actor.position ?? { x: 0, y: 0, z: 0 };
    let heading = null;

    if (actor.pose === 'walk' && actor.linkId != null && actor.progress != null) {
      const link = scene.enlaces?.[actor.linkId];
      if (link) {
        position = sampleLink(link.waypoints, actor.progress);
        const sign = actor.linkDirection === 'b-to-a' ? -1 : 1;
        const eps = 0.01;
        const ahead = sampleLink(
          link.waypoints,
          Math.max(0, Math.min(1, actor.progress + sign * eps)),
        );
        heading = sign >= 0
          ? headingFromTangent(position, ahead)
          : headingFromTangent(ahead, position);
      }
    } else if (actor.pose === 'sit' && actor.anchorId != null) {
      const anchor = scene.anclas?.[actor.anchorId];
      if (anchor) {
        position = anchor.position;
        if (anchor.facing !== undefined) {
          heading = (anchor.facing * Math.PI) / 180;
        }
      }
    }

    puppet.setPosition({ x: position.x, y: position.y, z: position.z });
    if (heading != null && typeof puppet.setHeading === 'function') {
      puppet.setHeading(heading);
    }

    const pose = POSES.has(actor.pose) ? actor.pose : 'idle';
    puppet.setBase(pose);
  }

  return {
    /**
     * Create a puppet for actor `id` and add it to the container (if any).
     * @returns {Promise<object>} the puppet
     */
    async spawnActor(id, opts = {}) {
      if (puppets.has(id)) return puppets.get(id);
      const puppet = await puppetFactory(id, opts);
      puppets.set(id, puppet);
      const container = getContainer();
      if (container?.add && puppet.object) container.add(puppet.object);
      if (typeof puppet.setLabel === 'function' && opts.label) {
        puppet.setLabel(opts.label);
      }
      return puppet;
    },

    despawnActor(id) {
      const puppet = puppets.get(id);
      if (!puppet) return false;
      const container = getContainer();
      if (container?.remove && puppet.object) container.remove(puppet.object);
      puppet.dispose?.();
      puppets.delete(id);
      return true;
    },

    getPuppet(id) {
      return puppets.get(id) ?? null;
    },

    /**
     * Position every spawned puppet according to an engine snapshot
     * (engine.getSnapshot()): node/anchor position or link+progress via
     * sampleLink, and base pose sit|walk|idle.
     */
    applySnapshot(snapshot) {
      if (!snapshot?.actors) return;
      for (const actor of Object.values(snapshot.actors)) {
        applyActor(actor);
      }
    },

    /** Forward dt (seconds) to every puppet's mixer. */
    update(dt) {
      for (const puppet of puppets.values()) {
        puppet.update?.(dt);
      }
    },

    dispose() {
      for (const id of [...puppets.keys()]) {
        this.despawnActor(id);
      }
    },
  };
}
