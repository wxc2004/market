#!/usr/bin/env node
// Generate 18 test skills (test-skill-3 through test-skill-20)
const fs = require('fs');
const path = require('path');

const skillsDir = path.join(__dirname, '..', 'skills');

for (let i = 3; i <= 20; i++) {
  const name = `test-skill-${i}`;
  const dir = path.join(skillsDir, name);
  if (fs.existsSync(dir)) {
    console.log(`⏭️  ${name} already exists, skipping`);
    continue;
  }
  fs.mkdirSync(dir, { recursive: true });

  const displayName = `测试技能${i}`;
  const description = `Test Skill ${i} - 用于测试 SkillMarket 分页功能`;

  // package.json
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: `@wanxuchen/${name}`,
    version: '1.0.0',
    description: `Test Skill ${i} - 用于测试 SkillMarket 分页功能`,
    type: 'module',
    main: 'index.js',
    keywords: ['skillmarket', 'test'],
    author: 'SkillMarket',
    license: 'MIT',
    skillmarket: {
      id: name,
      displayName: displayName,
      description: description,
      platforms: ['opencode', 'cursor', 'vscode', 'claude', 'codex', 'antigravity']
    }
  }, null, 2));

  // SKILL.md
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `# ${displayName}

${description}

## 功能

- 验证 skm ls 分页功能
- 验证 GUI 分页功能

## 使用方法

\`\`\`bash
skm ls --page 2
\`\`\`

## 平台支持

- OpenCode
- Cursor
- VSCode
- Claude Code
- Codex
- Antigravity
`);

  // index.js
  fs.writeFileSync(path.join(dir, 'index.js'), `/**
 * ${displayName} - ${description}
 */

export default async function ${`TestSkill${i}`}() {
  console.log("✅ ${displayName} 加载成功!");

  return {
    name: "${name}",
    version: "1.0.0",
    status: "installed"
  };
}
`);

  // metadata.json
  fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify({
    id: name,
    displayName: displayName,
    description: description,
    version: '1.0.0',
    author: 'SkillMarket',
    platforms: ['opencode', 'cursor', 'vscode', 'claude', 'codex', 'antigravity'],
    tags: ['test', 'pagination']
  }, null, 2));

  console.log(`✅ Created ${name}`);
}

console.log('\n🎉 Done! 18 test skills created.');
