import React, { useState, useEffect } from 'react';
import { getReportExpense } from '../../api/reportApi';
import ReportFilter from '../../components/ReportFilter';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#6b7280'];
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

const ExpenseReport = () => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', cabang: 'Semua Cabang' });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getReportExpense(filters);
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal load Expense", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportColumns = [
        { header: 'Tanggal', key: 'tanggal' },
        { header: 'Nama Pengeluaran', key: 'nama' },
        { header: 'Kategori', key: 'kategori' },
        { header: 'Cabang', key: 'cabang' },
        { header: 'Jumlah', key: 'jumlah' }
    ];

    const exportData = data ? data.list.map(d => ({
        tanggal: formatDate(d.tanggal),
        nama: d.nama_pengeluaran,
        kategori: d.kategori,
        cabang: d.cabang || '-',
        jumlah: d.jumlah
    })) : [];

    const pieData = data ? Object.keys(data.byCategory).map(cat => ({
        name: cat,
        value: data.byCategory[cat]
    })) : [];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Laporan Pengeluaran (Expense)</h2>
            
            <ReportFilter 
                filters={filters} 
                setFilters={setFilters} 
                onFilter={fetchData} 
                onPrint={() => window.print()}
                dataForExport={exportData}
                exportFileName="Expense_Report"
                columns={exportColumns}
            />

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#990000]"></div></div>
            ) : data && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* List Table */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Rincian Pengeluaran</h3>
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                                Total: {formatRupiah(data.total)}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 border-b">
                                        <th className="py-3 px-3">Tanggal</th>
                                        <th className="py-3 px-3">Deskripsi</th>
                                        <th className="py-3 px-3">Kategori</th>
                                        <th className="py-3 px-3">Cabang</th>
                                        <th className="py-3 px-3 text-right">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.list.length > 0 ? data.list.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{formatDate(item.tanggal)}</td>
                                            <td className="py-3 px-3 text-gray-800">{item.nama_pengeluaran}</td>
                                            <td className="py-3 px-3 text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">{item.kategori}</span>
                                            </td>
                                            <td className="py-3 px-3 text-gray-600">{item.cabang || '-'}</td>
                                            <td className="py-3 px-3 text-right text-red-600 font-medium">{formatRupiah(item.jumlah)}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" className="text-center py-6 text-gray-400">Belum ada data pengeluaran.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 sticky top-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Pengeluaran per Kategori</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            {pieData.length > 0 ? (
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label>
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip formatter={(val) => formatRupiah(val)} />
                                    <Legend />
                                </PieChart>
                            ) : (
                                <div className="flex justify-center items-center h-full text-gray-400">Tidak ada chart data</div>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseReport;
