const fs = require('fs');

const filesToUpdate = [
    'frontend/src/pages/MarketingOfflineTanaka.jsx',
    'frontend/src/pages/MarketingOfflineBanua.jsx'
];

filesToUpdate.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    if (!content.includes('const filteredReportComparisonData =')) {
        content = content.replace(
            /const filteredPromoStock = promoStock\.filter\(item =>[\s\S]*?\);\n/g,
            `$&
  const filteredReportComparisonData = reportComparisonData.filter(r => 
    (r.account || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
`
        );
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    } else {
        console.log(`Already present in ${file}`);
    }
});
