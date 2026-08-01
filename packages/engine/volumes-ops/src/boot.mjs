/**
 * Guardián de ARRANQUE de un volumes root (WP-U206 · decisión ⑩ del custodio).
 *
 * ── POR QUÉ EXISTE ───────────────────────────────────────────────────────
 * Un verificador que nadie llama no es una protección: es una biblioteca.
 * `verifyRootIntegrity` y `scanRootCerco` nacieron con cero llamadas de
 * producción — el CA los ejercitaba desde el arnés y el producto arrancaba
 * igual sobre un root corrupto. Este módulo es **el único punto** por el que
 * los servicios entran a esa comprobación: se llama, no se replica. Replicar
 * un verificador de integridad es duplicar lógica de seguridad, y dos copias
 * divergen.
 *
 * ── LAS DOS MITADES NO TIENEN EL MISMO ESTATUTO, Y ESTÁ MEDIDO ───────────
 * · **Integridad = FATAL.** Medido contra el root de referencia del monorepo
 *   (`VOLUMES/`): `ok:true`. Un root sin importar deja todos los legs de
 *   volumen en `omitido` honesto, así que la guarda no rompe nada existente y
 *   sí ataja el caso que importa: root importado + corrupto.
 * · **Cerco = REPORTA, no aborta (salvo modo estricto).** Medido contra el
 *   MISMO root de referencia: `ok:false`, con TRES hallazgos:
 *     - `DISK_02/LINEAS/demo/wp/historia/manifest.json:27` y `:40` →
 *       `"urls": { "revision": "https://example.test/w/index.php?oldid=…" }`
 *     - `README.md:5` → una URL de repositorio en la documentación del root.
 *   Ninguna de las tres es un ancla de arranque: son **procedencia
 *   registrada** y **documentación**. El predicado «0 URLs vivas», tal como
 *   está escrito, no las distingue de un ancla. Hacerlo fatal hoy **negaría
 *   el arranque a todos los servicios del monorepo** — sería un gate que no
 *   protege, sino que impide.
 *   Así que el cerco se **ejecuta siempre y se reporta siempre**; abortar es
 *   opt-in por `ZEUS_VOLUMES_CERCO=strict` (o `strictCerco:true`). El
 *   interruptor queda puesto para el día que el contrato decida si
 *   `urls.revision` es procedencia inerte.
 *
 * Esto NO es «medio cablear»: la llamada de producción existe, corre en cada
 * arranque y su resultado se imprime. Lo que está declarado es el **estatuto**
 * de cada mitad, con la medición que lo justifica.
 * Node-only.
 */

import { verifyRootIntegrity } from './verify.mjs';
import { scanRootCerco } from './cerco.mjs';

/** ¿El cerco aborta? Por defecto no; `ZEUS_VOLUMES_CERCO=strict` lo promueve. */
export function cercoIsStrict() {
  return String(process.env.ZEUS_VOLUMES_CERCO || '').toLowerCase() === 'strict';
}

/**
 * Comprueba que el volumes root canónico es arrancable.
 *
 * @param {object} [opts]
 * @param {string} [opts.service] — nombre del servicio, para el mensaje
 * @param {string[]} [opts.volumeIds] — limita la verificación a estos volúmenes
 * @param {boolean} [opts.strictCerco] — el cerco aborta (default: env)
 * @param {{ warn?: Function }} [opts.logger]
 * @returns {{ integrity: object, cerco: object }}
 * @throws {Error} si la integridad falla (o el cerco, en modo estricto)
 */
export function assertVolumesRootBootable(opts = {}) {
  const {
    service = 'servicio',
    volumeIds = undefined,
    strictCerco = cercoIsStrict(),
    logger = console
  } = opts;

  // ── 1 · INTEGRIDAD — fatal. Un root corrupto no arranca a medias.
  const integrity = verifyRootIntegrity({ volumeIds });
  if (!integrity.ok) {
    const detalle = integrity.findings
      .map((f) => `${f.check}${f.volume ? `[${f.volume}]` : ''}: ${f.error}`)
      .join(' · ');
    const err = new Error(
      `[${service}] arranque ABORTADO — el volumes root no está íntegro ` +
        `(${integrity.findings.length} hallazgo(s)): ${detalle}`
    );
    // @ts-ignore — evidencia adjunta para el llamador
    err.report = integrity;
    throw err;
  }

  // ── 2 · CERCO — se ejecuta y se reporta SIEMPRE; aborta sólo si estricto.
  /** @type {any} */
  let cerco;
  try {
    cerco = scanRootCerco({ root: integrity.volumesRoot });
  } catch (err) {
    cerco = {
      ok: false,
      findings: [{ kind: 'cerco_irrealizable', detail: err instanceof Error ? err.message : String(err) }]
    };
  }
  if (!cerco.ok) {
    const detalle = cerco.findings
      .map((f) => `${f.kind}:${f.path ?? ''}${f.url ? ` (${f.url})` : ''}`)
      .join(' · ');
    if (strictCerco) {
      const err = new Error(
        `[${service}] arranque ABORTADO — cerco del root roto ` +
          `(${cerco.findings.length} hallazgo(s)): ${detalle}`
      );
      // @ts-ignore
      err.report = cerco;
      throw err;
    }
    logger.warn?.(
      `[${service}] CERCO: ${cerco.findings.length} hallazgo(s) en ${cerco.root} — ${detalle}\n` +
        `[${service}] no aborta: «0 URLs vivas» aún no distingue procedencia registrada ` +
        `de ancla de arranque (ZEUS_VOLUMES_CERCO=strict para exigirlo).`
    );
  }

  return { integrity, cerco };
}
