/**
 * =============================================================================
 * VSCode (Copilot) Platform Adapter
 * =============================================================================
 * 
 * Handles skill installation for VSCode GitHub Copilot Agent Skills.
 * Skills are installed to ~/.copilot/skills/<skill-id>/
 * 
 * Note: Also supports ~/.claude/skills/ for cross-compatibility.
 */

import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { BaseAdapter } from './base.js';

export class VSCodeAdapter extends BaseAdapter {
  readonly id = 'vscode';
  readonly name = 'VSCode';
  
  get skillDir(): string {
    // Try ~/.copilot/skills first, fallback to ~/.claude/skills
    return path.join(os.homedir(), '.copilot', 'skills');
  }
  
  async isAvailable(): Promise<boolean> {
    // Check multiple possible locations
    const possibleDirs = [
      path.join(os.homedir(), '.copilot', 'skills'),
      path.join(os.homedir(), '.claude', 'skills'),
    ];
    
    for (const dir of possibleDirs) {
      try {
        await fs.ensureDir(dir);
        return true;
      } catch {
        continue;
      }
    }
    
    return false;
  }
  
  async install(skillId: string, sourceDir: string): Promise<void> {
    // Install to ~/.copilot/skills, but also create symlink in ~/.claude/skills
    await super.install(skillId, sourceDir);
    
    // Create cross-compatible symlink in ~/.claude/skills
    const claudeSkillDir = path.join(os.homedir(), '.claude', 'skills');
    const targetPath = this.getSkillPath(skillId);
    const claudeTargetPath = path.join(claudeSkillDir, skillId);
    
    try {
      await fs.ensureDir(claudeSkillDir);
      await fs.remove(claudeTargetPath);
      await fs.symlink(targetPath, claudeTargetPath, 'junction');
    } catch {
      // Silently fail if symlink not possible (cross-platform compatibility)
    }
  }
}
