/**
 * renderProsa(parte) → markdown con plantillas fijas.
 */

/**
 * @param {import('./tipos.mjs').ParteDeCiudad} parte
 * @returns {string}
 */
export function renderProsa(parte) {
  const lines = [];
  lines.push(`# Parte de plaza · tick ${parte.tick}`);
  lines.push('');
  lines.push(`version: \`${parte.version}\``);
  lines.push('');
  lines.push('## Titulares');
  lines.push('');
  if (!parte.titulares.length) {
    lines.push('_Sin titulares._');
  } else {
    for (const t of parte.titulares) {
      lines.push(`- ${t}`);
    }
  }
  lines.push('');
  lines.push('## Censo');
  lines.push('');
  lines.push(
    `| vivos | latentes | muertos | rotos |`
  );
  lines.push(`| ---: | ---: | ---: | ---: |`);
  lines.push(
    `| ${parte.censo.vivos} | ${parte.censo.latentes} | ${parte.censo.muertos} | ${parte.censo.rotos} |`
  );
  lines.push('');
  lines.push('## Barrios');
  lines.push('');
  lines.push('| id | estado | delta | gentes |');
  lines.push('| --- | --- | --- | ---: |');
  for (const b of parte.barrios) {
    lines.push(`| ${b.id} | ${b.estado} | ${b.delta} | ${b.gentesActivas} |`);
  }
  lines.push('');
  lines.push('## Pendientes');
  lines.push('');
  if (!parte.pendientes.length) {
    lines.push('_Ninguno._');
  } else {
    for (const p of parte.pendientes) {
      lines.push(`- **${p.barrioId}**: ${p.texto}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}
