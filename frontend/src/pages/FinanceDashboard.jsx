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
    RefreshCw, Activity, Loader2, ArrowUpRight, ArrowDownRight, PieChart as PieIcon
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const PIE_COLORS = ['#990000','#e05252','#f59e0b','#10b981','#6366f1','#8b5cf6', '#ec4899', '#14b8a6'];

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const fmtShort = (n) => {
    const abs = Math.abs(n || 0);
    if (abs >= 1e9) return `Rp ${(n/1e9).toFixed(1)}M`;
    if (abs >= 1e6) return `Rp ${(n/1e6).toFixed(1)}jt`;
    if (abs >= 1e3) return `Rp ${(n/1e3).toFixed(0)}rb`;
    return `Rp ${n}`;
};

const StatCard = ({ label, value, sub, icon: Icon, iconBg, iconColor, badge, badgeColor }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
        <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon size={20} className={iconColor}/>
            </div>
            {badge && (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>{badge}</span>
            )}
        </div>
        <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
        <p className="text-xl font-black text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1 font-semibold">{sub}</p>}
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

    const fetchData = useCallback(async (showSpinner = true) => {
        if (showSpinner) setLoading(true); else setRefreshing(true);
        try {
            const [piutangRes, hutangRes, journalRes, neracaRes] = await Promise.all([
                getAllPiutang(),
                getAllHutang(),
                journalApi.getAllJournals(),
                getReportNeraca({ cabang: 'Semua Cabang' })
            ]);

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
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            {!embedded && <Sidebar/>}
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-10 pt-6">

                    {/* ── HEADER ── */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-7">
                        <div>
                            <p className="text-xs text-[#990000] font-bold uppercase tracking-widest mb-1">Live Sync Laba Rugi & Neraca</p>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                                Dashboard <span className="text-[#990000]">Keuangan</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => fetchData(false)}
                                className="p-2.5 bg-white border border-gray-200 text-gray-500 hover:text-[#990000] rounded-xl shadow-sm transition-colors flex items-center gap-2">
                                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/>
                                <span className="text-sm font-bold">Sinkronisasi</span>
                            </button>
                        </div>
                    </div>

                    {/* ── STAT CARDS ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            label="Total Revenue (Pendapatan)" value={fmtShort(data?.totalRevenue)}
                            sub="Seluruh transaksi penjualan"
                            icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600"
                            badge="Revenue" badgeColor="bg-blue-50 text-blue-600"/>
                        <StatCard
                            label="Total Pembelian (HPP)" value={fmtShort(data?.totalPembelian)}
                            sub="Seluruh transaksi pembelian"
                            icon={CreditCard} iconBg="bg-orange-50" iconColor="text-orange-600"
                            badge="Pembelian" badgeColor="bg-orange-50 text-orange-600"/>
                        <StatCard
                            label="Kas Berjalan (In Hand)" value={fmtShort(data?.kasInHand)}
                            sub="Kas di Bank & Kas Kecil"
                            icon={Wallet} iconBg="bg-emerald-50" iconColor="text-emerald-600"
                            badge="Kas" badgeColor="bg-emerald-50 text-emerald-600"/>
                        <StatCard
                            label={isProfit ? 'Persentase Laba Bersih' : 'Persentase Rugi Bersih'}
                            value={`${data?.labaPresentase}%`}
                            sub={isProfit ? `${fmtShort(data?.labaBersih)} (Profit)` : `${fmtShort(data?.labaBersih)} (Loss)`}
                            icon={isProfit ? TrendingUp : TrendingDown}
                            iconBg={isProfit ? 'bg-amber-50' : 'bg-red-50'}
                            iconColor={isProfit ? 'text-amber-600' : 'text-red-600'}
                            badge={isProfit ? 'Profit' : 'Loss'}
                            badgeColor={isProfit ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}/>
                    </div>

                    {/* ── CHARTS ROW 1 ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                        {/* Perbandingan Revenue dan Receivable */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-black text-gray-900 mb-1">Revenue vs Receivable</h3>
                            <p className="text-xs text-gray-400 mb-6">Perbandingan Total Pendapatan vs Piutang (AR) yang belum ditagih</p>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Revenue vs AR', Revenue: data?.totalRevenue || 0, Receivable: data?.totalPiutangBelumDibayar || 0 }
                                    ]} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{fill:'#6b7280', fontSize:12, fontWeight:600}} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={v => `${(v/1e6).toFixed(0)}Jt`} tick={{fontSize:11, fill:'#9ca3af'}} axisLine={false} tickLine={false} width={45} />
                                        <Tooltip content={<CustomTooltip/>} cursor={{fill:'transparent'}}/>
                                        <Legend wrapperStyle={{fontSize:'12px', fontWeight:'600'}} />
                                        <Bar dataKey="Revenue" fill="#1f2937" radius={[6,6,0,0]} barSize={60} />
                                        <Bar dataKey="Receivable" fill="#3b82f6" radius={[6,6,0,0]} barSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Piutang vs Hutang */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="text-base font-black text-gray-900 mb-1">Piutang vs Hutang (Belum Dibayar)</h3>
                            <p className="text-xs text-gray-400 mb-6">Perbandingan AR (Piutang) dan AP (Hutang) yang masih gantung</p>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Unpaid AR vs AP', Piutang: data?.totalPiutangBelumDibayar || 0, Hutang: data?.totalHutangBelumDibayar || 0 }
                                    ]} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{fill:'#6b7280', fontSize:12, fontWeight:600}} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={v => `${(v/1e6).toFixed(0)}Jt`} tick={{fontSize:11, fill:'#9ca3af'}} axisLine={false} tickLine={false} width={45} />
                                        <Tooltip content={<CustomTooltip/>} cursor={{fill:'transparent'}}/>
                                        <Legend wrapperStyle={{fontSize:'12px', fontWeight:'600'}} />
                                        <Bar dataKey="Piutang" fill="#3b82f6" radius={[6,6,0,0]} barSize={60} />
                                        <Bar dataKey="Hutang" fill="#990000" radius={[6,6,0,0]} barSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* ── GRAFIK BIAYA ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-full md:w-1/2 shrink-0">
                                <h3 className="text-base font-black text-gray-900 mb-1">Grafik Biaya Operasional</h3>
                                <p className="text-xs text-gray-400 mb-6">Distribusi semua pengeluaran biaya operasional (Kode 6-)</p>
                                
                                {data?.biayaChartData?.length > 0 ? (
                                    <div className="h-72">
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
                                <h4 className="text-sm font-bold text-gray-700 border-b pb-3 mb-4">Rincian Biaya</h4>
                                <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                                    {data?.biayaChartData?.length > 0 ? data.biayaChartData.map((b, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full shadow-sm" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}}></div>
                                                <span className="font-bold text-gray-800 text-sm">{b.name}</span>
                                            </div>
                                            <span className="font-black text-gray-900">{fmt(b.value)}</span>
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
