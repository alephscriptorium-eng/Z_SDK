/**
 * Proyección pura reparto → filas del cast-table de view-kit.
 *
 * Sin dependencias de UI: devuelve el schema de datos que consume
 * `renderCastTableWidget` de `@zeus/view-kit`
 *   `{ participant, role, axis?, oldid?, href?, cached? }`
 * de modo que `src/vista.mjs` alimente el widget EXISTENTE (consumo real, sin
 * copia). Determinista: una fila por asignación actor–personaje; los personajes
 * sin actor asignado producen una fila con `participant` vacío.
 */

/**
 * @param {import('./tipos.mjs').RepartoV1} reparto
 * @returns {Array<{ participant: string, role: string, oldid: string }>}
 */
export function filasCastDesdeReparto(reparto) {
  /** @type {Array<{ participant: string, role: string, oldid: string }>} */
  const rows = [];
  for (const p of reparto.personajes) {
    const actores = reparto.asignaciones
      .filter((a) => a.personajeId === p.id)
      .map((a) => a.actorSsbId);
    if (actores.length === 0) {
      rows.push({ participant: '', role: p.rol, oldid: p.id });
    } else {
      for (const actorSsbId of actores) {
        rows.push({ participant: actorSsbId, role: p.rol, oldid: p.id });
      }
    }
  }
  return rows;
}
