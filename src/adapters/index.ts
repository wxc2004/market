/**
 * Platform adapters index
 */

export { BaseAdapter } from './base.js';
export { OpenCodeAdapter } from './opencode.js';
export { ClaudeAdapter } from './claude.js';
export { VSCodeAdapter } from './vscode.js';
export { OpenClawAdapter } from './openclaw.js';
export { HermesAdapter } from './hermes.js';
export { SaitecAdapter } from './saitec.js';
export { CodexAdapter } from './codex.js';
export { detectPlatforms, getPlatformAdapter, getAllAdapters, getAdapterByPlatform } from './registry.js';
