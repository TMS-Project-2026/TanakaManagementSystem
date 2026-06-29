require('dotenv').config();
const db = require('./config/db');
async function test() {
    try {
        const promiseDb = db.promise();
        console.log("promiseDb created");
        const [results] = await promiseDb.query("SELECT id, branch, type, customer_name, qty, price_unit, total_price, potongan_shopee, hpp_aktual, hpp, total_hpp_aktual, actual, profit, order_date FROM marketing_orders_online LIMIT 10");
        console.log("query results:");
        console.table(results);
        
        const [totals] = await promiseDb.query("SELECT SUM(total_price) as sum_total_price, SUM(potongan_shopee) as sum_potongan, SUM(hpp) as sum_hpp, SUM(total_hpp_aktual) as sum_total_hpp_aktual, SUM(actual) as sum_actual, SUM(profit) as sum_profit FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua'");
        console.log("totals:");
        console.table(totals);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
