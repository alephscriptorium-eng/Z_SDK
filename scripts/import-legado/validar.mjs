/**
 * Validación de la salida contra los validadores/schemas EXISTENTES:
 *   - story-board → AJV de @zeus/story-board-schema (dialecto solve-inline).
 *   - reparto     → validador de @zeus/reparto-kit (shape + ceguera por env).
 *   - línea       → schemas de @zeus/linea-kit (nodos-document / manifest-tronco
 *                   / nodo-meta / lineas-registry) vía su AJV.
 *
 * El patrón de ceguera se lee de env (`CEGUERA_PATTERN`); nunca se hornea.
 */

import { validateStoryBoard } from '@zeus/story-board-schema/validate';
import { isRepartoShaped, validarReparto } from '@zeus/reparto-kit';
import { validate as validateLinea } from '@zeus/linea-kit/validate';

/**
 * @param {ReturnType<import('./importar.mjs').importarObra>} item
 * @param {string|RegExp|null} [patronCeguera] — pasado a validarReparto
 */
export function validarItem(item, patronCeguera = null) {
  /** @type {Array<{ formato: string, ok: boolean, errors: string[] }>} */
  const checks = [];

  const sb = validateStoryBoard(item.board);
  checks.push({ formato: 'story-board', ok: sb.ok, errors: sb.ok ? [] : sb.errors });

  const shaped = isRepartoShaped(item.reparto);
  const ceguera = patronCeguera == null ? { ok: true, matches: [] } : validarReparto(item.reparto, patronCeguera);
  checks.push({
    formato: 'reparto',
    ok: shaped && ceguera.ok,
    errors: [
      ...(shaped ? [] : ['reparto: shape reparto/1 inválido']),
      ...(ceguera.ok ? [] : [`reparto: ceguera hit ${ceguera.matches.join(',')}`])
    ]
  });

  const nd = validateLinea('nodos-document', item.linea.nodosDocument);
  checks.push({ formato: 'nodos-document', ok: nd.ok, errors: nd.ok ? [] : (nd.errors || []).map((e) => JSON.stringify(e)) });

  const mt = validateLinea('manifest-tronco', item.linea.manifestTronco);
  checks.push({ formato: 'manifest-tronco', ok: mt.ok, errors: mt.ok ? [] : (mt.errors || []).map((e) => JSON.stringify(e)) });

  for (const meta of item.linea.metas) {
    const nm = validateLinea('nodo-meta', meta);
    checks.push({ formato: `nodo-meta:${meta.id}`, ok: nm.ok, errors: nm.ok ? [] : (nm.errors || []).map((e) => JSON.stringify(e)) });
  }

  return { lineId: item.lineId, ok: checks.every((c) => c.ok), checks };
}

/**
 * @param {ReturnType<import('./importar.mjs').importarCorpus>} bundle
 * @param {string|RegExp|null} [patronCeguera]
 */
export function validarBundle(bundle, patronCeguera = null) {
  const items = bundle.items.map((it) => validarItem(it, patronCeguera));
  const reg = validateLinea('lineas-registry', bundle.registry);
  const registro = {
    formato: 'lineas-registry',
    ok: reg.ok,
    errors: reg.ok ? [] : (reg.errors || []).map((e) => JSON.stringify(e))
  };
  return { ok: items.every((i) => i.ok) && registro.ok, items, registro };
}
