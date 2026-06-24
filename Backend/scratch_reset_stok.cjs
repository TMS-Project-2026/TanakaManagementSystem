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
  
  db.query("UPDATE stok SET jumlah = 0", (err, result) => {
    if (err) {
      console.error(err);
      db.end();
      return;
    }
    
    console.log(`✅ Updated ${result.affectedRows} rows in stok table.`);
    db.end();
  });
});
