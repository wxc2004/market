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
 * - skm install <skill> 安装 skill
 * - skm uninstall <skill> 卸载 skill
 * - skm update [skill] 更新 skill(s)
 * - skm sync            同步平台链接
 * 
 * @module cli
 */

// -----------------------------------------------------------------------------
// 导入依赖
// -----------------------------------------------------------------------------

// Commander.js - 轻量级的命令行界面框架
import { Command } from 'commander';

// 内部模块导入
import { PLATFORMS } from './constants.js';        // 平台常量
import { listSkills } from './commands/ls.js';          // 列表命令
import { showSkillInfo } from './commands/info.js';     // 信息命令
import { installSkill } from './commands/install.js';   // 安装命令
import { syncPlatformLinks } from './commands/sync.js';  // 同步命令
import { updateSkill } from './commands/update.js';     // 更新命令
import { uninstallSkill } from './commands/uninstall.js'; // 卸载命令

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
  .version('1.0.0');

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
  info <skill-id>      Display skill information
  install <skill>      Install a skill (e.g., skm install brainstorming)
                         @version      Install specific version
                         --all         Install all available skills
  uninstall <skill>    Remove an installed skill
  update [options]     Update skills
                         --all          Update all skills
  sync                 Synchronize platform links
  platform <name>      Set target platform (${PLATFORMS.join(', ')})

Examples:
  skm ls                     List all available skills
  skm ls --installed         Show installed skills only
  skm info brainstorming     View skill details
  skm install brainstorming  Install a skill
  skm install brainstorming@1.0.0 Install specific version
  skm update --all           Update all installed skills
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
  .action((opts) => {
    listSkills(opts);
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
 * 从 npm 安装指定的 skill 到本地
 * 
 * 用法:
 * - skm install <skill>         安装最新版本
 * - skm install <skill>@<ver>   安装指定版本
 * - skm install --all            安装所有可用 skills（预留）
 * 
 * @example
 * skm install brainstorming
 * skm install brainstorming@1.0.0
 */
const installCmd = program.command('install').description('Install a skill');
installCmd
  .argument('<skill>', 'Skill ID to install (e.g., brainstorming or @scope/name)')
  .option('--all', 'Install all available skills')
  .action(async (skill, opts) => {
    try {
      await installSkill(skill);
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
 * 移除本地已安装的 skill
 * 
 * 用法: skm uninstall <skill-id>
 * 
 * @example
 * skm uninstall brainstorming
 */
const uninstallCmd = program.command('uninstall').description('Remove an installed skill');
uninstallCmd
  .argument('<skill>', 'Skill ID to uninstall')
  .action(async (skill) => {
    try {
      await uninstallSkill(skill);
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
// 平台命令 (skm platform)
// -----------------------------------------------------------------------------

/**
 * 平台命令（预留）
 * 
 * 设置默认目标平台
 * 
 * 用法: skm platform <name>
 */
const platformCmd = program.command('platform').description('Set target platform');
platformCmd
  .argument('<name>', 'Platform name')
  .action((name) => {
    console.log('Platform command - name:', name);
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
