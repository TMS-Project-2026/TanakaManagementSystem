import React, { useEffect, useState } from 'react';
import { getOwnerDashboard } from '../api/ownerApi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
const chartColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

const OwnerDashboard = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getOwnerDashboard();
                if (res.data.status === 'success') setData(res.data.data);
            } catch (error) {
                console.error('Gagal load dashboard owner', error);
            }
        };
        fetchData();
    }, []);

    if (!data) return <div className="p-10 text-center font-bold">Memuat Dashboard Utama...</div>;

    const cards = [
        { title: 'Total Revenue', value: formatRupiah(data.totalRevenue), icon: <TrendingUp className="text-green-600" size={28} />, bg: 'bg-green-50' },
        { title: 'Total Expense', value: formatRupiah(data.totalExpense), icon: <TrendingDown className="text-red-600" size={28} />, bg: 'bg-red-50' },
        { title: 'Net Profit', value: formatRupiah(data.netProfit), icon: <DollarSign className="text-blue-600" size={28} />, bg: 'bg-blue-50' },
        { title: 'Active Orders', value: data.activeOrders, icon: <Package className="text-purple-600" size={28} />, bg: 'bg-purple-50' },
        { title: 'Cash Available', value: formatRupiah(data.cashAvailable), icon: <Users className="text-orange-600" size={28} />, bg: 'bg-orange-50' },
        { title: 'Unpaid Invoices', value: data.unpaidInvoice, icon: <AlertCircle className="text-pink-600" size={28} />, bg: 'bg-pink-50' },
    ];

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Executive <span className="text-[#990000]">Owner Dashboard</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Ringkasan semua divisi dan cabang dalam satu tampilan.</p>
                    </div>

                    {data.lowStock > 0 && (
                        <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-red-900">Peringatan Stok Menipis</h2>
                                    <p className="text-sm text-red-700 mt-1">Ada {data.lowStock} item berada di atau di bawah minimum stok. Segera lakukan replenishment.</p>
                                </div>
                                <span className="inline-flex items-center rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-800">{data.lowStock} item kritis</span>
                            </div>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {data.lowStockItems.map((item, idx) => (
                                    <div key={idx} className="rounded-2xl bg-white p-4 shadow-sm border border-red-100">
                                        <p className="text-sm text-gray-500">{item.nama_barang}</p>
                                        <p className="mt-2 text-lg font-bold text-gray-900">{item.jumlah}</p>
                                        <p className="text-xs text-gray-500 mt-1">Min stok: {item.minimum_stok}</p>
                                        <p className="text-xs text-gray-500">Cabang ID: {item.cabang_id}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {cards.map((card, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-[6px] border-l-[#990000] hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center justify-between min-h-[120px]">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{card.title}</p>
                                    <h3 className="text-2xl font-black text-gray-900 leading-tight">{card.value}</h3>
                                </div>
                                <div className={`p-4 rounded-xl ${card.bg}`}>{card.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-5">Revenue Trend</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.chartData.revenueTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `Rp${Math.round(val / 1000000)}M`} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value) => formatRupiah(value)} cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }} />
                                        <Line type="monotone" dataKey="total" stroke="#990000" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-5">Cabang Contribution</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data.chartData.branchContribution} dataKey="total" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={5}>
                                            {data.chartData.branchContribution.map((entry, idx) => (
                                                <Cell key={`cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatRupiah(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 grid gap-3">
                                {data.chartData.branchContribution.map((entry, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 p-3">
                                        <span className="text-sm text-gray-700">{entry.name}</span>
                                        <span className="text-sm font-bold text-gray-900">{entry.share}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-5">Profit vs Expense</h3>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.chartData.profitExpenseTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `Rp${Math.round(value / 1000000)}M`} axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value) => formatRupiah(value)} />
                                        <Bar dataKey="revenue" fill="#990000" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="expense" fill="#F97316" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-5">Actionable Alerts</h3>
                            <div className="space-y-4">
                                <div className="rounded-3xl bg-blue-50 p-4 border border-blue-100">
                                    <p className="text-sm font-semibold text-blue-900">Pending Approvals</p>
                                    <p className="text-3xl font-black text-blue-900 mt-2">{data.alerts.pendingApproval}</p>
                                    <p className="text-sm text-blue-600 mt-1">Permintaan yang menunggu konfirmasi.</p>
                                </div>
                                <div className="rounded-3xl bg-yellow-50 p-4 border border-yellow-100">
                                    <p className="text-sm font-semibold text-yellow-900">Invoice Overdue</p>
                                    <p className="text-3xl font-black text-yellow-900 mt-2">{data.alerts.overdueInvoice}</p>
                                    <p className="text-sm text-yellow-600 mt-1">Invoice yang sudah lewat tanggal jatuh tempo.</p>
                                </div>
                                <div className="rounded-3xl bg-red-50 p-4 border border-red-100">
                                    <p className="text-sm font-semibold text-red-900">Delayed Production</p>
                                    <p className="text-3xl font-black text-red-900 mt-2">{data.alerts.delayedProduction}</p>
                                    <p className="text-sm text-red-600 mt-1">Produksi yang terlambat menyelesaikan order.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OwnerDashboard;
