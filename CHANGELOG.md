# SkillMarket v1.3.3 更新日志

**日期**: 2026-04-30
**版本**: 1.3.3

---

## 🎉 新功能：增强卸载命令

### 1. 卸载所有 Skills (`--all`)

现在可以一键卸载所有已安装的 skills：

```bash
# 卸载所有 skills（需要确认）
skm uninstall --all

# 强制卸载所有，跳过确认
skm uninstall --all --yes
```

**确认提示示例**：
```
Found 5 installed skill(s):
  - brainstorming@1.2.0
  - test-skill-1@1.1.0
  - test-skill-2@1.0.0
  - weather-time@1.0.0
  - chinese-almanac@1.0.0

⚠️  Are you sure you want to uninstall ALL 5 skill(s)? This action cannot be undone. (y/N): _
```

### 2. 预览模式 (`--dry-run`)

新增 `--dry-run` 标志，可以预览将要删除的内容，而不实际执行删除：

```bash
# 预览卸载单个 skill
skm uninstall brainstorming --dry-run

# 预览卸载所有 skills
skm uninstall --all --dry-run
```

**预览输出示例**：
```
📋 Uninstall Preview for "brainstorming":

   Version: 1.2.0
   Installed: 2026-04-15T10:30:00Z
   Platforms (from registry): OpenCode, Claude Code, VSCode

   Local files to remove:
   - ~/.skillmarket/skills/brainstorming

   Platform links to remove:
   - ~/.skillmarket/platform-links/opencode/skills/brainstorming
   - ~/.skillmarket/platform-links/claude/skills/brainstorming
   - ~/.skillmarket/platform-links/vscode/skills/brainstorming

⚠️  This was a dry-run. No files were actually deleted.
```

### 3. 跳过确认 (`-y, --yes`)

新增 `-y` 或 `--yes` 选项，跳过所有确认提示：

```bash
# 强制卸载，不提示确认
skm uninstall brainstorming --yes

# 强制卸载所有，不提示确认
skm uninstall --all --yes
```

### 4. 改进错误处理

- 当平台卸载失败时，会询问用户是否继续清理本地文件
- 避免误删本地文件导致无法恢复

**错误处理示例**：
```
Uninstalling from 3 platform(s)...

OpenCode     ✅  Uninstalled
Claude Code  ❌  Failed: EPERM: operation not permitted
VSCode       ✅  Uninstalled

⚠️  1 platform(s) failed to uninstall. Continue with local cleanup? (y/N): _
```

---

## 🚀 新功能：GitHub 第三方库支持 (Beta)

### 1. 支持 GitHub URL 和简写格式

现在可以直接从 GitHub 仓库安装 skills：

```bash
# GitHub URL 格式
skm install https://github.com/owner/repo
skm install https://github.com/owner/repo/tree/main/skills/my-skill

# 简写格式
skm install owner/repo
skm install owner/repo#branch
skm install owner/repo@commit-hash
```

### 2. 自动检测 Skill 本体

安装时会自动检测仓库中的 skill 文件：

- ✅ `SKILL.md` - skill 定义文件（必须）
- ✅ `package.json` - 包配置文件（可选）
- ✅ `metadata.json` - 元数据文件（可选）
- ✅ 平台目录（`opencode/`, `cursor/`, `vscode/`, `claude/` 等）

**检测输出示例**：
```
Detecting skill...
  SKILL.md: ✅
  package.json: ✅
  Detected platforms: opencode, vscode
```

### 3. 平台判断和格式转换

- 自动判断 skill 支持的平台
- 如果某些平台文件缺失，会自动生成适配文件
- 支持的平台：OpenCode, Cursor, VSCode, Claude Code, Codex, Antigravity

```bash
# 安装到指定平台（自动生成缺失的平台文件）
skm install owner/repo --platform opencode,claude

# 指定分支
skm install owner/repo#dev --platform vscode
```

### 4. 版本控制

支持指定分支、tag 或 commit：

```bash
# 指定分支
skm install owner/repo#main
skm install owner/repo -b develop

# 指定 commit
skm install owner/repo@abc1234

# 指定 tag（通过分支名）
skm install owner/repo#v1.0.0
```

### 5. 技术实现

**新增模块**：`src/commands/github-install.ts`

| 函数名 | 功能 |
|--------|------|
| `parseGitHubUrl()` | 解析 GitHub URL 和简写格式 |
| `detectSkillFromGitHub()` | 从 GitHub API 检测 skill |
| `installFromGitHub()` | 从 GitHub 安装 skill |
| `generatePlatformAdapters()` | 为缺失平台生成适配文件 |

**支持的 URL 格式**：
| 格式 | 示例 |
|------|------|
| 完整 URL | `https://github.com/owner/repo` |
| 完整 URL + 路径 | `https://github.com/owner/repo/tree/main/path` |
| 简写 | `owner/repo` |
| 简写 + 分支 | `owner/repo#branch` |
| 简写 + commit | `owner/repo@commit` |

---

## 🔧 技术实现

### 卸载命令新增函数

| 函数名 | 功能 |
|--------|------|
| `uninstallAll()` | 卸载所有已安装的 skills |
| `askConfirmation()` | 请求用户确认（内部工具函数） |
| `getUninstallPreview()` | 收集卸载预览信息（内部工具函数） |

### GitHub 安装新增函数

| 函数名 | 功能 |
|--------|------|
| `parseGitHubUrl()` | 解析 GitHub URL |
| `detectSkillFromGitHub()` | 检测 skill 本体 |
| `installFromGitHub()` | 主安装函数 |
| `generatePlatformAdapters()` | 格式转换 |

### 更新接口

**UninstallOptions** 新增字段：
```typescript
export interface UninstallOptions {
  platforms?: string[];  // 目标平台列表
  all?: boolean;          // 卸载所有 skills
  dryRun?: boolean;       // 预览模式
  yes?: boolean;          // 跳过确认
}
```

**GitHubInstallOptions** 新增接口：
```typescript
export interface GitHubInstallOptions {
  platforms?: string[];  // 目标平台
  force?: boolean;       // 强制覆盖
  branch?: string;       // 指定分支
  commit?: string;       // 指定 commit
}
```

### CLI 参数更新

| 命令 | 参数 | 说明 |
|------|------|------|
| `skm uninstall` | `-a, --all` | 卸载所有已安装的 skills |
| `skm uninstall` | `-d, --dry-run` | 预览模式，不实际删除 |
| `skm uninstall` | `-y, --yes` | 跳过确认提示 |
| `skm install` | `-b, --branch` | GitHub 分支 |
| `skm install` | `-c, --commit` | GitHub commit hash |

---

## 📦 完整版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.3.3 | 2026-04-30 | 增强卸载命令 + GitHub 第三方库支持 |
| 1.3.1 | 2026-04-29 | Bug 修复，workflow 改进 |
| 1.3.0 | 2026-04-23 | 独立搜索命令，改进分页逻辑 |
| 1.2.6 | 2026-04-22 | 添加搜索功能（--search） |
| 1.2.5 | 2026-04-16 | 文档更新 |
| 1.2.4 | 2026-04-16 | 修复版本号硬编码问题 |
| 1.2.3 | 2026-04-15 | 跨平台 Skill 安装支持 |

---

## 贡献者

- wxc2004 (wanxuchen)
- Sisyphus Agent

---

# SkillMarket v1.2.6 更新日志

**日期**: 2026-04-22
**版本**: 1.2.6

---

## 🔍 新功能：skm ls 搜索支持

### 功能说明

新增搜索功能，可以通过关键字搜索 skills。

### 新增选项

```bash
# 搜索 npm 上的 skills
skm ls --search brain
skm ls -s brain

# 搜索已安装的 skills
skm ls --installed --search test

# 组合分页和搜索
skm ls --search brain --page 1 --limit 10
```

### 搜索字段

- skill ID
- displayName（显示名称）
- description（描述）

---

## 🎉 新功能：skm ls 分页支持

### 功能说明

当 skill 数量较多时，现在支持分页浏览。

### 新增选项

```bash
# 默认每页 20 个
skm ls

# 指定页码
skm ls --page 2

# 指定每页数量
skm ls --limit 10

# 组合使用
skm ls --page 2 --limit 10

# 已安装的 skills 也支持分页
skm ls --installed --page 2
```

### 输出示例

```
Found 85 skill(s):

📦 @skillmarket/brainstorming@1.2.0
   名称: Brainstorming
   描述: Feature brainstorming skill
   平台: opencode, cursor, vscode, claude
   链接: https://www.npmjs.com/package/@skillmarket/brainstorming

Page 1/5 (20 per page) | Use --page N to navigate
```

### 实现细节

- npm search API 使用 `from` 和 `size` 参数实现服务端分页
- 本地已安装 skills 使用数组 slice 实现客户端分页
- 默认每页 20 个，可自定义

---

## 🔧 改进

1. **文档更新**
   - 更新 README.md 添加分页使用示例
   - 更新 SKILLMARKET-GUIDE.md 修复安装命令
   - 更新 skills/README.md 添加 test-skill-1/2

2. **版本管理优化**
   - 版本号现在从 `package.json` 动态读取
   - 不再需要手动同步版本号

---

## 📦 完整版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.2.6 | 2026-04-16 | 修复版本号动态读取 |
| 1.2.5 | 2026-04-16 | 文档更新 |
| 1.2.4 | 2026-04-16 | 修复版本号硬编码问题 |
| 1.2.3 | 2026-04-15 | 跨平台 Skill 安装支持 |

---

## 贡献者

- wxc2004 (wanxuchen)

---

# SkillMarket v1.2.3 发布总结

**日期**: 2026-04-15
**版本**: 1.2.3

---

## 🎉 新功能：跨平台 Skill 安装

### 支持的平台

| 平台 | Skill 目录 | 状态 |
|------|-----------|------|
| OpenCode | `~/.config/opencode/skills/` | ✅ |
| Claude Code | `~/.claude/skills/` | ✅ |
| VSCode | `~/.copilot/skills/` | ✅ |

### 新增命令

```bash
# 查看可用平台
skm platforms

# 安装到所有检测到的平台
skm install <skill>

# 安装到指定平台
skm install <skill> --platform opencode
skm install <skill> --platform opencode,claude,vscode

# 卸载
skm uninstall <skill>
skm uninstall <skill> --platform claude
```

### 安装输出示例

```
skm install test-skill-1

Installing test-skill-1...
Downloading package...
Setting up skill...

Installing to 3 platform(s)...

OpenCode     ✅  Installed successfully
Claude Code  ✅  Installed successfully
VSCode       ✅  Installed successfully

📊 Summary: 3 installed, 0 skipped, 0 failed

✅ test-skill-1@1.1.0 installed successfully!
```

### 平台状态查看

```
skm platforms

📍 Available Platforms:

OpenCode     ✅  Available (3 skills installed)
Claude Code  ✅  Available (2 skills installed)
VSCode       ✅  Available (3 skills installed)
```

---

## 🐛 Bug 修复

1. **npm scope 兼容问题**
   - 修复了 `@wanxuchen/`、`@itismyskillmarket/` 等多个 scope 的自动检测
   - 现在安装 `test-skill-1` 会自动查找正确的 npm 包

2. **tarball 文件名匹配**
   - 修复了 scoped 包文件名匹配逻辑
   - 之前 `@scope/package` 被错误匹配为 `@scope-package`

---

## 📦 Skill 包列表

| Skill | npm 包名 | 用途 |
|-------|---------|------|
| test-skill | @wanxuchen/test-skill | 通用测试 |
| test-skill-1 | @wanxuchen/test-skill-1 | 测试安装和 info 功能 |
| test-skill-2 | @wanxuchen/test-skill-2 | 测试卸载和更新功能 |

---

## 🔧 技术实现

### 架构

```
src/adapters/
├── base.ts       # 平台适配器基类
├── opencode.ts   # OpenCode 适配器
├── claude.ts     # Claude Code 适配器
├── vscode.ts     # VSCode 适配器
├── registry.ts   # 平台注册和检测
└── index.ts      # 导出
```

### 平台适配器接口

```typescript
interface PlatformAdapter {
  readonly id: string;
  readonly name: string;
  readonly skillDir: string;
  
  isAvailable(): Promise<boolean>;
  isInstalled(skillId: string): Promise<boolean>;
  install(skillId: string, sourceDir: string): Promise<void>;
  uninstall(skillId: string): Promise<void>;
  listInstalled(): Promise<string[]>;
}
```

---

## 📚 文档更新

- `README.md` - 更新使用说明
- `docs/plans/2026-04-15-cross-platform-adapter-design.md` - 设计文档
- `docs/plans/2026-04-15-cross-platform-adapter-plan.md` - 实现计划

---

## 🚀 下一步

- [ ] 发布到 VSCode Marketplace
- [ ] 发布 Claude Code 插件市场
- [ ] 创建 skill 市场网站
- [ ] 添加 skill 搜索功能

---

## 贡献者

- wxc2004 (wanxuchen)
