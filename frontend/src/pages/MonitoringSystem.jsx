import React, { useEffect, useState } from 'react';
import { getMonitoringStats } from '../api/itApi';
import { Server, Cpu, Database, MemoryStick, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const MonitoringSystem = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchStats();
        // Refresh every 10 seconds
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await getMonitoringStats();
            if (res.data.status === 'success') {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat monitoring", error);
        }
    };

    if (!stats) return (
        <div className="flex bg-[#f3f4f6] min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6 flex items-center justify-center h-screen">
                <div className="text-xl font-bold text-gray-500 animate-pulse">Memuat Data Server...</div>
            </main>
        </div>
    );

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 border-l-4 border-indigo-500 pl-4 flex items-center gap-2">
                            <Server className="text-indigo-500" /> Monitoring System
                        </h1>
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping mr-1"></span> Live
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Server Status */}
                        <div className="p-6 rounded-2xl bg-gray-900 shadow-lg relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Server size={120} /></div>
                            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Node Server Status</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-black text-white">{stats.server_status}</span>
                                <span className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-400">
                                <span className="flex items-center gap-1"><Clock size={14}/> Uptime OS: {stats.uptime.os}</span>
                                <span>Uptime Node: {stats.uptime.node}</span>
                            </div>
                        </div>

                        {/* Database Status */}
                        <div className={`p-6 rounded-2xl shadow-lg relative overflow-hidden group ${stats.database_status === 'Connected' ? 'bg-blue-600' : 'bg-red-600'}`}>
                            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><Database size={120} /></div>
                            <h3 className="text-white/70 font-bold uppercase tracking-widest text-xs mb-2">MySQL Database</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-black text-white">{stats.database_status}</span>
                                {stats.database_status === 'Connected' && <span className="w-4 h-4 bg-green-300 rounded-full animate-pulse"></span>}
                            </div>
                        </div>

                        {/* CPU Usage */}
                        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">CPU Usage</h3>
                                    <span className="text-3xl font-black text-gray-900">{stats.cpu_usage}</span>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Cpu size={24} /></div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: stats.cpu_usage }}></div>
                            </div>
                        </div>

                        {/* RAM Usage */}
                        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm md:col-span-2 lg:col-span-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Memory (RAM) Usage</h3>
                                    <span className="text-3xl font-black text-gray-900">{stats.memory_usage.percent}%</span>
                                    <p className="text-xs text-gray-500 mt-1">{stats.memory_usage.used} / {stats.memory_usage.total} Digunakan</p>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><MemoryStick size={24} /></div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div 
                                    className={`h-2.5 rounded-full ${parseFloat(stats.memory_usage.percent) > 80 ? 'bg-red-500' : 'bg-indigo-600'}`} 
                                    style={{ width: `${stats.memory_usage.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MonitoringSystem;
