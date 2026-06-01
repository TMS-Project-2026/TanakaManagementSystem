const fs = require('fs');

const onlineFile = fs.readFileSync('frontend/src/pages/MarketingOnlineBanua.jsx', 'utf8');

// Extract reports UI from online file
const uiStartIndex = onlineFile.indexOf("{activeTab === 'reports' && (");
// The end is before TAB: PROMO ONLINE, but to be safe we'll use a better marker
const endMarkerOnline = "{/* TAB: PROMO ONLINE */}";
const uiEndIndex = onlineFile.indexOf(endMarkerOnline);
let reportsUiBlock = onlineFile.substring(uiStartIndex, uiEndIndex).trim();

// Remove specific online references
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

    // Fix startDate
    content = content.replace(/new Date\(new Date\(\)\.getFullYear\(\), new Date\(\)\.getMonth\(\), 1\)/g, "new Date(new Date().getFullYear(), 0, 1)");

    // Add missing states
    if (!content.includes('const [globalMonthlyTarget')) {
        content = content.replace(
            /const \[filterDate2, setFilterDate2\] = useState.*?\n/g,
            `$&  const [filterDateEnd, setFilterDateEnd] = useState(new Date().toISOString().split('T')[0]);\n  const [filterDateEnd2, setFilterDateEnd2] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; });\n  const [globalMonthlyTarget, setGlobalMonthlyTarget] = useState(50000000);\n  const [globalYearlyTarget, setGlobalYearlyTarget] = useState(600000000);\n  const [dailyTargets, setDailyTargets] = useState({});\n`
        );
    }

    // Replace fetchReports block
    const newFetchReports = `
  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const getCategoryForItem = (itemName) => {
        if (!itemName) return 'Lain-lain';
        const name = itemName.toLowerCase().trim();
        if (name.includes('wearpack')) return 'Wearpack';
        if (name.includes('seragam')) return 'Seragam';
        if (name.includes('jaket')) return 'Jaket';
        if (name.includes('jas')) return 'Jas';
        if (name.includes('celana')) return 'Celana';
        if (name.includes('kaos')) return 'Kaos';
        if (name.includes('kemeja')) return 'Kemeja';
        if (name.includes('baju')) return 'Baju';
        if (name.includes('sepatu')) return 'Sepatu';
        if (name.includes('topi')) return 'Topi';
        if (name.includes('dasi')) return 'Dasi';
        if (name.includes('sarung tangan')) return 'Sarung Tangan';
        if (name.includes('ikat pinggang')) return 'Ikat Pinggang';
        const firstWord = itemName.trim().split(' ')[0];
        return firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase() : 'Lain-lain';
      };

      const getOrderItemsWithCategory = (order) => {
        let parsedItems = [];
        try {
          parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        } catch (e) {
          parsedItems = [];
        }
        if (parsedItems.length === 0) {
          parsedItems = [{
            rincian: order.produk || 'Produk Tidak Diketahui',
            qty: parseInt(order.qty) || 1,
            harga_satuan: parseFloat(order.harga) || 0,
            total: parseFloat(order.grand_total) || 0
          }];
        }
        return parsedItems.map(item => {
          const itemName = item.rincian || item.nama_barang || 'Produk Tidak Diketahui';
          const category = getCategoryForItem(itemName);
          const qty = parseInt(item.qty) || 0;
          const total = parseFloat(item.total) || (qty * (parseFloat(item.harga_satuan) || 0));
          return { category, qty, total };
        });
      };

      const branchSlug = '${file.includes('Tanaka') ? 'marketing-offline-tanaka' : 'marketing-offline-banua'}';
      const res = await axios.get(\`http://localhost:3000/api/\${branchSlug}/orders\`, { headers: { Authorization: \`Bearer \${token}\` } });
      const allOrders = res.data || [];

      // Dapatkan semua kategori
      const allCategories = new Set();
      allOrders.forEach(o => {
        const mappedItems = getOrderItemsWithCategory(o);
        mappedItems.forEach(item => allCategories.add(item.category));
      });
      const categoriesList = [...allCategories];

      if (reportSubTab === 'harian') {
        const dailyData = [];

        const getDailyRevenue = (orders, category, targetDateStr) => {
          if (!targetDateStr) return 0;
          const targetDate = new Date(targetDateStr);
          const targetYear = targetDate.getFullYear();
          const targetMonth = targetDate.getMonth();
          const targetDay = targetDate.getDate();

          let totalRevenue = 0;
          orders.forEach(o => {
            const od = new Date(o.created_at);
            if (od.getFullYear() === targetYear && od.getMonth() === targetMonth && od.getDate() === targetDay) {
              const mappedItems = getOrderItemsWithCategory(o);
              mappedItems.forEach(item => {
                if (item.category === category) totalRevenue += item.total;
              });
            }
          });
          return totalRevenue;
        };

        categoriesList.forEach(acc => {
          const rev = getDailyRevenue(allOrders, acc, filterDate1);
          const target = dailyTargets[acc] || 2000000;
          const ach = target > 0 ? (rev / target) * 100 : 0;

          if (rev > 0 || target > 0) {
            dailyData.push({
              account: acc,
              revenue: rev,
              target: target,
              achievement: ach
            });
          }
        });

        dailyData.sort((a, b) => b.revenue - a.revenue);
        setReportComparisonData(dailyData);
      } else if (reportSubTab === 'berjalan') {
        const dailyData = [];

        const getRangeRevenue = (orders, category, startDateStr, endDateStr) => {
          if (!startDateStr || !endDateStr) return 0;
          const startDate = new Date(startDateStr);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(endDateStr);
          endDate.setHours(23, 59, 59, 999);

          let totalRevenue = 0;
          orders.forEach(o => {
            const orderDate = new Date(o.created_at);
            if (orderDate >= startDate && orderDate <= endDate) {
              const mappedItems = getOrderItemsWithCategory(o);
              mappedItems.forEach(item => {
                if (item.category === category) totalRevenue += item.total;
              });
            }
          });
          return totalRevenue;
        };

        categoriesList.forEach(acc => {
          const mtd1Revenue = getRangeRevenue(allOrders, acc, filterDate1, filterDateEnd);
          const mtd2Revenue = getRangeRevenue(allOrders, acc, filterDate2, filterDateEnd2);
          const achievement = mtd2Revenue > 0 ? (mtd1Revenue / mtd2Revenue) * 100 : (mtd1Revenue > 0 ? 100 : 0);
          if (mtd1Revenue > 0 || mtd2Revenue > 0) {
            dailyData.push({
              account: acc,
              date1: filterDate1,
              date1End: filterDateEnd,
              date2: filterDate2,
              date2End: filterDateEnd2,
              revenue: mtd1Revenue,
              prevRevenue: mtd2Revenue,
              achievement: achievement
            });
          }
        });

        dailyData.sort((a, b) => b.revenue - a.revenue);
        setReportComparisonData(dailyData);
      } else if (reportSubTab === 'tahunan') {
        const today = new Date();
        const limitMonth = today.getMonth();
        const limitDay = today.getDate();

        const y1 = new Date(filterDate1).getFullYear();
        const y2 = new Date(filterDate2).getFullYear();

        const getYearlyYtdOnlineRevenue = (orders, category, yearNum) => {
          let totalRevenue = 0;
          orders.forEach(o => {
            const od = new Date(o.created_at);
            if (od.getFullYear() !== yearNum) return;
            if (od.getMonth() < limitMonth || (od.getMonth() === limitMonth && od.getDate() <= limitDay)) {
              const mappedItems = getOrderItemsWithCategory(o);
              mappedItems.forEach(item => {
                if (item.category === category) totalRevenue += item.total;
              });
            }
          });
          return totalRevenue;
        };

        const yearlyData = [];
        categoriesList.forEach(acc => {
          const v1 = getYearlyYtdOnlineRevenue(allOrders, acc, y1);
          const v2 = getYearlyYtdOnlineRevenue(allOrders, acc, y2);
          const achievement = v2 > 0 ? (v1 / v2) * 100 : (v1 > 0 ? 100 : 0);

          if (v1 > 0 || v2 > 0) {
            yearlyData.push({
              account: acc,
              date1: \`\${y1}\`,
              date2: \`\${y2}\`,
              val1: v1,
              val2: v2,
              revenue: v1,
              prevRevenue: v2,
              growth: achievement
            });
          }
        });

        yearlyData.sort((a, b) => b.val1 - a.val1);
        setReportComparisonData(yearlyData);
      } else {
        const startCurrent = new Date(filterDate1);
        startCurrent.setHours(0, 0, 0, 0);
        const endCurrent = new Date(filterDateEnd);
        endCurrent.setHours(23, 59, 59, 999);

        const startPrevMonth = new Date(startCurrent);
        startPrevMonth.setMonth(startPrevMonth.getMonth() - 1);
        if (startPrevMonth.getDate() !== startCurrent.getDate()) startPrevMonth.setDate(0);

        const endPrevMonth = new Date(endCurrent);
        endPrevMonth.setMonth(endPrevMonth.getMonth() - 1);
        if (endPrevMonth.getDate() !== endCurrent.getDate()) endPrevMonth.setDate(0);

        const startPrevYear = new Date(startCurrent);
        startPrevYear.setFullYear(startPrevYear.getFullYear() - 1);
        if (startPrevYear.getDate() !== startCurrent.getDate()) startPrevYear.setDate(0);

        const endPrevYear = new Date(endCurrent);
        endPrevYear.setFullYear(endPrevYear.getFullYear() - 1);
        if (endPrevYear.getDate() !== endCurrent.getDate()) endPrevYear.setDate(0);

        const finalReport = [];

        categoriesList.forEach(acc => {
          let currentRev = 0;
          let prevMonthRev = 0;
          let prevYearRev = 0;

          allOrders.forEach(order => {
            const orderDate = new Date(order.created_at);
            const mappedItems = getOrderItemsWithCategory(order);
            const itemRev = mappedItems.filter(i => i.category === acc).reduce((sum, i) => sum + i.total, 0);

            if (itemRev > 0) {
              if (orderDate >= startCurrent && orderDate <= endCurrent) currentRev += itemRev;
              if (orderDate >= startPrevMonth && orderDate <= endPrevMonth) prevMonthRev += itemRev;
              if (orderDate >= startPrevYear && orderDate <= endPrevYear) prevYearRev += itemRev;
            }
          });

          if (currentRev > 0 || prevMonthRev > 0 || prevYearRev > 0) {
            finalReport.push({
              account: acc,
              currentRevenue: currentRev,
              dateCurrent: filterDate1,
              dateCurrentEnd: filterDateEnd,
              comparisons: [
                { id: 'target', title: 'Target', compareValue: 0 },
                { 
                  id: 'prev_month', title: 'Bulan Sebelumnya', compareValue: prevMonthRev, 
                  dateCompare: new Date(startPrevMonth.getTime() - startPrevMonth.getTimezoneOffset() * 60000).toISOString().split('T')[0], 
                  dateCompareEnd: new Date(endPrevMonth.getTime() - endPrevMonth.getTimezoneOffset() * 60000).toISOString().split('T')[0] 
                },
                { 
                  id: 'prev_year', title: 'Tahun Lalu', compareValue: prevYearRev, 
                  dateCompare: new Date(startPrevYear.getTime() - startPrevYear.getTimezoneOffset() * 60000).toISOString().split('T')[0], 
                  dateCompareEnd: new Date(endPrevYear.getTime() - endPrevYear.getTimezoneOffset() * 60000).toISOString().split('T')[0] 
                }
              ]
            });
          }
        });
        
        finalReport.sort((a, b) => b.currentRevenue - a.currentRevenue);
        setReportComparisonData(finalReport);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
`;

    content = content.replace(/const fetchReports = async \(\) => \{[\s\S]*?catch \(err\) \{ console\.error\(err\); \} finally \{ setLoading\(false\); \}\n  \};/g, newFetchReports.trim());

    // Replace UI for Reports
    const contentAreaStartIndex = content.indexOf("<div className=\"w-full\">");
    
    // Find {activeTab === 'reports' && ( after the content area starts
    const offStartIndex = content.indexOf("{activeTab === 'reports' && (", contentAreaStartIndex);
    const offEndMarker = "{/* === TAB PROMO === */}";
    const offEndIndex = content.indexOf(offEndMarker, offStartIndex);

    if (offStartIndex !== -1 && offEndIndex !== -1) {
        content = content.substring(0, offStartIndex) + reportsUiBlock + '\n\n                ' + content.substring(offEndIndex);
    } else {
        console.error("Failed to find UI block boundaries in " + file);
    }

    // Add filteredReportComparisonData
    if (!content.includes('const filteredReportComparisonData =')) {
        content = content.replace(
            /const filteredPromoStock = promoStock\.filter\(item =>[\s\S]*?\);\n/g,
            `$&
  const filteredReportComparisonData = reportComparisonData.filter(r => 
    (r.account || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
`
        );
    }

    // Add imports for recharts
    if (!content.includes('BarChart, Bar, Legend')) {
        content = content.replace(
            /AreaChart, Area, LineChart, Line\n/g,
            `AreaChart, Area, LineChart, Line, BarChart, Bar, Legend\n`
        );
    }

    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
});
