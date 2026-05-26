/**
 * =============================================================================
 * SkillMarket - Build Standalone .exe using Node.js SEA
 * =============================================================================
 *
 * 1. esbuild bundles src/ index.ts → CJS (SEA only supports CJS loader)
 * 2. Patch CJS bundle: replace import.meta.url → __filename
 * 3. Embed GUI files (html, js, css) into the bundle
 * 4. Generate SEA blob and inject into a copy of node.exe
 *
 * Usage:   node scripts/build-exe.mjs
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __f = fileURLToPath(import.meta.url);
const __d = dirname(__f);
const ROOT = join(__d, '..');
const DIST = join(ROOT, 'dist');
const GUI = join(ROOT, 'gui');
const ENTRY = join(DIST, 'sea-entry.js');
const BLOB = join(DIST, 'sea-prep.blob');
const EXE = join(DIST, 'skillmarket.exe');

// ---------------------------------------------------------------------------
// Step 1: esbuild CJS bundle from TypeScript source
// ---------------------------------------------------------------------------
console.log('Bundling with esbuild (CJS)...');

try {
  execSync(
    `npx esbuild src/index.ts --bundle --platform=node --format=cjs `
    + `--target=es2022 --external:express --outfile="${ENTRY}"`,
    { cwd: ROOT, stdio: 'pipe', encoding: 'utf-8', timeout: 30000 }
  );
} catch (err) {
  console.error('esbuild failed:', (err.stderr || err.message).trim());
  process.exit(1);
}

const kb = (readFileSync(ENTRY).length / 1024).toFixed(0);
console.log(`  OK  ${kb} KB -> sea-entry.js`);

// ---------------------------------------------------------------------------
// Step 2: Fix import.meta.url shims for CJS/SEA compatibility
// ---------------------------------------------------------------------------
console.log('Patching import_meta.url shims for SEA...');

let code = readFileSync(ENTRY, 'utf-8');

// esbuild transforms `import.meta.url` into variables like:
//   var import_meta2 = {};  // import_meta.url = undefined
//   (0, import_url3.fileURLToPath)(import_meta2.url)  // throws
//
// Fix: make import_meta.url a valid file URL so fileURLToPath works.
// In CJS/SEA, __filename is the .exe path, so we use that.
code = code.replace(
  /var (import_meta\d*)\s*=\s*\{\};/g,
  'var $1 = { url: typeof __filename !== "undefined" ? require("url").pathToFileURL(__filename).href : "file:///sea-entry.js" };'
);

// ---------------------------------------------------------------------------
// Step 3: Embed GUI files & patch serveStaticFile
// ---------------------------------------------------------------------------
console.log('Embedding GUI files...');

const gui = {
  'index.html': readFileSync(join(GUI, 'index.html'), 'utf-8'),
  'app.js': readFileSync(join(GUI, 'app.js'), 'utf-8'),
  'style.css': readFileSync(join(GUI, 'style.css'), 'utf-8'),
};

const mapLines = Object.entries(gui)
  .map(([k, v]) => `  "${k}": ${JSON.stringify(v)}`)
  .join(',\n');

const fnPattern = /function serveStaticFile\(res,\s*filePath\)\s*\{[\s\S]*?\n\}/;
const fnMatch = code.match(fnPattern);

if (!fnMatch) {
  console.error('serveStaticFile not found in bundle');
  process.exit(1);
}

const newFn = `
// [EMBEDDED] GUI files
var __GUI_EMBEDDED__ = {
${mapLines}
};

function serveStaticFile(res, filePath) {
  var _fs = require("fs");
  var _path = require("path");
  var fileName;
  try { fileName = _path.basename(filePath); } catch(e) {}
  var embedded = __GUI_EMBEDDED__[fileName];
  if (embedded !== void 0) {
    var ext = filePath.endsWith(".html") ? ".html" : filePath.endsWith(".js") ? ".js" : ".css";
    var mime = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": mime,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    res.end(embedded);
    return;
  }
  if (!_fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
    return;
  }
  var content = _fs.readFileSync(filePath);
  var ext = _path.extname(filePath);
  var mime = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": mime,
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  });
  res.end(content);
}
`.trimStart();

code = code.replace(fnMatch[0], newFn);
writeFileSync(ENTRY, code, 'utf-8');

console.log('  OK  GUI files embedded, serveStaticFile patched');

// ---------------------------------------------------------------------------
// Step 4: SEA config
// ---------------------------------------------------------------------------
console.log('Creating SEA config...');
writeFileSync(join(ROOT, 'sea-config.json'), JSON.stringify({
  main: 'dist/sea-entry.js',
  output: 'dist/sea-prep.blob',
  disableExperimentalSEAWarning: true,
}, null, 2), 'utf-8');

// ---------------------------------------------------------------------------
// Step 5: Generate blob
// ---------------------------------------------------------------------------
console.log('Generating SEA blob...');
try {
  execSync('node --experimental-sea-config sea-config.json',
    { cwd: ROOT, stdio: 'pipe', encoding: 'utf-8', timeout: 30000 });
} catch (err) {
  console.error('Blob failed:', (err.stderr || err.message).trim());
  process.exit(1);
}
console.log('  OK  sea-prep.blob');

// ---------------------------------------------------------------------------
// Step 6: Inject into node.exe
// ---------------------------------------------------------------------------
console.log('Creating skillmarket.exe ...');
try { unlinkSync(EXE); } catch {}
copyFileSync(process.execPath, EXE);
const mb = (readFileSync(EXE).length / 1024 / 1024).toFixed(1);
console.log(`  OK  node.exe (${mb} MB) copied`);

try {
  execSync(
    `npx postject "${EXE}" NODE_SEA_BLOB "${BLOB}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
    { cwd: ROOT, stdio: 'pipe', encoding: 'utf-8', timeout: 60000 });
} catch (err) {
  console.error('postject failed:', (err.stderr || err.message).trim());
  process.exit(1);
}
console.log('  OK  blob injected');

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------
console.log(`\nDONE: ${EXE} (${(readFileSync(EXE).length / 1024 / 1024).toFixed(1)} MB)`);
console.log('Run: dist\\skillmarket.exe gui');
