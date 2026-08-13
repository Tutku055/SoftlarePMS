const fs = require('fs');
const files = [
  'src/features/departments/components/DepartmentDetail/DepartmentDetail.tsx',
  'src/features/documents/components/DocumentArchive/DocumentArchive.tsx',
  'src/features/documents/components/DocumentDetail/DocumentDetail.tsx',
  'src/features/employees/components/NotesAndReferences/NotesSection.tsx',
  'src/features/finance/components/Payrolls/PayrollDetail.tsx',
  'src/features/finance/components/Payrolls/PayrollList.tsx',
  'src/features/finance/components/Timesheets/TimesheetDetailMatrix.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/['"]\.\.\/\.\.\/\.\.\/utils\/dateUtils['"]/g, "'../../../../utils/dateUtils'");
  fs.writeFileSync(f, content, 'utf8');
});
