# Weekly Update Log (2026-06-15 ~ 2026-06-21)

本周版本迭代 v1.3.40 → v1.3.43，共发布 4 个版本：

**v1.3.40** 新增了 `demo-upload-test` 上传演示技能，帮助用户理解 GUI Upload 的完整流程（打包→上传→预览→发布/安装），同时修复了 npm token 过期导致 publish 401 的问题，替换了新的有效 token，登录用户为 `wanxuchen`。

**v1.3.41** 在桌面 GUI 的 Help 视图顶部新增了 GitHub Token 管理面板，支持输入/保存/移除 Token，持久化存储在 `~/.skillmarket/config.json`，中英文双语适配。

**v1.3.42** 为 OpenAI Codex CLI 添加了独立平台适配器，安装路径为 `~/.codex/skills/`，通过 `CODEX_CLI` 环境变量或 `~/.codex/` 目录检测，不再回退到 OpenCode 适配器。

**v1.3.43** 优化了 GUI 上传体验，选中 zip 文件后拖拽区显示绿色边框 + 绿色徽章（文件名和大小），覆盖点击选择、拖拽放下、提交重选所有入口。

当前版本 v1.3.43，适配器总数 10 个（cursor, vscode, codex, opencode, claude, antigravity, openclaw, hermes, saitec, codex-cli）。npm 认证已修复，下周可继续推进 Skill Curation 审核系统。
