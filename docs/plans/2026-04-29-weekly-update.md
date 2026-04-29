# SkillMarket 本周更新日志 (2026-04-23 ~ 2026-04-29)

## 📦 版本发布

### v1.3.1 - 2026-04-29

**新功能：**
- ✨ 新增独立 `skm search` 命令，支持关键词匹配搜索技能
- 🔍 优化搜索精度，增加本地过滤支持

**修复：**
- 🐛 修复 GitHub Actions workflow 中版本重复更新的问题
- 🔧 改进 `publish-npm.yml` 的版本判断逻辑

**发布详情：**
- npm: https://www.npmjs.com/package/itismyskillmarket/v/1.3.1
- GitHub Release: https://github.com/wxc2004/market/releases/tag/v1.3.1
- 对比: https://github.com/wxc2004/market/compare/v1.2.9...v1.3.1

---

## 📊 本周统计

| 指标 | 数据 |
|------|------|
| 新增功能 | 1 个 |
| Bug 修复 | 1 个 |
| 版本发布 | 1 个 (v1.3.1) |
| Commits | 2 个 |
| 代码行变更 | ~150 行 |

---

## 🔜 下周计划

- [ ] 增加技能评分/评论功能
- [ ] 支持更多 AI 编码工具平台
- [ ] 优化安装速度（增量更新）
- [ ] 增加技能依赖检查

---

## 📝 详细变更

### feat: add independent search command with keyword matching (1e91352)
- 新增 `skm search <keyword>` 命令
- 支持按名称、描述关键词搜索已安装和远程技能
- 本地缓存优先，减少网络请求

### fix: skip npm version when version unchanged in workflow (2213d4a)
- 修复 GitHub Actions 发布时 `npm version` 报错问题
- 增加版本号判断逻辑，避免重复设置
- 优化 CI/CD 流程稳定性

---

*生成时间: 2026-04-29*
