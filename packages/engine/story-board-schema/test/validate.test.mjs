/**
 * Unit tests for @zeus/story-board-schema (WP-U117).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateStoryBoard,
  loadStoryBoardSchema,
  STORY_BOARD_SCHEMA_PATH
} from '../src/index.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const EDITOR_FIXTURES = path.join(
  ROOT,
  'editor/editor-ui/test/fixtures'
);

test('loads canonical schema from package path', () => {
  const schema = loadStoryBoardSchema();
  assert.equal(typeof schema.$id, 'string');
  assert.ok(schema.$defs?.dialectSolve);
  assert.ok(schema.$defs?.dialectAleph);
  assert.ok(STORY_BOARD_SCHEMA_PATH.endsWith('story-board.schema.json'));
});

test('SOLVE fixture validates as solve-inline', () => {
  const board = JSON.parse(
    readFileSync(
      path.join(EDITOR_FIXTURES, 'solve-coagula-story-board.json'),
      'utf8'
    )
  );
  const r = validateStoryBoard(board);
  assert.equal(r.ok, true, r.errors?.join('; '));
  assert.equal(r.dialect, 'solve-inline');
  assert.ok(r.actsToWidgets.size >= 1);
});

test('ALEPH fixture validates as aleph-blocks', () => {
  const board = JSON.parse(
    readFileSync(
      path.join(EDITOR_FIXTURES, 'aleph-et-omega-story-board.json'),
      'utf8'
    )
  );
  const r = validateStoryBoard(board);
  assert.equal(r.ok, true, r.errors?.join('; '));
  assert.equal(r.dialect, 'aleph-blocks');
});

test('synthetic invalid board is rejected with explicable errors', () => {
  const r = validateStoryBoard({
    acts: [{ id: 'act-0', widgets: ['BAD_Widget'] }]
  });
  assert.equal(r.ok, false);
  const msg = (r.errors || []).join('\n');
  assert.match(msg, /widgets|pattern|BAD/i);
});

test('unknown act ref on aleph board is rejected', () => {
  const r = validateStoryBoard({
    acts: [{ id: 'act-0', blocks: [1] }],
    blocks: [
      {
        n: 1,
        act: 'act-9',
        uichain: { widgets: ['panel-seed'] }
      }
    ]
  });
  assert.equal(r.ok, false);
  assert.match((r.errors || []).join(' '), /unknown act id act-9/);
});

test('solve dialect hint rejects aleph-shaped board', () => {
  const r = validateStoryBoard(
    {
      acts: [{ id: 'act-0', blocks: [1] }],
      blocks: [
        {
          n: 1,
          act: 'act-0',
          uichain: { widgets: ['panel-seed'] }
        }
      ]
    },
    { dialect: 'solve-inline' }
  );
  assert.equal(r.ok, false);
});
