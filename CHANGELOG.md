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
