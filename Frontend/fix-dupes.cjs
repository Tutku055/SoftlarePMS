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

  // Remove duplicate consecutive imports of formatDateDisplay
  // We can just find all lines that are `import { formatDateDisplay } from ...`
  // and keep only the last one or remove duplicates.
  let lines = content.split('\n');
  let formatDateDisplayImports = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('import { formatDateDisplay }')) {
      formatDateDisplayImports.push({ line: lines[i], index: i });
    }
  }

  if (formatDateDisplayImports.length > 1) {
    // Keep only the first one that is valid, actually they are probably identical
    for (let i = 1; i < formatDateDisplayImports.length; i++) {
      lines[formatDateDisplayImports[i].index] = ''; // remove line
    }
    content = lines.join('\n');
  }

  if (file.includes('EmployeeAddressDetail.tsx')) {
    // fix the specific hooks import issue
    content = content.replace(/from\s+['"]\.\/hooks\//g, "from '../hooks/");
    content = content.replace(/from\s+['"]\.\/components\//g, "from '../components/");
  }

  // Also in Roster and EmployeeAddressDetail: `Cannot find module '../../../../utils/dateUtils'`
  // If it's in pages (features/employees/pages/), then root is ../../../ -> utils is `../../../utils/dateUtils`
  // Wait, `features/employees/pages/` is 4 levels deep from src: src -> features -> employees -> pages.
  // Wait! src is level 1, features is 2, employees is 3, pages is 4.
  // So from pages to utils:
  // pages -> employees (..)
  // employees -> features (..)
  // features -> src (..)
  // src -> utils (/utils)
  // That is `../../../utils/dateUtils`.
  // If it says `../../../../utils/dateUtils`, that's one `../` too many!
  content = content.replace(/['"]\.\.\/\.\.\/\.\.\/\.\.\/utils\/dateUtils['"]/g, "'../../../utils/dateUtils'");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed duplicates/paths in ${file}`);
  }
});
