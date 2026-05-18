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
const VERSION = packageJson.version || '1.3.1';

// 内部模块导入
import { PLATFORMS } from './constants.js';        // 平台常量
import { listSkills } from './commands/ls.js';          // 列表命令
import { searchSkills } from './commands/search.js';   // 搜索命令
import { showSkillInfo } from './commands/info.js';     // 信息命令
import { installSkill } from './commands/install.js';   // 安装命令
import { syncPlatformLinks, syncSkill } from './commands/sync.js';  // 同步命令
import { updateSkill } from './commands/update.js';     // 更新命令
import { uninstallSkill, uninstallAll } from './commands/uninstall.js'; // 卸载命令
import { installFromGitHub, parseGitHubUrl } from './commands/github-install.js'; // GitHub 安装
import { detectPlatforms, getAllAdapters } from './adapters/index.js'; // 平台适配器
import { publishSkill } from './commands/publish.js'; // 发布命令
import { verifySkill } from './commands/verify.js'; // 验证命令
import { startGuiServer } from './commands/ui.js'; // GUI 服务器
import {
  listConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
} from './commands/config.js'; // 配置命令
import {
  adminList,
  adminInfo,
  adminSearch,
  adminStats,
  adminVerify,
  adminDeprecate,
  adminUnpublish,
  adminTagSet,
  adminTagRemove,
  adminTagList,
  adminOwnerAdd,
  adminOwnerRemove,
  adminAccess,
} from './commands/admin.js'; // 管理员命令

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
                          -s, --search   Search by keyword
  info <skill-id>      Display skill information
  install <skill>      Install a skill
                          @version      Install specific version
                          --platform    Target platforms (opencode,claude,vscode)
                          --force       Overwrite if already installed
  uninstall <skill>    Remove an installed skill
                          --platform    Target platforms
                          --all          Uninstall ALL installed skills
                          --dry-run     Preview without deleting
                          -y, --yes     Skip confirmation
  update [options]     Update skills
                          --all          Update all skills
  sync                 Synchronize platform links
  platforms            Show available platforms
  config               View all configuration
      config get <key>  Get a config value
      config set <key>  Set a config value
      config reset [key] Reset config to defaults

Examples:
  skm ls                     List all available skills (page 1)
  skm ls --page 2            Go to page 2
  skm ls --limit 10          Show 10 items per page
  skm ls --search brain      Search skills by keyword
  skm ls -s brain           Search with short form
  skm ls --installed         Show installed skills only
  skm ls --installed --search test  Search installed skills
  skm ls --installed --page 2
  skm info brainstorming     View skill details
  skm install brainstorming  Install to all platforms
  skm install brainstorming --platform opencode  Install to OpenCode only
  skm install brainstorming --platform claude,vscode  Install to multiple
  skm uninstall brainstorming
  skm uninstall --all        Uninstall all skills (with confirmation)
  skm uninstall --all --yes  Force uninstall all without confirmation
  skm uninstall brainstorming --dry-run  Preview uninstall
  skm platforms              Show available platforms
  skm config                 View all configuration
  skm config get npmRegistry  View specific config
  skm config set npmRegistry https://registry.npmmirror.com  Set mirror registry
  skm config reset npmScope  Reset config to default
  skm config reset --all     Reset all config
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
  .option('-s, --search <keyword>', 'Search by keyword (id, displayName, description)')
  .action((opts) => {
    // Ensure numeric options have default values if not provided
    const options = {
      ...opts,
      page: opts.page ?? 1,
      limit: opts.limit ?? 20,
      search: opts.search
    };
    listSkills(options);
  });

// -----------------------------------------------------------------------------
// 搜索命令 (skm search)
// -----------------------------------------------------------------------------

/**
 * 搜索命令
 * 
 * 独立搜索 npm 上的 skills
 * 
 * 用法: skm search <keyword>
 * 
 * @example
 * skm search brain
 */
const searchCmd = program.command('search').description('Search skills from npm registry');
searchCmd
  .argument('<keyword>', 'Keyword to search')
  .option('-l, --limit <number>', 'Max results to show (default: 20)', parseInt)
  .action(async (keyword, opts) => {
    const limit = opts.limit ?? 20;
    await searchSkills(keyword, limit);
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
const installCmd = program.command('install').description('Install a skill from npm or GitHub');
installCmd
  .argument('<skill>', 'Skill ID, npm package, or GitHub URL (owner/repo, https://github.com/owner/repo)')
  .option('-p, --platform <platforms>', 'Target platforms (comma-separated: opencode,claude,vscode)')
  .option('-f, --force', 'Overwrite if already installed')
  .option('-v, --version <version>', 'Specific version to install (npm only)')
  .option('-b, --branch <branch>', 'GitHub branch to install from')
  .option('-c, --commit <commit>', 'GitHub commit hash to install from')
  .action(async (skill, opts) => {
    try {
      const platforms = opts.platform 
        ? opts.platform.split(',').map((p: string) => p.trim())
        : undefined;
      
      // 检测是否为 GitHub URL 或 owner/repo 格式
      const githubSource = parseGitHubUrl(skill);
      
      if (githubSource) {
        // GitHub 安装
        await installFromGitHub(skill, {
          platforms,
          force: opts.force,
          branch: opts.branch,
          commit: opts.commit
        });
      } else {
        // npm 安装
        await installSkill(skill, opts.version, {
          platforms,
          force: opts.force
        });
      }
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
 * - skm uninstall --all      卸载所有已安装的 skills
 * - skm uninstall --dry-run  预览删除内容
 * 
 * 新增 (v1.4.0):
 * --all: 卸载所有已安装的 skills（需要确认）
 * --dry-run: 预览模式，不实际删除
 * -y, --yes: 跳过确认提示
 * 
 * @example
 * skm uninstall brainstorming
 * skm uninstall brainstorming --platform claude
 * skm uninstall --all
 * skm uninstall --all --yes
 * skm uninstall brainstorming --dry-run
 */
const uninstallCmd = program.command('uninstall').description('Remove an installed skill from local and platform directories');
uninstallCmd
  .argument('[skill]', 'Skill ID to uninstall (required unless using --all)')
  .option('-p, --platform <platforms>', 'Target platforms (comma-separated)')
  .option('-a, --all', 'Uninstall ALL installed skills (requires confirmation)')
  .option('-d, --dry-run', 'Preview what would be uninstalled without actually deleting')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (skill, opts) => {
    try {
      const platforms = opts.platform 
        ? opts.platform.split(',').map((p: string) => p.trim())
        : undefined;
      
      // 处理 --all 选项
      if (opts.all) {
        await uninstallAll({
          platforms,
          dryRun: opts.dryRun,
          yes: opts.yes
        });
        return;
      }
      
      // skill 参数是必需的（除非使用 --all）
      if (!skill) {
        console.error('Error: Skill ID is required (or use --all to uninstall all)');
        process.exit(1);
      }
      
      await uninstallSkill(skill, {
        platforms,
        dryRun: opts.dryRun,
        yes: opts.yes
      });
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
// 同步命令 (skm sync [skill-name])
// -----------------------------------------------------------------------------

/**
 * 同步命令
 * 
 * - skm sync: 同步各平台的软链接
 * - skm sync <skill-name>: 同步指定 skill 到最新版本
 * 
 * 用法: 
 * skm sync
 * skm sync brainstorming
 */
program
  .command('sync [skill]')
  .description('Synchronize platform links or sync skill to latest version')
  .action(async (skill) => {
    try {
      if (skill) {
        // 同步指定 skill 到最新版本
        await syncSkill(skill);
      } else {
        // 同步平台软链接
        await syncPlatformLinks();
      }
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
      const allAdapters = getAllAdapters();
      
      console.log('\n📍 Available Platforms:\n');
      
      for (const adapter of allAdapters) {
        const isAvailable = available.find(a => a.id === adapter.id);
        const installed = await adapter.listInstalled();
        
        if (isAvailable) {
          console.log(`${adapter.name.padEnd(15)} ✅  Available (${installed.length} skills installed)`);
        } else {
          console.log(`${adapter.name.padEnd(15)} ❌  Not detected`);
        }
      }
      
      console.log('');
    } catch (err) {
      console.error('Failed to list platforms:', err);
      process.exit(1);
    }
  });

// -----------------------------------------------------------------------------
// GUI 命令 (skm gui)
// -----------------------------------------------------------------------------

/**
 * GUI 命令
 * 
 * 启动本地 Web 服务器，提供图形化界面管理 skills
 * 
 * 用法: skm gui [port]
 */
program
  .command('gui [port]')
  .description('Start SkillMarket GUI (web interface)')
  .action(async (port) => {
    const portNum = port ? parseInt(port) : 18770;
    startGuiServer(portNum);
  });

// -----------------------------------------------------------------------------
// Publish 命令 (skm publish)
// -----------------------------------------------------------------------------

/**
 * Publish 命令
 * 
 * 发布指定的 skill 到 npm
 * 
 * 用法: skm publish <skill-name> [--version <version>]
 */
program
  .command('publish <skill>')
  .description('Publish a skill to npm')
  .option('-v, --version <version>', 'Specify version (optional, auto-increment patch if not specified)')
  .action(async (skill, options) => {
    try {
      await publishSkill(skill, options.version ? { version: options.version } : undefined);
    } catch (err) {
      console.error('Publish failed:', err);
      process.exit(1);
    }
  });

// -----------------------------------------------------------------------------
// Verify 命令 (skm verify)
// -----------------------------------------------------------------------------

/**
 * Verify 命令
 * 
 * 验证 skill 的完整性和正确性
 * 
 * 用法: skm verify <skill-name>
 */
program
  .command('verify <skill>')
  .description('Verify skill integrity and format')
  .action(async (skill) => {
    try {
      await verifySkill(skill);
    } catch (err) {
      console.error('Verify failed:', err);
      process.exit(1);
    }
  });

// -----------------------------------------------------------------------------
// Config 命令组 (skm config)
// -----------------------------------------------------------------------------

const config = program.command('config').description('View and manage configuration');

config
  .command('list')
  .alias('ls')
  .description('List all configuration values')
  .action(async () => {
    await listConfig();
  });

// Default: `skm config` without subcommand → list
config
  .action(async () => {
    await listConfig();
  });

config
  .command('get <key>')
  .description('Get a specific configuration value')
  .action(async (key: string) => {
    await getConfigValue(key);
  });

config
  .command('set <key> <value>')
  .description('Set a configuration value (persisted to config file)')
  .action(async (key: string, value: string) => {
    await setConfigValue(key, value);
  });

config
  .command('reset [key]')
  .description('Reset configuration to default values')
  .option('--all', 'Reset all configuration values')
  .action(async (key: string | undefined, opts: { all?: boolean }) => {
    await resetConfig(key, opts.all ?? false);
  });

// -----------------------------------------------------------------------------
// Admin 命令组 (skm admin)
// -----------------------------------------------------------------------------

const admin = program.command('admin').description('Admin: manage published skills (cloud)');

admin
  .command('ls')
  .description('List all published skills')
  .action(async () => {
    try {
      await adminList();
    } catch (err) {
      console.error('Admin ls failed:', err);
      process.exit(1);
    }
  });

admin
  .command('info <skill>')
  .description('Show detailed info for a published skill')
  .action(async (skill) => {
    try {
      await adminInfo(skill);
    } catch (err) {
      console.error('Admin info failed:', err);
      process.exit(1);
    }
  });

admin
  .command('search <keyword>')
  .description('Search across published skills')
  .option('-l, --limit <number>', 'Max results (default: 20)', parseInt)
  .action(async (keyword, opts) => {
    try {
      await adminSearch(keyword, opts.limit ?? 20);
    } catch (err) {
      console.error('Admin search failed:', err);
      process.exit(1);
    }
  });

admin
  .command('stats')
  .description('Show publishing statistics')
  .action(async () => {
    try {
      await adminStats();
    } catch (err) {
      console.error('Admin stats failed:', err);
      process.exit(1);
    }
  });

admin
  .command('verify <skill>')
  .description('Verify a published skill structure and metadata')
  .action(async (skill) => {
    try {
      await adminVerify(skill);
    } catch (err) {
      console.error('Admin verify failed:', err);
      process.exit(1);
    }
  });

// ---- skm admin deprecate ----

admin
  .command('deprecate <skill>')
  .description('Deprecate a published skill (or specific version)')
  .option('-v, --version <version>', 'Deprecate a specific version only')
  .option('-m, --message <message>', 'Deprecation message')
  .action(async (skill, opts) => {
    try {
      await adminDeprecate(skill, {
        version: opts.version,
        message: opts.message,
      });
    } catch (err) {
      console.error('Admin deprecate failed:', err);
      process.exit(1);
    }
  });

// ---- skm admin unpublish ----

admin
  .command('unpublish <skill>')
  .description('Unpublish a skill (or specific version) from npm')
  .option('-v, --version <version>', 'Unpublish a specific version only')
  .option('-f, --force', 'Force unpublish entire package')
  .action(async (skill, opts) => {
    try {
      await adminUnpublish(skill, {
        version: opts.version,
        force: opts.force,
      });
    } catch (err) {
      console.error('Admin unpublish failed:', err);
      process.exit(1);
    }
  });

// ---- skm admin tag ----

const adminTag = admin.command('tag').description('Manage dist-tags for a skill');

adminTag
  .command('set <skill> <tag> <version>')
  .description('Set a dist-tag for a specific version')
  .action(async (skill, tag, version) => {
    try {
      await adminTagSet(skill, tag, version);
    } catch (err) {
      console.error('Admin tag set failed:', err);
      process.exit(1);
    }
  });

adminTag
  .command('rm <skill> <tag>')
  .description('Remove a dist-tag')
  .action(async (skill, tag) => {
    try {
      await adminTagRemove(skill, tag);
    } catch (err) {
      console.error('Admin tag rm failed:', err);
      process.exit(1);
    }
  });

adminTag
  .command('ls <skill>')
  .description('List all dist-tags for a skill')
  .action(async (skill) => {
    try {
      await adminTagList(skill);
    } catch (err) {
      console.error('Admin tag ls failed:', err);
      process.exit(1);
    }
  });

// ---- skm admin owner ----

const adminOwner = admin.command('owner').description('Manage package owners/maintainers');

adminOwner
  .command('add <skill> <user>')
  .description('Add an owner to a skill package')
  .action(async (skill, user) => {
    try {
      await adminOwnerAdd(skill, user);
    } catch (err) {
      console.error('Admin owner add failed:', err);
      process.exit(1);
    }
  });

adminOwner
  .command('rm <skill> <user>')
  .description('Remove an owner from a skill package')
  .action(async (skill, user) => {
    try {
      await adminOwnerRemove(skill, user);
    } catch (err) {
      console.error('Admin owner rm failed:', err);
      process.exit(1);
    }
  });

// ---- skm admin access ----

admin
  .command('access <skill> <level>')
  .description('Set package access (public|restricted)')
  .action(async (skill, level) => {
    try {
      if (level !== 'public' && level !== 'restricted') {
        console.error('❌ Access level must be "public" or "restricted"');
        process.exit(1);
      }
      await adminAccess(skill, level);
    } catch (err) {
      console.error('Admin access failed:', err);
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
