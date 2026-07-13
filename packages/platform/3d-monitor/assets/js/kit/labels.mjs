/**
 * View kit · label & glow sprites — canvas-textured sprites that make scene
 * elements identifiable (names over nodes, soft halos, glowing pulses).
 */

import * as THREE from 'three';

/**
 * Billboard text label. Always faces the camera.
 *
 * @param {string} text
 * @param {object} [opts]
 * @param {string} [opts.color] css color
 * @param {number} [opts.size] world width of the sprite
 */
export function createLabelSprite(text, opts = {}) {
  const color = opts.color ?? '#d7fbe6';
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.font = '600 44px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // soft dark plate behind the text so labels stay readable over anything
  const w = Math.min(500, ctx.measureText(text).width + 40);
  ctx.fillStyle = 'rgba(3, 3, 8, 0.65)';
  ctx.beginPath();
  ctx.roundRect((canvas.width - w) / 2, 10, w, 76, 18);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  }));
  const size = opts.size ?? 3.2;
  sprite.scale.set(size, size * (canvas.height / canvas.width), 1);
  return sprite;
}

/**
 * Soft radial glow sprite (halo / pulse dot). Additive so overlapping glows
 * brighten instead of muddying.
 *
 * @param {string} color css color
 * @param {object} [opts]
 * @param {number} [opts.size]
 * @param {number} [opts.opacity]
 */
export function createGlowSprite(color, opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.4, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: opts.opacity ?? 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  const size = opts.size ?? 1.6;
  sprite.scale.set(size, size, 1);
  return sprite;
}
