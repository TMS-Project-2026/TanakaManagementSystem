import React, { useEffect, useState } from 'react';
import { getProduksiOrders, updateProduksiStatus } from '../api/produksiApi';
import { Settings, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const ProsesProduksi = () => {
    const [orders, setOrders] = useState([]);

    const fetch = async () => {
        try {
            const res = await getProduksiOrders();
            if (res.data.status === 'success') {
                // Filter only orders that are in production (diproses, jahit)
                setOrders(res.data.data.filter(o => o.status === 'antre' || o.status === 'diproses' || o.status === 'jahit'));
            }
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetch(); }, []);

    const handleUpdateProgress = async (id, currentStatus, currentProgress) => {
        const newProgress = prompt(`Update progress (%) untuk order ini:`, currentProgress);
        if (newProgress !== null && newProgress !== '') {
            try {
                let status = currentStatus === 'antre' ? 'diproses' : currentStatus;
                await updateProduksiStatus(id, status, parseInt(newProgress), 'Admin Produksi');
                fetch();
            } catch (error) { alert('Gagal update progress'); }
        }
    };

    const handleNextPhase = async (id, currentStatus) => {
        let nextStatus = '';
        let nextProgress = 0;
        if (currentStatus === 'antre') { nextStatus = 'diproses'; nextProgress = 10; }
        else if (currentStatus === 'diproses') { nextStatus = 'jahit'; nextProgress = 30; }
        else if (currentStatus === 'jahit') { nextStatus = 'qc'; nextProgress = 70; }
        else return;

        if (window.confirm(`Pindahkan order ke tahap: ${nextStatus.toUpperCase()}?`)) {
            try {
                await updateProduksiStatus(id, nextStatus, nextProgress, 'Admin Produksi');
                fetch();
            } catch (error) { alert('Gagal update status'); }
        }
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-yellow-500 pl-4">
                        <h1 className="text-3xl font-black text-gray-900">Proses <span className="text-yellow-600">Produksi</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Monitoring pengerjaan order (Potong, Jahit, Sablon).</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {orders.map(o => (
                            <div key={o.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl text-gray-400"><Settings size={32} /></div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">{o.kode_order} - {o.nama_produk}</h3>
                                        <p className="text-sm text-gray-500 font-bold uppercase">{o.nama_customer} • Qty: {o.qty}</p>
                                    </div>
                                </div>
                                
                                <div className="flex-1 max-w-md">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="uppercase text-gray-600">Progress Pengerjaan</span>
                                        <span className="text-blue-600 cursor-pointer" onClick={() => handleUpdateProgress(o.id, o.status, o.progress)}>{o.progress}% (Edit)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${o.progress}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold text-center">Status Saat Ini: {o.status}</p>
                                </div>

                                <div>
                                    <button onClick={() => handleNextPhase(o.id, o.status)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-colors">
                                        Next Phase <CheckCircle size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && <div className="p-10 text-center text-gray-500 font-bold bg-white rounded-2xl">Tidak ada order dalam proses pengerjaan.</div>}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProsesProduksi;
