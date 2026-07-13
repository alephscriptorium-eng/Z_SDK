/**
 * Flow-engine: la Riada. Grifos con presión, ríos de gotas y el mar que
 * acumula cristales (etiquetado) o murk (vertido). Motor lógico puro, sin
 * red ni render — mismo espíritu que map-engine de @zeus/game-engine.
 */

import { sampleLink, linkDistance } from '@zeus/game-engine';

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/** Velocidad residual: las gotas ya en cauce siguen bajando con grifo cerrado. */
const RESIDUAL_FLOW = 0.25;
/** Ventana de progreso para "la gota bajo los pies" (etiquetar montado). */
export const LABEL_WINDOW = 0.08;

export function createFlowEngine(scene, firehoseFeed) {
  const taps = {};
  for (const [id, def] of Object.entries(scene.taps)) {
    taps[id] = {
      ...def,
      pressure: 0,
      state: 'ok', // ok | burst | cooldown
      burstRemainingSec: 0,
      cooldownRemainingSec: 0,
      spawnAccum: 0
    };
  }

  const rivers = {};
  for (const [id, def] of Object.entries(scene.rios)) {
    rivers[id] = { def, distance: linkDistance(def.waypoints), droplets: [] };
  }

  const sea = {
    crystals: 0,
    murk: 0,
    murkCapacity: scene.mar.murkCapacity,
    collapsed: false
  };

  let dropletSeq = 0;
  const events = [];

  function pushEvent(kind, payload) {
    events.push({ kind, ts: Date.now(), ...payload });
  }

  function riverSpeed(riverId) {
    const river = rivers[riverId];
    const tap = taps[river.def.tapId];
    return river.def.flowSpeed * Math.max(RESIDUAL_FLOW, tap.aperture);
  }

  function tickTap(tap, dt) {
    if (tap.state === 'burst') {
      tap.burstRemainingSec -= dt;
      sea.murk += tap.floodMurkRate * dt;
      if (tap.burstRemainingSec <= 0) {
        tap.state = 'cooldown';
        tap.cooldownRemainingSec = tap.burstCooldownSec;
        tap.pressure = 0.5;
      }
      return;
    }
    if (tap.state === 'cooldown') {
      tap.cooldownRemainingSec -= dt;
      if (tap.cooldownRemainingSec <= 0) tap.state = 'ok';
      return;
    }
    // Regla de presión (contrato §2): el firehose empuja aunque no lo mires.
    tap.pressure = clamp(
      tap.pressure + tap.inflowRate * dt * (1 - tap.aperture) - tap.releaseRate * dt * tap.aperture,
      0,
      1
    );
    if (tap.pressure >= 1) {
      tap.state = 'burst';
      tap.burstRemainingSec = tap.burstDurationSec;
      pushEvent('burst', { tapId: tap.id, riverId: tap.riverId });
      return;
    }
    if (tap.aperture > 0) {
      tap.spawnAccum += tap.spawnRate * tap.aperture * dt;
      while (tap.spawnAccum >= 1) {
        tap.spawnAccum -= 1;
        const [ref] = firehoseFeed.nextDroplets(1);
        dropletSeq += 1;
        rivers[tap.riverId].droplets.push({
          id: `d${dropletSeq}`,
          riverId: tap.riverId,
          progress: 0,
          ref,
          label: null,
          state: 'flowing'
        });
      }
    }
  }

  function tickRiver(river, dt) {
    const speed = riverSpeed(river.def.id);
    const arrived = [];
    for (const droplet of river.droplets) {
      droplet.progress += (speed * dt) / river.distance;
      if (droplet.progress >= 1) arrived.push(droplet);
    }
    for (const droplet of arrived) {
      river.droplets.splice(river.droplets.indexOf(droplet), 1);
      if (droplet.label) {
        sea.crystals += 1;
        Promise.resolve(firehoseFeed.commitLabel(droplet.ref, droplet.label)).catch((err) => {
          pushEvent('commit:error', {
            dropletId: droplet.id,
            ref: droplet.ref,
            label: droplet.label,
            message: err?.message ?? String(err)
          });
        });
        pushEvent('crystal', { dropletId: droplet.id, ref: droplet.ref, label: droplet.label });
      } else {
        sea.murk += 1;
        pushEvent('murk', { dropletId: droplet.id, ref: droplet.ref });
      }
    }
  }

  return {
    taps,
    sea,

    setAperture(tapId, value) {
      const tap = taps[tapId];
      if (!tap) return false;
      tap.aperture = clamp(Number(value), 0, 1);
      return true;
    },

    /** Etiquetar una gota en cauce (cristaliza al llegar al mar). */
    labelDroplet(riverId, dropletId, label, actorId = null) {
      const river = rivers[riverId];
      if (!river) return { ok: false, error: 'rio_invalido' };
      const droplet = river.droplets.find((d) => d.id === dropletId);
      if (!droplet || droplet.state !== 'flowing') return { ok: false, error: 'gota_invalida' };
      if (droplet.label) return { ok: false, error: 'ya_etiquetada' };
      droplet.label = label;
      pushEvent('label', { dropletId, riverId, label, actorId, ref: droplet.ref });
      return { ok: true, ref: droplet.ref };
    },

    riverSpeed,
    riverDistance: (riverId) => rivers[riverId].distance,
    sampleRiver: (riverId, progress) => sampleLink(rivers[riverId].def.waypoints, progress),
    droplets: (riverId) => rivers[riverId].droplets,

    /** Gota "bajo los pies" de un progreso dado (para label:cast y track). */
    dropletUnder(riverId, progress, window = LABEL_WINDOW) {
      const river = rivers[riverId];
      if (!river) return null;
      let best = null;
      let bestDist = window;
      for (const droplet of river.droplets) {
        const dist = Math.abs(droplet.progress - progress);
        if (dist <= bestDist) {
          best = droplet;
          bestDist = dist;
        }
      }
      return best;
    },

    tick(dt) {
      if (sea.collapsed) return;
      for (const tap of Object.values(taps)) tickTap(tap, dt);
      for (const river of Object.values(rivers)) tickRiver(river, dt);
      if (sea.murk > sea.murkCapacity && !sea.collapsed) {
        sea.collapsed = true;
        pushEvent('collapse', { murk: sea.murk, capacity: sea.murkCapacity });
      }
    },

    /** Ríos compactos para arg:state (G-ARG.5): [[id, progress, state, label, uri]].
     *  La uri (5º slot) alimenta el inspector HTML (WP-25): los MENSAJES del
     *  cauce tienen que poder leerse fuera del canvas. */
    snapshot() {
      const riversOut = {};
      for (const [id, river] of Object.entries(rivers)) {
        riversOut[id] = {
          droplets: river.droplets.map((d) => [
            d.id,
            Math.round(d.progress * 1000) / 1000,
            d.label ? 'crystal' : d.state,
            d.label ?? null,
            d.ref?.uri ?? null
          ])
        };
      }
      const tapsOut = {};
      for (const [id, tap] of Object.entries(taps)) {
        tapsOut[id] = {
          aperture: Math.round(tap.aperture * 100) / 100,
          pressure: Math.round(tap.pressure * 1000) / 1000,
          state: tap.state
        };
      }
      return {
        taps: tapsOut,
        rivers: riversOut,
        sea: {
          crystals: sea.crystals,
          murk: Math.round(sea.murk * 100) / 100,
          murkCapacity: sea.murkCapacity,
          collapsed: sea.collapsed
        }
      };
    },

    drainEvents() {
      const out = [...events];
      events.length = 0;
      return out;
    }
  };
}
