import React, { useEffect, useState } from 'react';
import { getDeadlineProduksi } from '../api/produksiApi';
import { Calendar, AlertOctagon, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const DeadlineProduksi = () => {
    const [deadlines, setDeadlines] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getDeadlineProduksi();
                if (res.data.status === 'success') setDeadlines(res.data.data);
            } catch (error) { console.error(error); }
        };
        fetch();
    }, []);

    const today = new Date();
    today.setHours(0,0,0,0);

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-red-600 pl-4">
                        <h1 className="text-3xl font-black text-gray-900">Deadline <span className="text-red-600">Hari Ini</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Pantau order yang harus segera dikirim ke pelanggan.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {deadlines.map(d => {
                            const deadlineDate = new Date(d.deadline);
                            deadlineDate.setHours(0,0,0,0);
                            const isLate = deadlineDate < today;
                            const isToday = deadlineDate.getTime() === today.getTime();

                            return (
                                <div key={d.id} className={`bg-white p-6 rounded-2xl shadow-sm border flex flex-col relative overflow-hidden ${isLate ? 'border-red-500 bg-red-50' : isToday ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
                                    {isLate && <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1"><AlertOctagon size={12}/> TERLAMBAT</div>}
                                    {isToday && <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1"><Clock size={12}/> HARI INI</div>}
                                    
                                    <h3 className={`text-lg font-black mb-1 ${isLate ? 'text-red-900' : 'text-gray-900'}`}>{d.kode_order}</h3>
                                    <p className={`text-sm font-bold mb-4 ${isLate ? 'text-red-800' : 'text-gray-600'}`}>{d.nama_produk}</p>
                                    
                                    <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-200/50">
                                        <div>
                                            <p className="text-xs uppercase font-bold text-gray-500">Status</p>
                                            <p className="text-sm font-black text-gray-800 uppercase">{d.status}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs uppercase font-bold text-gray-500 flex items-center gap-1 justify-end"><Calendar size={12}/> Deadline</p>
                                            <p className={`text-sm font-black ${isLate ? 'text-red-600' : isToday ? 'text-orange-600' : 'text-gray-900'}`}>{new Date(d.deadline).toLocaleDateString('id-ID')}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {deadlines.length === 0 && <div className="col-span-full p-10 text-center text-gray-500 font-bold bg-white rounded-2xl border border-gray-100">Semua order aman, tidak ada deadline mendesak.</div>}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DeadlineProduksi;
