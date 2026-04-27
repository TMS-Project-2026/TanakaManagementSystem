import React, { useState, useEffect } from 'react';
import { getReportLabaRugi } from '../../api/reportApi';
import ReportFilter from '../../components/ReportFilter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

const COLORS = ['#990000', '#1f2937', '#e5e7eb']; // Red, Dark Gray, Light Gray

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const LabaRugi = () => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', cabang: 'Semua Cabang' });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getReportLabaRugi(filters);
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal load Laba Rugi", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePrint = () => window.print();

    // Prepare chart data
    const pieData = data ? [
        { name: 'Banua', value: data.cabangData.Banua.revenue },
        { name: 'Tanaka', value: data.cabangData.Tanaka.revenue },
        { name: 'Acestreet', value: data.cabangData.Acestreet.revenue }
    ].filter(d => d.value > 0) : [];

    const barData = data ? [
        { name: 'Banua', Income: data.cabangData.Banua.revenue, Expense: data.cabangData.Banua.expense },
        { name: 'Tanaka', Income: data.cabangData.Tanaka.revenue, Expense: data.cabangData.Tanaka.expense },
        { name: 'Acestreet', Income: data.cabangData.Acestreet.revenue, Expense: data.cabangData.Acestreet.expense }
    ] : [];

    const exportColumns = [
        { header: 'Kategori', key: 'kategori' },
        { header: 'Banua', key: 'banua' },
        { header: 'Tanaka', key: 'tanaka' },
        { header: 'Acestreet', key: 'acestreet' },
        { header: 'Total', key: 'total' }
    ];

    const exportData = data ? [
        { 
            kategori: 'Pendapatan', 
            banua: data.cabangData.Banua.revenue, 
            tanaka: data.cabangData.Tanaka.revenue, 
            acestreet: data.cabangData.Acestreet.revenue, 
            total: data.totalRevenue 
        },
        { 
            kategori: 'Pengeluaran', 
            banua: data.cabangData.Banua.expense, 
            tanaka: data.cabangData.Tanaka.expense, 
            acestreet: data.cabangData.Acestreet.expense, 
            total: data.totalExpense 
        },
        { 
            kategori: 'Laba Bersih', 
            banua: data.cabangData.Banua.revenue - data.cabangData.Banua.expense, 
            tanaka: data.cabangData.Tanaka.revenue - data.cabangData.Tanaka.expense, 
            acestreet: data.cabangData.Acestreet.revenue - data.cabangData.Acestreet.expense, 
            total: data.labaBersih 
        }
    ] : [];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Laporan Laba Rugi</h2>
            
            <ReportFilter 
                filters={filters} 
                setFilters={setFilters} 
                onFilter={fetchData} 
                onPrint={handlePrint}
                dataForExport={exportData}
                exportFileName="Laba_Rugi"
                columns={exportColumns}
            />

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#990000]"></div></div>
            ) : data && (
                <div className="space-y-6 print:space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Pendapatan</p>
                                <h3 className="text-xl font-bold text-gray-800">{formatRupiah(data.totalRevenue)}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                <TrendingDown size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Pengeluaran</p>
                                <h3 className="text-xl font-bold text-gray-800">{formatRupiah(data.totalExpense)}</h3>
                            </div>
                        </div>
                        <div className={`bg-white p-5 rounded-2xl border ${data.labaBersih >= 0 ? 'border-green-200' : 'border-red-200'} shadow-sm flex items-center gap-4`}>
                            <div className={`w-12 h-12 rounded-full ${data.labaBersih >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} flex items-center justify-center`}>
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Laba Bersih</p>
                                <h3 className={`text-xl font-bold ${data.labaBersih >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatRupiah(data.labaBersih)}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <Percent size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Margin</p>
                                <h3 className="text-xl font-bold text-gray-800">{data.margin}%</h3>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block print:space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Perbandingan Pendapatan & Pengeluaran per Cabang</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={(val) => `Rp${val/1000000}M`} />
                                        <RechartsTooltip formatter={(val) => formatRupiah(val)} />
                                        <Legend />
                                        <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Kontribusi Pendapatan Cabang</h3>
                            <div className="h-72">
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <RechartsTooltip formatter={(val) => formatRupiah(val)} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">Belum ada data pendapatan</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabaRugi;
