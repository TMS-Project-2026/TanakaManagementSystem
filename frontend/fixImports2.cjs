const fs = require('fs');
const path = require('path');
const pagesDir = path.join('d:', 'Semester 6 Magang', 'TanakaManagementSystem', 'frontend', 'src', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

let changed = 0;
for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if it uses NotificationBell component but doesn't import it
  if (content.includes('<NotificationBell') && !content.includes('import NotificationBell')) {
    content = "import NotificationBell from '../components/NotificationBell';\n" + content;
    fs.writeFileSync(filePath, content);
    changed++;
    console.log('Added import to ' + file);
  }
}
console.log('Total fixed: ' + changed);
