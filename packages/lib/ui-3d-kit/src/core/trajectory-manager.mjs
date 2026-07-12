/**
 * TrajectoryManager — particles travelling along bezier trajectories
 * between points (message/event visualization).
 *
 * Ported from gea-sdk threejs-gamify-ui `TrajectoryManager` (Angular):
 *   - `@Injectable` removed → plain factory `createTrajectoryManager(options)`.
 *   - Channel colors are configurable via options.
 *   - `onParticleArrived(cb)` plain callback added (no RxJS).
 *
 * Browser-safe: `three` resolves via import map.
 */

import * as THREE from 'three';

const DEFAULT_CHANNEL_COLORS = {
  sys: 0xff4444, // red
  app: 0x4444ff, // blue
  ui: 0x44ff44, // green
  agent: 0xffaa44, // orange
  game: 0xaa44ff, // purple
};

/**
 * @param {object} [options]
 * @param {Record<string, number>} [options.channelColors]
 * @param {number} [options.particleRadius=0.1]
 * @param {number} [options.curvature=2.0]
 */
export function createTrajectoryManager(options = {}) {
  const curvatureDefault = options.curvature ?? 2.0;

  let scene = null;
  const activeParticles = new Map();
  const arrivedCallbacks = new Set();

  const channelColors = {};
  for (const [channel, hex] of Object.entries({
    ...DEFAULT_CHANNEL_COLORS,
    ...(options.channelColors ?? {}),
  })) {
    channelColors[channel] = new THREE.Color(hex);
  }

  const particleGeometry = new THREE.SphereGeometry(options.particleRadius ?? 0.1, 8, 8);
  const particleMaterials = new Map();
  for (const [channel, color] of Object.entries(channelColors)) {
    particleMaterials.set(channel, new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
    }));
  }

  function updateParticleEffects(particle, deltaTime) {
    // Pulsing effect
    const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
    particle.mesh.scale.setScalar(pulse);

    // Rotation
    particle.mesh.rotation.x += deltaTime * 2;
    particle.mesh.rotation.y += deltaTime * 3;

    // Fade near end
    if (particle.progress > 0.8) {
      const fadeProgress = (particle.progress - 0.8) / 0.2;
      particle.mesh.material.opacity = 1 - fadeProgress;
    }
  }

  const manager = {
    /** Set the three.js scene particles are added to. */
    setScene(nextScene) {
      scene = nextScene;
    },

    /**
     * Build a CubicBezierCurve3 between two positions with an arc.
     * @param {{startPosition: THREE.Vector3, endPosition: THREE.Vector3, curvature: number}} config
     */
    createTrajectory(config) {
      const { startPosition, endPosition, curvature } = config;

      const midPoint = new THREE.Vector3()
        .addVectors(startPosition, endPosition)
        .multiplyScalar(0.5);
      midPoint.y += curvature;

      const direction = new THREE.Vector3()
        .subVectors(endPosition, startPosition)
        .normalize();

      const perpendicular = new THREE.Vector3()
        .crossVectors(direction, new THREE.Vector3(0, 1, 0))
        .normalize()
        .multiplyScalar(curvature * 0.5);

      const controlPoint1 = new THREE.Vector3()
        .addVectors(startPosition, perpendicular)
        .lerp(midPoint, 0.3);

      const controlPoint2 = new THREE.Vector3()
        .subVectors(endPosition, perpendicular)
        .lerp(midPoint, 0.3);

      return new THREE.CubicBezierCurve3(
        startPosition,
        controlPoint1,
        controlPoint2,
        endPosition,
      );
    },

    /**
     * Create and launch a particle from startPos to endPos.
     * @param {string} id
     * @param {THREE.Vector3} startPos
     * @param {THREE.Vector3} endPos
     * @param {string} [channel='app']
     * @param {number} [speed=1.0] progress units per second
     */
    createMessageParticle(id, startPos, endPos, channel = 'app', speed = 1.0) {
      if (!scene) return null;

      const curve = manager.createTrajectory({
        startPosition: startPos.clone(),
        endPosition: endPos.clone(),
        curvature: curvatureDefault,
      });

      const material = particleMaterials.get(channel) ?? particleMaterials.get('app');
      const mesh = new THREE.Mesh(particleGeometry, material.clone());
      mesh.position.copy(startPos);
      mesh.userData = { type: 'message_particle', id, channel };
      scene.add(mesh);

      const particle = {
        id,
        position: startPos.clone(),
        targetPosition: endPos.clone(),
        curve,
        progress: 0,
        speed,
        color: channelColors[channel] ?? channelColors.app,
        mesh,
        channel,
      };

      activeParticles.set(id, particle);
      return particle;
    },

    /**
     * Advance all particles. Call once per render frame.
     * @param {number} deltaTime seconds
     */
    updateParticles(deltaTime) {
      const particlesToRemove = [];

      activeParticles.forEach((particle, id) => {
        particle.progress += deltaTime * particle.speed;

        if (particle.progress >= 1.0) {
          particlesToRemove.push(id);
          return;
        }

        const newPosition = particle.curve.getPoint(particle.progress);
        particle.position.copy(newPosition);
        particle.mesh.position.copy(newPosition);

        updateParticleEffects(particle, deltaTime);
      });

      particlesToRemove.forEach((id) => {
        const particle = activeParticles.get(id);
        manager.removeParticle(id);
        if (particle) {
          for (const cb of arrivedCallbacks) cb(particle);
        }
      });
    },

    /** Subscribe to particle-arrived events. Returns an unsubscribe fn. */
    onParticleArrived(cb) {
      arrivedCallbacks.add(cb);
      return () => arrivedCallbacks.delete(cb);
    },

    removeParticle(id) {
      const particle = activeParticles.get(id);
      if (!particle) return;

      if (scene) scene.remove(particle.mesh);
      if (particle.mesh.material !== particleMaterials.get(particle.channel)) {
        particle.mesh.material.dispose();
      }
      activeParticles.delete(id);
    },

    getActiveParticleCount() {
      return activeParticles.size;
    },

    getParticlesByChannel(channel) {
      return Array.from(activeParticles.values())
        .filter((particle) => particle.channel === channel);
    },

    clearAllParticles() {
      const particleIds = Array.from(activeParticles.keys());
      particleIds.forEach((id) => manager.removeParticle(id));
    },

    updateChannelColor(channel, color) {
      channelColors[channel] = color;
      const material = particleMaterials.get(channel);
      if (material) material.color.copy(color);
      activeParticles.forEach((particle) => {
        if (particle.channel === channel) {
          particle.mesh.material.color.copy(color);
        }
      });
    },

    dispose() {
      manager.clearAllParticles();
      particleGeometry.dispose();
      particleMaterials.forEach((material) => material.dispose());
      particleMaterials.clear();
      arrivedCallbacks.clear();
      scene = null;
    },
  };

  return manager;
}
