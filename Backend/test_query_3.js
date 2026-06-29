require('dotenv').config();
const db = require('./config/db');
async function test() {
    try {
        const promiseDb = db.promise();
        const [columns] = await promiseDb.query("SHOW COLUMNS FROM stok");
        console.table(columns);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
