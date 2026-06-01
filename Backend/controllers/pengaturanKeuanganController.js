const db = require('../config/db');

// ═══════════════════════════════════════════
// REKENING BANK
// ═══════════════════════════════════════════
exports.getRekening = (req, res) => {
    db.query('SELECT * FROM fin_rekening_bank ORDER BY cabang, nama_bank', (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

exports.createRekening = (req, res) => {
    const { nama_bank, no_rekening, atas_nama, cabang, saldo_awal } = req.body;
    if (!nama_bank || !no_rekening) return res.status(400).json({ message: 'Nama bank dan nomor rekening wajib diisi.' });
    db.query(
        'INSERT INTO fin_rekening_bank (nama_bank, no_rekening, atas_nama, cabang, saldo_awal) VALUES (?,?,?,?,?)',
        [nama_bank, no_rekening, atas_nama || '', cabang || 'Pusat', saldo_awal || 0],
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: result.insertId, message: 'Rekening berhasil ditambahkan.' });
        }
    );
};

exports.updateRekening = (req, res) => {
    const { id } = req.params;
    const { nama_bank, no_rekening, atas_nama, cabang, saldo_awal, aktif } = req.body;
    db.query(
        'UPDATE fin_rekening_bank SET nama_bank=?, no_rekening=?, atas_nama=?, cabang=?, saldo_awal=?, aktif=? WHERE id=?',
        [nama_bank, no_rekening, atas_nama || '', cabang || 'Pusat', saldo_awal || 0, aktif ?? 1, id],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: 'Rekening berhasil diupdate.' });
        }
    );
};

exports.deleteRekening = (req, res) => {
    db.query('DELETE FROM fin_rekening_bank WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: 'Rekening berhasil dihapus.' });
    });
};

// ═══════════════════════════════════════════
// PETTY CASH SETTINGS
// ═══════════════════════════════════════════
exports.getPettyCash = (req, res) => {
    db.query('SELECT * FROM fin_petty_cash_settings ORDER BY cabang', (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

exports.updatePettyCash = (req, res) => {
    const { id } = req.params;
    const { min_saldo, max_transaksi } = req.body;
    db.query(
        'UPDATE fin_petty_cash_settings SET min_saldo=?, max_transaksi=? WHERE id=?',
        [min_saldo || 0, max_transaksi || 0, id],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: 'Setting petty cash berhasil disimpan.' });
        }
    );
};

// ═══════════════════════════════════════════
// PERIODE AKUNTANSI
// ═══════════════════════════════════════════
exports.getPeriode = (req, res) => {
    const tahun = req.query.tahun || new Date().getFullYear();
    db.query('SELECT * FROM fin_periode_akuntansi WHERE tahun=? ORDER BY bulan', [tahun], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        // Jika belum ada data tahun ini, buat otomatis
        if (rows.length === 0) {
            const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
            const values = months.map((m, i) => [tahun, i + 1, m, i < 4 ? 'Tutup' : 'Buka']);
            db.query('INSERT INTO fin_periode_akuntansi (tahun,bulan,nama_bulan,status) VALUES ?', [values], (err2) => {
                if (err2) return res.status(500).json({ message: err2.message });
                db.query('SELECT * FROM fin_periode_akuntansi WHERE tahun=? ORDER BY bulan', [tahun], (err3, rows3) => {
                    if (err3) return res.status(500).json({ message: err3.message });
                    res.json(rows3);
                });
            });
        } else {
            res.json(rows);
        }
    });
};

exports.togglePeriode = (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Buka' atau 'Tutup'
    db.query('UPDATE fin_periode_akuntansi SET status=? WHERE id=?', [status, id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: `Periode berhasil di${status === 'Buka' ? 'buka' : 'tutup'}.` });
    });
};

// ═══════════════════════════════════════════
// NOTIFIKASI SETTINGS
// ═══════════════════════════════════════════
exports.getNotifikasi = (req, res) => {
    db.query('SELECT * FROM fin_notifikasi_settings ORDER BY id', (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
};

exports.updateNotifikasi = (req, res) => {
    const { kode } = req.params;
    const { aktif } = req.body;
    db.query('UPDATE fin_notifikasi_settings SET aktif=? WHERE kode=?', [aktif ? 1 : 0, kode], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: 'Setting notifikasi disimpan.' });
    });
};

exports.saveAllNotifikasi = (req, res) => {
    const { settings } = req.body; // array of { kode, aktif }
    if (!Array.isArray(settings)) return res.status(400).json({ message: 'Format tidak valid.' });
    const promises = settings.map(s => new Promise((resolve, reject) => {
        db.query('UPDATE fin_notifikasi_settings SET aktif=? WHERE kode=?', [s.aktif ? 1 : 0, s.kode], (err) => {
            if (err) reject(err); else resolve();
        });
    }));
    Promise.all(promises)
        .then(() => res.json({ message: 'Semua pengaturan notifikasi berhasil disimpan.' }))
        .catch(err => res.status(500).json({ message: err.message }));
};
