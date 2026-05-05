const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tms_db'
});

connection.query('DESCRIBE marketing_orders_offline', (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(results, null, 2));
  connection.end();
});
