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

// We want to replace paths like '../../../employees/hooks/useEmployees' with '../../../employees'
// Note: only if it's imported by another feature.
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Features that have an index.ts public API
  const publicFeatures = ['employees', 'finance', 'professions', 'settings', 'users', 'departments'];

  // regex to match: import { ... } from '.../../{feature}/someSubFolder'
  const importRegex = /import\s+(?:type\s+)?{([^}]*?)}\s+from\s+['"]((?:\.\.\/)+)([a-z]+)\/(hooks|types|api|constants)(?:\/[a-zA-Z0-9_-]+)?['"]/g;

  content = content.replace(importRegex, (match, importsStr, prefix, featureName, subFolder) => {
    // Only apply if the featureName is in our list
    if (publicFeatures.includes(featureName)) {
      changed = true;
      let newPath = prefix + featureName; // e.g. '../../../employees'
      
      // Keep "import type" if it was there
      let isTypeOnly = match.includes('import type');
      let typeKeyword = isTypeOnly ? 'type ' : '';
      
      return `import ${typeKeyword}{${importsStr}} from '${newPath}';`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
