/**
 * Segment a long viaje into milestones — same rule family as segmentar historial.
 */

import { applyMilestoneRules } from '../tools/milestone-rules.mjs';
import { buildRecorrido } from './cache.mjs';

/**
 * Mark pasos as milestones using kit milestone rules (byte_delta / keywords / editors).
 * Each paso may carry `byte_delta`, `summary`, `user` in meta for rule input.
 *
 * @param {object} recorrido — viaje-recorrido shaped object
 * @param {{
 *   byteDeltaThreshold?: number,
 *   keywords?: string[],
 *   editorAllowlist?: Set<string>|string[],
 *   everyNHops?: number
 * }} [opts]
 */
export function segmentarViaje(recorrido, opts = {}) {
  if (!recorrido || !Array.isArray(recorrido.pasos)) {
    return {
      ok: false,
      error: 'recorrido.pasos required',
      rule: 'viaje.segmentar.args'
    };
  }

  const everyN = opts.everyNHops ?? 0;
  /** @type {string[]} */
  const milestones = [];
  const pasos = recorrido.pasos.map((paso, i) => {
    const raw = {
      oldid: i + 1,
      byte_delta: paso.byte_delta ?? paso.meta?.byte_delta ?? 0,
      summary: paso.summary ?? paso.meta?.summary ?? `${paso.from}→${paso.to}`,
      user: paso.user ?? paso.meta?.user ?? ''
    };
    const marked = applyMilestoneRules(raw, {
      byteDeltaThreshold: opts.byteDeltaThreshold,
      keywords: opts.keywords,
      editorAllowlist: opts.editorAllowlist
    });
    const forceEvery = everyN > 0 && (i + 1) % everyN === 0;
    const milestone = marked.milestone || forceEvery;
    const reasons = [
      ...(marked.milestone_reasons ?? []),
      ...(forceEvery ? ['every_n_hops'] : [])
    ];
    if (milestone) milestones.push(`${paso.from}->${paso.to}`);
    return {
      ...paso,
      milestone,
      milestone_reasons: reasons
    };
  });

  return buildRecorrido({
    ...recorrido,
    pasos,
    milestones,
    curation_status: recorrido.curation_status ?? 'candidate'
  });
}
