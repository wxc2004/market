import { Command } from 'commander';
import { PLATFORMS } from './constants.js';
import { listSkills } from './commands/ls.js';

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

program.parse();
