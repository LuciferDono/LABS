#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getPluginRoot } = require('./lib/plugin-root');

const root = getPluginRoot();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf-8'));

const total = registry.skills.length + registry.agents.length + registry.commands.length + registry.contexts.length;

let md = `# LABS Component Registry\n\n`;
md += `> Auto-generated from registry.json by sync-registry.js. Do not edit manually.\n`;
md += `> Version: ${registry.version} | Components: ${total}\n\n`;

md += `## Skills (${registry.skills.length})\n\n`;
md += `| name | triggers |\n|------|----------|\n`;
for (const s of registry.skills) {
  md += `| ${s.name} | ${s.triggers.join(', ')} |\n`;
}

md += `\n## Agents (${registry.agents.length})\n\n`;
md += `| name | model | delegate when |\n|------|-------|---------------|\n`;
for (const a of registry.agents) {
  md += `| ${a.name} | ${a.model} | ${a.delegateWhen} |\n`;
}

md += `\n## Commands (${registry.commands.length})\n\n`;
md += `| command | suggest when |\n|---------|-------------|\n`;
for (const c of registry.commands) {
  md += `| ${c.command} | ${c.suggestWhen} |\n`;
}

md += `\n## Contexts (${registry.contexts.length})\n\n`;
md += `| name | invoked via | description |\n|------|------------|-------------|\n`;
for (const ctx of registry.contexts) {
  md += `| ${ctx.name} | ${ctx.invokedVia} | ${ctx.description} |\n`;
}

const outPath = path.join(root, 'REGISTRY.md');
fs.writeFileSync(outPath, md);
console.log(`REGISTRY.md generated: ${total} components`);
