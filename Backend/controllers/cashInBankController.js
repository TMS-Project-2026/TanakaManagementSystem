const db = require('../config/db');

// helper function to run queries with promises
const queryAsync = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
    });
});

exports.getAll = async (req, res) => {
    try {
        // Automatically update Overdue status
        await queryAsync(
            `UPDATE cash_in_bank SET status = 'Overdue' WHERE status IN ('Pending', 'Unpaid') AND due_date < CURDATE()`
        );

        let sql = 'SELECT * FROM cash_in_bank WHERE 1=1';
        let params = [];
        
        const { search, bank, status, cabang, startDate, endDate } = req.query;

        if (search) {
            sql += ' AND (nama_vendor LIKE ? OR transaksi_id LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (bank) {
            sql += ' AND bank = ?';
            params.push(bank);
        }
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        if (cabang) {
            sql += ' AND cabang = ?';
            params.push(cabang);
        }
        if (startDate && endDate) {
            sql += ' AND tanggal_transaksi BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        sql += ' ORDER BY tanggal_transaksi DESC, id DESC';

        const data = await queryAsync(sql, params);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getSummary = async (req, res) => {
    try {
        await queryAsync(`UPDATE cash_in_bank SET status = 'Overdue' WHERE status IN ('Pending', 'Unpaid') AND due_date < CURDATE()`);

        const allData = await queryAsync('SELECT * FROM cash_in_bank');
        
        const saldo_awal = 0; // Baseline balance, could be fetched from a settings table later
        
        let total_paid = 0;
        let total_pending = 0;
        let total_cash_in_today = 0;
        const today = new Date().toISOString().split('T')[0];

        // For Charts
        const monthlyData = {};
        const bankData = {};
        const statusData = { Paid: 0, Unpaid: 0, Pending: 0, Overdue: 0 };
        const cabangData = {};

        allData.forEach(item => {
            const amount = Number(item.total);
            
            // Stats
            if (item.status === 'Paid') {
                total_paid += amount;
            } else {
                total_pending += amount;
            }

            const itemDate = new Date(item.tanggal_transaksi).toISOString().split('T')[0];
            if (itemDate === today && item.status === 'Paid') {
                total_cash_in_today += amount;
            }

            // Status chart
            if (statusData[item.status] !== undefined) {
                statusData[item.status] += amount;
            }

            // Monthly chart
            const month = itemDate.substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) monthlyData[month] = 0;
            if (item.status === 'Paid') monthlyData[month] += amount;

            // Bank chart
            if (!bankData[item.bank]) bankData[item.bank] = 0;
            if (item.status === 'Paid') bankData[item.bank] += amount;

            // Cabang chart
            if (!cabangData[item.cabang]) cabangData[item.cabang] = 0;
            if (item.status === 'Paid') cabangData[item.cabang] += amount;
        });

        const saldo_akhir = saldo_awal + total_paid;

        res.json({
            success: true,
            summary: {
                saldo_awal,
                total_cash_in_today,
                saldo_akhir,
                total_pending,
                total_paid
            },
            charts: {
                monthly: Object.keys(monthlyData).map(k => ({ month: k, total: monthlyData[k] })).sort((a,b) => a.month.localeCompare(b.month)),
                bank: Object.keys(bankData).map(k => ({ bank: k, total: bankData[k] })),
                status: Object.keys(statusData).map(k => ({ name: k, value: statusData[k] })),
                cabang: Object.keys(cabangData).map(k => ({ name: k, value: cabangData[k] }))
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const {
            cabang, nama_vendor, keterangan, deskripsi, satuan, qty, harga_satuan, 
            bank, tanggal_transaksi, due_date, status, catatan
        } = req.body;

        const total = Number(qty) * Number(harga_satuan);
        const transaksi_id = 'CIB-' + Date.now(); // Simple auto-generate

        const sql = `INSERT INTO cash_in_bank 
            (transaksi_id, cabang, nama_vendor, keterangan, deskripsi, satuan, qty, harga_satuan, total, bank, tanggal_transaksi, due_date, status, catatan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
        const params = [transaksi_id, cabang, nama_vendor, keterangan, deskripsi, satuan, qty, harga_satuan, total, bank, tanggal_transaksi, due_date, status || 'Pending', catatan];
        
        await queryAsync(sql, params);
        
        res.json({ success: true, message: 'Transaksi berhasil ditambahkan' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            cabang, nama_vendor, keterangan, deskripsi, satuan, qty, harga_satuan, 
            bank, tanggal_transaksi, due_date, status, catatan
        } = req.body;

        const total = Number(qty) * Number(harga_satuan);

        const sql = `UPDATE cash_in_bank 
            SET cabang=?, nama_vendor=?, keterangan=?, deskripsi=?, satuan=?, qty=?, harga_satuan=?, total=?, bank=?, tanggal_transaksi=?, due_date=?, status=?, catatan=?
            WHERE id=?`;
            
        const params = [cabang, nama_vendor, keterangan, deskripsi, satuan, qty, harga_satuan, total, bank, tanggal_transaksi, due_date, status, catatan, id];
        
        await queryAsync(sql, params);
        
        res.json({ success: true, message: 'Transaksi berhasil diperbarui' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        await queryAsync('DELETE FROM cash_in_bank WHERE id=?', [id]);
        res.json({ success: true, message: 'Transaksi berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
