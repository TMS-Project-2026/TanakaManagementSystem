import React, { useEffect, useState } from 'react';
import { getUserSummary } from '../api/ownerApi';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const UserSummary = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getUserSummary();
                if (res.data.status === 'success') setData(res.data.data);
            } catch (error) { console.error(error); }
        };
        fetch();
    }, []);

    if (!data) return <div className="p-10 text-center font-bold">Memuat...</div>;

    const cards = [
        { title: 'Total User', value: data.totalUsers, icon: <Users className="text-blue-600" size={28} />, bg: 'bg-blue-50' },
        { title: 'User Aktif', value: data.activeUsers, icon: <UserCheck className="text-green-600" size={28} />, bg: 'bg-green-50' },
        { title: 'User Nonaktif', value: data.inactiveUsers, icon: <UserX className="text-red-600" size={28} />, bg: 'bg-red-50' }
    ];

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-[#990000] pl-4">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">User <span className="text-[#990000]">Summary</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Ringkasan jumlah pengguna dan distribusi hak akses (role) di sistem.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {cards.map((card, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{card.title}</p>
                                    <h3 className="text-2xl font-black text-gray-900">{card.value}</h3>
                                </div>
                                <div className={`p-4 rounded-xl ${card.bg}`}>{card.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Shield size={20} className="text-[#990000]" /> Distribusi Role User
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {data.usersByRole.map((item, i) => (
                                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#990000]/10 text-[#990000] flex items-center justify-center font-black uppercase text-xs">
                                        {item.role.substring(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">{item.role}</p>
                                        <p className="text-lg font-black text-gray-900">{item.count} User</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserSummary;
