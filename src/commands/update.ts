import { installSkill } from './install.js';
import { getInstalledSkills } from './registry.js';
import { fetchNpmPackage } from './npm.js';

export async function updateSkill(skillId?: string): Promise<void> {
  if (skillId) {
    // Update specific skill
    const pkgInfo = await fetchNpmPackage(`@skillmarket/${skillId}`);
    if (pkgInfo) {
      const latestVersion = pkgInfo['dist-tags']?.latest;
      console.log(`Updating ${skillId} to ${latestVersion}...`);
      await installSkill(skillId, latestVersion);
    }
    return;
  }
  
  // Update all skills
  const installed = await getInstalledSkills();
  
  if (installed.length === 0) {
    console.log('No skills installed to update.');
    return;
  }
  
  console.log(`Checking updates for ${installed.length} skill(s)...\n`);
  
  let hasUpdates = false;
  
  for (const skill of installed) {
    const pkgInfo = await fetchNpmPackage(`@skillmarket/${skill.id}`);
    if (pkgInfo) {
      const latestVersion = pkgInfo['dist-tags']?.latest;
      
      if (latestVersion && latestVersion !== skill.version) {
        console.log(`  ${skill.id}: ${skill.version} → ${latestVersion} [UPDATE]`);
        hasUpdates = true;
        
        try {
          await installSkill(skill.id, latestVersion);
        } catch (err) {
          console.error(`  Failed to update ${skill.id}:`, err);
        }
      } else {
        console.log(`  ${skill.id}: ${skill.version} (up to date)`);
      }
    }
  }
  
  if (!hasUpdates) {
    console.log('\nAll skills are up to date!');
  }
}
