/**
 * =============================================================================
 * Base Platform Adapter
 * =============================================================================
 * 
 * Abstract base class for platform-specific skill adapters.
 * Provides common functionality for all platforms.
 */

import fs from 'fs-extra';
import path from 'path';
import type { PlatformAdapter } from '../types.js';

export abstract class BaseAdapter implements PlatformAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly skillDir: string;
  
  /**
   * Get the path where a specific skill should be installed
   */
  protected getSkillPath(skillId: string): string {
    return path.join(this.skillDir, skillId);
  }
  
  /**
   * Get the path to the SKILL.md file for a skill
   */
  protected getSkillFilePath(skillId: string): string {
    return path.join(this.getSkillPath(skillId), 'SKILL.md');
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      await fs.ensureDir(this.skillDir);
      return true;
    } catch {
      return false;
    }
  }
  
  async isInstalled(skillId: string): Promise<boolean> {
    const skillFile = this.getSkillFilePath(skillId);
    return fs.pathExists(skillFile);
  }
  
  async install(skillId: string, sourceDir: string): Promise<void> {
    const targetDir = this.getSkillPath(skillId);
    const targetFile = this.getSkillFilePath(skillId);
    
    await fs.ensureDir(targetDir);
    
    const sourceFile = path.join(sourceDir, 'SKILL.md');
    if (!(await fs.pathExists(sourceFile))) {
      throw new Error(`SKILL.md not found in ${sourceDir}`);
    }
    
    await fs.copy(sourceFile, targetFile, { overwrite: true });
  }
  
  async uninstall(skillId: string): Promise<void> {
    const targetDir = this.getSkillPath(skillId);
    if (await fs.pathExists(targetDir)) {
      await fs.remove(targetDir);
    }
  }
  
  async listInstalled(): Promise<string[]> {
    if (!(await fs.pathExists(this.skillDir))) {
      return [];
    }
    
    const entries = await fs.readdir(this.skillDir, { withFileTypes: true });
    const skills: string[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFile = path.join(this.skillDir, entry.name, 'SKILL.md');
        if (await fs.pathExists(skillFile)) {
          skills.push(entry.name);
        }
      }
    }
    
    return skills;
  }
}
