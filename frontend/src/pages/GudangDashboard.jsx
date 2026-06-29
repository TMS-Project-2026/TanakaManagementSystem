import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getGudangDashboard } from '../api/gudangApi';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Box, Settings, UserCircle, Search, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';

const GudangDashboard = ({ embedded = false }) => {
    const [data, setData] = useState({
        totalItem: 0,
        totalStok: 0,
        masukHariIni: 0,
        keluarHariIni: 0,
        stokMenipisCount: 0,
        totalSparepart: 0,
        chartData: [],
        hampirHabis: []
    });
    const [showProfile, setShowProfile] = useState(false);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    
    const userRole = JSON.parse(localStorage.getItem('user'))?.role;
    const isOwner = userRole?.toLowerCase() === 'owner';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await getGudangDashboard();
            const resAnalisis = await axios.get('http://localhost:3000/api/stok/analisis', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const resPermintaan = await axios.get('http://localhost:3000/api/permintaan-stok', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.data.status === 'success') {
                setData(prev => ({
                    ...res.data.data,
                    fastMoving: resAnalisis.data.data.fastMoving,
                    deadStock: resAnalisis.data.data.deadStock
                }));
            }
            if (isOwner && resPermintaan.data.status === 'success') {
                setPendingApprovals((resPermintaan.data.data || []).filter(r => r.status?.toLowerCase() === 'pending'));
            }
        } catch (error) {
            console.error("Gagal memuat data dashboard gudang", error);
        }
    };

    const handleApproveStok = async (id) => {
        if(!window.confirm('Setujui permintaan stok ini?')) return;
        try {
            await axios.post(`http://localhost:3000/api/permintaan-stok/${id}/approve`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
            fetchDashboardData();
        } catch (e) { alert('Gagal menyetujui'); }
    };

    const handleRejectStok = async (id) => {
        if(!window.confirm('Tolak permintaan stok ini?')) return;
        try {
            await axios.post(`http://localhost:3000/api/permintaan-stok/${id}/reject`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
            fetchDashboardData();
        } catch (e) { alert('Gagal menolak'); }
    };

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans relative">
            {!embedded && <Sidebar />}
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
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

                <div className="flex-1 overflow-y-auto px-10 py-10 bg-[#f8fafc]">
                    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Dynamic Header Module Title */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-2">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    Dashboard Gudang
                                </h1>
                                <p className="text-gray-500 mt-1 text-xs font-medium">Ringkasan aktivitas, pergerakan barang, dan analisis inventori secara real-time</p>
                            </div>
                        </div>

                        {/* Summary Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {[
                                { title: 'Total Item Barang', value: `${data.totalItem}`, icon: <Box size={14} className="text-white" /> },
                                { title: 'Total Stok Gudang', value: `${data.totalStok}`, icon: <Package size={14} className="text-white" /> },
                                { title: 'Masuk Hari Ini', value: `${data.masukHariIni}`, icon: <TrendingDown size={14} className="text-white" /> },
                                { title: 'Keluar Hari Ini', value: `${data.keluarHariIni}`, icon: <TrendingUp size={14} className="text-white" /> },
                                { title: 'Warning Stok', value: `${data.stokMenipisCount}`, icon: <AlertTriangle size={14} className="text-white" /> }
                            ].map((card, index) => (
                                <div key={index} className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 border-l-[4px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-1 hover:shadow-md min-h-[90px]">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-[24px] h-[24px] rounded-full bg-[#990000] flex items-center justify-center shrink-0 shadow-sm shadow-red-900/20">
                                            {card.icon}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase truncate">{card.title || card.label}</p>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 leading-tight truncate">{card.value}</h3>
                                    {card.sub && <p className="text-[9px] mt-0.5 font-medium text-gray-400 truncate">{card.sub}</p>}
                                </div>
                            ))}
                        </div>

                        {/* Mid Section: Chart, Warning Stock, Approvals */}
                        <div className={`grid grid-cols-1 ${isOwner ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
                            {/* Chart Section */}
                            <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <TrendingUp className="text-[#990000]" size={16} /> Pergerakan Barang (7 Hari)
                                    </h3>
                                </div>
                                <div className="h-48 w-full">
                                    {data.chartData && data.chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                                                <Line type="monotone" dataKey="masuk" name="Masuk" stroke="#990000" strokeWidth={3} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="keluar" name="Keluar" stroke="#ff4d4d" strokeWidth={3} dot={{ r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">Belum ada data</div>
                                    )}
                                </div>
                            </div>

                            {/* Warning Stok List */}
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="text-orange-500" size={16} /> Barang Hampir Habis
                                </h3>
                                <div className="space-y-3 flex-1 overflow-y-auto max-h-[190px] pr-1 custom-scrollbar">
                                    {data.hampirHabis && data.hampirHabis.length > 0 ? (
                                        data.hampirHabis.map((item, idx) => (
<<<<<<< HEAD
                                            <div key={idx} className="flex flex-col gap-1 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-800 truncate block w-[60%]">{item.nama_barang}</span>
                                                    <span className="text-[10px] font-black text-red-600 shrink-0">{item.jumlah} Pcs</span>
=======
                                            <div key={idx} className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-red-50 text-[#990000] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="relative flex-1 min-w-0">
                                                        <span className="text-xs font-bold text-gray-800 truncate w-full block">
                                                            {item.nama_barang} {item.ukuran ? `- ${item.ukuran}` : ''}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">
                                                            Cabang: {item.cabang_id}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-black text-red-600 shrink-0">{item.jumlah} Pcs</span>
>>>>>>> 6578383c699956ccbd0921ed0eae0a492a410488
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                                                        <div className="h-1 rounded-full transition-all duration-700 bg-[#990000]" style={{ width: `${Math.min(100, ((item.jumlah || 0) / (item.minimum_stok || 1)) * 100)}%` }} />
                                                    </div>
                                                    <span className="text-[8px] text-gray-400 font-semibold w-10 text-right">Min: {item.minimum_stok}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-[10px] text-gray-400 font-bold italic py-8">Semua stok aman!</div>
                                    )}
                                </div>
                            </div>

                            {/* Approval Panel - HANYA UNTUK OWNER */}
                            {isOwner && (
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col border-t-[3px] border-t-blue-500">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <CheckCircle className="text-blue-500" size={16} /> Approval Stok
                                    </h3>
                                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[190px] pr-1 custom-scrollbar">
                                        {pendingApprovals.length > 0 ? pendingApprovals.map(p => (
                                            <div key={p.id} className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                                                <p className="text-[11px] font-bold text-gray-800 mb-0.5 truncate">{p.nama_barang || `Barang #${p.barang_id}`}</p>
                                                <p className="text-[9px] text-gray-500 mb-2">Req: <span className="font-bold text-blue-700">{p.jumlah} Pcs</span> | Cabang: {p.cabang_id}</p>
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => handleApproveStok(p.id)} className="flex-1 bg-blue-600 text-white text-[9px] font-bold py-1 rounded hover:bg-blue-700 transition-colors">Setujui</button>
                                                    <button onClick={() => handleRejectStok(p.id)} className="flex-1 bg-white text-red-600 border border-red-200 text-[9px] font-bold py-1 rounded hover:bg-red-50 transition-colors">Tolak</button>
                                                </div>
                                            </div>
                                        )) : <div className="text-center text-[10px] text-gray-400 font-bold italic py-8">Tidak ada permintaan pending</div>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Section: Fast Moving & Dead Stock */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
                            {/* Fast Moving */}
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <TrendingUp className="text-green-500" size={16} /> Fast Moving (30 Hari)
                                </h3>
                                <div className="space-y-3 flex-1 overflow-y-auto max-h-[150px] pr-1 custom-scrollbar">
                                    {data.fastMoving && data.fastMoving.length > 0 ? (
                                        data.fastMoving.map((item, idx) => (
<<<<<<< HEAD
                                            <div key={idx} className="flex flex-col gap-1 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 w-[70%]">
                                                        <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                                                        <span className="text-[11px] font-bold text-gray-800 truncate block w-full">{item.nama_barang}</span>
=======
                                            <div key={idx} className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="relative flex-1 min-w-0">
                                                        <span className="text-xs font-bold text-gray-800 truncate w-full block">
                                                            {item.nama_barang} {item.ukuran ? `- ${item.ukuran}` : ''}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">
                                                            Sisa Stok: {item.jumlah}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-black text-emerald-600 shrink-0">{item.total_terjual} Pcs</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-7">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="h-1.5 rounded-full transition-all duration-700 bg-emerald-500"
                                                            style={{ width: `${Math.min(100, ((item.total_terjual || 0) / (data.fastMoving[0]?.total_terjual || 1)) * 100)}%` }}
                                                        />
>>>>>>> 6578383c699956ccbd0921ed0eae0a492a410488
                                                    </div>
                                                    <span className="text-[10px] font-black text-emerald-600 shrink-0">{item.total_terjual} Pcs</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-[10px] text-gray-400 font-bold italic py-6">Belum ada data penjualan</div>
                                    )}
                                </div>
                            </div>

                            {/* Dead Stock */}
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <AlertTriangle className="text-red-600" size={16} /> Dead Stock ({'>'}60 Hari)
                                    </h3>
                                    <span className="text-[8px] font-black text-red-600 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Perlu Tindakan</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 overflow-y-auto max-h-[150px] pr-1 custom-scrollbar">
                                    {data.deadStock && data.deadStock.length > 0 ? (
                                        data.deadStock.map((item, idx) => (
<<<<<<< HEAD
                                            <div key={idx} className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex justify-between items-center">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="font-bold text-gray-800 text-[10px] truncate">{item.nama_barang}</p>
                                                    <p className="text-[8px] text-red-500 font-bold mt-0.5">⚠️ &gt; 2 Bulan</p>
=======
                                            <div key={idx} className="bg-gray-50/50 hover:bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center transition-all">
                                                <div className="min-w-0 flex-1 pr-3">
                                                    <p className="font-bold text-gray-800 text-xs truncate">{item.nama_barang} {item.ukuran ? `- ${item.ukuran}` : ''}</p>
                                                    <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ Mengendap &gt; 2 Bulan</p>
>>>>>>> 6578383c699956ccbd0921ed0eae0a492a410488
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="inline-block bg-red-50 border border-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-md">{item.jumlah} Pcs</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-[10px] text-gray-400 font-bold italic py-6 col-span-full">Semua stok berputar dengan baik!</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GudangDashboard;
