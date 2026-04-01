import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fetchNpmPackage } from './npm.js';
import { loadRegistry, saveRegistry } from './registry.js';
import { getCacheDir, getSkillsDir, ensureMarketDirs } from '../utils/dirs.js';
import { detectPlatform } from '../utils/platform.js';
import { LATEST_LINK } from '../constants.js';
import type { InstalledSkill } from '../types.js';

const execAsync = promisify(exec);

export async function installSkill(
  skillId: string, 
  version?: string
): Promise<void> {
  await ensureMarketDirs();
  
  const packageName = skillId.startsWith('@') 
    ? skillId 
    : `@skillmarket/${skillId}`;
  
  console.log(`Installing ${packageName}${version ? `@${version}` : ''}...`);
  
  // 1. Fetch package info
  const pkgInfo = await fetchNpmPackage(packageName);
  if (!pkgInfo) {
    throw new Error(`Package ${packageName} not found`);
  }
  
  const targetVersion = version || pkgInfo['dist-tags']?.latest;
  if (!targetVersion) {
    throw new Error(`No version found for ${packageName}`);
  }
  
  // 2. Download package via npm pack
  const cacheDir = getCacheDir();
  const targetDir = path.join(cacheDir, `${packageName}@${targetVersion}`);
  
  if (!(await fs.pathExists(targetDir))) {
    console.log('Downloading package...');
    await fs.ensureDir(cacheDir);
    
    try {
      await execAsync(`npm pack ${packageName}@${targetVersion} --pack-destination ${cacheDir}`);
      
      // Find and extract the tarball
      const files = await fs.readdir(cacheDir);
      const tarball = files.find(f => f.endsWith('.tgz') && f.includes(packageName.replace('/', '-')));
      
      if (tarball) {
        await execAsync(`tar -xzf "${path.join(cacheDir, tarball)}" -C "${cacheDir}"`);
        await fs.remove(path.join(cacheDir, tarball));
        
        // Rename extracted folder
        const extractedDir = path.join(cacheDir, 'package');
        const finalDir = targetDir;
        await fs.move(extractedDir, finalDir, { overwrite: true });
      }
    } catch (err) {
      throw new Error(`Failed to download package: ${err}`);
    }
  }
  
  // 3. Extract platform-specific files
  const skillsDir = getSkillsDir();
  const skillVersionDir = path.join(skillsDir, `${skillId}@${targetVersion}`);
  
  console.log('Setting up skill...');
  await fs.ensureDir(skillVersionDir);
  
  // Copy SKILL.md and metadata if they exist
  const pkgRoot = targetDir;
  
  if (await fs.pathExists(path.join(pkgRoot, 'SKILL.md'))) {
    await fs.copy(path.join(pkgRoot, 'SKILL.md'), path.join(skillVersionDir, 'SKILL.md'));
  }
  
  if (await fs.pathExists(path.join(pkgRoot, 'metadata.json'))) {
    await fs.copy(path.join(pkgRoot, 'metadata.json'), path.join(skillVersionDir, 'metadata.json'));
  }
  
  // 4. Create latest symlink
  const skillDir = path.join(skillsDir, skillId);
  await fs.ensureDir(skillDir);
  const latestLink = path.join(skillDir, LATEST_LINK);
  
  try {
    await fs.remove(latestLink);
    await fs.symlink(skillVersionDir, latestLink, 'junction');
  } catch {
    // On Windows, junction might fail, use directory copy as fallback
    await fs.copy(skillVersionDir, path.join(skillDir, LATEST_LINK), { overwrite: true });
  }
  
  // 5. Update registry
  const registry = await loadRegistry();
  const platforms = detectPlatform();
  
  registry.skills[skillId] = {
    id: skillId,
    version: targetVersion,
    installedAt: new Date().toISOString(),
    platforms: [platforms]
  } as InstalledSkill;
  
  await saveRegistry(registry);
  
  console.log(`\n✅ ${skillId}@${targetVersion} installed successfully!`);
  console.log(`   Use "skm info ${skillId}" for more details`);
}
