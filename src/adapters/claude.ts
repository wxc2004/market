/**
 * =============================================================================
 * Claude Code Platform Adapter
 * =============================================================================
 * 
 * Handles skill installation for Claude Code CLI.
 * Skills are installed to ~/.claude/skills/<skill-id>/
 */

import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { BaseAdapter } from './base.js';

export class ClaudeAdapter extends BaseAdapter {
  readonly id = 'claude';
  readonly name = 'Claude Code';
  
  get skillDir(): string {
    return path.join(os.homedir(), '.claude', 'skills');
  }
  
  async isAvailable(): Promise<boolean> {
    // Check for environment variable or directory
    if (process.env.CLAUDE_CODE) return true;
    
    // Check if .claude directory exists
    const claudeDir = path.join(os.homedir(), '.claude');
    return fs.pathExists(claudeDir);
  }
}
