// Launcher that removes ELECTRON_RUN_AS_NODE before spawning Electron.
// This env var, when set, forces Electron to skip all Chromium/app init
// and run as bare Node.js — breaking require('electron') entirely.
const { spawn } = require('child_process');
const path = require('path');

const electronPath = require('electron'); // returns exe path (from npm package)
const appDir = path.join(__dirname, '..');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, [appDir], {
  stdio: 'inherit',
  windowsHide: false,
  env,
});
child.on('close', (code) => process.exit(code || 0));
