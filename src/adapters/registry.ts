/**
 * =============================================================================
 * Platform Registry
 * =============================================================================
 * 
 * Central registry for platform adapters.
 * Handles platform detection and selection.
 */

import { OpenCodeAdapter } from './opencode.js';
import { ClaudeAdapter } from './claude.js';
import { VSCodeAdapter } from './vscode.js';
import type { PlatformAdapter } from '../types.js';
import type { Platform } from '../constants.js';

const adapters: Map<string, PlatformAdapter> = new Map();

/**
 * Register all built-in platform adapters
 */
function registerAdapters(): void {
  const opencode = new OpenCodeAdapter();
  const claude = new ClaudeAdapter();
  const vscode = new VSCodeAdapter();
  
  adapters.set(opencode.id, opencode);
  adapters.set(claude.id, claude);
  adapters.set(vscode.id, vscode);
}

// Register adapters on module load
registerAdapters();

/**
 * Detect which platforms are available on the current system
 */
export async function detectPlatforms(): Promise<PlatformAdapter[]> {
  const available: PlatformAdapter[] = [];
  
  for (const adapter of adapters.values()) {
    if (await adapter.isAvailable()) {
      available.push(adapter);
    }
  }
  
  return available;
}

/**
 * Get adapter for a specific platform
 */
export function getPlatformAdapter(platformId: string): PlatformAdapter | undefined {
  return adapters.get(platformId);
}

/**
 * Get all registered adapters
 */
export function getAllAdapters(): PlatformAdapter[] {
  return Array.from(adapters.values());
}

/**
 * Get adapter by platform type
 */
export function getAdapterByPlatform(platform: Platform): PlatformAdapter | undefined {
  const idMap: Record<Platform, string> = {
    opencode: 'opencode',
    claude: 'claude',
    vscode: 'vscode',
    cursor: 'opencode',  // Cursor uses OpenCode-compatible structure
    codex: 'opencode',  // Codex uses OpenCode-compatible structure
    antigravity: 'opencode',  // Antigravity uses OpenCode-compatible structure
  };
  
  return adapters.get(idMap[platform]);
}
