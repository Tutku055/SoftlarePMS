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
  let changed = false;

  // Handle multi-line first
  const multiLineRegex = /import\s+{\s*([\s\S]*?)\s*}\s*from\s+['"]([^'"]*?currencyConstants)['"]/g;
  content = content.replace(multiLineRegex, (match, importsStr, modulePath) => {
    if (importsStr.includes('formatDateDisplay')) {
      changed = true;
      let newImports = importsStr.split(',').map(s => s.trim()).filter(s => s !== 'formatDateDisplay' && s !== '');
      
      let res = '';
      if (newImports.length > 0) {
        res += `import { ${newImports.join(', ')} } from '${modulePath}';\n`;
      }
      
      let relativePath = path.relative(path.dirname(file), path.join(srcDir, 'utils', 'dateUtils')).replace(/\\/g, '/');
      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }
      res += `import { formatDateDisplay } from '${relativePath}';`;
      return res;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
