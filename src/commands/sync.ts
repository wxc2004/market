import fs from 'fs-extra';
import path from 'path';
import { 
  getSkillsDir, 
  getPlatformLinksDir, 
  ensureMarketDirs 
} from '../utils/dirs.js';
import { loadRegistry } from './registry.js';
import { PLATFORMS, LATEST_LINK } from '../constants.js';

export async function syncPlatformLinks(): Promise<void> {
  await ensureMarketDirs();
  
  const skillsDir = getSkillsDir();
  const platformLinksDir = getPlatformLinksDir();
  const registry = await loadRegistry();
  
  console.log('Syncing platform links...\n');
  
  // For each platform
  for (const platform of PLATFORMS) {
    const platformDir = path.join(platformLinksDir, platform, 'skills');
    await fs.ensureDir(platformDir);
    
    // For each installed skill
    for (const [skillId, skillInfo] of Object.entries(registry.skills)) {
      const skillLatestLink = path.join(skillsDir, skillId, LATEST_LINK);
      const platformSkillDir = path.join(platformDir, skillId);
      
      if (await fs.pathExists(skillLatestLink)) {
        // Create link to platform-specific version inside the skill
        const targetPlatformDir = path.join(skillLatestLink, platform);
        
        if (await fs.pathExists(targetPlatformDir)) {
          try {
            await fs.remove(platformSkillDir);
            await fs.symlink(targetPlatformDir, platformSkillDir, 'junction');
            console.log(`  Linked: ${platform}/${skillId}`);
          } catch {
            // On Windows, symlink might fail, copy as fallback
            await fs.copy(targetPlatformDir, platformSkillDir, { overwrite: true });
            console.log(`  Copied: ${platform}/${skillId}`);
          }
        }
      }
    }
  }
  
  console.log('\n✅ Sync complete!');
}
