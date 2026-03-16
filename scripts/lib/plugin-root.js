'use strict';

const path = require('path');
const fs = require('fs');

let _cachedRoot = null;

function getPluginRoot() {
  if (_cachedRoot) return _cachedRoot;

  const envRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (envRoot) {
    if (fs.existsSync(path.join(envRoot, '.claude-plugin', 'plugin.json'))) {
      _cachedRoot = envRoot;
      return _cachedRoot;
    }
    if (fs.existsSync(path.join(envRoot, 'plugin.json'))) {
      _cachedRoot = envRoot;
      return _cachedRoot;
    }
  }

  let dir = __dirname;
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, '.claude-plugin', 'plugin.json'))) {
      _cachedRoot = dir;
      return _cachedRoot;
    }
    dir = path.dirname(dir);
  }

  _cachedRoot = path.resolve(__dirname, '..', '..');
  return _cachedRoot;
}

module.exports = { getPluginRoot };
