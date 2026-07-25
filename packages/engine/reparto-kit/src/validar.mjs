/**
 * Guardarraíl de ceguera del reparto (mismo patrón por env que parte-kit /
 * el proyector). Si `!ok` el consumidor NO debe publicar/serializar el reparto.
 * El valor del patrón se lee de env; nunca se hornea en el paquete (D-8).
 */

/**
 * Serializa el reparto a blob escaneable (JSON estable).
 * @param {import('./tipos.mjs').RepartoV1} reparto
 * @returns {string}
 */
export function blobReparto(reparto) {
  return JSON.stringify(reparto);
}

/**
 * @param {import('./tipos.mjs').RepartoV1} reparto
 * @param {string|RegExp|null|undefined} patronCeguera
 * @returns {{ ok: boolean, matches: string[] }}
 */
export function validarReparto(reparto, patronCeguera) {
  if (patronCeguera == null || patronCeguera === '') {
    return { ok: false, matches: ['CEGUERA_PATTERN_undefined'] };
  }
  let re;
  try {
    re = patronCeguera instanceof RegExp ? patronCeguera : new RegExp(String(patronCeguera), 'gi');
  } catch {
    return { ok: false, matches: ['CEGUERA_PATTERN_invalid'] };
  }
  const blob = blobReparto(reparto);
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
 * Lee el patrón desde env (nunca hornear el valor en el paquete).
 * @param {Record<string, string|undefined>} [env]
 * @returns {string|undefined}
 */
export function patronCegueraDesdeEnv(env = process.env) {
  const v = env.CEGUERA_PATTERN;
  return v != null && String(v).length > 0 ? String(v) : undefined;
}
