import React, { useEffect, useState } from 'react';
import { getProduksiOverview } from '../api/ownerApi';
import { Clock, Loader, Box, CheckCircle, AlertOctagon } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const ProduksiOverview = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getProduksiOverview();
                if (res.data.status === 'success') setData(res.data.data);
            } catch (error) { console.error(error); }
        };
        fetch();
    }, []);

    if (!data) return <div className="p-10 text-center font-bold">Memuat...</div>;

    const cards = [
        { title: 'Order Antre', value: data.ongoingOrders, icon: <Clock className="text-orange-600" size={28} />, bg: 'bg-orange-50' },
        { title: 'Diproses', value: data.processingCount, icon: <Loader className="text-blue-600 animate-spin-slow" size={28} />, bg: 'bg-blue-50' },
        { title: 'Terlambat', value: data.delayedOrders, icon: <AlertOctagon className="text-red-600" size={28} />, bg: 'bg-red-50' },
        { title: 'Stok Menipis', value: data.lowStockCount, icon: <Box className="text-purple-600" size={28} />, bg: 'bg-purple-50' },
    ];

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-orange-600 pl-4">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Operations <span className="text-orange-600">Overview</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Laporan antrian produksi, stok gudang, dan aktivitas harian.</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Detail Harian Gudang</h3>
                            <div className="space-y-4">
                                <div className="rounded-3xl bg-gray-50 p-4 border border-gray-100">
                                    <p className="text-sm text-gray-500">Barang Masuk Hari Ini</p>
                                    <p className="text-2xl font-black text-gray-900">{data.inToday}</p>
                                </div>
                                <div className="rounded-3xl bg-gray-50 p-4 border border-gray-100">
                                    <p className="text-sm text-gray-500">Barang Keluar Hari Ini</p>
                                    <p className="text-2xl font-black text-gray-900">{data.outToday}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Kinerja Produksi</h3>
                            <div className="rounded-3xl bg-gray-50 p-4 border border-gray-100">
                                <p className="text-sm text-gray-500">Closing Rate</p>
                                <p className="text-2xl font-black text-gray-900">{data.closingRate}</p>
                            </div>
                            <div className="rounded-3xl bg-gray-50 p-4 border border-gray-100 mt-4">
                                <p className="text-sm text-gray-500">Total Leads Produksi</p>
                                <p className="text-2xl font-black text-gray-900">{data.marketingLeads}</p>
                            </div>
                        </div>
                    </div>

                    {data.lateDeadline > 0 && (
                        <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
                            <AlertOctagon size={40} className="text-orange-600 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-orange-900">Peringatan: {data.lateDeadline} Order Melewati Deadline!</h3>
                                <p className="text-orange-800 text-sm mt-1">Beberapa pesanan melampaui estimasi penyelesaian. Pastikan proses produksi dipercepat.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProduksiOverview;
