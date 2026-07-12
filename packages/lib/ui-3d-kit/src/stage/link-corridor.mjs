/**
 * Link corridor — cyberpunk grid corridor for a gamemap "enlace".
 *
 * Port of gea-sdk/packages/game/gamethings/recursos/scripts/generate-link-corridor.mjs
 * plus `createLinkCorridorBetween` to place the corridor between two
 * world-space points (engine link endpoints).
 *
 * Browser-safe: `three` resolves via import map.
 */

import * as THREE from 'three';

const MATRIX_GREEN = 0x00ff41;
const VOID = 0x050508;
const CYAN = 0x00d4ff;

/**
 * Corridor group along local +Z, origin at z=0.
 * @param {object} [opts]
 * @param {number} [opts.length=12]
 * @param {number} [opts.width=2]
 * @param {number} [opts.height=3]
 * @param {number} [opts.segments=20]
 * @returns {THREE.Group}
 */
export function createLinkCorridor(opts = {}) {
  const length = opts.length ?? 12;
  const width = opts.width ?? 2;
  const height = opts.height ?? 3;
  const segments = opts.segments ?? 20;

  const group = new THREE.Group();
  group.name = 'link-corridor';

  // Grid floor
  const floorGeo = new THREE.PlaneGeometry(width, length, 1, segments);
  const floorMat = new THREE.MeshBasicMaterial({
    color: VOID,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, length / 2);
  group.add(floor);

  // Active center line (progress path visual)
  const pathPoints = [
    new THREE.Vector3(0, 0.02, 0),
    new THREE.Vector3(0, 0.02, length),
  ];
  const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
  const pathMat = new THREE.LineBasicMaterial({ color: MATRIX_GREEN });
  group.add(new THREE.Line(pathGeo, pathMat));

  // Side rails
  for (const side of [-1, 1]) {
    const railPoints = [
      new THREE.Vector3(side * (width / 2), 0.05, 0),
      new THREE.Vector3(side * (width / 2), 0.05, length),
    ];
    const railGeo = new THREE.BufferGeometry().setFromPoints(railPoints);
    const railMat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.6 });
    group.add(new THREE.Line(railGeo, railMat));
  }

  // Top frame (tunnel)
  const topGeo = new THREE.BoxGeometry(width, 0.05, length);
  const topMat = new THREE.MeshBasicMaterial({
    color: MATRIX_GREEN,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.set(0, height, length / 2);
  group.add(top);

  return group;
}

/**
 * Corridor positioned/rotated between two world points {x,y,z}
 * (e.g. first and last waypoints of an engine link). Length is derived
 * from the distance between the points.
 * @param {{x:number,y:number,z:number}} from
 * @param {{x:number,y:number,z:number}} to
 * @param {object} [opts] forwarded to createLinkCorridor (length is overridden)
 * @returns {THREE.Group}
 */
export function createLinkCorridorBetween(from, to, opts = {}) {
  const start = new THREE.Vector3(from.x, from.y, from.z);
  const end = new THREE.Vector3(to.x, to.y, to.z);
  const length = start.distanceTo(end) || 1;

  const group = createLinkCorridor({ ...opts, length });
  group.position.copy(start);
  group.lookAt(end); // local +Z points from `from` to `to`
  return group;
}

/**
 * Sample progress 0..1 along the corridor's local Z axis (origin at z=0).
 * @returns {{position: THREE.Vector3, tangent: THREE.Vector3}}
 */
export function sampleLinkPath(progress, length = 12) {
  const t = Math.max(0, Math.min(1, progress));
  return {
    position: new THREE.Vector3(0, 0, t * length),
    tangent: new THREE.Vector3(0, 0, 1),
  };
}
