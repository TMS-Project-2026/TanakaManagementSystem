import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { createQuotation, getQuotationById, updateQuotation, getNextQuotationNumber } from '../api/quotationApi';
import { Save, X, ArrowLeft, FileText, Scissors } from 'lucide-react';
import api from '../api/axios';
import { formatPhoneNumber } from '../utils/formatters';

const AccestretQuotationForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id);
    const orderData = location.state?.orderData || null;

    const [customers, setCustomers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [form, setForm] = useState({
        no_quotation: '', cabang: 'Acestreet', // Hardcoded branch
        tanggal_quotation: new Date().toISOString().split('T')[0],
        tanggal_berlaku: '', order_id: null,
        nama_pt: '', alamat_pt: '', up_penagihan: '', cp_penagihan: '', email_customer: '',
        deskripsi_pesanan: '',
        items_detail: [{ rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs' }],
        subtotal: 0, ppn_persen: 0, jumlah_ppn: 0, diskon_persen: 0, diskon: 0, grand_total_quo: 0,
        jenis_pembayaran: '', term_of_payment: '', payment_note: '',
        nama_marketing: '', nama_client_ttd: '', status: 'Draft'
    });

    useEffect(() => {
        if (isEdit) {
            fetchQuotation();
        } else if (orderData) {
            prefillFromOrder(orderData);
            fetchNextNo('Acestreet');
        } else {
            fetchNextNo('Acestreet');
        }
    }, [id]);

    const prefillFromOrder = (order) => {
        const items = order.items ? (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) : [];
        const mappedItems = items.length > 0 ? items.map(i => ({
            rincian: i.nama_produk || i.rincian || '', ukuran: i.ukuran || '',
            qty: i.qty || 1, harga_satuan: i.harga_satuan || i.harga || 0, satuan: i.satuan || 'Pcs'
        })) : [{ rincian: order.nama_produk || '', ukuran: order.ukuran || '', qty: order.qty || 1, harga_satuan: order.harga || 0, satuan: 'Pcs' }];
        setForm(prev => ({
            ...prev, order_id: order.id,
            nama_pt: order.nama_customer || order.nama_pt || '',
            alamat_pt: order.alamat || order.alamat_pt || '',
            cp_penagihan: order.no_hp || order.cp_penagihan || '',
            email_customer: order.email || '',
            items_detail: mappedItems
        }));
    };

    const fetchNextNo = async (cabang) => {
        try {
            const res = await getNextQuotationNumber(cabang);
            if (res.data.status === 'success') setForm(prev => ({ ...prev, no_quotation: res.data.no_quotation }));
        } catch (err) { console.error('Gagal fetch nomor quotation', err); }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [custRes] = await Promise.all([api.get('/marketing-offline/customers')]);
                setCustomers(custRes.data || []);
            } catch (err) { console.error('Gagal fetch data customer', err); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let subtotal = form.items_detail.reduce((acc, item) => acc + (Number(item.qty) * Number(item.harga_satuan)), 0);
        const jumlah_ppn = subtotal * (Number(form.ppn_persen) / 100);
        const diskon = subtotal * (Number(form.diskon_persen || 0) / 100);
        const grand_total_quo = subtotal + jumlah_ppn - diskon;
        setForm(prev => ({ ...prev, subtotal, jumlah_ppn, diskon, grand_total_quo }));
    }, [form.items_detail, form.ppn_persen, form.diskon_persen]);

    useEffect(() => {
        // Default rekening untuk Accestret
        const note = `PAYMENT METHOD :\nBank: BRI\nCabang: Yogyakarta\nNo. Rekening: 2099 0100 0545 304\nAtas Nama: ACCESTRET`;
        setForm(prev => ({ ...prev, payment_note: note }));
    }, []);

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...form.items_detail];
        newItems[index][name] = value;
        setForm({ ...form, items_detail: newItems });
    };

    const addItem = () => setForm({ ...form, items_detail: [...form.items_detail, { rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs' }] });
    const removeItem = (index) => { if (form.items_detail.length > 1) setForm({ ...form, items_detail: form.items_detail.filter((_, i) => i !== index) }); };

    const fetchQuotation = async () => {
        try {
            const res = await getQuotationById(id);
            if (res.data.status === 'success') {
                const d = res.data.data;
                setForm({ ...d, tanggal_quotation: d.tanggal_quotation?.split('T')[0] || '', tanggal_berlaku: d.tanggal_berlaku?.split('T')[0] || '', items_detail: typeof d.items_detail === 'string' ? JSON.parse(d.items_detail) : (d.items_detail || [{ rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs' }]) });
            }
        } catch (err) { console.error('Gagal memuat quotation', err); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: name === 'cp_penagihan' ? formatPhoneNumber(value) : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) { await updateQuotation(id, form); alert("Quotation berhasil diperbarui!"); }
            else { await createQuotation(form); alert("Quotation berhasil dibuat!"); }
            navigate('/accestret/marketing/quotation');
        } catch (err) { console.error("Gagal menyimpan quotation", err); alert("Gagal menyimpan quotation"); }
    };

    const inputClass = "w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm transition-all";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

    return (
        <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 border border-gray-100 transition-colors"><ArrowLeft className="text-gray-600" size={24} /></button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                                <Scissors className="text-purple-600" />
                                {isEdit ? 'Edit Quotation Accestret' : 'Buat Quotation Accestret'}
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium">Buat penawaran harga pembuatan kaos custom & apparel.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. Header */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black tracking-widest border-b border-gray-100 pb-3 mb-5 text-purple-700 uppercase">Header Quotation</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div><label className={labelClass}>No Quotation</label><input type="text" name="no_quotation" value={form.no_quotation} disabled className={`${inputClass} bg-gray-50 font-bold text-gray-600`} /></div>
                                <div><label className={labelClass}>Cabang Asal</label>
                                    <input type="text" value="Accestret Custom Clothing" disabled className={`${inputClass} bg-purple-50 text-purple-900 font-bold border-purple-100`} />
                                </div>
                                <div><label className={labelClass}>Tanggal Quotation *</label><input type="date" name="tanggal_quotation" value={form.tanggal_quotation} onChange={handleChange} required className={inputClass} /></div>
                                <div><label className={labelClass}>Berlaku Sampai *</label><input type="date" name="tanggal_berlaku" value={form.tanggal_berlaku} onChange={handleChange} required className={inputClass} /></div>
                                <div><label className={labelClass}>Metode Pembayaran</label>
                                    <select name="jenis_pembayaran" value={form.jenis_pembayaran} onChange={handleChange} className={`${inputClass} bg-white`}>
                                        <option value="">- Pilih -</option>
                                        <option value="Transfer">Transfer Bank</option><option value="Cash">Cash</option><option value="COD">COD</option><option value="Tempo">Termin / Tempo</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Customer */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black tracking-widest border-b border-gray-100 pb-3 mb-5 text-purple-700 uppercase">Data Pemesan / Klien</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="relative md:col-span-2"><label className={labelClass}>Nama Instansi / Komunitas *</label>
                                    <input type="text" name="nama_pt" value={form.nama_pt} onChange={(e) => { handleChange(e); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} required placeholder="Contoh: BEM Universitas / PT. ABC" className={inputClass} />
                                    {showSuggestions && form.nama_pt && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                            {customers.filter(c => c.nama_customer?.toLowerCase().includes(form.nama_pt.toLowerCase())).map(c => (
                                                <div key={c.id} className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 transition-colors" onClick={() => { setForm(prev => ({ ...prev, nama_pt: c.nama_customer, alamat_pt: c.alamat || '', cp_penagihan: c.no_hp || '', email_customer: c.email || '', up_penagihan: c.up_penagihan || '' })); setShowSuggestions(false); }}>
                                                    <p className="font-bold text-sm text-gray-800">{c.nama_customer}</p><p className="text-xs text-gray-500">{c.alamat}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2"><label className={labelClass}>Alamat Pengiriman Lengkap *</label><textarea name="alamat_pt" value={form.alamat_pt} onChange={handleChange} required rows={2} className={`${inputClass} resize-none`}></textarea></div>
                                <div><label className={labelClass}>Nama PIC / Pemesan</label><input type="text" name="up_penagihan" value={form.up_penagihan} onChange={handleChange} placeholder="Nama yang bertanggung jawab" className={inputClass} /></div>
                                <div><label className={labelClass}>Nomor WhatsApp (Aktif)</label><input type="text" name="cp_penagihan" value={form.cp_penagihan} onChange={handleChange} placeholder="08..." className={inputClass} /></div>
                                <div><label className={labelClass}>Email Aktif</label><input type="email" name="email_customer" value={form.email_customer} onChange={handleChange} className={inputClass} /></div>
                            </div>
                        </div>

                        {/* 3. Detail Pesanan */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black tracking-widest border-b border-gray-100 pb-3 mb-5 text-purple-700 uppercase">Spesifikasi Pesanan (Apparel)</h3>
                            <div className="mb-5">
                                <label className={labelClass}>Deskripsi Umum Pesanan</label>
                                <textarea name="deskripsi_pesanan" value={form.deskripsi_pesanan} onChange={handleChange} rows={2} placeholder="Contoh: Pembuatan Kaos Panitia Event 2026. Bahan Cotton Combed 30s Hitam, Sablon Plastisol Depan Belakang..." className={`${inputClass} resize-none`}></textarea>
                            </div>
                            <div className="space-y-4 mb-6">
                                {form.items_detail.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 bg-gray-50 p-5 rounded-2xl border border-gray-200 relative pt-8 md:pt-5 group hover:border-purple-200 transition-colors">
                                        <div className="col-span-12 md:col-span-5 relative">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Rincian Barang (Bahan + Sablon)</label>
                                            <input type="text" name="rincian" value={item.rincian} onChange={(e) => handleItemChange(index, e)} placeholder="Cth: Kaos Combed 30s + Sablon Plastisol A3" className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition-all" autoComplete="off" />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ukuran Default</label>
                                            <select name="ukuran" value={item.ukuran || ''} onChange={(e) => handleItemChange(index, e)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none">
                                                <option value="">- Size -</option><option value="Custom Size">Custom Size</option>{['S', 'M', 'L', 'XL', 'XXL', '3XL'].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Qty</label>
                                            <input type="number" name="qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} min="1" className="w-full p-2.5 border border-gray-300 rounded-xl text-center text-sm focus:ring-2 focus:ring-purple-200 outline-none font-bold text-gray-700" />
                                        </div>
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Satuan</label>
                                            <input type="text" name="satuan" value={item.satuan} onChange={(e) => handleItemChange(index, e)} className="w-full p-2.5 border border-gray-300 rounded-xl text-center text-sm focus:ring-2 focus:ring-purple-200 outline-none text-gray-600" />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">Harga Satuan (Rp)</label>
                                            <input type="number" name="harga_satuan" value={item.harga_satuan} onChange={(e) => handleItemChange(index, e)} min="0" className="w-full p-2.5 border border-gray-300 rounded-xl text-right text-sm font-black text-gray-800 focus:ring-2 focus:ring-purple-200 outline-none" />
                                        </div>
                                        <div className="absolute top-2 right-2 md:static md:col-span-12 flex items-center justify-end mt-2 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => removeItem(index)} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">Hapus Baris <X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addItem} className="text-sm font-bold text-purple-700 bg-purple-50 px-5 py-2.5 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors shadow-sm active:scale-95">+ Tambah Baris Barang</button>
                            </div>
                            
                            <div className="flex justify-end">
                                <div className="w-full md:w-1/2 lg:w-5/12 space-y-4 bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                    <div className="flex items-center justify-between gap-4"><label className="text-sm font-bold text-gray-600 w-1/3">Subtotal</label><span className="w-2/3 text-right font-black text-gray-800">Rp {form.subtotal.toLocaleString('id-ID')}</span></div>
                                    <div className="flex items-center justify-between gap-4"><label className="text-sm font-bold text-gray-600 w-1/3">PPN (%)</label><input type="number" name="ppn_persen" value={form.ppn_persen} onChange={handleChange} min="0" max="100" className="w-1/4 p-2 border border-purple-200 rounded-lg text-right focus:ring-2 focus:ring-purple-300 outline-none" /><span className="w-5/12 text-right text-sm font-bold text-gray-700">Rp {form.jumlah_ppn.toLocaleString('id-ID')}</span></div>
                                    <div className="flex items-center justify-between gap-4"><label className="text-sm font-bold text-gray-600 w-1/3">Diskon (%)</label><input type="number" name="diskon_persen" value={form.diskon_persen} onChange={handleChange} min="0" max="100" className="w-1/4 p-2 border border-purple-200 rounded-lg text-right focus:ring-2 focus:ring-purple-300 outline-none" /><span className="w-5/12 text-right text-sm text-red-600 font-bold">- Rp {form.diskon.toLocaleString('id-ID')}</span></div>
                                    <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-purple-200">
                                        <label className="text-sm font-black tracking-widest text-purple-900 w-1/3 uppercase">Grand Total</label>
                                        <span className="w-2/3 text-right text-2xl font-black text-purple-800">Rp {form.grand_total_quo.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Pembayaran & TTD */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black tracking-widest border-b border-gray-100 pb-3 mb-5 text-purple-700 uppercase">Ketentuan & Tanda Tangan</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Term of Payment (Syarat Pembayaran) *</label>
                                    <textarea name="term_of_payment" value={form.term_of_payment} onChange={handleChange} rows={3} placeholder="Contoh: DP 50% untuk mulai produksi, Pelunasan sebelum barang dikirim." required className={`${inputClass} resize-none`}></textarea>
                                </div>
                                <div>
                                    <label className={labelClass}>Payment Note (Info Rekening Bank)</label>
                                    <textarea name="payment_note" value={form.payment_note} onChange={handleChange} rows={3} className={`${inputClass} resize-none bg-gray-50`}></textarea>
                                </div>
                                <div><label className={labelClass}>Nama Marketing (TTD Kiri)</label><input type="text" name="nama_marketing" value={form.nama_marketing} onChange={handleChange} placeholder="Nama Anda" className={inputClass} /></div>
                                <div><label className={labelClass}>Nama Client (TTD Kanan)</label><input type="text" name="nama_client_ttd" value={form.nama_client_ttd} onChange={handleChange} placeholder="Nama Perwakilan Klien" className={inputClass} /></div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pb-10">
                            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 font-bold flex items-center gap-2 transition-colors"><X size={18} /> Batal</button>
                            <button type="submit" className="px-8 py-3.5 bg-purple-700 text-white rounded-xl shadow-lg hover:bg-purple-800 active:scale-95 font-bold flex items-center gap-2 transition-all"><Save size={18} /> {isEdit ? 'Simpan Perubahan' : 'Buat Quotation Sekarang'}</button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AccestretQuotationForm;
