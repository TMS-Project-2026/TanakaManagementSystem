import NotificationBell from '../components/NotificationBell';
import { Bell } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getApprovals, getApprovalDetail, updateApprovalStatus, deleteApproval } from '../api/ownerApi';
import { Check, X, Clock, Eye, Trash2, FileText, Upload, ExternalLink, Search, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const ApprovalCenter = () => {
    const [approvals, setApprovals] = useState([]);
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const res = await getApprovals();
            if (res.data.status === 'success') setApprovals(res.data.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApproval = async (id, status) => {
        let alasan = '';
        if (status === 'rejected') {
            alasan = window.prompt("Masukkan alasan penolakan:");
            if (alasan === null) return; // User cancelled
        } else {
            if (!window.confirm(`Yakin ingin men-${status} pengajuan ini?`)) return;
        }

        try {
            await updateApprovalStatus(id, status, alasan);
            alert(`Pengajuan berhasil di-${status}`);
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Gagal memproses persetujuan");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus pengajuan ini?")) return;
        try {
            await deleteApproval(id);
            alert("Pengajuan berhasil dihapus!");
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Gagal menghapus pengajuan");
        }
    };

    const handleView = async (id) => {
        try {
            const res = await getApprovalDetail(id);
            if (res.data.status === 'success') {
                setSelectedApproval(res.data.data);
                setShowModal(true);
            }
        } catch (error) {
            console.error(error);
            alert("Gagal mengambil detail approval");
        }
    };

    // Parse items from quotation
    const getProductNames = (item) => {
        try {
            if (item.quo_items) {
                const items = typeof item.quo_items === 'string' ? JSON.parse(item.quo_items) : item.quo_items;
                if (Array.isArray(items)) return items.map(i => i.rincian || i.nama_produk || '').filter(Boolean).join(', ');
            }
        } catch (e) {}
        return item.keterangan || '-';
    };

    const getCustomerName = (item) => {
        return item.quo_nama_pt || item.quo_customer_name || '-';
    };

    const filteredApprovals = approvals.filter(item => 
        (item.no_quotation || '').toLowerCase().includes(search.toLowerCase()) || 
        (getCustomerName(item) || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                {/* TOPBAR */}
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Cari No. Quotation / Customer..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-6">

          <NotificationBell />
                    <div className="relative">
                      <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
                        <UserCircle size={32} className="text-gray-400 hover:text-[#990000] transition-colors" />
                      </div>
                      
                      {showProfile && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                          <div className="p-4 bg-red-50/50">
                            <p className="text-sm font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || '').replace('_', ' ')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
                    <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    Approval Center
                                </h1>
                                <p className="text-gray-500 font-medium mt-1 text-sm">Pusat persetujuan khusus Finance (Pengeluaran, Pembelian, Refund, Quotation).</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold">
                                        <th className="p-4">No</th>
                                        <th className="p-4">No Quotation</th>
                                        <th className="p-4">Nama Instansi</th>
                                        <th className="p-4">Produk</th>
                                        <th className="p-4">Tanggal</th>
                                        <th className="p-4">Nominal</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApprovals.map((item, index) => (
                                        <tr key={item.id} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                                            <td className="p-4 font-bold text-gray-500 text-sm">{String(index + 1).padStart(3, '0')}</td>
                                            <td className="p-4">
                                                <p className="font-bold text-gray-800 text-sm">{item.no_quotation || '-'}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{(item.tipe || '').replace(/_/g, ' ')}</p>
                                            </td>
                                            <td className="p-4 font-medium text-gray-800 text-sm">{getCustomerName(item)}</td>
                                            <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate">{getProductNames(item)}</td>
                                            <td className="p-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1"><Clock size={12} className="text-gray-400" />{item.tanggal_quotation ? new Date(item.tanggal_quotation).toLocaleDateString('id-ID') : new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID')}</div>
                                            </td>
                                            <td className="p-4 font-bold text-gray-800 text-sm">{formatRupiah(item.nominal)}</td>
                                            <td className="p-4 text-center">
                                                {item.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span>}
                                                {item.status === 'approved' && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Approved</span>}
                                                {item.status === 'rejected' && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Rejected</span>}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button onClick={() => handleView(item.id)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors" title="Lihat Detail"><Eye size={16} /></button>
                                                    {item.tipe === 'quotation_to_invoice' && item.reference_id && (
                                                        <button onClick={() => navigate(`/quotation/preview/${item.reference_id}`)} className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white flex items-center justify-center transition-colors" title="Lihat Quotation"><FileText size={16} /></button>
                                                    )}
                                                    {item.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleApproval(item.id, 'approved')} className="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white flex items-center justify-center transition-colors" title="Setujui"><Check size={16} /></button>
                                                            <button onClick={() => handleApproval(item.id, 'rejected')} className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white flex items-center justify-center transition-colors" title="Tolak"><X size={16} /></button>
                                                        </>
                                                    )}
                                                    <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors" title="Hapus"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredApprovals.length === 0 && <tr><td colSpan="8" className="p-8 text-center text-gray-500 font-bold">Tidak ada request approval</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                  </div>
                </div>
            </main>

            {/* Modal Detail Approval */}
            {showModal && selectedApproval && (() => {
                const d = selectedApproval.detail || {};
                const a = selectedApproval.approval || {};
                const isQuotation = a.tipe === 'quotation_to_invoice';

                // Parse items & files
                let items = [];
                const rawItems = d.items_detail || d.items;
                if (rawItems) {
                    try { items = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems; } catch(e) { items = []; }
                }
                let files = [];
                if (d.file_uploads) {
                    try { files = typeof d.file_uploads === 'string' ? JSON.parse(d.file_uploads) : d.file_uploads; } catch(e) { files = []; }
                }

                return (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Detail Pengajuan</h2>
                                    <p className="text-sm text-gray-500 mt-0.5 capitalize">{(a.tipe || '').replace(/_/g, ' ')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isQuotation && a.reference_id && (
                                        <button onClick={() => { setShowModal(false); navigate(`/quotation/preview/${a.reference_id}`); }} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-100 flex items-center gap-2"><ExternalLink size={16} /> Lihat Quotation</button>
                                    )}
                                    <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-full transition-colors"><X size={20}/></button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Info Pengajuan */}
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Diajukan Oleh</p>
                                        <p className="font-bold text-gray-800">{a.diajukan_oleh}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Nominal</p>
                                        <p className="font-black text-[#990000] text-lg">{formatRupiah(a.nominal)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 mb-1">Keterangan</p>
                                        <p className="font-medium text-gray-800">{a.keterangan}</p>
                                    </div>
                                </div>

                                {/* Customer Info (for quotation) */}
                                {isQuotation && d.nama_pt && (
                                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                                        <h3 className="font-bold text-sm text-blue-800 mb-3">DATA CUSTOMER</h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div><span className="text-gray-500">Nama PT:</span> <span className="font-bold text-gray-800">{d.nama_pt || d.customer_name}</span></div>
                                            {d.alamat_pt && <div className="col-span-2"><span className="text-gray-500">Alamat:</span> <span className="text-gray-800">{d.alamat_pt}</span></div>}
                                            {d.cp_penagihan && <div><span className="text-gray-500">CP:</span> <span className="text-gray-800">{d.cp_penagihan}</span></div>}
                                            {d.email_customer && <div><span className="text-gray-500">Email:</span> <span className="text-gray-800">{d.email_customer}</span></div>}
                                            {d.no_quotation && <div><span className="text-gray-500">No Quotation:</span> <span className="font-bold text-blue-700">{d.no_quotation}</span></div>}
                                            {d.tanggal_quotation && <div><span className="text-gray-500">Tanggal:</span> <span className="text-gray-800">{new Date(d.tanggal_quotation).toLocaleDateString('id-ID')}</span></div>}
                                        </div>
                                    </div>
                                )}

                                {/* Items Table */}
                                {items.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Daftar Item / Produk</p>
                                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-900 text-white text-xs uppercase">
                                                    <tr>
                                                        <th className="p-3 pl-4">Nama Produk</th>
                                                        <th className="p-3 text-center">Ukuran</th>
                                                        <th className="p-3 text-center">Qty</th>
                                                        <th className="p-3 text-center">Unit</th>
                                                        <th className="p-3 text-right">Harga Satuan</th>
                                                        <th className="p-3 text-right pr-4">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {items.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="p-3 pl-4 font-medium text-gray-800">{item.rincian || item.nama_barang || item.nama_produk || '-'}</td>
                                                            <td className="p-3 text-center text-gray-600">{item.ukuran || '-'}</td>
                                                            <td className="p-3 text-center font-bold">{item.qty || 0}</td>
                                                            <td className="p-3 text-center text-gray-600">{item.satuan || 'Pcs'}</td>
                                                            <td className="p-3 text-right">{formatRupiah(item.harga_satuan || item.harga || 0)}</td>
                                                            <td className="p-3 text-right pr-4 font-bold">{formatRupiah((item.qty || 0) * (item.harga_satuan || item.harga || 0))}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Non-items product (legacy) */}
                                {items.length === 0 && (d.produk || d.product_name) && (
                                    <div className="bg-gray-50 p-4 rounded-xl border">
                                        <p className="text-xs text-gray-500 font-bold mb-1">Produk</p>
                                        <p className="font-medium text-gray-800">{d.produk || d.product_name}</p>
                                        <p className="text-sm text-gray-600 mt-1">Qty: <b>{d.qty}</b></p>
                                    </div>
                                )}

                                {/* Payment Info */}
                                {isQuotation && (d.payment_note || d.term_of_payment) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {d.payment_note && (
                                            <div className="bg-gray-50 p-4 rounded-xl border">
                                                <h4 className="font-bold text-xs text-gray-500 uppercase mb-2">Payment Method</h4>
                                                <p className="text-sm text-gray-700 whitespace-pre-line">{d.payment_note}</p>
                                            </div>
                                        )}
                                        {d.term_of_payment && (
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                                <h4 className="font-bold text-xs text-blue-700 uppercase mb-2">Term of Payment</h4>
                                                <p className="text-sm text-gray-700 whitespace-pre-line">{d.term_of_payment}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Uploaded Files / Dokumen Pendukung */}
                                {files.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Dokumen Pendukung (Bukti TTD & DP)</p>
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                            <div className="flex flex-wrap gap-2">
                                                {files.map((f, i) => (
                                                    <a key={i} href={`http://localhost:3000${f.path}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-white text-green-700 rounded-lg text-sm hover:bg-green-100 border border-green-300 font-medium">
                                                        <Upload size={14} /> {f.originalname}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {a.status === 'pending' && (
                                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 sticky bottom-0">
                                    <button onClick={() => { handleApproval(a.id, 'rejected'); }} className="px-6 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors">Tolak</button>
                                    <button onClick={() => { handleApproval(a.id, 'approved'); }} className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-sm transition-colors flex items-center gap-2"><Check size={18}/> Setujui & Buat Invoice</button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default ApprovalCenter;
