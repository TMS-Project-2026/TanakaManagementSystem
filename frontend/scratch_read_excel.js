const XLSX = require('./node_modules/xlsx');
const path = require('path');

const files = [
  "C:\\Users\\uumi0\\Downloads\\data mentah 1 akun shopee.xlsx",
  "C:\\Users\\uumi0\\Downloads\\Income.sudah dilepas.id.20260401_20260430.xlsx"
];

files.forEach(file => {
  try {
    console.log("\n========================================================");
    console.log("📂 FILE:", file);
    console.log("========================================================");
    const workbook = XLSX.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    console.log("📋 Sheet Name:", sheetName);
    console.log("📝 Total Rows:", rawRows.length);
    console.log("\n🔍 FIRST 10 ROWS (FIRST 12 COLUMNS):");
    rawRows.slice(0, 10).forEach((row, i) => {
      // Clean display of empty or undefined cells
      const cells = (row || []).slice(0, 12).map(c => String(c).trim().replace(/\r?\n/g, ' '));
      console.log(`Row ${i}:`, cells);
    });
  } catch (err) {
    console.error("❌ Error reading file:", file, err.message);
  }
});
