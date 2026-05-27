# SkillMarket v1.3.30 更新日志

**日期**: 2026-05-27
**版本**: 1.3.30

---

## ✅ 测试覆盖：143 个测试用例 + 3 个 Bug 修复

新增 **11 个测试文件**，共 **143 个测试用例**覆盖核心模块，并在测试过程中发现并修复了 3 个 GitHub URL 解析 Bug。

### 新增测试文件

| 测试文件 | 用例数 | 覆盖范围 |
|---------|--------|---------|
| `src/commands/github-install.test.ts` | 23 | `parseGitHubUrl()` 所有 URL 格式（HTTPS/简写/分支/commit/子路径） |
| `src/config.test.ts` | 12 | 配置加载优先级（环境变量 > 配置文件 > 默认值）、缺省值 |
| `src/utils/platform.test.ts` | 23 | 所有平台检测函数、优先级顺序（OPENCODE > CURSOR > VSCODE > CLAUDE_CODE > ANTIGRAVITY > codex) |
| `src/utils/dirs.test.ts` | 5 | 目录路径工具函数 |
| `src/adapters/base.test.ts` | 15 | BaseAdapter 安装/卸载/列表/检查，使用 TestAdapter + 临时目录 |
| `src/adapters/opencode.test.ts` | 7 | OpenCodeAdapter 身份/可用性/安装/卸载 |
| `src/adapters/claude.test.ts` | 8 | ClaudeAdapter 身份/可用性（env var + 目录）/安装/卸载 |
| `src/adapters/vscode.test.ts` | 9 | VSCodeAdapter 身份/可用性/安装（含跨兼容 symlink）/卸载 |
| `src/adapters/openclaw.test.ts` | 6 | OpenClawAdapter 身份/可用性/安装检查 |
| `src/adapters/hermes.test.ts` | 6 | HermesAdapter 身份/可用性/安装检查 |
| `src/adapters/registry.test.ts` | 26 | `getAllAdapters`、`getPlatformAdapter`、`getAdapterByPlatform`（8 个平台映射）、`detectPlatforms`（使用 vi.mock 控制可用性） |

### 🐛 Bug 修复

在编写 `github-install.test.ts` 时通过 TDD 发现并修复了 3 个 `parseGitHubUrl()` 正则 Bug：

1. **Pattern 2（简写 + 分支）**: `([^/]+)` 会贪婪吞掉 `#branch` 到仓库名中 → 修复为 `[^/#]+`
2. **Pattern 3（简写 + commit）**: `([^/]+)` 会贪婪吞掉 `@commit` 到仓库名中 → 修复为 `[^/@]+`
3. **`path` 变量取错索引**: `match[5]`（不存在）→ `match[4]`，导致子路径解析永远为 `undefined`
4. **Pattern 顺序**: `@commit` 模式移到 `#branch` 之前，确保最具体模式优先匹配

### 技术实现

- 使用 `vi.mock()` + `vi.hoisted()` 控制 adapter 可用性，避免测试对真实文件系统的副作用
- 使用 `vi.spyOn(os, 'homedir')` + 临时目录隔离 Claude/VSCode adapter 文件操作
- 使用 `process.env.OPENCODE_CONFIG_DIR` 隔离 OpenCode adapter
- 平台测试防御性清理 `process.env.OPENCODE` 避免 shell 环境变量泄漏

### 变更文件

| 文件 | 变更 |
|------|------|
| `src/commands/github-install.ts` | 修复 3 个 regex Bug + 调整 Pattern 匹配顺序 |
| `src/commands/github-install.test.ts` | **新建**: 23 个测试用例 |
| `src/config.test.ts` | **新建**: 12 个测试用例 |
| `src/utils/platform.test.ts` | **新建**: 23 个测试用例 |
| `src/utils/dirs.test.ts` | **新建**: 5 个测试用例 |
| `src/adapters/base.test.ts` | **新建**: 15 个测试用例 |
| `src/adapters/opencode.test.ts` | **新建**: 7 个测试用例 |
| `src/adapters/claude.test.ts` | **新建**: 8 个测试用例 |
| `src/adapters/vscode.test.ts` | **新建**: 9 个测试用例 |
| `src/adapters/registry.test.ts` | 4 → 26 个测试用例（重写） |

---

# SkillMarket v1.3.29 更新日志

**日期**: 2026-05-26
**版本**: 1.3.29

---

## 🚀 新功能：双击 exe 自动启动 GUI

双击 `skillmarket.exe` 现在会自动启动 Web GUI 界面并打开浏览器，无需在终端输入命令。

### 变更

1. **双击启动 GUI**: 检测到无命令行参数时（双击场景），自动调用 `startGuiServer()` 启动 Web 服务
2. **自动打开浏览器**: 服务器启动 1.5 秒后自动调用 `start http://localhost:18770` 打开默认浏览器
3. **构建脚本修复**: `serveStaticFile` 嵌入式函数改用 `require('fs')` 直接引用，不再依赖 esbuild 变量重命名，避免 `existsSync is not defined` 运行时错误

### 使用方式

```bash
# 双击 exe → 自动启动 GUI + 打开浏览器
# 或命令行：
.\skillmarket.exe          # 启动 GUI
.\skillmarket.exe gui      # 同上
.\skillmarket.exe ls       # CLI 模式不变
```

### 变更文件

| 文件 | 变更 |
|------|------|
| `src/cli.ts` | 无参数时自动启动 GUI + 打开浏览器 |
| `scripts/build-exe.mjs` | 修复嵌入函数中 esbuild 变量名硬编码问题 |

---

# SkillMarket v1.3.28 更新日志

**日期**: 2026-05-25
**版本**: 1.3.28

---

## 🚀 新功能：独立可执行文件 (.exe)

SkillMarket 现在可以下载 **独立 Windows .exe** 运行，无需安装 Node.js 环境。

### 变更

1. **Node.js SEA 打包**: 使用 Node.js Single Executable Applications (SEA) 技术将 CLI + GUI 打包为单个 `.exe` 文件
2. **嵌入式 GUI**: GUI 静态文件（`index.html`、`app.js`、`style.css`）嵌入到可执行文件内部，无需外部依赖
3. **GUI 资源自包含**: `serveStaticFile()` 优先从内存中提供嵌入式文件，磁盘上不存在 `gui/` 目录时也能正常显示 GUI

### 下载

- **下载地址**: [GitHub Releases](https://github.com/wxc2004/market/releases/download/v1.3.28/skillmarket.exe) (~73 MB)
- **平台**: Windows x64（其他平台可使用 `npx itismyskillmarket`）
- **要求**: Windows 10+，无需 Node.js

### 使用方式

```bash
# 查看帮助
.\skillmarket.exe --help

# 启动 GUI（默认端口 18771）
.\skillmarket.exe gui

# 所有 CLI 命令与 npm 版本一致
.\skillmarket.exe ls
.\skillmarket.exe install brainstorming
```

### 自动化构建

- 新增 GitHub Actions 工作流 `.github/workflows/release-exe.yml`
- 在 GitHub 发布 Release 时自动构建 Windows `.exe` 并上传为附件
- 也支持 `workflow_dispatch` 手动触发

### 技术实现

| 技术 | 说明 |
|------|------|
| Node.js SEA | 将 Node.js 运行时 + 应用代码注入单个二进制文件 |
| esbuild | TypeScript → CJS 打包（SEA 仅支持 CJS 加载） |
| postject | 将 SEA blob 注入 Node.js 可执行文件 |
| 内存文件映射 | GUI 文件嵌入代码，运行时通过 `__GUI_EMBEDDED__` 对象提供 |

### 变更文件

| 文件 | 变更 |
|------|------|
| `scripts/build-exe.mjs` | **新建**: SEA 构建脚本（esbuild → patch → embed → blob → inject） |
| `.github/workflows/release-exe.yml` | **新建**: 自动构建 + 上传 .exe 到 Release |
| `package.json` | 新增 `build:exe` 脚本、`postject` 依赖 |
| `.gitignore` | 新增 `sea-config.json` |
| `CHANGELOG.md` | v1.3.28 更新日志 |
| `README.md` | 新增 .exe 下载说明和版本更新 |

---

# SkillMarket v1.3.27 更新日志

**日期**: 2026-05-21
**版本**: 1.3.27

---

## ✨ 新功能：GUI Upload — 上传 Skill zip 包并发布/安装

### 变更

1. **GUI 新增 Upload 视图**: 顶部导航栏新增 **Upload 📤** 按钮，支持三阶段流程：
   - **Phase 1 上传**: 拖拽或选择 `.zip` 文件，可选覆盖 skill 名称
   - **Phase 2 预览**: 解析后展示 skill 信息（名称、版本、描述、平台、校验状态）
   - **Phase 3 操作**: 选择 **Publish to npm** / **Install Locally** / **Both** / **Discard**

2. **后端新增 API 端点**:
   - `POST /api/upload` — 接收 base64 编码的 zip，解压到 `skills/<name>/`，返回解析信息
   - `POST /api/upload/action` — 对已上传 skill 执行 publish/install/both

3. **新增依赖**: `adm-zip` 用于服务端 zip 解压

### 操作流程

```bash
skm gui → Upload 标签 → 拖放 skill.zip
→ Upload & Parse → 预览信息
→ Publish / Install / Both
```

### 变更文件

| 文件 | 变更 |
|------|------|
| `gui/index.html` | 新增 Upload 视图 HTML + 导航按钮 |
| `gui/style.css` | 上传区域、拖拽高亮、预览卡片、进度条样式 |
| `gui/app.js` | i18n 翻译、上传逻辑、拖拽/文件选择/预览/操作 |
| `src/commands/ui.ts` | 新增 `POST /api/upload` 和 `POST /api/upload/action` |
| `package.json` | 新增 `adm-zip` 依赖 |

---

# SkillMarket v1.3.26 更新日志

**日期**: 2026-05-20
**版本**: 1.3.26

---

## 🐛 修复：Bug 修复 + 代码质量改进

### 变更

1. **verify 命令 registry 访问路径修复**: `registry[skillName]` → `registry.skills?.[skillName]`，verify 命令现在能正确从注册表找到已安装技能
2. **update 命令多 scope 查找修复**: `fetchNpmPackage` 替换为 `fetchSkillPackage`，更新时自动遍历所有配置的 npm scope，不再只查单个 scope
3. **github-install 死代码清理**: 移除步骤重复的平台安装注释和 TODO 占位符，修正步骤编号

### 🔧 重构

4. **hermes/openclaw adapter 统一**: 两者改为 `extends BaseAdapter`，消除同步 fs API，统一为异步 `fs-extra`，代码体积分别缩减 30%/26%

### ⚡ 性能

5. **npm 查询加入内存缓存**: `fetchNpmPackage` 加入 30 秒 TTL 内存缓存，减少对 npm registry 的重复 HTTP 请求

### 变更文件

| 文件 | 变更 |
|------|------|
| `src/commands/verify.ts` | 修复 `registry.skills` 访问路径 |
| `src/commands/update.ts` | 改用 `fetchSkillPackage` 遍历所有 scope |
| `src/commands/github-install.ts` | 移除死代码段，修正步骤编号 |
| `src/adapters/hermes.ts` | 重构：`extends BaseAdapter` + 异步 fs-extra，67 行→54 行 |
| `src/adapters/openclaw.ts` | 重构：`extends BaseAdapter` + 异步 fs-extra，69 行→51 行 |
| `src/commands/npm.ts` | 新增内存缓存层（30 秒 TTL） |

---

# SkillMarket v1.3.25 更新日志

**日期**: 2026-05-19
**版本**: 1.3.25

---

## 🐛 修复：GUI i18n 硬编码 + Help/CLI 帮助文本补全

### 变更

1. **i18n 国际化修复**: 补全中英文翻译键（sort/filter/pagination/platform 相关共 13 个键），6 处硬编码文本改为 `t()` 调用，现在切换中文时所有界面文字正确显示中文
2. **排序下拉走 i18n**: 排序选项从静态 HTML 改为动态渲染，跟随语言切换
3. **platform-filter 语言同步**: 切换语言时"All Platforms"/"所有平台"即时更新
4. **GUI Help 视图补全**: 常用命令表新增 `search`、`info`、`publish`、`verify`、`sync`、`admin` 等 14 条缺失命令
5. **CLI `--help` 补全**: 新增 `search`/`publish`/`verify`/`gui`/`sync [skill]`/`admin` 子命令组，扩充示例

### 变更文件

| 文件 | 变更 |
|------|------|
| `gui/app.js` | 新增 i18n 键、修复 6 处硬编码、排序下拉动态渲染、platform-filter 语言同步、Help 命令表补全 |
| `gui/index.html` | 排序/筛选下拉移除硬编码 option，由 JS 动态渲染 |
| `src/cli.ts` | 补全 `--help` 命令列表和示例 |

---

# SkillMarket v1.3.24 更新日志

**日期**: 2026-05-18
**版本**: 1.3.24

---

## ✨ 新功能：skm config 配置管理命令

### 变更

1. **新增 `skm config` 命令组**: 支持查看/设置/重置持久化配置（存储在 `~/.skillmarket/config.json`）
2. **配置文件回退机制**: `src/config.ts` 新增配置文件读取逻辑，优先级：环境变量 > 配置文件 > 默认值
3. **GUI Help 视图更新**: 新增 skm config 命令文档和环境变量配置说明

### 命令用法

```bash
skm config                    # 查看所有配置项及来源（环境变量/配置文件/默认值）
skm config get <key>          # 查看指定配置
skm config set <key> <value>  # 设置配置值（持久化）
skm config reset <key>        # 恢复默认值
skm config reset --all        # 全部恢复默认
```

### 可配置项

| 配置键 | 环境变量 | 默认值 | 说明 |
|--------|---------|--------|------|
| `npmScope` | `SKM_NPM_SCOPE` | `@itismyskillmarket` | 主要 npm scope |
| `npmScopeFallback` | `SKM_NPM_SCOPE_FALLBACK` | `@wanxuchen` | 回退 scope |
| `npmRegistry` | `SKM_NPM_REGISTRY` | `https://registry.npmjs.org` | npm registry URL |
| `npmScopes` | `SKM_NPM_SCOPES` | 5 scopes | 搜索 scope 列表 |
| `skmUrl` | `SKM_URL` | npmjs URL | 技能链接前缀 |

### 变更文件

| 文件 | 变更 |
|------|------|
| `src/commands/config.ts` | **新建**: 467 行，config 命令模块（list/get/set/reset + 配置文件读写） |
| `src/config.ts` | 新增同步读取 `~/.skillmarket/config.json` 作为环境变量和默认值之间的回退层 |
| `src/cli.ts` | 注册 config 命令组及子命令；更新帮助文本 |
| `gui/app.js` | Help 视图新增 `skm config` 命令文档和环境变量配置说明 |
| `gui/index.html` | (无变更) |
| `gui/style.css` | (无变更) |

---

# SkillMarket v1.3.23 更新日志

**日期**: 2026-05-15
**版本**: 1.3.23

---

## 🐛 修复：分页截取 + 新增页数跳转输入

### 变更

1. **分页内容修复**: 修复排序/过滤后 skills 数组未 `slice()` 截取当前页的问题，现在选择 10/20/50 条每页时正确显示对应数量
2. **页数跳转**: 分页栏新增输入框，支持输入页码按 Enter 或点 Go 直接跳转

### 变更文件

| 文件 | 变更 |
|------|------|
| `src/commands/ui.ts` | `/api/skills` 返回前按 page/limit 截取 skills 数组 |
| `gui/app.js` | 新增 `jumpToPage()` 函数和分页跳转输入框 |
| `gui/style.css` | 分页跳转控件样式 |

---

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
