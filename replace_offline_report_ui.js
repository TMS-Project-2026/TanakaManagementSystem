const fs = require('fs');

const onlineFile = fs.readFileSync('frontend/src/pages/MarketingOnlineBanua.jsx', 'utf8');

const startIndex = onlineFile.indexOf("{activeTab === 'reports' && (");
const endIndex = onlineFile.indexOf("{/* TAB: PROMO ONLINE */}");
if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find reports UI block in MarketingOnlineBanua.jsx');
    process.exit(1);
}

// Extract block
let reportsUiBlock = onlineFile.substring(startIndex, endIndex).trim();

// Because the online version uses `globalMonthlyTarget` and other things, ensure no "Online" specific labels are hardcoded if they don't apply.
reportsUiBlock = reportsUiBlock.replace(/Laporan Tahunan Online/g, "Laporan Tahunan");
reportsUiBlock = reportsUiBlock.replace(/Laporan Bulanan Online/g, "Laporan Bulanan");
reportsUiBlock = reportsUiBlock.replace(/Laporan Bulan Berjalan Online/g, "Laporan Bulan Berjalan");
reportsUiBlock = reportsUiBlock.replace(/Laporan Harian Online/g, "Laporan Harian");

const filesToUpdate = [
    'frontend/src/pages/MarketingOfflineTanaka.jsx',
    'frontend/src/pages/MarketingOfflineBanua.jsx'
];

filesToUpdate.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Find the corresponding block in the offline file
    const searchString = "{activeTab === 'reports' && (";
    const lastIndexStart = content.lastIndexOf(searchString); // The one inside the main content area
    const searchEndString = "{/* === TAB PROMO === */}";
    const endBlockIndex = content.indexOf(searchEndString, lastIndexStart);
    
    if (lastIndexStart !== -1 && endBlockIndex !== -1) {
        content = content.substring(0, lastIndexStart) + reportsUiBlock + '\n\n                ' + content.substring(endBlockIndex);
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    } else {
        console.error(`Could not find reports UI block boundaries in ${file}`);
    }
});
