import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Save, X, ArrowLeft, ShoppingCart, Users } from 'lucide-react';

const CreateOrderOfflineBanua = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we are editing an existing order
    const editData = location.state?.orderData || null;

    const [form, setForm] = useState(editData || {
        customer: '',
        alamat_pt: '',
        cp_penagihan: '',
        up_penagihan: '',
        email: '',
        items: [{ rincian: '', qty: 1, harga_satuan: 0, satuan: 'Pcs' }],
        subtotal: 0,
        ppn_persen: 0,
        jumlah_ppn: 0,
        grand_total: 0,
        deadline: '',
        payment_type: 'DP',
        status_produksi: 'Beli Kain',
        lokasi_proses: 'Internal',
        catatan: '',
        status: 'New Order',
        kategori_pasar: ''
    });

    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        // Fetch customers for autocomplete
        const fetchCustomers = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/marketing-offline/customers', { 
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
                });
                setCustomers(res.data);
            } catch (error) {
                console.error("Failed to fetch customers", error);
            }
        };
        fetchCustomers();
    }, []);

    // Auto calculate totals
    useEffect(() => {
        let subtotal = 0;
        if (form.items && form.items.length > 0) {
            subtotal = form.items.reduce((acc, item) => acc + (Number(item.qty) * Number(item.harga_satuan)), 0);
        }

        const jumlah_ppn = subtotal * (Number(form.ppn_persen) / 100);
        const grand_total = subtotal + jumlah_ppn;

        setForm(prev => ({ ...prev, subtotal, jumlah_ppn, grand_total }));
    }, [form.ppn_persen, form.items]);

    const handleCustomerChange = (e) => {
        const val = e.target.value;
        setForm({ ...form, customer: val });

        if (val.length > 0) {
            const matches = customers.filter(c => c.nama_customer.toLowerCase().includes(val.toLowerCase()));
            setFilteredCustomers(matches);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectCustomer = (cust) => {
        setForm({
            ...form,
            customer: cust.nama_customer,
            alamat_pt: cust.alamat || '',
            cp_penagihan: cust.no_hp || '',
            email: cust.email || '',
            up_penagihan: cust.up_penagihan || '',
        });
        setShowSuggestions(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (editData && editData.id) {
                await axios.put(`http://localhost:3000/api/marketing-offline/orders/${editData.id}`, form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Order berhasil diupdate!");
            } else {
                await axios.post('http://localhost:3000/api/marketing-offline/orders', form, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Order berhasil dibuat!");
            }
            navigate('/marketing-offline/orders');
        } catch (error) {
            console.error("Gagal menyimpan order", error);
            alert("Gagal menyimpan order");
        }
    };

    return (
        <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate('/marketing-offline/orders')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 border border-gray-100 transition-colors">
                            <ArrowLeft className="text-gray-600" size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <ShoppingCart className="text-[#990000]" />
                                {editData ? 'Edit Order' : 'Buat Order Baru'}
                            </h1>
                            <p className="text-gray-500 mt-1">Isi formulir order yang akan terhubung dengan Invoice di Finance.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Data Customer */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><Users size={20}/> DATA CUSTOMER</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Customer / PT *</label>
                                    <input type="text" name="customer" value={form.customer} onChange={handleCustomerChange} required placeholder="Ketik nama customer..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" autoComplete="off" />
                                    {showSuggestions && filteredCustomers.length > 0 && (
                                        <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {filteredCustomers.map(cust => (
                                                <li key={cust.id} onClick={() => selectCustomer(cust)} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                                                    <p className="font-bold text-sm text-gray-800">{cust.nama_customer}</p>
                                                    <p className="text-xs text-gray-500 truncate">{cust.alamat}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@perusahaan.com" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori Pasar / Segmen *</label>
                                    <select name="kategori_pasar" value={form.kategori_pasar} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                        <option value="">-- Pilih Kategori Pasar --</option>
                                        <option value="Honda Motor">Honda Motor</option>
                                        <option value="Daihatsu">Daihatsu</option>
                                        <option value="Yamaha">Yamaha</option>
                                        <option value="Umum Kampus">Umum Kampus</option>
                                        <option value="Wuling">Wuling</option>
                                        <option value="Mitsubishi">Mitsubishi</option>
                                        <option value="SMK TRSM Honda">SMK TRSM Honda</option>
                                        <option value="Umum Company">Umum Company</option>
                                        <option value="Honda Mobil">Honda Mobil</option>
                                        <option value="Mazda">Mazda</option>
                                        <option value="SMK Non TRSM">SMK Non TRSM</option>
                                        <option value="Umum Komunitas">Umum Komunitas</option>
                                        <option value="Suzuki">Suzuki</option>
                                        <option value="Toyota">Toyota</option>
                                        <option value="TK">TK</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap *</label>
                                    <textarea name="alamat_pt" value={form.alamat_pt} onChange={handleChange} required rows={2} placeholder="Alamat lengkap..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">UP (Nama Penagihan)</label>
                                    <input type="text" name="up_penagihan" value={form.up_penagihan} onChange={handleChange} placeholder="Bpk/Ibu ..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person (No HP) *</label>
                                    <input type="text" name="cp_penagihan" value={form.cp_penagihan} onChange={handleChange} required placeholder="0812..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Detail Order & Items */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">DETAIL BARANG</h3>
                            <div className="space-y-4 mb-6">
                                {form.items && form.items.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="flex-1">
                                            <input type="text" name="rincian" value={item.rincian || item.nama_barang} onChange={(e) => handleItemChange(index, e)} placeholder="Nama Produk (contoh: Kemeja PDL)" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                        </div>
                                        <div className="w-24">
                                            <input type="number" name="qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} min="1" placeholder="Qty" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center" />
                                        </div>
                                        <div className="w-24">
                                            <input type="text" name="satuan" value={item.satuan || 'Pcs'} onChange={(e) => handleItemChange(index, e)} placeholder="Satuan" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center" />
                                        </div>
                                        <div className="w-40">
                                            <input type="number" name="harga_satuan" value={item.harga_satuan} onChange={(e) => handleItemChange(index, e)} min="0" placeholder="Harga Satuan" required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right" />
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

                        {/* Pengaturan Proses */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">PENGATURAN PROSES PRODUKSI</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Type</label>
                                    <select name="payment_type" value={form.payment_type} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                        <option value="DP">DP (Down Payment)</option>
                                        <option value="Fullpayment">Fullpayment</option>
                                        <option value="Non DP">Non DP</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi Proses</label>
                                    <select name="lokasi_proses" value={form.lokasi_proses} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                        <option value="Internal">Internal</option>
                                        <option value="Eksternal">Eksternal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status Produksi</label>
                                    <select name="status_produksi" value={form.status_produksi} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                        <option value="Beli Kain">Beli Kain</option>
                                        <option value="Proses Potong">Proses Potong</option>
                                        <option value="Proses Jahit">Proses Jahit</option>
                                        <option value="Finishing">Finishing</option>
                                        <option value="Selesai">Selesai</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Deadline Produksi *</label>
                                    <input type="date" name="deadline" value={form.deadline ? form.deadline.split('T')[0] : ''} onChange={handleChange} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
                                <textarea name="catatan" value={form.catatan} onChange={handleChange} rows={2} placeholder="Instruksi khusus produksi atau catatan lainnya..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pb-10">
                            <button type="button" onClick={() => navigate('/marketing-offline/orders')} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
                                <X size={18} /> Batal
                            </button>
                            <button type="submit" className="px-8 py-3 bg-[#990000] text-white rounded-xl shadow-lg hover:bg-red-800 transition-transform active:scale-95 font-bold flex items-center gap-2">
                                <Save size={18} /> {editData ? 'Simpan Perubahan' : 'Buat Order'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateOrderOfflineBanua;
