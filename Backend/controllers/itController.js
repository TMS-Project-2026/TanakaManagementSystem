const db = require('../config/db');

exports.getDashboard = async (req, res) => {
    try {
        const promiseDb = db.promise();
        
        // Total User
        const [users] = await promiseDb.query("SELECT COUNT(*) as total FROM users");
        // User aktif hari ini (login hari ini) - asumsikan kita dapat dari log
        const [activeToday] = await promiseDb.query("SELECT COUNT(DISTINCT username) as total FROM activity_logs WHERE aktivitas LIKE '%login%' AND DATE(created_at) = CURDATE()");
        // Total Role
        const [roles] = await promiseDb.query("SELECT COUNT(DISTINCT role) as total FROM permissions");
        // Login hari ini
        const [logins] = await promiseDb.query("SELECT COUNT(*) as total FROM activity_logs WHERE aktivitas = 'login' AND DATE(created_at) = CURDATE()");
        // Total Error Log
        const [errors] = await promiseDb.query("SELECT COUNT(*) as total FROM activity_logs WHERE aktivitas LIKE '%error%' OR aktivitas LIKE '%gagal%'");
        // Backup terakhir
        const [backups] = await promiseDb.query("SELECT created_at FROM activity_logs WHERE aktivitas = 'backup_database' ORDER BY created_at DESC LIMIT 1");

        // Grafik login user mingguan
        const [loginMingguan] = await promiseDb.query(`
            SELECT DATE(created_at) as tgl, COUNT(*) as total 
            FROM activity_logs 
            WHERE aktivitas = 'login' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(created_at)
            ORDER BY tgl ASC
        `);

        // Format chart data for 7 days
        const chartData = [];
        for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const item = loginMingguan.find(m => m.tgl && m.tgl.toISOString().split('T')[0] === dateStr);
            chartData.push({
                name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
                login: item ? Number(item.total) : 0
            });
        }

        // Tabel user terbaru
        const [recentUsers] = await promiseDb.query("SELECT id_user as id, nama_lengkap as nama, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 5");
        
        // Tabel error terbaru
        const [recentErrors] = await promiseDb.query("SELECT username as user, aktivitas, created_at FROM activity_logs WHERE aktivitas LIKE '%error%' OR aktivitas LIKE '%gagal%' ORDER BY created_at DESC LIMIT 5");

        res.status(200).json({
            status: "success",
            data: {
                totalUser: users[0].total,
                activeToday: activeToday[0].total,
                totalRole: roles[0].total,
                loginToday: logins[0].total,
                totalError: errors[0].total,
                lastBackup: backups.length > 0 ? backups[0].created_at : null,
                chartData,
                recentUsers,
                recentErrors
            }
        });
    } catch (error) {
        console.error("Dashboard IT Error:", error);
        res.status(500).json({ message: error.message });
    }
};
