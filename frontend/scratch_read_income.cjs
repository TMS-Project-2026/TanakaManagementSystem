const XLSX = require('./node_modules/xlsx');

const file = "C:\\Users\\uumi0\\Downloads\\Income.sudah dilepas.id.20260401_20260430.xlsx";

try {
  console.log("📂 SCANNING ALL SHEETS OF:", file);
  const workbook = XLSX.readFile(file);
  console.log("📋 Sheet Names found:", workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log("\n------------------------------------------------");
    console.log(`Sheet: ${sheetName}`);
    console.log("------------------------------------------------");
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    console.log(`Total Rows in sheet ${sheetName}: ${rawRows.length}`);
    
    // Scan all rows to find any row that contains column headers (like 'No. Pesanan' or 'No. Transaksi' or 'Harga')
    let foundHeaderRow = -1;
    for (let i = 0; i < Math.min(rawRows.length, 60); i++) {
      const row = rawRows[i] || [];
      const rowText = row.map(v => String(v).toLowerCase());
      if (rowText.includes('no. pesanan') || rowText.includes('id pesanan') || rowText.includes('harga asli') || rowText.includes('penghasilan')) {
        console.log(`🎯 Potential Header Row at Row ${i}:`, row.slice(0, 15));
        foundHeaderRow = i;
      }
    }

    if (foundHeaderRow !== -1) {
      console.log("\n🔍 Data rows below header row:");
      for (let j = foundHeaderRow + 1; j < Math.min(foundHeaderRow + 10, rawRows.length); j++) {
        console.log(`Row ${j}:`, (rawRows[j] || []).slice(0, 15).map(c => String(c).trim().replace(/\r?\n/g, ' ')));
      }
    } else {
      console.log("\n🔍 Print rows 15 to 40 directly:");
      rawRows.slice(15, 40).forEach((row, i) => {
        const cells = (row || []).slice(0, 15).map(c => String(c).trim().replace(/\r?\n/g, ' '));
        console.log(`Row ${i + 15}:`, cells);
      });
    }
  });

} catch (err) {
  console.error("❌ Error:", err.message);
}
