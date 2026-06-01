import React, { useState, useEffect, useRef } from 'react';
import { getAllPiutang } from '../../api/piutangApi';
import { getAllHutang } from '../../api/hutangApi';
import { journalApi } from '../../api/journalApi';
import { getReportNeraca } from '../../api/reportApi';
import { Printer, RefreshCcw, ArrowRightLeft, Wallet, Building2, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
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
  return 'PT BANUA MITRA LESTARI & GROUP';
};

const ArusKas = () => {
  const [cabang, setCabang] = useState('Semua Cabang');
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const printRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [piutangRes, hutangRes, journalRes, neracaRes] = await Promise.all([
        getAllPiutang(),
        getAllHutang(),
        journalApi.getAllJournals(),
        getReportNeraca({ cabang })
      ]);

      const filterBranch = (list) =>
        cabang === 'Semua Cabang' ? list : list.filter(r => r.cabang === cabang);

      const piutangList = filterBranch(piutangRes.data.data || []).filter(r => r.status !== 'Void');
      const hutangList = filterBranch(hutangRes.data.data || []).filter(r => r.status !== 'Void');
      const journalList = filterBranch(journalRes.data || []);

      const getJournalBal = (prefix, normalBalance) => {
        let bal = 0;
        journalList.forEach(j => {
          const amt = Number(j.amount || 0);
          if (j.debit_account && j.debit_account.startsWith(prefix)) bal += normalBalance === 'Debit' ? amt : -amt;
          if (j.credit_account && j.credit_account.startsWith(prefix)) bal += normalBalance === 'Credit' ? amt : -amt;
        });
        return bal;
      };

      // 1. AKTIVITAS OPERASIONAL (Laba Rugi)
      const piutangNominal = piutangList.reduce((s, r) => s + Number(r.sisa || r.nominal || 0), 0);
      const hutangNominal = hutangList.reduce((s, r) => s + Number(r.sisa || r.nominal || 0), 0);
      
      const totalRevenue = piutangNominal + getJournalBal('4-', 'Credit'); // Uang Masuk Operasional
      const totalHPP = hutangNominal + getJournalBal('5-', 'Debit');
      const totalExpense = getJournalBal('6-', 'Debit');
      const operasionalKeluar = totalHPP + totalExpense; // Uang Keluar Operasional
      const netOperasional = totalRevenue - operasionalKeluar;

      // 2. AKTIVITAS INVESTASI (Aset Tetap 1-2xxx)
      // Normal saldo Debit. Jika debit naik (beli aset) = Cash Out (minus). Jika kredit (jual) = Cash In (plus).
      const asetTetapBal = getJournalBal('1-2', 'Debit'); 
      const netInvestasi = -asetTetapBal; 

      // 3. AKTIVITAS PENDANAAN (Perubahan Modal)
      const tambahanModal = getJournalBal('3-1100', 'Credit'); // Cash In
      const prive = getJournalBal('2-1600', 'Debit'); // Cash Out
      const netPendanaan = tambahanModal - prive;

      // NET CASH FLOW (Kenaikan/Penurunan Kas)
      const kenaikanKas = netOperasional + netInvestasi + netPendanaan;

      // SALDO KAS AKHIR (Cash & Bank dari Neraca)
      const neracaApiData = neracaRes.data?.data || {};
      const saldoKasAkhir = Number(
        neracaApiData.aktiva?.find((a) => a.nama_akun?.toLowerCase().includes('kas'))?.saldo || 0
      );

      // SALDO KAS AWAL
      const saldoKasAwal = saldoKasAkhir - kenaikanKas;

      setReportData({
        totalRevenue,
        operasionalKeluar,
        netOperasional,
        asetTetapBal,
        netInvestasi,
        tambahanModal,
        prive,
        netPendanaan,
        kenaikanKas,
        saldoKasAwal,
        saldoKasAkhir
      });
    } catch (err) {
      console.error('Gagal load Arus Kas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [cabang]);

  const companyName = getCompany(cabang);
  const logoSrc = getLogo(cabang);
  const periodeStr = new Date(periode + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const handlePrint = () => {
    if (!reportData) return;
    const d = reportData;
    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/>
<title>Arus Kas &mdash; ${companyName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1e293b;background:#fff;padding:28px 32px}
.kop{display:flex;align-items:center;gap:20px;padding-bottom:14px;border-bottom:3px solid #990000;margin-bottom:20px}
.kop img{height:72px;width:72px;object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;padding:4px}
.co{font-size:17px;font-weight:900;color:#990000}
.rpt-title{font-size:12px;font-weight:700;color:#334155;margin-top:3px}
.meta{font-size:9px;color:#64748b;margin-top:4px;line-height:1.7}
.card-row{display:flex;gap:12px;margin-bottom:20px}
.card{flex:1;padding:12px 14px;border-radius:8px;color:white}
.card .lbl{font-size:8px;font-weight:700;text-transform:uppercase;opacity:.85}
.card .val{font-size:14px;font-weight:900;margin-top:4px}
.blue{background:#1d4ed8}.green{background:#059669}.red{background:#dc2626}.slate{background:#0f172a}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
.hd{background:#f8fafc;padding:8px 10px;font-size:10px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:.05em;border-top:2px solid #e2e8f0;border-bottom:1px solid #e2e8f0}
td{padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:10px;color:#475569}
.val-td{text-align:right;font-weight:600}
.subtotal{font-weight:800;padding:8px 10px}
.subtotal-val{text-align:right;font-weight:900}
.bg-blue{background:#eff6ff;color:#1e40af}.bg-green{background:#f0fdf4;color:#166534}.bg-orange{background:#fff7ed;color:#9a3412}
.final-row{background:#0f172a;color:white}
.final-row td{color:white;font-weight:900;font-size:12px;padding:10px}
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
    <div class="rpt-title">LAPORAN ARUS KAS / STATEMENT OF CASH FLOWS</div>
    <div class="meta">Periode &nbsp;: <b>${periodeStr}</b><br/>Cabang &nbsp;&nbsp;: <b>${cabang}</b><br/>Dicetak &nbsp;: <b>${today()}</b></div>
  </div>
</div>
<div class="card-row">
  <div class="card blue"><div class="lbl">Saldo Kas Awal</div><div class="val">${fmt(d.saldoKasAwal)}</div></div>
  <div class="card ${d.kenaikanKas >= 0 ? 'green' : 'red'}"><div class="lbl">Kenaikan / Penurunan Kas</div><div class="val">${fmt(d.kenaikanKas)}</div></div>
  <div class="card slate"><div class="lbl">Saldo Kas Akhir</div><div class="val">${fmt(d.saldoKasAkhir)}</div></div>
</div>
<table>
  <tr><td colspan="2" class="hd">I. ARUS KAS DARI AKTIVITAS OPERASIONAL</td></tr>
  <tr><td>Penerimaan Kas dari Pelanggan & Pendapatan</td><td class="val-td" style="color:#15803d">${fmt(d.totalRevenue)}</td></tr>
  <tr><td>Pembayaran Kas untuk HPP & Biaya Operasional</td><td class="val-td" style="color:#b91c1c">(${fmt(d.operasionalKeluar)})</td></tr>
  <tr class="bg-blue"><td class="subtotal">KAS BERSIH DARI AKTIVITAS OPERASIONAL</td><td class="subtotal-val">${fmt(d.netOperasional)}</td></tr>

  <tr><td colspan="2" class="hd">II. ARUS KAS DARI AKTIVITAS INVESTASI</td></tr>
  <tr><td>Pembelian / Penjualan Aset Tetap</td><td class="val-td">${fmt(d.netInvestasi)}</td></tr>
  <tr class="bg-orange"><td class="subtotal">KAS BERSIH DARI AKTIVITAS INVESTASI</td><td class="subtotal-val">${fmt(d.netInvestasi)}</td></tr>

  <tr><td colspan="2" class="hd">III. ARUS KAS DARI AKTIVITAS PENDANAAN</td></tr>
  <tr><td>Tambahan Modal / Setoran Investasi</td><td class="val-td" style="color:#15803d">${fmt(d.tambahanModal)}</td></tr>
  <tr><td>Prive Pemilik (Penarikan Modal)</td><td class="val-td" style="color:#b91c1c">(${fmt(d.prive)})</td></tr>
  <tr class="bg-green"><td class="subtotal">KAS BERSIH DARI AKTIVITAS PENDANAAN</td><td class="subtotal-val">${fmt(d.netPendanaan)}</td></tr>

  <tr><td class="subtotal">KENAIKAN (PENURUNAN) KAS BERSIH</td><td class="subtotal-val" style="color:${d.kenaikanKas >= 0 ? '#15803d' : '#b91c1c'}">${fmt(d.kenaikanKas)}</td></tr>
  <tr style="background:#f1f5f9;"><td class="subtotal">SALDO KAS AWAL PERIODE</td><td class="subtotal-val">${fmt(d.saldoKasAwal)}</td></tr>
  <tr class="final-row"><td>SALDO KAS AKHIR (CASH & BANK)</td><td class="subtotal-val">${fmt(d.saldoKasAkhir)}</td></tr>
</table>
<div class="signs">
  <div><div class="sign-lbl">Dibuat oleh</div><div class="sign-line">( ______________________ )<br/>Finance / Accounting</div></div>
  <div><div class="sign-lbl">Diperiksa oleh</div><div class="sign-line">( ______________________ )<br/>Manager Keuangan</div></div>
  <div><div class="sign-lbl">Disetujui oleh</div><div class="sign-line">( ______________________ )<br/>Direktur / Owner</div></div>
</div>
<div class="footer">
  <span>Laporan ditarik dari aktivitas operasi (Laba Rugi), investasi (Aset Tetap), dan pendanaan (Perubahan Modal).</span>
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
          <ArrowRightLeft size={20} className="text-teal-700" />
          <h1 className="text-xl font-black text-gray-900">Arus <span className="text-teal-700">Kas</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={cabang} onChange={e => setCabang(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-teal-700">
            {BRANCHES.map(b => <option key={b}>{b}</option>)}
          </select>
          <input type="month" value={periode} onChange={e => setPeriode(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-700" />
          <button onClick={fetchData} className="p-2 text-gray-500 hover:text-teal-700 bg-gray-50 border border-gray-200 rounded-xl transition-colors">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            <Printer size={16} /> Cetak
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-700 border-t-transparent" />
        </div>
      ) : reportData && (
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-5">
            <img src={logoSrc} alt={companyName} className="h-16 w-16 object-contain rounded-xl border border-gray-100 p-1" />
            <div className="flex-1">
              <h2 className="text-lg font-black text-teal-900">{companyName}</h2>
              <p className="text-sm font-bold text-gray-700">LAPORAN ARUS KAS / STATEMENT OF CASH FLOWS</p>
              <p className="text-xs text-gray-500 mt-0.5">Periode: {periodeStr} · Cabang: {cabang} · Dicetak: {today()}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-black bg-teal-100 text-teal-800`}>
              CASHFLOW REPORT
            </div>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <Wallet size={24} className="opacity-80"/>
              <div>
                <p className="text-xs font-bold opacity-80 uppercase tracking-wide">Saldo Awal</p>
                <p className="text-xl font-black mt-0.5">{fmt(reportData.saldoKasAwal)}</p>
              </div>
            </div>
            <div className={`${reportData.kenaikanKas >= 0 ? 'bg-emerald-600' : 'bg-red-600'} text-white p-5 rounded-2xl shadow-sm flex items-center gap-4`}>
              {reportData.kenaikanKas >= 0 ? <TrendingUp size={24} className="opacity-80"/> : <TrendingDown size={24} className="opacity-80"/>}
              <div>
                <p className="text-xs font-bold opacity-80 uppercase tracking-wide">Kenaikan / (Penurunan)</p>
                <p className="text-xl font-black mt-0.5">{fmt(reportData.kenaikanKas)}</p>
              </div>
            </div>
            <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <Building2 size={24} className="opacity-80"/>
              <div>
                <p className="text-xs font-bold text-teal-200 uppercase tracking-wide">Saldo Akhir</p>
                <p className="text-xl font-black mt-0.5 text-teal-100">{fmt(reportData.saldoKasAkhir)}</p>
              </div>
            </div>
          </div>

          {/* Flow Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            
            {/* Operasional */}
            <div className="bg-slate-50 px-5 py-3 border-b border-gray-100 font-bold text-xs uppercase tracking-widest text-slate-600">
              I. Arus Kas dari Aktivitas Operasional
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-5 text-gray-700 flex items-center gap-2"><ArrowDownCircle size={16} className="text-green-600"/> Penerimaan Kas dari Pelanggan & Pendapatan</td>
                  <td className="py-3 px-5 text-right font-bold text-green-700">{fmt(reportData.totalRevenue)}</td>
                </tr>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-5 text-gray-700 flex items-center gap-2"><ArrowUpCircle size={16} className="text-red-600"/> Pembayaran Kas untuk HPP & Biaya Operasional</td>
                  <td className="py-3 px-5 text-right font-bold text-red-600">({fmt(reportData.operasionalKeluar)})</td>
                </tr>
                <tr className="bg-blue-50/50 border-b border-blue-100">
                  <td className="py-3 px-5 font-bold text-blue-800 text-xs">KAS BERSIH DARI AKTIVITAS OPERASIONAL</td>
                  <td className="py-3 px-5 text-right font-black text-blue-900">{fmt(reportData.netOperasional)}</td>
                </tr>
              </tbody>
            </table>

            {/* Investasi */}
            <div className="bg-slate-50 px-5 py-3 border-y border-gray-100 font-bold text-xs uppercase tracking-widest text-slate-600 mt-2">
              II. Arus Kas dari Aktivitas Investasi
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-5 text-gray-700 flex items-center gap-2"><Building2 size={16} className="text-orange-500"/> Pembelian / Penjualan Aset Tetap</td>
                  <td className="py-3 px-5 text-right font-bold text-orange-700">{fmt(reportData.netInvestasi)}</td>
                </tr>
                <tr className="bg-orange-50/50 border-b border-orange-100">
                  <td className="py-3 px-5 font-bold text-orange-800 text-xs">KAS BERSIH DARI AKTIVITAS INVESTASI</td>
                  <td className="py-3 px-5 text-right font-black text-orange-900">{fmt(reportData.netInvestasi)}</td>
                </tr>
              </tbody>
            </table>

            {/* Pendanaan */}
            <div className="bg-slate-50 px-5 py-3 border-y border-gray-100 font-bold text-xs uppercase tracking-widest text-slate-600 mt-2">
              III. Arus Kas dari Aktivitas Pendanaan
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-5 text-gray-700 flex items-center gap-2"><ArrowDownCircle size={16} className="text-green-600"/> Tambahan Modal / Setoran Investasi</td>
                  <td className="py-3 px-5 text-right font-bold text-green-700">{fmt(reportData.tambahanModal)}</td>
                </tr>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-5 text-gray-700 flex items-center gap-2"><ArrowUpCircle size={16} className="text-red-600"/> Prive Pemilik (Penarikan Modal)</td>
                  <td className="py-3 px-5 text-right font-bold text-red-600">({fmt(reportData.prive)})</td>
                </tr>
                <tr className="bg-emerald-50/50 border-b border-emerald-100">
                  <td className="py-3 px-5 font-bold text-emerald-800 text-xs">KAS BERSIH DARI AKTIVITAS PENDANAAN</td>
                  <td className="py-3 px-5 text-right font-black text-emerald-900">{fmt(reportData.netPendanaan)}</td>
                </tr>
              </tbody>
            </table>

            {/* Final Totals */}
            <div className="p-5 bg-white border-t border-gray-100">
              <div className="flex justify-between items-center py-2 text-sm font-bold text-gray-600 border-b border-gray-50">
                <span>Kenaikan (Penurunan) Kas Bersih</span>
                <span className={reportData.kenaikanKas >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(reportData.kenaikanKas)}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm font-bold text-gray-600">
                <span>Saldo Kas Awal Periode</span>
                <span>{fmt(reportData.saldoKasAwal)}</span>
              </div>
            </div>
            <div className="px-5 py-4 bg-teal-800 text-white flex justify-between items-center">
              <span className="font-black text-sm uppercase tracking-widest text-teal-100">SALDO KAS AKHIR (Cash & Bank)</span>
              <span className="font-black text-xl">{fmt(reportData.saldoKasAkhir)}</span>
            </div>

          </div>

          <div className="mt-4 bg-white rounded-2xl border border-gray-100 px-5 py-3 text-xs text-gray-400 flex flex-wrap justify-between gap-2">
            <span>Laporan Arus Kas tersinkronisasi penuh dengan Laba Rugi, Perubahan Modal, dan saldo Kas Neraca.</span>
            <span>Dicetak: <strong className="text-gray-600">{today()}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArusKas;
