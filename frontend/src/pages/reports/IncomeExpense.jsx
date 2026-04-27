import React, { useState, useEffect } from 'react';
import { getReportIncomeExpense } from '../../api/reportApi';
import ReportFilter from '../../components/ReportFilter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const IncomeExpense = () => {
    // Only filtering by Cabang makes sense for a monthly comparison over time
    const [filters, setFilters] = useState({ startDate: '', endDate: '', cabang: 'Semua Cabang' });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getReportIncomeExpense(filters);
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal load Income vs Expense", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportColumns = [
        { header: 'Bulan', key: 'month' },
        { header: 'Pemasukan (Income)', key: 'income' },
        { header: 'Pengeluaran (Expense)', key: 'expense' },
        { header: 'Selisih (Profit)', key: 'profit' }
    ];

    const exportData = data ? data.map(d => ({
        month: d.month,
        income: d.income,
        expense: d.expense,
        profit: d.income - d.expense
    })) : [];

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Perbandingan Income vs Expense</h2>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Cabang</label>
                        <select 
                            value={filters.cabang} 
                            onChange={(e) => setFilters({...filters, cabang: e.target.value})}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none text-sm bg-white w-full md:w-48"
                        >
                            <option value="Semua Cabang">Semua Cabang</option>
                            <option value="Banua">Banua</option>
                            <option value="Tanaka">Tanaka</option>
                            <option value="Acestreet">Acestreet</option>
                        </select>
                    </div>
                    <button 
                        onClick={fetchData}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 mt-4 rounded-lg text-sm font-semibold transition-colors h-[38px]"
                    >
                        Tampilkan Chart
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#990000]"></div></div>
            ) : data && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Grafik Bulanan</h3>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(val) => `Rp${val/1000000}M`} />
                                <RechartsTooltip formatter={(val) => formatRupiah(val)} />
                                <Legend />
                                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomeExpense;
