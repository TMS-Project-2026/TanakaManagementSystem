const db = require('../config/db');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.getBackupHistory = async (req, res) => {
    try {
        const [backups] = await db.promise().query("SELECT id, username as user, aktivitas, ip_address, created_at FROM activity_logs WHERE aktivitas LIKE 'backup_database%' ORDER BY created_at DESC LIMIT 20");
        res.status(200).json({ status: "success", data: backups });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generateBackup = async (req, res) => {
    try {
        // Asumsi DB credentials dari env atau hardcode
        const dbUser = process.env.DB_USER || 'root';
        const dbPass = process.env.DB_PASSWORD || '';
        const dbName = process.env.DB_NAME || 'tms_db';
        const dbHost = process.env.DB_HOST || 'localhost';

        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const fileName = `backup_${dbName}_${Date.now()}.sql`;
        const filePath = path.join(backupDir, fileName);

        // Command mysqldump (Pastikan mysqldump tersedia di environment server)
        const passwordFlag = dbPass ? `-p${dbPass}` : '';
        const command = `mysqldump -h ${dbHost} -u ${dbUser} ${passwordFlag} ${dbName} > ${filePath}`;

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Backup error: ${error.message}`);
                return res.status(500).json({ message: "Gagal membuat backup. Pastikan mysqldump terinstall." });
            }

            // Catat log
            await db.promise().query("INSERT INTO activity_logs (username, aktivitas, ip_address, created_at) VALUES (?, ?, ?, NOW())", ['admin_it', `backup_database: ${fileName}`, req.ip]);

            res.status(200).json({ status: "success", message: "Backup berhasil dibuat", fileName });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.downloadBackup = (req, res) => {
    const { fileName } = req.params;
    const filePath = path.join(__dirname, '../backups', fileName);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ message: "File backup tidak ditemukan" });
    }
};
