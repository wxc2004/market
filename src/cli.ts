import { Command } from 'commander';
import { PLATFORMS } from './constants.js';
import { listSkills } from './commands/ls.js';
import { showSkillInfo } from './commands/info.js';

const program = new Command();

program
  .name('skm')
  .description('SkillMarket - Cross-platform skill manager for AI coding tools')
  .version('1.0.0');

// Display help with commands
program
  .option('-h, --help', 'Display help information')
  .action(() => {
    console.log(`
SkillMarket CLI

Usage: skm <command> [options]

Commands:
  --help, -h          Display this help message
  --ls [options]      List available skills
                        --installed    Show only installed skills
                        --updates      Check for updates
  --info <skill-id>   Display skill information
  --install <skill>   Install a skill (e.g., skm --install brainstorming)
                        @version      Install specific version
                        --all         Install all available skills
  --uninstall <skill> Remove an installed skill
  --update [options]  Update skills
                        --all          Update all skills
  --sync              Synchronize platform links
  --platform <name>   Set target platform (${PLATFORMS.join(', ')})

Examples:
  skm --ls                    List all available skills
  skm --ls --installed        Show installed skills only
  skm --info brainstorming     View skill details
  skm --install brainstorming Install a skill
  skm --install brainstorming@1.0.0 Install specific version
  skm --update --all           Update all installed skills
    `);
  });

// List skills command
program
  .option('-ls, --ls', 'List available skills')
  .option('--installed', 'Show only installed skills')
  .option('--updates', 'Check for updates')
  .action((opts) => {
    listSkills(opts);
  });

// Info command
const infoCmd = program.command('info').description('Display skill information');
infoCmd
  .argument('<skill-id>', 'Skill ID to show info')
  .action((skillId) => {
    showSkillInfo(skillId);
  });

// Install command
const installCmd = program.command('install').description('Install a skill');
installCmd
  .argument('<skill>', 'Skill ID to install (e.g., brainstorming or @scope/name)')
  .option('--all', 'Install all available skills')
  .action((skill, opts) => {
    console.log('Install command - skill:', skill, 'opts:', opts);
  });

// Uninstall command
const uninstallCmd = program.command('uninstall').description('Remove an installed skill');
uninstallCmd
  .argument('<skill>', 'Skill ID to uninstall')
  .action((skill) => {
    console.log('Uninstall command - skill:', skill);
  });

// Update command
const updateCmd = program.command('update').description('Update installed skills');
updateCmd
  .argument('[skill]', 'Skill ID to update (optional, updates all if not specified)')
  .option('--all', 'Update all skills')
  .action((skill, opts) => {
    console.log('Update command - skill:', skill, 'opts:', opts);
  });

// Sync command
program
  .command('sync')
  .description('Synchronize platform links')
  .action(() => {
    console.log('Sync command - not yet implemented');
  });

// Platform command
const platformCmd = program.command('platform').description('Set target platform');
platformCmd
  .argument('<name>', 'Platform name')
  .action((name) => {
    console.log('Platform command - name:', name);
  });

program.parse();
