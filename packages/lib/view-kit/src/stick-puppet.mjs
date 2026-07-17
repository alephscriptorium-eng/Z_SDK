/**
 * Monigote stick procedural (WP-07) — misma interfaz duck-type que
 * loadPuppet de ui-3d-kit: { object, setPosition, setHeading, setBase,
 * playAdditive, setLabel, update, dispose }.
 *
 * Esqueleto de ~13 articulaciones (cabeza esfera wireframe, columna, 2
 * brazos de 2 segmentos, 2 piernas de 2 segmentos) hecho con cilindros
 * finos y cinemática directa paramétrica: las poses viven en
 * stick-poses.mjs (puro seno/coseno, testeable sin three). Sin skinning —
 * barato para multitudes.
 */

import * as THREE from 'three';
import { basePose, additivePose, blendPose, EMOTE_DURATION_SEC } from './stick-poses.mjs';
import { createLabelSprite } from './labels.mjs';

// Medidas del monigote (unidades de mundo)
const HIP_Y = 0.86;        // altura de la pelvis con piernas estiradas
const THIGH_LEN = 0.42;
const SHIN_LEN = 0.40;
const TORSO_LEN = 0.52;
const UPPER_ARM_LEN = 0.30;
const FOREARM_LEN = 0.28;
const HEAD_RADIUS = 0.11;
const LIMB_RADIUS = 0.032;

/** Color estable por identidad: hash del id → HSL vivo. */
export function colorForActorId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const hue = (hash % 360) / 360;
  const color = new THREE.Color();
  color.setHSL(hue, 0.75, 0.6);
  return color;
}

/** Segmento que cuelga del origen de su grupo articulación, hacia -Y. */
function makeSegment(length, material) {
  const geometry = new THREE.CylinderGeometry(LIMB_RADIUS, LIMB_RADIUS * 0.85, length, 5);
  geometry.translate(0, -length / 2, 0);
  return new THREE.Mesh(geometry, material);
}

/**
 * @param {object} [opts]
 * @param {THREE.Color|string|number} [opts.color] color de identidad
 * @returns puppet duck-type (contrato loadPuppet)
 */
export function createStickPuppet(opts = {}) {
  const color = opts.color instanceof THREE.Color ? opts.color : new THREE.Color(opts.color ?? 0x00d4ff);
  const limbMat = new THREE.MeshBasicMaterial({ color });
  const headMat = new THREE.MeshBasicMaterial({ color, wireframe: true });

  const root = new THREE.Group();
  root.name = 'stick-puppet';

  // body: pitch (lean) + altura de pelvis; todo lo demás cuelga de aquí
  const body = new THREE.Group();
  body.position.y = HIP_Y;
  root.add(body);

  // --- piernas ---------------------------------------------------------
  function makeLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.1, 0, 0);
    hip.add(makeSegment(THIGH_LEN, limbMat));
    const knee = new THREE.Group();
    knee.position.y = -THIGH_LEN;
    knee.add(makeSegment(SHIN_LEN, limbMat));
    hip.add(knee);
    body.add(hip);
    return { hip, knee };
  }
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  // --- columna + pecho -------------------------------------------------
  const spine = new THREE.Group();
  body.add(spine);
  const torsoGeom = new THREE.CylinderGeometry(LIMB_RADIUS, LIMB_RADIUS, TORSO_LEN, 5);
  torsoGeom.translate(0, TORSO_LEN / 2, 0); // el torso SUBE desde la pelvis
  spine.add(new THREE.Mesh(torsoGeom, limbMat));

  // --- cabeza -----------------------------------------------------------
  const neck = new THREE.Group();
  neck.position.y = TORSO_LEN;
  spine.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_RADIUS, 8, 6), headMat);
  head.position.y = HEAD_RADIUS + 0.05;
  neck.add(head);

  // --- brazos -----------------------------------------------------------
  function makeArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.17, TORSO_LEN - 0.05, 0);
    shoulder.add(makeSegment(UPPER_ARM_LEN, limbMat));
    const elbow = new THREE.Group();
    elbow.position.y = -UPPER_ARM_LEN;
    elbow.add(makeSegment(FOREARM_LEN, limbMat));
    shoulder.add(elbow);
    spine.add(shoulder);
    return { shoulder, elbow };
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // --- estado de animación ----------------------------------------------
  let base = 'idle';
  let emote = null;
  let emoteStart = 0;
  let elapsed = Math.random() * 10; // desfase para que la multitud no respire al unísono
  let labelSprite = null;

  function applyPose(p) {
    body.position.y = HIP_Y - p.crouch + p.bob;
    body.rotation.x = p.lean;

    spine.rotation.x = p.spineBend;
    spine.rotation.y = p.spineTwist;

    neck.rotation.x = p.headNod;
    neck.rotation.y = p.headTurn;
    neck.rotation.z = p.headTilt;

    // brazos: swing = rotación X; raise = rotación Z espejada por lado;
    // el codo flexiona el antebrazo hacia delante.
    armL.shoulder.rotation.x = p.armSwingL;
    armL.shoulder.rotation.z = p.armRaiseL;
    armL.elbow.rotation.x = -p.elbowL;
    armR.shoulder.rotation.x = p.armSwingR;
    armR.shoulder.rotation.z = -p.armRaiseR;
    armR.elbow.rotation.x = -p.elbowR;

    legL.hip.rotation.x = p.legSwingL;
    legL.knee.rotation.x = p.kneeL;
    legR.hip.rotation.x = p.legSwingR;
    legR.knee.rotation.x = p.kneeR;
  }

  applyPose(basePose(base, elapsed));

  return {
    /** Object3D raíz — añádelo a tu escena. */
    object: root,

    /** Contrato del adapter: acepta {x,y,z} o (x, y, z). */
    setPosition(x, y, z) {
      if (typeof x === 'object' && x !== null) root.position.set(x.x, x.y, x.z);
      else root.position.set(x, y, z);
    },

    /** Heading en radianes alrededor de Y. */
    setHeading(rad) {
      root.rotation.y = rad;
    },

    /** Pose base ('idle'|'walk'|'ride'|'swim'|'sit'|'menu'). */
    setBase(name) {
      base = name;
      return true;
    },

    /** Emote aditivo temporal (~1.5 s) sobre la pose base. */
    playAdditive(name) {
      emote = name;
      emoteStart = elapsed;
      return true;
    },

    /** Etiqueta flotante (id del actor). null la quita. */
    setLabel(text, labelOpts = {}) {
      if (labelSprite) {
        root.remove(labelSprite);
        labelSprite.material.map?.dispose();
        labelSprite.material.dispose();
        labelSprite = null;
      }
      if (!text) return;
      labelSprite = createLabelSprite(text, { color: `#${color.getHexString()}`, size: labelOpts.size ?? 1.6 });
      labelSprite.position.y = labelOpts.height ?? 1.85;
      root.add(labelSprite);
    },

    getPose: () => base,

    /** Avanza la cinemática. @param {number} dt segundos */
    update(dt) {
      elapsed += dt;
      let pose = basePose(base, elapsed);
      if (emote) {
        const t = elapsed - emoteStart;
        if (t >= EMOTE_DURATION_SEC) emote = null;
        else pose = blendPose(pose, additivePose(emote, t));
      }
      applyPose(pose);
    },

    dispose() {
      this.setLabel(null);
      root.removeFromParent();
      root.traverse((obj) => {
        if (obj.isMesh) obj.geometry?.dispose();
      });
      limbMat.dispose();
      headMat.dispose();
    }
  };
}
