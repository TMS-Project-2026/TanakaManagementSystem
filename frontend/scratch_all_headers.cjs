const XLSX = require('./node_modules/xlsx');

const file1 = "C:\\Users\\uumi0\\Downloads\\data mentah 1 akun shopee.xlsx";
const file2 = "C:\\Users\\uumi0\\Downloads\\Income.sudah dilepas.id.20260401_20260430.xlsx";

try {
  console.log("\n========================================================");
  console.log("📂 ALL HEADERS IN: data mentah 1 akun shopee.xlsx");
  console.log("========================================================");
  const wb1 = XLSX.readFile(file1);
  const ws1 = wb1.Sheets[wb1.SheetNames[0]];
  const rows1 = XLSX.utils.sheet_to_json(ws1, { header: 1 });
  const headers1 = rows1[0] || [];
  console.log("Total Columns:", headers1.length);
  headers1.forEach((h, idx) => {
    console.log(`Column ${idx}: "${h}"`);
  });

  console.log("\n========================================================");
  console.log("📂 ALL HEADERS IN: Income (Income.sudah dilepas.id.20260401_20260430.xlsx)");
  console.log("========================================================");
  const wb2 = XLSX.readFile(file2);
  const ws2 = wb2.Sheets['Income'];
  const rows2 = XLSX.utils.sheet_to_json(ws2, { header: 1 });
  const headers2 = rows2[5] || [];
  console.log("Total Columns:", headers2.length);
  headers2.forEach((h, idx) => {
    console.log(`Column ${idx}: "${h}"`);
  });

} catch (err) {
  console.error("❌ Error:", err.message);
}
