const db = require('../config/db');

exports.getNeraca = async (req, res) => {
    const { cabang } = req.query;
    try {
        let cabangFilter = cabang && cabang !== 'Semua Cabang' ? `AND branch = '${cabang}'` : '';
        
        // As a simplified Neraca based on Journals:
        // We will sum up Assets (from cash_in_bank for real cash + receivables from invoices)
        // Liabilities (from hutang/cash_in_bank)
        // Equity = Assets - Liabilities

        // 1. Kas (Aset)
        const [[kasRow]] = await db.promise().query(`SELECT SUM(total) as total FROM cash_in_bank WHERE status = 'Paid' ${cabangFilter.replace('branch', 'cabang')}`);
        const kas = Number(kasRow.total || 0);

        // 2. Piutang (Aset)
        const [[piutangRow]] = await db.promise().query(`SELECT SUM(grand_total) as total FROM invoice WHERE status != 'Lunas' AND status != 'Draft' ${cabangFilter.replace('branch', 'cabang')}`);
        const piutang = Number(piutangRow.total || 0);

        // 3. Hutang (Kewajiban)
        const [[hutangRow]] = await db.promise().query(`SELECT SUM(total) as total FROM cash_in_bank WHERE status != 'Paid' ${cabangFilter.replace('branch', 'cabang')}`);
        const hutang = Number(hutangRow.total || 0);

        const totalAktiva = kas + piutang;
        const totalPasiva = totalAktiva; // Basic accounting equation: Assets = Liabilities + Equity
        const modal = totalAktiva - hutang; // Equity

        const aktivaList = [
            { nama_akun: 'Kas & Bank', saldo: kas },
            { nama_akun: 'Piutang Usaha', saldo: piutang }
        ];

        const pasivaList = [
            { nama_akun: 'Hutang Usaha', saldo: hutang },
            { nama_akun: 'Modal / Ekuitas', saldo: modal }
        ];

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
    try {
        const modalAwal = 150000000;
        const tambahanModal = 0;
        
        // Laba bersih from Journals
        const [[revRow]] = await db.promise().query(`SELECT SUM(amount) as total FROM journals WHERE category = 'Income'`);
        const [[expRow]] = await db.promise().query(`SELECT SUM(amount) as total FROM journals WHERE category = 'Expense'`);
        
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
