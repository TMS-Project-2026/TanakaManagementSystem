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
  
  db.query("SHOW TABLES", (err, tables) => {
    if (err) {
      console.error(err);
      db.end();
      return;
    }
    
    console.log("📋 Tables in tms_db:");
    const tableNames = tables.map(row => Object.values(row)[0]);
    console.log(tableNames);
    
    let pending = tableNames.length;
    if (pending === 0) {
      db.end();
      return;
    }
    
    tableNames.forEach(tbl => {
      db.query(`DESCRIBE ${tbl}`, (err, cols) => {
        if (!err) {
          const colNames = cols.map(c => c.Field);
          // Check if it has columns related to our import fields
          const matches = colNames.filter(c => ['id_order', 'item_description', 'total_harga', 'input_by', 'tanggal'].includes(c.toLowerCase()));
          if (matches.length > 0) {
            console.log(`\n✨ Table "${tbl}" has matching columns:`, colNames);
          }
        } else {
          console.error(`Error describing table ${tbl}:`, err.message);
        }
        pending--;
        if (pending === 0) {
          db.end();
        }
      });
    });
  });
});
