import { PLATFORMS } from '../constants.js';

export type Platform = typeof PLATFORMS[number];

export function detectPlatform(): Platform {
  if (process.env.OPENCODE) return 'opencode';
  if (process.env.CURSOR) return 'cursor';
  if (process.env.VSCODE) return 'vscode';
  if (process.env.CLAUDE_CODE) return 'claude';
  if (process.env.ANTIGRAVITY) return 'antigravity';
  return 'codex'; // Default fallback
}

export function isValidPlatform(name: string): name is Platform {
  return PLATFORMS.includes(name as Platform);
}

export function getPlatformFromInput(name: string): Platform | null {
  return isValidPlatform(name.toLowerCase()) ? name.toLowerCase() as Platform : null;
}
