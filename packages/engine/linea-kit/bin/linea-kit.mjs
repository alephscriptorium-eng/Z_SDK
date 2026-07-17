#!/usr/bin/env node
/**
 * CLI for @zeus/linea-kit dramaturg tools (WP-U81).
 *
 *   zeus-linea-kit crear-linea --id juguete --lineas-root ./LINEAS
 *   zeus-linea-kit segmentar --sat-dir ./LINEAS/juguete/wp/historia
 *   zeus-linea-kit conectar-satelite --line-dir ./LINEAS/juguete --linea-id juguete
 *   zeus-linea-kit fetch --sat-dir … --oldid 190 --wikitext-file body.txt --approve
 *   zeus-linea-kit segmentar-force --out … --force-id force-x --raw … --scenes scenes.json
 *   zeus-linea-kit crear-cotas --out … --id sima --bound lower
 *   zeus-linea-kit starterkit-linea --lineas-root ./LINEAS
 *   zeus-linea-kit starterkit-force --forces-root ./FORCES
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  crearLinea,
  segmentar,
  conectarSatelite,
  fetchSnapshot,
  segmentarForce,
  crearCotas
} from '../src/tools/index.mjs';
import { createLineaJuguete, createForceJuguete } from '../src/starterkits/index.mjs';

const COMMANDS = Object.freeze({
  'crear-linea': runCrearLinea,
  segmentar: runSegmentar,
  'conectar-satelite': runConectar,
  fetch: runFetch,
  'segmentar-force': runSegmentarForce,
  'crear-cotas': runCrearCotas,
  'starterkit-linea': runStarterLinea,
  'starterkit-force': runStarterForce
});

function usage(code = 2) {
  console.error(`Uso: zeus-linea-kit <comando> [opciones]

Comandos:
  crear-linea          Scaffold tronco (nodos.yaml + manifest + carpetas)
  segmentar            Historial → manifest satélite con milestones
  conectar-satelite    Instrucciones/config MCP + remotes wiki/ATProto/SSB
  fetch                Materializar snapshot (requiere --approve)
  segmentar-force      Contextos → escenas prompt/think/output (trace fuera)
  crear-cotas          Autoría cota sima|cima
  starterkit-linea     Crea línea juguete E2E (3 nodos + 10 registros)
  starterkit-force     Crea force juguete + cotas stub

El contrato de entrada al mesh es el validador U80; las tools son cortesía.
`);
  process.exit(code);
}

function printResult(result) {
  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
}

function runCrearLinea(values) {
  return crearLinea({
    id: values.id,
    lineasRoot: values['lineas-root'],
    etiqueta: values.etiqueta,
    autorTronco: values.autor,
    referenciaWp: values['referencia-wp'],
    overwrite: values.overwrite
  });
}

function runSegmentar(values) {
  return segmentar({
    satDir: values['sat-dir'],
    rawPath: values.raw,
    corpus: values.corpus,
    title: values.title,
    byteDeltaThreshold: values['byte-threshold'] ? Number(values['byte-threshold']) : undefined
  });
}

function runConectar(values) {
  return conectarSatelite({
    lineDir: values['line-dir'],
    lineaId: values['linea-id'],
    sateliteRel: values['satelite-rel']
  });
}

function runFetch(values) {
  let wikitext = values.wikitext;
  if (!wikitext && values['wikitext-file']) {
    wikitext = fs.readFileSync(path.resolve(values['wikitext-file']), 'utf8');
  }
  return fetchSnapshot({
    satDir: values['sat-dir'],
    oldid: Number(values.oldid),
    wikitext,
    approve: Boolean(values.approve),
    approvalToken: values.token,
    expectedToken: values['expected-token'],
    sourceUrl: values['source-url'],
    title: values.title
  });
}

function runSegmentarForce(values) {
  const scenes = JSON.parse(fs.readFileSync(path.resolve(values.scenes), 'utf8'));
  return segmentarForce({
    outDir: values.out,
    forceId: values['force-id'],
    rawPath: values.raw,
    scenes: Array.isArray(scenes) ? scenes : scenes.scenes,
    kind: values.kind,
    overwrite: values.overwrite
  });
}

function runCrearCotas(values) {
  return crearCotas({
    outDir: values.out,
    id: values.id,
    bound: values.bound,
    overwrite: values.overwrite
  });
}

function runStarterLinea(values) {
  return createLineaJuguete({
    lineasRoot: values['lineas-root'],
    id: values.id ?? 'juguete',
    overwrite: values.overwrite
  });
}

function runStarterForce(values) {
  return createForceJuguete({
    forcesRoot: values['forces-root'],
    forceId: values['force-id'] ?? 'force-juguete',
    overwrite: values.overwrite
  });
}

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    help: { type: 'boolean', short: 'h' },
    id: { type: 'string' },
    'lineas-root': { type: 'string' },
    'forces-root': { type: 'string' },
    'sat-dir': { type: 'string' },
    'line-dir': { type: 'string' },
    'linea-id': { type: 'string' },
    'satelite-rel': { type: 'string' },
    'force-id': { type: 'string' },
    out: { type: 'string' },
    raw: { type: 'string' },
    scenes: { type: 'string' },
    corpus: { type: 'string' },
    title: { type: 'string' },
    etiqueta: { type: 'string' },
    autor: { type: 'string' },
    'referencia-wp': { type: 'string' },
    oldid: { type: 'string' },
    wikitext: { type: 'string' },
    'wikitext-file': { type: 'string' },
    approve: { type: 'boolean', default: false },
    token: { type: 'string' },
    'expected-token': { type: 'string' },
    'source-url': { type: 'string' },
    'byte-threshold': { type: 'string' },
    bound: { type: 'string' },
    kind: { type: 'string' },
    overwrite: { type: 'boolean', default: false }
  }
});

const command = positionals[0];
if (values.help || !command) usage(values.help ? 0 : 2);
const runner = COMMANDS[command];
if (!runner) {
  console.error(`Comando desconocido: ${command}`);
  usage(2);
}

printResult(runner(values));
