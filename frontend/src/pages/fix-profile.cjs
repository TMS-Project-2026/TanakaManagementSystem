const fs = require('fs');
const path = require('path');
const dir = 'd:/Semester 6 Magang/TanakaManagementSystem/frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const regex1 = /<p className="text-sm font-black text-gray-900">Admin<\/p>\s*<p className="text-\[10px\] font-bold text-\[.*\] uppercase tracking-wider mt-0\.5">.*?<\/p>/g;
const replace1 = `<p className="text-sm font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || '').replace('_', ' ')}</p>`;

let changed = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(regex1, replace1);
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    changed++;
    console.log('Updated', file);
  }
}
console.log('Total files updated:', changed);
