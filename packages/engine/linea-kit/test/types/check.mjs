/**
 * WP-U245 — run the two TypeScript consumers of `@zeus/linea-kit`.
 *
 * The package declares no TypeScript devDependency (adding one would touch the
 * lockfile), so this runner borrows the monorepo's hoisted `typescript` and
 * says so out loud when it cannot find it, instead of pretending to pass.
 *
 * It links the package under `test/types/node_modules/@zeus/linea-kit` so that
 * BOTH consumers resolve it the way a real installed dependency resolves —
 * through the `exports` map, not through a `paths` alias. That link is a
 * junction/symlink under an ignored `node_modules`; it never enters the diff.
 *
 * It runs THREE things, not one:
 *   1. `consumer-nodenext`  — the ten subpaths under NodeNext, must compile;
 *   2. `consumer-bundler`   — the second axis, must compile;
 *   3. `must-fail/`         — one file per negative control, each of which
 *      must NOT compile. A declaration that stopped rejecting the code that
 *      motivated it is a declaration that started lying again, and a checker
 *      that only ever asserts "compiles" would never notice.
 *
 * Usage: node test/types/check.mjs [--trace] [--keep-link] [--tsc <path to tsc>]
 *        ZEUS_TSC=<path to tsc> node test/types/check.mjs
 *
 * In a normal checkout the hoisted `typescript` is found by walking up. In a
 * bare git worktree (no `node_modules` of its own) pass `--tsc` / `ZEUS_TSC`
 * pointing at the `tsc` of a checkout that does have it.
 *
 * WP-U264 · walking up is no longer how this gets its compiler when it runs
 * under CI: `test/types.test.mjs` resolves `typescript` from the package's own
 * `devDependencies` (pinned) and passes it in with `--tsc`. Walking up finds
 * whatever floats — in this monorepo's lockfile that is a transitive
 * `typescript@4.9.5` which cannot parse `with { type: 'json' }` and fails both
 * consumers with TS1005.
 *
 * Exit code 0 = both consumers compile clean.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG_DIR = path.resolve(HERE, '../..');
const CONSUMERS = ['consumer-nodenext', 'consumer-bundler'];

/** Explicit `--tsc <path>` / `ZEUS_TSC`, else walk up for a hoisted `tsc`. */
function findTsc() {
  const flagIndex = process.argv.indexOf('--tsc');
  const explicit =
    flagIndex >= 0 ? process.argv[flagIndex + 1] : process.env.ZEUS_TSC || null;
  if (explicit) {
    const abs = path.resolve(explicit);
    if (!fs.existsSync(abs)) {
      console.error(`tsc not found at the path given: ${abs}`);
      return null;
    }
    return abs;
  }
  let dir = PKG_DIR;
  for (;;) {
    const candidate = path.join(dir, 'node_modules', 'typescript', 'bin', 'tsc');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function ensureLink() {
  const scope = path.join(HERE, 'node_modules', '@zeus');
  fs.mkdirSync(scope, { recursive: true });
  const link = path.join(scope, 'linea-kit');
  if (fs.existsSync(link)) return { link, created: false };
  fs.symlinkSync(PKG_DIR, link, process.platform === 'win32' ? 'junction' : 'dir');
  return { link, created: true };
}

/**
 * Remove the link again unless `--keep-link` was passed. A junction pointing
 * at the package from inside the package is a footgun for anything that
 * sweeps ignored directories, so it does not outlive the run by default.
 */
function dropLink(link) {
  try {
    fs.unlinkSync(link);
  } catch {
    fs.rmSync(link, { recursive: true, force: true });
  }
}

const tsc = findTsc();
if (!tsc) {
  console.error(
    'SKIP types:check — no typescript found from ' +
      `${PKG_DIR} upwards. Install the monorepo devDependencies, or pass ` +
      '--tsc <path> / ZEUS_TSC=<path>.'
  );
  process.exit(1);
}

const { link, created } = ensureLink();
const keepLink = process.argv.includes('--keep-link');
console.log(`tsc:  ${tsc}`);
console.log(`link: ${link} -> ${PKG_DIR}${created ? '' : ' (already present)'}`);

const trace = process.argv.includes('--trace');
let failures = 0;

/**
 * A directory that MUST NOT EXIST. The CLI has no way to spell `"types": []`,
 * which is what the two consumer tsconfigs use; pointing `typeRoots` at a
 * path that does not exist is the way to say it. Asserted below, because if
 * anyone ever creates it the ambient types come back and this leg goes
 * vacuous again in silence.
 */
const NO_AMBIENT_TYPES = path.join(HERE, '__sin-tipos-ambientales__');

if (fs.existsSync(NO_AMBIENT_TYPES)) {
  console.error(
    `FAIL ${NO_AMBIENT_TYPES} EXISTS. It is a sentinel and its whole job is to ` +
      'be absent: it is what keeps the monorepo `@types/*` out of the negative ' +
      'controls. Delete it.'
  );
  process.exit(1);
}

/** Shared compiler flags for the single-file negative controls. */
const MUST_FAIL_FLAGS = [
  '--noEmit',
  '--module', 'NodeNext',
  '--moduleResolution', 'NodeNext',
  '--strict',
  '--noImplicitAny',
  '--exactOptionalPropertyTypes',
  '--target', 'ES2022',
  '--lib', 'ES2022',
  // WP-U264 — without this the negative controls compile against every
  // `@types/*` in the monorepo (84 packages after `npm ci`), and that made
  // this whole leg VACUOUS. Measured on `b2-hop.ts`: 181 error lines, of
  // which 180 come from 36 OTHER files and exactly 1 from the file under
  // test. The biggest contributor is `@types/webxr` with 44; `@types/three`
  // and `@types/eslint*` follow. `@types/d3-array` only adds 2 — it just
  // happens to sort first, which is why it is the line the runner used to
  // print. The cause is `--lib ES2022` with no DOM under 84 ambient packages,
  // not any one of them.
  //
  // With the leg vacuous, a `b2-hop.ts` replaced by
  // `export const inocuo: string = 'x'` was still reported
  // `PASS must-fail/b2-hop.ts — rejected :: …`, exit 0. It only looked right
  // in a tree with no `@types` installed, which is exactly the tree it was
  // authored in and never the tree CI has.
  '--typeRoots', NO_AMBIENT_TYPES
];

for (const consumer of CONSUMERS) {
  const cwd = path.join(HERE, consumer);
  const args = [tsc, '--noEmit', '-p', 'tsconfig.json'];
  if (trace) args.push('--traceResolution');
  const run = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;

  if (trace) {
    const resolved = output
      .split('\n')
      .filter((line) => line.includes("Module name '@zeus/linea-kit"))
      .map((line) => line.trim());
    for (const line of resolved) console.log(`  ${line}`);
  }

  if (run.status === 0) {
    console.log(`PASS ${consumer} — tsc --noEmit, 0 errors`);
  } else {
    failures += 1;
    console.error(`FAIL ${consumer} — tsc exit ${run.status}`);
    if (!trace) console.error(output.trimEnd());
  }
}

/**
 * The file a `tsc` diagnostic is REPORTED AT, in posix form, or `null` if the
 * line carries no position (`error TS6044: …` and friends).
 * Format: `<path>(<line>,<col>): error TS####: <message>`.
 * @param {string} line
 * @returns {string | null}
 */
function errorPosition(line) {
  const match = /^(.+?)\((\d+),(\d+)\): error TS\d+/.exec(line.trim());
  return match ? match[1].split('\\').join('/') : null;
}

// ---- negative controls: these MUST NOT compile ------------------------
const mustFailDir = path.join(HERE, 'must-fail');
const mustFail = fs.existsSync(mustFailDir)
  ? fs.readdirSync(mustFailDir).filter((f) => f.endsWith('.ts')).sort()
  : [];

if (mustFail.length === 0) {
  failures += 1;
  console.error('FAIL must-fail/ — no negative controls found; the suite would be half-blind');
}

for (const name of mustFail) {
  const run = spawnSync(
    process.execPath,
    [tsc, path.join(mustFailDir, name), ...MUST_FAIL_FLAGS],
    { cwd: HERE, encoding: 'utf8' }
  );
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  const errors = output.split('\n').filter((line) => line.includes('error TS'));
  // WP-U264 — a non-zero exit is NOT the assertion. The assertion is that the
  // rejection came from THIS file. `tsc` exits non-zero for any error in the
  // program, so a control that stopped biting still exits non-zero as soon as
  // anything else in the program complains, and the leg reports PASS while
  // checking nothing.
  //
  // Anchored on the POSITION (`<path>(<line>,<col>): error TS…`), not on a
  // substring of the whole line: `includes(name)` would also match a case
  // whose name merely appeared inside some other file's message. Not
  // reachable with today's thirteen basenames — it is hardening, not a hole —
  // but the position is what the claim is actually about.
  const own = errors.filter((line) => {
    const at = errorPosition(line);
    return at !== null && (at === name || at.endsWith(`/${name}`));
  });
  if (run.status === 0) {
    failures += 1;
    console.error(`FAIL must-fail/${name} — COMPILED. The declaration stopped biting.`);
  } else if (own.length === 0) {
    failures += 1;
    console.error(
      `FAIL must-fail/${name} — rejected, but NOT by anything in the file: ` +
        'the red comes from elsewhere in the program, so this control proves nothing.'
    );
    for (const line of errors.slice(0, 3)) console.error(`    ${line.trim()}`);
  } else {
    console.log(`PASS must-fail/${name} — rejected :: ${own[0].trim()}`);
  }
}

if (created && !keepLink) {
  dropLink(link);
  console.log('link: removed (pass --keep-link to keep it for an editor)');
}

process.exit(failures === 0 ? 0 : 1);
