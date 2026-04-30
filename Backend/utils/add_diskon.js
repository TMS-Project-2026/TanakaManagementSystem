const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tms_db'
});
connection.query('ALTER TABLE marketing_leads ADD COLUMN diskon DECIMAL(12, 2) DEFAULT 0 AFTER harga_awal;', (err, results) => {
  if (err && err.code !== 'ER_DUP_FIELDNAME') console.error(err);
  else console.log('Column added successfully');
  connection.end();
});
