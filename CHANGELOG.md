# SkillMarket v1.3.22 更新日志

**日期**: 2026-05-15
**版本**: 1.3.22

---

## ✨ 新功能：Skill 页分类排序功能

### 变更

1. **排序功能**: Skills 页新增排序下拉框，支持按名称 A-Z、名称 Z-A、最近更新、最早更新排序
2. **分类过滤**: Skills 页新增平台分类过滤下拉框，可按平台（opencode、cursor 等）筛选技能列表
3. 后端 `GET /api/skills` 新增 `sort` 和 `platform` 查询参数
4. 每个 skill 响应新增 `updated` 字段

### 变更文件

| 文件 | 变更 |
|------|------|
| `src/commands/ui.ts` | `/api/skills` 添加 sort/platform 参数支持 + updated 字段 |
| `gui/index.html` | 添加排序和平台过滤下拉框 |
| `gui/app.js` | 排序/过滤状态、事件处理、平台列表动态更新 |

---

# SkillMarket v1.3.21 更新日志

**日期**: 2026-05-15
**版本**: 1.3.21

---

## 🐛 修复：GUI 滚动 + 版本号动态获取 + Platform 点击查看详情

### 变更

1. **滚动修复**: 添加 `#app` flex 容器 CSS，恢复高度约束链，页面内容溢出时正确滚动
2. **版本号动态获取**: 去除 HTML 中硬编码的 `v1.3.16`，改为 `GET /api/version` 从 package.json 实时获取
3. **Platform 点击查看详情**: Platform 卡片可点击，展示该平台已安装的 skills 列表，并可进一步查看 skill 详情
4. 新增 `GET /api/platform-info?id=xxx` API 端点
5. 新增 `GET /api/version` API 端点

### 变更文件

| 文件 | 变更 |
|------|------|
| `gui/style.css` | 添加 `#app` flex 容器样式 |
| `gui/index.html` | 版本号改为占位符；新增 platform-detail 视图 |
| `gui/app.js` | 新增 `loadVersion()`、Platform 详情视图逻辑 |
| `src/commands/ui.ts` | 新增 `/api/version` 和 `/api/platform-info` API 端点 |

---

# SkillMarket v1.3.20 更新日志

**日期**: 2026-05-14
**版本**: 1.3.20

---

## 🐛 修复：GUI 内容区填满页面 + 滚动

### 变更

- `.main-content` 改为 `display: flex; flex-direction: column`，不再用 `height: 0`
- `.view.active` 改为 `display: flex; flex-col; flex: 1; overflow-y: auto`
- 效果：内容区填满整个页面，溢出时正确滚动

### 变更文件

| 文件 | 变更 |
|------|------|
| `gui/style.css` | `.main-content` flex 容器化；`.view.active` 填满父容器并负责滚动 |

---

## 📦 完整版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.3.20 | 2026-05-14 | GUI 内容区填满页面 + 滚动修复 |
| 1.3.19 | 2026-05-14 | 修复 GUI 滚动功能 |

---

# SkillMarket v1.3.19 更新日志

**日期**: 2026-05-14
**版本**: 1.3.19

---

## 🐛 修复：GUI 滚动功能

### 变更

- 修复 GUI 界面内容区无法滚动的问题
- `.main-content` 添加 `height: 0` 强制 flex 子项按可用空间计算高度
- `.view.active` 添加 `overflow-y: auto` 双保险
- 根因：flex 布局缺少硬性高度限制，浏览器未触发滚动容器

### 变更文件

| 文件 | 变更 |
|------|------|
| `gui/style.css` | `html,body` 高度传递链修复；`.main-content` 加 `height: 0`；`.view.active` 加 `overflow-y: auto` |

---

## 📦 完整版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.3.19 | 2026-05-14 | 修复 GUI 滚动功能 |
| 1.3.18 | 2026-05-14 | GUI 中英文双语切换 |

---

# SkillMarket v1.3.18 更新日志

**日期**: 2026-05-14
**版本**: 1.3.18

---

## 🌐 新功能：GUI 中英文双语切换

### 变更

- GUI 界面新增 **中英文双语切换** 功能，用户可自由切换界面语言
- 导航栏、Skill 卡片、详情视图、Admin 面板等所有 UI 文本均已适配 i18n
- 语言选择状态持久化保存

### 变更文件

| 文件 | 变更 |
|------|------|
| `gui/index.html` | 新增语言切换按钮；所有硬编码文本替换为 `data-i18n` 属性 |
| `gui/app.js` | 新增 `switchLanguage()`、`applyLanguage()`、`t()` i18n 函数；语言状态存储 |
| `gui/style.css` | 新增语言切换按钮样式 |
| `docs/plans/2026-05-12-gui-i18n-design.md` | 新增双语切换设计文档 |

---

## 📦 完整版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.3.18 | 2026-05-14 | GUI 中英文双语切换 |
| 1.3.17 | 2026-05-12 | i18n 准备 |
| 1.3.16 | 2026-05-11 | 顶部导航栏 + Skill 详情视图 |

---

# SkillMarket v1.3.16 更新日志

**日期**: 2026-05-11
**版本**: 1.3.16

---

## 🔧 优化：顶部水平导航栏 + Skill 详情视图

### 变更
- 侧边栏改为**顶部水平导航栏**，节省垂直空间
- Skill 卡片点击可进入**详情视图**，显示完整信息（描述、详情、平台、版本列表）
- 详情视图包含 Install 按钮和 ← Back 返回按钮
- 移除旧模态框，Skill 详情改用独立视图
- 已安装 Skill 卡片新增 Info 按钮

### 变更文件
| 文件 | 变更 |
|------|------|
| `gui/index.html` | 侧边栏 → 顶部导航栏；新增 `#view-skill-detail` 详情视图 |
| `gui/style.css` | 重写布局样式：`.topbar`、`.topbar-nav`、`.skill-detail`、`.modal` |
| `gui/app.js` | 新增 `showSkillDetail()`、`goBack()`；卡片点击跳转详情；`event.stopPropagation()` 防误触 |

---

# SkillMarket v1.3.15 更新日志

**日期**: 2026-05-11
**版本**: 1.3.15

---

## 🔧 优化：可折叠侧边栏 + 紧凑布局

### 变更
- 侧边栏分组（Browse/Manage/Support）支持点击折叠/展开
- 折叠时箭头旋转为 ▶，项目隐藏；展开时 ▼，项目可见
- 内容区 padding 缩减、标题字号调小，整体布局更紧凑
- `gui/index.html` — 导航结构调整为 `.nav-group` + `.nav-items` 包裹
- `gui/style.css` — 新增 `.nav-group`、`.nav-arrow`、`.collapsed` 样式
- `gui/app.js` — 新增 `toggleSection()` 折叠控制函数

---

# SkillMarket v1.3.14 更新日志

**日期**: 2026-05-11
**版本**: 1.3.14

---

## 🔧 优化：GUI 侧边栏导航分组

### 变更
- GUI 侧边栏按功能分组：**Browse**（Skills/Installed/Platforms）、**Manage**（Admin）、**Support**（Help）
- 每组添加大写灰色分组标签，提升导航效率
- `gui/index.html` — 导航结构调整
- `gui/style.css` — 新增 `.nav-section` 样式

---

# SkillMarket v1.3.13 更新日志

**日期**: 2026-05-11
**版本**: 1.3.13

---

## 🎉 新功能：skm-admin 云端 Skill 管理系统

### 1. CLI 管理命令

在已有只读查询命令基础上，新增 **7 个写操作管理命令**，通过 npm CLI 直接操作云端 skill：

| 命令 | 说明 |
|------|------|
| `skm admin deprecate <skill>` | 弃用 skill（--version 指定版本，--message 自定义消息） |
| `skm admin unpublish <skill>` | 取消发布（--version 指定版本，--force 强制全部） |
| `skm admin tag set <skill> <tag> <ver>` | 设置 dist-tag |
| `skm admin tag rm <skill> <tag>` | 移除 dist-tag |
| `skm admin tag ls <skill>` | 列出所有 dist-tags |
| `skm admin owner add <skill> <user>` | 添加包维护者 |
| `skm admin owner rm <skill> <user>` | 移除包维护者 |
| `skm admin access <skill> <level>` | 设置访问权限（public\|restricted） |

### 2. GUI Admin Dashboard

新增 **Admin 视图**，提供可视化的云端管理界面：

- **统计卡片**: 发布技能数、总版本数、平均版本数、元数据覆盖、总大小、平台覆盖数
- **技能管理列表**: 所有已发布技能行，每行有 Deprecate / Unpublish / Tags / Owners / Access 操作按钮
- **操作模态框**: 每个管理操作都有对应的确认对话框

### 3. GUI API 端点

| 端点 | 功能 |
|------|------|
| `GET /api/admin/stats` | 发布统计 |
| `POST /api/admin/deprecate` | 弃用 skill |
| `POST /api/admin/unpublish` | 取消发布 |
| `POST /api/admin/tag` | dist-tag 管理（set/rm/ls） |
| `POST /api/admin/owner` | 维护者管理（add/rm） |
| `POST /api/admin/access` | 访问权限设置 |

### 变更文件

| 文件 | 变更 |
|------|------|
| `src/commands/admin.ts` | 新增 8 个管理函数 + 3 个辅助函数 |
| `src/cli.ts` | 注册 admin tag/owner 子命令组 + 3 个新命令 |
| `src/commands/ui.ts` | 新增 6 个 Admin API 端点 |
| `gui/index.html` | 新增 Admin 导航按钮和视图 |
| `gui/app.js` | 新增 Admin Dashboard 逻辑 + 5 个操作模态框 |
| `gui/style.css` | 新增 Admin 统计卡片、管理列表、模态框样式 |

---

# SkillMarket v1.3.12 更新日志

**日期**: 2026-05-09
**版本**: 1.3.12

---

## ✨ 新功能：skm admin 管理员命令组

新增 `skm admin` 子命令组，用于管理云端已发布的 skill：

| 命令 | 说明 |
|------|------|
| `skm admin ls` | 列出所有已发布的 skills |
| `skm admin info <skill>` | 查看 skill 完整信息（版本历史、dist-tags、元数据） |
| `skm admin search <keyword>` | 搜索已发布的 skills |
| `skm admin stats` | 发布统计 |
| `skm admin verify <skill>` | 验证已发布 skill 的结构和元数据 |

### 新增文件
- `src/commands/admin.ts` — 管理员命令模块（5 个子命令）

### 变更
- `src/cli.ts` — 注册 `skm admin` 子命令组

---

# SkillMarket v1.3.11 更新日志

**日期**: 2026-05-09
**版本**: 1.3.11

---

## ✨ 新功能：环境变量配置 + GUI Help 视图

### 新增
- `src/config.ts` — 统一配置模块，个人相关链接从环境变量读取
- GUI 新增 **Help** 视图：Action 使用说明、环境变量文档、当前配置
- API 新增 `GET /api/config` 端点

### 支持的环境变量
| 变量 | 默认值 | 说明 |
|------|--------|------|
| `SKM_NPM_SCOPE` | `@itismyskillmarket` | 主要 npm scope |
| `SKM_NPM_SCOPE_FALLBACK` | `@wanxuchen` | 回退 scope |
| `SKM_NPM_SCOPES` | (5 个 scope) | 搜索 scope 列表 |
| `SKM_NPM_REGISTRY` | `https://registry.npmjs.org` | npm registry |
| `SKM_URL` | `https://www.npmjs.com/package/@itismyskillmarket` | 个人链接前缀 |

### 变更
- `npm.ts` — `SKILL_SCOPES` 改为从 config 导入
- `publish.ts` — 硬编码 URL 改为 `${SKM_URL}/${skillName}`
- `update.ts` — 硬编码 scope 改为 `${NPM_SCOPE}/${NPM_SCOPE_FALLBACK}`

---

# SkillMarket v1.3.10 更新日志

**日期**: 2026-05-09
**版本**: 1.3.10

---

## 🐛 修复：GUI 可用技能只显示 1 个 card

### 问题
进入 GUI 后 Available Skills 只显示 "test-skill-1" 一个 card，其余 skill 不显示。

### 诊断
- npm search API 正常返回 3 个包
- 所有包均可独立 fetch
- 前端 `.map().join('')` 渲染逻辑正确

### 根因
1. **npm fetch 静默丢弃**: `fetchNpmPackage` 失败时 `catch { return null }`，失败的 skill 被 `filter(Boolean)` 静默丢弃，前端不知情
2. **无 Cache-Control**: 浏览器缓存旧版 `app.js`，更新后用户仍在跑旧代码

### 修复
- `fetchNpmPackage` 添加 1 次自动重试（500ms 间隔），增加 HTTP 状态码检查（429/5xx）
- API 返回新增 `fetchErrors` 字段，前端显示黄色警告条
- 静态文件添加 `Cache-Control: no-cache, no-store, must-revalidate`

---

# SkillMarket v1.3.8 更新日志

**日期**: 2026-05-08
**版本**: 1.3.8

---

## 🐛 修复：GUI 刷新失败 + 版本显示

### 问题
- GUI 版本仍显示 1.3.6（硬编码未更新）
- 刷新 skills 列表时提示"取回失败"（npm registry 限流）

### 修复
- GUI 版本更新为 1.3.8
- 添加 npm 搜索结果内存缓存（30s TTL）
- 添加包详情内存缓存（30s TTL）
- 并发限流：每次 3 个请求，批次间隔 200ms
- 刷新测试：首次 ~1.9s → 缓存命中 0.05s

---

# SkillMarket v1.3.7 更新日志

**日期**: 2026-05-08
**版本**: 1.3.7

---

## 🎉 新功能：GUI 图形界面 + API 完善

### 功能说明

新增 `skm gui` 命令启动本地 Web 图形界面，提供可视化的 skill 管理体验。

### 使用方法

```bash
# 启动 GUI（默认端口 18770）
skm gui

# 指定端口
skm gui 18771
```

### API 端点

GUI 后端提供完整的 REST API：

| 端点 | 功能 |
|------|------|
| `GET /api/skills` | 列出 npm skills（支持分页和搜索） |
| `GET /api/installed` | 列出已安装 skills |
| `GET /api/platforms` | 列出可用平台及状态 |
| `GET /api/skill-info` | 获取 skill 详情 |
| `POST /api/install` | 安装 skill |
| `POST /api/uninstall` | 卸载 skill |
| `POST /api/update` | 更新 skill(s) |

### 界面功能

- **Skills 视图**: 浏览 npm 上的可用 skills，支持搜索和分页
- **Installed 视图**: 查看已安装 skills，支持一键更新
- **Platforms 视图**: 查看各平台检测状态和已安装数量

---

## 🎉 新功能：skm verify <skill-name> 验证 Skill 完整性

### 功能说明

新增 `skm verify <skill-name>` 命令，验证已安装 skill 的完整性。

### 验证项目

- SKILL.md 是否存在且非空
- package.json 是否存在且包含必要字段（name, version, description）
- registry.json 中是否注册

### 使用方法

```bash
# 验证已安装的 skill
skm verify brainstorming
```

---

## 🔧 技术改进

- GUI 服务器从 `cli.ts` 内联代码重构为独立模块 `src/commands/ui.ts`
- 使用原生 `http` 模块（零额外依赖）
- 完整的 REST API 对接真实 SkillMarket 命令
- 路径计算适配 tsup 打包输出结构

---

# SkillMarket v1.3.6 更新日志

**日期**: 2026-05-07
**版本**: 1.3.6

---

## 🎉 新功能：skm sync <skill-name> 同步 Skill 到最新版本

### 功能说明

新增 `skm sync <skill-name>` 命令，一键将指定 skill 同步到 npm 最新版本，并强制安装到所有已检测平台。

### 使用方法

```bash
# 同步 brainstorming 到最新版本（安装到所有平台）
skm sync brainstorming
```

### 执行流程

1. 从 npm 获取最新版本信息
2. 强制安装到所有已检测平台（`--force` 模式）
3. 更新注册表记录

### 输出示例

```
Syncing brainstorming to latest version...
Latest version: 1.2.0
Installing to 3 platform(s)...

OpenCode     ✅  Installed successfully
Claude Code  ✅  Installed successfully
VSCode       ✅  Installed successfully

📊 Summary: 3 installed, 0 skipped, 0 failed

✅ brainstorming synced to v1.2.0
```

---

## 🐛 Bug 修复：skm platforms 显示所有平台

### 问题

`skm platforms` 命令只显示 OpenCode、Claude Code、VSCode，不显示 OpenClaw 和 Hermes Agent。

### 原因

`src/cli.ts` 中 `platforms` 命令使用硬编码平台列表，未使用已注册的适配器系统。

### 修复

改用 `getAllAdapters()` 动态获取所有已注册平台，新增平台无需修改 cli.ts。

### 修复后输出

```
📍 Available Platforms:

OpenCode        ✅  Available (1 skills installed)
Claude Code     ✅  Available (0 skills installed)
VSCode          ✅  Available (0 skills installed)
OpenClaw        ✅  Available (0 skills installed)
Hermes Agent    ✅  Available (0 skills installed)
```

---

## 📦 完整版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.3.6 | 2026-05-07 | skm sync <skill-name> + platforms bug fix |
| 1.3.5 | 2026-05-07 | Fix platforms display |
| 1.3.4 | 2026-05-06 | OpenClaw/Hermes adapter support |
| 1.3.3 | 2026-04-30 | GitHub 第三方库支持 |

---

## 贡献者

- wxc2004 (wanxuchen)
- Sisyphus Agent

---

# SkillMarket v1.3.3 更新日志

**日期**: 2026-04-30
**版本**: 1.3.3

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

### GitHub 安装新增函数

| 函数名 | 功能 |
|--------|------|
| `parseGitHubUrl()` | 解析 GitHub URL |
| `detectSkillFromGitHub()` | 检测 skill 本体 |
| `installFromGitHub()` | 主安装函数 |
| `generatePlatformAdapters()` | 格式转换 |

### 更新接口

**GitHubInstallOptions** 接口：
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
| `skm install` | `-b, --branch` | GitHub 分支 |
| `skm install` | `-c, --commit` | GitHub commit hash |

---

## 📦 完整版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.3.3 | 2026-04-30 | GitHub 第三方库支持 |
| 1.3.2 | 2026-04-30 | 增强卸载命令：--all, --dry-run, --yes |
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

# SkillMarket v1.3.2 更新日志

**日期**: 2026-04-30
**版本**: 1.3.2

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

## 🔧 技术实现

### 新增函数

| 函数名 | 功能 |
|--------|------|
| `uninstallAll()` | 卸载所有已安装的 skills |
| `askConfirmation()` | 请求用户确认（内部工具函数） |
| `getUninstallPreview()` | 收集卸载预览信息（内部工具函数） |

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

### CLI 参数更新

| 参数 | 说明 |
|------|------|
| `-a, --all` | 卸载所有已安装的 skills |
| `-d, --dry-run` | 预览模式，不实际删除 |
| `-y, --yes` | 跳过确认提示 |

---

## 📦 完整版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.3.2 | 2026-04-30 | 增强卸载命令：--all, --dry-run, --yes |
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
