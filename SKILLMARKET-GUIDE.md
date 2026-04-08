# SkillMarket 开发与发布指南

## 目录

1. [SkillMarket 概述](#skillmarket-概述)
2. [创建自定义 Skill](#创建自定义-skill)
3. [发布 Skill 到 npm](#发布-skill-到-npm)
4. [通过 GitHub Actions 发布](#通过-github-actions-发布)
5. [用户安装使用](#用户安装使用)
6. [常见问题](#常见问题)

---

## SkillMarket 概述

SkillMarket 是一个跨平台的 skill 管理工具，用于管理 AI 编程工具（OpenCode、Cursor、VSCode、Claude Code 等）的技能插件。

### 核心概念

- **Skill**: 一个可安装的功能包，包含插件代码和元数据
- **Scope**: npm 作用域，用于组织相关包（如 `@wanxuchen/`）
- **平台支持**: 每个 skill 可以声明支持的平台

---

## 创建自定义 Skill

### 1. 创建 Skill 目录结构

在项目的 `skills/` 目录下创建新 skill：

```bash
skills/<skill-name>/
├── package.json      # 包配置（必须）
├── SKILL.md          # 文档（必须）
├── metadata.json     # 元数据（可选）
└── index.js         # 主入口（OpenCode 插件）
```

### 2. package.json 配置

```json
{
  "name": "@wanxuchen/<skill-name>",
  "version": "1.0.0",
  "description": "Skill 描述",
  "type": "module",
  "main": "index.js",
  "keywords": ["skillmarket"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "@opencode-ai/plugin": "^1.1.31"
  },
  "skillmarket": {
    "id": "<skill-name>",
    "displayName": "显示名称",
    "description": "详细描述",
    "platforms": ["opencode", "cursor", "vscode", "claude"]
  }
}
```

**关键字段说明：**

| 字段 | 说明 |
|------|------|
| `name` | 包名，格式为 `@wanxuchen/<skill-name>` |
| `skillmarket.id` | Skill 唯一标识符 |
| `skillmarket.displayName` | 显示名称 |
| `skillmarket.platforms` | 支持的平台列表 |

### 3. SKILL.md 文档

```markdown
# Skill 名称

## 功能描述

描述这个 skill 能做什么。

## 使用方法

```bash
skm install <skill-name>
skm info <skill-name>
```

## 平台支持

- OpenCode
- Cursor
- VSCode
```

### 4. index.js 插件代码

```javascript
import { tool } from "@opencode-ai/plugin";

export default async function MySkill() {
  console.log("✅ MySkill 加载成功!");

  return {
    tool: {
      // 定义工具
      myTool: tool({
        description: "工具描述",
        args: {
          param: tool.schema.string().describe("参数描述")
        },
        async execute({ param }, context) {
          return `执行结果: ${param}`;
        }
      })
    },
    
    // 可选：钩子
    "tool.execute.before": async (input) => {
      console.log(`即将执行: ${input.tool}`);
    }
  };
}
```

---

## 发布 Skill 到 npm

### 方式一：GitHub Actions（推荐）

1. **配置 NPM_TOKEN**
   - 在 https://www.npmjs.com/settings/tokens 创建 token
   - 或创建 Granular Access Token 并启用 "bypass 2fa for publish"
   - 在 GitHub 仓库 Settings → Secrets 添加 `NPM_TOKEN`

2. **运行 Publish Skill 工作流**
   - 进入仓库 **Actions** → **Publish Skill**
   - 点击 **Run workflow**
   - 输入 `skill_name`（如 `test-skill`）
   - 可选：输入 `version`（如 `1.0.0`）

### 方式二：本地发布

```bash
# 进入 skill 目录
cd skills/<skill-name>

# 安装依赖
npm install

# 发布
npm publish --access=public
```

**注意**：需要先登录 npm：
```bash
npm login
```

---

## 通过 GitHub Actions 发布

### 工作流配置

项目已包含 `.github/workflows/publish-skill.yml`：

```yaml
name: Publish Skill

on:
  workflow_dispatch:
    inputs:
      skill_name:
        description: 'Skill name (from skills/ directory)'
        required: true
        type: string
      version:
        description: 'Version (optional, defaults to patch)'
        required: false
        type: string
        default: ''

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: cd "skills/${{ github.event.inputs.skill_name }}" && npm install
      - run: |
          cd "skills/${{ github.event.inputs.skill_name }}"
          npm version patch --no-git-tag-version
      - run: cd "skills/${{ github.event.inputs.skill_name }}" && npm publish --access=public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 用户安装使用

### 安装 SkillMarket CLI

```bash
npm install -g @wanxuchen/skillmarket
```

### 基本命令

```bash
# 列出可用 skills
skm ls

# 查看 skill 详情
skm info <skill-name>

# 安装 skill
skm install <skill-name>

# 查看已安装
skm ls --installed

# 更新 skill
skm update <skill-name>

# 卸载 skill
skm uninstall <skill-name>
```

---

## 常见问题

### Q: 包名必须以 @wanxuchen/ 开头吗？

是的，这是当前配置的默认作用域。你可以在 `src/commands/install.ts` 中修改默认作用域。

### Q: 如何发布到 @skillmarket/ 组织？

需要先加入 npm "skillmarket" 组织，然后修改包名为 `@skillmarket/<skill-name>`。

### Q: 发布时遇到 403 错误？

需要启用 2FA 或创建带有 "bypass 2fa for publish" 权限的 Granular Access Token。

### Q: 如何本地测试？

```bash
# 在 skillmarket 目录
npm run build
npm install -g . --force

# 测试
skm ls
```

---

## 版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.0.0 | 2026-04-01 | 初始版本 |
| 1.0.1 | 2026-04-08 | 修复 GitHub Actions |
| 1.0.2 | 2026-04-08 | 添加发布工作流 |
| 1.0.3 | 2026-04-08 | 改进 ls 显示 |

---

## 许可证

MIT