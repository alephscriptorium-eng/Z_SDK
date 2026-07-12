/**
 * AnimationController — property tween engine for three.js objects.
 *
 * Ported from gea-sdk threejs-gamify-ui `AnimationController` (Angular):
 *   - `@Injectable` removed → plain factory `createAnimationController()`.
 *   - RxJS `animationCount$` / `performanceStats$` BehaviorSubjects →
 *     `onStats(cb)` plain callback (fired every 60 update frames).
 *
 * Browser-safe: `three` resolves via import map.
 */

import * as THREE from 'three';

/**
 * @typedef {object} AnimationConfig
 * @property {number} duration seconds
 * @property {'linear'|'easeIn'|'easeOut'|'easeInOut'} easing
 * @property {boolean} loop
 * @property {boolean} autoStart
 */

/**
 * @typedef {object} AnimationTarget
 * @property {object} object three.js Object3D (or any object with the property path)
 * @property {string} property dotted path, e.g. 'position.x' or 'material.opacity'
 * @property {*} startValue
 * @property {*} endValue
 */

function applyEasing(progress, easing) {
  switch (easing) {
    case 'linear':
      return progress;
    case 'easeIn':
      return progress * progress;
    case 'easeOut':
      return 1 - Math.pow(1 - progress, 2);
    case 'easeInOut':
      return progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    default:
      return progress;
  }
}

function isVector3Like(value) {
  return Boolean(
    value && typeof value === 'object'
    && 'x' in value && 'y' in value && 'z' in value
    && typeof value.set === 'function' && !('order' in value),
  );
}

function isEulerLike(value) {
  return Boolean(
    value && typeof value === 'object'
    && 'x' in value && 'y' in value && 'z' in value
    && 'order' in value && typeof value.set === 'function',
  );
}

function getObjectProperty(object, path) {
  const parts = path.split('.');
  let current = object;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  // Clone three.js math objects to avoid reference aliasing
  if (isEulerLike(current)) {
    return new THREE.Euler(current.x, current.y, current.z, current.order);
  }
  if (isVector3Like(current)) {
    return new THREE.Vector3(current.x, current.y, current.z);
  }
  return current;
}

function setObjectProperty(object, path, value) {
  const parts = path.split('.');
  let current = object;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return;
    }
  }
  const lastPart = parts[parts.length - 1];
  if (!current || typeof current !== 'object' || !(lastPart in current)) return;

  const existing = current[lastPart];
  if ((isVector3Like(existing) || isEulerLike(existing))
    && value && typeof value === 'object'
    && 'x' in value && 'y' in value && 'z' in value) {
    existing.set(value.x, value.y, value.z);
  } else {
    current[lastPart] = value;
  }
}

function updateAnimationTarget(target, progress) {
  const { startValue, endValue } = target;

  if (typeof startValue === 'number' && typeof endValue === 'number') {
    target.currentValue = startValue + (endValue - startValue) * progress;
  } else if (startValue instanceof THREE.Vector3 && endValue instanceof THREE.Vector3) {
    if (!(target.currentValue instanceof THREE.Vector3)) {
      target.currentValue = new THREE.Vector3();
    }
    target.currentValue.copy(startValue).lerp(endValue, progress);
  } else if (startValue instanceof THREE.Euler && endValue instanceof THREE.Euler) {
    if (!(target.currentValue instanceof THREE.Euler)) {
      target.currentValue = new THREE.Euler();
    }
    target.currentValue.set(
      THREE.MathUtils.lerp(startValue.x, endValue.x, progress),
      THREE.MathUtils.lerp(startValue.y, endValue.y, progress),
      THREE.MathUtils.lerp(startValue.z, endValue.z, progress),
      startValue.order,
    );
  } else if (startValue instanceof THREE.Color && endValue instanceof THREE.Color) {
    if (!(target.currentValue instanceof THREE.Color)) {
      target.currentValue = new THREE.Color();
    }
    target.currentValue.copy(startValue).lerp(endValue, progress);
  } else {
    target.currentValue = progress < 0.5 ? startValue : endValue;
  }

  setObjectProperty(target.object, target.property, target.currentValue);
}

export function createAnimationController() {
  const animations = new Map();
  const clock = new THREE.Clock();
  let isRunning = false;

  const statsCallbacks = new Set();
  let frameCount = 0;
  let totalFrameTime = 0;

  function emitStats(frameTime) {
    frameCount += 1;
    totalFrameTime += frameTime;
    if (frameCount % 60 === 0) {
      const stats = {
        activeAnimations: controller.getActiveAnimations().length,
        totalAnimations: animations.size,
        averageFrameTime: totalFrameTime / frameCount,
      };
      for (const cb of statsCallbacks) cb(stats);
      frameCount = 0;
      totalFrameTime = 0;
    }
  }

  const controller = {
    start() {
      if (isRunning) return;
      isRunning = true;
      clock.start();
    },

    stop() {
      isRunning = false;
    },

    /**
     * Advance all playing animations. Call once per render frame
     * (e.g. from `sceneManager.onBeforeRender`).
     */
    update() {
      if (!isRunning) return;

      const startTime = (globalThis.performance ?? Date).now();
      clock.getDelta();
      const currentTime = clock.elapsedTime;

      const animationsToRemove = [];

      animations.forEach((animation, id) => {
        if (!animation.isPlaying) return;

        const elapsed = currentTime - animation.startTime;
        animation.progress = Math.min(elapsed / animation.config.duration, 1.0);

        const easedProgress = applyEasing(animation.progress, animation.config.easing);
        animation.targets.forEach((target) => {
          updateAnimationTarget(target, easedProgress);
        });

        if (animation.onUpdate) animation.onUpdate(animation.progress);

        if (animation.progress >= 1.0) {
          if (animation.config.loop) {
            animation.startTime = currentTime;
            animation.progress = 0;
          } else {
            animationsToRemove.push(id);
            if (animation.onComplete) animation.onComplete();
          }
        }
      });

      animationsToRemove.forEach((id) => animations.delete(id));
      emitStats(((globalThis.performance ?? Date).now()) - startTime);
    },

    /**
     * @param {string} id
     * @param {AnimationTarget[]} targets
     * @param {Partial<AnimationConfig> & {onComplete?: () => void, onUpdate?: (p:number) => void}} [config]
     */
    createAnimation(id, targets, config = {}) {
      const { onComplete, onUpdate, ...rest } = config;
      const fullConfig = {
        duration: 1.0,
        easing: 'easeInOut',
        loop: false,
        autoStart: true,
        ...rest,
      };

      targets.forEach((target) => {
        if (target.startValue === undefined) {
          target.startValue = getObjectProperty(target.object, target.property);
        }
        target.currentValue = target.startValue;
      });

      const animation = {
        id,
        targets,
        config: fullConfig,
        progress: 0,
        isPlaying: fullConfig.autoStart,
        startTime: clock.elapsedTime,
        onComplete,
        onUpdate,
      };

      animations.set(id, animation);
      return animation;
    },

    animateProperty(id, object, property, endValue, config) {
      return controller.createAnimation(id, [{
        object,
        property,
        startValue: getObjectProperty(object, property),
        endValue,
      }], config);
    },

    animatePosition(id, object, targetPosition, config) {
      return controller.createAnimation(id, [
        { object, property: 'position.x', startValue: object.position.x, endValue: targetPosition.x },
        { object, property: 'position.y', startValue: object.position.y, endValue: targetPosition.y },
        { object, property: 'position.z', startValue: object.position.z, endValue: targetPosition.z },
      ], config);
    },

    animateRotation(id, object, targetRotation, config) {
      return controller.createAnimation(id, [
        { object, property: 'rotation.x', startValue: object.rotation.x, endValue: targetRotation.x },
        { object, property: 'rotation.y', startValue: object.rotation.y, endValue: targetRotation.y },
        { object, property: 'rotation.z', startValue: object.rotation.z, endValue: targetRotation.z },
      ], config);
    },

    animateScale(id, object, targetScale, config) {
      const scale = typeof targetScale === 'number'
        ? new THREE.Vector3(targetScale, targetScale, targetScale)
        : targetScale;
      return controller.createAnimation(id, [
        { object, property: 'scale.x', startValue: object.scale.x, endValue: scale.x },
        { object, property: 'scale.y', startValue: object.scale.y, endValue: scale.y },
        { object, property: 'scale.z', startValue: object.scale.z, endValue: scale.z },
      ], config);
    },

    play(id) {
      const animation = animations.get(id);
      if (!animation) return false;
      animation.isPlaying = true;
      animation.startTime = clock.elapsedTime - (animation.progress * animation.config.duration);
      return true;
    },

    pause(id) {
      const animation = animations.get(id);
      if (!animation) return false;
      animation.isPlaying = false;
      return true;
    },

    stopAnimation(id) {
      const animation = animations.get(id);
      if (!animation) return false;
      animation.isPlaying = false;
      animation.progress = 0;
      animation.startTime = clock.elapsedTime;
      animation.targets.forEach((target) => {
        setObjectProperty(target.object, target.property, target.startValue);
      });
      return true;
    },

    removeAnimation(id) {
      return animations.delete(id);
    },

    getAnimation(id) {
      return animations.get(id);
    },

    isAnimationPlaying(id) {
      const animation = animations.get(id);
      return animation ? animation.isPlaying : false;
    },

    getActiveAnimations() {
      return Array.from(animations.values()).filter((anim) => anim.isPlaying);
    },

    /**
     * Subscribe to performance stats (every 60 update frames).
     * Returns an unsubscribe fn.
     * (Replaces the Angular service's `performanceStats$` observable.)
     */
    onStats(cb) {
      statsCallbacks.add(cb);
      return () => statsCallbacks.delete(cb);
    },

    clearAll() {
      animations.clear();
    },

    dispose() {
      controller.stop();
      controller.clearAll();
      statsCallbacks.clear();
    },
  };

  return controller;
}
