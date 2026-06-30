import React, { useEffect, useState } from 'react';
import { getProduksiDashboard } from '../api/produksiApi';
import { Layers, CheckCircle, Clock, AlertTriangle, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/Sidebar';

const ProduksiDashboard = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getProduksiDashboard();
                if (res.data.status === 'success') setData(res.data.data);
            } catch (error) { console.error(error); }
        };
        fetch();
    }, []);

    if (!data) return <div className="p-10 text-center font-bold">Memuat...</div>;

    const cards = [
        { title: 'Masuk Hari Ini', value: data.totalMasukHariIni, icon: <Layers className="text-blue-600" size={18}/>, bg: 'bg-blue-50' },
        { title: 'Order Antre', value: data.antre, icon: <Clock className="text-gray-600" size={18}/>, bg: 'bg-gray-100' },
        { title: 'Sedang Diproses', value: data.sedangDiproses, icon: <Layers className="text-yellow-600" size={18}/>, bg: 'bg-yellow-50' },
        { title: 'Selesai Hari Ini', value: data.selesaiHariIni, icon: <CheckCircle className="text-green-600" size={18}/>, bg: 'bg-green-50' },
        { title: 'Telat Deadline', value: data.telatDeadline, icon: <AlertTriangle className="text-red-600" size={18}/>, bg: 'bg-red-50' },
        { title: 'Proses Packing', value: data.totalPacking, icon: <Package className="text-purple-600" size={18}/>, bg: 'bg-purple-50' },
    ];

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-4 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-4 border-l-4 border-[#990000] pl-4">
                        <h1 className="text-lg font-black text-gray-900 tracking-tight">Dashboard <span className="text-[#990000]">Produksi</span></h1>
                        <p className="text-xs text-gray-500 font-medium mt-1">Monitoring seluruh pergerakan operasional produksi.</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                        {cards.map((card, i) => (
                            <div key={i} className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center min-h-[75px]">
                                <div className={`p-1.5 rounded-full mb-1 ${card.bg}`}>{card.icon}</div>
                                <h3 className="text-lg font-black text-gray-900 leading-none mb-0.5">{card.value}</h3>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{card.title}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-800 mb-2">Produksi Mingguan (Order Masuk)</h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.chartWeekly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="label" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 9}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: '#f3f4f6'}} />
                                        <Bar dataKey="total" fill="#990000" radius={[4,4,0,0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-800 mb-2 text-red-600 flex items-center gap-2"><AlertTriangle size={14}/> Urgent Orders</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {data.urgentOrders.map((ord) => (
                                    <div key={ord.id} className="p-2 bg-red-50 rounded-lg border border-red-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-xs text-red-900">{ord.nama_produk}</p>
                                            <p className="text-[10px] text-red-700">{ord.nama_customer} • Qty: {ord.qty}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="bg-red-200 text-red-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Deadline: {new Date(ord.deadline).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </div>
                                ))}
                                {data.urgentOrders.length === 0 && <p className="text-gray-500 text-xs font-medium py-4 text-center">Tidak ada order urgent saat ini.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProduksiDashboard;
