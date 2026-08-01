/**
 * Family driver · LINEAS (WP-U202) — detect → validate → index → merge,
 * mounted ON TOP of importPack (CONTRATO-IMPORT-PACK-v1): the driver never
 * touches the manifest nor moves files itself — it validates the staged
 * family tree with the REAL linea-kit gates and returns a merge PLAN that
 * importPack executes (rename-only, staging inside the root).
 *
 * Site note (razonado, WP-U202): the family KNOWLEDGE stays in linea-kit —
 * schemas via `@zeus/linea-kit/validate` (U80 gate) and the curated-sidecar
 * predicate `isCuratedSidecarPath` in `@zeus/linea-kit/curation`. The
 * driver MECHANICS live here, next to importPack, because linea-kit's
 * `exports` map is frozen this WP (package.json untouchable) and
 * volumes-ops already declares the linea-kit dependency. Seed for the U242
 * generalization — intentionally minimal and internal.
 *
 * Merge rules (reconciliación por soporte, H-01 §④ — LINEAS = curado):
 * - escribe lo que falta: files missing in the destination land;
 * - divergencia se REPORTA, no se pisa: existing file with different
 *   content → `{ path, kind:'contenido_distinto', destSha256, packSha256 }`
 *   in the report; the destination file stays byte-identical;
 * - curación intocable: TODO `*.md` del volumen (DATOS §2: el markdown
 *   es índice y curación) already present in the destination are DISCARDED from
 *   the merge and reported as `curacion_protegida` — never overwritten;
 *   when absent in the destination they land («lo que falta»);
 * - a family pack is self-consistent: `registry.yaml` at the volume root
 *   is REQUIRED in the pack (identical files skip by themselves).
 * Node-only.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { createHash } from 'node:crypto';
import {
  validateFile,
  readYamlFile
} from '@zeus/linea-kit/validate';
import { isCuratedSidecarPath } from '@zeus/linea-kit/curation';

export const LINEAS_FAMILY = 'lineas';

/** @param {string} abs */
function sha256File(abs) {
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

/** @param {string} rel */
function toAbs(dir, rel) {
  return join(dir, rel.split('/').join(sep));
}

/**
 * detect — the volume declares the family (`family: 'lineas'`) or carries
 * the family signature: `registry.yaml` at the volume root.
 * @param {{ volumeEntry: object, volumeFiles: string[] }} ctx
 */
function detect({ volumeEntry, volumeFiles }) {
  if (volumeEntry?.family === LINEAS_FAMILY) return true;
  return volumeFiles.includes('registry.yaml');
}

/**
 * validate — staged family tree against the REAL linea-kit validators
 * (schemas U80): lineas-registry, manifest-tronco, nodos-document,
 * nodo-meta, manifest-satelite, nodo-sections. No invented shapes.
 * @param {{ stagedDir: string }} ctx — absolute staged volume dir
 * @returns {{ ok: boolean, results: object[] }}
 */
function validate({ stagedDir }) {
  /** @type {object[]} */
  const results = [];
  const push = (r) => {
    results.push(r);
    return r.ok;
  };
  const registryPath = join(stagedDir, 'registry.yaml');
  if (!existsSync(registryPath)) {
    return {
      ok: false,
      results: [
        {
          ok: false,
          schemaId: 'lineas-registry',
          errors: [{ message: 'registry.yaml ausente en el pack (familia LINEAS es autoconsistente)' }]
        }
      ]
    };
  }
  push(validateFile('lineas-registry', registryPath, 'yaml'));
  const registry = /** @type {object[]} */ (readYamlFile(registryPath)) || [];
  for (const entry of registry) {
    const lineDir = join(stagedDir, entry.path);
    const trunkManifest = join(lineDir, 'manifest.json');
    if (existsSync(trunkManifest)) {
      push(validateFile('manifest-tronco', trunkManifest));
    }
    const nodosYaml = join(lineDir, 'nodos.yaml');
    if (existsSync(nodosYaml)) {
      push(validateFile('nodos-document', nodosYaml, 'yaml'));
    }
    const nodosDir = join(lineDir, 'nodos');
    if (existsSync(nodosDir)) {
      // nodo metas are validated one by one when present.
      for (const rel of walkRel(nodosDir)) {
        if (rel.endsWith('meta.json')) {
          push(validateFile('nodo-meta', join(nodosDir, rel.split('/').join(sep))));
        }
      }
    }
    let satRel = null;
    try {
      satRel = JSON.parse(readFileSync(trunkManifest, 'utf8'))?.meta?.satelite_wp || null;
    } catch {
      satRel = null;
    }
    if (satRel) {
      const satDir = join(lineDir, satRel);
      const satManifest = join(satDir, 'manifest.json');
      if (existsSync(satManifest)) {
        push({ ...validateFile('manifest-satelite', satManifest) });
      }
      const sections = join(satDir, 'nodo-sections.json');
      if (existsSync(sections)) {
        push(validateFile('nodo-sections', sections));
      }
    }
  }
  return { ok: results.every((r) => r.ok), results };
}

/** Minimal relative walk (files only, posix rels). */
function walkRel(rootDir) {
  /** @type {string[]} */
  const out = [];
  function walk(dir, rel) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(dir, entry.name), childRel);
      else if (entry.isFile()) out.push(childRel);
    }
  }
  walk(rootDir, '');
  return out.sort();
}

/**
 * merge — per-file PLAN with the family rules (header). Never moves
 * anything itself; importPack executes `moves` with rename-only.
 * @param {{ stagedDir: string, destDir: string, volumeFiles: string[] }} ctx
 *   volumeFiles: posix rels of the staged volume (from importPack's walk)
 * @returns {{ moves: string[], skips: string[], divergences: object[], protectedSidecars: object[] }}
 */
function merge({ stagedDir, destDir, volumeFiles }) {
  /** @type {string[]} */
  const moves = [];
  /** @type {string[]} */
  const skips = [];
  /** @type {object[]} */
  const divergences = [];
  /** @type {object[]} */
  const protectedSidecars = [];

  for (const rel of volumeFiles) {
    const destAbs = toAbs(destDir, rel);
    const stagedAbs = toAbs(stagedDir, rel);
    const destExists = existsSync(destAbs);
    if (isCuratedSidecarPath(rel)) {
      if (destExists) {
        // Curación intocable: discard from merge, report.
        protectedSidecars.push({ path: rel, kind: 'curacion_protegida' });
      } else {
        moves.push(rel); // lo que falta
      }
      continue;
    }
    if (!destExists) {
      moves.push(rel); // lo que falta
      continue;
    }
    const destSha = sha256File(destAbs);
    const packSha = sha256File(stagedAbs);
    if (destSha === packSha) {
      skips.push(rel);
    } else {
      // Divergencia: se reporta con ruta y naturaleza; el root queda intacto.
      divergences.push({
        path: rel,
        kind: 'contenido_distinto',
        destSha256: destSha,
        packSha256: packSha
      });
    }
  }
  return { moves, skips, divergences, protectedSidecars };
}

export const LINEAS_DRIVER = Object.freeze({
  family: LINEAS_FAMILY,
  detect,
  validate,
  merge
});
