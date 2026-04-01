import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  banner: {
    /**
     * 添加 shebang 到编译后的输出
     * 
     * 注意: tsup 的 banner 选项会在模块内容前添加字符串，
     * 这里用 JSON 格式传递以确保正确处理
     */
    js: '#!/usr/bin/env node'
  },
  /**
   * 禁用 shims 以避免潜在的兼容性问题
   * shims 会自动为某些 Node.js 模块提供垫片，
   * 但可能与我们的场景不兼容
   */
  shims: false
});
