const db = require('./config/db');

const sqlStatements = [
  `ALTER TABLE marketing_orders_online 
   ADD COLUMN hpp DECIMAL(12,2) DEFAULT 0.00 AFTER hpp_aktual,
   ADD COLUMN actual_satuan DECIMAL(12,2) DEFAULT 0.00 AFTER total_hpp_aktual,
   ADD COLUMN actual DECIMAL(12,2) DEFAULT 0.00 AFTER actual_satuan,
   ADD COLUMN catatan TEXT DEFAULT NULL AFTER status;`,
   
  `UPDATE marketing_orders_online
   SET 
     hpp = qty * hpp_aktual,
     actual = total_price - potongan_shopee,
     actual_satuan = CASE WHEN qty > 0 THEN (total_price - potongan_shopee) / qty ELSE 0 END,
     profit = (total_price - potongan_shopee) - (qty * hpp_aktual);`
];

async function runMigration() {
  console.log("🚀 Starting database migration...");
  for (let i = 0; i < sqlStatements.length; i++) {
    const query = sqlStatements[i];
    try {
      await new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });
      console.log(`✅ Statement ${i + 1} executed successfully.`);
    } catch (err) {
      console.error(`❌ Statement ${i + 1} failed:`, err.message);
      db.end();
      process.exit(1);
    }
  }
  console.log("🎉 Database migration completed successfully!");
  db.end();
}

runMigration();
