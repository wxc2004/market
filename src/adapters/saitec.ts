/**
 * Saitec TUI Platform Adapter
 * 
 * Installs skills to ~/.saitec_tui/skills/
 * Saitec TUI is a custom AI coding platform.
 */
import { BaseAdapter } from './base.js';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';

export class SaitecAdapter extends BaseAdapter {
  readonly id = 'saitec';
  readonly name = 'Saitec TUI';
  readonly skillDir = path.join(os.homedir(), '.saitec_tui', 'skills');

  async isAvailable(): Promise<boolean> {
    try {
      return await fs.pathExists(path.join(os.homedir(), '.saitec_tui'));
    } catch {
      return false;
    }
  }

  async isInstalled(skillId: string): Promise<boolean> {
    try {
      return await fs.pathExists(path.join(this.skillDir, skillId));
    } catch {
      return false;
    }
  }

  async install(skillId: string, sourceDir: string): Promise<void> {
    await fs.ensureDir(this.skillDir);
    const targetDir = path.join(this.skillDir, skillId);

    // Remove existing skill directory if present
    if (await fs.pathExists(targetDir)) {
      await fs.remove(targetDir);
    }

    // Copy entire skill directory (SKILL.md + supporting files)
    await fs.copy(sourceDir, targetDir, { recursive: true });
  }

  async uninstall(skillId: string): Promise<void> {
    const targetDir = path.join(this.skillDir, skillId);
    if (await fs.pathExists(targetDir)) {
      await fs.remove(targetDir);
    }
  }

  async listInstalled(): Promise<string[]> {
    try {
      if (!(await fs.pathExists(this.skillDir))) {
        return [];
      }
      const entries = await fs.readdir(this.skillDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }
}
