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
  totalPages: 1,
};

// -----------------------------------------------------------------------------
// 初始化
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  initializeControls();
  loadSkills();
});

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
  state.currentView = view;
  
  // 隐藏所有视图
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  
  // 显示目标视图
  const targetView = document.getElementById(`view-${view}`);
  if (targetView) {
    targetView.classList.add('active');
  }
  
  // 加载对应数据
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
    case 'admin':
      loadAdminDashboard();
      break;
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
  
  // 刷新按钮
  document.getElementById('refresh-skills').addEventListener('click', () => loadSkills());
  document.getElementById('update-all').addEventListener('click', updateAllSkills);
  const refreshAdmin = document.getElementById('refresh-admin');
  if (refreshAdmin) refreshAdmin.addEventListener('click', () => loadAdminDashboard());
  
  // 模态框关闭
  document.querySelector('.modal-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
}

// -----------------------------------------------------------------------------
// Skills 列表
// -----------------------------------------------------------------------------

async function loadSkills() {
  const container = document.getElementById('skills-list');
  container.innerHTML = '<div class="loading">Loading skills...</div>';
  
  try {
    const params = new URLSearchParams({
      page: state.currentPage.toString(),
      limit: state.pageSize.toString(),
    });
    
    if (state.searchQuery) {
      params.append('search', state.searchQuery);
    }
    
    const response = await fetch(`/api/skills?${params}`);
    const data = await response.json();
    
    if (data.error) {
      container.innerHTML = `<div class="loading">Error: ${data.error}</div>`;
      return;
    }
    
    renderSkills(data.skills || data, container);
    renderPagination(data.page, data.totalPages || 1);
    renderFetchWarning(data.fetchErrors);
  } catch (err) {
    container.innerHTML = `<div class="loading">Error: ${err.message}</div>`;
  }
}

async function loadInstalled() {
  const container = document.getElementById('installed-list');
  container.innerHTML = '<div class="loading">Loading...</div>';
  
  try {
    const response = await fetch('/api/installed');
    const skills = await response.json();
    
    if (skills.error) {
      container.innerHTML = `<div class="loading">Error: ${skills.error}</div>`;
      return;
    }
    
    renderSkills(skills, container, true);
  } catch (err) {
    container.innerHTML = `<div class="loading">Error: ${err.message}</div>`;
  }
}

function renderSkills(skills, container, isInstalled = false) {
  if (!skills || skills.length === 0) {
    container.innerHTML = '<div class="loading">No skills found</div>';
    return;
  }
  
  container.innerHTML = skills.map(skill => createSkillCard(skill, isInstalled)).join('');
}

function createSkillCard(skill, isInstalled) {
  const platforms = skill.platforms || [];
  const platformTags = platforms.map(p => `<span class="platform-tag">${p}</span>`).join('');
  
  return `
    <div class="skill-card">
      <h3>${skill.displayName || skill.id}</h3>
      <div class="skill-id">${skill.id}@${skill.version || 'latest'}</div>
      <p>${skill.description || 'No description'}</p>
      <div class="platforms">${platformTags}</div>
      <div class="actions">
        ${isInstalled ? `
          <button class="btn btn-danger btn-sm" onclick="uninstallSkill('${skill.id}')">Uninstall</button>
          <button class="btn btn-primary btn-sm" onclick="updateSkill('${skill.id}')">Update</button>
        ` : `
          <button class="btn btn-success btn-sm" onclick="installSkill('${skill.id}')">Install</button>
          <button class="btn btn-secondary btn-sm" onclick="showSkillInfo('${skill.id}')">Info</button>
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
  warning.textContent = `⚠ ${fetchErrors} skill(s) failed to load details from npm registry. Refresh to retry.`;
  document.querySelector('.view-header').after(warning);
}

// -----------------------------------------------------------------------------
// 分页
// -----------------------------------------------------------------------------

function renderPagination(currentPage, totalPages) {
  state.currentPage = currentPage;
  state.totalPages = totalPages;
  
  const container = document.getElementById('pagination');
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let html = `
    <button ${currentPage <= 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">← Prev</button>
    <span class="page-info">Page ${currentPage} of ${totalPages}</span>
    <button ${currentPage >= totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Next →</button>
  `;
  
  container.innerHTML = html;
}

function changePage(page) {
  if (page < 1 || page > state.totalPages) return;
  state.currentPage = page;
  loadSkills();
}

// -----------------------------------------------------------------------------
// Platforms
// -----------------------------------------------------------------------------

async function loadPlatforms() {
  const container = document.getElementById('platforms-list');
  container.innerHTML = '<div class="loading">Loading platforms...</div>';
  
  try {
    const response = await fetch('/api/platforms');
    const platforms = await response.json();
    
    if (platforms.error) {
      container.innerHTML = `<div class="loading">Error: ${platforms.error}</div>`;
      return;
    }
    
    renderPlatforms(platforms, container);
  } catch (err) {
    container.innerHTML = `<div class="loading">Error: ${err.message}</div>`;
  }
}

function renderPlatforms(platforms, container) {
  if (!platforms || platforms.length === 0) {
    container.innerHTML = '<div class="loading">No platforms found</div>';
    return;
  }
  
  container.innerHTML = platforms.map(platform => `
    <div class="platform-card">
      <div>
        <h3>${platform.name}</h3>
        <div class="status ${platform.available ? 'status-available' : 'status-unavailable'}">
          ${platform.available ? '✅ Available' : '❌ Not detected'}
        </div>
      </div>
      <div>
        ${platform.installedCount ? `<span>${platform.installedCount} skills installed</span>` : ''}
      </div>
    </div>
  `).join('');
}

// -----------------------------------------------------------------------------
// Help 视图
// -----------------------------------------------------------------------------

async function loadHelp() {
  const container = document.getElementById('help-content');
  container.innerHTML = '<div class="loading">Loading...</div>';

  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    renderHelp(config, container);
  } catch (err) {
    container.innerHTML = `<div class="loading">Error: ${err.message}</div>`;
  }
}

function renderHelp(config, container) {
  const envVars = [
    { var: 'SKM_NPM_SCOPE', default: config.npmScope, desc: '主要 npm scope，用于发布/查找 skill' },
    { var: 'SKM_NPM_SCOPE_FALLBACK', default: config.npmScopeFallback, desc: '回退 scope（兼容旧安装）' },
    { var: 'SKM_NPM_SCOPES', default: config.skillScopes.join(', '), desc: '搜索时尝试的 scope 列表（逗号分隔）' },
    { var: 'SKM_NPM_REGISTRY', default: config.npmRegistry, desc: 'npm registry 地址' },
    { var: 'SKM_URL', default: config.skmUrl, desc: '个人链接前缀（publish 输出用）' },
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
      <h3>⚙️ 环境变量配置</h3>
      <p>设置以下环境变量可覆盖默认配置：</p>
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
          <tr><td><code>skm install &lt;skill&gt;</code></td><td>安装 skill 到所有平台</td></tr>
          <tr><td><code>skm install &lt;skill&gt; --platform opencode</code></td><td>安装到指定平台</td></tr>
          <tr><td><code>skm uninstall &lt;skill&gt;</code></td><td>卸载 skill</td></tr>
          <tr><td><code>skm update &lt;skill&gt;</code></td><td>更新 skill</td></tr>
          <tr><td><code>skm update --all</code></td><td>更新所有 skills</td></tr>
          <tr><td><code>skm platforms</code></td><td>查看可用平台</td></tr>
          <tr><td><code>skm gui</code></td><td>启动图形界面</td></tr>
          <tr><td><code>skm gui 18790</code></td><td>指定端口启动 GUI</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

async function installSkill(skillId) {
  try {
    showToast(`Installing ${skillId}...`, 'info');
    const response = await fetch('/api/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId })
    });
    
    const result = await response.json();
    
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${skillId} installed successfully!`, 'success');
      if (state.currentView === 'installed') loadInstalled();
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function uninstallSkill(skillId) {
  if (!confirm(`Are you sure you want to uninstall ${skillId}?`)) return;
  
  try {
    showToast(`Uninstalling ${skillId}...`, 'info');
    const response = await fetch('/api/uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId })
    });
    
    const result = await response.json();
    
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${skillId} uninstalled!`, 'success');
      loadInstalled();
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function updateSkill(skillId) {
  try {
    showToast(`Updating ${skillId}...`, 'info');
    const response = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId })
    });
    
    const result = await response.json();
    
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${skillId} updated!`, 'success');
      if (state.currentView === 'installed') loadInstalled();
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function updateAllSkills() {
  if (!confirm('Update all installed skills?')) return;
  
  try {
    showToast('Updating all skills...', 'info');
    const response = await fetch('/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const result = await response.json();
    
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
    } else {
      showToast('✅ All skills updated!', 'success');
      loadInstalled();
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function showSkillInfo(skillId) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');
  
  modalBody.innerHTML = '<div class="loading">Loading...</div>';
  modal.classList.remove('hidden');
  
  try {
    const response = await fetch(`/api/skills?search=${skillId}`);
    const data = await response.json();
    const skills = data.skills || data;
    const skill = Array.isArray(skills) ? skills.find(s => s.id === skillId) : skills;
    
    if (!skill) {
      modalBody.innerHTML = '<div class="loading">Skill not found</div>';
      return;
    }
    
    modalBody.innerHTML = `
      <h2>${skill.displayName || skill.id}</h2>
      <div class="detail-row"><strong>ID:</strong> ${skill.id}</div>
      <div class="detail-row"><strong>Version:</strong> ${skill.version || 'latest'}</div>
      <div class="detail-row"><strong>Description:</strong> ${skill.description || 'No description'}</div>
      <div class="detail-row"><strong>Platforms:</strong> ${(skill.platforms || []).join(', ') || 'None'}</div>
      ${skill.link ? `<div class="detail-row"><strong>Link:</strong> <a href="${skill.link}" target="_blank">${skill.link}</a></div>` : ''}
      <div class="actions" style="margin-top: 20px;">
        <button class="btn btn-success" onclick="installSkill('${skill.id}'); closeModal();">Install</button>
      </div>
    `;
  } catch (err) {
    modalBody.innerHTML = `<div class="loading">Error: ${err.message}</div>`;
  }
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
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
  container.innerHTML = '<div class="loading">Loading stats...</div>';

  try {
    const response = await fetch('/api/admin/stats');
    const data = await response.json();

    if (data.error) {
      container.innerHTML = `<div class="loading">Error: ${data.error}</div>`;
      return;
    }

    const cards = [
      { value: data.totalSkills, label: 'Published Skills' },
      { value: data.totalVersions, label: 'Total Versions' },
      { value: data.averageVersions, label: 'Avg Versions/Skill' },
      { value: data.withMetadata, label: 'With Metadata' },
      { value: `${data.totalSizeMB} MB`, label: 'Total Size' },
      { value: data.platformCount, label: 'Platforms Covered' },
    ];

    container.innerHTML = cards.map(c => `
      <div class="admin-stat-card">
        <div class="admin-stat-value">${c.value}</div>
        <div class="admin-stat-label">${c.label}</div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="loading">Error: ${err.message}</div>`;
  }
}

async function loadAdminSkills() {
  const container = document.getElementById('admin-skills-list');
  container.innerHTML = '<div class="loading">Loading published skills...</div>';

  try {
    const params = new URLSearchParams({ limit: '100' });
    const response = await fetch(`/api/skills?${params}`);
    const data = await response.json();

    if (data.error) {
      container.innerHTML = `<div class="loading">Error: ${data.error}</div>`;
      return;
    }

    const skills = data.skills || [];
    renderAdminSkills(skills, container);
  } catch (err) {
    container.innerHTML = `<div class="loading">Error: ${err.message}</div>`;
  }
}

function renderAdminSkills(skills, container) {
  if (!skills || skills.length === 0) {
    container.innerHTML = '<div class="loading">No published skills found</div>';
    return;
  }

  container.innerHTML = `
    <h3 style="color: var(--text-secondary); margin-bottom: 12px; font-size: 1rem;">Published Skills (${skills.length})</h3>
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
            <button class="admin-btn admin-btn-deprecate" onclick="showAdminDeprecateModal('${id}')">Deprecate</button>
            <button class="admin-btn admin-btn-unpublish" onclick="showAdminUnpublishModal('${id}')">Unpublish</button>
            <button class="admin-btn admin-btn-tag" onclick="showAdminTagModal('${id}')">Tags</button>
            <button class="admin-btn admin-btn-owner" onclick="showAdminOwnerModal('${id}')">Owners</button>
            <button class="admin-btn admin-btn-access" onclick="showAdminAccessModal('${id}')">Access</button>
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
    <h2>Deprecate: ${skillId}</h2>
    <div class="admin-modal-section">
      <div class="admin-input-group">
        <label>Version</label>
        <input type="text" id="deprecate-version" placeholder="(leave empty for all versions)">
      </div>
      <div class="admin-input-group">
        <label>Message</label>
        <input type="text" id="deprecate-msg" value="This skill is deprecated. Please use an alternative.">
      </div>
      <p class="admin-warning-text">⚠ Deprecating will mark this skill as deprecated in the npm registry.</p>
    </div>
    <div class="actions">
      <button class="btn btn-danger" onclick="execAdminDeprecate('${skillId}')">Confirm Deprecate</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function execAdminDeprecate(skillId) {
  const version = document.getElementById('deprecate-version').value;
  const message = document.getElementById('deprecate-msg').value;

  try {
    showToast(`Deprecating ${skillId}...`, 'info');
    const response = await fetch('/api/admin/deprecate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, version, message }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      closeModal();
      loadAdminDashboard();
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

function showAdminUnpublishModal(skillId) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h2>Unpublish: ${skillId}</h2>
    <div class="admin-modal-section">
      <div class="admin-input-group">
        <label>Version</label>
        <input type="text" id="unpublish-version" placeholder="(leave empty for entire package)">
      </div>
      <div class="admin-checkbox-group">
        <input type="checkbox" id="unpublish-force">
        <label for="unpublish-force">Force unpublish entire package (required if no version specified)</label>
      </div>
      <p class="admin-danger-text">⚠ This action cannot be undone! Packages can be restored within 72 hours.</p>
    </div>
    <div class="actions">
      <button class="btn btn-danger" onclick="execAdminUnpublish('${skillId}')">Confirm Unpublish</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function execAdminUnpublish(skillId) {
  const version = document.getElementById('unpublish-version').value;
  const force = document.getElementById('unpublish-force').checked;

  try {
    showToast(`Unpublishing ${skillId}...`, 'info');
    const response = await fetch('/api/admin/unpublish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, version, force }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      closeModal();
      loadAdminDashboard();
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

function showAdminTagModal(skillId) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h2>Tags: ${skillId}</h2>
    <div id="admin-tag-current">
      <div class="loading">Loading current tags...</div>
    </div>
    <div class="admin-modal-section" style="margin-top: 16px;">
      <h3>Set Tag</h3>
      <div class="admin-input-group">
        <label>Tag</label>
        <input type="text" id="tag-set-name" placeholder="e.g. beta, latest">
      </div>
      <div class="admin-input-group">
        <label>Version</label>
        <input type="text" id="tag-set-version" placeholder="e.g. 1.0.1">
      </div>
      <button class="btn btn-primary btn-sm" onclick="execAdminTagSet('${skillId}')">Set Tag</button>
    </div>
    <div class="admin-modal-section">
      <h3>Remove Tag</h3>
      <div class="admin-input-group">
        <label>Tag</label>
        <input type="text" id="tag-rm-name" placeholder="e.g. beta">
      </div>
      <button class="btn btn-danger btn-sm" onclick="execAdminTagRemove('${skillId}')">Remove Tag</button>
    </div>
    <div class="actions" style="margin-top: 16px;">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
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
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No dist-tags found.</p>';
      } else {
        container.innerHTML = `
          <h3>Current Tags</h3>
          <div class="admin-tag-list">
            ${entries.map(([tag, ver]) => `
              <span class="admin-tag-item">
                ${tag} <span class="tag-version">→ ${ver}</span>
                ${tag === 'latest' ? '<span style="color: var(--accent); font-size: 0.75rem;"> (default)</span>' : ''}
              </span>
            `).join('')}
          </div>
        `;
      }
    } else {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Could not load tags.</p>';
    }
  } catch (err) {
    container.innerHTML = `<p style="color: #ff6666; font-size: 0.85rem;">Error: ${err.message}</p>`;
  }
}

async function execAdminTagSet(skillId) {
  const tag = document.getElementById('tag-set-name').value;
  const version = document.getElementById('tag-set-version').value;

  if (!tag || !version) {
    showToast('Tag and version are required', 'error');
    return;
  }

  try {
    showToast(`Setting tag ${tag}...`, 'info');
    const response = await fetch('/api/admin/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, action: 'set', tag, version }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      loadAdminTags(skillId);
      document.getElementById('tag-set-name').value = '';
      document.getElementById('tag-set-version').value = '';
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function execAdminTagRemove(skillId) {
  const tag = document.getElementById('tag-rm-name').value;

  if (!tag) {
    showToast('Tag name is required', 'error');
    return;
  }

  try {
    showToast(`Removing tag ${tag}...`, 'info');
    const response = await fetch('/api/admin/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, action: 'rm', tag }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      loadAdminTags(skillId);
      document.getElementById('tag-rm-name').value = '';
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

function showAdminOwnerModal(skillId) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h2>Owners: ${skillId}</h2>
    <div class="admin-modal-section">
      <h3>Add Owner</h3>
      <div class="admin-input-group">
        <label>npm User</label>
        <input type="text" id="owner-add-name" placeholder="npm username">
      </div>
      <button class="btn btn-success btn-sm" onclick="execAdminOwnerAdd('${skillId}')">Add Owner</button>
    </div>
    <div class="admin-modal-section">
      <h3>Remove Owner</h3>
      <div class="admin-input-group">
        <label>npm User</label>
        <input type="text" id="owner-rm-name" placeholder="npm username">
      </div>
      <button class="btn btn-danger btn-sm" onclick="execAdminOwnerRemove('${skillId}')">Remove Owner</button>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function execAdminOwnerAdd(skillId) {
  const user = document.getElementById('owner-add-name').value;
  if (!user) { showToast('Username is required', 'error'); return; }

  try {
    showToast(`Adding owner ${user}...`, 'info');
    const response = await fetch('/api/admin/owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, action: 'add', user }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      document.getElementById('owner-add-name').value = '';
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

async function execAdminOwnerRemove(skillId) {
  const user = document.getElementById('owner-rm-name').value;
  if (!user) { showToast('Username is required', 'error'); return; }

  try {
    showToast(`Removing owner ${user}...`, 'info');
    const response = await fetch('/api/admin/owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, action: 'rm', user }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      document.getElementById('owner-rm-name').value = '';
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

function showAdminAccessModal(skillId) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <h2>Access: ${skillId}</h2>
    <div class="admin-modal-section">
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 12px;">
        Set the package access level. Public packages are visible to everyone.
        Restricted packages require authentication to install.
      </p>
      <div class="admin-radio-group">
        <label><input type="radio" name="access-level" value="public" checked> Public</label>
        <label><input type="radio" name="access-level" value="restricted"> Restricted</label>
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-primary" onclick="execAdminAccess('${skillId}')">Set Access</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  `;
  modal.classList.remove('hidden');
}

async function execAdminAccess(skillId) {
  const level = document.querySelector('input[name="access-level"]:checked').value;

  try {
    showToast(`Setting access to ${level}...`, 'info');
    const response = await fetch('/api/admin/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, level }),
    });
    const result = await response.json();
    if (result.error) {
      showToast(`Error: ${result.error}`, 'error');
    } else {
      showToast(`✅ ${result.message}`, 'success');
      closeModal();
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}
