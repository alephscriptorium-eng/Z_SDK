/**
 * Anchor marker — visual marker for a gamemap "ancla" (sit slot etc.).
 * Procedural by default; optionally wraps a pre-loaded GLB (e.g. the
 * SheenChair.glb placeholder in assets/models/) via `opts.model`.
 *
 * Browser-safe: `three` / `three/addons/*` resolve via import map.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MATRIX_GREEN = 0x00ff41;
const CYAN = 0x00d4ff;

/**
 * @param {object} [opts]
 * @param {{x:number,y:number,z:number}} [opts.position]
 * @param {number} [opts.facing] degrees around Y (engine `facing` convention)
 * @param {THREE.Object3D} [opts.model] pre-loaded model (e.g. SheenChair scene);
 *   added inside the marker group. Load with `loadAnchorModel(url)`.
 * @param {number} [opts.modelScale=1]
 * @param {number} [opts.color=MATRIX_GREEN] ring accent color
 * @param {string} [opts.name] group name (e.g. the anchor id)
 * @returns {THREE.Group}
 */
export function createAnchorMarker(opts = {}) {
  const color = opts.color ?? MATRIX_GREEN;

  const group = new THREE.Group();
  group.name = opts.name ?? 'anchor-marker';

  // Ground ring (always present so anchors are findable without a model)
  const ringGeo = new THREE.RingGeometry(0.45, 0.6, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);

  if (opts.model) {
    const model = opts.model;
    if (opts.modelScale) model.scale.setScalar(opts.modelScale);
    group.add(model);
  } else {
    // Procedural seat: box + backrest, wireframe accent
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x101418,
      emissive: CYAN,
      emissiveIntensity: 0.08,
      metalness: 0.2,
      roughness: 0.8,
    });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), seatMat);
    seat.position.y = 0.42;
    seat.castShadow = true;
    group.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), seatMat);
    back.position.set(0, 0.71, -0.22);
    back.castShadow = true;
    group.add(back);

    const legsGeo = new THREE.BoxGeometry(0.44, 0.38, 0.44);
    const legsMat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const legs = new THREE.Mesh(legsGeo, legsMat);
    legs.position.y = 0.19;
    group.add(legs);
  }

  if (opts.position) {
    group.position.set(opts.position.x, opts.position.y, opts.position.z);
  }
  if (opts.facing !== undefined) {
    group.rotation.y = THREE.MathUtils.degToRad(opts.facing);
  }

  return group;
}

let sharedLoader = null;

/**
 * Load a GLB to use as anchor model (e.g. '/assets/models/SheenChair.glb').
 * Returns the gltf scene, ready to pass as `opts.model`.
 * @param {string} url
 * @param {GLTFLoader} [loader]
 * @returns {Promise<THREE.Object3D>}
 */
export async function loadAnchorModel(url, loader) {
  const gltfLoader = loader ?? (sharedLoader ??= new GLTFLoader());
  const gltf = await gltfLoader.loadAsync(url);
  return gltf.scene;
}
