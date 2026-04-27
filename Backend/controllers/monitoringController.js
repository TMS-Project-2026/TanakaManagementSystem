const os = require('os');
const db = require('../config/db');

exports.getMonitoringStats = async (req, res) => {
    try {
        // Status Database
        let dbStatus = "Disconnected";
        try {
            await db.promise().query("SELECT 1");
            dbStatus = "Connected";
        } catch(e) {
            dbStatus = "Error";
        }

        // Penggunaan Memory
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);

        // Uptime Server (OS & Node)
        const osUptime = os.uptime(); // seconds
        const nodeUptime = process.uptime(); // seconds

        // CPU Usage (Simple calculation)
        const cpus = os.cpus();
        let idle = 0;
        let total = 0;
        cpus.forEach(cpu => {
            for (let type in cpu.times) {
                total += cpu.times[type];
            }
            idle += cpu.times.idle;
        });
        const cpuUsagePercent = (100 - ~~(100 * idle / total)).toFixed(2);

        res.status(200).json({
            status: "success",
            data: {
                database_status: dbStatus,
                server_status: "Online",
                storage_usage: "N/A", // Membutuhkan lib tambahan untuk cek disk space
                memory_usage: {
                    percent: memoryUsagePercent,
                    used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + " GB",
                    total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + " GB"
                },
                cpu_usage: `${cpuUsagePercent}%`,
                uptime: {
                    os: formatUptime(osUptime),
                    node: formatUptime(nodeUptime)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
}
