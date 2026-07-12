import fs from 'node:fs';
import path from 'node:path';

const DISCOVERY_FILENAME = 'zeus-discovery.json';

/**
 * @param {string} [dataDir]
 */
export function loadSharedDiscoveryFile(dataDir) {
  if (!dataDir) return {};
  const filePath = path.join(dataDir, DISCOVERY_FILENAME);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {
    // fall through
  }
  return {};
}
