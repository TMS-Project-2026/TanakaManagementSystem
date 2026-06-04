import React, { useState, useEffect, useRef } from 'react';
import { getAllPiutang } from '../../api/piutangApi';
import { getAllHutang } from '../../api/hutangApi';
import { journalApi } from '../../api/journalApi';
import { getReportNeraca } from '../../api/reportApi';
import { Printer, RefreshCcw, Layers, Scale } from 'lucide-react';
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

const COA_LIST = [
  { code: '1-1100', name: 'Kas di Bank', type: 'Asset', normal: 'Debit' },
  { code: '1-1200', name: 'Kas Kecil (Petty Cash)', type: 'Asset', normal: 'Debit' },
  { code: '1-1300', name: 'Piutang Usaha', type: 'Asset', normal: 'Debit' },
  { code: '1-2100', name: 'Aset Tetap (Peralatan, Kendaraan, dll)', type: 'Asset', normal: 'Debit' },
  { code: '2-1100', name: 'Hutang Usaha (Supplier)', type: 'Liability', normal: 'Credit' },
  { code: '3-1100', name: 'Modal Disetor', type: 'Equity', normal: 'Credit' },
  { code: '2-1600', name: 'Prive Pemilik', type: 'Equity', normal: 'Debit' },
  { code: '4-1100', name: 'Pendapatan Penjualan', type: 'Revenue', normal: 'Credit' },
  { code: '5-1100', name: 'Harga Pokok Penjualan (HPP)', type: 'Expense', normal: 'Debit' },
  { code: '6-1100', name: 'Biaya Operasional (Gaji, Sewa, dll)', type: 'Expense', normal: 'Debit' },
];

const NeracaSaldo = () => {
  const [cabang, setCabang] = useState('Semua Cabang');
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
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
      const neracaAktiva = neracaRes.data?.data?.aktiva || [];

      // Helper Jurnal
      const getJournalBal = (prefix, normalBalance) => {
        let bal = 0;
        journalList.forEach(j => {
          const amt = Number(j.amount || 0);
          if (j.debit_account && j.debit_account.startsWith(prefix)) bal += normalBalance === 'Debit' ? amt : -amt;
          if (j.credit_account && j.credit_account.startsWith(prefix)) bal += normalBalance === 'Credit' ? amt : -amt;
        });
        return bal;
      };

      // Kas
      const kasBank = neracaAktiva.find(a => a.nama_akun?.toLowerCase().includes('kas di bank'))?.saldo || 0;
      const kasKecil = neracaAktiva.find(a => a.nama_akun?.toLowerCase().includes('kas kecil'))?.saldo || 0;
      
      // Piutang & Hutang
      const piutangNominal = piutangList.reduce((s, r) => s + Number(r.sisa || r.nominal || 0), 0);
      const hutangNominal = hutangList.reduce((s, r) => s + Number(r.sisa || r.nominal || 0), 0);
      
      // Jurnal
      const asetTetap = getJournalBal('1-2', 'Debit');
      const prive = getJournalBal('2-1600', 'Debit');
      const modal = 150000000 + getJournalBal('3-1100', 'Credit'); // Default modal + setoran
      const pendapatan = piutangNominal + getJournalBal('4-', 'Credit');
      const hpp = hutangNominal + getJournalBal('5-', 'Debit');
      const biaya = getJournalBal('6-', 'Debit');

      const dataMap = {
        '1-1100': kasBank,
        '1-1200': kasKecil,
        '1-1300': piutangNominal,
        '1-2100': Math.max(asetTetap, 0),
        '2-1100': hutangNominal,
        '3-1100': modal,
        '2-1600': Math.max(prive, 0),
        '4-1100': pendapatan,
        '5-1100': hpp,
        '6-1100': biaya
      };

      const rows = COA_LIST.map(coa => ({
        ...coa,
        saldo: dataMap[coa.code] || 0
      }));

      setReportData(rows);
    } catch (err) {
      console.error('Gagal load Neraca Saldo', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [cabang]);

  const totalDebit = reportData.filter(r => r.normal === 'Debit').reduce((s, r) => s + r.saldo, 0);
  const totalCredit = reportData.filter(r => r.normal === 'Credit').reduce((s, r) => s + r.saldo, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 1000;

  const companyName = getCompany(cabang);
  const logoSrc = getLogo(cabang);
  const periodeStr = new Date(periode + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const handlePrint = () => {
    if (!reportData.length) return;
    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/>
<title>Neraca Saldo &mdash; ${companyName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1e293b;background:#fff;padding:28px 32px}
.kop{display:flex;align-items:center;gap:20px;padding-bottom:14px;border-bottom:3px solid #990000;margin-bottom:20px}
.kop img{height:72px;width:72px;object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;padding:4px}
.co{font-size:17px;font-weight:900;color:#990000}
.rpt-title{font-size:12px;font-weight:700;color:#334155;margin-top:3px}
.meta{font-size:9px;color:#64748b;margin-top:4px;line-height:1.7}
.status-badge{display:inline-block;padding:6px 12px;border-radius:20px;font-size:10px;font-weight:900;margin-bottom:20px}
.status-ok{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}
.status-err{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
th{background:#f8fafc;padding:10px;font-size:10px;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:.05em;border-top:2px solid #e2e8f0;border-bottom:1px solid #e2e8f0;text-align:left}
th.right{text-align:right}
td{padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#475569}
.code{font-family:monospace;font-size:10px;color:#94a3b8}
.val-td{text-align:right;font-weight:600}
.final-row{background:#0f172a;color:white}
.final-row td{color:white;font-weight:900;font-size:12px;padding:12px 10px;border:none}
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
    <div class="rpt-title">NERACA SALDO / TRIAL BALANCE</div>
    <div class="meta">Periode &nbsp;: <b>${periodeStr}</b><br/>Cabang &nbsp;&nbsp;: <b>${cabang}</b><br/>Dicetak &nbsp;: <b>${today()}</b></div>
  </div>
</div>
<div class="status-badge ${isBalanced ? 'status-ok' : 'status-err'}">
  ${isBalanced ? '✓ NERACA SALDO SEIMBANG (BALANCED)' : '⚠ NERACA SALDO TIDAK SEIMBANG (UNBALANCED)'}
</div>
<table>
  <thead>
    <tr>
      <th width="80">KODE</th>
      <th>NAMA AKUN</th>
      <th class="right">DEBIT</th>
      <th class="right">KREDIT</th>
    </tr>
  </thead>
  <tbody>
    ${reportData.map(r => `
      <tr>
        <td class="code">${r.code}</td>
        <td style="color:#1e293b;font-weight:600">${r.name}</td>
        <td class="val-td" style="color:${r.normal === 'Debit' && r.saldo > 0 ? '#1d4ed8' : '#94a3b8'}">
          ${r.normal === 'Debit' ? (r.saldo === 0 ? '&mdash;' : fmt(r.saldo)) : ''}
        </td>
        <td class="val-td" style="color:${r.normal === 'Credit' && r.saldo > 0 ? '#b91c1c' : '#94a3b8'}">
          ${r.normal === 'Credit' ? (r.saldo === 0 ? '&mdash;' : fmt(r.saldo)) : ''}
        </td>
      </tr>
    `).join('')}
    <tr class="final-row">
      <td colspan="2" style="text-align:right">TOTAL SALDO:</td>
      <td class="val-td" style="color:${isBalanced ? '#86efac' : '#fca5a5'}">${fmt(totalDebit)}</td>
      <td class="val-td" style="color:${isBalanced ? '#86efac' : '#fca5a5'}">${fmt(totalCredit)}</td>
    </tr>
  </tbody>
</table>
<div class="signs">
  <div><div class="sign-lbl">Dibuat oleh</div><div class="sign-line">( ______________________ )<br/>Finance / Accounting</div></div>
  <div><div class="sign-lbl">Diperiksa oleh</div><div class="sign-line">( ______________________ )<br/>Manager Keuangan</div></div>
  <div><div class="sign-lbl">Disetujui oleh</div><div class="sign-line">( ______________________ )<br/>Direktur / Owner</div></div>
</div>
<div class="footer">
  <span>Laporan ditarik dari seluruh buku besar, transaksi Jurnal, AR, dan AP.</span>
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
          <Layers size={20} className="text-[#990000]" />
          <h1 className="text-xl font-black text-gray-900">Neraca <span className="text-[#990000]">Saldo</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={cabang} onChange={e => setCabang(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#990000]">
            {BRANCHES.map(b => <option key={b}>{b}</option>)}
          </select>
          <input type="month" value={periode} onChange={e => setPeriode(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
          <button onClick={fetchData} className="p-2 text-gray-500 hover:text-[#990000] bg-gray-50 border border-gray-200 rounded-xl transition-colors">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-[#990000] text-white rounded-xl text-sm font-medium hover:bg-red-800 transition-colors shadow-sm shadow-red-900/20">
            <Printer size={16} /> Cetak
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#990000] border-t-transparent" />
        </div>
      ) : reportData.length > 0 && (
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 bg-white p-5 rounded-t-2xl border border-gray-100 border-b-0">
            <img src={logoSrc} alt={companyName} className="h-16 w-16 object-contain rounded-xl border border-gray-100 p-1" />
            <div className="flex-1">
              <h2 className="text-lg font-black text-[#990000]">{companyName}</h2>
              <p className="text-sm font-bold text-gray-700">NERACA SALDO / TRIAL BALANCE</p>
              <p className="text-xs text-gray-500 mt-0.5">Periode: {periodeStr} · Cabang: {cabang} · Dicetak: {today()}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {isBalanced ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200">
                  <Scale size={18} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Status Laporan</p>
                    <p className="text-sm font-black leading-none">SEIMBANG</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl border border-red-200 shadow-sm shadow-red-900/5">
                  <Scale size={18} className="animate-pulse" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Status Laporan</p>
                    <p className="text-sm font-black leading-none">TIDAK SEIMBANG</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-b-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-y border-gray-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-32">Kode Akun</th>
                    <th className="px-6 py-4">Nama Akun</th>
                    <th className="px-6 py-4 text-right w-40">Debit</th>
                    <th className="px-6 py-4 text-right w-40">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{r.code}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{r.name}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        {r.normal === 'Debit' ? (
                          <span className={r.saldo > 0 ? 'text-blue-700 font-bold' : 'text-slate-300'}>
                            {r.saldo === 0 ? '—' : fmt(r.saldo)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {r.normal === 'Credit' ? (
                          <span className={r.saldo > 0 ? 'text-red-700 font-bold' : 'text-slate-300'}>
                            {r.saldo === 0 ? '—' : fmt(r.saldo)}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="bg-slate-900 text-white font-black">
                    <td colSpan="2" className="px-6 py-5 text-right uppercase tracking-widest text-slate-300 text-xs">
                      Total Saldo Akhir
                    </td>
                    <td className={`px-6 py-5 text-right text-lg ${isBalanced ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmt(totalDebit)}
                    </td>
                    <td className={`px-6 py-5 text-right text-lg ${isBalanced ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmt(totalCredit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Imbalance Warning Footer */}
            {!isBalanced && (
              <div className="bg-red-50 px-6 py-4 border-t border-red-100 flex justify-between items-center text-red-800 text-sm">
                <span className="font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping absolute"></span>
                  <span className="w-2 h-2 rounded-full bg-red-600 relative"></span>
                  PERHATIAN: Terdapat selisih saldo (Out of Balance) sebesar {fmt(Math.abs(totalDebit - totalCredit))}
                </span>
                <span className="text-xs">Mohon periksa kembali input jurnal Anda.</span>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default NeracaSaldo;
