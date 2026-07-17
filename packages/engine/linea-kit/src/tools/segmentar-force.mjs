/**
 * segmentar-force — conversational contexts → scenes prompt/think/output.
 * Concept from segment_engine_template.py / IMPORT_NOTES.md (D-19).
 * Trace layer is dropped (layers_dropped: trace).
 */

import fs from 'node:fs';
import path from 'node:path';
import { validate } from '../validate.mjs';
import { ensureDir, exists, nowIso, writeJson, writeText } from './fs-util.mjs';

/** @typedef {'prompt'|'think'|'output'} SceneLayer */

/**
 * @typedef {object} SceneDef
 * @property {string} id
 * @property {string} slug
 * @property {string} [title]
 * @property {string} [session]
 * @property {[number, number]} [lines] — 1-based inclusive coverage range
 * @property {[number, number]|number} [prompt]
 * @property {[number, number]|number} [think]
 * @property {[number, number]|number} [output]
 * @property {number[]} [trace] — lines dropped (not written)
 * @property {string[]} [tags]
 * @property {string|string[]} [rol]
 * @property {string[]} [anomalies]
 * @property {boolean} [anchor]
 */

/**
 * @param {string[]} lines
 * @param {[number, number]|number|undefined} range — 1-based inclusive
 * @returns {string|null}
 */
function sliceLines(lines, range) {
  if (range == null) return null;
  if (typeof range === 'number') {
    const i = range - 1;
    if (i < 0 || i >= lines.length) return null;
    return lines[i];
  }
  const [start, end] = range;
  if (start < 1 || end < start) return null;
  return lines.slice(start - 1, end).join('\n');
}

/**
 * @param {SceneDef[]} scenes
 * @param {number} totalLines
 */
export function computeCoverage(scenes, totalLines) {
  const covered = new Set();
  let traceLineCount = 0;
  for (const scene of scenes) {
    if (scene.lines) {
      const [a, b] = scene.lines;
      for (let i = a; i <= b; i += 1) covered.add(i);
    }
    for (const layer of /** @type {SceneLayer[]} */ (['prompt', 'think', 'output'])) {
      const r = scene[layer];
      if (r == null) continue;
      if (typeof r === 'number') covered.add(r);
      else {
        for (let i = r[0]; i <= r[1]; i += 1) covered.add(i);
      }
    }
    for (const t of scene.trace ?? []) {
      traceLineCount += 1;
      covered.add(t);
    }
  }
  const covered_lines = covered.size;
  const ok = totalLines > 0 && covered_lines >= totalLines;
  return {
    total_lines: totalLines,
    covered_lines,
    ok,
    layers_dropped: ['trace'],
    trace_line_count: traceLineCount
  };
}

/**
 * @param {SceneDef[]} scenes
 */
function estimateLinesFromScenes(scenes) {
  let max = 0;
  for (const s of scenes) {
    if (s.lines) max = Math.max(max, s.lines[1]);
    for (const layer of ['prompt', 'think', 'output']) {
      const r = s[layer];
      if (typeof r === 'number') max = Math.max(max, r);
      else if (Array.isArray(r)) max = Math.max(max, r[1]);
    }
    for (const t of s.trace ?? []) max = Math.max(max, t);
  }
  return max;
}

/**
 * @param {{
 *   outDir: string,
 *   forceId: string,
 *   kind?: 'force'|'boot',
 *   rawText?: string,
 *   rawPath?: string,
 *   session?: string,
 *   scenes: SceneDef[],
 *   viewpoint?: string,
 *   lore?: string|null,
 *   triggers?: string[],
 *   pairsWith?: string[],
 *   type?: string,
 *   overwrite?: boolean
 * }} options
 */
export function segmentarForce(options) {
  if (!options.outDir || !options.forceId) {
    return {
      ok: false,
      error: 'outDir and forceId are required',
      rule: 'segmentar-force.args'
    };
  }
  if (!Array.isArray(options.scenes) || options.scenes.length === 0) {
    return {
      ok: false,
      error: 'scenes[] required',
      rule: 'segmentar-force.scenes'
    };
  }

  const forceDir = path.resolve(options.outDir);
  if (exists(path.join(forceDir, 'force.json')) && !options.overwrite) {
    return {
      ok: false,
      error: `force.json exists in ${forceDir} (pass overwrite: true)`,
      rule: 'segmentar-force.exists'
    };
  }

  let rawText = options.rawText ?? '';
  if (!rawText && options.rawPath) {
    const rawPath = path.resolve(options.rawPath);
    if (!exists(rawPath)) {
      return {
        ok: false,
        error: `raw not found: ${rawPath}`,
        rule: 'segmentar-force.raw_missing'
      };
    }
    rawText = fs.readFileSync(rawPath, 'utf8');
  }

  const lineArr = rawText ? rawText.split(/\r?\n/) : [];
  const totalLines = lineArr.length;
  const session = options.session ?? options.scenes[0]?.session ?? 'sesion-01';
  const coverage = computeCoverage(
    options.scenes,
    totalLines || estimateLinesFromScenes(options.scenes)
  );

  /** @type {object[]} */
  const manifestScenes = [];
  let anchor_scene = null;

  for (const scene of options.scenes) {
    const sceneSession = scene.session ?? session;
    ensureDir(path.join(forceDir, 'escenas', sceneSession, scene.slug));

    /** @type {Record<string, string|null>} */
    const files = {};
    const layers = {
      prompt: sliceLines(lineArr, scene.prompt),
      think: sliceLines(lineArr, scene.think),
      output: sliceLines(lineArr, scene.output)
    };

    /** @type {string[]} */
    const anomalies = [...(scene.anomalies ?? [])];

    for (const [layer, body] of Object.entries(layers)) {
      if (body == null || body === '') {
        files[layer] = null;
        continue;
      }
      const rel = `escenas/${sceneSession}/${scene.slug}/${layer}.md`;
      const front = [
        '---',
        `force: ${options.forceId}`,
        `scene: ${scene.id}`,
        `layer: ${layer}`,
        '---',
        '',
        body,
        ''
      ].join('\n');
      writeText(path.join(forceDir, rel), front);
      files[layer] = rel;
    }

    if ((scene.trace ?? []).length) {
      anomalies.push('trace_dropped');
    }

    const fileEntries = Object.fromEntries(Object.entries(files).filter(([, v]) => v != null));
    if (Object.keys(fileEntries).length === 0) {
      return {
        ok: false,
        error: `scene ${scene.id} has no prompt/think/output layers`,
        rule: 'segmentar-force.empty_scene'
      };
    }

    const relId = `${sceneSession}/${scene.slug}`;
    if (scene.anchor || !anchor_scene) anchor_scene = relId;

    const rol = scene.rol == null ? [] : Array.isArray(scene.rol) ? scene.rol : [scene.rol];

    manifestScenes.push({
      id: scene.id,
      session: sceneSession,
      slug: scene.slug,
      title: scene.title ?? scene.slug,
      rol,
      tags: scene.tags ?? [],
      files: fileEntries,
      anomalies,
      source: scene.lines ? { lines: scene.lines, format: 'line_range' } : { format: 'layers' }
    });
  }

  const kind = options.kind ?? 'force';
  const manifest = {
    id: options.forceId,
    kind,
    description: `Segmented by segmentar-force @ ${nowIso()}`,
    anchor_scene,
    scene_count: manifestScenes.length,
    scenes: manifestScenes
  };

  const forceJson = {
    id: options.forceId,
    kind,
    type: options.type ?? 'segmented',
    viewpoint: options.viewpoint ?? 'synthetic viewpoint',
    lore: options.lore ?? null,
    anchor_scene,
    triggers: options.triggers ?? ['synthetic'],
    pairs_with: options.pairsWith ?? [],
    scene_count: manifestScenes.length,
    provenance: {
      segmented_at: nowIso(),
      coverage,
      layers_dropped: ['trace']
    }
  };

  const mResult = validate('force-manifest', manifest);
  if (!mResult.ok) {
    return {
      ok: false,
      error: 'force-manifest invalid',
      validation: mResult,
      rule: 'segmentar-force.manifest_schema'
    };
  }
  const fResult = validate('force', forceJson);
  if (!fResult.ok) {
    return {
      ok: false,
      error: 'force.json invalid',
      validation: fResult,
      rule: 'segmentar-force.force_schema'
    };
  }

  if (rawText) {
    ensureDir(path.join(forceDir, 'raw'));
    writeText(path.join(forceDir, 'raw', 'context.md'), rawText);
  }

  writeJson(path.join(forceDir, 'manifest.json'), manifest);
  writeJson(path.join(forceDir, 'force.json'), forceJson);

  return {
    ok: true,
    forceDir,
    forceId: options.forceId,
    coverage,
    anchor_scene,
    scene_count: manifestScenes.length,
    manifest,
    force: forceJson
  };
}
