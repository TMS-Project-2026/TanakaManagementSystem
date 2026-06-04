const fs = require('fs');
const path = require('path');
const pagesDir = path.join('d:', 'Semester 6 Magang', 'TanakaManagementSystem', 'frontend', 'src', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

let changed = 0;
for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if it has Bell in JSX but missing Bell in imports
  if (content.includes('<Bell size={22}') && !content.includes('Bell,') && !content.includes(', Bell') && !content.includes('import { Bell }') && !content.includes('{ Bell }') && !content.includes('{Bell}')) {
    content = "import { Bell } from 'lucide-react';\n" + content;
    fs.writeFileSync(filePath, content);
    changed++;
    console.log('Fixed imports in ' + file);
  }
}
console.log('Total fixed: ' + changed);
