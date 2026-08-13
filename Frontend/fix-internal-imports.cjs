const fs = require('fs');

const movedFiles = [
  'c:/Users/user/source/repos/SoftlarePMS/Frontend/src/features/employees/pages/EmployeeCreation.tsx',
  'c:/Users/user/source/repos/SoftlarePMS/Frontend/src/features/employees/pages/EmployeeDetail.tsx',
  'c:/Users/user/source/repos/SoftlarePMS/Frontend/src/features/employees/pages/Roster.tsx',
  'c:/Users/user/source/repos/SoftlarePMS/Frontend/src/features/employees/pages/EmployeeAddressDetail.tsx',
  'c:/Users/user/source/repos/SoftlarePMS/Frontend/src/features/employees/components/AddressList.tsx',
  'c:/Users/user/source/repos/SoftlarePMS/Frontend/src/features/users/pages/UsersPage.tsx',
  'c:/Users/user/source/repos/SoftlarePMS/Frontend/src/features/users/pages/UserDetail.tsx',
  'c:/Users/user/source/repos/SoftlarePMS/Frontend/src/features/notifications/pages/NotificationsPage.tsx'
];

movedFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We moved one level deeper.
  // 1. If it was importing from outside the feature: `../../` -> `../../../`
  // 2. If it was importing from inside the feature: `./` -> `../`
  
  // Note: we must do replacements carefully so we don't double replace.
  
  // A safe way: parse the import statements and adjust paths.
  const importRegex = /(import\s+.*?from\s+['"])(.*?)(['"])/g;
  
  content = content.replace(importRegex, (match, prefix, modulePath, suffix) => {
    if (modulePath.startsWith('.')) {
      if (modulePath.startsWith('../../')) {
        // Was pointing outside the feature root, now it needs one more level
        return prefix + '../' + modulePath + suffix;
      } else if (modulePath.startsWith('./')) {
        // Was pointing inside the feature root (e.g. ./api/x) -> now needs ../api/x
        if (modulePath.endsWith('.css')) {
            // CSS was also moved alongside the file! So keep ./ if it's css!
            return match; 
        }
        return prefix + '.' + modulePath + suffix; 
      } else if (modulePath.startsWith('../')) {
        // Was pointing to another subfolder inside the feature? or outside?
        // Actually, if it was at feature root, `../` points OUTSIDE the feature root.
        // Wait, from `features/users/UsersPage.tsx`, `../` points to `features/`.
        // So `../` becomes `../../`.
        if (modulePath.endsWith('currencyConstants')) {
             return prefix + '../' + modulePath + suffix;
        }
        return prefix + '../' + modulePath + suffix;
      }
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed internal imports in ${file}`);
  }
});
