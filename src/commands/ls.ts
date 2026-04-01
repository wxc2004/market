import { loadRegistry, getInstalledSkills } from './registry.js';
import { searchSkillmarketPackages, fetchNpmPackage } from './npm.js';

interface LsOptions {
  installed?: boolean;
  updates?: boolean;
}

export async function listSkills(options: LsOptions): Promise<void> {
  const { installed, updates } = options;
  
  if (installed) {
    const skills = await getInstalledSkills();
    
    if (skills.length === 0) {
      console.log('No skills installed yet. Run "skm --ls" to see available skills.');
      return;
    }
    
    console.log('Installed Skills:\n');
    for (const skill of skills) {
      console.log(`  ${skill.id}@${skill.version}`);
      console.log(`    Platforms: ${skill.platforms.join(', ')}`);
      console.log(`    Installed: ${skill.installedAt}`);
      console.log();
    }
    return;
  }
  
  // Show available skills from npm
  console.log('Searching npm registry...\n');
  
  try {
    const packages = await searchSkillmarketPackages();
    
    if (packages.length === 0) {
      console.log('No skills found. Check back later!');
      return;
    }
    
    console.log(`Found ${packages.length} skill(s):\n`);
    
    for (const pkgName of packages) {
      const info = await fetchNpmPackage(pkgName);
      if (info) {
        const latestVersion = info['dist-tags']?.latest;
        const pkg = info.versions[latestVersion];
        console.log(`  ${info.name}@${latestVersion}`);
        console.log(`    ${pkg?.description || 'No description'}`);
        console.log();
      }
    }
  } catch (error) {
    console.log(`Error fetching skills: ${error}`);
  }
}
