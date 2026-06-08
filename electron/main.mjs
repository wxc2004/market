/**
 * =============================================================================
 * SkillMarket - Electron Main Process
 * =============================================================================
 *
 * 原生桌面应用窗口：
 * - 内嵌 HTTP 服务器（非浏览器模式）
 * - 系统托盘（关闭到托盘）
 * - 原生菜单栏
 * =============================================================================
 */

import { app, BrowserWindow, Tray, Menu, dialog, shell, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let mainWindow = null;
let tray = null;
let server = null;
const PORT = 18770;

// 单实例锁
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// 启动内嵌 HTTP 服务器
// ---------------------------------------------------------------------------

async function startServer(port) {
  const entryPath = pathToFileURL(
    path.join(ROOT, 'dist', 'electron-entry.js')
  ).href;
  const { startGuiServer } = await import(entryPath);

  const srv = startGuiServer(port);
  server = srv;

  return new Promise((resolve, reject) => {
    srv.on('listening', () => resolve(port));
    srv.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        srv.close();
        resolve(startServer(port + 1));
      } else {
        reject(err);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// 创建主窗口
// ---------------------------------------------------------------------------

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'SkillMarket',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // 关闭 → 隐藏到托盘
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ---------------------------------------------------------------------------
// 系统托盘
// ---------------------------------------------------------------------------

function createTray(port) {
  const iconPath = path.join(ROOT, 'electron', 'tray-icon.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('SkillMarket');

  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: '打开 SkillMarket',
      click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
        else { createWindow(port); }
      },
    },
    { type: 'separator' },
    {
      label: '关于',
      click: () => dialog.showMessageBox({
        type: 'info',
        title: '关于 SkillMarket',
        message: 'SkillMarket v1.3.37',
        detail: 'Cross-platform skill manager for AI coding tools',
      }),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => { app.isQuitting = true; app.quit(); },
    },
  ]));

  tray.on('double-click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });
}

// ---------------------------------------------------------------------------
// 应用菜单
// ---------------------------------------------------------------------------

function createMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    {
      label: 'SkillMarket',
      submenu: [
        ...(isMac ? [{ role: 'about' }, { type: 'separator' }] : []),
        { role: 'quit' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        { label: 'GitHub', click: () => shell.openExternal('https://github.com/wxc2004/market') },
        { label: '报告问题', click: () => shell.openExternal('https://github.com/wxc2004/market/issues') },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------------------------------------------------------------------------
// 启动
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  try {
    const actualPort = await startServer(PORT);
    createWindow(actualPort);
    try { createTray(actualPort); } catch {}
    createMenu();

    app.on('activate', () => {
      if (mainWindow === null) createWindow(actualPort);
      else mainWindow.show();
    });
  } catch (err) {
    dialog.showErrorBox('启动失败', err.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (server) try { server.close(); } catch {}
});
