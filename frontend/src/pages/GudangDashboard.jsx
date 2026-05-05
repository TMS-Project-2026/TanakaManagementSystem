import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getGudangDashboard } from '../api/gudangApi';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Box, Settings, UserCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const GudangDashboard = () => {
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

    const cards = [
        { title: 'Total Item Barang', value: data.totalItem, icon: <Box className="text-red-600 w-8 h-8" />, bg: 'bg-red-50' },
        { title: 'Total Stok Gudang', value: data.totalStok, icon: <Package className="text-white w-8 h-8" />, bg: 'bg-red-600 text-white' },
        { title: 'Masuk Hari Ini', value: data.masukHariIni, icon: <TrendingUp className="text-green-600 w-8 h-8" />, bg: 'bg-green-50' },
        { title: 'Keluar Hari Ini', value: data.keluarHariIni, icon: <TrendingDown className="text-orange-600 w-8 h-8" />, bg: 'bg-orange-50' },
        { title: 'Warning Stok', value: data.stokMenipisCount, icon: <AlertTriangle className="text-yellow-600 w-8 h-8" />, bg: 'bg-yellow-50' },
        { title: 'Total Suku Cadang', value: data.totalSparepart, icon: <Settings className="text-red-600 w-8 h-8" />, bg: 'bg-red-50' }
    ];

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="pt-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
                                <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                                    <Box className="text-[#990000]" size={20} />
                                </div>
                                Dashboard <span className="text-[#990000]">Gudang</span>
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Ringkasan aktivitas dan pergerakan barang secara keseluruhan</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {cards.map((card, index) => (
                            <div key={index} className={`p-6 rounded-2xl shadow-sm border border-red-100 flex items-center justify-between ${card.bg}`}>
                                <div>
                                    <p className={`text-sm font-medium mb-1 ${card.title === 'Total Stok Gudang' ? 'text-red-100' : 'text-gray-500'}`}>{card.title}</p>
                                    <h3 className={`text-3xl font-bold ${card.title === 'Total Stok Gudang' ? 'text-white' : 'text-gray-800'}`}>{card.value}</h3>
                                </div>
                                <div className={`p-3 rounded-full ${card.title === 'Total Stok Gudang' ? 'bg-red-500 bg-opacity-30' : 'bg-white bg-opacity-50'}`}>
                                    {card.icon}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Chart Section */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-red-100">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Pergerakan Barang (7 Hari Terakhir)</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip cursor={{fill: '#fef2f2'}} />
                                        <Legend />
                                        <Line type="monotone" dataKey="masuk" name="Masuk" stroke="#16a34a" strokeWidth={3} />
                                        <Line type="monotone" dataKey="keluar" name="Keluar" stroke="#ea580c" strokeWidth={3} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Warning Stok List */}
                        <div className="bg-yellow-50 p-6 rounded-2xl shadow-sm border border-yellow-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <AlertTriangle className="text-yellow-600" /> Barang Hampir Habis
                            </h3>
                            <div className="space-y-3">
                                {data.hampirHabis.length > 0 ? data.hampirHabis.map((item, i) => (
                                    <div key={i} className="bg-white p-3 rounded-lg border border-yellow-100 flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{item.nama_barang}</p>
                                            <p className="text-xs text-gray-500">Cabang: {item.cabang_id}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-red-600">{item.jumlah}</p>
                                            <p className="text-[10px] text-gray-500">Min: {item.minimum_stok}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-sm text-gray-500 py-4">Semua stok aman!</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                        {/* Fast Moving */}
                        <div className="bg-green-50 p-6 rounded-2xl shadow-sm border border-green-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="text-green-600" /> Fast Moving (30 Hari)
                            </h3>
                            <div className="space-y-3">
                                {data.fastMoving && data.fastMoving.length > 0 ? data.fastMoving.map((item, i) => (
                                    <div key={i} className="bg-white p-3 rounded-lg border border-green-100 flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{item.nama_barang}</p>
                                            <p className="text-xs text-gray-500">Stok Saat Ini: {item.jumlah}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-green-600">{item.total_terjual}</p>
                                            <p className="text-[10px] text-gray-500">Terjual</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-sm text-gray-500 py-4">Belum ada data penjualan</div>
                                )}
                            </div>
                        </div>

                        {/* Dead Stock */}
                        <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-200 lg:col-span-2">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <AlertTriangle className="text-red-600" /> Dead Stock / Stok Menumpuk ({'>'}60 Hari)
                            </h3>
                            <p className="text-xs text-gray-500 mb-4 font-medium">Suggestion: Segera buat promo atau flash sale untuk barang di bawah ini.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {data.deadStock && data.deadStock.length > 0 ? data.deadStock.map((item, i) => (
                                    <div key={i} className="bg-white p-3 rounded-lg border border-red-100 flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{item.nama_barang}</p>
                                            <p className="text-xs text-gray-500 text-red-500 font-semibold mt-1">Tidak laku {'>'}2 bulan</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-red-600">{item.jumlah}</p>
                                            <p className="text-[10px] text-gray-500">Stok Tersisa</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center text-sm text-gray-500 py-4 col-span-full">Semua stok berputar dengan baik!</div>
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
