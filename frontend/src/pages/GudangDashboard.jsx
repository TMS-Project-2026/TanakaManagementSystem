import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getGudangDashboard } from '../api/gudangApi';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Box, Settings, UserCircle, Search, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';

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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await getGudangDashboard();
            const resAnalisis = await axios.get('http://localhost:3000/api/stok/analisis', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (res.data.status === 'success') {
                setData(prev => ({
                    ...res.data.data,
                    fastMoving: resAnalisis.data.data.fastMoving,
                    deadStock: resAnalisis.data.data.deadStock
                }));
            }
        } catch (error) {
            console.error("Gagal memuat data dashboard gudang", error);
        }
    };

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans relative">
            {!embedded && <Sidebar />}
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-10 sticky top-0 z-30 justify-end shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                            <div className="bg-gray-100 p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => setShowProfile(!showProfile)}>
                                <UserCircle className="text-gray-400" size={24} />
                            </div>
                            <ChevronDown size={14} className="text-gray-400" />
                            {showProfile && (
                                <div className="absolute right-10 top-16 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-4 bg-red-50/50">
                                        <p className="text-sm font-black text-gray-900">Admin</p>
                                        <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">Role Gudang</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-10 py-10 bg-[#f8fafc]">
                    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Dynamic Header Module Title */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    Dashboard Gudang
                                </h1>
                                <p className="text-gray-500 mt-2 text-sm font-medium">Ringkasan aktivitas, pergerakan barang, dan analisis inventori secara real-time</p>
                            </div>
                        </div>

                        {/* Summary Cards Grid (3 Columns) - Compact version matching Marketing Online exactly */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { title: 'Total Item Barang', value: `${data.totalItem} Item`, bg: 'bg-red-100', text: 'text-gray-900' },
                                { title: 'Total Stok Gudang', value: `${data.totalStok} Pcs`, bg: 'bg-[#ff3b3b]', text: 'text-white' },
                                { title: 'Masuk Hari Ini', value: `${data.masukHariIni} Pcs`, bg: 'bg-red-100', text: 'text-gray-900' },
                                { title: 'Keluar Hari Ini', value: `${data.keluarHariIni} Pcs`, bg: 'bg-red-100', text: 'text-gray-900' },
                                { title: 'Warning Stok', value: `${data.stokMenipisCount} Item`, bg: 'bg-[#ff4d4d]', text: 'text-white' }
                            ].map((card, index) => (
                                <div key={index} className={`${card.bg} p-6 rounded-[2rem] shadow-sm flex flex-col justify-center min-h-[120px] transition-transform hover:scale-[1.01]`}>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${card.text === 'text-white' ? 'text-white/80' : 'text-red-900/60'}`}>{card.title}</p>
                                    <h3 className={`text-2xl font-black ${card.text}`}>{card.value}</h3>
                                </div>
                            ))}
                        </div>

                        {/* Mid Section: Chart and Warning Stock */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Chart Section */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <TrendingUp className="text-[#990000]" size={22} /> Pergerakan Barang (7 Hari Terakhir)
                                    </h3>
                                </div>
                                <div className="h-80 w-full">
                                    {data.chartData && data.chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data.chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '15px' }} />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="masuk" 
                                                    name="Barang Masuk" 
                                                    stroke="#990000" 
                                                    strokeWidth={4} 
                                                    dot={{ r: 4, fill: '#990000', strokeWidth: 2, stroke: '#fff' }}
                                                    activeDot={{ r: 6 }} 
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="keluar" 
                                                    name="Barang Keluar" 
                                                    stroke="#ff4d4d" 
                                                    strokeWidth={4} 
                                                    dot={{ r: 4, fill: '#ff4d4d', strokeWidth: 2, stroke: '#fff' }}
                                                    activeDot={{ r: 6 }} 
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 font-medium">Belum ada data pergerakan barang</div>
                                    )}
                                </div>
                            </div>

                            {/* Warning Stok List (Styled precisely like Top 5 Products) */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                                    <AlertTriangle className="text-orange-500" size={22} /> Barang Hampir Habis
                                </h3>
                                <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                                    {data.hampirHabis && data.hampirHabis.length > 0 ? (
                                        data.hampirHabis.map((item, idx) => (
                                            <div key={idx} className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-red-50 text-[#990000] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="relative flex-1 min-w-0">
                                                        <span className="text-xs font-bold text-gray-800 truncate w-full block">
                                                            {item.nama_barang}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">
                                                            Cabang: {item.cabang_id}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-black text-red-600 shrink-0">{item.jumlah} Pcs</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-7">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="h-1.5 rounded-full transition-all duration-700 bg-[#990000]"
                                                            style={{ width: `${Math.min(100, ((item.jumlah || 0) / (item.minimum_stok || 1)) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 font-semibold shrink-0 w-16 text-right">
                                                        Min: {item.minimum_stok}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-xs text-gray-400 font-bold italic py-12">Semua stok aman!</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Fast Moving & Dead Stock */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Fast Moving (Styled precisely like Top 5 Products) */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                                    <TrendingUp className="text-green-500" size={22} /> Fast Moving (30 Hari)
                                </h3>
                                <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
                                    {data.fastMoving && data.fastMoving.length > 0 ? (
                                        data.fastMoving.map((item, idx) => (
                                            <div key={idx} className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="relative flex-1 min-w-0">
                                                        <span className="text-xs font-bold text-gray-800 truncate w-full block">
                                                            {item.nama_barang}
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
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-xs text-gray-400 font-bold italic py-12">Belum ada data penjualan</div>
                                    )}
                                </div>
                            </div>

                            {/* Dead Stock */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <AlertTriangle className="text-red-600" size={22} /> Dead Stock ({'>'}60 Hari)
                                    </h3>
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-wider bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                        Perlu Tindakan
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-4 font-semibold uppercase tracking-wider">💡 Suggestion: Segera buat program promo cuci gudang online/offline untuk mengalirkan stok menumpuk ini.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                                    {data.deadStock && data.deadStock.length > 0 ? (
                                        data.deadStock.map((item, idx) => (
                                            <div key={idx} className="bg-gray-50/50 hover:bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center transition-all">
                                                <div className="min-w-0 flex-1 pr-3">
                                                    <p className="font-bold text-gray-800 text-xs truncate">{item.nama_barang}</p>
                                                    <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ Mengendap &gt; 2 Bulan</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="inline-block bg-red-50 border border-red-100 text-red-600 text-xs font-black px-2.5 py-1 rounded-xl">
                                                        {item.jumlah} Pcs
                                                    </span>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Stok Sisa</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-xs text-gray-400 font-bold italic py-12 col-span-full">Semua stok berputar dengan baik!</div>
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
