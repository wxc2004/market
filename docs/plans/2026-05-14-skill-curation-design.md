# Skill Curation (上架/下架) 系统设计

**日期**: 2026-05-14
**状态**: 已批准

---

## 概述

为 SkillMarket 添加技能审核/上下架管理系统。管理员控制哪些 skill 出现在 `skm ls` 和 GUI 中，可授权给其他审核员。

## 存储方案

使用公开 npm 包 `@itismyskillmarket/registry` 存储审核数据。

- 所有用户共享同一份审核列表
- 通过 npm token 鉴权写入
- 读取时直接 fetch 最新版（带本地缓存）

## 数据结构

```
@itismyskillmarket/registry
└── registry.json
```

```json
{
  "schemaVersion": 1,
  "superAdmin": "wxc2004",
  "curators": ["user1"],
  "skills": {
    "<skill-id>": {
      "status": "listed",       // listed | unlisted | pending
      "listedBy": "wxc2004",
      "listedAt": "2026-05-14T10:00:00Z",
      "unlistedBy": null,
      "unlistedAt": null
    }
  }
}
```

字段说明：
- `superAdmin` — 超级管理员，不可被移除
- `curators` — 审核员列表，可上下架 skill
- `skills` — skill ID 到状态的映射
  - `listed`: 已上架，对所有人可见
  - `unlisted`: 已下架，仅管理员可见
  - `pending`: 待审核（预留）

## CLI 命令

```
skm admin review approve <skill-name>        # 上架
skm admin review reject <skill-name>         # 下架
skm admin review ls [--status listed|unlisted|pending]  # 查看

skm admin review curators add <npm-user>     # 授予审核权
skm admin review curators rm <npm-user>      # 撤销审核权
skm admin review curators ls                 # 查看审核员
```

### 权限规则
- `superAdmin` — 所有操作均可执行
- `curator` — 可 approve/reject skill；不可管理 curators
- 其他人 — 只读

## GUI 变化

### Admin 视图
- 技能列表增加「状态」列（✅ Listed / ❌ Unlisted / ⏳ Pending）
- 每行增加 Approve / Reject 按钮
- 新增 Curators 管理区域（添加/移除审核员）

### Skills 视图
- 默认只显示 `status=listed` 的 skill
- Admin 可通过参数查看全部

## 后端 API

新增 API 端点：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/admin/review/approve` | POST | 上架 skill |
| `/api/admin/review/reject` | POST | 下架 skill |
| `/api/admin/review/list` | GET | 查看审核列表 |
| `/api/admin/review/curators` | POST | 管理审核员 |

## 发布流程

每次上下架操作：
1. `npm view @itismyskillmarket/registry` 获取当前 registry.json
2. 修改 JSON 数据
3. `npm version patch`
4. `npm publish`

## 缓存策略
- registry 数据本地缓存 60s TTL（复用现有 npm 缓存机制）

## 涉及文件
- `src/commands/admin.ts` — 新增 review/curators 子命令
- `src/cli.ts` — 注册 review 命令组
- `src/commands/ui.ts` — 新增审核相关 API
- `gui/app.js` — Admin 视图增加状态列和操作按钮
- `gui/style.css` — 新增状态标识样式
- `gui/index.html` — 可能调整 Admin 视图布局
