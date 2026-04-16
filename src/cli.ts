/**
 * =============================================================================
 * SkillMarket CLI 命令行解析器
 * =============================================================================
 * 
 * 本文件是 SkillMarket CLI 的主入口，使用 commander.js 框架
 * 解析命令行参数并调用相应的命令模块。
 * 
 * CLI 命令结构:
 * 
 *   skm <command> [options] [arguments]
 * 
 * 支持的命令:
 * - skm ls              列出可用的 skills
 * - skm ls --installed  列出已安装的 skills
 * - skm info <skill>    显示 skill 详情
 * - skm install <skill> 安装 skill（支持 --platform）
 * - skm uninstall <skill> 卸载 skill（支持 --platform）
 * - skm update [skill] 更新 skill(s)
 * - skm sync            同步平台链接
 * - skm platforms       显示可用平台
 * 
 * @module cli
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

// Commander.js - 轻量级的命令行界面框架
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// 获取 package.json 中的版本号
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

// 内部模块导入
import { PLATFORMS } from './constants.js';        // 平台常量
import { listSkills } from './commands/ls.js';          // 列表命令
import { showSkillInfo } from './commands/info.js';     // 信息命令
import { installSkill } from './commands/install.js';   // 安装命令
import { syncPlatformLinks } from './commands/sync.js';  // 同步命令
import { updateSkill } from './commands/update.js';     // 更新命令
import { uninstallSkill } from './commands/uninstall.js'; // 卸载命令
import { detectPlatforms, getAllAdapters, OpenCodeAdapter, ClaudeAdapter, VSCodeAdapter } from './adapters/index.js'; // 平台适配器

// -----------------------------------------------------------------------------
// 创建命令程序实例
// -----------------------------------------------------------------------------

/**
 * 创建 CLI 程序实例
 * 
 * Commander.js 使用链式 API 配置命令选项和参数
 */
const program = new Command();

// -----------------------------------------------------------------------------
// 全局配置
// -----------------------------------------------------------------------------

/**
 * 配置程序的全局信息
 * 
 * - name: 程序名称（用于帮助信息和子命令）
 * - description: 程序描述
 * - version: 版本号
 */
program
  .name('skm')
  .description('SkillMarket - Cross-platform skill manager for AI coding tools')
  .version(VERSION);

// -----------------------------------------------------------------------------
// 帮助命令 (-h, --help)
// -----------------------------------------------------------------------------

/**
 * 自定义帮助命令
 * 
 * 显示详细的使用说明和命令示例
 */
program
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().help) {
  console.log(`
SkillMarket CLI

Usage: skm <command> [options]

Commands:
  ls [options]         List available skills
                          --installed    Show only installed skills
                          --updates      Check for updates
                          --page <n>     Page number (default: 1)
                          --limit <n>    Items per page (default: 20)
  info <skill-id>      Display skill information
  install <skill>      Install a skill
                          @version      Install specific version
                          --platform    Target platforms (opencode,claude,vscode)
                          --force       Overwrite if already installed
  uninstall <skill>    Remove an installed skill
                          --platform    Target platforms
  update [options]     Update skills
                          --all          Update all skills
  sync                 Synchronize platform links
  platforms            Show available platforms

Examples:
  skm ls                     List all available skills (page 1)
  skm ls --page 2            Go to page 2
  skm ls --limit 10          Show 10 items per page
  skm ls --installed         Show installed skills only
  skm ls --installed --page 2
  skm info brainstorming     View skill details
  skm install brainstorming  Install to all platforms
  skm install brainstorming --platform opencode  Install to OpenCode only
  skm install brainstorming --platform claude,vscode  Install to multiple
  skm uninstall brainstorming
  skm platforms              Show available platforms
      `);
      process.exit(0);
    }
  });

// -----------------------------------------------------------------------------
// 列表命令 (skm ls)
// -----------------------------------------------------------------------------

/**
 * 列表命令
 * 
 * 用于列出 npm 上可用的 skills 或本地已安装的 skills
 * 
 * 用法:
 * - skm ls              列出所有可用 skills
 * - skm ls --installed  列出已安装的 skills
 * - skm ls --updates    检查更新
 */
const lsCmd = program.command('ls').description('List available skills');
lsCmd
  .option('--installed', 'Show only installed skills')
  .option('--updates', 'Check for updates')
  .option('-p, --page <number>', 'Page number (default: 1)', parseInt)
  .option('-l, --limit <number>', 'Items per page (default: 20)', parseInt)
  .action((opts) => {
    // Ensure numeric options have default values if not provided
    const options = {
      ...opts,
      page: opts.page ?? 1,
      limit: opts.limit ?? 20
    };
    listSkills(options);
  });

// -----------------------------------------------------------------------------
// 信息命令 (skm info)
// -----------------------------------------------------------------------------

/**
 * 信息命令
 * 
 * 显示指定 skill 的详细信息
 * 
 * 用法: skm info <skill-id>
 * 
 * @example
 * skm info brainstorming
 */
const infoCmd = program.command('info').description('Display skill information');
infoCmd
  .argument('<skill-id>', 'Skill ID to show info')
  .action((skillId) => {
    showSkillInfo(skillId);
  });

// -----------------------------------------------------------------------------
// 安装命令 (skm install)
// -----------------------------------------------------------------------------

/**
 * 安装命令
 * 
 * 从 npm 安装指定的 skill 到本地和跨平台目录
 * 
 * 用法:
 * - skm install <skill>         安装到所有检测到的平台
 * - skm install <skill>@<ver>   安装指定版本
 * - skm install --platform opencode  安装到特定平台
 * - skm install --platform claude,vscode  安装到多个平台
 * - skm install --force         强制覆盖
 * 
 * @example
 * skm install brainstorming
 * skm install brainstorming@1.0.0
 * skm install brainstorming --platform opencode
 */
const installCmd = program.command('install').description('Install a skill to local and platform directories');
installCmd
  .argument('<skill>', 'Skill ID to install (e.g., brainstorming or @scope/name)')
  .option('-p, --platform <platforms>', 'Target platforms (comma-separated: opencode,claude,vscode)')
  .option('-f, --force', 'Overwrite if already installed')
  .option('-v, --version <version>', 'Specific version to install')
  .action(async (skill, opts) => {
    try {
      const platforms = opts.platform 
        ? opts.platform.split(',').map((p: string) => p.trim())
        : undefined;
      
      await installSkill(skill, opts.version, {
        platforms,
        force: opts.force
      });
    } catch (err) {
      console.error('Installation failed:', err);
      process.exit(1);
    }
  });

// -----------------------------------------------------------------------------
// 卸载命令 (skm uninstall)
// -----------------------------------------------------------------------------

/**
 * 卸载命令
 * 
 * 移除本地已安装的 skill 及各平台的文件
 * 
 * 用法:
 * - skm uninstall <skill>    卸载所有平台
 * - skm uninstall <skill> --platform opencode  卸载特定平台
 * 
 * @example
 * skm uninstall brainstorming
 * skm uninstall brainstorming --platform claude
 */
const uninstallCmd = program.command('uninstall').description('Remove an installed skill from local and platform directories');
uninstallCmd
  .argument('<skill>', 'Skill ID to uninstall')
  .option('-p, --platform <platforms>', 'Target platforms (comma-separated)')
  .action(async (skill, opts) => {
    try {
      const platforms = opts.platform 
        ? opts.platform.split(',').map((p: string) => p.trim())
        : undefined;
      
      await uninstallSkill(skill, { platforms });
    } catch (err) {
      console.error('Uninstall failed:', err);
      process.exit(1);
    }
  });

// -----------------------------------------------------------------------------
// 更新命令 (skm update)
// -----------------------------------------------------------------------------

/**
 * 更新命令
 * 
 * 更新本地安装的 skill(s) 到最新版本
 * 
 * 用法:
 * - skm update <skill>    更新指定 skill
 * - skm update --all      更新所有 skills
 * - skm update            更新所有 skills（默认）
 * 
 * @example
 * skm update brainstorming
 * skm update --all
 */
const updateCmd = program.command('update').description('Update installed skills');
updateCmd
  .argument('[skill]', 'Skill ID to update (optional, updates all if not specified)')
  .option('--all', 'Update all skills')
  .action(async (skill, opts) => {
    try {
      // 根据参数决定更新单个还是全部
      if (opts.all || !skill) {
        await updateSkill();
      } else {
        await updateSkill(skill);
      }
    } catch (err) {
      console.error('Update failed:', err);
      process.exit(1);
    }
  });

// -----------------------------------------------------------------------------
// 同步命令 (skm sync)
// -----------------------------------------------------------------------------

/**
 * 同步命令
 * 
 * 同步各平台的软链接，使 skills 可以被不同平台访问
 * 
 * 用法: skm sync
 */
program
  .command('sync')
  .description('Synchronize platform links')
  .action(async () => {
    try {
      await syncPlatformLinks();
    } catch (err) {
      console.error('Sync failed:', err);
      process.exit(1);
    }
  });

// -----------------------------------------------------------------------------
// 平台命令 (skm platforms)
// -----------------------------------------------------------------------------

/**
 * 平台命令
 * 
 * 显示所有支持的平台及其状态
 * 
 * 用法: skm platforms
 */
const platformsCmd = program.command('platforms').description('Show available platforms');
platformsCmd
  .action(async () => {
    try {
      const available = await detectPlatforms();
      
      console.log('\n📍 Available Platforms:\n');
      
      const allPlatforms = [
        { name: 'OpenCode', adapter: new OpenCodeAdapter() },
        { name: 'Claude Code', adapter: new ClaudeAdapter() },
        { name: 'VSCode', adapter: new VSCodeAdapter() },
      ];
      
      for (const { name, adapter } of allPlatforms) {
        const isAvailable = available.find(a => a.id === adapter.id);
        const installed = await adapter.listInstalled();
        
        if (isAvailable) {
          console.log(`${name.padEnd(12)} ✅  Available (${installed.length} skills installed)`);
        } else {
          console.log(`${name.padEnd(12)} ❌  Not detected`);
        }
      }
      
      console.log('');
    } catch (err) {
      console.error('Failed to list platforms:', err);
      process.exit(1);
    }
  });

// -----------------------------------------------------------------------------
// 解析命令行参数
// -----------------------------------------------------------------------------

/**
 * 解析 process.argv 中的命令行参数
 * 
 * Commander.js 会根据配置自动:
 * 1. 匹配命令和选项
 * 2. 验证必需参数
 * 3. 调用对应的 action 处理函数
 */
program.parse();
