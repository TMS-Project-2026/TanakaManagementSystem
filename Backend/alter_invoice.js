const db = require('./config/db');

const alter = async () => {
    try {
        await new Promise((resolve) => {
            db.query("ALTER TABLE invoice ADD COLUMN revisi_data TEXT DEFAULT NULL", () => resolve());
        });
        await new Promise((resolve) => {
            db.query("ALTER TABLE invoice ADD COLUMN revisi_alasan TEXT DEFAULT NULL", () => resolve());
        });
        console.log("Success");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
};
alter();
