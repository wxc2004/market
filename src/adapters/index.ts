/**
 * Platform adapters index
 */

export { BaseAdapter } from './base.js';
export { OpenCodeAdapter } from './opencode.js';
export { ClaudeAdapter } from './claude.js';
export { VSCodeAdapter } from './vscode.js';
export { detectPlatforms, getPlatformAdapter, getAllAdapters, getAdapterByPlatform } from './registry.js';
