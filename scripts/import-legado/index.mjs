#!/usr/bin/env node
/**
 * Importador ONE-OFF del corpus legado (WP-U176).
 *
 * Lee las fuentes en SOLO LECTURA y emite los formatos EXISTENTES del engine
 * (línea de @zeus/linea-kit + story-board de @zeus/story-board-schema con refs
 * de personajes + reparto `reparto/1` de @zeus/reparto-kit, asignaciones
 * vacías), con IDs zeus deterministas (precedente D-19).
 *
 * Las rutas de las fuentes se INYECTAN por variables de entorno del operador y
 * JAMÁS se escriben en el árbol (clase U140/D-31). Contrato de env:
 *
 *   IMPORT_SRC_JSON       (fichero JSON del corpus principal)          [opcional]
 *   IMPORT_SRC_OBRA       (directorio con una obra en markdown/capítulos) [opcional]
 *   IMPORT_SRC_WORKS_KEY  (nombre de la colección de obras en resources) [opcional]
 *   IMPORT_OUT            (directorio de salida; por defecto ./out-import) [opcional]
 *   IMPORT_NOW            (ISO inyectado para generated_at; omitido = determinista) [opcional]
 *   CEGUERA_PATTERN       (patrón de ceguera; valores locales, nunca commit)  [opcional]
 *
 * Uso (el operador exporta las envs; aquí no hay valores):
 *   IMPORT_SRC_JSON=… IMPORT_SRC_OBRA=… IMPORT_OUT=… \
 *     node scripts/import-legado/index.mjs
 *   node scripts/import-legado/index.mjs --check   # valida sin escribir
 */

import process from 'node:process';
import { leerFuente } from './fuente.mjs';
import { importarCorpus } from './importar.mjs';
import { validarBundle } from './validar.mjs';
import { escribirBundle } from './escribir.mjs';

function main() {
  const args = new Set(process.argv.slice(2));
  const soloCheck = args.has('--check');

  const jsonPath = process.env.IMPORT_SRC_JSON || null;
  const obraDir = process.env.IMPORT_SRC_OBRA || null;
  const worksKey = process.env.IMPORT_SRC_WORKS_KEY || null;
  const outDir = process.env.IMPORT_OUT || 'out-import';
  const now = process.env.IMPORT_NOW || null;
  const patronCeguera = process.env.CEGUERA_PATTERN || null;

  if (!jsonPath && !obraDir) {
    console.error(
      'import-legado: define IMPORT_SRC_JSON y/o IMPORT_SRC_OBRA (env del operador).'
    );
    process.exit(2);
  }

  const obras = leerFuente({ jsonPath, obraDir, worksKey });
  if (!obras.length) {
    console.error('import-legado: 0 obras en la fuente; nada que emitir.');
    process.exit(2);
  }

  const bundle = importarCorpus(obras, { now });
  const report = validarBundle(bundle, patronCeguera);

  console.log(`import-legado: ${bundle.items.length} obra(s) → líneas + story-board + reparto`);
  for (const it of report.items) {
    console.log(`  ${it.lineId}: ${it.ok ? 'OK' : 'FALLO'}`);
    if (!it.ok) {
      for (const c of it.checks.filter((x) => !x.ok)) {
        console.log(`    ${c.formato}: ${c.errors.join(' | ')}`);
      }
    }
  }
  console.log(`  lineas-registry: ${report.registro.ok ? 'OK' : 'FALLO'}`);

  if (!report.ok) {
    console.error('import-legado: la salida NO valida contra los schemas — abortado.');
    process.exit(1);
  }

  if (soloCheck) {
    console.log('import-legado: --check verde (sin escritura).');
    return;
  }

  const escrito = escribirBundle(bundle, outDir);
  console.log(`import-legado: ${escrito.escritos.length} fichero(s) escritos bajo ${outDir}/LINEAS`);
}

main();
