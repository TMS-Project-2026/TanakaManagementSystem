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
    console.error(err);
    return;
  }
  db.query("DESCRIBE marketing_orders_online", (err, cols) => {
    if (err) {
      console.error(err);
    } else {
      console.log("📋 Columns in table 'marketing_orders_online':");
      console.log(cols.map(c => ({ Field: c.Field, Type: c.Type })));
    }
    db.end();
  });
});
