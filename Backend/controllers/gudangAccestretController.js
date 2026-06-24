const db = require('../config/db');

const BRANCH = 'Accestret';

exports.getDashboard = async (req, res) => {
    try {
        const promiseDb = db.promise();

        // Total item barang Accestret
        const [totalItemResult] = await promiseDb.query(
            "SELECT COUNT(DISTINCT nama_barang) as total FROM stok WHERE cabang_id = ?", [BRANCH]
        );
        const totalItem = totalItemResult[0].total;

        // Total stok Accestret
        const [totalStokResult] = await promiseDb.query(
            "SELECT SUM(jumlah) as total FROM stok WHERE cabang_id = ?", [BRANCH]
        );
        const totalStok = totalStokResult[0].total || 0;

        // Barang masuk hari ini (Accestret)
        const [masukHariIniResult] = await promiseDb.query(
            "SELECT SUM(jumlah) as total FROM barang_masuk WHERE DATE(tanggal) = CURDATE() AND cabang_id = ?", [BRANCH]
        );
        const masukHariIni = masukHariIniResult[0].total || 0;

        // Barang keluar hari ini (Accestret)
        const [keluarHariIniResult] = await promiseDb.query(
            "SELECT SUM(jumlah) as total FROM barang_keluar WHERE DATE(tanggal) = CURDATE() AND cabang_id = ?", [BRANCH]
        );
        const keluarHariIni = keluarHariIniResult[0].total || 0;

        // Stok menipis (Accestret)
        const [stokMenipisResult] = await promiseDb.query(
            "SELECT COUNT(*) as total FROM stok WHERE jumlah <= minimum_stok AND cabang_id = ?", [BRANCH]
        );
        const stokMenipisCount = stokMenipisResult[0].total;

        // Grafik 7 hari terakhir (Accestret)
        const [masukMingguan] = await promiseDb.query(`
            SELECT DATE(tanggal) as tgl, SUM(jumlah) as total
            FROM barang_masuk
            WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND cabang_id = ?
            GROUP BY DATE(tanggal) ORDER BY tgl ASC
        `, [BRANCH]);

        const [keluarMingguan] = await promiseDb.query(`
            SELECT DATE(tanggal) as tgl, SUM(jumlah) as total
            FROM barang_keluar
            WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND cabang_id = ?
            GROUP BY DATE(tanggal) ORDER BY tgl ASC
        `, [BRANCH]);

        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const masukItem  = masukMingguan.find(m => m.tgl.toISOString().split('T')[0] === dateStr);
            const keluarItem = keluarMingguan.find(k => k.tgl.toISOString().split('T')[0] === dateStr);
            chartData.push({
                name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
                masuk:  masukItem  ? Number(masukItem.total)  : 0,
                keluar: keluarItem ? Number(keluarItem.total) : 0
            });
        }

        // Barang hampir habis (Accestret)
        const [hampirHabis] = await promiseDb.query(`
            SELECT nama_barang, jumlah, cabang_id, minimum_stok
            FROM stok
            WHERE jumlah <= minimum_stok AND cabang_id = ?
            ORDER BY jumlah ASC LIMIT 5
        `, [BRANCH]);

        res.status(200).json({
            status: "success",
            data: { totalItem, totalStok, masukHariIni, keluarHariIni, stokMenipisCount, chartData, hampirHabis }
        });
    } catch (error) {
        console.error("Dashboard Gudang Accestret Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAnalisis = async (req, res) => {
    try {
        const promiseDb = db.promise();

        // Fast Moving: barang paling banyak keluar 30 hari (Accestret)
        const [fastMoving] = await promiseDb.query(`
            SELECT bk.nama_barang, SUM(bk.jumlah) as total_terjual,
                   COALESCE((SELECT SUM(s.jumlah) FROM stok s WHERE s.nama_barang = bk.nama_barang AND s.cabang_id = ?), 0) as jumlah
            FROM barang_keluar bk
            WHERE bk.tanggal >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND bk.cabang_id = ?
            GROUP BY bk.nama_barang
            ORDER BY total_terjual DESC LIMIT 10
        `, [BRANCH, BRANCH]);

        // Dead Stock: barang tidak pernah keluar > 60 hari (Accestret)
        const [deadStock] = await promiseDb.query(`
            SELECT s.nama_barang, SUM(s.jumlah) as jumlah
            FROM stok s
            WHERE s.cabang_id = ?
              AND s.nama_barang NOT IN (
                SELECT DISTINCT nama_barang FROM barang_keluar
                WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND cabang_id = ?
              )
            GROUP BY s.nama_barang
            HAVING jumlah > 0
            ORDER BY jumlah DESC LIMIT 10
        `, [BRANCH, BRANCH]);

        res.status(200).json({ status: "success", data: { fastMoving, deadStock } });
    } catch (error) {
        console.error("Analisis Gudang Accestret Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getWarningStok = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const [results] = await promiseDb.query(
            "SELECT * FROM stok WHERE jumlah <= minimum_stok AND cabang_id = ? ORDER BY jumlah ASC", [BRANCH]
        );
        res.status(200).json({ status: "success", data: results });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
