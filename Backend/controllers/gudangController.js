const db = require('../config/db');

exports.getDashboard = async (req, res) => {
    try {
        const promiseDb = db.promise();
        
        // Total item barang (unique product names)
        const [totalItemResult] = await promiseDb.query("SELECT COUNT(DISTINCT nama_barang) as total FROM stok");
        const totalItem = totalItemResult[0].total;

        // Total stok keseluruhan
        const [totalStokResult] = await promiseDb.query("SELECT SUM(jumlah) as total FROM stok");
        const totalStok = totalStokResult[0].total || 0;

        // Barang masuk hari ini
        const [masukHariIniResult] = await promiseDb.query("SELECT SUM(jumlah) as total FROM barang_masuk WHERE DATE(tanggal) = CURDATE()");
        const masukHariIni = masukHariIniResult[0].total || 0;

        // Barang keluar hari ini
        const [keluarHariIniResult] = await promiseDb.query("SELECT SUM(jumlah) as total FROM barang_keluar WHERE DATE(tanggal) = CURDATE()");
        const keluarHariIni = keluarHariIniResult[0].total || 0;

        // Jumlah stok menipis
        const [stokMenipisResult] = await promiseDb.query("SELECT COUNT(*) as total FROM stok WHERE jumlah <= minimum_stok");
        const stokMenipisCount = stokMenipisResult[0].total;

        // Total suku cadang (sparepart)
        const [totalSparepartResult] = await promiseDb.query("SELECT SUM(jumlah) as total FROM sparepart");
        const totalSparepart = totalSparepartResult[0].total || 0;

        // Grafik: Pergerakan barang masuk & keluar mingguan (7 hari terakhir)
        const [masukMingguan] = await promiseDb.query(`
            SELECT DATE(tanggal) as tgl, SUM(jumlah) as total 
            FROM barang_masuk 
            WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(tanggal)
            ORDER BY tgl ASC
        `);

        const [keluarMingguan] = await promiseDb.query(`
            SELECT DATE(tanggal) as tgl, SUM(jumlah) as total 
            FROM barang_keluar 
            WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(tanggal)
            ORDER BY tgl ASC
        `);

        // Format chart data for the last 7 days
        const chartData = [];
        for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            const masukItem = masukMingguan.find(m => m.tgl.toISOString().split('T')[0] === dateStr);
            const keluarItem = keluarMingguan.find(k => k.tgl.toISOString().split('T')[0] === dateStr);
            
            chartData.push({
                name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
                masuk: masukItem ? Number(masukItem.total) : 0,
                keluar: keluarItem ? Number(keluarItem.total) : 0
            });
        }

        // Tabel: Daftar barang hampir habis
        const [hampirHabis] = await promiseDb.query(`
            SELECT nama_barang, jumlah, cabang_id, minimum_stok 
            FROM stok 
            WHERE jumlah <= minimum_stok 
            ORDER BY jumlah ASC 
            LIMIT 5
        `);

        res.status(200).json({
            status: "success",
            data: {
                totalItem,
                totalStok,
                masukHariIni,
                keluarHariIni,
                stokMenipisCount,
                totalSparepart,
                chartData,
                hampirHabis
            }
        });
    } catch (error) {
        console.error("Dashboard Gudang Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getWarningStok = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const sql = "SELECT * FROM stok WHERE jumlah <= minimum_stok ORDER BY jumlah ASC";
        const [results] = await promiseDb.query(sql);
        res.status(200).json({ status: "success", data: results });
    } catch (error) {
        console.error("Warning Stok Error:", error);
        res.status(500).json({ message: error.message });
    }
};
