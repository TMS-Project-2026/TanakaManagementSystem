const XLSX = require('./node_modules/xlsx');

const file = "C:\\Users\\uumi0\\Downloads\\data mentah 1 akun shopee.xlsx";

try {
  const workbook = XLSX.readFile(file);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  const headers = rawRows[0] || [];
  const targetColumns = ["No. Pesanan", "Nama Produk", "Harga Awal", "Harga Setelah Diskon", "Jumlah", "Dibayar Pembeli", "Diskon Dari Shopee", "Total Pembayaran"];
  const colIndices = targetColumns.map(colName => ({
    name: colName,
    idx: headers.indexOf(colName)
  }));
  
  console.log("📌 Target Column Indices:", colIndices);
  
  console.log("\n📊 DATA FOR FIRST 5 ROWS:");
  rawRows.slice(1, 6).forEach((row, rIdx) => {
    console.log(`\nRow ${rIdx + 1}:`);
    colIndices.forEach(col => {
      const val = row[col.idx];
      console.log(`  - ${col.name}: "${val}" (type: ${typeof val})`);
    });
  });
  
} catch (err) {
  console.error("❌ Error:", err.message);
}
