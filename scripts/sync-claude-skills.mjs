#!/usr/bin/env node
/**
 * Sync Claude Code skills from the versioned package into .claude/skills/.
 * Source of truth: node_modules/@alephscript/skills-scriptorium (D-35);
 * .claude/skills/ is a generated mirror for the Claude Code runner — never
 * edit it by hand.
 * Run: npm run skills:sync
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const PKG_NAME = '@alephscript/skills-scriptorium';
const pkgDir = path.join(root, 'node_modules', ...PKG_NAME.split('/'));
const srcDir = path.join(pkgDir, 'skills');
const destDir = path.join(root, '.claude', 'skills');
const readmePath = path.join(destDir, 'README.md');

/** Skills of the package that are NOT materialized for the runner. */
const EXCLUDE = new Set(['_plantilla']);

if (!fs.existsSync(srcDir)) {
  console.error(`skills:sync — no existe ${srcDir}`);
  console.error(`¿Falta npm install? (${PKG_NAME} es devDependency del raíz)`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));

const sourceSkills = fs
  .readdirSync(srcDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !EXCLUDE.has(entry.name))
  .map((entry) => entry.name)
  .sort();

if (sourceSkills.length === 0) {
  console.error(`skills:sync — ${srcDir} no contiene skills (fuera de ${[...EXCLUDE].join(', ')})`);
  process.exit(1);
}

/**
 * Skills synced by a previous run, parsed from the generated README manifest.
 * Deleting these (plus the current source set) keeps the run idempotent and
 * free of leftovers when the package drops/renames a skill, without touching
 * anything else that may live under .claude/.
 */
const previousSkills = fs.existsSync(readmePath)
  ? [...fs.readFileSync(readmePath, 'utf8').matchAll(/^- `([^`]+)`$/gm)].map((m) => m[1])
  : [];

fs.mkdirSync(destDir, { recursive: true });

for (const name of new Set([...previousSkills, ...sourceSkills])) {
  fs.rmSync(path.join(destDir, name), { recursive: true, force: true });
}

for (const name of sourceSkills) {
  fs.cpSync(path.join(srcDir, name), path.join(destDir, name), { recursive: true });
  console.log(`→ ${name}`);
}

const readme = [
  '# .claude/skills — generado, NO editar a mano',
  '',
  `Fuente: \`${pkg.name}@${pkg.version}\` (instalado en \`node_modules/\`).`,
  'Este directorio es un espejo para el runner Claude Code; la fuente de',
  'verdad es el paquete versionado. Cualquier cambio manual se pierde en la',
  'siguiente regeneración: `npm run skills:sync`.',
  '',
  'Skills sincronizadas:',
  '',
  ...sourceSkills.map((name) => `- \`${name}\``),
  ''
].join('\n');

fs.writeFileSync(readmePath, readme);

console.log(`\nskills:sync — ${sourceSkills.length} skills desde ${pkg.name}@${pkg.version} → .claude/skills/`);
