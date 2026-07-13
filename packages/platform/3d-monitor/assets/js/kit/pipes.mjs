/**
 * View kit · pipe network — persistent tubes between scene positions with
 * glowing pulses flowing through them. Replaces "ball to the center" traffic:
 * a pipe shows WHO talks to WHOM, the pulse shows WHEN.
 */

import * as THREE from 'three';
import { createGlowSprite } from './labels.mjs';

const TUBE_SEGMENTS = 40;
const RADIAL_SEGMENTS = 6;

function pipeKey(a, b) {
  return [a, b].sort().join('|');
}

function arcCurve(from, to, lift = 1) {
  const mid = from.clone().add(to).multiplyScalar(0.5);
  mid.y += from.distanceTo(to) * 0.18 * lift + 0.4;
  return new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone());
}

/**
 * @param {object} scene THREE scene
 * @param {object} [defaults]
 * @param {number} [defaults.radius] tube radius
 * @param {number} [defaults.baseOpacity] idle tube opacity
 */
export function createPipeNetwork(scene, defaults = {}) {
  const baseRadius = defaults.radius ?? 0.06;
  const baseOpacity = defaults.baseOpacity ?? 0.22;
  const pipes = new Map(); // key -> { mesh, curve, a, b, pulses: [], cssColor }

  /**
   * Create (or return) the pipe between two endpoint ids.
   * @param {string} aId  @param {string} bId
   * @param {THREE.Vector3} aPos  @param {THREE.Vector3} bPos
   * @param {object} [opts] { color:number, cssColor:string, radius, lift }
   */
  function ensure(aId, bId, aPos, bPos, opts = {}) {
    const key = pipeKey(aId, bId);
    let pipe = pipes.get(key);
    if (pipe) return pipe;
    const curve = arcCurve(aPos, bPos, opts.lift ?? 1);
    const geometry = new THREE.TubeGeometry(curve, TUBE_SEGMENTS, opts.radius ?? baseRadius, RADIAL_SEGMENTS, false);
    const material = new THREE.MeshStandardMaterial({
      color: opts.color ?? 0x00d4ff,
      emissive: opts.color ?? 0x00d4ff,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: baseOpacity,
      roughness: 0.4,
      metalness: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    pipe = {
      key,
      mesh,
      curve,
      a: aId,
      b: bId,
      radius: opts.radius ?? baseRadius,
      lift: opts.lift ?? 1,
      cssColor: opts.cssColor ?? '#00d4ff',
      pulses: []
    };
    pipes.set(key, pipe);
    return pipe;
  }

  /** Rebuild a pipe's geometry after its endpoints moved. */
  function refresh(aId, bId, aPos, bPos) {
    const pipe = pipes.get(pipeKey(aId, bId));
    if (!pipe) return;
    pipe.curve = arcCurve(aPos, bPos, pipe.lift);
    pipe.mesh.geometry.dispose();
    pipe.mesh.geometry = new THREE.TubeGeometry(pipe.curve, TUBE_SEGMENTS, pipe.radius, RADIAL_SEGMENTS, false);
  }

  /**
   * Send a glowing pulse through an existing pipe. Direction follows the
   * (aId → bId) order given here, independent of pipe creation order.
   */
  function pulse(aId, bId, opts = {}) {
    const pipe = pipes.get(pipeKey(aId, bId));
    if (!pipe) return;
    const sprite = createGlowSprite(opts.cssColor ?? pipe.cssColor, { size: opts.size ?? 0.9 });
    scene.add(sprite);
    pipe.pulses.push({
      sprite,
      t: 0,
      speed: opts.speed ?? 0.55,
      reverse: pipe.a !== aId
    });
    pipe.mesh.material.opacity = Math.min(0.9, baseOpacity + 0.5);
  }

  /** Per-frame: advance pulses, decay pipe glow. */
  function update(dt) {
    for (const pipe of pipes.values()) {
      if (pipe.mesh.material.opacity > baseOpacity) {
        pipe.mesh.material.opacity = Math.max(baseOpacity, pipe.mesh.material.opacity - dt * 0.6);
      }
      for (let i = pipe.pulses.length - 1; i >= 0; i -= 1) {
        const p = pipe.pulses[i];
        p.t += dt * p.speed;
        if (p.t >= 1) {
          scene.remove(p.sprite);
          p.sprite.material.map.dispose();
          p.sprite.material.dispose();
          pipe.pulses.splice(i, 1);
          continue;
        }
        const at = p.reverse ? 1 - p.t : p.t;
        p.sprite.position.copy(pipe.curve.getPointAt(at));
      }
    }
  }

  function count() {
    return pipes.size;
  }

  function has(aId, bId) {
    return pipes.has(pipeKey(aId, bId));
  }

  function dispose() {
    for (const pipe of pipes.values()) {
      for (const p of pipe.pulses) scene.remove(p.sprite);
      scene.remove(pipe.mesh);
      pipe.mesh.geometry.dispose();
      pipe.mesh.material.dispose();
    }
    pipes.clear();
  }

  return { ensure, refresh, pulse, update, count, has, dispose, pipes };
}
