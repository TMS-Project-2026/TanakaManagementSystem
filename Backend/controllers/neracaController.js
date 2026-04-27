const db = require('../config/db');

exports.getNeraca = async (req, res) => {
    const { cabang } = req.query;
    // Real Neraca uses Chart of Accounts balances. We'll simulate based on the table `akun` structure.
    try {
        // Fetch all accounts
        const [akunList] = await db.promise().query('SELECT * FROM akun');
        
        // Let's assume some balances for simulation or read from jurnal_umum
        let cabangFilter = cabang && cabang !== 'Semua Cabang' ? `AND cabang = '${cabang}'` : '';
        const [jurnal] = await db.promise().query(`
            SELECT akun_id, SUM(debit) as deb, SUM(kredit) as kre 
            FROM jurnal_umum WHERE 1=1 ${cabangFilter} GROUP BY akun_id
        `);

        const balances = {};
        jurnal.forEach(j => {
            balances[j.akun_id] = { debit: Number(j.deb), kredit: Number(j.kre) };
        });

        let totalAktiva = 0;
        let totalPasiva = 0;

        const aktivaList = [];
        const pasivaList = [];

        akunList.forEach(a => {
            let saldo = 0;
            if (balances[a.id]) {
                if (a.kategori === 'Aktiva') {
                    saldo = balances[a.id].debit - balances[a.id].kredit;
                } else {
                    saldo = balances[a.id].kredit - balances[a.id].debit;
                }
            }

            // Fallback to dummy data if no jurnal entries yet, just so the chart isn't completely empty
            // Remove this in production if you want strictly 0 when empty.
            if (saldo === 0) {
                if (a.nama_akun === 'Kas') saldo = 50000000;
                if (a.nama_akun === 'Aset Tetap') saldo = 120000000;
                if (a.nama_akun === 'Hutang Usaha') saldo = 15000000;
                if (a.nama_akun === 'Modal Disetor') saldo = 155000000;
            }

            if (a.kategori === 'Aktiva') {
                totalAktiva += saldo;
                aktivaList.push({ ...a, saldo });
            } else if (a.kategori === 'Pasiva' || a.kategori === 'Ekuitas') {
                totalPasiva += saldo;
                pasivaList.push({ ...a, saldo });
            }
        });

        res.json({
            status: 'success',
            data: {
                totalAktiva,
                totalPasiva,
                aktiva: aktivaList,
                pasiva: pasivaList
            }
        });

    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getPerubahanModal = async (req, res) => {
    // Simulated Perubahan Modal
    try {
        const modalAwal = 150000000;
        const tambahanModal = 5000000;
        
        // Laba bersih from Invoices - Expenses
        const [[revRow]] = await db.promise().query(`SELECT SUM(grand_total) as total FROM invoice WHERE status != 'Draft'`);
        const [[expRow]] = await db.promise().query(`SELECT SUM(jumlah) as total FROM expense`);
        
        const labaDitahan = Number(revRow.total || 0) - Number(expRow.total || 0);
        const modalAkhir = modalAwal + tambahanModal + labaDitahan;

        res.json({
            status: 'success',
            data: {
                modalAwal,
                tambahanModal,
                labaDitahan,
                modalAkhir
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
