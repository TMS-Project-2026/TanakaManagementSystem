import React, { useEffect, useState } from 'react';
import { getITDashboard } from '../api/itApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Shield, Server, FileWarning, Database, Activity } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const ITDashboard = () => {
    const [data, setData] = useState({
        totalUser: 0,
        activeToday: 0,
        totalRole: 0,
        loginToday: 0,
        totalError: 0,
        lastBackup: null,
        chartData: [],
        recentUsers: [],
        recentErrors: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await getITDashboard();
            if (res.data.status === 'success') {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat data dashboard IT", error);
        }
    };

    const cards = [
        { title: 'Total User', value: data.totalUser, icon: <Users className="text-white" size={16} /> },
        { title: 'Aktif Hari Ini', value: data.activeToday, icon: <Activity className="text-white" size={16} /> },
        { title: 'Total Role', value: data.totalRole, icon: <Shield className="text-white" size={16} /> },
        { title: 'Login Hari Ini', value: data.loginToday, icon: <Server className="text-white" size={16} /> },
        { title: 'Total Error', value: data.totalError, icon: <FileWarning className="text-white" size={16} /> },
        { title: 'Backup Terakhir', value: data.lastBackup ? new Date(data.lastBackup).toLocaleDateString('id-ID') : 'Belum Ada', icon: <Database className="text-white" size={16} /> }
    ];

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-4 overflow-y-auto h-screen">
                <div className="bg-white p-4 min-h-full rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                        <div>
                            <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <div className="bg-red-50 border border-red-100 p-1.5 rounded-lg shadow-sm">
                                    <Server className="text-[#990000]" size={16} />
                                </div>
                                Dashboard IT
                            </h1>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Ringkasan aktivitas sistem, manajemen pengguna, dan status server.</p>
                        </div>
                    </div>
 
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                        {cards.map((card, index) => (
                            <div key={index} className="bg-white rounded-[12px] p-3.5 shadow-sm border border-gray-100 border-l-[4px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-1 hover:shadow-md min-h-[75px]">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-[20px] h-[20px] rounded-full bg-[#990000] flex items-center justify-center shrink-0 shadow-sm shadow-red-900/20">
                                        {card.icon}
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-500 tracking-wider uppercase truncate">{card.title}</p>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 leading-tight truncate break-words">{card.value}</h3>
                            </div>
                        ))}
                    </div>
 
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Chart Section */}
                        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-800 mb-2">Aktivitas Login (7 Hari Terakhir)</h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{fontSize: 9}} />
                                        <YAxis tick={{fontSize: 9}} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{fontSize: 10}} />
                                        <Line type="monotone" dataKey="login" name="Jumlah Login" stroke="#990000" strokeWidth={2.5} dot={{r: 2}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
 
                        {/* Recent Activity */}
                        <div className="flex flex-col gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-xs font-bold text-gray-800 mb-2">User Terbaru</h3>
                                <div className="space-y-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                    {data.recentUsers.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center pb-1.5 border-b border-gray-50 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-bold text-xs text-gray-800">{item.nama}</p>
                                                <p className="text-[10px] text-gray-500">{item.role}</p>
                                            </div>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${item.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                                <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <FileWarning size={14} className="text-red-500" /> Error Log Terbaru
                                </h3>
                                <div className="space-y-2 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                    {data.recentErrors.length > 0 ? data.recentErrors.map((item, i) => (
                                        <div key={i} className="bg-red-50 p-1.5 rounded text-[10px] border border-red-100">
                                            <p className="font-semibold text-red-800">{item.user}</p>
                                            <p className="text-gray-600 truncate">{item.aktivitas}</p>
                                            <p className="text-[9px] text-gray-400 mt-0.5">{new Date(item.created_at).toLocaleString('id-ID')}</p>
                                        </div>
                                    )) : (
                                        <p className="text-xs text-gray-500 text-center py-4">Tidak ada error baru</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ITDashboard;
