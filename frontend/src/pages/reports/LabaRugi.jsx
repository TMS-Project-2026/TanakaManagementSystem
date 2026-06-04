import React, { useState, useEffect, useRef } from 'react';
import { getAllPiutang } from '../../api/piutangApi';
import { getAllHutang } from '../../api/hutangApi';
import { accountApi } from '../../api/accountApi';
import { journalApi } from '../../api/journalApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Printer, RefreshCcw } from 'lucide-react';
import LogoBanua from '../../assets/logo  banua.svg';
import LogoTanaka from '../../assets/logotanaka.jpeg';
import LogoAccestreat from '../../assets/logoacestreet.png';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const today = () => new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

const BRANCHES = ['Semua Cabang', 'Banua', 'Tanaka', 'Acestreet'];
const CHART_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

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

// COA-based line items
const COA_REVENUE = [
  { code: '4-1100', name: 'Penjualan Offline', cat: 'Revenue' },
  { code: '4-1200', name: 'Penjualan Online', cat: 'Revenue' },
  { code: '4-1300', name: 'Pendapatan Jasa Bordir', cat: 'Revenue' },
  { code: '4-1400', name: 'Pendapatan Lain-lain', cat: 'Revenue' },
];
const COA_HPP = [
  { code: '5-1100', name: 'HPP - Pembelian Bahan Baku', cat: 'Cost of Goods Sold' },
  { code: '5-1200', name: 'HPP - Upah Produksi', cat: 'Cost of Goods Sold' },
  { code: '5-1300', name: 'HPP - Overhead Pabrik', cat: 'Cost of Goods Sold' },
];
const COA_EXPENSE = [
  { code: '6-1100', name: 'Beban Gaji Karyawan', cat: 'Expenses' },
  { code: '6-1200', name: 'Beban Sewa Tempat', cat: 'Expenses' },
  { code: '6-1300', name: 'Beban Utilitas (Listrik/Air)', cat: 'Expenses' },
  { code: '6-1400', name: 'Beban Marketing & Promosi', cat: 'Expenses' },
  { code: '6-1500', name: 'Beban Administrasi', cat: 'Expenses' },
  { code: '6-1600', name: 'Beban Penyusutan Aset', cat: 'Expenses' },
  { code: '6-1700', name: 'Beban Lain-lain', cat: 'Expenses' },
];

const LabaRugi = () => {
  const [cabang, setCabang] = useState('Semua Cabang');
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [lineData, setLineData] = useState({ revenue: [], hpp: [], expense: [] });
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

      const totalPiutangNominal = piutangList.reduce((s, r) => s + Number(r.sisa || r.nominal || 0), 0);
      const totalHutangNominal = hutangList.reduce((s, r) => s + Number(r.sisa || r.nominal || 0), 0);

      // Helper to sum journal entries for a given COA code based on normal balance
      const getJournalBalance = (code, normalBalance) => {
        let balance = 0;
        journalList.forEach(j => {
          const amt = Number(j.amount || 0);
          const isDebit = j.debit_account && j.debit_account.startsWith(code);
          const isCredit = j.credit_account && j.credit_account.startsWith(code);
          
          if (isDebit) {
            balance += normalBalance === 'Debit' ? amt : -amt;
          }
          if (isCredit) {
            balance += normalBalance === 'Credit' ? amt : -amt;
          }
        });
        return balance;
      };

      // Map COA revenue — normal balance Credit
      const revenueRows = COA_REVENUE.map((coa, i) => ({
        ...coa,
        amount: (i === 0 ? totalPiutangNominal : 0) + getJournalBalance(coa.code, 'Credit'),
      }));

      // Map COA HPP — normal balance Debit
      const hppRows = COA_HPP.map((coa, i) => ({
        ...coa,
        amount: (i === 0 ? totalHutangNominal : 0) + getJournalBalance(coa.code, 'Debit'),
      }));

      // Expense rows — normal balance Debit
      const expenseRows = COA_EXPENSE.map(coa => ({ 
        ...coa, 
        amount: getJournalBalance(coa.code, 'Debit') 
      }));

      setLineData({ revenue: revenueRows, hpp: hppRows, expense: expenseRows });
    } catch (err) {
      console.error('Gagal load Laba Rugi', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [cabang]);

  const totalRevenue = lineData.revenue.reduce((s, r) => s + r.amount, 0);
  const totalHPP = lineData.hpp.reduce((s, r) => s + r.amount, 0);
  const labaKotor = totalRevenue - totalHPP;
  const totalExpense = lineData.expense.reduce((s, r) => s + r.amount, 0);
  const labaBersih = labaKotor - totalExpense;
  const margin = totalRevenue > 0 ? ((labaBersih / totalRevenue) * 100).toFixed(1) : '0.0';

  const periodeStr = new Date(periode + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const companyName = getCompany(cabang);
  const logoSrc = getLogo(cabang);

  // Chart data
  const barData = [
    { name: 'Total Pendapatan', value: totalRevenue, fill: '#10b981' },
    { name: 'HPP', value: totalHPP, fill: '#f59e0b' },
    { name: 'Laba Kotor', value: labaKotor, fill: '#3b82f6' },
    { name: 'Biaya Operasional', value: totalExpense, fill: '#ef4444' },
    { name: 'Laba Bersih', value: labaBersih, fill: labaBersih >= 0 ? '#059669' : '#dc2626' },
  ];
  const pieData = [
    { name: 'Laba Bersih', value: Math.max(labaBersih, 0) },
    { name: 'HPP', value: totalHPP },
    { name: 'Biaya Operasional', value: totalExpense },
  ].filter(d => d.value > 0);

  const handlePrint = () => {
    const buildRows = (rows, color) =>
      rows.map(r => `
        <tr>
          <td style="padding:5px 10px;font-family:monospace;font-size:9px;color:#94a3b8;width:80px;">${r.code}</td>
          <td style="padding:5px 10px;font-size:10px;color:#334155;">${r.name}</td>
          <td style="padding:5px 10px;text-align:right;font-size:10px;font-weight:600;color:${r.amount === 0 ? '#cbd5e1' : color};">${r.amount === 0 ? '&mdash;' : fmt(r.amount)}</td>
        </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/>
<title>Laba Rugi &mdash; ${companyName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#1e293b;background:#fff;padding:28px 32px}
.kop{display:flex;align-items:center;gap:20px;padding-bottom:14px;border-bottom:3px solid #990000;margin-bottom:20px}
.kop img{height:72px;width:72px;object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;padding:4px}
.co{font-size:17px;font-weight:900;color:#990000}
.rpt-title{font-size:12px;font-weight:700;color:#334155;margin-top:3px}
.meta{font-size:9px;color:#64748b;margin-top:4px;line-height:1.7}
.summary{display:flex;gap:12px;margin-bottom:20px}
.card{flex:1;padding:10px 14px;border-radius:8px;color:white}
.card .lbl{font-size:8px;font-weight:700;text-transform:uppercase;opacity:.85}
.card .val{font-size:13px;font-weight:900;margin-top:2px}
.green{background:#059669}.red{background:#dc2626}.blue{background:#1d4ed8}.orange{background:#d97706}
table{width:100%;border-collapse:collapse}
.sec-hd{background:#1e293b;color:white;padding:7px 10px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
.cat-hd{background:#f1f5f9;padding:5px 10px;font-size:9px;font-weight:900;text-transform:uppercase;color:#475569;letter-spacing:.06em}
.subtotal{padding:6px 10px;font-weight:800;font-size:10px}
.subtotal-green{background:#dcfce7;color:#15803d}
.subtotal-amber{background:#fef3c7;color:#92400e}
.subtotal-red{background:#fee2e2;color:#b91c1c}
.subtotal-blue{background:#dbeafe;color:#1e40af}
.final{background:#0f172a;color:white;padding:10px;font-size:12px;font-weight:900}
.footer{margin-top:16px;padding:9px 14px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;justify-content:space-between}
.footer span{font-size:9px;color:#94a3b8}
.signs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:28px;text-align:center}
.sign-lbl{font-size:8px;text-transform:uppercase;color:#94a3b8}
.sign-line{border-top:1px solid #334155;margin-top:48px;padding-top:4px;font-size:9px;color:#475569}
@media print{body{padding:12px 16px}@page{size:A4;margin:12mm 14mm}}
</style></head><body>
<div class="kop">
  <img src="${logoSrc}" alt="${companyName}" onerror="this.style.display='none'"/>
  <div>
    <div class="co">${companyName}</div>
    <div class="rpt-title">LAPORAN LABA RUGI / INCOME STATEMENT</div>
    <div class="meta">Periode &nbsp;: <b>${periodeStr}</b><br/>Cabang &nbsp;&nbsp;: <b>${cabang}</b><br/>Dicetak &nbsp;: <b>${today()}</b></div>
  </div>
</div>
<div class="summary">
  <div class="card green"><div class="lbl">Total Pendapatan</div><div class="val">${fmt(totalRevenue)}</div></div>
  <div class="card orange"><div class="lbl">HPP</div><div class="val">${fmt(totalHPP)}</div></div>
  <div class="card blue"><div class="lbl">Laba Kotor</div><div class="val">${fmt(labaKotor)}</div></div>
  <div class="card ${labaBersih >= 0 ? 'green' : 'red'}"><div class="lbl">Laba Bersih</div><div class="val">${fmt(labaBersih)}</div></div>
</div>
<table>
  <tr><td colspan="3" class="sec-hd">I. PENDAPATAN (REVENUE)</td></tr>
  <tr><td colspan="3" class="cat-hd">Penjualan & Pendapatan Usaha</td></tr>
  ${buildRows(lineData.revenue, '#059669')}
  <tr><td colspan="2" class="subtotal subtotal-green">TOTAL PENDAPATAN</td><td style="padding:6px 10px;text-align:right;font-weight:900;background:#dcfce7;color:#15803d;">${fmt(totalRevenue)}</td></tr>

  <tr><td colspan="3" class="sec-hd">II. HARGA POKOK PENJUALAN (HPP / COGS)</td></tr>
  ${buildRows(lineData.hpp, '#d97706')}
  <tr><td colspan="2" class="subtotal subtotal-amber">TOTAL HPP</td><td style="padding:6px 10px;text-align:right;font-weight:900;background:#fef3c7;color:#92400e;">${fmt(totalHPP)}</td></tr>

  <tr style="background:#dbeafe;"><td colspan="2" class="subtotal subtotal-blue">LABA KOTOR (Pendapatan &minus; HPP)</td><td style="padding:6px 10px;text-align:right;font-weight:900;background:#dbeafe;color:#1e40af;">${fmt(labaKotor)}</td></tr>

  <tr><td colspan="3" class="sec-hd">III. BIAYA OPERASIONAL (EXPENSES)</td></tr>
  ${buildRows(lineData.expense, '#dc2626')}
  <tr><td colspan="2" class="subtotal subtotal-red">TOTAL BIAYA OPERASIONAL</td><td style="padding:6px 10px;text-align:right;font-weight:900;background:#fee2e2;color:#b91c1c;">${fmt(totalExpense)}</td></tr>

  <tr><td colspan="2" class="final">LABA BERSIH (Net Income)</td><td style="padding:10px;text-align:right;font-size:13px;font-weight:900;background:#0f172a;color:${labaBersih >= 0 ? '#86efac' : '#fca5a5'};">${fmt(labaBersih)}</td></tr>
  <tr style="background:#f1f5f9;"><td colspan="2" style="padding:6px 10px;font-size:10px;font-weight:700;color:#475569;">PROFIT MARGIN</td><td style="padding:6px 10px;text-align:right;font-weight:800;color:#475569;">${margin}%</td></tr>
</table>
<div class="signs">
  <div><div class="sign-lbl">Dibuat oleh</div><div class="sign-line">( ______________________ )<br/>Finance / Accounting</div></div>
  <div><div class="sign-lbl">Diperiksa oleh</div><div class="sign-line">( ______________________ )<br/>Manager Keuangan</div></div>
  <div><div class="sign-lbl">Disetujui oleh</div><div class="sign-line">( ______________________ )<br/>Direktur / Owner</div></div>
</div>
<div class="footer">
  <span>Laporan dibuat otomatis dari data COA, Piutang (AR) &amp; Hutang (AP) sistem TMS.</span>
  <b>${companyName} &mdash; ${today()}</b>
</div>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 800);
  };

  const Section = ({ title, rows, colorClass, subtotalLabel, subtotal, subtotalColor }) => (
    <div className="overflow-hidden rounded-xl border border-gray-100 mb-3">
      <div className={`px-4 py-2.5 font-black text-xs uppercase tracking-widest text-white ${colorClass}`}>{title}</div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60">
              <td className="px-4 py-2 font-mono text-xs text-gray-400 w-20">{r.code}</td>
              <td className="px-4 py-2 text-gray-700">{r.name}</td>
              <td className={`px-4 py-2 text-right font-semibold text-sm ${r.amount === 0 ? 'text-gray-300' : ''}`}>
                {r.amount === 0 ? '—' : fmt(r.amount)}
              </td>
            </tr>
          ))}
          <tr className={`font-black text-sm ${subtotalColor}`}>
            <td colSpan="2" className="px-4 py-2.5">{subtotalLabel}</td>
            <td className="px-4 py-2.5 text-right">{fmt(subtotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen font-sans">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <TrendingUp size={20} className="text-green-700" />
          <h1 className="text-xl font-black text-gray-900">Laporan <span className="text-green-700">Laba Rugi</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={cabang} onChange={e => setCabang(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-green-700">
            {BRANCHES.map(b => <option key={b}>{b}</option>)}
          </select>
          <input type="month" value={periode} onChange={e => setPeriode(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          <button onClick={fetchData} className="p-2 text-gray-500 hover:text-green-700 bg-gray-50 border border-gray-200 rounded-xl transition-colors">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700">
            <Printer size={16} /> Cetak
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-700 border-t-transparent" />
        </div>
      ) : (
        <div ref={printRef}>
          {/* Report Header */}
          <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-5">
            <img src={logoSrc} alt={companyName} className="h-16 w-16 object-contain rounded-xl border border-gray-100 p-1" />
            <div className="flex-1">
              <h2 className="text-lg font-black text-red-800">{companyName}</h2>
              <p className="text-sm font-bold text-gray-700">LAPORAN LABA RUGI / INCOME STATEMENT</p>
              <p className="text-xs text-gray-500 mt-0.5">Periode: {periodeStr} · Cabang: {cabang} · Dicetak: {today()}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-black ${labaBersih >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {labaBersih >= 0 ? '✓ LABA' : '⚠ RUGI'}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Pendapatan', val: totalRevenue, bg: 'bg-green-600' },
              { label: 'HPP / COGS', val: totalHPP, bg: 'bg-amber-600' },
              { label: 'Laba Kotor', val: labaKotor, bg: 'bg-blue-600' },
              { label: 'Laba Bersih', val: labaBersih, bg: labaBersih >= 0 ? 'bg-emerald-700' : 'bg-red-700' },
            ].map((c, i) => (
              <div key={i} className={`${c.bg} text-white p-4 rounded-2xl shadow-sm`}>
                <p className="text-xs font-bold opacity-80 uppercase tracking-wide">{c.label}</p>
                <p className="text-lg font-black mt-1">{fmt(c.val)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Income Statement Table — vertical */}
            <div className="lg:col-span-2 space-y-1">
              <Section title="I. Pendapatan (Revenue)" rows={lineData.revenue}
                colorClass="bg-green-700" subtotalLabel="TOTAL PENDAPATAN"
                subtotal={totalRevenue} subtotalColor="bg-green-50 text-green-800" />

              <Section title="II. Harga Pokok Penjualan (HPP / COGS)" rows={lineData.hpp}
                colorClass="bg-amber-600" subtotalLabel="TOTAL HPP"
                subtotal={totalHPP} subtotalColor="bg-amber-50 text-amber-800" />

              {/* Laba Kotor */}
              <div className="flex justify-between items-center px-4 py-3 bg-blue-700 text-white rounded-xl font-black text-sm">
                <span>LABA KOTOR (Pendapatan − HPP)</span>
                <span>{fmt(labaKotor)}</span>
              </div>

              <Section title="III. Biaya Operasional (Expenses)" rows={lineData.expense}
                colorClass="bg-red-700" subtotalLabel="TOTAL BIAYA OPERASIONAL"
                subtotal={totalExpense} subtotalColor="bg-red-50 text-red-800" />

              {/* Laba Bersih */}
              <div className={`flex justify-between items-center px-4 py-4 rounded-xl font-black text-base text-white ${labaBersih >= 0 ? 'bg-emerald-700' : 'bg-red-700'}`}>
                <span>LABA BERSIH (Net Income)</span>
                <span>{fmt(labaBersih)}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-bold text-gray-600">
                <span>Profit Margin</span>
                <span>{margin}%</span>
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-wide mb-3">Ringkasan Keuangan</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={v => `${(v/1e6).toFixed(0)}jt`} tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={v => fmt(v)} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-wide mb-3">Komposisi</h3>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-36 text-gray-300 text-xs">Belum ada data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} />
                      <Legend formatter={v => <span className="text-xs">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-2xl border border-gray-100 px-5 py-3 text-xs text-gray-400 flex flex-wrap justify-between gap-2">
            <span>Laporan dibuat otomatis dari data COA, Piutang (AR) & Hutang (AP) sistem TMS.</span>
            <span>Dicetak: <strong className="text-gray-600">{today()}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabaRugi;
