/**
 * Entradas node-only de @zeus/protocol (no importar desde navegador).
 * srcDir se sirve estático en arg-console para resolver el import map.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const srcDir = path.dirname(fileURLToPath(import.meta.url));
