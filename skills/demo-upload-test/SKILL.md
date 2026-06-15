# Demo 上传演示技能

用于演示 SkillMarket GUI **Upload** 上传功能的完整流程。

## 用途

这个技能是**教学演示用**的，帮助新用户理解如何通过 GUI 界面上传并发布技能到 npm。

## 上传演示流程

### Step 1：打包技能

将 `demo-upload-test/` 目录打包为 ZIP：

```bash
# Windows：右键 → 发送到 → 压缩文件夹
# 或命令行：
Compress-Archive -Path demo-upload-test -DestinationPath demo-upload-test.zip
```

### Step 2：启动 GUI

```bash
# 启动 SkillMarket GUI
skm gui
# 或双击 skillmarket.exe
```

### Step 3：上传

1. 浏览器访问 `http://localhost:18770`
2. 点击导航栏 **"Upload"**
3. 拖拽或点击选择 `demo-upload-test.zip`
4. 点击 **"Upload & Parse"**

### Step 4：预览

上传成功后，查看解析结果：

| 字段 | 预期值 |
|------|--------|
| Skill 名称 | `demo-upload-test` |
| 版本 | `1.0.0` |
| 描述 | 演示 SkillMarket GUI 上传功能... |
| 支持平台 | opencode, cursor, vscode, ... |
| package.json | ✅ 存在 |
| SKILL.md | ✅ 存在 |

### Step 5：操作

选择操作方式：

- **Publish to npm** — 发布到 npm registry
- **Install Locally** — 安装到本地
- **Both** — 同时发布 + 安装
- **Discard** — 丢弃，重新上传

## 验证

安装成功后，运行以下命令验证：

```bash
# 查看已安装技能
skm ls --installed

# 查看技能详情
skm info demo-upload-test

# 验证技能完整性
skm verify demo-upload-test
```

## 文件结构

```
demo-upload-test/
├── package.json    # npm 包配置 + skillmarket 元数据
├── SKILL.md        # 本文档 - 技能说明
├── metadata.json   # SkillMarket 元数据
└── index.js        # 入口文件
```

## 平台支持

- OpenCode
- Cursor
- VSCode
- Claude Code
- Codex
- Antigravity
