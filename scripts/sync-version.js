#!/usr/bin/env node
'use strict';

// `npm version` lifecycle hook. When you run `npm version patch` (or
// `minor` / `major` / an explicit version) in the repo root, npm bumps
// the root `package.json`, then runs this script with
// `$npm_package_version` set to the new version. We mirror that version
// into the three sub-packages so they stay in lockstep.
//
// All four packages are private and never published to npm, so the
// sub-package versions are decorative — but keeping them aligned avoids
// the drift we previously had (root at 1.0.1, sub-packages at 1.0.0).

const fs = require('fs');
const path = require('path');

const newVersion = process.env.npm_package_version;
if (!newVersion) {
  console.error('sync-version: $npm_package_version is not set');
  process.exit(1);
}
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(newVersion)) {
  console.error(`sync-version: refusing to write non-semver version "${newVersion}"`);
  process.exit(1);
}

const subdirs = ['backend', 'frontend', 'aspire-apphost'];
const root = path.join(__dirname, '..');

let updated = 0;
let unchanged = 0;
for (const sub of subdirs) {
  const pkgPath = path.join(root, sub, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log(`sync-version: skip ${sub}/package.json (not found)`);
    continue;
  }
  const raw = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  if (pkg.version === newVersion) {
    console.log(`sync-version: ${sub}/package.json already at ${newVersion}`);
    unchanged++;
    continue;
  }
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`sync-version: ${sub}/package.json -> ${newVersion}`);
  updated++;
}

console.log(`sync-version: ${updated} updated, ${unchanged} unchanged`);
