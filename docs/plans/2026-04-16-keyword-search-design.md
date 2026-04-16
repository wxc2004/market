# SkillMarket 关键字搜索功能设计方案

**版本**: 1.0  
**日期**: 2026-04-16  
**状态**: 待开发

## 1. 功能概述

为 SkillMarket CLI 添加关键字搜索功能，支持在 npm registry 和本地已安装 skills 中按关键字检索。

## 2. 推荐方案

### 2.1 新增命令

```bash
# 搜索 npm registry（默认行为，与现有 skm ls 等效但带过滤）
skm search <keyword>

# 搜索本地已安装的 skills
skm search <keyword> --installed

# 组合：分页 + 搜索关键字
skm search <keyword> --page 1 --limit 20
```

### 2.2 搜索字段

支持匹配以下字段：
- `id`: skill 包名（精确匹配 + 模糊匹配）
- `displayName`: 显示名称
- `description`: 描述

### 2.3 实现方式

复用现有 `skm ls` 命令，添加 `--search` / `-s` 选项：

| 命令 | 说明 |
|------|------|
| `skm ls --search <keyword>` | 在 npm registry 中搜索 |
| `skm ls --search <keyword> --installed` | 在本地已安装 skills 中搜索 |
| `skm ls -s <keyword>` | 简写形式 |

**推荐**：将搜索功能作为 `skm ls` 的选项，而不是新增独立命令。原因：
- 代码复用度高
- 用户学习成本低
- 与分页功能自然组合

## 3. 技术方案

### 3.1 代码修改

**文件**: `src/commands/ls.ts`

```typescript
interface LsOptions {
  // ... 现有字段
  search?: string;  // 新增：搜索关键字
}
```

### 3.2 npm search 实现

修改 `searchSkillmarketPackages` 函数，添加关键字过滤参数：

```typescript
interface SearchOptions {
  from: number;
  size: number;
  keyword?: string;  // 新增
}
```

**注意**：npm search API 本身支持通过 `q` 参数进行关键字搜索，可以直接传入。

### 3.3 本地搜索实现

在已有本地 skills 列表上进行内存过滤：

```typescript
function filterInstalledSkills(skills: InstalledSkill[], keyword: string): InstalledSkill[] {
  const lower = keyword.toLowerCase();
  return skills.filter(s => 
    s.id.toLowerCase().includes(lower) ||
    s.displayName?.toLowerCase().includes(lower) ||
    s.description?.toLowerCase().includes(lower)
  );
}
```

### 3.4 UI 输出

```
# npm 搜索结果
$ skm ls -s "brainstorm"

📦 brainstorming@1.0.0 (Found 1 match for "brainstorm")
   名称: Brainstorming
   描述: 多智能体头脑风暴能力
   平台: opencode
   链接: https://npmjs.com/package/brainstorming

# 本地搜索结果
$ skm ls --installed -s "test"

🟢 test-skill-1@1.0.0
   Platforms: opencode
   Installed: 2026-04-16

🟢 test-skill-2@1.0.0
   Platforms: opencode
   Installed: 2026-04-15
```

## 4. 实施步骤

1. **修改 `ls.ts` 命令模块**
   - 添加 `search` 选项到 `LsOptions` 接口
   - 实现关键字过滤逻辑
   - 支持 npm search API 和本地过滤

2. **修改 `cli.ts`**
   - 在 `ls` 命令中添加 `--search` / `-s` 选项

3. **测试**
   - `skm ls -s <keyword>`
   - `skm ls --installed -s <keyword>`
   - 边界情况：无结果、分页

## 5. 优先级

**P1 - 高**
- 核心搜索功能
- npm registry 搜索

**P2 - 中**
- 本地已安装 skills 搜索
- 搜索结果高亮（可选）

## 6. 风险与注意事项

- npm search API 有速率限制，生产环境考虑缓存
- 中文关键字搜索需要确认 npm API 支持
- 大结果集需要分页处理