# SkillMarket 开发与发布指南

## 目录

1. [SkillMarket 概述](#skillmarket-概述)
2. [创建自定义 Skill](#创建自定义-skill)
3. [发布 Skill 到 npm](#发布-skill-到-npm)
4. [通过 GitHub Actions 发布](#通过-github-actions-发布)
5. [管理员命令](#管理员命令-skm-admin)
6. [环境变量配置](#环境变量配置)
7. [GUI 图形界面](#gui-图形界面)
8. [用户安装使用](#用户安装使用)
9. [常见问题](#常见问题)

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

## 管理员命令 (`skm admin`)

管理员命令用于管理云端已发布的 skills。所有命令直接查询 npm registry。

```bash
# 列出所有已发布的 skills
skm admin ls

# 查看 skill 完整信息（版本历史、dist-tags、元数据）
skm admin info <skill>

# 搜索已发布的 skills
skm admin search <keyword>

# 发布统计
skm admin stats

# 验证已发布 skill 的结构和元数据
skm admin verify <skill>
```

### 输出示例

```bash
$ skm admin stats

📊 SkillMarket Publishing Statistics

📦 Total published skills: 3
📝 Total versions: 10
📋 Skills with skillmarket metadata: 3/3
🔧 Platforms covered: 6 (opencode, cursor, vscode, claude, codex, antigravity)
🏆 Most versions: @scope/test-skill-1 (4)
🔗 Registry: https://registry.npmjs.org
```

---

## 环境变量配置

从 v1.3.11 开始，个人相关配置可通过环境变量覆盖。

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `SKM_NPM_SCOPE` | `@itismyskillmarket` | 主要 npm scope，用于发布/查找 skill |
| `SKM_NPM_SCOPE_FALLBACK` | `@wanxuchen` | 回退 scope（兼容旧安装） |
| `SKM_NPM_SCOPES` | `@itismyskillmarket,@wanxuchen,...` | 搜索时尝试的 scope 列表（逗号分隔） |
| `SKM_NPM_REGISTRY` | `https://registry.npmjs.org` | npm registry 地址 |
| `SKM_URL` | `https://www.npmjs.com/package/@itismyskillmarket` | 个人链接前缀（publish 输出用） |

### 使用示例

```bash
# 使用自己的 npm scope
export SKM_NPM_SCOPE=@mycompany
export SKM_URL=https://my-registry.example.com/my-skills

# 发布后链接自动使用配置的值
skm publish my-skill
# → View at: https://my-registry.example.com/my-skills/my-skill

# admin 命令自动读取 scope
skm admin ls    # 搜索 @mycompany scope 下的包
```

---

## GUI 图形界面

SkillMarket 提供 Web GUI 界面：

```bash
# 启动 GUI（默认端口 18770）
skm gui

# 指定端口
skm gui 18790
```

GUI 包含以下视图：

| 视图 | 功能 |
|------|------|
| **Skills** | 浏览可用 skills，搜索、安装 |
| **Installed** | 管理已安装 skills，更新/卸载 |
| **Platforms** | 查看各平台状态 |
| **Help** | Action 使用说明、环境变量文档、命令速查 |

GUI 中 Help 视图显示当前生效的环境变量值和完整的操作文档。

---

## 用户安装使用

### 安装 SkillMarket CLI

```bash
npm install -g itismyskillmarket
```

或使用 npx（无需安装）：

```bash
npx itismyskillmarket --help
```

### 基本命令
```bash
# 列出可用 skills（支持分页）
skm ls
# 分页浏览
skm ls --page 2           # 第 2 页
skm ls --limit 10         # 每页 10 个

# 查看 skill 详情
skm info <skill-name>

# 安装 skill
skm install <skill-name>
# 安装到指定平台
skm install <skill-name> --platform opencode,claude
# 强制覆盖安装
skm install <skill-name> --force

# 查看已安装（支持分页）
skm ls --installed
skm ls --installed --page 2

# 更新 skill
skm update <skill-name>
skm update --all           # 更新所有

# 同步 skill 到最新版本（安装到所有检测到的平台）
skm sync <skill-name>

# 同步平台软链接
skm sync

# 查看可用平台
skm platforms

# 卸载 skill
skm uninstall <skill-name>
```

---

## 常见问题

### Q: 包名必须以 @wanxuchen/ 开头吗？

默认 scope 是 `@itismyskillmarket`（回退 `@wanxuchen`），可以通过环境变量修改：

```bash
export SKM_NPM_SCOPE=@mycompany
```

之后 `skm update`、`skm publish`、`skm admin` 等命令都会使用新的 scope。

### Q: 如何发布到 @skillmarket/ 组织？

需要先加入 npm "skillmarket" 组织，然后修改包名为 `@skillmarket/<skill-name>`，或通过环境变量添加 scope：

```bash
export SKM_NPM_SCOPES=@skillmarket,@itismyskillmarket
```

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
| 1.3.12 | 2026-05-09 | `skm admin` 管理员命令组 |
| 1.3.11 | 2026-05-09 | 环境变量配置 + GUI Help 视图 |
| 1.3.10 | 2026-05-09 | GUI 修复：Cache-Control + npm retry |
| 1.3.9 | 2026-05-08 | GUI 滚动修复 |
| 1.3.8 | 2026-05-08 | npm 缓存 + 限流 |
| 1.3.7 | 2026-05-08 | GUI API 后端 + `skm verify` |
| 1.3.6 | 2026-05-07 | `skm sync <skill-name>` + 修复平台显示 |
| 1.3.4 | 2026-05-06 | OpenClaw/Hermes 适配器支持 |
| 1.3.3 | 2026-04-30 | GitHub 第三方库支持 |
| 1.3.2 | 2026-04-30 | 增强卸载命令 |
| 1.3.0 | 2026-04-23 | 独立搜索命令 |
| 1.2.6 | 2026-04-22 | 添加搜索功能 |
| 1.2.3 | 2026-04-15 | 跨平台 Skill 安装支持 |
| 1.0.0 | 2026-04-01 | 初始版本 |

---

## 许可证

MIT