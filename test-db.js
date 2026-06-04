const db = require('./Backend/config/db');
async function test() {
    try {
        const promiseDb = db.promise();
        console.log("promiseDb created");
        const [results] = await promiseDb.query("SELECT 1");
        console.log("query executed", results);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
