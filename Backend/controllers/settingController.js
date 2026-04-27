const db = require('../config/db');

exports.getSettings = async (req, res) => {
    try {
        const [settings] = await db.promise().query("SELECT * FROM system_settings LIMIT 1");
        
        if (settings.length > 0) {
            res.status(200).json({ status: "success", data: settings[0] });
        } else {
            // Default settings if empty
            res.status(200).json({ 
                status: "success", 
                data: {
                    nama_aplikasi: "Tanaka Management System",
                    logo: "",
                    warna_tema: "#990000",
                    timezone: "Asia/Jakarta",
                    maintenance_mode: 0
                }
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { nama_aplikasi, logo, warna_tema, timezone, maintenance_mode } = req.body;
        const promiseDb = db.promise();
        
        const [existing] = await promiseDb.query("SELECT id FROM system_settings LIMIT 1");
        
        if (existing.length > 0) {
            await promiseDb.query("UPDATE system_settings SET nama_aplikasi=?, logo=?, warna_tema=?, timezone=?, maintenance_mode=? WHERE id=?",
                [nama_aplikasi, logo, warna_tema, timezone, maintenance_mode, existing[0].id]);
        } else {
            await promiseDb.query("INSERT INTO system_settings (nama_aplikasi, logo, warna_tema, timezone, maintenance_mode) VALUES (?, ?, ?, ?, ?)",
                [nama_aplikasi, logo, warna_tema, timezone, maintenance_mode]);
        }
        
        await promiseDb.query("INSERT INTO activity_logs (username, aktivitas, ip_address, created_at) VALUES (?, ?, ?, NOW())", ['admin_it', `Memperbarui pengaturan sistem`, req.ip]);

        res.status(200).json({ status: "success", message: "Pengaturan berhasil disimpan" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
