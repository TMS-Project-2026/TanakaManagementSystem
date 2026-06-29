import React, { useEffect, useState } from 'react';
import { getOwnerDashboard } from '../api/ownerApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package, AlertCircle, Shield,
  UserCircle, CheckCircle, FileText, Check, X, ChevronRight, ChevronDown,
  Activity, RefreshCw, Loader2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const fmt = (n) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0
}).format(n || 0);

const fmtCompact = (n) => {
  if (!n) return 'Rp 0';
  if (Math.abs(n) >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}M`;
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toFixed(1)}Jt`;
  if (Math.abs(n) >= 1e3) return `Rp ${(n / 1e3).toFixed(0)}Rb`;
  return fmt(n);
};

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [permintaan, setPermintaan] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async (showLoader = true) => {
    if (showLoader) setLoading(true); else setRefreshing(true);
    try {
      const [ownerRes, approvalRes, notifRes] = await Promise.all([
        getOwnerDashboard(),
        axios.get('http://localhost:3000/api/owner/approval', { headers }),
        axios.get('http://localhost:3000/api/notifications', { headers }),
      ]);
      if (ownerRes.data.status === 'success') setData(ownerRes.data.data);
      const all = approvalRes.data.data || [];
      setApprovals(all.filter(a => a.status === 'pending'));
      setPermintaan(notifRes.data.data?.permintaanStok || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(() => fetchAll(false), 30000);
    return () => clearInterval(id);
  }, []);

  const handleApproval = async (id, status) => {
    let alasan = '';
    if (status === 'rejected') {
      alasan = window.prompt('Masukkan alasan penolakan:');
      if (alasan === null) return;
    } else if (!window.confirm('Yakin menyetujui pengajuan ini?')) return;
    try {
      await axios.put(`http://localhost:3000/api/owner/approval/${id}`,
        { status, alasan_penolakan: alasan }, { headers });
      fetchAll(false);
    } catch { alert('Gagal memproses'); }
  };

  const handleApprovePermintaan = async (id) => {
    if (!window.confirm('Setujui permintaan stok ini?')) return;
    try {
      await axios.post(`http://localhost:3000/api/permintaan-stok/${id}/approve`, {}, { headers });
      fetchAll(false);
    } catch (err) { alert(err.response?.data?.message || 'Stok tidak mencukupi'); }
  };

  if (loading) return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-red-800" size={32} />
          <p className="text-sm font-bold text-gray-400">Memuat Dashboard Owner...</p>
        </div>
      </main>
    </div>
  );

  // ── Data dummy untuk status pertumbuhan (karena API belum menyediakan) ──
  const growth = { revenue: '+12.5%', expense: '-4.3%', profit: '+18.7%' };

  // ── Mini stat cards data ──────────────────────────────────────
  const stats = [
    { label: 'REVENUE', value: fmtCompact(data?.totalRevenue), color: 'text-emerald-500', bg: 'bg-emerald-50', icon: <TrendingUp size={18} className="text-emerald-600" />, sub: <span className="text-emerald-500 font-black text-[10px]">▲ {growth.revenue}</span> },
    { label: 'EXPENSE', value: fmtCompact(data?.totalExpense), color: 'text-red-500', bg: 'bg-red-50', icon: <TrendingDown size={18} className="text-red-600" />, sub: <span className="text-red-500 font-black text-[10px]">▼ {growth.expense.replace('-','')}</span> },
    { label: 'NET PROFIT', value: fmtCompact(data?.netProfit), color: 'text-blue-500', bg: 'bg-blue-50', icon: <Activity size={18} className="text-blue-600" />, sub: <span className="text-emerald-500 font-black text-[10px]">▲ {growth.profit}</span> },
    { label: 'APPROVAL', value: approvals.length, color: 'text-amber-500', bg: 'bg-amber-50', icon: <Shield size={18} className="text-amber-600" />, sub: <span className="text-gray-400 font-medium text-[10px]">Menunggu</span> },
    { label: 'REQ STOK', value: permintaan.length, color: 'text-purple-500', bg: 'bg-purple-50', icon: <Package size={18} className="text-purple-600" />, sub: <span className="text-gray-400 font-medium text-[10px]">Permintaan</span> },
    { label: 'INVOICE', value: data?.unpaidInvoice || 0, color: 'text-cyan-500', bg: 'bg-cyan-50', icon: <AlertCircle size={18} className="text-cyan-600" />, sub: <span className="text-gray-400 font-medium text-[10px]">Belum dibayar</span> },
  ];

  // chart data dari ownerController (profitExpenseTrend atau fallback)
  const chartData = data?.chartData?.profitExpenseTrend || data?.chartData?.revenueTrend || [];

  return (
    <div className="flex bg-gray-100 font-sans" style={{ height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* ── TOPBAR ── compact h-12 */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-800 flex items-center justify-center shrink-0">
              <Activity size={13} className="text-white" />
            </div>
            <div>
              <span className="font-black text-gray-900 text-sm">Owner </span>
              <span className="font-black text-[#990000] text-sm">Dashboard</span>
              <span className="ml-2 text-[10px] text-gray-400 font-medium hidden sm:inline">· Rekap semua departemen</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAll(false)}
              className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <NotificationBell />
            <div
              className="relative flex items-center gap-1.5 bg-gray-50 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setShowProfile(!showProfile)}
            >
              <UserCircle size={22} className="text-gray-400" />
              <div className="hidden sm:block leading-tight">
                <p className="text-[11px] font-black text-gray-800">{user.nama || user.username || 'Owner'}</p>
                <p className="text-[9px] text-red-700 font-bold uppercase">Owner</p>
              </div>
              {showProfile && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-3 bg-red-50/60">
                    <p className="text-sm font-black text-gray-900">{user.nama || user.username}</p>
                    <p className="text-[10px] font-bold text-red-700 uppercase mt-0.5">Owner</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── BODY — fixed height, scrollable content ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 custom-scrollbar bg-white">

          {/* ROW 1 — 6 stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 shrink-0">
            {stats.map((s, i) => (
              <div key={i} className={`bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-lg transition-all`}>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-800 uppercase tracking-wide mb-1">{s.label}</p>
                  <p className="text-lg font-black text-gray-900 leading-none mb-2">{s.value}</p>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* ROW 2 — main content: 3 kolom */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* COL 1: Panel Approval Pending */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 shrink-0">
                <h3 className="text-base font-black text-gray-900">Perlu Di-Approve</h3>
                <button onClick={() => navigate('/finance/approval')} className="text-xs text-blue-600 font-bold hover:underline">Lihat semua</button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2 max-h-[350px] custom-scrollbar">
                {approvals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
                    <CheckCircle size={32} className="text-green-400" />
                    <p className="text-sm font-bold text-gray-400">Semua sudah diproses ✓</p>
                  </div>
                ) : approvals.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50/50 rounded-xl transition-colors group">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-black text-gray-900">{item.no_quotation || item.keterangan || `REQ-2025-${item.id.toString().padStart(3, '0')}`}</p>
                      <p className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]">{item.diajukan_oleh}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xs font-black text-gray-900">{fmt(item.nominal || 0)}</p>
                      <span className="text-[9px] font-black px-2 py-1 rounded bg-orange-50 text-orange-600 w-12 text-center">
                        {item.tipe === 'quotation_to_invoice' ? 'INV' : (item.tipe?.includes('po') ? 'PO' : 'REQ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COL 2: Panel Permintaan Stok */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 shrink-0">
                <h3 className="text-base font-black text-gray-900">Permintaan Stok</h3>
                <button onClick={() => navigate('/permintaan-stok')} className="text-xs text-blue-600 font-bold hover:underline">Lihat semua</button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2 max-h-[350px] custom-scrollbar">
                {permintaan.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
                    <CheckCircle size={32} className="text-green-400" />
                    <p className="text-sm font-bold text-gray-400">Tidak ada permintaan</p>
                  </div>
                ) : permintaan.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50/50 rounded-xl transition-colors">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-black text-gray-900">REQ-2025-{item.id.toString().padStart(3, '0')}</p>
                      <p className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]">{item.nama_barang}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xs font-black text-gray-900">{item.jumlah} <span className="text-[10px] text-gray-500 font-medium">pcs</span></p>
                      <span className="text-[9px] font-black px-2 py-1 rounded bg-blue-50 text-blue-600 w-12 text-center">Baru</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COL 3: Revenue vs Expense Chart */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-base font-black text-gray-900">Revenue vs Expense</h3>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                  Bulan Ini <ChevronDown size={12} />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 mb-4">
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div><span className="text-[10px] font-bold text-gray-600">Revenue</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500 rounded-sm"></div><span className="text-[10px] font-bold text-gray-600">Expense</span></div>
              </div>

              <div className="h-[200px] w-full shrink-0">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 600 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} formatter={v => fmt(v)} contentStyle={{ borderRadius: '12px', fontSize: '11px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                      <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={12} />
                      <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-gray-400 font-bold">Belum ada data chart</p>
                  </div>
                )}
              </div>

              {/* Chart Summaries */}
              <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Total Revenue</p>
                  <p className="text-sm font-black text-gray-900">{fmtCompact(data?.totalRevenue)}</p>
                  <p className="text-[10px] font-black text-emerald-500 mt-1">▲ {growth.revenue}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 mb-1">Total Expense</p>
                  <p className="text-sm font-black text-gray-900">{fmtCompact(data?.totalExpense)}</p>
                  <p className="text-[10px] font-black text-red-500 mt-1">▼ {growth.expense.replace('-','')}</p>
                </div>
              </div>
            </div>

          </div>

          {/* ROW 3 — Menu Cepat (Quick Menu) */}
          <div className="mt-4">
            <h3 className="text-base font-black text-gray-900 mb-4">Menu Cepat</h3>
            <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { label: 'Finance', path: '/finance', color: 'text-blue-600', bg: 'bg-blue-50', icon: <DollarSign size={24} /> },
                { label: 'Approval', path: '/finance/approval', color: 'text-amber-500', bg: 'bg-amber-50', icon: <Shield size={24} /> },
                { label: 'Invoice', path: '/invoice', color: 'text-red-500', bg: 'bg-red-50', icon: <FileText size={24} /> },
                { label: 'Gudang', path: '/gudang', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: <Package size={24} /> },
                { label: 'Req Stok', path: '/permintaan-stok', color: 'text-purple-500', bg: 'bg-purple-50', icon: <Package size={24} /> },
                { label: 'Mkt Online', path: '/marketing-online/dashboard', color: 'text-sky-500', bg: 'bg-sky-50', icon: <TrendingUp size={24} /> },
                { label: 'Mkt Offline', path: '/marketing-offline/dashboard', color: 'text-indigo-500', bg: 'bg-indigo-50', icon: <TrendingUp size={24} /> },
                { label: 'Monitoring', path: '/it/dashboard', color: 'text-gray-600', bg: 'bg-gray-100', icon: <Activity size={24} /> },
              ].map((m, i) => (
                <button
                  key={i}
                  onClick={() => navigate(m.path)}
                  className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:shadow-md hover:-translate-y-1 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl ${m.bg} ${m.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {m.icon}
                  </div>
                  <span className="text-[10px] font-black text-gray-700">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between text-gray-400 text-[10px] font-bold pb-4">
             <span>© 2026 Tanaka Management System</span>
             <div className="flex items-center gap-4">
                <span>v1.0.0</span>
                <span>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
