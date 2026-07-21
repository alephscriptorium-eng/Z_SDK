/**
 * validarActa — shape + resumen ≤400 + guardarraíl ceguera (patrón proyector).
 */

import { isActaDeBarrioShaped, RESUMEN_MAX } from './tipos.mjs';

/**
 * @param {import('./tipos.mjs').ActaDeBarrio} acta
 */
export function blobActa(acta) {
  return JSON.stringify(acta);
}

/**
 * @param {unknown} acta
 * @param {string|RegExp|null|undefined} patronCeguera
 * @returns {{ ok: boolean, matches: string[] }}
 */
export function validarActa(acta, patronCeguera) {
  if (!isActaDeBarrioShaped(acta)) {
    return { ok: false, matches: ['ACTA_SHAPE_invalid'] };
  }
  if (acta.resumen.length > RESUMEN_MAX) {
    return { ok: false, matches: ['ACTA_RESUMEN_excede_400'] };
  }
  if (patronCeguera == null || patronCeguera === '') {
    return { ok: false, matches: ['CEGUERA_PATTERN_undefined'] };
  }

  let re;
  try {
    re =
      patronCeguera instanceof RegExp
        ? patronCeguera
        : new RegExp(String(patronCeguera), 'gi');
  } catch {
    return { ok: false, matches: ['CEGUERA_PATTERN_invalid'] };
  }

  const blob = blobActa(acta);
  const matches = [];
  let m;
  re.lastIndex = 0;
  while ((m = re.exec(blob)) !== null) {
    matches.push(m[0]);
    if (!re.global) break;
    if (m[0].length === 0) re.lastIndex += 1;
  }
  return { ok: matches.length === 0, matches };
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string|undefined}
 */
export function patronCegueraDesdeEnv(env = process.env) {
  const v = env.CEGUERA_PATTERN;
  return v != null && String(v).length > 0 ? String(v) : undefined;
}
