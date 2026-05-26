#!/usr/bin/env node
// One-time script to create and publish @itismyskillmarket/registry
// Run: node scripts/init-registry-package.js
// Prerequisite: npm login (npm whoami should return your username)

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const dir = join(tmpdir(), 'skm-registry-init');
mkdirSync(dir, { recursive: true });

const pkgJson = {
  name: '@itismyskillmarket/registry',
  version: '1.0.0',
  description: 'SkillMarket skill curation registry - tracks listed/unlisted skills',
  main: 'registry.json',
  files: ['registry.json'],
  publishConfig: { access: 'public' }
};

const registryData = {
  schemaVersion: 1,
  superAdmin: 'wxc2004',
  curators: [],
  skills: {}
};

writeFileSync(join(dir, 'package.json'), JSON.stringify(pkgJson, null, 2));
writeFileSync(join(dir, 'registry.json'), JSON.stringify(registryData, null, 2));

execSync('npm publish', { cwd: dir, stdio: 'inherit' });
console.log('✅ @itismyskillmarket/registry published!');
