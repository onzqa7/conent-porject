// Publishes app/ui as an over-the-air UI update.
// Usage: node tools/publish-ui.js <version> ["notes"] [minShell]
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [version, notes = '', minShell] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(version || '')) { console.error('usage: node tools/publish-ui.js 2.0.1 "notes" [minShell]'); process.exit(1); }
const root = path.join(__dirname, '..');
const src = path.join(root, 'app', 'ui');
const dest = path.join(root, 'updates', 'ui', version);
const manifestPath = path.join(root, 'updates', 'manifest.json');
fs.writeFileSync(path.join(src, 'version.json'), JSON.stringify({ version }) + '\n');
fs.rmSync(dest, { recursive: true, force: true });
const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) { walk(full); continue; }
    const rel = path.relative(src, full).split(path.sep).join('/');
    if (rel === 'version.json') continue;
    const buf = fs.readFileSync(full);
    fs.mkdirSync(path.dirname(path.join(dest, rel)), { recursive: true });
    fs.writeFileSync(path.join(dest, rel), buf);
    files.push({ path: rel, sha256: crypto.createHash('sha256').update(buf).digest('hex'), size: buf.length });
  }
})(src);
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
manifest.ui = { version, notes, minShell: minShell || null, files };
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`UI ${version}: ${files.length} files -> updates/ui/${version}`);
