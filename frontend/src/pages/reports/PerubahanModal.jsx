import React, { useState, useEffect, useRef } from 'react';
import { getAllPiutang } from '../../api/piutangApi';
import { getAllHutang } from '../../api/hutangApi';
import { journalApi } from '../../api/journalApi';
import { Printer, RefreshCcw, TrendingUp, DollarSign, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import LogoBanua from '../../assets/logo  banua.svg';
import LogoTanaka from '../../assets/logotanaka.jpeg';
import LogoAccestreat from '../../assets/logoacestreet.png';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const today = () => new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

const BRANCHES = ['Semua Cabang', 'Banua', 'Tanaka', 'Acestreet'];

const getLogo = (cab) => {
  if (cab === 'Banua') return LogoBanua;
  if (cab === 'Tanaka') return LogoTanaka;
  if (cab === 'Acestreet') return LogoAccestreat;
  return LogoTanaka;
};
const getCompany = (cab) => {
  if (cab === 'Banua') return 'PT BANUA MITRA LESTARI';
  if (cab === 'Tanaka') return 'PT TANAKA RIZQI BAROKAH';
  if (cab === 'Acestreet') return 'ACCESTREAT';
  return 'PT TANAKA RIZQI BAROKAH & GROUP';
};

const PerubahanModal = () => {
  const [cabang, setCabang] = useState('Semua Cabang');
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    modalAwal: 0,
    labaBersih: 0,
    tambahanModal: 0,
    prive: 0,
    modalAkhir: 0
  });
  const printRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [piutangRes, hutangRes, journalRes] = await Promise.all([
        getAllPiutang(),
        getAllHutang(),
        journalApi.getAllJournals()
      ]);

      const filterBranch = (list) =>
        cabang === 'Semua Cabang' ? list : list.filter(r => r.cabang === cabang);

      const piutangList = filterBranch(piutangRes.data.data || []).filter(r => r.status !== 'Void');
      const hutangList = filterBranch(hutangRes.data.data || []).filter(r => r.status !== 'Void');
      const journalList = filterBranch(journalRes.data || []);

      // Hitung Laba Bersih (Revenue - HPP - Expense)
      const totalPiutangNominal = piutangList.reduce((s, r) => s + Number(r.sisa || r.nominal || 0), 0);
      const totalHutangNominal = hutangList.reduce((s, r) => s + Number(r.sisa || r.nominal || 0), 0);

      const getJournalBal = (prefix, normalBalance) => {
        let bal = 0;
        journalList.forEach(j => {
          const amt = Number(j.amount || 0);
          if (j.debit_account && j.debit_account.startsWith(prefix)) bal += normalBalance === 'Debit' ? amt : -amt;
          if (j.credit_account && j.credit_account.startsWith(prefix)) bal += normalBalance === 'Credit' ? amt : -amt;
        });
        return bal;
      };

      const totalRevenue = totalPiutangNominal + getJournalBal('4-', 'Credit');
      const totalHPP = totalHutangNominal + getJournalBal('5-', 'Debit');
      const totalExpense = getJournalBal('6-', 'Debit');
      const labaBersih = totalRevenue - totalHPP - totalExpense;

      // Hitung Tambahan Modal (3-1100 Modal Disetor) -> Normal Credit
      const tambahanModal = getJournalBal('3-1100', 'Credit');

      // Hitung Prive (2-1600 Prive Pemilik) -> Normal Debit
      const prive = getJournalBal('2-1600', 'Debit');

      // Default Modal Awal sesuai sistem saat ini
      const modalAwal = 150000000;
      const modalAkhir = modalAwal + labaBersih + tambahanModal - prive;

      setReportData({ modalAwal, labaBersih, tambahanModal, prive, modalAkhir });
    } catch (err) {
      console.error('Gagal load Perubahan Modal', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [cabang]);

  const { modalAwal, labaBersih, tambahanModal, prive, modalAkhir } = reportData;
  const companyName = getCompany(cabang);
  const logoSrc = getLogo(cabang);
  const periodeStr = new Date(periode + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const handlePrint = () => {
    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/>
<title>Perubahan Modal &mdash; ${companyName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1e293b;background:#fff;padding:28px 32px}
.kop{display:flex;align-items:center;gap:20px;padding-bottom:14px;border-bottom:3px solid #990000;margin-bottom:20px}
.kop img{height:72px;width:72px;object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;padding:4px}
.co{font-size:17px;font-weight:900;color:#990000}
.rpt-title{font-size:12px;font-weight:700;color:#334155;margin-top:3px}
.meta{font-size:9px;color:#64748b;margin-top:4px;line-height:1.7}
.card-row{display:flex;gap:12px;margin-bottom:24px}
.card{flex:1;padding:12px 16px;border-radius:8px;color:white}
.card .lbl{font-size:9px;font-weight:700;text-transform:uppercase;opacity:.85}
.card .val{font-size:16px;font-weight:900;margin-top:4px}
.blue{background:#1d4ed8}.green{background:#059669}.red{background:#b91c1c}
table{width:100%;border-collapse:collapse;margin-bottom:24px}
td{padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#334155}
.td-label{font-weight:700;letter-spacing:.02em}
.td-val{text-align:right;font-weight:700}
.plus{color:#15803d}.minus{color:#b91c1c}
.total-row{background:#0f172a;color:white}
.total-row td{color:white;font-weight:900;font-size:14px;border:none}
.signs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:40px;text-align:center}
.sign-lbl{font-size:9px;text-transform:uppercase;color:#94a3b8;font-weight:700}
.sign-line{border-top:1px solid #334155;margin-top:50px;padding-top:6px;font-size:10px;color:#475569;font-weight:700}
.footer{margin-top:20px;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;justify-content:space-between;border-radius:6px}
.footer span{font-size:9px;color:#94a3b8}
@media print{body{padding:12px 16px}@page{size:A4;margin:12mm 14mm}}
</style></head><body>
<div class="kop">
  <img src="${logoSrc}" alt="${companyName}" onerror="this.style.display='none'"/>
  <div>
    <div class="co">${companyName}</div>
    <div class="rpt-title">LAPORAN PERUBAHAN MODAL / STATEMENT OF CHANGES IN EQUITY</div>
    <div class="meta">Periode &nbsp;: <b>${periodeStr}</b><br/>Cabang &nbsp;&nbsp;: <b>${cabang}</b><br/>Dicetak &nbsp;: <b>${today()}</b></div>
  </div>
</div>
<div class="card-row">
  <div class="card blue"><div class="lbl">Modal Awal</div><div class="val">${fmt(modalAwal)}</div></div>
  <div class="card ${labaBersih >= 0 ? 'green' : 'red'}"><div class="lbl">Laba / Rugi Bersih</div><div class="val">${fmt(labaBersih)}</div></div>
  <div class="card blue"><div class="lbl">Modal Akhir</div><div class="val">${fmt(modalAkhir)}</div></div>
</div>
<table>
  <tr><td class="td-label">MODAL AWAL</td><td class="td-val">${fmt(modalAwal)}</td></tr>
  <tr><td class="td-label pl-4">+ Laba (Rugi) Bersih Periode Berjalan</td><td class="td-val plus">${fmt(labaBersih)}</td></tr>
  <tr><td class="td-label pl-4">+ Tambahan Modal / Investasi (Setoran)</td><td class="td-val plus">${fmt(tambahanModal)}</td></tr>
  <tr><td class="td-label pl-4">&minus; Prive Pemilik (Penarikan)</td><td class="td-val minus">${fmt(prive)}</td></tr>
  <tr class="total-row"><td>MODAL AKHIR</td><td class="td-val">${fmt(modalAkhir)}</td></tr>
</table>
<div class="signs">
  <div><div class="sign-lbl">Dibuat oleh</div><div class="sign-line">( ______________________ )<br/>Finance / Accounting</div></div>
  <div><div class="sign-lbl">Diperiksa oleh</div><div class="sign-line">( ______________________ )<br/>Manager Keuangan</div></div>
  <div><div class="sign-lbl">Disetujui oleh</div><div class="sign-line">( ______________________ )<br/>Direktur / Owner</div></div>
</div>
<div class="footer">
  <span>Laporan dibuat otomatis dari integrasi data Laba Rugi dan Jurnal Modal/Prive.</span>
  <b>${companyName} &mdash; ${today()}</b>
</div>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 800);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen font-sans">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <Wallet size={20} className="text-blue-700" />
          <h1 className="text-xl font-black text-gray-900">Perubahan <span className="text-blue-700">Modal</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={cabang} onChange={e => setCabang(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-700">
            {BRANCHES.map(b => <option key={b}>{b}</option>)}
          </select>
          <input type="month" value={periode} onChange={e => setPeriode(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-700" />
          <button onClick={fetchData} className="p-2 text-gray-500 hover:text-blue-700 bg-gray-50 border border-gray-200 rounded-xl transition-colors">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            <Printer size={16} /> Cetak
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-700 border-t-transparent" />
        </div>
      ) : (
        <div className="max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-5">
            <img src={logoSrc} alt={companyName} className="h-16 w-16 object-contain rounded-xl border border-gray-100 p-1" />
            <div className="flex-1">
              <h2 className="text-lg font-black text-blue-900">{companyName}</h2>
              <p className="text-sm font-bold text-gray-700">LAPORAN PERUBAHAN MODAL / STATEMENT OF CHANGES IN EQUITY</p>
              <p className="text-xs text-gray-500 mt-0.5">Periode: {periodeStr} · Cabang: {cabang} · Dicetak: {today()}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-black bg-blue-100 text-blue-800`}>
              EQUITY REPORT
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold opacity-80 uppercase tracking-wide">Modal Awal</p>
              <p className="text-2xl font-black mt-1">{fmt(modalAwal)}</p>
            </div>
            <div className={`${labaBersih >= 0 ? 'bg-emerald-600' : 'bg-red-600'} text-white p-5 rounded-2xl shadow-sm`}>
              <p className="text-xs font-bold opacity-80 uppercase tracking-wide">Laba / Rugi Bersih</p>
              <p className="text-2xl font-black mt-1">{fmt(labaBersih)}</p>
            </div>
            <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold opacity-80 uppercase tracking-wide">Modal Akhir</p>
              <p className="text-2xl font-black mt-1">{fmt(modalAkhir)}</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <tbody>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <td className="py-4 px-6 font-bold text-gray-800 uppercase tracking-wide">MODAL AWAL</td>
                  <td className="py-4 px-6 text-right font-black text-gray-800">{fmt(modalAwal)}</td>
                </tr>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-gray-700 font-semibold flex items-center gap-2">
                    {labaBersih >= 0 ? <TrendingUp size={16} className="text-green-600"/> : <TrendingUp size={16} className="text-red-600"/>}
                    + Laba (Rugi) Bersih Periode Berjalan
                  </td>
                  <td className={`py-4 px-6 text-right font-bold ${labaBersih >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {fmt(labaBersih)}
                  </td>
                </tr>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-gray-700 font-semibold flex items-center gap-2">
                    <ArrowUpRight size={16} className="text-blue-600"/>
                    + Tambahan Modal / Investasi (Setoran)
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-blue-700">{fmt(tambahanModal)}</td>
                </tr>
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-gray-700 font-semibold flex items-center gap-2">
                    <ArrowDownRight size={16} className="text-orange-600"/>
                    &minus; Prive Pemilik (Penarikan)
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-orange-700">{fmt(prive)}</td>
                </tr>
                <tr className="bg-blue-800 text-white">
                  <td className="py-5 px-6 font-black text-base uppercase tracking-widest">MODAL AKHIR</td>
                  <td className="py-5 px-6 text-right font-black text-xl">{fmt(modalAkhir)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-white rounded-2xl border border-gray-100 px-5 py-3 text-xs text-gray-400 flex flex-wrap justify-between gap-2">
            <span>Laporan dibuat otomatis dari integrasi data Laba Rugi dan Jurnal Modal/Prive.</span>
            <span>Dicetak: <strong className="text-gray-600">{today()}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerubahanModal;
