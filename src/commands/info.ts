import { fetchNpmPackage } from './npm.js';
import { isSkillInstalled, getInstalledSkills } from './registry.js';

export async function showSkillInfo(skillId: string): Promise<void> {
  // Try @skillmarket/<skillId> first, then bare name
  const packageName = skillId.startsWith('@') 
    ? skillId 
    : `@skillmarket/${skillId}`;
  
  console.log(`Fetching info for: ${packageName}\n`);
  
  try {
    const info = await fetchNpmPackage(packageName);
    
    if (!info) {
      console.log(`Skill "${skillId}" not found in npm registry.`);
      return;
    }
    
    const latestVersion = info['dist-tags']?.latest;
    const versions = info.versions || {};
    const pkg = latestVersion ? versions[latestVersion] : undefined;
    
    // Check installation status
    const installed = await isSkillInstalled(skillId);
    const installedSkills = await getInstalledSkills();
    const installedSkill = installedSkills.find(s => s.id === skillId);
    
    console.log(`=== ${info.name} ===`);
    console.log(`Version: ${latestVersion}${installedSkill ? ` (installed: ${installedSkill.version})` : ''}`);
    console.log(`Description: ${pkg?.description || 'N/A'}\n`);
    
    // Show skillmarket metadata if available
    const skillmarketMeta = pkg?.skillmarket;
    if (skillmarketMeta) {
      console.log(`Platforms: ${skillmarketMeta.platforms?.join(', ') || 'N/A'}`);
      console.log(`Default Version: ${skillmarketMeta.defaultVersion || 'N/A'}\n`);
    }
    
    // Show available versions
    const versionKeys = Object.keys(versions);
    if (versionKeys.length > 0) {
      const recentVersions = versionKeys.slice(-10);
      console.log(`Recent versions: ${recentVersions.join(', ')}`);
    }
    
    if (installed) {
      console.log(`\nStatus: Installed (use skm --update ${skillId} to update)`);
    } else {
      console.log(`\nStatus: Not installed (use skm --install ${skillId} to install)`);
    }
  } catch (error) {
    console.log(`Error fetching skill info: ${error}`);
  }
}
