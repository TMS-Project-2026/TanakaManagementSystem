import React, { useEffect, useState } from 'react';
import { getActivityLogs } from '../api/itApi';
import { Activity, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const ActivityLog = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await getActivityLogs();
            if (res.data.status === 'success') {
                setLogs(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat log aktivitas", error);
        }
    };

    const filteredLogs = logs.filter(l => 
        l.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.aktivitas.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                                    <Activity className="text-[#990000]" size={20} />
                                </div>
                                Activity Log
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Pantau riwayat aktivitas seluruh pengguna dalam sistem secara real-time.</p>
                        </div>
                    </div>

                    <div className="relative mb-6 w-full md:w-1/3">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Cari user atau aktivitas..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg pl-10 p-2 focus:ring-[#990000] focus:border-[#990000]" 
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                                    <th className="p-4 font-semibold w-1/4">Waktu</th>
                                    <th className="p-4 font-semibold w-1/6">User</th>
                                    <th className="p-4 font-semibold w-2/4">Aktivitas</th>
                                    <th className="p-4 font-semibold w-1/6">IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((item) => {
                                    const isError = item.aktivitas.toLowerCase().includes('gagal') || item.aktivitas.toLowerCase().includes('error');
                                    return (
                                        <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isError ? 'bg-red-50' : ''}`}>
                                            <td className="p-4 text-sm text-gray-500">{new Date(item.created_at).toLocaleString('id-ID')}</td>
                                            <td className="p-4 font-bold text-gray-800">{item.user}</td>
                                            <td className={`p-4 text-sm ${isError ? 'text-red-700 font-medium' : 'text-gray-600'}`}>{item.aktivitas}</td>
                                            <td className="p-4 text-xs font-mono text-gray-400">{item.ip_address || '127.0.0.1'}</td>
                                        </tr>
                                    );
                                })}
                                {filteredLogs.length === 0 && (
                                    <tr><td colSpan="4" className="p-6 text-center text-gray-500">Tidak ada log aktivitas</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ActivityLog;
