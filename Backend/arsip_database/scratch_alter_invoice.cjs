const db = require('./config/db');

db.query("ALTER TABLE invoice MODIFY COLUMN no_invoice VARCHAR(50) NULL", (err, result) => {
  if (err) {
    console.error("❌ Gagal mengupdate kolom no_invoice:", err.message);
  } else {
    console.log("✅ Sukses! Kolom no_invoice sekarang bertipe NULL (nullable).");
  }
  db.end();
  process.exit(0);
});
