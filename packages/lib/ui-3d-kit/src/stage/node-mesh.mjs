/**
 * Node mesh — procedural platform marker for a gamemap "nodo".
 * Companion to link-corridor / anchor-marker (same cyberpunk-grid palette).
 *
 * Browser-safe: `three` resolves via import map.
 */

import * as THREE from 'three';

const MATRIX_GREEN = 0x00ff41;
const VOID = 0x050508;
const CYAN = 0x00d4ff;

/**
 * @param {object} [opts]
 * @param {number} [opts.radius=3]
 * @param {number} [opts.color=CYAN] accent color (ring + pillar)
 * @param {number} [opts.segments=32]
 * @param {string} [opts.name] group name (e.g. the node id)
 * @returns {THREE.Group}
 */
export function createNodeMesh(opts = {}) {
  const radius = opts.radius ?? 3;
  const color = opts.color ?? CYAN;
  const segments = opts.segments ?? 32;

  const group = new THREE.Group();
  group.name = opts.name ?? 'node-mesh';

  // Floor disc (dark, slightly translucent)
  const floorGeo = new THREE.CircleGeometry(radius, segments);
  const floorMat = new THREE.MeshBasicMaterial({
    color: VOID,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  group.add(floor);

  // Perimeter ring (accent)
  const ringGeo = new THREE.RingGeometry(radius * 0.94, radius, segments);
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);

  // Wireframe grid dome hint
  const domeGeo = new THREE.SphereGeometry(radius, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshBasicMaterial({
    color: MATRIX_GREEN,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  });
  group.add(new THREE.Mesh(domeGeo, domeMat));

  // Central light pillar
  const pillarGeo = new THREE.CylinderGeometry(0.05, 0.05, radius, 6, 1, true);
  const pillarMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
  });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = radius / 2;
  group.add(pillar);

  return group;
}
