/**
 * OpenClaw Platform Adapter
 * 
 * Installs skills to ~/.openclaw/skills/
 * OpenClaw uses AgentSkills-compatible SKILL.md format
 */
import { PlatformAdapter } from './base.js';
import { readdirSync, existsSync, cpSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { ensureDirSync } from 'fs-extra';

export class OpenClawAdapter implements PlatformAdapter {
  readonly id = 'openclaw';
  readonly name = 'OpenClaw';
  readonly skillDir = join(homedir(), '.openclaw', 'skills');

  async isAvailable(): Promise<boolean> {
    try {
      return existsSync(join(homedir(), '.openclaw'));
    } catch {
      return false;
    }
  }

  async isInstalled(skillId: string): Promise<boolean> {
    try {
      const skillPath = join(this.skillDir, skillId);
      return existsSync(skillPath);
    } catch {
      return false;
    }
  }

  async install(skillId: string, sourceDir: string): Promise<void> {
    ensureDirSync(this.skillDir);
    const targetDir = join(this.skillDir, skillId);
    
    // Remove existing skill directory if present
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }
    
    // Copy entire skill directory (SKILL.md + supporting files)
    cpSync(sourceDir, targetDir, { recursive: true });
  }

  async uninstall(skillId: string): Promise<void> {
    const targetDir = join(this.skillDir, skillId);
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }
  }

  async listInstalled(): Promise<string[]> {
    try {
      if (!existsSync(this.skillDir)) {
        return [];
      }
      return readdirSync(this.skillDir)
        .filter(name => {
          const fullPath = join(this.skillDir, name);
          return existsSync(fullPath) && name !== '.';
        });
    } catch {
      return [];
    }
  }
}
