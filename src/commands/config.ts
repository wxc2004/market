/**
 * =============================================================================
 * SkillMarket Config 命令模块
 * =============================================================================
 *
 * 提供 `skm config` 命令组，管理 SkillMarket 的持久化配置。
 *
 * 配置文件存储在 ~/.skillmarket/config.json，与现有的 env var 机制互补。
 * 优先级（高 → 低）:
 *   1. 环境变量 (SKM_NPM_SCOPE, SKM_NPM_REGISTRY, ...)
 *   2. 配置文件 ~/.skillmarket/config.json
 *   3. 硬编码默认值 (src/config.ts)
 *
 * 命令:
 *   skm config                   列出所有配置项及来源
 *   skm config get <key>         查看指定配置项的值
 *   skm config set <key> <value> 设置配置项（写入 config.json）
 *   skm config reset [key]       重置指定配置项为默认值
 *   skm config reset --all       重置所有配置项为默认值
 *
 * @module commands/config
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// -----------------------------------------------------------------------------
// 类型定义
// -----------------------------------------------------------------------------

/** 配置值来源 */
export type ConfigSource = 'env' | 'file' | 'default';

/** 带来源信息的配置项 */
export interface ConfigEntry {
  key: string;
  value: string;
  defaultValue: string;
  source: ConfigSource;
  envVar: string;
  description: string;
}

/** 配置文件数据结构 */
export interface ConfigFile {
  npmScope?: string;
  npmScopeFallback?: string;
  npmRegistry?: string;
  npmScopes?: string;
  skmUrl?: string;
  githubToken?: string;
}

// -----------------------------------------------------------------------------
// 常量
// -----------------------------------------------------------------------------

/** 所有可配置项的元信息 */
export const CONFIG_DEFINITIONS: Omit<ConfigEntry, 'value' | 'source'>[] = [
  {
    key: 'npmScope',
    envVar: 'SKM_NPM_SCOPE',
    defaultValue: '@itismyskillmarket',
    description: 'Primary npm scope for publishing and lookup',
  },
  {
    key: 'npmScopeFallback',
    envVar: 'SKM_NPM_SCOPE_FALLBACK',
    defaultValue: '@wanxuchen',
    description: 'Fallback npm scope (backward compatibility)',
  },
  {
    key: 'npmRegistry',
    envVar: 'SKM_NPM_REGISTRY',
    defaultValue: 'https://registry.npmjs.org',
    description: 'npm registry URL (mirror/proxy support)',
  },
  {
    key: 'npmScopes',
    envVar: 'SKM_NPM_SCOPES',
    defaultValue: '@itismyskillmarket,@wanxuchen,@thisisskillmarket,@this-is-skillmarket,@skillmarket',
    description: 'Comma-separated list of npm scopes to search',
  },
  {
    key: 'skmUrl',
    envVar: 'SKM_URL',
    defaultValue: 'https://www.npmjs.com/package/@itismyskillmarket',
    description: 'Base URL for skill links (publish output)',
  },
];

// -----------------------------------------------------------------------------
// 配置文件的读写
// -----------------------------------------------------------------------------

/** 获取配置文件路径 ~/.skillmarket/config.json */
function getConfigPath(): string {
  return path.join(os.homedir(), '.skillmarket', 'config.json');
}

/**
 * 从配置文件读取配置
 * 如果文件不存在或解析失败，返回空对象
 */
export async function readConfigFile(): Promise<ConfigFile> {
  try {
    const configPath = getConfigPath();
    if (await fs.pathExists(configPath)) {
      const data = await fs.readJson(configPath);
      // 只返回合法的配置键
      const valid: ConfigFile = {};
      for (const def of CONFIG_DEFINITIONS) {
        if (data[def.key] !== undefined) {
          (valid as any)[def.key] = String(data[def.key]);
        }
      }
      // 额外读取 githubToken（不在 CONFIG_DEFINITIONS 中，避免暴露在 skm config 列表里）
      if (data.githubToken !== undefined) {
        valid.githubToken = String(data.githubToken);
      }
      return valid;
    }
  } catch {
    // 忽略读取错误
  }
  return {};
}

/**
 * 写入配置文件
 * 合并现有配置，仅修改指定键
 */
export async function writeConfigFile(updates: ConfigFile): Promise<ConfigFile> {
  const configPath = getConfigPath();
  await fs.ensureDir(path.dirname(configPath));

  let existing: ConfigFile = {};
  try {
    if (await fs.pathExists(configPath)) {
      existing = await fs.readJson(configPath);
    }
  } catch {
    // 忽略读取错误
  }

  // 合并写入
  const merged: ConfigFile = { ...existing, ...updates };
  // 删除值为 undefined 的键
  for (const key of Object.keys(merged) as (keyof ConfigFile)[]) {
    if (merged[key] === undefined) {
      delete merged[key];
    }
  }

  await fs.writeJson(configPath, merged, { spaces: 2 });
  return merged;
}

/**
 * 删除配置文件中的指定键
 */
export async function removeConfigKeys(keys: (keyof ConfigFile)[]): Promise<void> {
  const configPath = getConfigPath();
  if (!(await fs.pathExists(configPath))) return;

  try {
    const existing: ConfigFile = await fs.readJson(configPath);
    for (const key of keys) {
      delete existing[key];
    }
    await fs.writeJson(configPath, existing, { spaces: 2 });
  } catch {
    // 忽略
  }
}

/** 删除整个配置文件 */
export async function removeConfigFile(): Promise<void> {
  const configPath = getConfigPath();
  if (await fs.pathExists(configPath)) {
    await fs.remove(configPath);
  }
}

// -----------------------------------------------------------------------------
// 收集所有配置项及其来源
// -----------------------------------------------------------------------------

/**
 * 获取所有配置项的当前值及来源
 *
 * 优先级: 环境变量 > 配置文件 > 默认值
 */
export async function getAllConfig(): Promise<ConfigEntry[]> {
  const fileConfig = await readConfigFile();

  return CONFIG_DEFINITIONS.map((def) => {
    // 1. 检查环境变量
    const envValue = process.env[def.envVar];
    if (envValue !== undefined) {
      return {
        ...def,
        value: envValue,
        source: 'env' as ConfigSource,
      };
    }

    // 2. 检查配置文件
    const fileValue = fileConfig[def.key as keyof ConfigFile];
    if (fileValue !== undefined) {
      return {
        ...def,
        value: fileValue,
        source: 'file' as ConfigSource,
      };
    }

    // 3. 使用默认值
    return {
      ...def,
      value: def.defaultValue,
      source: 'default' as ConfigSource,
    };
  });
}

/**
 * 获取单个配置项的值
 */
export async function getConfig(key: string): Promise<ConfigEntry | null> {
  const all = await getAllConfig();
  return all.find(c => c.key === key) || null;
}

// -----------------------------------------------------------------------------
// CLI 命令实现
// -----------------------------------------------------------------------------

/**
 * skm config — 列出所有配置项
 */
export async function listConfig(): Promise<void> {
  const entries = await getAllConfig();

  console.log('\n🔧 SkillMarket Configuration\n');

  // 找出最长 key 用于对齐
  const maxKeyLen = Math.max(...entries.map(e => e.key.length));

  for (const entry of entries) {
    const key = entry.key.padEnd(maxKeyLen + 2);
    const sourceBadge = getSourceBadge(entry.source);
    console.log(`  ${sourceBadge}  ${key}${entry.value}`);
  }

  console.log('');
  console.log('  来源: 🔵 环境变量  🟢 配置文件  ⚪ 默认值');
  console.log('  配置文件: ' + getConfigPath());
  console.log('');
  console.log('  用法:');
  console.log('    skm config get <key>      查看配置值');
  console.log('    skm config set <key> <v>  设置配置值');
  console.log('    skm config reset <key>    重置为默认值');
  console.log('    skm config reset --all    全部重置');
  console.log('');
}

/** 获取来源标识 */
function getSourceBadge(source: ConfigSource): string {
  switch (source) {
    case 'env': return '🔵';
    case 'file': return '🟢';
    case 'default': return '⚪';
  }
}

/**
 * skm config get <key> — 查看指定配置
 */
export async function getConfigValue(key: string): Promise<void> {
  const entry = await getConfig(key);
  if (!entry) {
    throw new Error(
      `Unknown config key: "${key}"\n` +
      `   Valid keys: ${CONFIG_DEFINITIONS.map(d => d.key).join(', ')}`
    );
  }

  console.log(`\n🔧 ${entry.key}`);
  console.log(`   Value:       ${entry.value}`);
  console.log(`   Source:      ${entry.source}`);
  console.log(`   Env var:     ${entry.envVar}`);
  console.log(`   Default:     ${entry.defaultValue}`);
  console.log(`   Description: ${entry.description}`);
  console.log('');
}

/**
 * skm config set <key> <value> — 设置配置值
 */
export async function setConfigValue(key: string, value: string): Promise<void> {
  const def = CONFIG_DEFINITIONS.find(d => d.key === key);
  if (!def) {
    throw new Error(
      `Unknown config key: "${key}"\n` +
      `   Valid keys: ${CONFIG_DEFINITIONS.map(d => d.key).join(', ')}`
    );
  }

  await writeConfigFile({ [key]: value } as ConfigFile);
  console.log(`\n✅ ${key} set to "${value}"`);
  console.log(`   Stored in: ${getConfigPath()}`);
  console.log('');

  // 提示环境变量优先级
  if (process.env[def.envVar] !== undefined) {
    console.log(`   ⚠️  Currently overridden by environment variable ${def.envVar}=${process.env[def.envVar]}`);
    console.log(`   To use the config file value, unset the environment variable.`);
    console.log('');
  }
}

/**
 * skm config reset [key] — 重置配置
 * skm config reset --all — 重置所有
 */
export async function resetConfig(key?: string, all = false): Promise<void> {
  if (all) {
    await removeConfigFile();
    console.log('\n✅ All configuration reset to defaults.');
    console.log(`   Removed: ${getConfigPath()}`);
    console.log('');
    return;
  }

  if (key) {
    const def = CONFIG_DEFINITIONS.find(d => d.key === key);
    if (!def) {
      throw new Error(
        `Unknown config key: "${key}"\n` +
        `   Valid keys: ${CONFIG_DEFINITIONS.map(d => d.key).join(', ')}`
      );
    }

    await removeConfigKeys([key as keyof ConfigFile]);
    const sourceNow = process.env[def.envVar] ? 'env' : 'default';
    console.log(`\n✅ ${key} reset to ${sourceNow === 'env' ? 'environment variable' : 'default'} value.`);
    console.log(`   Effective value: "${sourceNow === 'env' ? process.env[def.envVar] : def.defaultValue}"`);
    console.log('');
    return;
  }

  // 没有参数也没有 --all：显示帮助
  console.log('\n🔧 Usage: skm config reset <key>');
  console.log('         skm config reset --all');
  console.log(`   Valid keys: ${CONFIG_DEFINITIONS.map(d => d.key).join(', ')}`);
  console.log('');
}
