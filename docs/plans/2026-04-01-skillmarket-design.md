# SkillMarket 设计文档

**日期**: 2026-04-01  
**状态**: 已批准  
**版本**: v1.0.0

---

## 1. 概述

### 1.1 目标

创建一个跨平台的 npm 包 `skillmarket`，用于管理 AI 编程工具（Cursor / VSCode / Codex / OpenCode / Claude Code / Antigravity）的 skills。

### 1.2 核心功能

- 查看可用的 skills 列表
- 查看 skill 的详细介绍
- 安装 / 更新 / 卸载 skills
- 多平台适配（软链接机制）

---

## 2. 架构设计

### 2.1 目录结构

```
~/.skillmarket/
├── registry.json              # npm registry 缓存（已发现的 skills）
├── cache/                      # npm 包缓存目录
│   └── @skillmarket/
│       └── <skill-name>@<version>/
├── skills/                     # 安装的 skills
│   ├── <skill-name>@<version>/
│   │   ├── SKILL.md            # 统一 skill 定义
│   │   ├── metadata.json       # 元信息（名称、版本、平台、依赖）
│   │   ├── v1/
│   │   │   ├── cursor/
│   │   │   ├── vscode/
│   │   │   ├── codex/
│   │   │   ├── opencode/
│   │   │   ├── claude/
│   │   │   └── antigravity/
│   │   └── v2/                 # 未来版本扩展
│   └── latest -> <skill-name>@<version>/  # 软链接
└── platform-links/             # 各平台的软链接入口
    ├── cursor/
    │   └── skills/
    │       └── <skill-name> -> ../../skills/<skill-name>/latest/cursor
    └── ...
```

### 2.2 Skill 包结构（npm）

```json
{
  "name": "@skillmarket/<skill-name>",
  "version": "1.0.0",
  "skillmarket": {
    "id": "<skill-name>",
    "displayName": "Display Name",
    "description": "Skill description",
    "platforms": ["cursor", "vscode", "opencode", "codex", "claude", "antigravity"],
    "defaultVersion": "v1"
  }
}
```

### 2.3 平台目录结构

```
<skill-name>/
├── SKILL.md                    # 必选：skill 定义
├── metadata.json               # 必选：元信息
└── v1/
    ├── cursor/                  # Cursor 平台适配
    │   └── (platform-specific files)
    ├── opencode/               # OpenCode 平台适配
    │   └── SKILL.md
    └── ...
```

---

## 3. 命令设计

### 3.1 CLI 接口

```bash
# 主命令入口（通过 npm script 或 bin 链接为 skm）
npx skillmarket <command>

# 快捷方式（推荐安装为全局）
skm <command>
```

### 3.2 命令列表

| 命令 | 说明 | 参数 |
|------|------|------|
| `--help`, `-h` | 显示帮助信息 | - |
| `--ls` | 列出可用的 skills | `[--installed]` `[--updates]` |
| `--info` | 查看 skill 详情 | `<skill-id>` |
| `--install` | 安装 skill | `<skill-id>[@version]` `[--all]` |
| `--uninstall` | 卸载 skill | `<skill-id>` |
| `--update` | 更新 skill | `<skill-id>` `[--all]` |
| `--sync` | 同步软链接 | - |
| `--platform` | 指定目标平台 | `<name>` |

### 3.3 使用示例

```bash
# 查看帮助
skm --help

# 列出所有可安装的 skills
skm --ls

# 仅显示已安装的
skm --ls --installed

# 检查更新
skm --ls --updates

# 查看 skill 详情
skm --info brainstorming

# 安装指定 skill
skm --install brainstorming

# 安装特定版本
skm --install brainstorming@1.0.0

# 安装所有可用 skills
skm --install --all

# 卸载
skm --uninstall brainstorming

# 更新
skm --update brainstorming
skm --update --all
```

---

## 4. 核心流程

### 4.1 安装流程

```
skm --install <skill-id>
       │
       ▼
1. 查询 npm registry @skillmarket/<skill-id>
       │
       ▼
2. npm pack 下载到 cache/
       │
       ▼
3. 解压到 ~/.skillmarket/cache/@skillmarket/<skill-id>@<version>/
       │
       ▼
4. 解析 metadata.json，获取 platforms 列表
       │
       ▼
5. 复制/创建平台适配文件到 skills/<skill-id>@<version>/<platform>/
       │
       ▼
6. 创建/更新 latest 软链接
       │
       ▼
7. 更新各平台的 platform-links/
       │
       ▼
8. 写入 registry.json 记录
```

### 4.2 更新检测流程

```
skm --ls --updates
       │
       ▼
1. 读取 registry.json
       │
       ▼
2. 对每个已安装 skill，向 npm 查询最新版本
       │
       ▼
3. 对比版本号，显示可更新的列表
       │
       ▼
4. 用户确认后，执行 --update
```

---

## 5. 平台适配层

### 5.1 平台识别

通过环境变量或自动检测：

```javascript
const detectPlatform = () => {
  if (process.env.OPENCODE) return 'opencode';
  if (process.env.CURSOR) return 'cursor';
  if (process.env.VSCODE) return 'vscode';
  if (process.env.CLAUDE_CODE) return 'claude';
  if (process.env.ANTIGRAVITY) return 'antigravity';
  // 默认尝试 codex
  return 'codex';
};
```

### 5.2 软链接策略

- **latest 软链接**: 方便版本管理，每次安装/更新时更新
- **platform-links**: 各平台通过此目录访问统一的 skills

---

## 6. 预留扩展

以下功能设计预留接口，后续版本实现：

- [ ] `--search` - 搜索 skills
- [ ] `--publish` - 发布自己的 skill
- [ ] `--verify` - 验证 skill 完整性
- [ ] `--config` - 配置管理
- [ ] `--backup` / `--restore` - 备份与恢复
- [ ] `--proxy` - 代理/镜像支持
- [ ] `--theme` - 主题定制
- [ ] `--sync-server` - 远程同步

---

## 7. 技术选型

| 组件 | 选型 | 理由 |
|------|------|------|
| 语言 | TypeScript | 类型安全，便于维护 |
| 构建 | tsup | 快速，输出 CJS/ESM |
| CLI 解析 | commander | 轻量，成熟 |
| 文件操作 | fs-extra | Promise 化的文件系统操作 |
| 兼容性 | Node.js 18+ | 软链接、crypto 等特性 |

---

## 8. 里程碑

- [ ] **M1**: 项目初始化，CLI 骨架，--help 和 --ls
- [ ] **M2**: npm registry 查询，skill 信息展示
- [ ] **M3**: 安装逻辑，目录结构，软链接创建
- [ ] **M4**: 更新检测，registry.json 管理
- [ ] **M5**: 多平台适配，软链接策略完善
- [ ] **M6**: 测试覆盖，文档完善

---

## 9. 文档

- `README.md` - 用户使用文档
- `SKILL.md` - skill 定义规范
- `docs/` - 开发者文档
