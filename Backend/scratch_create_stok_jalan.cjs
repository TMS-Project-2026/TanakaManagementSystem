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
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS stok_jalan (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tanggal DATE NOT NULL,
      nama_barang VARCHAR(150) NOT NULL,
      nomer_barang VARCHAR(50),
      ukuran VARCHAR(20) NOT NULL,
      stok_total INT DEFAULT 0,
      wo INT DEFAULT 0,
      proses_jahit INT DEFAULT 0,
      bordir INT DEFAULT 0,
      finishing INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Dalam Proses'
    )
  `;
  
  db.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("❌ Error creating stok_jalan table:", err.message);
    } else {
      console.log("✨ Table 'stok_jalan' created successfully or already exists!");
    }
    db.end();
  });
});
