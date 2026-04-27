import React, { useEffect, useState } from 'react';
import { getGudangOverview } from '../api/ownerApi';
import { Package, ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const GudangOverview = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getGudangOverview();
                if (res.data.status === 'success') setData(res.data.data);
            } catch (error) { console.error(error); }
        };
        fetch();
    }, []);

    if (!data) return <div className="p-10 text-center font-bold">Memuat...</div>;

    const cards = [
        { title: 'Total Stok', value: data.totalStock, icon: <Package className="text-gray-900" size={28} />, bg: 'bg-gray-100' },
        { title: 'Barang Masuk (Hari Ini)', value: data.inToday, icon: <ArrowDown className="text-green-600" size={28} />, bg: 'bg-green-50' },
        { title: 'Barang Keluar (Hari Ini)', value: data.outToday, icon: <ArrowUp className="text-blue-600" size={28} />, bg: 'bg-blue-50' },
        { title: 'Hampir Habis', value: data.lowStockItem, icon: <AlertTriangle className="text-red-600" size={28} />, bg: 'bg-red-50' },
    ];

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-gray-900 pl-4">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gudang <span className="text-gray-600">Overview</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Laporan inventaris dan pergerakan stok barang.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {cards.map((card, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{card.title}</p>
                                    <h3 className="text-2xl font-black text-gray-900">{card.value}</h3>
                                </div>
                                <div className={`p-4 rounded-xl ${card.bg}`}>{card.icon}</div>
                            </div>
                        ))}
                    </div>

                    {data.lowStockItem > 0 && (
                        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
                            <AlertTriangle size={32} className="text-red-600 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-red-900">Perhatian: {data.lowStockItem} Item Hampir Habis!</h3>
                                <p className="text-red-700 mt-1">Stok beberapa item sangat kritis (di bawah 10 pcs). Segera lakukan pemesanan ulang (restock) untuk menghindari terhambatnya proses penjualan.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default GudangOverview;
