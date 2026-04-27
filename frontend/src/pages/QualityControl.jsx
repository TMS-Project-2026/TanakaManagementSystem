import React, { useEffect, useState } from 'react';
import { getQualityControl, submitQualityControl } from '../api/produksiApi';
import { ShieldAlert, Check, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const QualityControl = () => {
    const [data, setData] = useState({ orders: [], history: [] });
    const [showModal, setShowModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ status_qc: 'lolos', catatan: '' });

    const fetch = async () => {
        try {
            const res = await getQualityControl();
            if (res.data.status === 'success') setData(res.data.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetch(); }, []);

    const handleQC = (id) => {
        setSelectedId(id);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await submitQualityControl(selectedId, { ...form, updated_by: 'QC Officer' });
            alert('Hasil QC tersimpan');
            setShowModal(false);
            fetch();
        } catch (error) { alert('Gagal menyimpan QC'); }
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-orange-500 pl-4">
                        <h1 className="text-3xl font-black text-gray-900">Quality <span className="text-orange-600">Control</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Pengecekan kualitas (jahitan, ukuran, cacat) sebelum packing.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Menunggu QC</h3>
                            <div className="space-y-4">
                                {data.orders.map(o => (
                                    <div key={o.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><ShieldAlert size={24}/></div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{o.kode_order}</h4>
                                                <p className="text-xs text-gray-500">{o.nama_produk}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleQC(o.id)} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Cek QC</button>
                                    </div>
                                ))}
                                {data.orders.length === 0 && <p className="text-gray-500 font-bold p-4 text-center bg-white rounded-xl">Semua barang telah di-QC.</p>}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Riwayat QC Terakhir</h3>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                        <tr>
                                            <th className="p-4">Tanggal</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Catatan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.history.map(h => (
                                            <tr key={h.id} className="border-t border-gray-50">
                                                <td className="p-4 text-xs font-bold text-gray-600">{new Date(h.created_at).toLocaleDateString('id-ID')}</td>
                                                <td className="p-4">
                                                    {h.status_qc === 'lolos' ? 
                                                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded inline-flex"><Check size={12}/> Lolos</span> :
                                                        <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded inline-flex"><X size={12}/> Revisi</span>
                                                    }
                                                </td>
                                                <td className="p-4 text-xs text-gray-600">{h.catatan || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-xl font-black text-gray-900 mb-4">Input Hasil QC</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Status QC</label>
                                    <select className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-orange-500" value={form.status_qc} onChange={e=>setForm({...form, status_qc: e.target.value})}>
                                        <option value="lolos">Lolos QC (Lanjut Packing)</option>
                                        <option value="revisi">Gagal / Cacat (Revisi Jahit)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Catatan</label>
                                    <textarea className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-orange-500" rows="3" value={form.catatan} onChange={e=>setForm({...form, catatan: e.target.value})} placeholder="Catatan jika ada cacat/revisi..."></textarea>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold">Batal</button>
                                    <button type="submit" className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold">Simpan QC</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default QualityControl;
