/**
 * Puppet — skinned character wrapper (Alephillo marioneta contract).
 *
 * Implements the animation contract from
 * gea-sdk/packages/game/gameobjects/alephillo/TECHNICAL.md:
 *   - base layer (locomotion/idle override): setBase('idle'|'walk'|'sit')
 *     with crossfade (0.2 s per spec).
 *   - additive layers (gestures): playAdditive(name) using
 *     THREE.AnimationUtils.makeClipAdditive, following the official
 *     three.js example webgl_animation_skinning_additive_blending.
 *
 * FALLBACK (documented): if the mapped clip is NOT additive-safe
 * (clipMap entry `additiveSafe: false`, e.g. all RobotExpressive emotes,
 * which are full-body override clips), playAdditive() falls back to a
 * temporary crossfade: base → gesture (LoopOnce) → back to base.
 *
 * Browser-safe: `three` / `three/addons/*` resolve via import map.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { resolveClipMap, resolveBaseClip, resolveAdditiveClip } from './clip-map.mjs';

const BASE_CROSSFADE_SEC = 0.2; // spec: crossfade locomoción 0.2 s
const ADDITIVE_FADE_SEC = 0.15;

let sharedLoader = null;

function makeLabelSprite(text, opts = {}) {
  const fontSize = opts.fontSize ?? 48;
  const padding = opts.padding ?? 16;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px sans-serif`;
  const textWidth = Math.ceil(ctx.measureText(text).width);
  canvas.width = textWidth + padding * 2;
  canvas.height = fontSize + padding * 2;

  // Re-set font after resize (canvas resize clears state)
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = opts.background ?? 'rgba(5, 5, 8, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = opts.color ?? '#00ff41';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const worldHeight = opts.worldHeight ?? 0.35;
  sprite.scale.set(worldHeight * (canvas.width / canvas.height), worldHeight, 1);
  return sprite;
}

/**
 * Load a skinned GLB and wrap it in the puppet interface.
 *
 * @param {string} url GLB url (served by the app, e.g. /assets/models/Xbot.glb)
 * @param {object} [options]
 * @param {object} [options.clipMap] clip map (see clip-map.mjs). Defaults to
 *   the DEFAULT_CLIP_MAPS entry matching the url basename.
 * @param {GLTFLoader} [options.loader] custom loader (e.g. with DRACO)
 * @param {number} [options.scale=1]
 * @param {boolean} [options.castShadow=true]
 * @param {number} [options.labelHeight=2.0] Y offset of the name label
 * @returns {Promise<object>} puppet
 */
export async function loadPuppet(url, options = {}) {
  const clipMap = options.clipMap ?? resolveClipMap(url);
  if (!clipMap) {
    throw new Error(`loadPuppet: no clip map for ${url} — pass options.clipMap`);
  }

  const loader = options.loader ?? (sharedLoader ??= new GLTFLoader());
  const gltf = await loader.loadAsync(url);

  const model = gltf.scene;
  if (options.scale) model.scale.setScalar(options.scale);
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = options.castShadow ?? true;
    }
  });

  // Root group: puppet position/heading is applied here, so animations that
  // move the inner model do not fight external placement.
  const group = new THREE.Group();
  group.name = `puppet:${url.split(/[?#]/)[0].split(/[\\/]/).pop()}`;
  group.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const clipsByName = new Map(gltf.animations.map((clip) => [clip.name, clip]));

  function getClip(realName) {
    const clip = clipsByName.get(realName);
    if (!clip) {
      console.warn(`puppet: clip "${realName}" not found in ${url}`);
    }
    return clip ?? null;
  }

  // --- Base layer -----------------------------------------------------
  const baseActions = new Map(); // specName -> AnimationAction
  let currentBase = null; // { specName, action }
  let currentPose = null;

  function getBaseAction(pose) {
    const resolved = resolveBaseClip(clipMap, pose);
    if (!resolved) return null;
    if (!baseActions.has(resolved.specName)) {
      const clip = getClip(resolved.clip);
      if (!clip) return null;
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      baseActions.set(resolved.specName, action);
    }
    return { specName: resolved.specName, action: baseActions.get(resolved.specName) };
  }

  function setBase(pose, { fade = BASE_CROSSFADE_SEC } = {}) {
    const next = getBaseAction(pose);
    if (!next) return false;
    if (currentBase && currentBase.specName === next.specName) {
      currentPose = pose;
      return true;
    }
    next.action.reset();
    next.action.setEffectiveWeight(1);
    if (currentBase) {
      next.action.crossFadeFrom(currentBase.action, fade, true);
    }
    next.action.play();
    currentBase = next;
    currentPose = pose;
    return true;
  }

  // --- Additive layer -------------------------------------------------
  const additiveActions = new Map(); // specName -> AnimationAction

  function getAdditiveAction(resolved) {
    if (additiveActions.has(resolved.specName)) {
      return additiveActions.get(resolved.specName);
    }
    let clip = getClip(resolved.clip);
    if (!clip) return null;
    if (resolved.poseFrame !== undefined) {
      // Single-frame pose clip (e.g. Xbot sneak_pose): reduce to one frame
      // before converting, per the official additive-blending example.
      clip = THREE.AnimationUtils.subclip(
        clip, resolved.specName, resolved.poseFrame, resolved.poseFrame + 1, 30,
      );
    } else {
      clip = clip.clone();
      clip.name = resolved.specName;
    }
    THREE.AnimationUtils.makeClipAdditive(clip);
    const action = mixer.clipAction(clip);
    action.blendMode = THREE.AdditiveAnimationBlendMode;
    additiveActions.set(resolved.specName, action);
    return action;
  }

  /**
   * Play a gesture on top of the base layer.
   * - additive-safe clips → true additive blend (weight ramp handled by mixer fades).
   * - NOT additive-safe (fallback, documented in module header): temporary
   *   crossfade base → gesture (LoopOnce) → base.
   * @param {string} name 'wave' | 'ALP_ADD_wave' | ...
   * @param {{weight?: number, fade?: number}} [opts]
   */
  function playAdditive(name, { weight = 1, fade = ADDITIVE_FADE_SEC } = {}) {
    const resolved = resolveAdditiveClip(clipMap, name);
    if (!resolved) return false;

    if (resolved.additiveSafe) {
      const action = getAdditiveAction(resolved);
      if (!action) return false;
      action.reset();
      action.setEffectiveWeight(weight);
      if (resolved.poseFrame === undefined) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = false;
      }
      action.fadeIn(fade);
      action.play();
      if (resolved.poseFrame === undefined) {
        const onFinished = (e) => {
          if (e.action === action) {
            action.fadeOut(fade);
            mixer.removeEventListener('finished', onFinished);
          }
        };
        mixer.addEventListener('finished', onFinished);
      }
      return true;
    }

    // Fallback: override crossfade (clip is not additive-safe)
    const clip = getClip(resolved.clip);
    if (!clip) return false;
    const gesture = mixer.clipAction(clip);
    gesture.setLoop(THREE.LoopOnce, 1);
    gesture.clampWhenFinished = false;
    gesture.reset();
    gesture.setEffectiveWeight(1);
    if (currentBase) {
      gesture.crossFadeFrom(currentBase.action, fade, true);
    }
    gesture.play();
    const onFinished = (e) => {
      if (e.action !== gesture) return;
      mixer.removeEventListener('finished', onFinished);
      if (currentBase) {
        currentBase.action.reset();
        currentBase.action.setEffectiveWeight(1);
        currentBase.action.crossFadeFrom(gesture, fade, true);
        currentBase.action.play();
      }
    };
    mixer.addEventListener('finished', onFinished);
    return true;
  }

  /** Fade out a still-active additive pose (e.g. sneak). */
  function stopAdditive(name, { fade = ADDITIVE_FADE_SEC } = {}) {
    const resolved = resolveAdditiveClip(clipMap, name);
    if (!resolved) return false;
    const action = additiveActions.get(resolved.specName);
    if (!action) return false;
    action.fadeOut(fade);
    return true;
  }

  // --- Label ------------------------------------------------------------
  let labelSprite = null;

  function setLabel(text, labelOpts = {}) {
    if (labelSprite) {
      group.remove(labelSprite);
      labelSprite.material.map?.dispose();
      labelSprite.material.dispose();
      labelSprite = null;
    }
    if (!text) return;
    labelSprite = makeLabelSprite(text, labelOpts);
    labelSprite.position.set(0, labelOpts.height ?? options.labelHeight ?? 2.0, 0);
    group.add(labelSprite);
  }

  const puppet = {
    /** Root Object3D — add this to your scene. */
    object: group,
    mixer,
    clipMap,
    /** Real clip names present in the GLB. */
    clipNames: [...clipsByName.keys()],

    setBase,
    playAdditive,
    stopAdditive,
    setLabel,

    getPose() {
      return currentPose;
    },

    /** Adapter contract: plain {x,y,z} — no three types required by callers. */
    setPosition(pos) {
      group.position.set(pos.x, pos.y, pos.z);
    },

    /** Adapter contract: heading in radians around Y. */
    setHeading(radians) {
      group.rotation.y = radians;
    },

    /** Advance mixer. @param {number} dt seconds */
    update(dt) {
      mixer.update(dt);
    },

    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      setLabel(null);
      group.removeFromParent();
      model.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
    },
  };

  // Start on idle by default so the puppet is never in bind pose.
  setBase('idle', { fade: 0 });

  return puppet;
}
