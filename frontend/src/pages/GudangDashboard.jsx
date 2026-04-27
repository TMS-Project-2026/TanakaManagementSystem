import React, { useEffect, useState } from 'react';
import { getGudangDashboard } from '../api/gudangApi';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Box, Settings } from 'lucide-react';
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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await getGudangDashboard();
            if (res.data.status === 'success') {
                setData(res.data.data);
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
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-red-600 pl-4">Dashboard Gudang</h1>

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
                </div>
            </main>
        </div>
    );
};

export default GudangDashboard;
