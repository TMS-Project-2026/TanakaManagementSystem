import React, { useEffect, useState } from 'react';
import { getCabangPerformance } from '../api/ownerApi';
import { MapPin, Trophy, Target } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const CabangPerformance = () => {
    const [cabang, setCabang] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getCabangPerformance();
                if (res.data.status === 'success') setCabang(res.data.data);
            } catch (error) { console.error(error); }
        };
        fetch();
    }, []);

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-[#990000] pl-4">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Cabang <span className="text-[#990000]">Performance</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Perbandingan kinerja dan target revenue antar cabang.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cabang.map((item, i) => (
                            <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
                                {i === 0 && (
                                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                        <Trophy size={12}/> BEST
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-[#990000]">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">{item.nama_cabang}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase">{item.lokasi}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Kepala Cabang</p>
                                        <p className="font-bold text-gray-800">{item.kepala_cabang || '-'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><Target size={12}/> Target Revenue</p>
                                        <p className="font-black text-lg text-gray-900">{formatRupiah(item.target_revenue)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {cabang.length === 0 && <div className="col-span-full p-10 text-center text-gray-500 font-bold">Tidak ada data cabang</div>}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CabangPerformance;
