# SkillMarket 开发记录

**开发日期**: 2026-04-01  
**开发者**: Sisyphus (Sisyphus Agent)  
**项目状态**: v1.0.0 完成

---

## 1. 项目概述

### 1.1 项目目标
创建一个跨平台 npm CLI 工具 `skillmarket`，用于管理 AI 编程工具（Cursor / VSCode / Codex / OpenCode / Claude Code / Antigravity）的 skills。

### 1.2 核心功能
- 查看 npm registry 上可用的 skills 列表
- 查看 skill 的详细介绍
- 安装 / 更新 / 卸载 skills
- 多平台适配（软链接机制）

### 1.3 技术栈
| 组件 | 选型 | 理由 |
|------|------|------|
| 语言 | TypeScript | 类型安全，便于维护 |
| 构建 | tsup | 快速，输出 CJS/ESM |
| CLI 解析 | commander | 轻量，成熟 |
| 文件操作 | fs-extra | Promise 化的文件系统操作 |
| 兼容性 | Node.js 18+ | 软链接、crypto 等特性 |

---

## 2. 目录结构

```
skillmarket/
├── package.json          # npm 包配置
├── tsconfig.json         # TypeScript 配置
├── tsup.config.ts       # 构建配置
├── README.md             # 使用文档
├── .gitignore
├── dist/                 # 编译输出
└── src/
    ├── index.ts          # CLI 入口 (shebang)
    ├── cli.ts            # 命令解析入口
    ├── constants.ts       # 常量定义 (平台、目录名)
    ├── types.ts          # 类型定义
    ├── commands/
    │   ├── ls.ts         # skm ls - 列出 skills
    │   ├── info.ts       # skm info - 查看详情
    │   ├── install.ts     # skm install - 安装
    │   ├── update.ts      # skm update - 更新
    │   ├── uninstall.ts   # skm uninstall - 卸载
    │   ├── sync.ts        # skm sync - 同步软链接
    │   ├── registry.ts    # 本地注册表管理
    │   └── npm.ts        # npm registry HTTP 查询
    └── utils/
        ├── dirs.ts       # 目录路径工具
        └── platform.ts    # 平台检测
```

---

## 3. Git 提交历史

| Commit | 描述 |
|--------|------|
| `f6bcd20` | docs: add design and implementation plan |
| `8e94de5` | chore: project initialization with TypeScript and tsup |
| `4aec3ea` | feat: add directory structure and types |
| `b02f886` | feat: add help command with usage examples |
| `db403be` | feat: add --ls command with registry support |
| `b8332fd` | feat: add npm registry query support |
| `628e3a7` | feat: add --info command for skill details |
| `64beb65` | feat: add --install command with npm download |
| `cf8fbc0` | feat: add --sync for platform link management |
| `db66526` | feat: add --update and --uninstall commands |
| `bafb3e8` | docs: add README and finalize package.json |

**Release Tag**: `v1.0.0`

---

## 4. 各模块详细说明

### 4.1 入口和常量 (index.ts, constants.ts)

```typescript
// src/index.ts
#!/usr/bin/env node
import './cli.js';
```

```typescript
// src/constants.ts
export const PLATFORMS = [
  'cursor', 'vscode', 'codex', 'opencode', 'claude', 'antigravity'
] as const;

export const SUBDIRS = {
  CACHE: 'cache',
  SKILLS: 'skills',
  PLATFORM_LINKS: 'platform-links'
} as const;

export const LATEST_LINK = 'latest';
export const REGISTRY_FILE = 'registry.json';
```

### 4.2 目录工具 (utils/dirs.ts)

技能安装位置：`~/.skillmarket/`

```typescript
getMarketHome()      // ~/.skillmarket
getCacheDir()        // ~/.skillmarket/cache
getSkillsDir()       // ~/.skillmarket/skills
getPlatformLinksDir() // ~/.skillmarket/platform-links
getRegistryPath()     // ~/.skillmarket/registry.json
ensureMarketDirs()    // 创建所有必要目录
```

### 4.3 注册表管理 (commands/registry.ts)

本地注册表存储已安装的 skills 信息：

```typescript
interface RegistryData {
  skills: Record<string, InstalledSkill>;
  lastUpdated: string;
}

interface InstalledSkill {
  id: string;
  version: string;
  installedAt: string;
  platforms: string[];
}
```

### 4.4 npm 查询 (commands/npm.ts)

使用原生 `https` 模块查询 npm registry：

```typescript
fetchNpmPackage(packageName)     // 获取包信息
searchSkillmarketPackages()      // 搜索 @skillmarket/* 包
```

### 4.5 平台检测 (utils/platform.ts)

通过环境变量检测当前平台：

```typescript
detectPlatform()  // OPENCODE, CURSOR, VSCODE, CLAUDE_CODE, ANTIGRAVITY
```

### 4.6 安装逻辑 (commands/install.ts)

1. 查询 npm 获取最新版本
2. `npm pack` 下载到 cache
3. 解压并复制到 skills 目录
4. 创建 `latest` 软链接
5. 更新 registry.json

### 4.7 软链接同步 (commands/sync.ts)

为各平台创建适配层软链接：
```
~/.skillmarket/platform-links/
├── cursor/skills/<skill-name> -> skills/<skill-name>/latest/cursor
├── vscode/skills/<skill-name> -> skills/<skill-name>/latest/vscode
└── ...
```

---

## 5. 命令设计

| 命令 | 说明 | 参数 |
|------|------|------|
| `skm ls` | 列出 npm 上可用的 skills | `--installed` `--updates` |
| `skm info <skill>` | 查看 skill 详情 | - |
| `skm install <skill>` | 安装 skill | `@version` `--all` |
| `skm update [skill]` | 更新 skill | `--all` |
| `skm uninstall <skill>` | 卸载 skill | - |
| `skm sync` | 同步平台软链接 | - |

---

## 6. 安装后目录结构

```
~/.skillmarket/
├── registry.json              # 安装记录
├── cache/                     # npm 包缓存
│   └── @skillmarket/
│       └── <skill>@<version>/
├── skills/                   # 安装的 skills
│   └── <skill>/
│       ├── latest -> <version>/  # 软链接
│       └── <version>/
│           ├── SKILL.md
│           ├── metadata.json
│           ├── cursor/
│           ├── vscode/
│           └── ...
└── platform-links/            # 平台适配层
    ├── cursor/
    │   └── skills/
    │       └── <skill> -> ../../../skills/<skill>/latest/cursor
    ├── vscode/
    └── ...
```

---

## 7. 遇到的问题和解决方案

### 7.1 npm registry 查询问题
**问题**: npm API 返回数据格式不一致，404 时也返回 JSON  
**解决**: 检查 `parsed.error` 字段，处理空数据情况

### 7.2 Windows 软链接权限
**问题**: Windows 上创建 junction 可能失败  
**解决**: 添加 try-catch 降级到目录复制

### 7.3 Commander 选项处理
**问题**: `--info <skill-id>` 选项无法正确传递参数  
**解决**: 改用 `program.command('info').argument('<skill-id>')` 子命令方式

### 7.4 TypeScript 类型
**问题**: npm 返回的 `versions` 对象索引签名不完整  
**解决**: 扩展 `NpmPackage` 接口包含 `skillmarket` 元数据

---

## 8. 开发过程

### Phase 1: 需求澄清
1. 包名确定为 `skillmarket`
2. 使用统一目录 + 软链接方案
3. 采用主动检测更新模式
4. 统一结构 + 平台适配层

### Phase 2: 设计文档
- 创建 `docs/plans/2026-04-01-skillmarket-design.md`
- 创建 `docs/plans/2026-04-01-skillmarket-implementation.md`

### Phase 3: 编码实现
按照 implementation plan 执行了 10 个 task：
1. 项目初始化 (package.json, tsconfig, tsup)
2. 目录结构和常量定义
3. --help 命令实现
4. --ls 命令基础实现
5. npm registry 查询
6. --info 命令实现
7. --install 命令实现
8. 软链接策略实现
9. --update 和 --uninstall 实现
10. README 和发布准备

---

## 9. 预留扩展

以下功能在设计文档中预留接口，后续版本实现：

- [ ] `--search` - 搜索 skills
- [ ] `--publish` - 发布自己的 skill
- [ ] `--verify` - 验证 skill 完整性
- [ ] `--config` - 配置管理
- [ ] `--backup` / `--restore` - 备份与恢复
- [ ] `--proxy` - 代理/镜像支持
- [ ] `--theme` - 主题定制
- [ ] `--sync-server` - 远程同步

---

## 10. 使用示例

```bash
# 全局安装
npm install -g skillmarket

# 或者直接使用
npx skillmarket --help

# 列出可用 skills
skm ls

# 查看 skill 详情
skm info brainstorming

# 安装 skill
skm install brainstorming

# 查看已安装
skm ls --installed

# 更新
skm update --all

# 同步平台链接
skm sync

# 卸载
skm uninstall brainstorming
```

---

## 11. 下一步

1. **发布到 npm**
   ```bash
   npm login
   npm publish
   ```

2. **创建第一个 skill 包**
   - 创建 `@skillmarket/brainstorming` 包
   - 包含各平台适配文件

3. **完善 npm search**
   - 目前搜索基于 `keywords:skillmarket`
   - 可考虑建立官方 skill 列表

4. **Windows 兼容性测试**
   - junction 链接测试
   - 路径处理测试

---

## 12. 相关文档

- [设计文档](./docs/plans/2026-04-01-skillmarket-design.md)
- [实现计划](./docs/plans/2026-04-01-skillmarket-implementation.md)
- [用户文档](./README.md)

---

## 13. Skill 发布流程 (v1.0.1+)

### 13.1 创建新 Skill

在 `skills/` 目录下创建新 skill：

```
skills/<skill-name>/
├── package.json      # 包含 skillmarket 元数据
├── SKILL.md          # 文档
├── metadata.json    # 额外元数据
└── index.js          # 主入口（OpenCode 插件）
```

### 13.2 发布 Skill

**方式一：GitHub Actions（推荐）**
1. 进入仓库 Actions 页面
2. 选择 "Publish Skill" 工作流
3. 点击 "Run workflow"
4. 输入 skill 名称（如 `test-skill`）
5. 可选：指定版本号

**方式二：本地发布**
```bash
cd skills/<skill-name>
npm install
npm publish --access=public
```

### 13.3 用户安装

```bash
skm install <skill-name>
skm info <skill-name>
```
