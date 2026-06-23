const db = require('./config/db');
db.query("DESCRIBE marketing_quotations", (err, res) => {
    if(err) console.error(err);
    else console.log(res);
    process.exit(0);
});
