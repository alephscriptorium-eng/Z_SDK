/**
 * View kit · marker factory — simple role/actor meshes shared by views.
 */

import * as THREE from 'three';

const GEOMETRIES = {
  sphere: () => new THREE.SphereGeometry(0.4, 12, 12),
  octahedron: () => new THREE.OctahedronGeometry(0.5),
  box: () => new THREE.BoxGeometry(0.7, 0.7, 0.7),
  cone: () => new THREE.ConeGeometry(0.45, 0.9, 10),
  icosahedron: () => new THREE.IcosahedronGeometry(0.8, 1)
};

/** Deterministic distinct color for the i-th anonymous actor. */
export function colorForIndex(index) {
  const hue = (index * 0.137) % 1;
  return new THREE.Color().setHSL(hue, 0.7, 0.55);
}

/**
 * @param {object} scene THREE scene
 * @param {object} [opts]
 * @param {keyof typeof GEOMETRIES} [opts.shape]
 * @param {number|object} [opts.color]
 * @param {number} [opts.scale]
 * @param {boolean} [opts.wireframe]
 */
export function createMarker(scene, opts = {}) {
  const make = GEOMETRIES[opts.shape] || GEOMETRIES.sphere;
  const mesh = new THREE.Mesh(
    make(),
    new THREE.MeshBasicMaterial({ color: opts.color ?? 0xffffff, wireframe: opts.wireframe ?? false })
  );
  if (opts.scale) mesh.scale.setScalar(opts.scale);
  scene.add(mesh);
  return mesh;
}

/** Center hub marker (the session master / origin of the room). */
export function createHub(scene, opts = {}) {
  const hub = createMarker(scene, {
    shape: 'icosahedron',
    color: opts.color ?? 0x00ff41,
    wireframe: true
  });
  if (opts.position) hub.position.copy(opts.position);
  return hub;
}

/**
 * Black hole element — a dark sphere with a slowly precessing accretion
 * ring. Views use it as the sink where unclassified traffic and silent
 * peers fall.
 */
export function createBlackHole(scene, opts = {}) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(opts.radius ?? 1.4, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry((opts.radius ?? 1.4) * 1.7, 0.07, 10, 48),
    new THREE.MeshBasicMaterial({ color: opts.ringColor ?? 0x8844ff })
  );
  ring.rotation.x = Math.PI / 2.4;
  group.add(core, ring);
  if (opts.position) group.position.copy(opts.position);
  scene.add(group);

  return {
    group,
    position: group.position,
    /** Call per-frame: precess the accretion ring. */
    update(dt) {
      ring.rotation.z += dt * (opts.spin ?? 0.6);
      group.rotation.y += dt * 0.15;
    }
  };
}
