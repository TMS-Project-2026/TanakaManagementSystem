const XLSX = require('./node_modules/xlsx');

const file = "C:\\Users\\uumi0\\Downloads\\MARKETING ONLINE BANUA.xlsx";

try {
  const workbook = XLSX.readFile(file);
  
  ["DATA MENTAH", "HPP"].forEach(sheetName => {
    console.log(`\n========================================================`);
    console.log(`📋 SHEET: ${sheetName}`);
    console.log(`========================================================`);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      console.log("❌ Sheet not found!");
      return;
    }
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log("Total Rows in sheet:", rawRows.length);
    
    // Find header row or just print first 5 rows
    rawRows.slice(0, 5).forEach((row, rIdx) => {
      console.log(`Row ${rIdx}:`, (row || []).slice(0, 15).map(c => String(c).trim().replace(/\r?\n/g, ' ')));
    });
  });
} catch (err) {
  console.error("❌ Error:", err.message);
}
