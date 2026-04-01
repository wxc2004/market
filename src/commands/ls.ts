import { loadRegistry, getInstalledSkills } from './registry.js';

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
  
  // TODO: Query npm registry for available skills
  console.log('Available Skills (from npm registry):\n');
  console.log('  Loading...');
  
  // Placeholder - will be implemented in Task 5
}
