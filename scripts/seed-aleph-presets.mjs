#!/usr/bin/env node
/**
 * Seed ALEPH et OMEGA preset pack into data/presets.json (idempotent by name).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PresetStore } from '@zeus/presets-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data');
const seedsPath = path.join(dataDir, 'seeds', 'aleph-presets.json');

const alephPresets = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));

const store = new PresetStore({ dataDir });
let created = 0;
let skipped = 0;

for (const preset of alephPresets) {
  const existing = store.getByName(preset.name);
  if (existing) {
    store.update(existing.id, {
      description: preset.description,
      category: preset.category,
      prompt: preset.prompt,
      items: preset.items
    });
    console.log(`updated: ${preset.name} (id ${existing.id})`);
    skipped++;
    continue;
  }
  const result = store.create(preset);
  console.log(`created: ${result.name} (id ${result.id})`);
  created++;
}

console.log(`\nALEPH presets: ${created} created, ${skipped} updated/skipped, ${store.count()} total in ${dataDir}`);
