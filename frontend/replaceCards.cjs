const fs = require('fs');
const path = require('path');
const pagesDir = path.join('d:', 'Semester 6 Magang', 'TanakaManagementSystem', 'frontend', 'src', 'pages');

const filesToUpdate = [
    'GudangDashboard.jsx',
    'MarketingOnlineBanua.jsx',
    'MarketingOfflineBanua.jsx',
    'MarketingOfflineTanaka.jsx',
    'Dashboard.jsx',
    'OwnerDashboard.jsx'
];

let changedCount = 0;

const newBlock = `<div
                        key={index}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 border-l-[6px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md min-h-[120px]"
                      >
                        <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">{card.title || card.label}</p>
                        <h3 className="text-2xl font-black text-gray-900 leading-tight">{card.value}</h3>
                        {card.sub && <p className="text-[11px] mt-2 font-medium text-gray-400">{card.sub}</p>}
                      </div>`;

for (const file of filesToUpdate) {
    const filePath = path.join(pagesDir, file);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Using a more permissive regex that matches the <div key={index}... through the closing </div>
    const regexToReplace = /<div\s+key=\{index\}\s+className=\{`\$\{card\.bg\}[^>]+>\s*<p\s+className=\{[^>]+>\{card\.title\}<\/p>\s*<h3\s+className=\{[^>]+>\{card\.value\}<\/h3>\s*<\/div>/g;

    let matched = false;
    content = content.replace(regexToReplace, () => {
        matched = true;
        return newBlock;
    });

    if (matched) {
        fs.writeFileSync(filePath, content);
        changedCount++;
        console.log(`Updated cards in ${file}`);
    } else {
        console.log(`Could not match exactly in ${file}, maybe different structure.`);
    }
}

console.log(`Total updated: ${changedCount}`);
