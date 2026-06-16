/* =============================================================================
   SkillMarket GUI - 前端逻辑
   ============================================================================= */

// -----------------------------------------------------------------------------
// 全局状态
// -----------------------------------------------------------------------------

const state = {
  currentView: 'skills',
  currentPage: 1,
  pageSize: 20,
  searchQuery: '',
  sortBy: 'name',
  platformFilter: '',
  totalPages: 1,
  previousView: 'skills',
};

// -----------------------------------------------------------------------------
// i18n 国际化系统
// -----------------------------------------------------------------------------

const translations = {
  en: {
    // 导航
    'nav.skills': 'Skills',
    'nav.installed': 'Installed',
    'nav.platforms': 'Platforms',
    'nav.upload': 'Upload',
    'nav.admin': 'Admin',
    'nav.help': 'Help',
    'nav.back': 'Back',
    
    // 视图标题
    'title.availableSkills': 'Available Skills',
    'title.installedSkills': 'Installed Skills',
    'title.platforms': 'Available Platforms',
    'title.help': 'Help & Configuration',
    'title.admin': 'Admin Dashboard',
    
    // 按钮
    'btn.install': 'Install',
    'btn.uninstall': 'Uninstall',
    'btn.update': 'Update',
    'btn.refresh': '🔄 Refresh',
    'btn.updateAll': '🔄 Update All',
    'btn.info': 'Info',
    'btn.confirm': 'Confirm',
    'btn.cancel': 'Cancel',
    
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
    
    // 搜索
    'search.placeholder': '🔍 Search skills...',
    
    // 排序
    'sort.nameAsc': 'Name A-Z',
    'sort.nameDesc': 'Name Z-A',
    'sort.recentlyUpdated': 'Recently Updated',
    'sort.leastUpdated': 'Least Recently Updated',
    
    // 筛选
    'filter.allPlatforms': 'All Platforms',
    
    // 分页
    'pagination.prev': '← Prev',
    'pagination.next': 'Next →',
    'pagination.pageInfo': 'Page {page} of {totalPages}',
    'pagination.goTo': 'Go to',
    'pagination.go': 'Go',
    
    // 每页数量
    'pageSize.10': '10 per page',
    'pageSize.20': '20 per page',
    'pageSize.50': '50 per page',
    
    // 状态
    'status.available': '✅ Available',
    'status.unavailable': '❌ Not detected',
    'status.skillsInstalled': '{count} skills installed',
    
    // Platform 详情
    'platform.id': 'Platform ID',
    'platform.installedSkills': 'Installed Skills ({count})',
    'platform.noSkills': 'No skills installed on this platform.',
    
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
    'detail.nA': 'N/A',
    
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
    
    // 警告
    'warning.fetchErrors': '⚠ {count} skill(s) failed to load details from npm registry. Refresh to retry.',
    
    // Admin 视图
    'admin.publishedSkillsCount': 'Published Skills ({count})',
    'admin.stats.totalSkills': 'Published Skills',
    'admin.stats.totalVersions': 'Total Versions',
    'admin.stats.avgVersions': 'Avg Versions/Skill',
    'admin.stats.withMetadata': 'With Metadata',
    'admin.stats.totalSize': '{value} MB',
    'admin.stats.platformsCovered': 'Platforms Covered',
    
    // Admin Modal - Deprecate
    'admin.deprecating': 'Deprecating {skillId}...',
    'admin.deprecateTitle': 'Deprecate: {skillId}',
    'admin.deprecateVersion': 'Version',
    'admin.deprecateVersionPlaceholder': '(leave empty for all versions)',
    'admin.deprecateMessage': 'Message',
    'admin.deprecateDefaultMsg': 'This skill is deprecated. Please use an alternative.',
    'admin.deprecateWarning': '⚠ Deprecating will mark this skill as deprecated in the npm registry.',
    'admin.confirmDeprecate': 'Confirm Deprecate',
    
    // Admin Modal - Unpublish
    'admin.unpublishing': 'Unpublishing {skillId}...',
    'admin.unpublishTitle': 'Unpublish: {skillId}',
    'admin.unpublishVersion': 'Version',
    'admin.unpublishVersionPlaceholder': '(leave empty for entire package)',
    'admin.unpublishForce': 'Force unpublish entire package (required if no version specified)',
    'admin.unpublishDanger': '⚠ This action cannot be undone! Packages can be restored within 72 hours.',
    'admin.confirmUnpublish': 'Confirm Unpublish',
    
    // Admin Modal - Tags
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
    'admin.tag.default': ' (default)',
    'admin.tagRequired': 'Tag and version are required',
    'admin.tagNameRequired': 'Tag name is required',
    
    // Admin Modal - Owners
    'admin.addingOwner': 'Adding owner {user}...',
    'admin.removingOwner': 'Removing owner {user}...',
    'admin.ownersTitle': 'Owners: {skillId}',
    'admin.addOwner': 'Add Owner',
    'admin.removeOwner': 'Remove Owner',
    'admin.npmUser': 'npm User',
    'admin.npmUserPlaceholder': 'npm username',
    'admin.usernameRequired': 'Username is required',
    
    // Admin Modal - Access
    'admin.settingAccess': 'Setting access to {level}...',
    'admin.accessTitle': 'Access: {skillId}',
    'admin.accessDesc': 'Set the package access level. Public packages are visible to everyone. Restricted packages require authentication to install.',
    'admin.accessPublic': 'Public',
    'admin.accessRestricted': 'Restricted',
    'admin.setAccess': 'Set Access',
    
    // Help 视图
    'help.envVars': 'Environment Variables',
    'help.setEnvVars': 'Set the following environment variables to override defaults:',
    'help.envVar.primaryScope': 'Primary npm scope for publishing/lookup',
    'help.envVar.fallbackScope': 'Fallback scope (backward compatibility)',
    'help.envVar.scopeList': 'Comma-separated list of scopes to search',
    'help.envVar.registryUrl': 'npm registry URL',
    'help.envVar.personalLink': 'Personal link prefix (for publish output)',
    'help.commands': 'Common Commands',
    
    // 语言
    'lang.en': 'EN',
    'lang.zh': '中',
    
    // Upload 视图
    'upload.title': 'Upload Skill',
    'upload.dropzoneText': 'Drop a skill .zip file here, or click to select',
    'upload.dropzoneHint': 'The zip should contain SKILL.md and optionally package.json',
    'upload.chooseFile': 'Choose File',
    'upload.skillNameLabel': 'Skill Name',
    'upload.skillNamePlaceholder': 'Auto-detected from zip, or override here',
    'upload.uploadParse': '📤 Upload & Parse',
    'upload.processing': 'Processing...',
    'upload.parsing': 'Parsing skill archive...',
    'upload.previewTitle': 'Skill Preview',
    'upload.id': 'ID',
    'upload.version': 'Version',
    'upload.description': 'Description',
    'upload.validation': 'Validation',
    'upload.stats': 'Stats',
    'upload.done': '✅ Done',
    'upload.noSkillUploaded': 'No skill uploaded. Please upload first.',
    'upload.platforms': 'Platforms',
    'upload.fileCount': 'Files',
    'upload.hasPackageJson': 'package.json',
    'upload.hasSkillMd': 'SKILL.md',
    'upload.yes': 'Yes',
    'upload.no': 'No',
    'upload.actionPublish': '📦 Publish to npm',
    'upload.actionInstall': '💻 Install Locally',
    'upload.actionBoth': '✅ Both',
    'upload.actionDiscard': '🗑 Discard',
    'upload.publishing': 'Publishing {skillName}...',
    'upload.installing': 'Installing {skillName}...',
    'upload.bothStarted': 'Publishing & installing {skillName}...',
    'upload.publishSuccess': '{skillName} published to npm successfully!',
    'upload.installSuccess': '{skillName} installed locally!',
    'upload.bothSuccess': '{skillName} published & installed!',
    'upload.discarded': 'Upload discarded',
    'upload.errorInvalidZip': 'Invalid or empty zip file',
    'upload.errorNoFile': 'Please select a zip file first',
    'upload.uploadError': 'Upload failed: {error}',
    'upload.actionError': 'Action failed: {error}',

    // 通用错误
    'error.generic': 'Error',

    // GitHub Token
    'token.title': '🔑 GitHub Token',
    'token.desc': 'Used to create GitHub Releases and other operations from the desktop app.',
    'token.checking': 'Checking...',
    'token.active': '✅ Token set ({prefix})',
    'token.inactive': '❌ Token not set',
    'token.checkFailed': '⚠️ Check failed: {error}',
    'token.placeholder': 'Enter GitHub Personal Access Token (ghp_... / gho_...)',
    'token.placeholderOverride': 'Enter new Token to override current value...',
    'token.save': '💾 Save',
    'token.remove': '🗑 Remove',
    'token.hint': 'Token is stored in',
    'token.saved': '✅ GitHub Token saved',
    'token.removed': '✅ GitHub Token removed',
    'token.saveFailed': 'Save failed: {error}',
    'token.removeFailed': 'Remove failed: {error}',
    'token.inputRequired': 'Please enter a GitHub Token',
  },
  
  zh: {
    // 导航
    'nav.skills': '技能',
    'nav.installed': '已安装',
    'nav.platforms': '平台',
    'nav.upload': '上传',
    'nav.admin': '管理',
    'nav.help': '帮助',
    'nav.back': '返回',
    
    // 视图标题
    'title.availableSkills': '可用技能',
    'title.installedSkills': '已安装技能',
    'title.platforms': '可用平台',
    'title.help': '帮助与配置',
    'title.admin': '管理面板',
    
    // 按钮
    'btn.install': '安装',
    'btn.uninstall': '卸载',
    'btn.update': '更新',
    'btn.refresh': '🔄 刷新',
    'btn.updateAll': '🔄 全部更新',
    'btn.info': '详情',
    'btn.confirm': '确认',
    'btn.cancel': '取消',
    
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
    
    // 搜索
    'search.placeholder': '🔍 搜索技能...',
    
    // 排序
    'sort.nameAsc': '名称 A-Z',
    'sort.nameDesc': '名称 Z-A',
    'sort.recentlyUpdated': '最近更新',
    'sort.leastUpdated': '最早更新',
    
    // 筛选
    'filter.allPlatforms': '所有平台',
    
    // 分页
    'pagination.prev': '← 上一页',
    'pagination.next': '下一页 →',
    'pagination.pageInfo': '第 {page} 页 / 共 {totalPages} 页',
    'pagination.goTo': '跳转到',
    'pagination.go': '跳转',
    
    // 每页数量
    'pageSize.10': '每页 10 条',
    'pageSize.20': '每页 20 条',
    'pageSize.50': '每页 50 条',
    
    // 状态
    'status.available': '✅ 可用',
    'status.unavailable': '❌ 未检测到',
    'status.skillsInstalled': '已安装 {count} 个技能',
    
    // Platform 详情
    'platform.id': '平台 ID',
    'platform.installedSkills': '已安装技能（{count} 个）',
    'platform.noSkills': '该平台未安装任何技能',
    
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
    'detail.nA': 'N/A',
    
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
    
    // 警告
    'warning.fetchErrors': '⚠ {count} 个技能从 npm registry 加载详情失败。刷新重试。',
    
    // Admin 视图
    'admin.publishedSkillsCount': '已发布技能（{count} 个）',
    'admin.stats.totalSkills': '已发布技能',
    'admin.stats.totalVersions': '总版本数',
    'admin.stats.avgVersions': '平均版本数',
    'admin.stats.withMetadata': '含元数据',
    'admin.stats.totalSize': '{value} MB',
    'admin.stats.platformsCovered': '覆盖平台',
    
    // Admin Modal - Deprecate
    'admin.deprecating': '正在废弃 {skillId}...',
    'admin.deprecateTitle': '废弃: {skillId}',
    'admin.deprecateVersion': '版本',
    'admin.deprecateVersionPlaceholder': '（留空表示所有版本）',
    'admin.deprecateMessage': '消息',
    'admin.deprecateDefaultMsg': '此技能已废弃，请使用其他替代方案。',
    'admin.deprecateWarning': '⚠ 废弃操作将在 npm registry 中标记此技能为已废弃。',
    'admin.confirmDeprecate': '确认废弃',
    
    // Admin Modal - Unpublish
    'admin.unpublishing': '正在取消发布 {skillId}...',
    'admin.unpublishTitle': '取消发布: {skillId}',
    'admin.unpublishVersion': '版本',
    'admin.unpublishVersionPlaceholder': '（留空表示整个包）',
    'admin.unpublishForce': '强制取消发布整个包（未指定版本时必须勾选）',
    'admin.unpublishDanger': '⚠ 此操作不可撤销！包可在 72 小时内恢复。',
    'admin.confirmUnpublish': '确认取消发布',
    
    // Admin Modal - Tags
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
    'admin.tagRequired': '标签和版本不能为空',
    'admin.tagNameRequired': '标签名不能为空',
    
    // Admin Modal - Owners
    'admin.addingOwner': '正在添加维护者 {user}...',
    'admin.removingOwner': '正在移除维护者 {user}...',
    'admin.ownersTitle': '维护者: {skillId}',
    'admin.addOwner': '添加维护者',
    'admin.removeOwner': '移除维护者',
    'admin.npmUser': 'npm 用户名',
    'admin.npmUserPlaceholder': 'npm 用户名',
    'admin.usernameRequired': '用户名不能为空',
    
    // Admin Modal - Access
    'admin.settingAccess': '正在设置访问权限为 {level}...',
    'admin.accessTitle': '访问权限: {skillId}',
    'admin.accessDesc': '设置包的访问级别。公开包对所有人可见。受限包需要认证才能安装。',
    'admin.accessPublic': '公开',
    'admin.accessRestricted': '受限',
    'admin.setAccess': '设置权限',
    
    // Help 视图
    'help.envVars': '环境变量配置',
    'help.setEnvVars': '设置以下环境变量可覆盖默认配置：',
    'help.envVar.primaryScope': '主要 npm scope，用于发布/查找 skill',
    'help.envVar.fallbackScope': '回退 scope（兼容旧安装）',
    'help.envVar.scopeList': '搜索时尝试的 scope 列表（逗号分隔）',
    'help.envVar.registryUrl': 'npm registry 地址',
    'help.envVar.personalLink': '个人链接前缀（publish 输出用）',
    'help.commands': '常用命令',
    
    // 语言
    'lang.en': 'EN',
    'lang.zh': '中',
    
    // Upload 视图
    'upload.title': '上传 Skill',
    'upload.dropzoneText': '将 skill 的 .zip 文件拖放到此处，或点击选择',
    'upload.dropzoneHint': 'zip 应包含 SKILL.md 和可选的 package.json',
    'upload.chooseFile': '选择文件',
    'upload.skillNameLabel': 'Skill 名称',
    'upload.skillNamePlaceholder': '自动从 zip 中检测，也可手动覆盖',
    'upload.uploadParse': '📤 上传并解析',
    'upload.processing': '处理中...',
    'upload.parsing': '正在解析 skill 压缩包...',
    'upload.previewTitle': 'Skill 预览',
    'upload.id': 'ID',
    'upload.version': '版本',
    'upload.description': '描述',
    'upload.validation': '验证',
    'upload.stats': '统计',
    'upload.done': '✅ 完成',
    'upload.noSkillUploaded': '未上传技能，请先上传。',
    'upload.platforms': '支持平台',
    'upload.fileCount': '文件数',
    'upload.hasPackageJson': 'package.json',
    'upload.hasSkillMd': 'SKILL.md',
    'upload.yes': '是',
    'upload.no': '否',
    'upload.actionPublish': '📦 发布到 npm',
    'upload.actionInstall': '💻 安装到本地',
    'upload.actionBoth': '✅ 两者都做',
    'upload.actionDiscard': '🗑 丢弃',
    'upload.publishing': '正在发布 {skillName}...',
    'upload.installing': '正在安装 {skillName}...',
    'upload.bothStarted': '正在发布并安装 {skillName}...',
    'upload.publishSuccess': '{skillName} 已成功发布到 npm！',
    'upload.installSuccess': '{skillName} 已安装到本地！',
    'upload.bothSuccess': '{skillName} 已发布并安装！',
    'upload.discarded': '上传已丢弃',
    'upload.errorInvalidZip': '无效或空的 zip 文件',
    'upload.errorNoFile': '请先选择一个 zip 文件',
    'upload.uploadError': '上传失败：{error}',
    'upload.actionError': '操作失败：{error}',

    // 通用错误
    'error.generic': '错误',

    // GitHub Token
    'token.title': '🔑 GitHub Token',
    'token.desc': '用于从桌面软件直接创建 GitHub Release 等操作。',
    'token.checking': '检查中...',
    'token.active': '✅ Token 已设置 ({prefix})',
    'token.inactive': '❌ 未设置 Token',
    'token.checkFailed': '⚠️ 检查失败: {error}',
    'token.placeholder': '输入 GitHub Personal Access Token (ghp_... / gho_...)',
    'token.placeholderOverride': '输入新 Token 以覆盖当前值...',
    'token.save': '💾 保存',
    'token.remove': '🗑 移除',
    'token.hint': 'Token 保存在',
    'token.saved': '✅ GitHub Token 已保存',
    'token.removed': '✅ GitHub Token 已移除',
    'token.saveFailed': '保存失败: {error}',
    'token.removeFailed': '移除失败: {error}',
    'token.inputRequired': '请输入 GitHub Token',
  }
};

let currentLanguage = 'en';

// 翻译函数 - 支持变量替换
function t(key, params = {}) {
  let text = translations[currentLanguage]?.[key] || translations['en'][key] || key;
  // 替换变量 {varName}
  Object.keys(params).forEach(k => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
  });
  return text;
}

// 检测语言（localStorage + 浏览器语言）
function detectLanguage() {
  const saved = localStorage.getItem('skm-language');
  if (saved && ['en', 'zh'].includes(saved)) {
    return saved;
  }
  // 浏览器语言检测
  const browserLang = navigator.language || navigator.userLanguage || '';
  return browserLang.startsWith('zh') ? 'zh' : 'en';
}

// 设置语言并重新渲染
function setLanguage(lang) {
  if (!['en', 'zh'].includes(lang)) return;
  currentLanguage = lang;
  localStorage.setItem('skm-language', lang);
  
  // 更新 select 显示
  const langSelect = document.getElementById('lang-select');
  if (langSelect) langSelect.value = lang;
  
  // 更新语言选项显示
  updateLanguageOptions();
  
  // 重新渲染当前视图
  reRenderCurrentView();
}

// 更新语言选项显示（根据当前语言显示选项文本）
function updateLanguageOptions() {
  const langSelect = document.getElementById('lang-select');
  if (!langSelect) return;
  
  langSelect.innerHTML = `
    <option value="en"${currentLanguage === 'en' ? ' selected' : ''}>${t('lang.en')}</option>
    <option value="zh"${currentLanguage === 'zh' ? ' selected' : ''}>${t('lang.zh')}</option>
  `;
}

// 应用翻译到静态 HTML 元素
function applyI18nToStaticElements() {
  // 导航按钮
  const navSkills = document.querySelector('.nav-btn[data-view="skills"]');
  const navInstalled = document.querySelector('.nav-btn[data-view="installed"]');
  const navPlatforms = document.querySelector('.nav-btn[data-view="platforms"]');
  const navUpload = document.querySelector('.nav-btn[data-view="upload"]');
  const navAdmin = document.querySelector('.nav-btn[data-view="admin"]');
  const navHelp = document.querySelector('.nav-btn[data-view="help"]');
  
  if (navSkills) navSkills.innerHTML = `📋 ${t('nav.skills')}`;
  if (navInstalled) navInstalled.innerHTML = `✅ ${t('nav.installed')}`;
  if (navPlatforms) navPlatforms.innerHTML = `💻 ${t('nav.platforms')}`;
  if (navUpload) navUpload.innerHTML = `📤 ${t('nav.upload')}`;
  if (navAdmin) navAdmin.innerHTML = `⚙️ ${t('nav.admin')}`;
  if (navHelp) navHelp.innerHTML = `📖 ${t('nav.help')}`;
  
  // 视图标题
  const titles = [
    { selector: '#view-skills .view-header h2', key: 'title.availableSkills' },
    { selector: '#view-installed .view-header h2', key: 'title.installedSkills' },
    { selector: '#view-platforms .view-header h2', key: 'title.platforms' },
    { selector: '#view-help .view-header h2', key: 'title.help' },
    { selector: '#view-admin .view-header h2', key: 'title.admin' },
    { selector: '#view-upload .view-header h2', key: 'upload.title' },
  ];
  
  titles.forEach(({ selector, key }) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = t(key);
  });
  
  // 搜索框 placeholder
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.placeholder = t('search.placeholder');
  
  // page-size select 选项
  const pageSizeSelect = document.getElementById('page-size');
  if (pageSizeSelect) {
    const currentValue = pageSizeSelect.value;
    pageSizeSelect.innerHTML = `
      <option value="10"${currentValue === '10' ? ' selected' : ''}>${t('pageSize.10')}</option>
      <option value="20"${currentValue === '20' ? ' selected' : ''}>${t('pageSize.20')}</option>
      <option value="50"${currentValue === '50' ? ' selected' : ''}>${t('pageSize.50')}</option>
    `;
  }
  
  // sort-select 排序选项
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    const currentSort = sortSelect.value || state.sortBy;
    sortSelect.innerHTML = `
      <option value="name"${currentSort === 'name' ? ' selected' : ''}>${t('sort.nameAsc')}</option>
      <option value="-name"${currentSort === '-name' ? ' selected' : ''}>${t('sort.nameDesc')}</option>
      <option value="-updated"${currentSort === '-updated' ? ' selected' : ''}>${t('sort.recentlyUpdated')}</option>
      <option value="updated"${currentSort === 'updated' ? ' selected' : ''}>${t('sort.leastUpdated')}</option>
    `;
  }
  
  // platform-filter 默认选项（后续由 updatePlatformFilterOptions 补充完整列表）
  const platformFilter = document.getElementById('platform-filter');
  if (platformFilter && platformFilter.options.length <= 1) {
    const currentFilter = platformFilter.value;
    platformFilter.innerHTML = `
      <option value="">${t('filter.allPlatforms')}</option>
    `;
    if (currentFilter) platformFilter.value = currentFilter;
  }
  
  // 按钮文本
  const refreshSkills = document.getElementById('refresh-skills');
  const refreshAdmin = document.getElementById('refresh-admin');
  const updateAll = document.getElementById('update-all');
  const backBtn = document.querySelector('#view-skill-detail .btn-secondary');
  
  if (refreshSkills) refreshSkills.innerHTML = `🔄 ${t('btn.refresh')}`;
  if (refreshAdmin) refreshAdmin.innerHTML = `🔄 ${t('btn.refresh')}`;
  if (updateAll) updateAll.innerHTML = `🔄 ${t('btn.updateAll')}`;
  if (backBtn) backBtn.innerHTML = `← ${t('nav.back')}`;

  // Upload 视图静态文本
  const uploadDropzoneText = document.getElementById('upload-dropzone-text');
  const uploadDropzoneHint = document.getElementById('upload-dropzone-hint');
  const uploadSelectBtn = document.getElementById('upload-select-btn');
  const uploadSkillNameLabel = document.getElementById('upload-skill-name-label');
  const uploadSkillNameInput = document.getElementById('upload-skill-name');
  const uploadSubmitBtn = document.getElementById('upload-submit-btn');
  const uploadActionPublish = document.getElementById('upload-action-publish');
  const uploadActionInstall = document.getElementById('upload-action-install');
  const uploadActionBoth = document.getElementById('upload-action-both');
  const uploadActionDiscard = document.getElementById('upload-action-discard');
  const uploadProgressText = document.getElementById('upload-progress-text');

  if (uploadDropzoneText) uploadDropzoneText.textContent = t('upload.dropzoneText');
  if (uploadDropzoneHint) uploadDropzoneHint.textContent = t('upload.dropzoneHint');
  if (uploadSelectBtn) uploadSelectBtn.textContent = t('upload.chooseFile');
  if (uploadSkillNameLabel) uploadSkillNameLabel.textContent = t('upload.skillNameLabel');
  if (uploadSkillNameInput) uploadSkillNameInput.placeholder = t('upload.skillNamePlaceholder');
  if (uploadSubmitBtn) uploadSubmitBtn.innerHTML = t('upload.uploadParse');
  if (uploadActionPublish) uploadActionPublish.innerHTML = t('upload.actionPublish');
  if (uploadActionInstall) uploadActionInstall.innerHTML = t('upload.actionInstall');
  if (uploadActionBoth) uploadActionBoth.innerHTML = t('upload.actionBoth');
  if (uploadActionDiscard) uploadActionDiscard.innerHTML = t('upload.actionDiscard');
  if (uploadProgressText) uploadProgressText.textContent = t('upload.processing');

  // GitHub Token 静态文本
  const tokenTitle = document.getElementById('token-section-title');
  const tokenDesc = document.getElementById('token-section-desc');
  const tokenHint = document.getElementById('token-section-hint');
  const tokenSaveBtn = document.getElementById('token-save-btn');
  const tokenRemoveBtn = document.getElementById('token-remove-btn');
  const tokenInput = document.getElementById('token-input');

  if (tokenTitle) tokenTitle.textContent = t('token.title');
  if (tokenDesc) tokenDesc.textContent = t('token.desc');
  if (tokenHint) tokenHint.textContent = t('token.hint');
  if (tokenSaveBtn) tokenSaveBtn.textContent = t('token.save');
  if (tokenRemoveBtn) tokenRemoveBtn.textContent = t('token.remove');
  if (tokenInput && !tokenInput.value) {
    // Only update placeholder when input is empty
    const hasToken = document.getElementById('token-indicator')?.classList.contains('token-active');
    tokenInput.placeholder = hasToken ? t('token.placeholderOverride') : t('token.placeholder');
  }
}

// -----------------------------------------------------------------------------
// 版本号加载
// -----------------------------------------------------------------------------

async function loadVersion() {
  try {
    const response = await fetch('/api/version');
    const data = await response.json();
    const el = document.getElementById('gui-version');
    if (el && data.version) {
      el.textContent = `v${data.version}`;
    }
  } catch {
    // 静默失败，保留 HTML 中的占位符
  }
}

// 重新渲染当前视图
function reRenderCurrentView() {
  // 更新语言选项
  updateLanguageOptions();
  
  // 应用翻译到静态元素
  applyI18nToStaticElements();
  
  switch(state.currentView) {
    case 'skills':
      loadSkills();
      break;
    case 'installed':
      loadInstalled();
      break;
    case 'platforms':
      loadPlatforms();
      break;
    case 'help':
      loadHelp();
      break;
    case 'upload':
      // Upload 视图不需要重新加载
      break;
    case 'admin':
      loadAdminDashboard();
      break;
    case 'skill-detail':
      // 详情视图不需要特殊处理
      break;
  }
}

// -----------------------------------------------------------------------------
// 初始化
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  initializeControls();
  initializeCollapsibleSections();
  initializeUploadControls();
  loadVersion();
  loadSkills();
});

// -----------------------------------------------------------------------------
// 可折叠侧边栏分组
// -----------------------------------------------------------------------------

function initializeCollapsibleSections() {
  // 默认全部展开
}

function toggleSection(header) {
  const group = header.parentElement;
  group.classList.toggle('collapsed');
}

// -----------------------------------------------------------------------------
// 导航切换
// -----------------------------------------------------------------------------

function initializeNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      
      // 更新按钮状态
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // 切换视图
      switchView(view);
    });
  });
}

function switchView(view) {
  // Save previous view (but not when navigating to skill-detail from back)
  if (state.currentView !== 'skill-detail') {
    state.previousView = state.currentView;
  }
  state.currentView = view;
  
  // 隐藏所有视图
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  
  // 显示目标视图
  const targetView = document.getElementById(`view-${view}`);
  if (targetView) {
    targetView.classList.add('active');
  }
  
  // 加载对应数据 (skill-detail / platform-detail 视图的数据由各自函数加载)
  if (view !== 'skill-detail' && view !== 'platform-detail') {
    switch(view) {
      case 'skills':
        loadSkills();
        break;
      case 'installed':
        loadInstalled();
        break;
      case 'platforms':
        loadPlatforms();
        break;
      case 'help':
        loadHelp();
        break;
      case 'upload':
        resetUploadView();
        break;
      case 'admin':
        loadAdminDashboard();
        break;
    }
  }
}

// -----------------------------------------------------------------------------
// 控件初始化
// -----------------------------------------------------------------------------

function initializeControls() {
  // 搜索
  const searchInput = document.getElementById('search-input');
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchQuery = searchInput.value;
      state.currentPage = 1;
      loadSkills();
    }, 300);
  });
  
  // 分页大小
  const pageSizeSelect = document.getElementById('page-size');
  pageSizeSelect.addEventListener('change', () => {
    state.pageSize = parseInt(pageSizeSelect.value);
    state.currentPage = 1;
    loadSkills();
  });
  
  // 排序
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sortBy = sortSelect.value;
      state.currentPage = 1;
      loadSkills();
    });
  }

  // 平台分类过滤
  const platformFilter = document.getElementById('platform-filter');
  if (platformFilter) {
    platformFilter.addEventListener('change', () => {
      state.platformFilter = platformFilter.value;
      state.currentPage = 1;
      loadSkills();
    });
  }

  // 刷新按钮
  document.getElementById('refresh-skills').addEventListener('click', () => loadSkills());
  document.getElementById('update-all').addEventListener('click', updateAllSkills);
  const refreshAdmin = document.getElementById('refresh-admin');
  if (refreshAdmin) refreshAdmin.addEventListener('click', () => loadAdminDashboard());
  
   // Admin 模态框 - 点击外部关闭
   const modalEl = document.getElementById('modal');
   if (modalEl) {
     modalEl.addEventListener('click', (e) => {
       if (e.target === modalEl) closeModal();
     });
   }

   // GitHub Token 管理
   const tokenSaveBtn = document.getElementById('token-save-btn');
   const tokenRemoveBtn = document.getElementById('token-remove-btn');
   const tokenInput = document.getElementById('token-input');

   if (tokenSaveBtn) {
     tokenSaveBtn.addEventListener('click', saveGithubToken);
   }
   if (tokenRemoveBtn) {
     tokenRemoveBtn.addEventListener('click', removeGithubToken);
   }
   if (tokenInput) {
     tokenInput.addEventListener('keydown', (e) => {
       if (e.key === 'Enter') saveGithubToken();
     });
   }

   // 语言切换
   const langSelect = document.getElementById('lang-select');
   if (langSelect) {
     // 初始化当前语言
     currentLanguage = detectLanguage();
     langSelect.value = currentLanguage;
     updateLanguageOptions();
     
     // 应用翻译到静态元素
     applyI18nToStaticElements();

     langSelect.addEventListener('change', () => {
       setLanguage(langSelect.value);
     });
   }
 }

// -----------------------------------------------------------------------------
// Skills 列表
// -----------------------------------------------------------------------------

async function loadSkills() {
  const container = document.getElementById('skills-list');
  container.innerHTML = `<div class="loading">${t('loading.skills')}</div>`;

  try {
    const params = new URLSearchParams({
      page: state.currentPage.toString(),
      limit: state.pageSize.toString(),
      sort: state.sortBy,
    });

    if (state.searchQuery) {
      params.append('search', state.searchQuery);
    }
    if (state.platformFilter) {
      params.append('platform', state.platformFilter);
    }

    const response = await fetch(`/api/skills?${params}`);
    const data = await response.json();

    if (data.error) {
      container.innerHTML = `<div class="loading">${t('error.generic')}: ${data.error}</div>`;
      return;
    }

    renderSkills(data.skills || data, container);
    renderPagination(data.page, data.totalPages || 1);
    renderFetchWarning(data.fetchErrors);
    updatePlatformFilterOptions(data.skills || []);
  } catch (err) {
    container.innerHTML = `<div class="loading">${t('error.generic')}: ${err.message}</div>`;
  }
}

async function loadInstalled() {
  const container = document.getElementById('installed-list');
  container.innerHTML = `<div class="loading">${t('loading.generic')}</div>`;

  try {
    const response = await fetch('/api/installed');
    const skills = await response.json();

    if (skills.error) {
      container.innerHTML = `<div class="loading">${t('error.generic')}: ${skills.error}</div>`;
      return;
    }

    renderSkills(skills, container, true);
  } catch (err) {
    container.innerHTML = `<div class="loading">${t('error.generic')}: ${err.message}</div>`;
  }
}

function renderSkills(skills, container, isInstalled = false) {
  if (!skills || skills.length === 0) {
    container.innerHTML = `<div class="loading">${t('empty.noSkills')}</div>`;
    return;
  }

  container.innerHTML = skills.map(skill => createSkillCard(skill, isInstalled)).join('');
}

function createSkillCard(skill, isInstalled) {
  const platforms = skill.platforms || [];
  const platformTags = platforms.map(p => `<span class="platform-tag">${p}</span>`).join('');

  return `
    <div class="skill-card" onclick="showSkillDetail('${skill.id}')">
      <h3>${skill.displayName || skill.id}</h3>
      <div class="skill-id">${skill.id}@${skill.version || 'latest'}</div>
      <p>${skill.description || t('detail.noDescription')}</p>
      <div class="platforms">${platformTags}</div>
      <div class="actions">
        ${isInstalled ? `
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); uninstallSkill('${skill.id}')">${t('btn.uninstall')}</button>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); updateSkill('${skill.id}')">${t('btn.update')}</button>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); showSkillDetail('${skill.id}')">${t('btn.info')}</button>
        ` : `
          <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); installSkill('${skill.id}')">${t('btn.install')}</button>
        `}
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// 网络错误提示
// -----------------------------------------------------------------------------

function renderFetchWarning(fetchErrors) {
  const existing = document.getElementById('fetch-warning');
  if (existing) existing.remove();

  if (!fetchErrors || fetchErrors === 0) return;

  const warning = document.createElement('div');
  warning.id = 'fetch-warning';
  warning.style.cssText = 'background: #664400; color: #ffcc00; padding: 8px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 0.9rem;';
  warning.textContent = t('warning.fetchErrors', { count: fetchErrors });
  document.querySelector('.view-header').after(warning);
}

// -----------------------------------------------------------------------------
// 分页
// -----------------------------------------------------------------------------

/** 收集所有可用平台，更新分类过滤下拉框 */
function updatePlatformFilterOptions(skills) {
  const select = document.getElementById('platform-filter');
  if (!select) return;

  // 收集所有唯一的平台名
  const allPlatforms = new Set();
  (skills || []).forEach(s => {
    if (Array.isArray(s.platforms)) {
      s.platforms.forEach(p => allPlatforms.add(p));
    }
  });

  const currentVal = select.value;
  const sortedPlatforms = [...allPlatforms].sort();

  // 当平台列表或当前语言变化时才重新渲染
  const currentOptions = Array.from(select.options).slice(1).map(o => o.value).sort().join(',');
  const newOptions = sortedPlatforms.join(',');
  const currentAllText = select.options[0]?.textContent || '';
  if (currentOptions === newOptions && currentAllText === t('filter.allPlatforms')) return;

  select.innerHTML = `
    <option value="">${t('filter.allPlatforms')}</option>
    ${sortedPlatforms.map(p => `<option value="${p}"${currentVal === p ? ' selected' : ''}>${p}</option>`).join('')}
  `;
  select.value = currentVal && allPlatforms.has(currentVal) ? currentVal : '';
}

function renderPagination(currentPage, totalPages) {
  state.currentPage = currentPage;
  state.totalPages = totalPages;

  const container = document.getElementById('pagination');

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <button ${currentPage <= 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">${t('pagination.prev')}</button>
    <span class="page-info">${t('pagination.pageInfo', { page: currentPage, totalPages: totalPages })}</span>
    <span class="page-jump">
      <label>${t('pagination.goTo')}</label>
      <input type="number" id="page-jump-input" min="1" max="${totalPages}" value="${currentPage}"
        onkeydown="if(event.key==='Enter')jumpToPage()">
      <button onclick="jumpToPage()">${t('pagination.go')}</button>
    </span>
    <button ${currentPage >= totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">${t('pagination.next')}</button>
  `;

  container.innerHTML = html;
}

function changePage(page) {
  if (page < 1 || page > state.totalPages) return;
  state.currentPage = page;
  loadSkills();
}

function jumpToPage() {
  const input = document.getElementById('page-jump-input');
  if (!input) return;
  const page = parseInt(input.value);
  if (isNaN(page) || page < 1 || page > state.totalPages) {
    input.value = state.currentPage;
    return;
  }
  changePage(page);
}

// -----------------------------------------------------------------------------
// Platforms
// -----------------------------------------------------------------------------

async function loadPlatforms() {
  const container = document.getElementById('platforms-list');
  container.innerHTML = `<div class="loading">${t('loading.platforms')}</div>`;

  try {
    const response = await fetch('/api/platforms');
    const platforms = await response.json();

    if (platforms.error) {
      container.innerHTML = `<div class="loading">${t('error.generic')}: ${platforms.error}</div>`;
      return;
    }

    renderPlatforms(platforms, container);
  } catch (err) {
    container.innerHTML = `<div class="loading">${t('error.generic')}: ${err.message}</div>`;
  }
}

function renderPlatforms(platforms, container) {
  if (!platforms || platforms.length === 0) {
    container.innerHTML = `<div class="loading">${t('empty.noPlatforms')}</div>`;
    return;
  }

  container.innerHTML = platforms.map(platform => `
    <div class="platform-card" onclick="showPlatformDetail('${platform.id}')" style="cursor: pointer;">
      <div>
        <h3>${platform.name}</h3>
        <div class="status ${platform.available ? 'status-available' : 'status-unavailable'}">
          ${platform.available ? t('status.available') : t('status.unavailable')}
        </div>
      </div>
      <div>
        ${platform.installedCount ? `<span>${t('status.skillsInstalled', { count: platform.installedCount })}</span>` : `<span style="color: var(--text-muted); font-size: 0.85rem;">${t('status.skillsInstalled', { count: 0 })}</span>`}
      </div>
    </div>
  `).join('');
}

// -----------------------------------------------------------------------------
// Platform 详情视图
// -----------------------------------------------------------------------------

async function showPlatformDetail(platformId) {
  const content = document.getElementById('platform-detail-content');
  content.innerHTML = `<div class="loading">${t('loading.generic')}</div>`;

  state.previousView = state.currentView;
  state.currentView = 'platform-detail';

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const targetView = document.getElementById('view-platform-detail');
  if (targetView) targetView.classList.add('active');

  try {
    const response = await fetch(`/api/platform-info?id=${encodeURIComponent(platformId)}`);
    const platform = await response.json();

    if (platform.error) {
      content.innerHTML = `<div class="loading">${t('error.generic')}: ${platform.error}</div>`;
      return;
    }

    const skills = platform.installedSkills || [];

    content.innerHTML = `
      <div class="platform-detail">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h2 style="color: var(--accent); font-size: 1.5rem; margin: 0;">${platform.name}</h2>
            <span class="status ${platform.available ? 'status-available' : 'status-unavailable'}">
              ${platform.available ? t('status.available') : t('status.unavailable')}
            </span>
            <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 12px;">
              ${t('status.skillsInstalled', { count: platform.installedCount })}
            </span>
          </div>
        </div>
        <div class="admin-skill-row" style="background: var(--bg-card); padding: 10px 16px; margin-bottom: 12px;">
          <span style="color: var(--text-muted); font-size: 0.85rem;">${t('platform.id')}</span>
          <span style="color: var(--text-secondary); font-size: 0.9rem; font-family: monospace;">${platform.id}</span>
        </div>
        <h3 style="color: var(--text-secondary); margin-bottom: 10px; font-size: 1rem;">
          ${t('platform.installedSkills', { count: skills.length })}
        </h3>
        ${skills.length === 0 ? `<div class="loading" style="padding: 20px;">${t('platform.noSkills')}</div>` : `
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${skills.map((skill, i) => `
              <div class="admin-skill-row" style="cursor: pointer;" onclick="showSkillDetail('${skill.id}')">
                <div class="admin-skill-info">
                  <h4>${skill.displayName || skill.id}</h4>
                  <div class="admin-skill-meta">${skill.id}@${skill.version || 'latest'}</div>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); showSkillDetail('${skill.id}')">${t('btn.info')}</button>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="loading">${t('error.generic')}: ${err.message}</div>`;
  }
}

function goBackFromPlatformDetail() {
  const target = state.previousView || 'platforms';
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === target);
  });
  switchView(target);
}

// -----------------------------------------------------------------------------
// Help 视图
// -----------------------------------------------------------------------------

async function loadHelp() {
  const container = document.getElementById('help-content');
  container.innerHTML = `<div class="loading">${t('loading.generic')}</div>`;

  try {
    const [config] = await Promise.all([
      fetch('/api/config').then(r => r.json()),
      checkGithubToken(),
    ]);
    renderHelp(config, container);
  } catch (err) {
    container.innerHTML = `<div class="loading">Error: ${err.message}</div>`;
  }
}

function renderHelp(config, container) {
  const envVars = [
    { var: 'SKM_NPM_SCOPE', default: config.npmScope, desc: t('help.envVar.primaryScope') },
    { var: 'SKM_NPM_SCOPE_FALLBACK', default: config.npmScopeFallback, desc: t('help.envVar.fallbackScope') },
    { var: 'SKM_NPM_SCOPES', default: config.skillScopes.join(', '), desc: t('help.envVar.scopeList') },
    { var: 'SKM_NPM_REGISTRY', default: config.npmRegistry, desc: t('help.envVar.registryUrl') },
    { var: 'SKM_URL', default: config.skmUrl, desc: t('help.envVar.personalLink') },
  ];

  container.innerHTML = `
    <div class="help-section">
      <h3>📖 GitHub Actions — Publish Skill</h3>
      <p>在 GitHub 仓库页面操作：</p>
      <div class="help-steps">
        <div class="help-step">
          <strong>发布主包（SkillMarket CLI）</strong>
          <ol>
            <li>GitHub → <strong>Releases</strong> → Create a new release</li>
            <li>输入 Tag (如 v1.3.11)，点击 Publish release</li>
            <li>Action <code>Publish to npm</code> 自动触发 → 构建 → npm publish</li>
          </ol>
        </div>
        <div class="help-step">
          <strong>发布独立 Skill</strong>
          <ol>
            <li>GitHub → <strong>Actions</strong> → Publish Skill → Run workflow</li>
            <li>输入 <code>skill_name</code>（skills/ 下的目录名）和可选 <code>version</code></li>
            <li>自动执行：npm install → npm version → npm publish</li>
          </ol>
          <p class="help-note">⚠ 需要 GitHub Secrets 中配置 <code>NPM_TOKEN</code></p>
        </div>
        <div class="help-step">
          <strong>本地发布</strong>
          <pre>skm publish &lt;skill-name&gt;
skm publish &lt;skill-name&gt; --version 1.0.1</pre>
        </div>
      </div>
    </div>

    <div class="help-section">
      <h3>⚙️ 配置管理</h3>
      <p>使用 <code>skm config</code> 命令可查看和修改配置（持久化到 <code>~/.skillmarket/config.json</code>）：</p>
      <pre>skm config                    # 查看所有配置
skm config get &lt;key&gt;          # 查看指定配置
skm config set &lt;key&gt; &lt;value&gt;  # 设置配置值
skm config reset &lt;key&gt;        # 恢复默认值
skm config reset --all         # 全部恢复默认</pre>
      <p class="help-note">⚠ 环境变量优先级高于配置文件。如需环境变量生效，unset 后可重开终端。</p>
    </div>

    <div class="help-section">
      <h3>⚙️ 环境变量配置</h3>
      <p>设置以下环境变量可覆盖配置文件和默认值（最高优先级）：</p>
      <table class="help-table">
        <thead>
          <tr><th>变量</th><th>当前值</th><th>说明</th></tr>
        </thead>
        <tbody>
          ${envVars.map(v => `
            <tr>
              <td><code>${v.var}</code></td>
              <td><code>${v.default}</code></td>
              <td>${v.desc}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="help-section">
      <h3>🔧 常用命令</h3>
      <table class="help-table">
        <thead><tr><th>命令</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td><code>skm ls</code></td><td>列出可用 skills</td></tr>
          <tr><td><code>skm ls --installed</code></td><td>列出已安装 skills</td></tr>
          <tr><td><code>skm search &lt;keyword&gt;</code></td><td>搜索 skills</td></tr>
          <tr><td><code>skm info &lt;skill&gt;</code></td><td>查看 skill 详情</td></tr>
          <tr><td><code>skm install &lt;skill&gt;</code></td><td>安装 skill 到所有平台</td></tr>
          <tr><td><code>skm install &lt;skill&gt;@&lt;ver&gt;</code></td><td>安装指定版本</td></tr>
          <tr><td><code>skm install &lt;skill&gt; --platform opencode</code></td><td>安装到指定平台</td></tr>
          <tr><td><code>skm install &lt;skill&gt; --force</code></td><td>强制覆盖安装</td></tr>
          <tr><td><code>skm install owner/repo</code></td><td>从 GitHub 安装</td></tr>
          <tr><td><code>skm uninstall &lt;skill&gt;</code></td><td>卸载 skill</td></tr>
          <tr><td><code>skm uninstall --all</code></td><td>卸载所有 skills</td></tr>
          <tr><td><code>skm update [skill]</code></td><td>更新 skill（不指定则更新全部）</td></tr>
          <tr><td><code>skm update --all</code></td><td>更新所有 skills</td></tr>
          <tr><td><code>skm publish &lt;skill&gt;</code></td><td>发布 skill 到 npm</td></tr>
          <tr><td><code>skm verify &lt;skill&gt;</code></td><td>验证 skill 完整性</td></tr>
          <tr><td><code>skm platforms</code></td><td>查看可用平台</td></tr>
          <tr><td><code>skm sync</code></td><td>同步平台链接</td></tr>
          <tr><td><code>skm sync &lt;skill&gt;</code></td><td>同步指定 skill 到最新</td></tr>
          <tr><td><code>skm gui</code></td><td>启动图形界面</td></tr>
          <tr><td><code>skm gui 18790</code></td><td>指定端口启动 GUI</td></tr>
          <tr><td><code>skm config</code></td><td>查看所有配置项</td></tr>
          <tr><td><code>skm config get &lt;key&gt;</code></td><td>查看指定配置</td></tr>
          <tr><td><code>skm config set &lt;key&gt; &lt;value&gt;</code></td><td>设置配置值</td></tr>
          <tr><td><code>skm config reset [key]</code></td><td>恢复配置为默认值</td></tr>
          <tr><td><code>skm admin ls</code></td><td>列出所有已发布 skills</td></tr>
          <tr><td><code>skm admin info &lt;skill&gt;</code></td><td>查看已发布 skill 详情</td></tr>
          <tr><td><code>skm admin deprecate &lt;skill&gt;</code></td><td>废弃 skill</td></tr>
          <tr><td><code>skm admin unpublish &lt;skill&gt;</code></td><td>取消发布 skill</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// GitHub Token 管理
// -----------------------------------------------------------------------------

async function checkGithubToken() {
  try {
    const response = await fetch('/api/github-token');
    const data = await response.json();

    const indicator = document.getElementById('token-indicator');
    const statusText = document.getElementById('token-status-text');
    const tokenInput = document.getElementById('token-input');
    const removeBtn = document.getElementById('token-remove-btn');

    if (data.hasToken) {
      indicator.className = 'token-indicator token-active';
      statusText.textContent = t('token.active', { prefix: data.tokenPrefix });
      if (removeBtn) removeBtn.style.display = '';
      if (tokenInput) tokenInput.placeholder = t('token.placeholderOverride');
      // Re-apply i18n for button texts
      const saveBtn = document.getElementById('token-save-btn');
      const rmBtn = document.getElementById('token-remove-btn');
      if (saveBtn) saveBtn.textContent = t('token.save');
      if (rmBtn) rmBtn.textContent = t('token.remove');
    } else {
      indicator.className = 'token-indicator token-none';
      statusText.textContent = t('token.inactive');
      if (removeBtn) removeBtn.style.display = 'none';
      if (tokenInput) tokenInput.placeholder = t('token.placeholder');
    }
  } catch (err) {
    const statusText = document.getElementById('token-status-text');
    if (statusText) statusText.textContent = t('token.checkFailed', { error: err.message });
  }
}

async function saveGithubToken() {
  const input = document.getElementById('token-input');
  const token = input ? input.value.trim() : '';

  if (!token) {
    showToast(t('token.inputRequired'), 'error');
    return;
  }

  try {
    const response = await fetch('/api/github-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(t('token.saveFailed', { error: result.error }), 'error');
    } else {
      showToast(t('token.saved'), 'success');
      input.value = '';
      checkGithubToken();
    }
  } catch (err) {
    showToast(t('token.saveFailed', { error: err.message }), 'error');
  }
}

async function removeGithubToken() {
  try {
    const response = await fetch('/api/github-token', {
      method: 'DELETE',
    });
    const result = await response.json();
    if (result.error) {
      showToast(t('token.removeFailed', { error: result.error }), 'error');
    } else {
      showToast(t('token.removed'), 'success');
      checkGithubToken();
    }
  } catch (err) {
    showToast(t('token.removeFailed', { error: err.message }), 'error');
  }
}

async function installSkill(skillId) {
  try {
    showToast(t('toast.installing', { skillId: skillId }), 'info');
    const response = await fetch('/api/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId })
    });

    const result = await response.json();

    if (result.error) {
      showToast(`${t('error.generic')}: ${result.error}`, 'error');
    } else {
      showToast(t('toast.installSuccess', { skillId: skillId }), 'success');
      if (state.currentView === 'installed') loadInstalled();
    }
  } catch (err) {
    showToast(`${t('error.generic')}: ${err.message}`, 'error');
  }
}

async function uninstallSkill(skillId) {
  if (!confirm(t('confirm.uninstall', { skillId: skillId }))) return;

  try {
    showToast(t('toast.uninstalling', { skillId: skillId }), 'info');
    const response = await fetch('/api/uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId })
    });

    const result = await response.json();

    if (result.error) {
      showToast(`${t('error.generic')}: ${result.error}`, 'error');
    } else {
      showToast(t('toast.uninstallSuccess', { skillId: skillId }), 'success');
      loadInstalled();
    }
  } catch (err) {
    showToast(`${t('error.generic')}: ${err.message}`, 'error');
  }
}

async function updateSkill(skillId) {
  try {
    showToast(t('toast.updating', { skillId: skillId }), 'info');
    const response = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId })
    });

    const result = await response.json();

    if (result.error) {
      showToast(`${t('error.generic')}: ${result.error}`, 'error');
    } else {
      showToast(t('toast.updateSuccess', { skillId: skillId }), 'success');
      if (state.currentView === 'installed') loadInstalled();
    }
  } catch (err) {
    showToast(`${t('error.generic')}: ${err.message}`, 'error');
  }
}

async function updateAllSkills() {
  if (!confirm(t('confirm.updateAll'))) return;
  
  try {
    showToast(t('toast.updateAll'), 'info');
    const response = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const result = await response.json();
    
    if (result.error) {
      showToast(`${t('error.generic')}: ${result.error}`, 'error');
    } else {
      showToast(t('toast.updateAllSuccess'), 'success');
      loadInstalled();
    }
  } catch (err) {
    showToast(`${t('error.generic')}: ${err.message}`, 'error');
  }
}

// -----------------------------------------------------------------------------
// Skill 详情视图 (替换旧模态框)
// -----------------------------------------------------------------------------

async function showSkillDetail(skillId) {
  const content = document.getElementById('skill-detail-content');
  content.innerHTML = `<div class="loading">${t('loading.details')}</div>`;
  
  // 切换到详情视图
  const btn = document.querySelector(`.nav-btn[data-view="skill-detail"]`);
  // skill-detail 没有 nav-btn，直接用 switchView
  state.previousView = state.currentView;
  state.currentView = 'skill-detail';
  
  // 隐藏所有视图，显示详情视图
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const targetView = document.getElementById('view-skill-detail');
  if (targetView) targetView.classList.add('active');
  
  try {
    const response = await fetch(`/api/skill-info?skill=${encodeURIComponent(skillId)}`);
    const data = await response.json();
    
    if (data.error) {
      content.innerHTML = `<div class="loading">${t('error.generic')}: ${data.error}</div>`;
      return;
    }
    
    const platforms = data.platforms || [];
    const versions = data.versions || [];
    const escapedId = data.id.replace(/'/g, "\\'");
    
    content.innerHTML = `
      <div class="skill-detail">
        <h2>${data.displayName || data.id}</h2>
        <div class="detail-name">${data.name}@${data.version}</div>
        
        <div class="detail-section">
          <h3>${t('detail.description')}</h3>
          <div class="description-text">${data.description || t('detail.noDescription')}</div>
        </div>
        
        <div class="detail-section">
          <h3>${t('detail.details')}</h3>
          <div class="detail-row"><strong>${t('detail.id')}:</strong> ${data.id}</div>
          <div class="detail-row"><strong>${t('detail.version')}:</strong> ${data.version}</div>
          ${data.license ? `<div class="detail-row"><strong>${t('detail.license')}:</strong> ${data.license}</div>` : ''}
          ${data.author ? `<div class="detail-row"><strong>${t('detail.author')}:</strong> ${data.author}</div>` : ''}
          ${data.homepage ? `<div class="detail-row"><strong>${t('detail.homepage')}:</strong> <a href="${data.homepage}" target="_blank">${data.homepage}</a></div>` : ''}
          ${data.repository ? `<div class="detail-row"><strong>${t('detail.repository')}:</strong> <a href="${data.repository}" target="_blank">${data.repository}</a></div>` : ''}
        </div>
        
        <div class="detail-section">
          <h3>${t('detail.platforms')}</h3>
          <div class="platform-tags">
            ${platforms.length ? platforms.map(p => `<span class="platform-tag">${p}</span>`).join('') : `<span class="platform-tag">${t('detail.nA')}</span>`}
          </div>
        </div>
        
        ${versions.length ? `
        <div class="detail-section">
          <h3>${t('detail.versions', { count: versions.length })}</h3>
          <div class="version-list">
            ${versions.slice().reverse().map(v => `
              <div class="version-item">
                <span>${v} ${v === data.version ? `<span class="version-latest">${t('detail.latest')}</span>` : ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="detail-actions">
          <button class="btn btn-success" onclick="installSkill('${escapedId}')">${t('btn.install')}</button>
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="loading">${t('error.generic')}: ${err.message}</div>`;
  }
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function goBack() {
  const target = state.previousView || 'skills';
  // 更新导航按钮状态
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === target);
  });
  switchView(target);
}

// -----------------------------------------------------------------------------
// Toast 通知
// -----------------------------------------------------------------------------

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// -----------------------------------------------------------------------------
// Admin Dashboard
// -----------------------------------------------------------------------------

async function loadAdminDashboard() {
  await Promise.all([loadAdminStats(), loadAdminSkills()]);
}

async function loadAdminStats() {
  const container = document.getElementById('admin-stats');
  container.innerHTML = `<div class="loading">${t('loading.stats')}</div>`;

  try {
    const response = await fetch('/api/admin/stats');
    const data = await response.json();

    if (data.error) {
      container.innerHTML = `<div class="loading">${t('error.generic')}: ${data.error}</div>`;
      return;
    }

    const cards = [
      { value: data.totalSkills, label: t('admin.stats.totalSkills') },
      { value: data.totalVersions, label: t('admin.stats.totalVersions') },
      { value: data.averageVersions, label: t('admin.stats.avgVersions') },
      { value: data.withMetadata, label: t('admin.stats.withMetadata') },
      { value: t('admin.stats.totalSize', { value: data.totalSizeMB }), label: t('admin.stats.totalSize', { value: '' }).replace(': ', '') },
      { value: data.platformCount, label: t('admin.stats.platformsCovered') },
    ];

    container.innerHTML = cards.map(c => `
      <div class="admin-stat-card">
        <div class="admin-stat-value">${c.value}</div>
        <div class="admin-stat-label">${c.label}</div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="loading">${t('error.generic')}: ${err.message}</div>`;
  }
}

async function loadAdminSkills() {
  const container = document.getElementById('admin-skills-list');
  container.innerHTML = `<div class="loading">${t('loading.published')}</div>`;

  try {
    const params = new URLSearchParams({ limit: '100' });
    const response = await fetch(`/api/skills?${params}`);
    const data = await response.json();

    if (data.error) {
      container.innerHTML = `<div class="loading">${t('error.generic')}: ${data.error}</div>`;
      return;
    }

    const skills = data.skills || [];
    renderAdminSkills(skills, container);
  } catch (err) {
    container.innerHTML = `<div class="loading">${t('error.generic')}: ${err.message}</div>`;
  }
}

function renderAdminSkills(skills, container) {
  if (!skills || skills.length === 0) {
    container.innerHTML = `<div class="loading">${t('empty.noPublishedSkills')}</div>`;
    return;
  }

  container.innerHTML = `
    <h3 style="color: var(--text-secondary); margin-bottom: 12px; font-size: 1rem;">${t('admin.publishedSkillsCount', { count: skills.length })}</h3>
    ${skills.map(skill => {
      const id = skill.id || skill.name;
      const desc = (skill.description || '').slice(0, 80);
      return `
        <div class="admin-skill-row">
          <div class="admin-skill-info">
            <h4>${skill.displayName || id}</h4>
            <div class="admin-skill-meta">${id}@${skill.version || 'latest'} ${skill.platforms && skill.platforms.length ? '— ' + skill.platforms.join(', ') : ''}</div>
            ${desc ? `<div class="admin-skill-desc">${desc}</div>` : ''}
          </div>
          <div class="admin-actions">
            <button class="admin-btn admin-btn-deprecate" onclick="showAdminDeprecateModal('${id}')">${t('admin.deprecateTitle', { skillId: '' }).replace(': ', '')}</button>
            <button class="admin-btn admin-btn-unpublish" onclick="showAdminUnpublishModal('${id}')">${t('admin.unpublishTitle', { skillId: '' }).replace(': ', '')}</button>
            <button class="admin-btn admin-btn-tag" onclick="showAdminTagModal('${id}')">${t('admin.tagsTitle', { skillId: '' }).replace(': ', '')}</button>
            <button class="admin-btn admin-btn-owner" onclick="showAdminOwnerModal('${id}')">${t('admin.ownersTitle', { skillId: '' }).replace(': ', '')}</button>
            <button class="admin-btn admin-btn-access" onclick="showAdminAccessModal('${id}')">${t('admin.accessTitle', { skillId: '' }).replace(': ', '')}</button>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

// -----------------------------------------------------------------------------
// Admin Action Modals
// -----------------------------------------------------------------------------

function showAdminDeprecateModal(skillId) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h2>${t('admin.deprecateTitle', { skillId: skillId })}</h2>
    <div class="admin-modal-section">
      <div class="admin-input-group">
        <label>${t('admin.deprecateVersion')}</label>
        <input type="text" id="deprecate-version" placeholder="${t('admin.deprecateVersionPlaceholder')}">
      </div>
      <div class="admin-input-group">
        <label>${t('admin.deprecateMessage')}</label>
        <input type="text" id="deprecate-msg" value="${t('admin.deprecateDefaultMsg')}">
      </div>
      <p class="admin-warning-text">${t('admin.deprecateWarning')}</p>
    </div>
    <div class="actions">
      <button class="btn btn-danger" onclick="execAdminDeprecate('${skillId}')">${t('admin.confirmDeprecate')}</button>
      <button class="btn btn-secondary" onclick="closeModal()">${t('btn.cancel')}</button>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function execAdminDeprecate(skillId) {
  const version = document.getElementById('deprecate-version').value;
  const message = document.getElementById('deprecate-msg').value;

  try {
    showToast(t('admin.deprecating', { skillId: skillId }), 'info');
    const response = await fetch('/api/admin/deprecate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, version, message }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`${t('error.generic')}: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      closeModal();
      loadAdminDashboard();
    }
  } catch (err) {
    showToast(`${t('error.generic')}: ${err.message}`, 'error');
  }
}

function showAdminUnpublishModal(skillId) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h2>${t('admin.unpublishTitle', { skillId: skillId })}</h2>
    <div class="admin-modal-section">
      <div class="admin-input-group">
        <label>${t('admin.unpublishVersion')}</label>
        <input type="text" id="unpublish-version" placeholder="${t('admin.unpublishVersionPlaceholder')}">
      </div>
      <div class="admin-checkbox-group">
        <input type="checkbox" id="unpublish-force">
        <label for="unpublish-force">${t('admin.unpublishForce')}</label>
      </div>
      <p class="admin-danger-text">${t('admin.unpublishDanger')}</p>
    </div>
    <div class="actions">
      <button class="btn btn-danger" onclick="execAdminUnpublish('${skillId}')">${t('admin.confirmUnpublish')}</button>
      <button class="btn btn-secondary" onclick="closeModal()">${t('btn.cancel')}</button>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function execAdminUnpublish(skillId) {
  const version = document.getElementById('unpublish-version').value;
  const force = document.getElementById('unpublish-force').checked;

  try {
    showToast(t('admin.unpublishing', { skillId: skillId }), 'info');
    const response = await fetch('/api/admin/unpublish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, version, force }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`${t('error.generic')}: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      closeModal();
      loadAdminDashboard();
    }
  } catch (err) {
    showToast(`${t('error.generic')}: ${err.message}`, 'error');
  }
}

function showAdminTagModal(skillId) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h2>${t('admin.tagsTitle', { skillId: skillId })}</h2>
    <div id="admin-tag-current">
      <div class="loading">${t('loading.generic')}</div>
    </div>
    <div class="admin-modal-section" style="margin-top: 16px;">
      <h3>${t('admin.setTag')}</h3>
      <div class="admin-input-group">
        <label>${t('admin.tagName')}</label>
        <input type="text" id="tag-set-name" placeholder="${t('admin.tagNamePlaceholder')}">
      </div>
      <div class="admin-input-group">
        <label>${t('admin.tagVersion')}</label>
        <input type="text" id="tag-set-version" placeholder="${t('admin.tagVersionPlaceholder')}">
      </div>
      <button class="btn btn-primary btn-sm" onclick="execAdminTagSet('${skillId}')">${t('admin.setTag')}</button>
    </div>
    <div class="admin-modal-section">
      <h3>${t('admin.removeTag')}</h3>
      <div class="admin-input-group">
        <label>${t('admin.tagName')}</label>
        <input type="text" id="tag-rm-name" placeholder="${t('admin.tagNameRemovePlaceholder')}">
      </div>
      <button class="btn btn-danger btn-sm" onclick="execAdminTagRemove('${skillId}')">${t('admin.removeTag')}</button>
    </div>
    <div class="actions" style="margin-top: 16px;">
      <button class="btn btn-secondary" onclick="closeModal()">${t('btn.cancel')}</button>
    </div>
  `;
  modal.classList.remove('hidden');

  // Load current tags
  loadAdminTags(skillId);
}

async function loadAdminTags(skillId) {
  const container = document.getElementById('admin-tag-current');
  try {
    const response = await fetch('/api/admin/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, action: 'ls' }),
    });
    const result = await response.json();
    if (result.success && result.tags) {
      const entries = Object.entries(result.tags);
      if (entries.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">${t('empty.noTags')}</p>`;
      } else {
        container.innerHTML = `
          <h3>${t('admin.currentTags')}</h3>
          <div class="admin-tag-list">
            ${entries.map(([tag, ver]) => `
              <span class="admin-tag-item">
                ${tag} <span class="tag-version">→ ${ver}</span>
                ${tag === 'latest' ? `<span style="color: var(--accent); font-size: 0.75rem;">${t('admin.tag.default')}</span>` : ''}
              </span>
            `).join('')}
          </div>
        `;
      }
    } else {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">${t('empty.couldNotLoadTags')}</p>`;
    }
  } catch (err) {
    container.innerHTML = `<p style="color: #ff6666; font-size: 0.85rem;">${t('error.generic')}: ${err.message}</p>`;
  }
}

async function execAdminTagSet(skillId) {
  const tag = document.getElementById('tag-set-name').value;
  const version = document.getElementById('tag-set-version').value;

  if (!tag || !version) {
    showToast(t('admin.tagRequired'), 'error');
    return;
  }

  try {
    showToast(t('admin.settingTag', { tag: tag }), 'info');
    const response = await fetch('/api/admin/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, action: 'set', tag, version }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`${t('error.generic')}: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      loadAdminTags(skillId);
      document.getElementById('tag-set-name').value = '';
      document.getElementById('tag-set-version').value = '';
    }
  } catch (err) {
    showToast(`${t('error.generic')}: ${err.message}`, 'error');
  }
}

async function execAdminTagRemove(skillId) {
  const tag = document.getElementById('tag-rm-name').value;

  if (!tag) {
    showToast(t('admin.tagNameRequired'), 'error');
    return;
  }

  try {
    showToast(t('admin.removingTag', { tag: tag }), 'info');
    const response = await fetch('/api/admin/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, action: 'rm', tag }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`${t('error.generic')}: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      loadAdminTags(skillId);
      document.getElementById('tag-rm-name').value = '';
    }
  } catch (err) {
    showToast(`${t('error.generic')}: ${err.message}`, 'error');
  }
}

function showAdminOwnerModal(skillId) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h2>${t('admin.ownersTitle', { skillId: skillId })}</h2>
    <div class="admin-modal-section">
      <h3>${t('admin.addOwner')}</h3>
      <div class="admin-input-group">
        <label>${t('admin.npmUser')}</label>
        <input type="text" id="owner-add-name" placeholder="${t('admin.npmUserPlaceholder')}">
      </div>
      <button class="btn btn-success btn-sm" onclick="execAdminOwnerAdd('${skillId}')">${t('admin.addOwner')}</button>
    </div>
    <div class="admin-modal-section">
      <h3>${t('admin.removeOwner')}</h3>
      <div class="admin-input-group">
        <label>${t('admin.npmUser')}</label>
        <input type="text" id="owner-rm-name" placeholder="${t('admin.npmUserPlaceholder')}">
      </div>
      <button class="btn btn-danger btn-sm" onclick="execAdminOwnerRemove('${skillId}')">${t('admin.removeOwner')}</button>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" onclick="closeModal()">${t('btn.cancel')}</button>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function execAdminOwnerAdd(skillId) {
  const user = document.getElementById('owner-add-name').value;
  if (!user) { showToast(t('admin.usernameRequired'), 'error'); return; }

  try {
    showToast(t('admin.addingOwner', { user: user }), 'info');
    const response = await fetch('/api/admin/owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, action: 'add', user }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`${t('error.generic')}: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      document.getElementById('owner-add-name').value = '';
    }
  } catch (err) {
    showToast(`${t('error.generic')}: ${err.message}`, 'error');
  }
}

async function execAdminOwnerRemove(skillId) {
  const user = document.getElementById('owner-rm-name').value;
  if (!user) { showToast(t('admin.usernameRequired'), 'error'); return; }

  try {
    showToast(t('admin.removingOwner', { user: user }), 'info');
    const response = await fetch('/api/admin/owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, action: 'rm', user }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`${t('error.generic')}: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      document.getElementById('owner-rm-name').value = '';
    }
  } catch (err) {
    showToast(`${t('error.generic')}: ${err.message}`, 'error');
  }
}

function showAdminAccessModal(skillId) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h2>${t('admin.accessTitle', { skillId: skillId })}</h2>
    <div class="admin-modal-section">
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 12px;">
        ${t('admin.accessDesc')}
      </p>
      <div class="admin-radio-group">
        <label><input type="radio" name="access-level" value="public" checked> ${t('admin.accessPublic')}</label>
        <label><input type="radio" name="access-level" value="restricted"> ${t('admin.accessRestricted')}</label>
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="execAdminAccess('${skillId}')">${t('admin.setAccess')}</button>
      <button class="btn btn-secondary" onclick="closeModal()">${t('btn.cancel')}</button>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function execAdminAccess(skillId) {
  const level = document.querySelector('input[name="access-level"]:checked').value;

  try {
    showToast(t('admin.settingAccess', { level: level }), 'info');
    const response = await fetch('/api/admin/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, level }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`${t('error.generic')}: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      closeModal();
    }
  } catch (err) {
    showToast(`${t('error.generic')}: ${err.message}`, 'error');
  }
}

// -----------------------------------------------------------------------------
// Upload 视图
// -----------------------------------------------------------------------------

/** Upload 状态 */
const uploadState = {
  skillName: '',
  file: null,
  data: null, // Parsed result from backend
  tempDir: '', // Temporary directory path from server
};

/** 上传文件大小限制：50 MB */
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

/** 初始化 Upload 控件 */
function initializeUploadControls() {
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('upload-file-input');
  const selectBtn = document.getElementById('upload-select-btn');
  const submitBtn = document.getElementById('upload-submit-btn');
  const skillNameInput = document.getElementById('upload-skill-name');

  if (!dropzone) return;

  // 文件选择
  selectBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 防止冒泡到 dropzone 的 click 事件
    fileInput.click();
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > MAX_UPLOAD_SIZE) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        showToast(`File too large (${sizeMB} MB). Maximum is 50 MB.`, 'error');
        e.target.value = '';
        return;
      }
      uploadState.file = file;
      submitBtn.disabled = false;
    }
  });

  // 拖拽上传 — 仅处理拖拽事件，点击由 Choose File 按钮或单独点击处理
  dropzone.addEventListener('click', (e) => {
    // 如果点击的是内部按钮，不重复触发文件选择（由按钮的 stopPropagation 处理）
    if (e.target.closest('button')) return;
    fileInput.click();
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.size > MAX_UPLOAD_SIZE) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        showToast(`File too large (${sizeMB} MB). Maximum is 50 MB.`, 'error');
        return;
      }
      uploadState.file = file;
      submitBtn.disabled = false;
    }
  });

  // Upload & Parse
  submitBtn.addEventListener('click', () => {
    if (!uploadState.file) {
      showToast(t('upload.errorNoFile'), 'error');
      return;
    }
    // 文件大小校验
    if (uploadState.file.size > MAX_UPLOAD_SIZE) {
      const sizeMB = (uploadState.file.size / 1024 / 1024).toFixed(1);
      showToast(`File too large (${sizeMB} MB). Maximum is 50 MB.`, 'error');
      return;
    }
    // Use skill name override if provided
    const override = skillNameInput.value.trim();
    handleUpload(uploadState.file, override || undefined);
  });

  // Action buttons
  document.getElementById('upload-action-publish').addEventListener('click', () => {
    executeUploadAction('publish');
  });
  document.getElementById('upload-action-install').addEventListener('click', () => {
    executeUploadAction('install');
  });
  document.getElementById('upload-action-both').addEventListener('click', () => {
    executeUploadAction('both');
  });
  document.getElementById('upload-action-discard').addEventListener('click', () => {
    resetUploadView();
    showToast(t('upload.discarded'), 'info');
  });
}

/** 重置 Upload 视图到 Phase 1 */
function resetUploadView() {
  uploadState.file = null;
  uploadState.data = null;
  uploadState.skillName = '';
  uploadState.tempDir = '';
  document.getElementById('upload-phase1').classList.remove('hidden');
  document.getElementById('upload-phase2').classList.add('hidden');
  document.getElementById('upload-submit-btn').disabled = true;
  document.getElementById('upload-progress').classList.add('hidden');
  document.getElementById('upload-file-input').value = '';
  document.getElementById('upload-skill-name').value = '';
}

/** 上传 zip 到后端 */
async function handleUpload(file, skillNameOverride) {
  const submitBtn = document.getElementById('upload-submit-btn');
  const progress = document.getElementById('upload-progress');
  const progressFill = document.getElementById('upload-progress-fill');
  const progressText = document.getElementById('upload-progress-text');

  submitBtn.disabled = true;
  progress.classList.remove('hidden');
  progressFill.style.width = '30%';
  progressText.textContent = t('upload.processing');

  try {
    // Read file as base64
    const reader = new FileReader();
    const base64 = await new Promise((resolve, reject) => {
      reader.onload = () => {
        // Remove data URL prefix
        const result = reader.result;
        const commaIndex = result.indexOf(',');
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    progressFill.style.width = '60%';
    progressText.textContent = t('upload.parsing');

    // Send to backend
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileData: base64,
        fileName: file.name,
        skillNameOverride: skillNameOverride || undefined,
      }),
    });

    const result = await response.json();

    if (result.error) {
      showToast(t('upload.uploadError', { error: result.error }), 'error');
      resetUploadView();
      return;
    }

    progressFill.style.width = '100%';
    progressText.textContent = t('upload.done');

    uploadState.data = result;
    uploadState.skillName = skillNameOverride || result.skillName;
    uploadState.tempDir = result.tempDir || '';

    // Switch to preview phase
    setTimeout(() => {
      document.getElementById('upload-phase1').classList.add('hidden');
      document.getElementById('upload-phase2').classList.remove('hidden');
      progress.classList.add('hidden');
      renderUploadPreview(result);
    }, 400);
  } catch (err) {
    showToast(t('upload.uploadError', { error: err.message }), 'error');
    resetUploadView();
  }
}

/** 渲染 skill 预览卡片 */
function renderUploadPreview(data) {
  const container = document.getElementById('upload-preview');

  const platformsHtml = data.platforms && data.platforms.length
    ? data.platforms.map(p => `<span class="platform-tag">${p}</span>`).join('')
    : `<span style="color: var(--text-muted); font-size: 0.85rem;">N/A</span>`;

  container.innerHTML = `
    <h2>${data.displayName || data.skillName}</h2>
    <div class="upload-preview-id">${data.skillName}@${data.version}</div>

    <div class="upload-preview-section">
      <h3>${t('upload.description')}</h3>
      <p>${data.description || t('detail.noDescription')}</p>
    </div>

    <div class="upload-preview-section">
      <h3>${t('upload.platforms')}</h3>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">${platformsHtml}</div>
    </div>

    <div class="upload-preview-section">
      <h3>${t('upload.validation')}</h3>
      <div>
        <span class="upload-preview-badge ${data.hasPackageJson ? 'success' : 'warning'}">
          📦 ${t('upload.hasPackageJson')}: ${data.hasPackageJson ? t('upload.yes') : t('upload.no')}
        </span>
        <span class="upload-preview-badge ${data.hasSkillMd ? 'success' : 'warning'}">
          📄 ${t('upload.hasSkillMd')}: ${data.hasSkillMd ? t('upload.yes') : t('upload.no')}
        </span>
      </div>
    </div>

    <div class="upload-preview-section" style="border-bottom:none;margin-bottom:0;padding-bottom:0;">
      <h3>${t('upload.stats')}</h3>
      <div class="upload-preview-stats">
        <div class="upload-preview-stat">
          <div class="upload-preview-stat-value">${data.fileCount}</div>
          <div class="upload-preview-stat-label">${t('upload.fileCount')}</div>
        </div>
        <div class="upload-preview-stat">
          <div class="upload-preview-stat-value">${data.version}</div>
          <div class="upload-preview-stat-label">${t('upload.version')}</div>
        </div>
      </div>
    </div>
  `;
}

/** 执行上传后的操作 */
async function executeUploadAction(action) {
  if (!uploadState.data || !uploadState.skillName) {
    showToast(t('upload.noSkillUploaded'), 'error');
    return;
  }

  const actionLabel = { publish: 'upload.publishing', install: 'upload.installing', both: 'upload.bothStarted' };
  const successMsg = { publish: 'upload.publishSuccess', install: 'upload.installSuccess', both: 'upload.bothSuccess' };

  showToast(t(actionLabel[action], { skillName: uploadState.skillName }), 'info');

  try {
    const response = await fetch('/api/upload/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skillName: uploadState.skillName,
        action: action,
        tempDir: uploadState.tempDir,
      }),
    });

    const result = await response.json();

    if (result.error) {
      showToast(t('upload.actionError', { error: result.error }), 'error');
      return;
    }

    // Check for individual operation results
    const hasError = Object.values(result.results || {}).some(r => !r.success);
    if (hasError) {
      const errors = Object.entries(result.results || {})
        .filter(([, r]) => !r.success)
        .map(([k, r]) => `${k}: ${r.message}`)
        .join('; ');
      showToast(`⚠️ ${errors}`, 'error');
      return;
    }

    showToast(t(successMsg[action], { skillName: uploadState.skillName }), 'success');
    resetUploadView();
  } catch (err) {
    showToast(t('upload.actionError', { error: err.message }), 'error');
  }
}
