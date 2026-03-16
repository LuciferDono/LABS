#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getPluginRoot } = require('./lib/plugin-root');

const root = getPluginRoot();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf-8'));

let errors = 0;
let checked = 0;

function check(label, filePath) {
  checked++;
  const full = path.join(root, filePath);
  if (!fs.existsSync(full)) {
    console.error(`MISSING: [${label}] ${filePath}`);
    errors++;
  }
}

for (const s of registry.skills) check(`skill:${s.name}`, s.path);
for (const a of registry.agents) check(`agent:${a.name}`, a.file);
for (const c of registry.commands) check(`cmd:${c.command}`, c.file);
for (const ctx of registry.contexts) check(`ctx:${ctx.name}`, ctx.file);

if (errors === 0) {
  console.log(`All ${checked} registry paths verified.`);
  process.exit(0);
} else {
  console.error(`\n${errors} of ${checked} paths missing.`);
  process.exit(1);
}
