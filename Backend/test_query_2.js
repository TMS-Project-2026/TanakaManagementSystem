require('dotenv').config();
const db = require('./config/db');
async function test() {
    try {
        const promiseDb = db.promise();
        console.log("promiseDb created");
        const [results] = await promiseDb.query("SELECT id, branch, type, qty, price_unit, total_price, potongan_shopee, hpp, total_hpp_aktual, actual, profit FROM marketing_orders_online LIMIT 5");
        console.table(results);
        
        const [totals] = await promiseDb.query("SELECT SUM(total_price) as sum_total_price, SUM(potongan_shopee) as sum_potongan, SUM(hpp) as sum_hpp, SUM(total_hpp_aktual) as sum_total_hpp_aktual, SUM(actual) as sum_actual, SUM(profit) as sum_profit FROM marketing_orders_online WHERE type = 'online'");
        console.table(totals);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
