import React, { useState, useEffect, useRef } from 'react';
import { getReportNeraca } from '../../api/reportApi';
import { accountApi } from '../../api/accountApi';
import { getAllPiutang } from '../../api/piutangApi';
import { getAllHutang } from '../../api/hutangApi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Printer, RefreshCcw, BarChart2, TrendingUp, TrendingDown, Link } from 'lucide-react';
import LogoBanua from '../../assets/logo  banua.svg';
import LogoTanaka from '../../assets/logotanaka.jpeg';
import LogoAccestreat from '../../assets/logoacestreet.png';

const AKTIVA_COLORS = ['#3b82f6','#06b6d4','#10b981','#6366f1','#8b5cf6','#0ea5e9','#22c55e','#14b8a6'];
const PASIVA_COLORS = ['#f97316','#ef4444','#a855f7','#ec4899','#f59e0b','#dc2626','#b45309'];

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const today = () =>
  new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

const COA_AKTIVA = [
  { code: '1-1100', name: 'Kas di Bank (Cash in Bank)', category: 'Current Assets' },
  { code: '1-1200', name: 'Kas Kecil (Petty Cash)', category: 'Current Assets' },
  { code: '1-1300', name: 'Piutang Usaha', category: 'Current Assets' },
  { code: '1-1400', name: 'Piutang Dagang', category: 'Current Assets' },
  { code: '1-1500', name: 'Persediaan Barang Jadi', category: 'Current Assets' },
  { code: '1-1600', name: 'Persediaan Barang Setengah Jadi', category: 'Current Assets' },
  { code: '1-1700', name: 'Persediaan Bahan Baku', category: 'Current Assets' },
  { code: '1-1800', name: 'Perlengkapan Kantor', category: 'Current Assets' },
  { code: '1-2100', name: 'Peralatan Kantor', category: 'Fixed Assets' },
  { code: '1-2200', name: 'Peralatan Mesin', category: 'Fixed Assets' },
  { code: '1-2300', name: 'Kendaraan', category: 'Fixed Assets' },
  { code: '1-2400', name: 'Gedung', category: 'Fixed Assets' },
  { code: '1-2500', name: 'Tanah', category: 'Fixed Assets' },
  { code: '1-2600', name: 'Akum. Penyusutan Peralatan Kantor', category: 'Fixed Assets' },
  { code: '1-2700', name: 'Akum. Penyusutan Peralatan Mesin', category: 'Fixed Assets' },
  { code: '1-2800', name: 'Akum. Penyusutan Kendaraan', category: 'Fixed Assets' },
  { code: '1-2900', name: 'Akum. Penyusutan Gedung', category: 'Fixed Assets' },
];

const COA_PASIVA = [
  { code: '2-1100', name: 'Hutang Usaha', category: 'Liabilities' },
  { code: '2-1200', name: 'Hutang Vendor & Mitra', category: 'Liabilities' },
  { code: '2-1300', name: 'Hutang Gaji & Insentif', category: 'Liabilities' },
  { code: '2-1400', name: 'Hutang Bank', category: 'Liabilities' },
  { code: '2-1500', name: 'Hutang Deviden', category: 'Liabilities' },
  { code: '2-1600', name: 'Prive Pemilik', category: 'Liabilities' },
  { code: '3-1100', name: 'Modal Disetor', category: 'Equity' },
  { code: '3-1200', name: 'Laba Ditahan', category: 'Equity' },
];

const Neraca = () => {
  const [cabang, setCabang] = useState('Semua Cabang');
  const [periode, setPeriode] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState({ aktiva: [], pasiva: [] });
  const printRef = useRef();

  const BRANCHES = ['Semua Cabang', 'Banua', 'Tanaka', 'Acestreet'];

  const getLogo = () => {
    if (cabang === 'Banua') return LogoBanua;
    if (cabang === 'Tanaka') return LogoTanaka;
    if (cabang === 'Acestreet') return LogoAccestreat;
    return LogoTanaka;
  };

  const getCompanyName = () => {
    if (cabang === 'Banua') return 'PT BANUA MITRA LESTARI';
    if (cabang === 'Tanaka') return 'PT TANAKA RIZQI BAROKAH';
    if (cabang === 'Acestreet') return 'ACCESTREAT';
    return 'PT BANUA MITRA LESTARI & GROUP';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [piutangRes, hutangRes, neracaRes] = await Promise.all([
        getAllPiutang(),
        getAllHutang(),
        getReportNeraca({ cabang }),
      ]);

      const piutangList = piutangRes.data.data || [];
      const hutangList = hutangRes.data.data || [];
      const neracaApiData = neracaRes.data?.data || {};

      const filterByBranch = (list) => {
        if (cabang === 'Semua Cabang') return list;
        return list.filter((r) => r.cabang === cabang);
      };

      const piutangFiltered = filterByBranch(piutangList).filter((r) => r.status !== 'Void');
      const hutangFiltered = filterByBranch(hutangList).filter((r) => r.status !== 'Void');

      const piutangTotal = piutangFiltered.reduce((s, r) => s + Number(r.sisa || 0), 0);
      const hutangTotal = hutangFiltered.reduce((s, r) => s + Number(r.sisa || 0), 0);

      const kasTotal =
        neracaApiData.aktiva?.find((a) => a.nama_akun?.toLowerCase().includes('kas'))?.saldo || 0;

      const buildAktiva = COA_AKTIVA.map((coa) => {
        let saldo = 0;
        if (coa.code === '1-1100') saldo = Number(kasTotal);
        else if (coa.code === '1-1300' || coa.code === '1-1400') saldo = piutangTotal;
        return { ...coa, saldo };
      });

      const totalAktivaCalc = buildAktiva.reduce((s, a) => s + a.saldo, 0);

      const buildPasiva = COA_PASIVA.map((coa) => {
        let saldo = 0;
        if (coa.code === '2-1100') saldo = hutangTotal;
        else if (coa.code === '3-1200') saldo = Math.max(totalAktivaCalc - hutangTotal, 0);
        return { ...coa, saldo };
      });

      setBalanceData({ aktiva: buildAktiva, pasiva: buildPasiva });
    } catch (err) {
      console.error('Gagal load Neraca', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cabang]);

  const totalAktiva = balanceData.aktiva.reduce((s, a) => s + a.saldo, 0);
  const totalPasiva = balanceData.pasiva.reduce((s, a) => s + a.saldo, 0);
  const isBalanced = Math.abs(totalAktiva - totalPasiva) < 1000;

  const pieAktiva = balanceData.aktiva.filter((a) => a.saldo > 0).map((a) => ({ name: a.name, value: a.saldo }));
  const piePasiva = balanceData.pasiva.filter((a) => a.saldo > 0).map((a) => ({ name: a.name, value: a.saldo }));

  const handlePrint = () => {
    const periodeStr = new Date(periode + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const logoSrc = getLogo();
    const companyName = getCompanyName();
    const balanced = Math.abs(totalAktiva - totalPasiva) < 1000;

    const buildRows = (rows, groupDefs, isAktiva) =>
      groupDefs.map(g => {
        const items = rows.filter(r => r.category === g.cat);
        const subtotal = items.reduce((s, r) => s + r.saldo, 0);
        const accent = isAktiva ? '#1d4ed8' : '#92400e';
        const subBg = isAktiva ? '#dbeafe' : '#ffedd5';
        const subColor = isAktiva ? '#1e3a8a' : '#7c2d12';
        return `
          <tr><td colspan="3" style="background:#f1f5f9;padding:6px 10px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#475569;border-top:2px solid #e2e8f0;">${g.label}</td></tr>
          ${items.map(item => `<tr>
            <td style="padding:5px 10px;font-family:monospace;font-size:9px;color:#94a3b8;border-bottom:1px solid #f1f5f9;width:80px;">${item.code}</td>
            <td style="padding:5px 10px;font-size:10px;color:#334155;border-bottom:1px solid #f1f5f9;">${item.name}</td>
            <td style="padding:5px 10px;text-align:right;font-size:10px;font-weight:600;color:${item.saldo === 0 ? '#cbd5e1' : accent};border-bottom:1px solid #f1f5f9;">${item.saldo === 0 ? '&mdash;' : formatRp(item.saldo)}</td>
          </tr>`).join('')}
          <tr>
            <td colspan="2" style="padding:6px 10px;font-size:9px;font-weight:800;background:${subBg};color:${subColor};text-transform:uppercase;">Subtotal ${g.label.split(' (')[0]}</td>
            <td style="padding:6px 10px;text-align:right;font-size:10px;font-weight:900;background:${subBg};color:${subColor};">${formatRp(subtotal)}</td>
          </tr>`;
      }).join('');

    const aktivaGroups = [
      { label: 'ASET LANCAR (CURRENT ASSETS)', cat: 'Current Assets' },
      { label: 'ASET TETAP (FIXED ASSETS)', cat: 'Fixed Assets' },
    ];
    const pasivaGroups = [
      { label: 'KEWAJIBAN (LIABILITIES)', cat: 'Liabilities' },
      { label: 'MODAL / EKUITAS (EQUITY)', cat: 'Equity' },
    ];

    const tableAktiva = `
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <thead>
          <tr style="background:#1d4ed8;">
            <th colspan="3" style="padding:8px 10px;color:white;font-size:11px;text-align:left;">AKTIVA &mdash; ${formatRp(totalAktiva)}</th>
          </tr>
          <tr style="background:#eff6ff;">
            <th style="padding:5px 10px;font-size:9px;color:#1e40af;text-align:left;width:80px;">Kode</th>
            <th style="padding:5px 10px;font-size:9px;color:#1e40af;text-align:left;">Nama Akun</th>
            <th style="padding:5px 10px;font-size:9px;color:#1e40af;text-align:right;">Saldo</th>
          </tr>
        </thead>
        <tbody>
          ${buildRows(balanceData.aktiva, aktivaGroups, true)}
          <tr style="background:#1d4ed8;">
            <td colspan="2" style="padding:8px 10px;color:white;font-size:11px;font-weight:900;">TOTAL AKTIVA</td>
            <td style="padding:8px 10px;text-align:right;color:white;font-size:11px;font-weight:900;">${formatRp(totalAktiva)}</td>
          </tr>
        </tbody>
      </table>`;

    const tablePasiva = `
      <table style="width:100%;border-collapse:collapse;font-size:10px;">
        <thead>
          <tr style="background:#92400e;">
            <th colspan="3" style="padding:8px 10px;color:white;font-size:11px;text-align:left;">PASIVA &amp; EKUITAS &mdash; ${formatRp(totalPasiva)}</th>
          </tr>
          <tr style="background:#fffbeb;">
            <th style="padding:5px 10px;font-size:9px;color:#78350f;text-align:left;width:80px;">Kode</th>
            <th style="padding:5px 10px;font-size:9px;color:#78350f;text-align:left;">Nama Akun</th>
            <th style="padding:5px 10px;font-size:9px;color:#78350f;text-align:right;">Saldo</th>
          </tr>
        </thead>
        <tbody>
          ${buildRows(balanceData.pasiva, pasivaGroups, false)}
          <tr style="background:#92400e;">
            <td colspan="2" style="padding:8px 10px;color:white;font-size:11px;font-weight:900;">TOTAL PASIVA &amp; EKUITAS</td>
            <td style="padding:8px 10px;text-align:right;color:white;font-size:11px;font-weight:900;">${formatRp(totalPasiva)}</td>
          </tr>
        </tbody>
      </table>`;

    const html = `<!DOCTYPE html>
<html lang="id"><head>
  <meta charset="UTF-8"/>
  <title>Neraca &mdash; ${companyName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#1e293b;background:#fff;padding:28px 32px}
    .kop{display:flex;align-items:center;gap:20px;padding-bottom:14px;border-bottom:3px solid #990000;margin-bottom:20px}
    .kop img{height:72px;width:72px;object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;padding:4px}
    .kop-text .co{font-size:17px;font-weight:900;color:#990000;letter-spacing:.02em}
    .kop-text .title{font-size:12px;font-weight:700;color:#334155;margin-top:2px}
    .kop-text .meta{font-size:9px;color:#64748b;margin-top:4px;line-height:1.7}
    .badge{display:inline-block;margin-top:6px;padding:3px 12px;border-radius:20px;font-size:9px;font-weight:900}
    .ok{background:#dcfce7;color:#15803d;border:1px solid #86efac}
    .warn{background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5}
    .summary{display:flex;gap:12px;margin-bottom:20px}
    .card{flex:1;padding:10px 14px;border-radius:8px;color:white}
    .card .lbl{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.85}
    .card .val{font-size:13px;font-weight:900;margin-top:2px}
    .blue{background:#1d4ed8}.orange{background:#92400e}.green{background:#15803d}.red{background:#b91c1c}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
    .sec-lbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:6px}
    .signs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:28px}
    .sign-box{text-align:center}
    .sign-lbl{font-size:8px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8}
    .sign-line{border-top:1px solid #334155;margin-top:48px;padding-top:4px;font-size:9px;color:#475569}
    .footer{margin-top:16px;padding:9px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;display:flex;justify-content:space-between}
    .footer span{font-size:9px;color:#94a3b8}
    .footer b{color:#475569;font-weight:700}
    @media print{body{padding:12px 16px}@page{size:A4;margin:12mm 14mm}}
  </style>
</head><body>

  <div class="kop">
    <img src="${logoSrc}" alt="${companyName}" onerror="this.style.display='none'"/>
    <div class="kop-text">
      <div class="co">${companyName}</div>
      <div class="title">NERACA / BALANCE SHEET</div>
      <div class="meta">
        Periode &nbsp;: <b>${periodeStr}</b><br/>
        Cabang &nbsp;&nbsp;: <b>${cabang}</b><br/>
        Dicetak &nbsp;: <b>${today()}</b>
      </div>
      <span class="badge ${balanced ? 'ok' : 'warn'}">${balanced ? '&#10003; NERACA SEIMBANG' : '&#9888; NERACA TIDAK SEIMBANG'}</span>
    </div>
  </div>

  <div class="summary">
    <div class="card blue"><div class="lbl">Total Aktiva</div><div class="val">${formatRp(totalAktiva)}</div></div>
    <div class="card orange"><div class="lbl">Total Pasiva &amp; Ekuitas</div><div class="val">${formatRp(totalPasiva)}</div></div>
    <div class="card ${balanced ? 'green' : 'red'}"><div class="lbl">Selisih</div><div class="val">${formatRp(Math.abs(totalAktiva - totalPasiva))}</div></div>
  </div>

  <div class="grid2">
    <div><div class="sec-lbl">I. AKTIVA</div>${tableAktiva}</div>
    <div><div class="sec-lbl">II. PASIVA &amp; EKUITAS</div>${tablePasiva}</div>
  </div>

  <div class="signs">
    <div class="sign-box"><div class="sign-lbl">Dibuat oleh</div><div class="sign-line">( ______________________ )<br/>Finance / Accounting</div></div>
    <div class="sign-box"><div class="sign-lbl">Diperiksa oleh</div><div class="sign-line">( ______________________ )<br/>Manager Keuangan</div></div>
    <div class="sign-box"><div class="sign-lbl">Disetujui oleh</div><div class="sign-line">( ______________________ )<br/>Direktur / Owner</div></div>
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

  const renderSection = (rows, isAktiva) => {
    const groups = isAktiva
      ? [
          { label: 'ASET LANCAR (CURRENT ASSETS)', cat: 'Current Assets' },
          { label: 'ASET TETAP (FIXED ASSETS)', cat: 'Fixed Assets' },
        ]
      : [
          { label: 'KEWAJIBAN (LIABILITIES)', cat: 'Liabilities' },
          { label: 'MODAL / EKUITAS (EQUITY)', cat: 'Equity' },
        ];

    return groups.map((g) => {
      const items = rows.filter((r) => r.category === g.cat);
      const subtotal = items.reduce((s, r) => s + r.saldo, 0);
      return (
        <React.Fragment key={g.cat}>
          <tr className="bg-gray-100 cat-row">
            <td colSpan="3" className="py-2 px-3 text-xs font-black uppercase tracking-wider text-gray-500">
              {g.label}
            </td>
          </tr>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="py-2 px-3 font-mono text-xs text-gray-400">{item.code}</td>
              <td className="py-2 px-3 text-gray-700 text-sm">{item.name}</td>
              <td className={`py-2 px-3 text-right text-sm font-medium ${item.saldo === 0 ? 'text-gray-300 zero' : isAktiva ? 'text-blue-700' : 'text-orange-700'}`}>
                {item.saldo === 0 ? '—' : formatRp(item.saldo)}
              </td>
            </tr>
          ))}
          <tr className={isAktiva ? 'bg-blue-50 sub-blue' : 'bg-orange-50 sub-orange'}>
            <td colSpan="2" className={`py-2 px-3 text-xs font-black ${isAktiva ? 'text-blue-800' : 'text-orange-800'}`}>
              Subtotal {g.label.split(' (')[0]}
            </td>
            <td className={`py-2 px-3 text-right text-xs font-black ${isAktiva ? 'text-blue-900' : 'text-orange-900'}`}>
              {formatRp(subtotal)}
            </td>
          </tr>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen font-sans">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <BarChart2 size={20} className="text-red-800" />
          <h1 className="text-xl font-black text-gray-900">
            Neraca <span className="text-red-800">(Balance Sheet)</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={cabang}
            onChange={(e) => setCabang(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-red-800"
          >
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <input
            type="month"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-800"
          />
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-red-800 bg-gray-50 border border-gray-200 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <Printer size={16} /> Cetak
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent" />
        </div>
      ) : (
        <div ref={printRef}>
          {/* Print / Report Header */}
          <div className="print-header ph flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <img
              src={getLogo()}
              alt={getCompanyName()}
              className="h-16 w-16 object-contain rounded-xl border border-gray-100 p-1"
            />
            <div className="flex-1">
              <h2 className="text-lg font-black text-red-800 tracking-tight">{getCompanyName()}</h2>
              <p className="text-sm font-bold text-gray-700 mt-0.5">NERACA / BALANCE SHEET</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Periode:{' '}
                {new Date(periode + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                {' · '}Cabang: {cabang}
                {' · '}Dicetak: {today()}
              </p>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-black ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
            >
              {isBalanced ? '✓ SEIMBANG' : '⚠ TIDAK SEIMBANG'}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-blue-100 uppercase tracking-wide flex items-center gap-2">
                <TrendingUp size={14} /> Total Aktiva
              </p>
              <h3 className="text-2xl font-black mt-2">{formatRp(totalAktiva)}</h3>
              <p className="text-xs text-blue-200 mt-1">Semua aset perusahaan</p>
            </div>
            <div className="bg-orange-600 text-white p-5 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-orange-100 uppercase tracking-wide flex items-center gap-2">
                <TrendingDown size={14} /> Total Pasiva
              </p>
              <h3 className="text-2xl font-black mt-2">{formatRp(totalPasiva)}</h3>
              <p className="text-xs text-orange-200 mt-1">Kewajiban + Modal</p>
            </div>
            <div className={`p-5 rounded-2xl shadow-sm text-white ${isBalanced ? 'bg-green-600' : 'bg-red-700'}`}>
              <p className="text-xs font-bold opacity-80 uppercase tracking-wide flex items-center gap-2">
                <Link size={14} /> Selisih
              </p>
              <h3 className="text-2xl font-black mt-2">{formatRp(Math.abs(totalAktiva - totalPasiva))}</h3>
              <p className="text-xs opacity-70 mt-1">
                {isBalanced ? 'Neraca Seimbang ✓' : 'Neraca Belum Seimbang'}
              </p>
            </div>
          </div>

          {/* Aktiva vs Pasiva Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 grid2">
            {/* AKTIVA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-blue-700 px-5 py-3 flex items-center justify-between th-blue">
                <h3 className="text-white font-black text-sm uppercase tracking-wide">AKTIVA (Aset)</h3>
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {formatRp(totalAktiva)}
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-blue-50 text-blue-800 text-xs">
                    <th className="py-2 px-3 font-bold">Kode</th>
                    <th className="py-2 px-3 font-bold">Nama Akun</th>
                    <th className="py-2 px-3 text-right font-bold">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {renderSection(balanceData.aktiva, true)}
                  <tr className="bg-blue-700 total-blue">
                    <td colSpan="2" className="py-3 px-3 text-white font-black text-sm">
                      TOTAL AKTIVA
                    </td>
                    <td className="py-3 px-3 text-right text-white font-black">{formatRp(totalAktiva)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PASIVA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-orange-700 px-5 py-3 flex items-center justify-between th-orange">
                <h3 className="text-white font-black text-sm uppercase tracking-wide">
                  PASIVA (Kewajiban + Modal)
                </h3>
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {formatRp(totalPasiva)}
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-orange-50 text-orange-800 text-xs">
                    <th className="py-2 px-3 font-bold">Kode</th>
                    <th className="py-2 px-3 font-bold">Nama Akun</th>
                    <th className="py-2 px-3 text-right font-bold">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {renderSection(balanceData.pasiva, false)}
                  <tr className="bg-orange-700 total-orange">
                    <td colSpan="2" className="py-3 px-3 text-white font-black text-sm">
                      TOTAL PASIVA & EKUITAS
                    </td>
                    <td className="py-3 px-3 text-right text-white font-black">{formatRp(totalPasiva)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Dual Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie Aktiva */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-black text-gray-800 mb-1 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Komposisi Aktiva
              </h3>
              <p className="text-xs text-gray-400 mb-4">Distribusi aset per akun COA</p>
              {pieAktiva.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
                  Belum ada data aktiva
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieAktiva}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieAktiva.map((_, i) => (
                        <Cell key={i} fill={AKTIVA_COLORS[i % AKTIVA_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val, name) => [formatRp(val), name]} />
                    <Legend
                      formatter={(val) => (
                        <span className="text-xs">{val.length > 22 ? val.slice(0, 20) + '…' : val}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Pasiva */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-black text-gray-800 mb-1 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-600 inline-block" /> Komposisi Pasiva
              </h3>
              <p className="text-xs text-gray-400 mb-4">Distribusi kewajiban & modal per akun COA</p>
              {piePasiva.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
                  Belum ada data pasiva
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={piePasiva}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {piePasiva.map((_, i) => (
                        <Cell key={i} fill={PASIVA_COLORS[i % PASIVA_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val, name) => [formatRp(val), name]} />
                    <Legend
                      formatter={(val) => (
                        <span className="text-xs">{val.length > 22 ? val.slice(0, 20) + '…' : val}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 bg-white rounded-2xl border border-gray-100 px-6 py-4 text-xs text-gray-400 flex flex-wrap justify-between gap-2">
            <span>Laporan dibuat otomatis dari data COA, Piutang (AR), dan Hutang (AP) sistem.</span>
            <span>
              Dicetak oleh sistem pada: <strong className="text-gray-600">{today()}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Neraca;
