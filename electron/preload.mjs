/**
 * =============================================================================
 * SkillMarket - Electron Preload Script
 * =============================================================================
 *
 * 桥接 Node.js 和渲染进程。通过 contextBridge 安全地暴露 API。
 * =============================================================================
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // 平台信息
  platform: process.platform,

  // 获取应用版本
  getVersion: () => ipcRenderer.invoke('get-version'),
});
