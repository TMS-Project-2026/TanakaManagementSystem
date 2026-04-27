import React, { useEffect, useState } from 'react';
import { getJadwalProduksi } from '../api/produksiApi';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const JadwalProduksi = () => {
    const [data, setData] = useState({
        orders: [],
        assignments: []
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getJadwalProduksi();

                console.log("API Jadwal:", res.data);

                if (res.data.status === "success") {
                    setData({
                        orders: res.data.data.orders || [],
                        assignments: res.data.data.assignments || []
                    });
                }
            } catch (error) {
                console.error("Gagal ambil jadwal:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="p-10 font-bold">Memuat Jadwal...</div>;
    }

    return (
        <div className="flex bg-gray-100 min-h-screen">
            <Sidebar />

            <main className="flex-1 p-6">
                <h1 className="text-3xl font-bold mb-6">
                    Jadwal Produksi
                </h1>

                <div className="grid grid-cols-2 gap-6">

                    {/* ORDER */}
                    <div className="bg-white p-6 rounded-2xl shadow">
                        <h2 className="font-bold mb-4">Deadline Order</h2>

                        {data.orders.length === 0 ? (
                            <p>Tidak ada jadwal.</p>
                        ) : (
                            data.orders.map((o) => (
                                <div key={o.id} className="border-b py-3">
                                    <p className="font-bold">{o.nama_produk}</p>
                                    <p>{o.kode_order}</p>
                                    <p>{o.deadline}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* TIM */}
                    <div className="bg-white p-6 rounded-2xl shadow">
                        <h2 className="font-bold mb-4">Tim Produksi</h2>

                        {data.assignments.length === 0 ? (
                            <p>Belum ada tim assign.</p>
                        ) : (
                            data.assignments.map((a, i) => (
                                <div key={i} className="border-b py-3">
                                    <p className="font-bold">{a.nama_tim}</p>
                                    <p>{a.kode_order}</p>
                                    <p>{a.target_selesai}</p>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default JadwalProduksi;