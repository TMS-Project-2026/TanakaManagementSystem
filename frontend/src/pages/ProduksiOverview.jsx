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
        { title: 'Order Antre', value: data.queueCount, icon: <Clock className="text-orange-600" size={28} />, bg: 'bg-orange-50' },
        { title: 'Diproses', value: data.processingCount, icon: <Loader className="text-blue-600 animate-spin-slow" size={28} />, bg: 'bg-blue-50' },
        { title: 'Packing', value: data.packingCount, icon: <Box className="text-purple-600" size={28} />, bg: 'bg-purple-50' },
        { title: 'Selesai Hari Ini', value: data.completedToday, icon: <CheckCircle className="text-green-600" size={28} />, bg: 'bg-green-50' },
    ];

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-orange-600 pl-4">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Produksi <span className="text-orange-600">Overview</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Laporan antrean, pengerjaan, dan efisiensi produksi.</p>
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

                    {data.lateDeadline > 0 && (
                        <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
                            <AlertOctagon size={40} className="text-orange-600 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-orange-900">Peringatan: {data.lateDeadline} Order Melewati Deadline!</h3>
                                <p className="text-orange-800 text-sm mt-1">Beberapa pesanan pelanggan melewati batas waktu estimasi penyelesaian. Hal ini dapat menurunkan kepuasan pelanggan. Segera hubungi kepala produksi.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProduksiOverview;
