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
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-[#990000] pl-4 flex items-center gap-2">
                        <Activity className="text-[#990000]" /> Activity Log
                    </h1>

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
