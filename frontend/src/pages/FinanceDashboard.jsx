import React, { useEffect, useState, useCallback } from 'react';
import { getAllPiutang } from '../api/piutangApi';
import { getAllHutang } from '../api/hutangApi';
import { journalApi } from '../api/journalApi';
import { getReportNeraca } from '../api/reportApi';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, Wallet, CreditCard, FileText,
    RefreshCw, Activity, Loader2, ArrowUpRight, ArrowDownRight, PieChart as PieIcon,
    UserCircle, ChevronDown, CheckCircle, XCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import axios from 'axios';

const PIE_COLORS = ['#990000','#e05252','#f59e0b','#10b981','#6366f1','#8b5cf6', '#ec4899', '#14b8a6'];

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

const StatCard = ({ label, value, sub, icon }) => (
    <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 border-l-[6px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-1 hover:shadow-md min-h-[110px]">
        <div className="flex items-center gap-3 mb-2">
            {icon && (
                <div className="w-[30px] h-[30px] rounded-full bg-[#990000] flex items-center justify-center shrink-0 shadow-sm shadow-red-900/20">
                    {icon}
                </div>
            )}
            <p className="text-[12px] font-bold text-gray-500 tracking-wider uppercase truncate">{label}</p>
        </div>
        <p className="text-2xl font-black text-gray-900 leading-tight truncate">{value}</p>
        {sub && <p className="text-[11px] mt-1 font-medium text-gray-400 truncate">{sub}</p>}
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xl">
            <p className="text-xs text-gray-500 font-semibold mb-1.5">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-xs font-bold" style={{color: p.color}}>{p.name}: {fmt(p.value)}</p>
            ))}
        </div>
    );
};

export default function FinanceDashboard({ embedded = false }) {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    
    const userRole = JSON.parse(localStorage.getItem('user'))?.role;
    const isOwner = userRole?.toLowerCase() === 'owner';

    const fetchData = useCallback(async (showSpinner = true) => {
        if (showSpinner) setLoading(true); else setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const [piutangRes, hutangRes, journalRes, neracaRes, approvalRes] = await Promise.all([
                getAllPiutang(),
                getAllHutang(),
                journalApi.getAllJournals(),
                getReportNeraca({ cabang: 'Semua Cabang' }),
                isOwner ? axios.get('http://localhost:3000/api/owner/approval', { headers: { Authorization: `Bearer ${token}` } }).catch(()=>({data:{data:[]}})) : Promise.resolve({data:{data:[]}})
            ]);

            const allApprovals = approvalRes.data?.data || [];
            if (isOwner) setPendingApprovals(allApprovals.filter(a => a.status === 'pending'));

            // 1. Kas In Hand (Berjalan)
            const kasAktiva = neracaRes.data?.data?.aktiva || [];
            const kasBank = kasAktiva.find(a => a.nama_akun?.toLowerCase().includes('kas di bank'))?.saldo || 0;
            const kasKecil = kasAktiva.find(a => a.nama_akun?.toLowerCase().includes('kas kecil'))?.saldo || 0;
            const kasInHand = kasBank + kasKecil;

            // Helper Journal
            const journalList = Array.isArray(journalRes.data) ? journalRes.data : [];
            const getJournalBal = (prefix, normal) => {
                let bal = 0;
                journalList.forEach(j => {
                    const amt = Number(j.amount || 0);
                    if (j.debit_account && j.debit_account.startsWith(prefix)) bal += normal === 'Debit' ? amt : -amt;
                    if (j.credit_account && j.credit_account.startsWith(prefix)) bal += normal === 'Credit' ? amt : -amt;
                });
                return bal;
            };

            // 2. Piutang & Receivable
            const piutangData = piutangRes.data?.data || [];
            const unpaidPiutangList = piutangData.filter(p => p.status !== 'Paid' && p.status !== 'Void');
            const totalPiutangBelumDibayar = unpaidPiutangList.reduce((s, p) => s + Number(p.sisa || 0), 0);
            const totalPiutangNominal = piutangData.filter(p => p.status !== 'Void').reduce((s, p) => s + Number(p.nominal || 0), 0);

            // 3. Hutang & Payable
            const hutangData = hutangRes.data?.data || [];
            const unpaidHutangList = hutangData.filter(h => h.status !== 'Paid' && h.status !== 'Void');
            const totalHutangBelumDibayar = unpaidHutangList.reduce((s, h) => s + Number(h.sisa || 0), 0);
            const totalHutangNominal = hutangData.filter(h => h.status !== 'Void').reduce((s, h) => s + Number(h.nominal || 0), 0);

            // 4. Revenue & Pembelian
            const revenueJournal = getJournalBal('4-', 'Credit');
            const totalRevenue = totalPiutangNominal + revenueJournal;

            const hppJournal = getJournalBal('5-', 'Debit');
            const totalPembelian = totalHutangNominal + hppJournal; // Total Pembelian (HPP)

            // 5. Biaya Operasional & Grafik
            const totalBiaya = getJournalBal('6-', 'Debit');
            const biayaMap = {};
            journalList.forEach(j => {
                if (j.debit_account && j.debit_account.startsWith('6-')) {
                    const amt = Number(j.amount || 0);
                    const name = j.debit_account.substring(7) || 'Lain-lain';
                    biayaMap[name] = (biayaMap[name] || 0) + amt;
                }
            });
            const biayaChartData = Object.keys(biayaMap).map(k => ({ name: k, value: biayaMap[k] })).sort((a,b) => b.value - a.value);

            // 6. Laba & Persentase
            const labaKotor = totalRevenue - totalPembelian;
            const labaBersih = labaKotor - totalBiaya;
            const labaPresentase = totalRevenue > 0 ? ((labaBersih / totalRevenue) * 100).toFixed(1) : 0;

            setData({
                kasInHand,
                totalRevenue,
                totalPembelian,
                totalPiutangBelumDibayar,
                totalHutangBelumDibayar,
                labaBersih,
                labaPresentase,
                biayaChartData
            });

        } catch (e) { 
            console.error('Dashboard error:', e); 
        } finally { 
            setLoading(false); 
            setRefreshing(false); 
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleApprove = async (id) => {
        if(!window.confirm('Setujui invoice/quotation ini?')) return;
        try {
            await axios.put(`http://localhost:3000/api/owner/approval/${id}`, { status: 'approved' }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
            fetchData();
        } catch (e) { alert('Gagal menyetujui'); }
    };

    const handleReject = async (id) => {
        if(!window.confirm('Tolak invoice/quotation ini?')) return;
        try {
            await axios.put(`http://localhost:3000/api/owner/approval/${id}`, { status: 'rejected' }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
            fetchData();
        } catch (e) { alert('Gagal menolak'); }
    };

    if (loading) return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            {!embedded && <Sidebar/>}
            <main className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-[#990000] mx-auto mb-3" size={36}/>
                    <p className="text-gray-400 text-sm">Mensinkronisasi data Laba Rugi, Neraca & Jurnal...</p>
                </div>
            </main>
        </div>
    );

    const isProfit = (data?.labaBersih || 0) >= 0;

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans relative">
            {!embedded && <Sidebar/>}
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                {!embedded && (
                    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-10 sticky top-0 z-30 justify-end shrink-0">
                        <div className="flex items-center gap-3">
                            <NotificationBell />
                            <div className="relative flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setShowProfile(!showProfile)}>
                                <UserCircle className="text-gray-400" size={24} />
                                <ChevronDown size={14} className="text-gray-400" />
                                {showProfile && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                        <div className="p-4 bg-red-50/50">
                                            <p className="text-sm font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                                            <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || '').replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>
                )}

                <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10 pt-8">

                    {/* ── HEADER ── */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 max-w-[1600px] mx-auto">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                Dashboard Finance
                            </h1>
                            <p className="text-gray-500 mt-1 text-xs font-medium">Live Sync Laba Rugi, Neraca, dan aktivitas real-time</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => fetchData(false)}
                                className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-[#990000] rounded-xl shadow-sm transition-colors flex items-center gap-2">
                                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''}/>
                                <span className="text-[11px] font-bold">Sync</span>
                            </button>
                        </div>
                    </div>

                    {/* ── STAT CARDS ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <StatCard
                            label="Total Revenue" value={fmtCompact(data?.totalRevenue)}
                            sub="Seluruh transaksi penjualan" icon={<TrendingUp size={14} className="text-white"/>} />
                        <StatCard
                            label="Total Pembelian" value={fmtCompact(data?.totalPembelian)}
                            sub="Seluruh transaksi pembelian" icon={<TrendingDown size={14} className="text-white"/>} />
                        <StatCard
                            label="Kas Berjalan" value={fmtCompact(data?.kasInHand)}
                            sub="Kas di Bank & Kas Kecil" icon={<Wallet size={14} className="text-white"/>} />
                        <StatCard
                            label={isProfit ? 'Persentase Laba Bersih' : 'Persentase Rugi Bersih'}
                            value={`${data?.labaPresentase}%`}
                            sub={isProfit ? `${fmtCompact(data?.labaBersih)} (Profit)` : `${fmtCompact(data?.labaBersih)} (Loss)`} icon={<Activity size={14} className="text-white"/>} />
                    </div>

                    {/* ── CHARTS ROW 1 + APPROVAL ── */}
                    <div className={`grid grid-cols-1 ${isOwner ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 mb-4`}>
                        {/* Income vs Expense */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 col-span-1">
                            <h3 className="text-xs font-black text-gray-900 mb-1">Income vs Expense</h3>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Inc vs Exp', Income: data?.totalRevenue || 0, Expense: (data?.totalPembelian || 0) + (data?.biayaChartData || []).reduce((a,b)=>a+b.value, 0) }
                                    ]} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{fill:'#6b7280', fontSize:12, fontWeight:600}} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={v => `${(v/1e6).toFixed(0)}Jt`} tick={{fontSize:11, fill:'#9ca3af'}} axisLine={false} tickLine={false} width={45} />
                                        <Tooltip content={<CustomTooltip/>} cursor={{fill:'transparent'}}/>
                                        <Legend wrapperStyle={{fontSize:'12px', fontWeight:'600'}} />
                                        <Bar dataKey="Income" fill="#990000" radius={[4,4,0,0]} barSize={20} />
                                        <Bar dataKey="Expense" fill="#475569" radius={[4,4,0,0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold">Income</p>
                                    <p className="text-xs font-black text-[#990000]">{fmtCompact(data?.totalRevenue)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold">Expense</p>
                                    <p className="text-xs font-black text-gray-700">{fmtCompact((data?.totalPembelian || 0) + (data?.biayaChartData || []).reduce((a,b)=>a+b.value, 0))}</p>
                                </div>
                            </div>
                        </div>

                        {/* Perbandingan Revenue dan Receivable */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 col-span-1">
                            <h3 className="text-xs font-black text-gray-900 mb-1">Rev vs AR</h3>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Revenue vs AR', Revenue: data?.totalRevenue || 0, Receivable: data?.totalPiutangBelumDibayar || 0 }
                                    ]} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{fill:'#6b7280', fontSize:12, fontWeight:600}} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={v => `${(v/1e6).toFixed(0)}Jt`} tick={{fontSize:11, fill:'#9ca3af'}} axisLine={false} tickLine={false} width={45} />
                                        <Tooltip content={<CustomTooltip/>} cursor={{fill:'transparent'}}/>
                                        <Legend wrapperStyle={{fontSize:'12px', fontWeight:'600'}} />
                                        <Bar dataKey="Revenue" fill="#990000" radius={[4,4,0,0]} barSize={20} />
                                        <Bar dataKey="Receivable" fill="#f87171" radius={[4,4,0,0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold">Revenue</p>
                                    <p className="text-xs font-black text-[#990000]">{fmtCompact(data?.totalRevenue)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold">Receivable</p>
                                    <p className="text-xs font-black text-red-400">{fmtCompact(data?.totalPiutangBelumDibayar)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Piutang vs Hutang */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 col-span-1">
                            <h3 className="text-xs font-black text-gray-900 mb-1">Piutang vs Hutang</h3>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Unpaid AR vs AP', Piutang: data?.totalPiutangBelumDibayar || 0, Hutang: data?.totalHutangBelumDibayar || 0 }
                                    ]} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{fill:'#6b7280', fontSize:12, fontWeight:600}} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={v => `${(v/1e6).toFixed(0)}Jt`} tick={{fontSize:11, fill:'#9ca3af'}} axisLine={false} tickLine={false} width={45} />
                                        <Tooltip content={<CustomTooltip/>} cursor={{fill:'transparent'}}/>
                                        <Legend wrapperStyle={{fontSize:'12px', fontWeight:'600'}} />
                                        <Bar dataKey="Piutang" fill="#f87171" radius={[4,4,0,0]} barSize={20} />
                                        <Bar dataKey="Hutang" fill="#990000" radius={[4,4,0,0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold">Piutang</p>
                                    <p className="text-xs font-black text-red-400">{fmtCompact(data?.totalPiutangBelumDibayar)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold">Hutang</p>
                                    <p className="text-xs font-black text-[#990000]">{fmtCompact(data?.totalHutangBelumDibayar)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Approval Panel - HANYA UNTUK OWNER */}
                        {isOwner && (
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col border-t-[3px] border-t-blue-500 col-span-1">
                                <h3 className="text-xs font-black text-gray-900 mb-3 flex items-center gap-1.5">
                                    <CheckCircle className="text-blue-500" size={14} /> Approval Finance
                                </h3>
                                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
                                    {pendingApprovals.length > 0 ? pendingApprovals.map(a => (
                                        <div key={a.id} className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                                            <p className="text-[11px] font-bold text-gray-800 mb-0.5 truncate">{a.reference_number}</p>
                                            <p className="text-[9px] text-gray-500 mb-2 truncate">Rp {fmtCompact(a.amount)} | {a.request_type}</p>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleApprove(a.id)} className="flex-1 bg-blue-600 text-white text-[9px] font-bold py-1 rounded hover:bg-blue-700 transition-colors">Setujui</button>
                                                <button onClick={() => handleReject(a.id)} className="flex-1 bg-white text-red-600 border border-red-200 text-[9px] font-bold py-1 rounded hover:bg-red-50 transition-colors">Tolak</button>
                                            </div>
                                        </div>
                                    )) : <div className="text-center text-[10px] text-gray-400 font-bold italic py-8">Tidak ada persetujuan</div>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── GRAFIK BIAYA ── */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-full md:w-1/2 shrink-0">
                                <h3 className="text-xs font-black text-gray-900 mb-1">Distribusi Biaya</h3>
                                
                                {data?.biayaChartData?.length > 0 ? (
                                    <div className="h-40">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie 
                                                    data={data.biayaChartData} 
                                                    innerRadius={70} 
                                                    outerRadius={100} 
                                                    paddingAngle={3} 
                                                    dataKey="value"
                                                >
                                                    {data.biayaChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                                                </Pie>
                                                <Tooltip formatter={v => fmt(v)} contentStyle={{borderRadius:'10px',fontSize:'12px',border:'none',boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-72 flex flex-col items-center justify-center text-gray-400">
                                        <PieIcon size={48} className="mb-3 text-gray-200" />
                                        <p className="text-sm font-semibold">Belum ada data biaya</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-full md:w-1/2 flex-1">
                                <h4 className="text-[11px] font-bold text-gray-700 border-b pb-2 mb-3">Rincian Biaya</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {data?.biayaChartData?.length > 0 ? data.biayaChartData.map((b, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}}></div>
                                                <span className="font-bold text-gray-800 text-[11px]">{b.name}</span>
                                            </div>
                                            <span className="font-black text-gray-900 text-[11px]">{fmtCompact(b.value)}</span>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-400 text-center py-10">Data kosong</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
