import React, { useEffect, useState } from 'react';
import { getMarketingOverview } from '../api/ownerApi';
import { Users, Target, Percent, Award } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const MarketingOverview = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getMarketingOverview();
                if (res.data.status === 'success') setData(res.data.data);
            } catch (error) { console.error(error); }
        };
        fetch();
    }, []);

    if (!data) return <div className="p-10 text-center font-bold">Memuat...</div>;

    const cards = [
        { title: 'Total Leads', value: data.totalLeads, icon: <Users className="text-blue-600" size={28} />, bg: 'bg-blue-50' },
        { title: 'Customer Baru', value: data.newCustomers, icon: <Target className="text-green-600" size={28} />, bg: 'bg-green-50' },
        { title: 'Closing Rate', value: data.closingRate, icon: <Percent className="text-orange-600" size={28} />, bg: 'bg-orange-50' },
        { title: 'Top Marketing', value: data.topMarketing, icon: <Award className="text-purple-600" size={28} />, bg: 'bg-purple-50' },
    ];

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-blue-600 pl-4">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Marketing <span className="text-blue-600">Overview</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Laporan kinerja tim penjualan dan konversi pelanggan.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {cards.map((card, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{card.title}</p>
                                    <h3 className="text-xl font-black text-gray-900">{card.value}</h3>
                                </div>
                                <div className={`p-4 rounded-xl ${card.bg}`}>{card.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Penjualan per Marketing</h3>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="p-4 rounded-tl-xl">Nama Tim</th>
                                    <th className="p-4 rounded-tr-xl">Total Penjualan (Qty)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.salesByMarketing.map((m, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-gray-800 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">{m.name.charAt(0)}</div>
                                            {m.name}
                                        </td>
                                        <td className="p-4 font-black text-gray-900">{m.sales} Order</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MarketingOverview;
