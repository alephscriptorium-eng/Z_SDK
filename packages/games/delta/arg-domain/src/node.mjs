/**
 * Entradas node-only de @zeus/arg-domain (no importar desde navegador).
 * srcDir se sirve estático en arg-console para que las vistas importen el
 * dominio browser-safe crudo (mismo patrón que @zeus/game-engine/node).
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const srcDir = path.dirname(fileURLToPath(import.meta.url));
