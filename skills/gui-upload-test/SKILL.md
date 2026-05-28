# GUI 上传功能测试技能

用于测试 SkillMarket GUI 的 **Upload** 上传功能。

## 测试目标

验证 GUI 上传流程的各个阶段：

### Phase 1: 文件选择与上传
- [x] 拖拽上传 `.zip` 文件
- [x] 点击选择文件
- [x] Skill 名称自动检测（从 package.json 读取）
- [x] Skill 名称手动覆盖
- [x] 上传进度显示

### Phase 2: 解析与预览
- [x] 显示 skill 名称、版本、描述
- [x] 显示支持的平台列表
- [x] 显示文件数
- [x] 显示 package.json / SKILL.md 存在状态

### Phase 3: 操作执行
- [x] **发布到 npm** — 测试 publish 流程
- [x] **安装到本地** — 测试本地 install 流程
- [x] **两者都做** — 测试 publish + install 组合
- [x] **丢弃** — 测试重置视图

### 错误处理
- [x] 无效 zip 文件检测
- [x] 空 zip 检测
- [x] 缺少 SKILL.md 的警告（仍可继续）
- [x] 网络错误重试

## 使用说明

### 方式 1: 通过 GUI Upload 页面上传

```bash
# 1. 启动 GUI
skm gui

# 2. 浏览器访问 http://localhost:18770
# 3. 点击导航栏 "Upload"
# 4. 拖拽或选择 zip 文件
# 5. 点击 "Upload & Parse"
# 6. 预览信息，选择操作
```

### 方式 2: 通过命令行测试

```bash
# 安装到本地
skm install gui-upload-test

# 查看信息
skm info gui-upload-test

# 卸载
skm uninstall gui-upload-test
```

## 测试要点

| 测试场景 | 预期结果 | 验证方法 |
|---------|---------|---------|
| 上传有效 zip | 显示预览卡片，信息正确 | 查看预览区 |
| 覆盖 skill 名称 | 使用手动输入的名称 | 预览区名称变化 |
| 安装到本地 | Toast 提示安装成功 | `skm ls --installed` |
| 发布到 npm | Toast 提示发布成功 | `skm admin info gui-upload-test` |
| 上传后丢弃 | 视图重置，可再次上传 | 回到文件选择界面 |

## 文件结构

```
gui-upload-test/
├── package.json    # npm 包配置 + skillmarket 元数据
├── SKILL.md        # 本文档
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
