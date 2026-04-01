import fs from 'fs-extra';
import path from 'path';
import { getRegistryPath, getMarketHome } from '../utils/dirs.js';
import type { RegistryData, InstalledSkill } from '../types.js';

const DEFAULT_REGISTRY: RegistryData = {
  skills: {},
  lastUpdated: new Date().toISOString()
};

export async function loadRegistry(): Promise<RegistryData> {
  const registryPath = getRegistryPath();
  
  if (!(await fs.pathExists(registryPath))) {
    return DEFAULT_REGISTRY;
  }
  
  try {
    const data = await fs.readJson(registryPath);
    return data as RegistryData;
  } catch {
    return DEFAULT_REGISTRY;
  }
}

export async function saveRegistry(registry: RegistryData): Promise<void> {
  await fs.ensureDir(getMarketHome());
  registry.lastUpdated = new Date().toISOString();
  await fs.writeJson(getRegistryPath(), registry, { spaces: 2 });
}

export async function getInstalledSkills(): Promise<InstalledSkill[]> {
  const registry = await loadRegistry();
  return Object.values(registry.skills);
}

export async function isSkillInstalled(skillId: string): Promise<boolean> {
  const registry = await loadRegistry();
  return skillId in registry.skills;
}
