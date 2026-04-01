import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { MARKET_DIR, SUBDIRS, REGISTRY_FILE } from '../constants.js';

export function getMarketHome(): string {
  return path.join(os.homedir(), '.skillmarket');
}

export function getCacheDir(): string {
  return path.join(getMarketHome(), SUBDIRS.CACHE);
}

export function getSkillsDir(): string {
  return path.join(getMarketHome(), SUBDIRS.SKILLS);
}

export function getPlatformLinksDir(): string {
  return path.join(getMarketHome(), SUBDIRS.PLATFORM_LINKS);
}

export function getRegistryPath(): string {
  return path.join(getMarketHome(), REGISTRY_FILE);
}

export async function ensureMarketDirs(): Promise<void> {
  await fs.ensureDir(getCacheDir());
  await fs.ensureDir(getSkillsDir());
  await fs.ensureDir(getPlatformLinksDir());
}
