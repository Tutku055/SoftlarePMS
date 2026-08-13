const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/user/source/repos/SoftlarePMS/Frontend/src';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Remove comments like: // ─── SOME TEXT ───
  // Also removes lines like: // --- SOME TEXT ---
  content = content.replace(/[ \t]*\/\/[ \t]*[─-]{3,}.*\r?\n/g, '');

  // 2. Remove comments like: {/* ── SOME TEXT ── */}
  content = content.replace(/[ \t]*\{\/\*[ \t]*[─-]{2,}.*?\*\/\}[ \t]*\r?\n?/g, '');

  // 3. Any standard `//` comments that contain uppercase headings but maybe only 1 or 2 dashes if they are just noise
  // Actually, let's keep it safe and just kill the ─ and --- ones since the user specifically hated those.

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Cleaned comments in ${file}`);
  }
});
