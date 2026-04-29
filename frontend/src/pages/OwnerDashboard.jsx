import React, { useEffect, useState } from 'react';
import { getOwnerDashboard } from '../api/ownerApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const OwnerDashboard = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getOwnerDashboard();
                if (res.data.status === 'success') setData(res.data.data);
            } catch (error) {
                console.error("Gagal load dashboard owner", error);
            }
        };
        fetchData();
    }, []);

    if (!data) return <div className="p-10 text-center font-bold">Memuat Dashboard Utama...</div>;

    const cards = [
        { title: 'Total Revenue (Bulan Ini)', value: formatRupiah(data.totalRevenue), icon: <TrendingUp className="text-green-600" size={28} />, bg: 'bg-green-50' },
        { title: 'Total Expense (Bulan Ini)', value: formatRupiah(data.totalExpense), icon: <TrendingDown className="text-red-600" size={28} />, bg: 'bg-red-50' },
        { title: 'Profit Bersih', value: formatRupiah(data.totalProfit), icon: <DollarSign className="text-blue-600" size={28} />, bg: 'bg-blue-50' },
        { title: 'Order Aktif', value: data.activeOrders, icon: <Package className="text-purple-600" size={28} />, bg: 'bg-purple-50' },
        { title: 'Total Customer', value: data.totalCustomers, icon: <Users className="text-orange-600" size={28} />, bg: 'bg-orange-50' },
        { title: 'Invoice Unpaid', value: data.unpaidInvoice, icon: <AlertCircle className="text-pink-600" size={28} />, bg: 'bg-pink-50' },
    ];

    const divisionCards = [
        {
            title: 'Marketing',
            items: [
                { label: 'Total Leads', value: data.divisionSummary.marketing.totalLeads },
                { label: 'Top Marketing', value: data.divisionSummary.marketing.topMarketing },
                { label: 'Closing Rate', value: data.divisionSummary.marketing.closingRate }
            ]
        },
        {
            title: 'Finance',
            items: [
                { label: 'Total Income', value: formatRupiah(data.divisionSummary.finance.totalIncome) },
                { label: 'Total Expense', value: formatRupiah(data.divisionSummary.finance.totalExpense) },
                { label: 'Unpaid Invoice', value: data.divisionSummary.finance.unpaidInvoiceCount }
            ]
        },
        {
            title: 'Gudang',
            items: [
                { label: 'Total Stok', value: data.divisionSummary.gudang.totalStock },
                { label: 'Stok Menipis', value: data.divisionSummary.gudang.lowStockCount },
                { label: 'Masuk Hari Ini', value: data.divisionSummary.gudang.inToday },
                { label: 'Keluar Hari Ini', value: data.divisionSummary.gudang.outToday }
            ]
        },
        {
            title: 'Produksi',
            items: [
                { label: 'Dalam Antrian', value: data.divisionSummary.produksi.queueCount },
                { label: 'Selesai Hari Ini', value: data.divisionSummary.produksi.completedToday }
            ]
        }
    ];

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Executive <span className="text-[#990000]">Dashboard</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Monitoring performa perusahaan TMS secara real-time.</p>
                    </div>

                    {data.lowStock > 0 && (
                        <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-red-900">Pemberitahuan Stok Menipis</h2>
                                    <p className="text-sm text-red-700 mt-1">Terdapat {data.lowStock} item yang sudah mencapai atau dibawah minimum stok. Segera tindak lanjuti agar operasi tetap lancar.</p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-800">{data.lowStock} item kritis</span>
                            </div>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {data.lowStockItems.map((item, idx) => (
                                    <div key={idx} className="rounded-2xl bg-white p-4 shadow-sm border border-red-100">
                                        <p className="text-sm text-gray-500">{item.nama_barang}</p>
                                        <p className="mt-2 text-lg font-bold text-gray-900">{item.jumlah}</p>
                                        <p className="text-xs text-gray-500 mt-1">Minimum stok: {item.minimum_stok}</p>
                                        <p className="text-xs text-gray-500">Cabang ID: {item.cabang_id}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {cards.map((card, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{card.title}</p>
                                    <h3 className="text-xl font-black text-gray-900">{card.value}</h3>
                                </div>
                                <div className={`p-4 rounded-xl ${card.bg}`}>{card.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Ringkasan Per Divisi</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {divisionCards.map((division, idx) => (
                                <div key={idx} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">{division.title}</h3>
                                    <div className="space-y-3">
                                        {division.items.map((item, itemIdx) => (
                                            <div key={itemIdx} className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4">
                                                <span className="text-sm text-gray-500">{item.label}</span>
                                                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Chart Area */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <TrendingUp size={20} className="text-[#990000]" /> Revenue Bulanan
                            </h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.chartData.monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 12, fill: '#6b7280'}} tickFormatter={(val) => `Rp${val/1000000}M`} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value) => formatRupiah(value)} cursor={{stroke: '#e5e7eb', strokeWidth: 2}} />
                                        <Line type="monotone" dataKey="revenue" stroke="#990000" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Package size={20} className="text-[#990000]" /> Transaksi Terbaru
                            </h3>
                            <div className="space-y-4">
                                {data.recentTransactions.map((tx, i) => (
                                    <div key={i} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0">
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{tx.nama_pelanggan}</p>
                                            <p className="text-xs text-gray-400">{new Date(tx.tanggal).toLocaleDateString('id-ID')}</p>
                                        </div>
                                        <span className="font-bold text-[#990000] text-sm">{formatRupiah(tx.total_harga)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OwnerDashboard;
