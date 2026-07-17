#!/usr/bin/env node
/**
 * CLI: npm run gates — PRACTICAS §5 / WP-U00.
 * Exit 1 si hay offenders no exceptuados.
 */
import { runAllGates, formatOffenders } from './scan.mjs';

const { ok, offenders } = runAllGates();
const report = formatOffenders(offenders);
console.log(report);
if (!ok) process.exit(1);
