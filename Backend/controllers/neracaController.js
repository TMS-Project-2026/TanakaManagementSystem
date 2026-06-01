const db = require('../config/db');

const q = (query, params = []) => new Promise((resolve, reject) =>
    db.query(query, params, (err, r) => err ? reject(err) : resolve(r))
);

exports.getNeraca = async (req, res) => {
    const { cabang } = req.query;
    try {
        const cabF = cabang && cabang !== 'Semua Cabang' ? `AND cabang = '${cabang}'` : '';

        const [kasRow, piutangRow, hutangRow, cobRow] = await Promise.all([
            q(`SELECT COALESCE(SUM(total),0) as total FROM cash_in_bank WHERE status='Paid' ${cabF}`),
            q(`SELECT COALESCE(SUM(grand_total),0) as total FROM invoice WHERE status NOT IN ('Lunas','Draft','Void') ${cabF}`),
            q(`SELECT COALESCE(SUM(total),0) as total FROM cash_in_bank WHERE status IN ('Pending','Overdue') ${cabF}`),
            q(`SELECT COALESCE(SUM(nominal),0) as total FROM cash_out_bank WHERE status IN ('Pending','Void') ${cabF}`),
        ]);

        const kas = Number(kasRow[0].total || 0);
        const piutang = Number(piutangRow[0].total || 0);
        const hutangCIB = Number(hutangRow[0].total || 0);
        const hutangCOB = Number(cobRow[0].total || 0);
        const hutang = hutangCIB + hutangCOB;

        const totalAktiva = kas + piutang;
        const modal = totalAktiva - hutang;
        const totalPasiva = hutang + modal;

        res.json({
            status: 'success',
            data: {
                totalAktiva,
                totalPasiva,
                aktiva: [
                    { nama_akun: 'Kas & Bank (Paid)', saldo: kas },
                    { nama_akun: 'Piutang Usaha (Invoice Belum Lunas)', saldo: piutang }
                ],
                pasiva: [
                    { nama_akun: 'Hutang Usaha (Cash Out Pending)', saldo: hutangCOB },
                    { nama_akun: 'Kewajiban Cash In Pending', saldo: hutangCIB },
                    { nama_akun: 'Modal / Ekuitas', saldo: modal }
                ]
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getPerubahanModal = async (req, res) => {
    try {
        const modalAwal = 150000000;

        const [revJ, expJ, cashInPaid, invPaid, cobPaid] = await Promise.all([
            q(`SELECT COALESCE(SUM(amount),0) as total FROM journals WHERE category IN ('Income','Revenue')`),
            q(`SELECT COALESCE(SUM(amount),0) as total FROM journals WHERE category IN ('Expense','Purchase')`),
            q(`SELECT COALESCE(SUM(total),0) as total FROM cash_in_bank WHERE status='Paid'`),
            q(`SELECT COALESCE(SUM(grand_total),0) as total FROM invoice WHERE status NOT IN ('Draft','Void')`),
            q(`SELECT COALESCE(SUM(nominal),0) as total FROM cash_out_bank WHERE status='Paid'`),
        ]);

        const totalRevenue = Number(revJ[0].total) + Number(cashInPaid[0].total) + Number(invPaid[0].total);
        const totalExpense = Number(expJ[0].total) + Number(cobPaid[0].total);
        const labaDitahan = totalRevenue - totalExpense;
        const modalAkhir = modalAwal + labaDitahan;

        res.json({
            status: 'success',
            data: { modalAwal, tambahanModal: 0, labaDitahan, modalAkhir, totalRevenue, totalExpense }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
