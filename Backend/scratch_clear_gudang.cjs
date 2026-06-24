const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error database connection:", err.message);
    process.exit(1);
  }
  
  const tablesToClear = [
    'stok',
    'barang_masuk',
    'barang_keluar',
    'mutasi_barang',
    'permintaan_stok',
    'sparepart',
    'stok_jalan'
  ];

  db.query("SET FOREIGN_KEY_CHECKS = 0;", (err) => {
    if (err) throw err;
    
    let pending = tablesToClear.length;
    
    tablesToClear.forEach(table => {
      db.query(`TRUNCATE TABLE ${table}`, (err) => {
        if (err) {
          console.error(`Error truncating ${table}:`, err.message);
        } else {
          console.log(`✅ Table ${table} has been cleared.`);
        }
        
        pending--;
        if (pending === 0) {
          db.query("SET FOREIGN_KEY_CHECKS = 1;", (err) => {
            if (err) throw err;
            console.log("🎉 All Gudang dummy data deleted successfully!");
            db.end();
          });
        }
      });
    });
  });
});
