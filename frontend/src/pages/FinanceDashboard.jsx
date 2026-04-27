import React, { useEffect, useState } from 'react';
import { getFinanceDashboard } from '../api/financeApi';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const FinanceDashboard = () => {
    const [data, setData] = useState({
        totalRevenue: 0,
        totalExpense: 0,
        profit: 0,
        totalTransaksi: 0,
        chartData: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await getFinanceDashboard();
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat data dashboard", error);
        }
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
    };

    const cards = [
        { title: 'Total Revenue', value: formatRupiah(data.totalRevenue), icon: <TrendingUp className="text-red-600 w-8 h-8" />, bg: 'bg-red-50' },
        { title: 'Total Expense', value: formatRupiah(data.totalExpense), icon: <TrendingDown className="text-red-600 w-8 h-8" />, bg: 'bg-red-50' },
        { title: 'Profit', value: formatRupiah(data.profit), icon: <DollarSign className="text-red-600 w-8 h-8" />, bg: 'bg-red-600 text-white' },
        { title: 'Total Transaksi', value: data.totalTransaksi, icon: <Activity className="text-red-600 w-8 h-8" />, bg: 'bg-red-50' }
    ];

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-red-600 pl-4">Finance Dashboard</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, index) => (
                    <div key={index} className={`p-6 rounded-2xl shadow-sm border border-red-100 flex items-center justify-between ${card.bg}`}>
                        <div>
                            <p className={`text-sm font-medium mb-1 ${card.title === 'Profit' ? 'text-red-100' : 'text-gray-500'}`}>{card.title}</p>
                            <h3 className={`text-2xl font-bold ${card.title === 'Profit' ? 'text-white' : 'text-gray-800'}`}>{card.value}</h3>
                        </div>
                        <div className={`p-3 rounded-full ${card.title === 'Profit' ? 'bg-red-500 bg-opacity-30' : 'bg-red-100'}`}>
                            {card.title === 'Profit' ? React.cloneElement(card.icon, { className: 'text-white w-8 h-8' }) : card.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Grafik Keuangan Bulanan</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data.chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(val) => `Rp ${val / 1000}k`} />
                            <Tooltip formatter={(value) => formatRupiah(value)} cursor={{fill: '#fef2f2'}} />
                            <Legend />
                            <Bar dataKey="revenue" name="Revenue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Expense" fill="#991b1b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FinanceDashboard;
