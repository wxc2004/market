/**
 * =============================================================================
 * OpenCode Platform Adapter
 * =============================================================================
 * 
 * Handles skill installation for OpenCode AI coding tool.
 * Skills are installed to ~/.config/opencode/skills/<skill-id>/
 */

import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { BaseAdapter } from './base.js';

export class OpenCodeAdapter extends BaseAdapter {
  readonly id = 'opencode';
  readonly name = 'OpenCode';
  
  get skillDir(): string {
    // Respect OPENCODE_CONFIG_DIR environment variable
    const configDir = process.env.OPENCODE_CONFIG_DIR 
      || path.join(os.homedir(), '.config', 'opencode');
    return path.join(configDir, 'skills');
  }
  
  async isAvailable(): Promise<boolean> {
    // Check for environment variable or directory
    if (process.env.OPENCODE) return true;
    
    const configDir = process.env.OPENCODE_CONFIG_DIR 
      || path.join(os.homedir(), '.config', 'opencode');
    
    try {
      await fs.ensureDir(path.join(configDir, 'skills'));
      return true;
    } catch {
      return false;
    }
  }
}
