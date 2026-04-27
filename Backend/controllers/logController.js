const db = require('../config/db');

exports.getLogs = async (req, res) => {
    try {
        const [logs] = await db.promise().query("SELECT id, username as user, aktivitas, ip_address, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 100");
        res.status(200).json({ status: "success", data: logs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
