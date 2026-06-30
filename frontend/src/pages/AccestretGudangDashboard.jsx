import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Box, UserCircle, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const API = 'http://localhost:3000/api/gudang-accestret';

const AccestretGudangDashboard = ({ embedded = false }) => {
    const [data, setData] = useState({
        totalItem: 0,
        totalStok: 0,
        masukHariIni: 0,
        keluarHariIni: 0,
        stokMenipisCount: 0,
        chartData: [],
        hampirHabis: [],
        fastMoving: [],
        deadStock: []
    });
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [resDashboard, resAnalisis] = await Promise.all([
                axios.get(`${API}/dashboard`, { headers }),
                axios.get(`${API}/analisis`,  { headers })
            ]);

            if (resDashboard.data.status === 'success') {
                setData({
                    ...resDashboard.data.data,
                    fastMoving: resAnalisis.data.data?.fastMoving || [],
                    deadStock:  resAnalisis.data.data?.deadStock  || []
                });
            }
        } catch (error) {
            console.error('Gagal memuat data dashboard gudang Accestret', error);
        }
    };

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans relative">
            {!embedded && <Sidebar />}
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                <header className="h-12 bg-white border-b border-gray-200 flex items-center px-5 sticky top-0 z-30 justify-end shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setShowProfile(!showProfile)}>
                            <UserCircle className="text-gray-400" size={20} />
                            <ChevronDown size={12} className="text-gray-400" />
                            {showProfile && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-150 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-3 bg-red-50/50">
                                        <p className="text-xs font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                                        <p className="text-[9px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || '').replace('_', ' ')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#f8fafc]">
                    <div className="max-w-[1600px] mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-700">

                        {/* Header */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    Dashboard Gudang Accestret
                                </h1>
                                <p className="text-gray-500 mt-1 text-xs font-medium">
                                    Ringkasan aktivitas, pergerakan barang, dan analisis inventori cabang Accestret secara real-time
                                </p>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                { title: 'Total Item Barang',  value: `${data.totalItem} Item`,          icon: <Box size={14} className="text-white" /> },
                                { title: 'Total Stok Gudang',  value: `${data.totalStok} Pcs`,           icon: <Package size={14} className="text-white" /> },
                                { title: 'Masuk Hari Ini',     value: `${data.masukHariIni} Pcs`,        icon: <TrendingDown size={14} className="text-white" /> },
                                { title: 'Keluar Hari Ini',    value: `${data.keluarHariIni} Pcs`,       icon: <TrendingUp size={14} className="text-white" /> },
                                { title: 'Warning Stok',       value: `${data.stokMenipisCount} Item`,   icon: <AlertTriangle size={14} className="text-white" /> }
                            ].map((card, index) => (
                                <div key={index} className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 border-l-[5px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-1 hover:shadow-md min-h-[90px]">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <div className="w-[24px] h-[24px] rounded-full bg-[#990000] flex items-center justify-center shrink-0 shadow-sm shadow-red-900/20">
                                            {card.icon}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase truncate">{card.title}</p>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 leading-tight truncate">{card.value}</h3>
                                </div>
                            ))}
                        </div>

                        {/* Chart + Warning Stock */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Chart */}
                            <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <TrendingUp className="text-[#990000]" size={16} /> Pergerakan Barang (7 Hari Terakhir)
                                    </h3>
                                </div>
                                <div className="h-48 w-full">
                                    {data.chartData && data.chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                                                <Line type="monotone" dataKey="masuk"  name="Barang Masuk"  stroke="#990000" strokeWidth={3} dot={{ r: 3, fill: '#990000', strokeWidth: 1.5, stroke: '#fff' }} activeDot={{ r: 5 }} />
                                                <Line type="monotone" dataKey="keluar" name="Barang Keluar" stroke="#ff4d4d" strokeWidth={3} dot={{ r: 3, fill: '#ff4d4d', strokeWidth: 1.5, stroke: '#fff' }} activeDot={{ r: 5 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400 font-medium">Belum ada data pergerakan barang</div>
                                    )}
                                </div>
                            </div>

                            {/* Barang Hampir Habis */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="text-orange-500" size={16} /> Barang Hampir Habis
                                </h3>
                                <div className="space-y-3 flex-1 overflow-y-auto max-h-[190px] pr-1 custom-scrollbar">
                                    {data.hampirHabis && data.hampirHabis.length > 0 ? (
                                        data.hampirHabis.map((item, idx) => (
                                            <div key={idx} className="flex flex-col gap-1 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-red-50 text-[#990000] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                                                    <div className="relative flex-1 min-w-0">
                                                        <span className="text-xs font-bold text-gray-800 truncate w-full block">{item.nama_barang} {item.ukuran ? `- ${item.ukuran}` : ''}</span>
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Cabang: {item.cabang_id}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-red-600 shrink-0">{item.jumlah} Pcs</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-7">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                                                        <div
                                                            className="h-1 rounded-full transition-all duration-700 bg-[#990000]"
                                                            style={{ width: `${Math.min(100, ((item.jumlah || 0) / (item.minimum_stok || 1)) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 font-semibold shrink-0 w-16 text-right">Min: {item.minimum_stok}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-xs text-gray-400 font-bold italic py-8">Semua stok aman!</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Fast Moving + Dead Stock */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Fast Moving */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <TrendingUp className="text-green-500" size={16} /> Fast Moving (30 Hari)
                                </h3>
                                <div className="space-y-3 flex-1 overflow-y-auto max-h-[190px] pr-1 custom-scrollbar">
                                    {data.fastMoving && data.fastMoving.length > 0 ? (
                                        data.fastMoving.map((item, idx) => (
                                            <div key={idx} className="flex flex-col gap-1 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                                                    <div className="relative flex-1 min-w-0">
                                                        <span className="text-xs font-bold text-gray-800 truncate w-full block">{item.nama_barang} {item.ukuran ? `- ${item.ukuran}` : ''}</span>
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Sisa Stok: {item.jumlah}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-emerald-600 shrink-0">{item.total_terjual} Pcs</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-7">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                                                        <div
                                                            className="h-1 overflow-hidden transition-all duration-700 bg-emerald-500"
                                                            style={{ width: `${Math.min(100, ((item.total_terjual || 0) / (data.fastMoving[0]?.total_terjual || 1)) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-xs text-gray-400 font-bold italic py-8">Belum ada data penjualan</div>
                                    )}
                                </div>
                            </div>

                            {/* Dead Stock */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <AlertTriangle className="text-red-600" size={16} /> Dead Stock (&gt;60 Hari)
                                    </h3>
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                        Perlu Tindakan
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 mb-3 font-semibold uppercase tracking-wider">
                                    💡 Segera buat program promo cuci gudang online/offline untuk mengalirkan stok menumpuk ini.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-[190px] pr-1 custom-scrollbar">
                                    {data.deadStock && data.deadStock.length > 0 ? (
                                        data.deadStock.map((item, idx) => (
                                            <div key={idx} className="bg-gray-50/50 hover:bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center transition-all">
                                                <div className="min-w-0 flex-1 pr-3">
                                                    <p className="font-bold text-gray-800 text-xs truncate">{item.nama_barang} {item.ukuran ? `- ${item.ukuran}` : ''}</p>
                                                    <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ Mengendap &gt; 2 Bulan</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="inline-block bg-red-50 border border-red-100 text-red-600 text-xs font-black px-2 py-0.5 rounded-lg">
                                                        {item.jumlah} Pcs
                                                    </span>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Stok Sisa</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-xs text-gray-400 font-bold italic py-8 col-span-full">
                                            Semua stok berputar dengan baik!
                                        </div>
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

export default AccestretGudangDashboard;
