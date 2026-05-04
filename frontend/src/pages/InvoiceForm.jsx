import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { createInvoice, getInvoiceById, updateInvoice } from '../api/invoiceApi';
import { Save, X, ArrowLeft, Receipt } from 'lucide-react';

const InvoiceForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        no_invoice: '',
        cabang: 'Banua',
        tanggal_transaksi: new Date().toISOString().split('T')[0],
        tanggal_terbit: new Date().toISOString().split('T')[0],
        tanggal_jatuh_tempo: '',
        nama_pt: '',
        alamat_pt: '',
        cp_penagihan: '',
        email: '',
        up_penagihan: '',
        deskripsi: '',
        detail_pekerjaan: '',
        items: [{ rincian: '', qty: 1, harga_satuan: 0, satuan: 'Pcs' }],
        qty: 1,
        harga_satuan: 0,
        subtotal: 0,
        ppn_persen: 0,
        jumlah_ppn: 0,
        Diskon: 0,
        grand_total: 0,
        keterangan: '',
        note: 'Pembayaran dapat ditransfer ke rekening BNI: 123456789 a/n PT Tanaka',
        materai: false,
        ttd: true,
        nama_accounting: '',
        penanggung_jawab: '',
        jabatan: '',
        status: 'Draft'
    });

    useEffect(() => {
        if (isEdit) {
            fetchInvoice();
        }
    }, [id]);

    // Auto calculate totals
    useEffect(() => {
        let subtotal = 0;
        if (form.items && form.items.length > 0) {
            subtotal = form.items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.harga_satuan)), 0);
        } else {
            subtotal = Number(form.qty) * Number(form.harga_satuan);
        }

        const jumlah_ppn = subtotal * (Number(form.ppn_persen) / 100);
        const grand_total = subtotal + jumlah_ppn;

        setForm(prev => ({
            ...prev,
            subtotal,
            jumlah_ppn,
            grand_total
        }));
    }, [form.qty, form.harga_satuan, form.ppn_persen, form.items]);

    // Auto update note based on cabang
    useEffect(() => {
        let defaultNote = '';
        if (form.cabang === 'Banua') {
            defaultNote = `PAYMENT METHOD :
Term of Payment           : 
Bank                      : BANK RAKYAT INDONESIA (BRI)
Cabang                    : Yogyakarta
No. Rekening              : 2099 0100 0545 304
Atas Nama                 : PT BANUA MITRA LESTARI`;
        } else if (form.cabang === 'Tanaka') {
            defaultNote = `PAYMENT METHOD :
Term of Payment           : 
Bank                      : BANK RAKYAT INDONESIA (BRI)
Cabang                    : Yogyakarta
No. Rekening              : 2099 0100 0495 305
Atas Nama                 : PT TANAKA RIZQI BAROKAH`;
        }

        setForm(prev => ({
            ...prev,
            note: defaultNote
        }));
    }, [form.cabang]);

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...form.items];
        newItems[index][name] = value;
        setForm({ ...form, items: newItems });
    };

    const addItem = () => {
        setForm({ ...form, items: [...form.items, { rincian: '', qty: 1, harga_satuan: 0, satuan: 'Pcs' }] });
    };

    const removeItem = (index) => {
        if (form.items.length > 1) {
            const newItems = form.items.filter((_, i) => i !== index);
            setForm({ ...form, items: newItems });
        }
    };

    const fetchInvoice = async () => {
        try {
            const res = await getInvoiceById(id);
            if (res.data.status === 'success') {
                const data = res.data.data;
                setForm({
                    ...data,
                    tanggal_transaksi: data.tanggal_transaksi ? data.tanggal_transaksi.split('T')[0] : '',
                    tanggal_terbit: data.tanggal_terbit ? data.tanggal_terbit.split('T')[0] : '',
                    tanggal_jatuh_tempo: data.tanggal_jatuh_tempo ? data.tanggal_jatuh_tempo.split('T')[0] : '',
                    items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || [{ rincian: '', qty: data.qty || 1, harga_satuan: data.harga_satuan || 0, satuan: 'Pcs' }]),
                    materai: Boolean(data.materai),
                    ttd: Boolean(data.ttd)
                });
            }
        } catch (error) {
            console.error('Gagal memuat data invoice', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await updateInvoice(id, form);
                alert("Invoice berhasil diperbarui!");
            } else {
                await createInvoice(form);
                alert("Invoice berhasil dibuat!");
            }
            navigate('/invoice');
        } catch (error) {
            console.error("Gagal menyimpan invoice", error);
            alert("Gagal menyimpan invoice");
        }
    };

    return (
        <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 border border-gray-100 transition-colors">
                            <ArrowLeft className="text-gray-600" size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <Receipt className="text-[#990000]" />
                                {isEdit ? 'Edit Invoice' : 'Buat Invoice Baru'}
                            </h1>
                            <p className="text-gray-500 mt-1">Lengkapi form di bawah ini dengan benar untuk membuat tagihan resmi.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. Header Invoice */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">HEADER INVOICE</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">No Invoice</label>
                                    <input type="text" name="no_invoice" value={form.no_invoice} onChange={handleChange} placeholder="Otomatis jika dikosongkan" disabled={isEdit} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Cabang Asal *</label>
                                    <select name="cabang" value={form.cabang} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none bg-white">
                                        <option value="Banua">PT Banua Mitra Lestari</option>
                                        <option value="Tanaka">PT Tanaka Rizqi Barokah</option>
                                        <option value="Acestreet">PT Acestreet</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Transaksi *</label>
                                    <input type="date" name="tanggal_transaksi" value={form.tanggal_transaksi} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Terbit Invoice *</label>
                                    <input type="date" name="tanggal_terbit" value={form.tanggal_terbit} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Jatuh Tempo *</label>
                                    <input type="date" name="tanggal_jatuh_tempo" value={form.tanggal_jatuh_tempo} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status Invoice</label>
                                    <select name="status" value={form.status} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                        <option value="Draft">Draft</option>
                                        <option value="Terbit">Terbit</option>
                                        <option value="Lunas">Lunas</option>
                                        <option value="Overdue">Overdue</option>
                                        <option value="Duedate">Duedate</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Data Customer */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">DATA CUSTOMER</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama PT / Perusahaan *</label>
                                    <input type="text" name="nama_pt" value={form.nama_pt} onChange={handleChange} required placeholder="Contoh: PT. ABC Kaltim" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Penagihan</label>
                                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="finance@abc.com" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap Perusahaan *</label>
                                    <textarea name="alamat_pt" value={form.alamat_pt} onChange={handleChange} required rows={2} placeholder="Alamat lengkap pengiriman invoice..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">UP (Nama) Penagihan</label>
                                    <input type="text" name="up_penagihan" value={form.up_penagihan} onChange={handleChange} placeholder="Bpk. Budi" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person (CP) Penagihan</label>
                                    <input type="text" name="cp_penagihan" value={form.cp_penagihan} onChange={handleChange} placeholder="0812..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* 3. Detail Tagihan */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">DETAIL TAGIHAN</h3>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Utama</label>
                                <input type="text" name="deskripsi" value={form.deskripsi} onChange={handleChange} placeholder="Pembayaran Termin 1 / Tagihan Order..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                            </div>

                            <div className="space-y-4 mb-6">
                                <label className="block text-sm font-semibold text-gray-700">Rincian Item / Pekerjaan</label>
                                {form.items && form.items.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="flex-1">
                                            <input type="text" name="rincian" value={item.rincian} onChange={(e) => handleItemChange(index, e)} placeholder="Rincian (contoh: Seragam Ukuran XL)" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                        </div>
                                        <div className="w-24">
                                            <input type="number" name="qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} min="1" placeholder="Qty" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center" />
                                        </div>
                                        <div className="w-24">
                                            <input type="text" name="satuan" value={item.satuan} onChange={(e) => handleItemChange(index, e)} placeholder="Pcs/Unit" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center" />
                                        </div>
                                        <div className="w-40">
                                            <input type="number" name="harga_satuan" value={item.harga_satuan} onChange={(e) => handleItemChange(index, e)} min="0" placeholder="Harga Satuan" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right" />
                                        </div>
                                        <div className="w-10 text-center">
                                            <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 font-bold p-2 bg-white rounded-md border border-red-200">X</button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={addItem} className="text-sm font-semibold text-[#990000] bg-red-50 px-4 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-colors">+ Tambah Item</button>
                            </div>

                            <div className="flex justify-end">
                                <div className="w-full md:w-1/2 lg:w-1/3 space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-sm font-semibold text-gray-700 w-1/3">Subtotal</label>
                                        <span className="w-2/3 text-right font-bold text-gray-800">Rp {form.subtotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-sm font-semibold text-gray-700 w-1/3">PPN (%)</label>
                                        <input type="number" name="ppn_persen" value={form.ppn_persen} onChange={handleChange} min="0" max="100" className="w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right" />
                                        <span className="w-1/3 text-right text-sm text-gray-600">Rp {form.jumlah_ppn.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-gray-300">
                                        <label className="text-base font-extrabold text-[#990000] w-1/3">GRAND TOTAL</label>
                                        <span className="w-2/3 text-right text-xl font-black text-[#990000]">Rp {form.grand_total.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Footer & Legal */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">PENGATURAN CETAK & LEGAL</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method (Keterangan)</label>
                                    <textarea name="keterangan" value={form.keterangan} onChange={handleChange} rows={2} placeholder="Misal: Sudah termasuk biaya ongkos kirim" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                                            <input type="checkbox" name="ttd" checked={form.ttd} onChange={handleChange} className="w-4 h-4 text-[#990000] focus:ring-[#990000] rounded" />
                                            <span className="text-sm font-medium text-gray-700">Tempat Tanda Tangan</span>
                                        </label>
                                    </div>
                                    <div className="pt-2 border-t border-gray-100">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Pembuat (Prepared by - Kiri)</label>
                                        <input type="text" name="nama_accounting" value={form.nama_accounting} onChange={handleChange} placeholder="Nama Staf Marketing" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Penyetuju (Approved by - Kanan)</label>
                                        <input type="text" name="penanggung_jawab" value={form.penanggung_jawab} onChange={handleChange} placeholder="Nama Accounting" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Jabatan Penyetuju (Kanan)</label>
                                        <input type="text" name="jabatan" value={form.jabatan} onChange={handleChange} placeholder="Accounting" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pb-10">
                            <button type="button" onClick={() => navigate('/invoice')} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
                                <X size={18} /> Batal
                            </button>
                            <button type="submit" className="px-8 py-3 bg-[#990000] text-white rounded-xl shadow-lg hover:bg-red-800 transition-transform active:scale-95 font-bold flex items-center gap-2">
                                <Save size={18} /> {isEdit ? 'Simpan Perubahan' : 'Terbitkan Invoice'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default InvoiceForm;
