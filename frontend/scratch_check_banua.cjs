const XLSX = require('./node_modules/xlsx');

const file = "C:\\Users\\uumi0\\Downloads\\MARKETING ONLINE BANUA.xlsx";

try {
  const workbook = XLSX.readFile(file);
  console.log("📋 Sheet Names in MARKETING ONLINE BANUA.xlsx:", workbook.SheetNames);
  
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const headers = rawRows[0] || [];
  
  console.log("Total Columns:", headers.length);
  headers.forEach((h, idx) => {
    console.log(`Column ${idx}: "${h}"`);
  });
  
  if (rawRows.length > 1) {
    console.log("\n🔍 Row 1 values:");
    rawRows[1].slice(0, 15).forEach((val, idx) => {
      console.log(`  - Col ${idx} (${headers[idx]}): "${val}" (type: ${typeof val})`);
    });
  }
} catch (err) {
  console.error("❌ Error:", err.message);
}
