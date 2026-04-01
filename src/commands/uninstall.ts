import fs from 'fs-extra';
import path from 'path';
import { loadRegistry, saveRegistry } from './registry.js';
import { getSkillsDir, getPlatformLinksDir } from '../utils/dirs.js';
import { PLATFORMS } from '../constants.js';

export async function uninstallSkill(skillId: string): Promise<void> {
  const registry = await loadRegistry();
  
  if (!(skillId in registry.skills)) {
    console.log(`Skill "${skillId}" is not installed.`);
    return;
  }
  
  const skillInfo = registry.skills[skillId];
  
  console.log(`Uninstalling ${skillId}@${skillInfo.version}...`);
  
  // Remove skill directory
  const skillsDir = getSkillsDir();
  const skillDir = path.join(skillsDir, skillId);
  await fs.remove(skillDir);
  
  // Remove from platform links
  const platformLinksDir = getPlatformLinksDir();
  for (const platform of PLATFORMS) {
    const linkPath = path.join(platformLinksDir, platform, 'skills', skillId);
    if (await fs.pathExists(linkPath)) {
      await fs.remove(linkPath);
    }
  }
  
  // Update registry
  delete registry.skills[skillId];
  await saveRegistry(registry);
  
  console.log(`\n✅ ${skillId} uninstalled successfully!`);
}
