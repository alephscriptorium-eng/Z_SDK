/**
 * validarParte — guardarraíl ceguera (patrón proyector por env).
 * Si !ok → el consumidor NO publica; emitir parte_rechazado vía publicar.mjs.
 */

/**
 * Serializa el parte a blob escaneable (JSON estable).
 * @param {import('./tipos.mjs').ParteDeCiudad} parte
 */
export function blobParte(parte) {
  return JSON.stringify(parte);
}

/**
 * @param {import('./tipos.mjs').ParteDeCiudad} parte
 * @param {string|RegExp|null|undefined} patronCeguera — mismo patrón por env del proyector
 * @returns {{ ok: boolean, matches: string[] }}
 */
export function validarParte(parte, patronCeguera) {
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

  const blob = blobParte(parte);
  const matches = [];
  let m;
  // Reset lastIndex for global regex reuse.
  re.lastIndex = 0;
  while ((m = re.exec(blob)) !== null) {
    matches.push(m[0]);
    if (!re.global) break;
    if (m[0].length === 0) {
      re.lastIndex += 1;
    }
  }
  return { ok: matches.length === 0, matches };
}

/**
 * Lee patrón desde env (nunca hornear el valor en el paquete).
 * @returns {string|undefined}
 */
export function patronCegueraDesdeEnv(env = process.env) {
  const v = env.CEGUERA_PATTERN;
  return v != null && String(v).length > 0 ? String(v) : undefined;
}
