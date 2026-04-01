import { Command } from 'commander';

const program = new Command();

program
  .name('skm')
  .description('SkillMarket - Cross-platform skill manager')
  .version('1.0.0');

program.parse();
