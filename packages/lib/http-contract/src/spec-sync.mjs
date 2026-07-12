import fs from 'node:fs';

/**
 * Compare committed spec with in-memory build — does NOT write to disk.
 * @param {() => string} buildFn — returns expected YAML/content
 * @param {string} specPath — path to committed artifact
 * @param {string} [hint] — regeneration command for error message
 */
export function assertSpecMatches(buildFn, specPath, hint = 'npm run spec:generate') {
  if (!fs.existsSync(specPath)) {
    throw new Error(`spec missing: ${specPath} — run ${hint}`);
  }
  const committed = fs.readFileSync(specPath, 'utf8');
  const generated = buildFn();
  if (committed !== generated) {
    throw new Error(`spec drift at ${specPath} — run ${hint}`);
  }
}
