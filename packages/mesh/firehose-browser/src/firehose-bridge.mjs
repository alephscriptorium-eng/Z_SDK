/**
 * Firehose browse bridge — delegates to @zeus/firehose-core.
 */

import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
  listCorpora,
  browseCorpus,
  listPosts,
  getFirehoseStats,
  loadTriageManifest,
  loadPostFile,
  getCorpusConfig
} from '@zeus/firehose-core';
import { readVolumeFile, corpusRelPath, resolveVolume } from '@zeus/presets-sdk';
import { sanitizeRelativePath } from '@zeus/presets-sdk/browse-core';

export {
  listCorpora,
  browseCorpus,
  listPosts,
  getFirehoseStats,
  loadTriageManifest,
  loadPostFile
};

/**
 * @param {string} corpusId
 * @param {string} filePath — relative to corpus root
 */
export async function readCorpusFile(corpusId, filePath) {
  const { corpus } = getCorpusConfig(corpusId);
  const volumePath = corpusRelPath(corpus.path, filePath);
  const result = await readVolumeFile('firehose', volumePath);
  const ext = filePath.includes('.') ? filePath.slice(filePath.lastIndexOf('.')) : '';

  let data = result.content;
  let kind = 'text';
  if (ext === '.json') {
    try {
      data = JSON.parse(result.content);
      kind = 'json';
    } catch (err) {
      return { error: `invalid JSON: ${err.message}`, path: filePath };
    }
  }

  return {
    corpus: corpusId,
    path: filePath,
    volumePath: result.path,
    absPath: result.absPath,
    name: filePath.split('/').pop(),
    ext,
    kind,
    size: result.size,
    data,
    content: result.content
  };
}

/**
 * ¿Existe de verdad en el volumen firehose un fichero de corpus? (WP-26,
 * deep-links honestos). Nunca lanza: corpus desconocido, path inválido o
 * fs roto ⇒ false.
 *
 * @param {string} corpusId
 * @param {string} filePath — relativo a la raíz del corpus
 * @returns {Promise<boolean>}
 */
export async function corpusFileExists(corpusId, filePath) {
  try {
    const { corpus } = getCorpusConfig(corpusId);
    const volumePath = sanitizeRelativePath(corpusRelPath(corpus.path, filePath));
    if (!volumePath) return false;
    const volume = resolveVolume('firehose');
    if (volume.deferred) return false;
    const fileStat = await stat(join(volume.absPath, volumePath));
    return fileStat.isFile();
  } catch {
    return false;
  }
}
