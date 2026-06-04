const fs = require('fs');
const path = require('path');
const pagesDir = path.join('d:', 'Semester 6 Magang', 'TanakaManagementSystem', 'frontend', 'src', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

const oldBell1 = `          {/* NOTIFICATION BELL */}
          <div 
            className="relative cursor-pointer p-2 hover:bg-red-50 rounded-full transition-colors"
            onClick={() => window.location.href='/finance/approval'}
            title="Cek Approval Center"
          >
            <Bell size={22} className="text-gray-400 hover:text-red-600 transition-colors" />
          </div>`;

let changed = 0;
for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let modified = false;
  
  if (content.includes(oldBell1)) {
    content = content.replace(oldBell1, '          <NotificationBell />');
    modified = true;
  }
  
  // also check if someone has slightly different spaces
  const regex = /\{\/\* NOTIFICATION BELL \*\/}[\s\S]*?<Bell size=\{22\}.*?<\/div>/;
  if (content.match(regex)) {
    content = content.replace(regex, '<NotificationBell />');
    modified = true;
  }

  if (modified) {
    // Add import NotificationBell if not exists
    if (!content.includes('NotificationBell')) {
      content = "import NotificationBell from '../components/NotificationBell';\n" + content;
    }
    fs.writeFileSync(filePath, content);
    changed++;
    console.log('Updated ' + file + ' to use NotificationBell component');
  }
}
console.log('Total fixed: ' + changed);
