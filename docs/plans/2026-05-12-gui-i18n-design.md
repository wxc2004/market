# GUI 中英双语切换设计

**Date**: 2026-05-12
**Author**: wxc2004
**Status**: Approved

## 1. Overview

### 1.1 Problem Statement

当前 SkillMarket GUI 界面只支持英文，无法为中文用户提供更好的使用体验。需要添加中英文双语切换功能。

### 1.2 Goals

1. 在 GUI 顶部导航栏添加语言切换选择框
2. 支持英文 (EN) 和中文 (中文) 两种语言
3. 用户选择的语言持久化保存
4. 所有界面文本支持中英文切换

### 1.3 Success Criteria

- [ ] 用户可以在顶部导航栏切换中英文
- [ ] 所有界面文本正确显示对应语言
- [ ] 语言选择保存到 localStorage，刷新页面后保持
- [ ] 默认语言根据浏览器自动检测

---

## 2. 技术架构

### 2.1 i18n 系统设计

```javascript
// 翻译对象
const translations = {
  en: { /* 英文翻译 */ },
  zh: { /* 中文翻译 */ }
};

// 翻译函数
function t(key, params = {}) {
  let text = translations[currentLanguage][key] || translations['en'][key] || key;
  // 替换变量 {var}
  Object.keys(params).forEach(k => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
  });
  return text;
}

// 语言检测
function detectLanguage() {
  const saved = localStorage.getItem('skm-language');
  if (saved && ['en', 'zh'].includes(saved)) {
    return saved;
  }
  // 浏览器语言检测
  const browserLang = navigator.language || navigator.userLanguage;
  return browserLang.startsWith('zh') ? 'zh' : 'en';
}
```

### 2.2 UI 布局

```
[📦 SkillMarket] [v1.3.17] [📋 Skills] [✅ Installed] [💻 Platforms] [⚙️ Admin] [📖 Help] [🌐 EN ▾]
                                                                                        ↑
                                                                                   语言切换位置
```

### 2.3 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `gui/index.html` | 添加语言切换 select 控件 |
| `gui/app.js` | 添加 i18n 系统，替换所有硬编码文本 |
| `gui/style.css` | 添加语言切换控件样式 |

---

## 3. 翻译键设计

### 3.1 翻译对象结构

```javascript
const translations = {
  en: {
    // 导航
    'nav.skills': 'Skills',
    'nav.installed': 'Installed',
    'nav.platforms': 'Platforms',
    'nav.admin': 'Admin',
    'nav.help': 'Help',
    'nav.back': 'Back',
    
    // 视图标题
    'title.availableSkills': 'Available Skills',
    'title.installedSkills': 'Installed Skills',
    'title.platforms': 'Available Platforms',
    'title.help': 'Help & Configuration',
    'title.admin': 'Admin Dashboard',
    'title.skillDetail': 'Skill Details',
    
    // 按钮
    'btn.install': 'Install',
    'btn.uninstall': 'Uninstall',
    'btn.update': 'Update',
    'btn.refresh': 'Refresh',
    'btn.updateAll': 'Update All',
    'btn.confirm': 'Confirm',
    'btn.cancel': 'Cancel',
    'btn.info': 'Info',
    
    // 加载状态
    'loading.skills': 'Loading skills...',
    'loading.platforms': 'Loading platforms...',
    'loading.details': 'Loading skill details...',
    'loading.stats': 'Loading stats...',
    'loading.published': 'Loading published skills...',
    'loading.generic': 'Loading...',
    
    // 空状态
    'empty.noSkills': 'No skills found',
    'empty.noPlatforms': 'No platforms found',
    'empty.noPublishedSkills': 'No published skills found',
    'empty.noTags': 'No dist-tags found.',
    'empty.couldNotLoadTags': 'Could not load tags.',
    
    // 错误
    'error.generic': 'Error',
    
    // Toast 消息
    'toast.installing': 'Installing {skillId}...',
    'toast.installSuccess': '{skillId} installed successfully!',
    'toast.uninstalling': 'Uninstalling {skillId}...',
    'toast.uninstallSuccess': '{skillId} uninstalled!',
    'toast.updating': 'Updating {skillId}...',
    'toast.updateSuccess': '{skillId} updated!',
    'toast.updateAll': 'Updating all skills...',
    'toast.updateAllSuccess': 'All skills updated!',
    
    // 确认对话框
    'confirm.uninstall': 'Are you sure you want to uninstall {skillId}?',
    'confirm.updateAll': 'Update all installed skills?',
    
    // 搜索
    'search.placeholder': 'Search skills...',
    
    // 分页
    'pagination.page': 'Page',
    'pagination.of': 'of',
    'pagination.prev': '← Prev',
    'pagination.next': 'Next →',
    'pagination.pageInfo': 'Page {page} of {totalPages}',
    
    // 每页数量
    'pageSize.10': '10 per page',
    'pageSize.20': '20 per page',
    'pageSize.50': '50 per page',
    
    // 状态
    'status.available': '✅ Available',
    'status.unavailable': '❌ Not detected',
    'status.skillsInstalled': '{count} skills installed',
    
    // 详情视图
    'detail.description': 'Description',
    'detail.details': 'Details',
    'detail.id': 'ID',
    'detail.version': 'Version',
    'detail.license': 'License',
    'detail.author': 'Author',
    'detail.homepage': 'Homepage',
    'detail.repository': 'Repository',
    'detail.platforms': 'Platforms',
    'detail.versions': 'Versions (last {count})',
    'detail.latest': 'latest',
    'detail.noDescription': 'No description',
    
    // Help 视图 (仅翻译说明文字，技术术语保留英文)
    'help.publishMain': 'Publish Main Package',
    'help.publishSkill': 'Publish Individual Skill',
    'help.publishLocal': 'Publish Locally',
    'help.githubReleases': 'GitHub → Releases → Create a new release',
    'help.enterTagPublish': 'Enter Tag (e.g., v1.3.11), click Publish release',
    'help.actionAutoTrigger': 'Action "Publish to npm" auto triggers → build → npm publish',
    'help.githubActions': 'GitHub → Actions → Publish Skill → Run workflow',
    'help.enterSkillName': 'Enter skill_name (directory under skills/) and optional version',
    'help.autoExec': 'Auto exec: npm install → npm version → npm publish',
    'help.requiresNpmToken': 'Requires NPM_TOKEN in GitHub Secrets',
    'help.envVars': 'Environment Variables',
    'help.setEnvVars': 'Set the following environment variables to override defaults:',
    'help.envVar.primaryScope': 'Primary npm scope for publishing/lookup',
    'help.envVar.fallbackScope': 'Fallback scope (backward compatibility)',
    'help.envVar.scopeList': 'Comma-separated list of scopes to search',
    'help.envVar.registryUrl': 'npm registry URL',
    'help.envVar.personalLink': 'Personal link prefix (for publish output)',
    'help.commands': 'Common Commands',
    
    // Admin 视图
    'admin.publishedSkills': 'Published Skills',
    'admin.publishedSkillsCount': 'Published Skills ({count})',
    'admin.stats.totalSkills': 'Published Skills',
    'admin.stats.totalVersions': 'Total Versions',
    'admin.stats.avgVersions': 'Avg Versions/Skill',
    'admin.stats.withMetadata': 'With Metadata',
    'admin.stats.totalSize': 'Total Size',
    'admin.stats.platformsCovered': 'Platforms Covered',
    
    // Admin Modal
    'admin.deprecate': 'Deprecate',
    'admin.deprecating': 'Deprecating {skillId}...',
    'admin.deprecateTitle': 'Deprecate: {skillId}',
    'admin.deprecateVersion': 'Version',
    'admin.deprecateVersionPlaceholder': '(leave empty for all versions)',
    'admin.deprecateMessage': 'Message',
    'admin.deprecateDefaultMsg': 'This skill is deprecated. Please use an alternative.',
    'admin.deprecateWarning': '⚠ Deprecating will mark this skill as deprecated in the npm registry.',
    'admin.confirmDeprecate': 'Confirm Deprecate',
    
    'admin.unpublish': 'Unpublish',
    'admin.unpublishing': 'Unpublishing {skillId}...',
    'admin.unpublishTitle': 'Unpublish: {skillId}',
    'admin.unpublishVersion': 'Version',
    'admin.unpublishVersionPlaceholder': '(leave empty for entire package)',
    'admin.unpublishForce': 'Force unpublish entire package (required if no version specified)',
    'admin.unpublishDanger': '⚠ This action cannot be undone! Packages can be restored within 72 hours.',
    'admin.confirmUnpublish': 'Confirm Unpublish',
    
    'admin.tags': 'Tags',
    'admin.settingTag': 'Setting tag {tag}...',
    'admin.removingTag': 'Removing tag {tag}...',
    'admin.tagsTitle': 'Tags: {skillId}',
    'admin.currentTags': 'Current Tags',
    'admin.setTag': 'Set Tag',
    'admin.removeTag': 'Remove Tag',
    'admin.tagName': 'Tag',
    'admin.tagNamePlaceholder': 'e.g. beta, latest',
    'admin.tagVersion': 'Version',
    'admin.tagVersionPlaceholder': 'e.g. 1.0.1',
    'admin.tagNameRemovePlaceholder': 'e.g. beta',
    'admin.tag.default': '(default)',
    
    'admin.owners': 'Owners',
    'admin.addingOwner': 'Adding owner {user}...',
    'admin.removingOwner': 'Removing owner {user}...',
    'admin.ownersTitle': 'Owners: {skillId}',
    'admin.addOwner': 'Add Owner',
    'admin.removeOwner': 'Remove Owner',
    'admin.npmUser': 'npm User',
    'admin.npmUserPlaceholder': 'npm username',
    'admin.usernameRequired': 'Username is required',
    'admin.tagRequired': 'Tag and version are required',
    'admin.tagNameRequired': 'Tag name is required',
    
    'admin.access': 'Access',
    'admin.settingAccess': 'Setting access to {level}...',
    'admin.accessTitle': 'Access: {skillId}',
    'admin.accessDesc': 'Set the package access level. Public packages are visible to everyone. Restricted packages require authentication to install.',
    'admin.accessPublic': 'Public',
    'admin.accessRestricted': 'Restricted',
    'admin.setAccess': 'Set Access',
    
    // 警告
    'warning.fetchErrors': '{count} skill(s) failed to load details from npm registry. Refresh to retry.',
    
    // 平台状态
    'platform.available': 'Available',
    'platform.notDetected': 'Not detected',
    
    // 版本
    'version.NA': 'N/A',
    
    // 语言
    'lang.en': 'English',
    'lang.zh': '中文',
    
    // 详细信息中
    'detail.nA': 'N/A',
  },
  
  zh: {
    // 导航
    'nav.skills': '技能',
    'nav.installed': '已安装',
    'nav.platforms': '平台',
    'nav.admin': '管理',
    'nav.help': '帮助',
    'nav.back': '返回',
    
    // 视图标题
    'title.availableSkills': '可用技能',
    'title.installedSkills': '已安装技能',
    'title.platforms': '可用平台',
    'title.help': '帮助与配置',
    'title.admin': '管理面板',
    'title.skillDetail': '技能详情',
    
    // 按钮
    'btn.install': '安装',
    'btn.uninstall': '卸载',
    'btn.update': '更新',
    'btn.refresh': '刷新',
    'btn.updateAll': '全部更新',
    'btn.confirm': '确认',
    'btn.cancel': '取消',
    'btn.info': '详情',
    
    // 加载状态
    'loading.skills': '加载技能中...',
    'loading.platforms': '加载平台中...',
    'loading.details': '加载技能详情中...',
    'loading.stats': '加载统计中...',
    'loading.published': '加载已发布技能中...',
    'loading.generic': '加载中...',
    
    // 空状态
    'empty.noSkills': '未找到技能',
    'empty.noPlatforms': '未找到平台',
    'empty.noPublishedSkills': '未找到已发布的技能',
    'empty.noTags': '暂无 dist-tags。',
    'empty.couldNotLoadTags': '无法加载 tags。',
    
    // 错误
    'error.generic': '错误',
    
    // Toast 消息
    'toast.installing': '正在安装 {skillId}...',
    'toast.installSuccess': '{skillId} 安装成功！',
    'toast.uninstalling': '正在卸载 {skillId}...',
    'toast.uninstallSuccess': '{skillId} 已卸载！',
    'toast.updating': '正在更新 {skillId}...',
    'toast.updateSuccess': '{skillId} 已更新！',
    'toast.updateAll': '正在更新所有技能...',
    'toast.updateAllSuccess': '所有技能已更新！',
    
    // 确认对话框
    'confirm.uninstall': '确定要卸载 {skillId} 吗？',
    'confirm.updateAll': '更新所有已安装的技能？',
    
    // 搜索
    'search.placeholder': '🔍 搜索技能...',
    
    // 分页
    'pagination.page': '第',
    'pagination.of': '页 / 共',
    'pagination.prev': '← 上一页',
    'pagination.next': '下一页 →',
    'pagination.pageInfo': '第 {page} 页 / 共 {totalPages} 页',
    
    // 每页数量
    'pageSize.10': '每页 10 条',
    'pageSize.20': '每页 20 条',
    'pageSize.50': '每页 50 条',
    
    // 状态
    'status.available': '✅ 可用',
    'status.unavailable': '❌ 未检测到',
    'status.skillsInstalled': '已安装 {count} 个技能',
    
    // 详情视图
    'detail.description': '描述',
    'detail.details': '详细信息',
    'detail.id': 'ID',
    'detail.version': '版本',
    'detail.license': '许可证',
    'detail.author': '作者',
    'detail.homepage': '主页',
    'detail.repository': '代码仓库',
    'detail.platforms': '支持平台',
    'detail.versions': '版本记录（最近 {count} 个）',
    'detail.latest': '最新',
    'detail.noDescription': '暂无描述',
    
    // Help 视图
    'help.publishMain': '发布主包',
    'help.publishSkill': '发布独立技能',
    'help.publishLocal': '本地发布',
    'help.githubReleases': 'GitHub → Releases → Create a new release',
    'help.enterTagPublish': '输入 Tag（如 v1.3.11），点击 Publish release',
    'help.actionAutoTrigger': 'Action "Publish to npm" 自动触发 → 构建 → npm publish',
    'help.githubActions': 'GitHub → Actions → Publish Skill → Run workflow',
    'help.enterSkillName': '输入 skill_name（skills/ 下的目录名）和可选 version',
    'help.autoExec': '自动执行：npm install → npm version → npm publish',
    'help.requiresNpmToken': '需要 GitHub Secrets 中配置 NPM_TOKEN',
    'help.envVars': '环境变量配置',
    'help.setEnvVars': '设置以下环境变量可覆盖默认配置：',
    'help.envVar.primaryScope': '主要 npm scope，用于发布/查找 skill',
    'help.envVar.fallbackScope': '回退 scope（兼容旧安装）',
    'help.envVar.scopeList': '搜索时尝试的 scope 列表（逗号分隔）',
    'help.envVar.registryUrl': 'npm registry 地址',
    'help.envVar.personalLink': '个人链接前缀（publish 输出用）',
    'help.commands': '常用命令',
    
    // Admin 视图
    'admin.publishedSkills': '已发布技能',
    'admin.publishedSkillsCount': '已发布技能（{count} 个）',
    'admin.stats.totalSkills': '已发布技能',
    'admin.stats.totalVersions': '总版本数',
    'admin.stats.avgVersions': '平均版本数',
    'admin.stats.withMetadata': '含元数据',
    'admin.stats.totalSize': '总大小',
    'admin.stats.platformsCovered': '覆盖平台',
    
    // Admin Modal
    'admin.deprecate': '废弃',
    'admin.deprecating': '正在废弃 {skillId}...',
    'admin.deprecateTitle': '废弃: {skillId}',
    'admin.deprecateVersion': '版本',
    'admin.deprecateVersionPlaceholder': '（留空表示所有版本）',
    'admin.deprecateMessage': '消息',
    'admin.deprecateDefaultMsg': '此技能已废弃，请使用其他替代方案。',
    'admin.deprecateWarning': '⚠ 废弃操作将在 npm registry 中标记此技能为已废弃。',
    'admin.confirmDeprecate': '确认废弃',
    
    'admin.unpublish': '取消发布',
    'admin.unpublishing': '正在取消发布 {skillId}...',
    'admin.unpublishTitle': '取消发布: {skillId}',
    'admin.unpublishVersion': '版本',
    'admin.unpublishVersionPlaceholder': '（留空表示整个包）',
    'admin.unpublishForce': '强制取消发布整个包（未指定版本时必须勾选）',
    'admin.unpublishDanger': '⚠ 此操作不可撤销！包可在 72 小时内恢复。',
    'admin.confirmUnpublish': '确认取消发布',
    
    'admin.tags': '标签',
    'admin.settingTag': '正在设置标签 {tag}...',
    'admin.removingTag': '正在移除标签 {tag}...',
    'admin.tagsTitle': '标签: {skillId}',
    'admin.currentTags': '当前标签',
    'admin.setTag': '设置标签',
    'admin.removeTag': '移除标签',
    'admin.tagName': '标签名',
    'admin.tagNamePlaceholder': '例如：beta, latest',
    'admin.tagVersion': '版本',
    'admin.tagVersionPlaceholder': '例如：1.0.1',
    'admin.tagNameRemovePlaceholder': '例如：beta',
    'admin.tag.default': '（默认）',
    
    'admin.owners': '维护者',
    'admin.addingOwner': '正在添加维护者 {user}...',
    'admin.removingOwner': '正在移除维护者 {user}...',
    'admin.ownersTitle': '维护者: {skillId}',
    'admin.addOwner': '添加维护者',
    'admin.removeOwner': '移除维护者',
    'admin.npmUser': 'npm 用户名',
    'admin.npmUserPlaceholder': 'npm 用户名',
    'admin.usernameRequired': '用户名不能为空',
    'admin.tagRequired': '标签和版本不能为空',
    'admin.tagNameRequired': '标签名不能为空',
    
    'admin.access': '访问权限',
    'admin.settingAccess': '正在设置访问权限为 {level}...',
    'admin.accessTitle': '访问权限: {skillId}',
    'admin.accessDesc': '设置包的访问级别。公开包对所有人可见。受限包需要认证才能安装。',
    'admin.accessPublic': '公开',
    'admin.accessRestricted': '受限',
    'admin.setAccess': '设置权限',
    
    // 警告
    'warning.fetchErrors': '⚠ {count} 个技能从 npm registry 加载详情失败。刷新重试。',
    
    // 平台状态
    'platform.available': '可用',
    'platform.notDetected': '未检测到',
    
    // 版本
    'version.NA': 'N/A',
    
    // 语言
    'lang.en': 'English',
    'lang.zh': '中文',
    
    // 详细信息中
    'detail.nA': 'N/A',
  }
};
```

---

## 4. 实现步骤

### 4.1 Step 1: 修改 index.html

在 topbar-nav 后添加语言切换 select：

```html
<nav class="topbar-nav">
  <!-- 现有按钮 -->
</nav>
<div class="lang-switch">
  <select id="lang-select">
    <option value="en">EN</option>
    <option value="zh">中</option>
  </select>
</div>
```

### 4.2 Step 2: 修改 app.js

1. 添加 `translations` 对象
2. 添加 `currentLanguage` 状态
3. 添加 `t()` 翻译函数
4. 添加 `detectLanguage()` 语言检测函数
5. 添加 `setLanguage(lang)` 语言切换函数
6. 替换所有硬编码文本为 `t()` 调用

### 4.3 Step 3: 修改 style.css

添加语言切换控件样式：

```css
.lang-switch {
  margin-left: auto;
  display: flex;
  align-items: center;
}

#lang-select {
  padding: 6px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

#lang-select:focus {
  outline: none;
  border-color: var(--accent);
}
```

---

## 5. 需要翻译的文本位置

| 函数/位置 | 文本类型 |
|-----------|----------|
| HTML 静态文本 | 导航按钮、标题等 |
| `loadSkills()` | 加载、错误状态 |
| `loadInstalled()` | 加载、错误状态 |
| `renderSkills()` | 空状态、按钮文本 |
| `createSkillCard()` | 按钮文本 |
| `renderFetchWarning()` | 警告文本 |
| `loadPlatforms()` | 加载、错误状态 |
| `renderPlatforms()` | 空状态、平台状态文本 |
| `loadHelp()` | 加载、错误状态 |
| `renderHelp()` | Help 视图文本 |
| `installSkill()` | Toast 消息 |
| `uninstallSkill()` | Toast 消息、确认对话框 |
| `updateSkill()` | Toast 消息 |
| `updateAllSkills()` | Toast 消息、确认对话框 |
| `showSkillDetail()` | 加载、错误状态、详情视图文本 |
| `loadAdminDashboard()` | 加载、错误状态 |
| `loadAdminStats()` | 加载、错误状态、统计标签 |
| `loadAdminSkills()` | 加载、错误状态、空状态 |
| `showAdminDeprecateModal()` | Modal 文本 |
| `showAdminUnpublishModal()` | Modal 文本 |
| `showAdminTagModal()` | Modal 文本 |
| `showAdminOwnerModal()` | Modal 文本 |
| `showAdminAccessModal()` | Modal 文本 |

---

## 6. 风险与注意事项

### 6.1 HTML 静态文本

HTML 中的静态文本（如导航按钮、标题）需要：
1. 保留原始文本作为 fallback
2. 在 `initializeControls()` 中调用 `applyTranslations()` 进行替换
3. 或直接在渲染时使用翻译

### 6.2 动态文本

动态生成的文本（如 `innerHTML` 赋值）需要直接使用 `t()` 函数。

### 6.3 包含变量的文本

使用 `t(key, { var: value })` 格式，例如：
- `t('toast.installing', { skillId: 'brainstorming' })`

---

**Status**: Design Approved. Ready for implementation.
