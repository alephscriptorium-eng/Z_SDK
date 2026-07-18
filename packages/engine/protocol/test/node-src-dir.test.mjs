import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { nodeSrcDir } from '../src/node-src-dir.mjs';
import { srcDir as protocolSrcDir } from '../src/node.mjs';

test('nodeSrcDir returns the directory of the given module URL', () => {
  const fakeFile = path.join(process.cwd(), 'pkg', 'src', 'entry.mjs');
  assert.equal(nodeSrcDir(pathToFileURL(fakeFile)), path.dirname(fakeFile));
});

test('protocol ./node srcDir is the directory of node.mjs', () => {
  const expected = nodeSrcDir(new URL('../src/node.mjs', import.meta.url));
  assert.equal(protocolSrcDir, expected);
});
