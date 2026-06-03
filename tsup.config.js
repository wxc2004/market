import { defineConfig } from 'tsup';
export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    banner: {
        js: '#!/usr/bin/env node'
    },
    // 禁用 shims 以避免与 ESM 模式的兼容性问题
    shims: false,
    // 外部依赖 — 运行时从 node_modules 加载，不打包进 bundle
    // adm-zip 和 tar 是原生模块，需要外部化
    external: [
        'adm-zip',
        'tar',
    ],
});
