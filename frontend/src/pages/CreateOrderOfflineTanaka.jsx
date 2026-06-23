import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { createQuotation, getNextQuotationNumber, updateQuotation, getQuotationById } from '../api/quotationApi';
import Sidebar from '../components/Sidebar';
import { Save, X, ArrowLeft, ShoppingCart, Users, FileText, Upload, CreditCard, Settings, PenTool } from 'lucide-react';


const CreateOrderOfflineTanaka = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we are editing an existing order
    const editData = location.state?.orderData || null;
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [activeItemIndex, setActiveItemIndex] = useState(null);

    const [form, setForm] = useState(editData || {
        customer: '',
        alamat_pt: '',
        cp_penagihan: '',
        up_penagihan: '',
        email: '',
        items: [{ rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs', diskon_item: 0, status_approval: '', harga_spv: 0, harga_jual: 0, base_harga_jual: 0, base_harga_spv: 0, bahan: '', bordir: '', harga_bordir: 0 }],
        subtotal: 0,
        ppn_persen: 0,
        jumlah_ppn: 0,
        // global discount removed; use per-item discounts instead
        ongkos_kirim: 0,
        grand_total: 0,
        deadline: '',
        payment_type: 'DP',
        status_produksi: 'Beli Kain',
        lokasi_proses: 'Internal',
        catatan: '',
        status: 'New Order',
        // Quotation fields
        tanggal_quotation: new Date().toISOString().split('T')[0],
        tanggal_pesan: new Date().toISOString().split('T')[0],
        tipe_pesanan: 'PO',
        deadline_final: '',
        tanggal_berlaku: '',
        deskripsi_pesanan: '',
        jenis_pembayaran: '',
        payment_note: '',
        term_of_payment: '',
        nama_marketing: '',
        nama_client_ttd: '',
        bahan: '',
        quotation_id: null,
    });

    const isEditingOrder = Boolean(editData?.id);
    const [createQuo, setCreateQuo] = useState(!isEditingOrder);
    const [quoFiles, setQuoFiles] = useState([]);
    const [saving, setSaving] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get('/marketing-offline-tanaka/customers');
                setCustomers(res.data);
            } catch (error) { console.error("Failed to fetch customers", error); }
        };
        const getBrand = (prod) => {
            const name = (prod.nama_produk || '').toUpperCase();
            if (name.includes('YAMAHA')) return 'PRODUK YAMAHA MOTOR';
            if (name.includes('HONDA MOBIL')) return 'PRODUK HONDA MOBIL';
            if (name.includes('FLP') || name.includes('MEKANIK HONDA') || (name.includes('HONDA') && !name.includes('MOBIL'))) return 'PRODUK HONDA MOTOR';
            if (name.includes('MITSUBISHI')) return 'PRODUK MITSUBISHI MOBIL';
            if (name.includes('TOYOTA')) return 'PRODUK TOYOTA MOBIL';
            if (name.includes('HYUNDAI')) return 'PRODUK HYUNDAI MOBIL';
            if (name.includes('WULING')) return 'PRODUK WULING MOBIL';
            if (name.includes('MAZDA')) return 'PRODUK MAZDA MOBIL';
            if (name.includes('ALFAMART')) return 'PRODUK ALFAMART';
            if (name.includes('INDOMARET')) return 'PRODUK INDOMARET';
            if (name.includes('SATPAM') || name.includes('SAFARI HITAM') || name.includes('SAFARI KUNING')) return 'PRODUK SATPAM';
            if (name.includes('SRS') || name.includes('RUMAH SAKIT') || name.includes('OKK')) return 'PRODUK SERAGAM RUMAH SAKIT';
            if (name.includes('PERTAMINA')) return 'PRODUK PERTAMINA';
            return 'PRODUK LAINNYA';
        };

        const BRAND_PREFIX = {
            'PRODUK HONDA MOTOR':          'HM',
            'PRODUK YAMAHA MOTOR':         'YM',
            'PRODUK HONDA MOBIL':          'HMM',
            'PRODUK MITSUBISHI MOBIL':     'MHM',
            'PRODUK TOYOTA MOBIL':         'TM',
            'PRODUK HYUNDAI MOBIL':        'HYM',
            'PRODUK WULING MOBIL':         'WM',
            'PRODUK MAZDA MOBIL':          'MM',
            'PRODUK ALFAMART':             'AM',
            'PRODUK INDOMARET':            'IM',
            'PRODUK SATPAM':               'SP',
            'PRODUK SERAGAM RUMAH SAKIT':  'SRS',
            'PRODUK PERTAMINA':            'PT',
            'PRODUK LAINNYA':              'PRD',
        };

        const fetchProducts = async () => {
            try {
                const res = await api.get('/produk');
                if (res.data && res.data.data) {
                    const fetchedProducts = res.data.data;
                    
                    const grouped = fetchedProducts.reduce((acc, curr) => {
                        const brand = getBrand(curr);
                        if (!acc[brand]) acc[brand] = [];
                        acc[brand].push(curr);
                        return acc;
                    }, {});
                    
                    const processedProducts = [];
                    Object.keys(grouped).forEach(brand => {
                        grouped[brand].forEach((prod, idx) => {
                            if (!prod.kode) {
                                const prefix = BRAND_PREFIX[brand] || 'PRD';
                                prod.kode = `${prefix}${String(idx + 1).padStart(3, '0')}`;
                            }
                            processedProducts.push(prod);
                        });
                    });
                    setProducts(processedProducts);
                } else {
                    setProducts([]);
                }
            } catch (error) { console.error("Failed to fetch products", error); }
        };
        fetchCustomers();
        fetchProducts();

        if (editData && editData.quotation_id) {
            const fetchQuo = async () => {
                try {
                    const res = await getQuotationById(editData.quotation_id);
                    if (res.data?.status === 'success') {
                        const q = res.data.data;
                        setForm(prev => ({
                            ...prev,
                            tanggal_quotation: q.tanggal_quotation ? q.tanggal_quotation.split('T')[0] : prev.tanggal_quotation,
                            tanggal_berlaku: q.tanggal_berlaku ? q.tanggal_berlaku.split('T')[0] : prev.tanggal_berlaku,
                            deskripsi_pesanan: q.deskripsi_pesanan || prev.deskripsi_pesanan,
                            jenis_pembayaran: q.jenis_pembayaran || prev.jenis_pembayaran,
                            payment_note: q.payment_note || prev.payment_note,
                            term_of_payment: q.term_of_payment || prev.term_of_payment,
                            nama_marketing: q.nama_marketing || prev.nama_marketing,
                            nama_client_ttd: q.nama_client_ttd || prev.nama_client_ttd,
                            ongkos_kirim: q.ongkos_kirim !== undefined ? q.ongkos_kirim : prev.ongkos_kirim,
                            ppn_persen: q.ppn_persen !== undefined ? q.ppn_persen : prev.ppn_persen,
                            alamat_pt: q.alamat_pt || prev.alamat_pt,
                            up_penagihan: q.up_penagihan || prev.up_penagihan,
                            cp_penagihan: q.cp_penagihan || prev.cp_penagihan,
                            email: q.email_customer || prev.email,
                            bahan: q.bahan || prev.bahan
                        }));
                    }
                } catch(e) { console.error("Failed to fetch quotation", e); }
            };
            fetchQuo();
        }
    }, []);

    // Helper: check if item needs approval (harga_satuan < harga_spv)
    const needsApproval = (item) => {
        const hargaSpv = Number(item.harga_spv) || 0;
        if (hargaSpv <= 0) return false;
        return Number(item.harga_satuan) < hargaSpv;
    };

    // Auto calculate totals (no global discount)
    useEffect(() => {
        const subtotal = form.items.reduce((acc, item) => {
            const itemTotal = Number(item.qty) * Number(item.harga_satuan);
            return acc + itemTotal;
        }, 0);
        const jumlah_ppn = subtotal * (Number(form.ppn_persen) / 100);
        const ongkir = Number(form.ongkos_kirim) || 0;
        const grand_total = subtotal + jumlah_ppn + ongkir;

        setForm(prev => ({ ...prev, subtotal, jumlah_ppn, grand_total }));
    }, [form.ppn_persen, form.items, form.ongkos_kirim]);

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
        let finalValue = value;
        
        // Handle comma as decimal for numeric fields
        if (['ppn_persen', 'ongkos_kirim'].includes(name)) {
            finalValue = String(value).replace(/,/g, '.').replace(/[^0-9.]/g, '');
            if (name === 'ppn_persen' && Number(finalValue) > 100) {
                finalValue = '100'; // Maksimal 100%
            }
        }
        
        // Real-time phone number validation
        if (name === 'cp_penagihan') {
            // Only allow digits and leading +
            finalValue = value.replace(/[^0-9+]/g, '');
            // Ensure + only at start
            if (finalValue.includes('+') && !finalValue.startsWith('+')) {
                finalValue = finalValue.replace(/\+/g, '');
            }
            // Validate format
            const phoneRegex = /^(\+?62|0)8[0-9]{7,12}$/;
            if (finalValue.length === 0) {
                setPhoneError('');
            } else if (!phoneRegex.test(finalValue)) {
                setPhoneError('Format salah. Gunakan: 08xxx / +62xxx (10-13 digit)');
            } else {
                setPhoneError('');
            }
        }
        
        if (name === 'payment_type' && finalValue === 'Non DP') {
            alert("Perhatian: Pemilihan metode 'Non DP' akan membuat order ini berstatus 'Menunggu Approval Non DP' setelah disimpan, dan butuh persetujuan atasan sebelum diproses.");
            setForm({ ...form, [name]: finalValue, status: 'Menunggu Approval Non DP' });
            return;
        }
        
        setForm({ ...form, [name]: finalValue });
    };

    const calculateSizeMultiplier = (sizeStr) => {
        if (!sizeStr) return 1;
        const s = sizeStr.toUpperCase().trim();
        
        if (/^X{2,}L$/.test(s)) {
            const xCount = s.length - 1; 
            return 1 + ((xCount - 1) * 0.1);
        }
        
        const match = s.match(/^(\d+)XL$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num >= 2) return 1 + ((num - 1) * 0.1);
        }
        return 1;
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...form.items];
        
        let finalValue = value;
        if (['harga_satuan', 'diskon_item', 'qty', 'harga_bordir'].includes(name)) {
            finalValue = String(value).replace(/,/g, '.').replace(/[^0-9.]/g, '');
        }
        
        if (name === 'diskon_item') {
            const diskon = Number(finalValue) || 0;
            const hjual = Number(newItems[index].harga_jual || 0);
            newItems[index].diskon_item = finalValue;
            if (hjual > 0) {
                newItems[index].harga_satuan = Math.max(0, hjual - diskon);
            }
        } else if (name === 'harga_bordir') {
            // Bordir ditambahkan ke harga_satuan (seperti diskon tapi menambah)
            const bordir = Number(finalValue) || 0;
            const base = Number(newItems[index].harga_satuan_base ?? newItems[index].harga_satuan) || 0;
            newItems[index].harga_bordir = finalValue;
            newItems[index].harga_satuan_base = base;
            newItems[index].harga_satuan = base + bordir; // ← harga satuan langsung bertambah
        } else if (name === 'harga_satuan') {
            const harga = Number(finalValue) || 0;
            const hjual = Number(newItems[index].harga_jual || 0);
            const bordir = Number(newItems[index].harga_bordir || 0);
            newItems[index].harga_satuan = finalValue;
            newItems[index].harga_satuan_base = harga - bordir; // simpan base
            if (hjual > 0 && harga <= hjual) {
                newItems[index].diskon_item = hjual - harga;
            } else {
                newItems[index].diskon_item = 0;
            }
        } else if (name === 'ukuran') {
            newItems[index].ukuran = value;
            if (newItems[index].base_harga_jual) {
                const multiplier = calculateSizeMultiplier(value);
                const newHJual = newItems[index].base_harga_jual * multiplier;
                const newHSpv = newItems[index].base_harga_spv * multiplier;
                
                newItems[index].harga_jual = newHJual;
                newItems[index].harga_spv = newHSpv;
                
                const diskon = Number(newItems[index].diskon_item || 0);
                newItems[index].harga_satuan = Math.max(0, newHJual - diskon);
            }
        } else {
            newItems[index][name] = value;
        }

        if (name === 'rincian') {
            filterProducts(index, value);
        }

        setForm({ ...form, items: newItems });
    };

    const getJenis = (prod) => {
        const k = prod.kategori;
        if (!k || k === 'Lainnya' || k === '') {
            const n = (prod.nama_produk || '').toUpperCase();
            if (n.includes('PDH')) return 'PDH';
            if (n.includes('PDL')) return 'PDL';
            if (n.includes('POLO')) return 'POLO';
            if (n.includes('WEARPACK')) return 'WEARPACK';
            if (n.includes('KEMEJA')) return 'KEMEJA';
            if (n.includes('CELANA')) return 'CELANA';
            if (n.includes('TOPI')) return 'TOPI';
            if (n.includes('APRON')) return 'APRON';
            if (n.includes('SERAGAM RS') || n.includes('OKK')) return 'SERAGAM RS';
        }
        return k || 'Lainnya';
    };

    const filterProducts = (index, value) => {
        setActiveItemIndex(index);
        if (Array.isArray(products)) {
            let pool = products;
            // Filter by selected bahan first
            if (form.bahan) {
                pool = products.filter(p => p.bahan && p.bahan.toUpperCase() === form.bahan.toUpperCase());
            }
            if (value && value.length > 0) {
                const q = value.toLowerCase();
                pool = pool.filter(p => {
                    const kd = (p.kode || '').toLowerCase();
                    const nm = (p.nama_produk || p.nama || '').toLowerCase();
                    const bh = (p.bahan || '').toLowerCase();
                    const jn = (getJenis(p) || '').toLowerCase();
                    return kd.includes(q) || nm.includes(q) || bh.includes(q) || jn.includes(q);
                });
            }
            setFilteredProducts(pool.slice(0, 30)); // limit 30 untuk performa
        } else {
            setFilteredProducts([]);
        }
    };

    const selectProduct = (index, prod) => {
        const newItems = [...form.items];
        // Sesuai Juklak: gunakan nama_produk asli dari database
        newItems[index].rincian = prod.nama_produk || prod.nama;
        newItems[index].kode_produk = prod.kode || '';  // simpan kode untuk referensi
        
        const hJual = Number(prod.harga_jual || prod.hpp_satuan || 0);
        const hSpv = Number(prod.harga_spv || 0);
        
        newItems[index].base_harga_jual = hJual;
        newItems[index].base_harga_spv = hSpv;
        
        newItems[index].harga_satuan = hJual;
        newItems[index].harga_spv = hSpv;
        newItems[index].harga_jual = hJual;
        newItems[index].diskon_item = 0;
        newItems[index].status_approval = '';
        
        // Trigger resize logic in case ukuran was already filled
        if (newItems[index].ukuran) {
            const multiplier = calculateSizeMultiplier(newItems[index].ukuran);
            newItems[index].harga_jual = hJual * multiplier;
            newItems[index].harga_spv = hSpv * multiplier;
            newItems[index].harga_satuan = hJual * multiplier;
        }
        
        setForm({ ...form, items: newItems });
        setFilteredProducts([]);
        setActiveItemIndex(null);
    };

    const sendApprove = async (index) => {
        const item = form.items[index];
        const effectivePrice = Number(item.harga_satuan);
        const hargaSpv = Number(item.harga_spv) || 0;

        if (effectivePrice >= hargaSpv) {
            alert('Harga masih di atas/sama dengan Harga SPV. Tidak perlu approval.');
            return;
        }

        try {
            await api.post('/marketing-offline-tanaka/orders/request-discount-approval', {
                nama_produk: item.rincian,
                harga_satuan: Number(item.harga_satuan),
                diskon_item: Number(item.diskon_item),
                harga_setelah_diskon: effectivePrice,
                harga_spv: hargaSpv,
                harga_jual: Number(item.harga_jual) || 0,
            });
            const newItems = [...form.items];
            newItems[index].status_approval = 'Menunggu Approval Owner';
            setForm({ ...form, items: newItems });
            alert(`Request Approval Diskon untuk item "${item.rincian}" telah dikirim ke Owner!\nHarga setelah diskon: Rp ${effectivePrice.toLocaleString('id-ID')} (di bawah SPV: Rp ${hargaSpv.toLocaleString('id-ID')})`);
        } catch (error) {
            console.error('Gagal mengirim approval:', error);
            alert('Gagal mengirim request approval: ' + (error.response?.data?.message || error.message));
        }
    };

    const addItem = () => {
        setForm({ ...form, items: [...form.items, { rincian: '', ukuran: '', qty: 1, harga_satuan: 0, satuan: 'Pcs', diskon_item: 0, status_approval: '', harga_spv: 0, harga_jual: 0, base_harga_jual: 0, base_harga_spv: 0, bahan: '', bordir: '', harga_bordir: 0 }] });
    };

    const removeItem = (index) => {
        if (form.items.length > 1) {
            const newItems = form.items.filter((_, i) => i !== index);
            setForm({ ...form, items: newItems });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Enforce HTML5 validations (required, pattern, etc)
        if (!e.target.checkValidity()) {
            e.target.reportValidity();
            return;
        }
        if (phoneError) {
            alert('Nomor telepon tidak valid. Periksa kembali format nomor.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                deadline: form.tipe_pesanan === 'Ready' ? null : form.deadline,
            };
            
            let orderId = editData?.id;
            if (editData && editData.id) {
                await api.put(`/marketing-offline-tanaka/orders/${editData.id}`, payload);
            } else {
                const res = await api.post('/marketing-offline-tanaka/orders', payload);
                orderId = res.data?.id;
            }

            // Also create or update quotation
            const qId = editData?.quotation_id || form.quotation_id;
            const hasExistingQuotation = Boolean(qId);
            
            if (hasExistingQuotation || (createQuo && !isEditingOrder)) {
                const quoData = {
                    cabang: 'Tanaka',
                    order_id: orderId || null,
                    tanggal_quotation: form.tanggal_quotation,
                    tanggal_berlaku: form.tanggal_berlaku,
                    nama_pt: form.customer,
                    alamat_pt: form.alamat_pt,
                    up_penagihan: form.up_penagihan,
                    cp_penagihan: form.cp_penagihan,
                    email_customer: form.email,
                    deskripsi_pesanan: form.deskripsi_pesanan,
                    items_detail: form.items,
                    subtotal: form.subtotal,
                    ppn_persen: form.ppn_persen,
                    jumlah_ppn: form.jumlah_ppn,
                    ongkos_kirim: form.ongkos_kirim,
                    bahan: form.bahan,
                    grand_total_quo: form.grand_total,
                    payment_type: form.payment_type,
                    jenis_pembayaran: form.jenis_pembayaran,
                    payment_note: form.payment_note,
                    term_of_payment: form.term_of_payment,
                    nama_marketing: form.nama_marketing,
                    nama_client_ttd: form.nama_client_ttd,
                    status: 'Draft'
                };

                if (hasExistingQuotation && isEditingOrder) {
                    await updateQuotation(qId, quoData);
                    if (quoFiles.length > 0) {
                        const fd = new FormData();
                        quoFiles.forEach(f => fd.append('files', f));
                        await api.post(`/quotation/${qId}/upload`, fd);
                    }
                } else if (createQuo && !isEditingOrder && !hasExistingQuotation) {
                    const noRes = await getNextQuotationNumber('Tanaka');
                    quoData.no_quotation = noRes.data.no_quotation;
                    const quoRes = await createQuotation(quoData);
                    // Upload files if any
                    if (quoFiles.length > 0 && quoRes.data?.id) {
                        const fd = new FormData();
                        quoFiles.forEach(f => fd.append('files', f));
                        await api.post(`/quotation/${quoRes.data.id}/upload`, fd);
                    }
                }
            }

            alert(editData ? 'Order berhasil diupdate!' : 'Order & Quotation berhasil dibuat!');
            navigate('/marketing-offline-tanaka/orders');
        } catch (error) {
            console.error('Gagal menyimpan', error);
            alert('Gagal menyimpan: ' + (error.response?.data?.message || error.message));
        } finally { setSaving(false); }
    };

    return (
        <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate('/marketing-offline-tanaka/orders')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 border border-gray-100 transition-colors">
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

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><FileText size={20}/> HEADER QUOTATION</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Quotation</label>
                                    <input type="date" name="tanggal_quotation" value={form.tanggal_quotation} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Berlaku</label>
                                    <input type="date" name="tanggal_berlaku" value={form.tanggal_berlaku} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Pesanan Singkat</label>
                                    <input type="text" name="deskripsi_pesanan" value={form.deskripsi_pesanan} onChange={handleChange} placeholder="Contoh: Pembuatan Seragam..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Data Customer */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><Users size={20}/> DATA CUSTOMER</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Instansi *</label>
                                    <input type="text" name="customer" value={form.customer} onChange={handleCustomerChange} required placeholder="Ketik nama instansi..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" autoComplete="off" />
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap *</label>
                                    <textarea name="alamat_pt" value={form.alamat_pt} onChange={handleChange} required rows={2} placeholder="Alamat lengkap..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">UP (Nama Penagihan)</label>
                                    <input type="text" name="up_penagihan" value={form.up_penagihan} onChange={handleChange} placeholder="Bpk/Ibu ..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person (No HP) *</label>
                                    <input
                                        type="text"
                                        name="cp_penagihan"
                                        value={form.cp_penagihan}
                                        onChange={handleChange}
                                        required
                                        placeholder="08123456789 atau +628123456789"
                                        maxLength={15}
                                        className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none transition-colors ${
                                            phoneError
                                                ? 'border-red-400 focus:ring-red-200 bg-red-50'
                                                : form.cp_penagihan && !phoneError
                                                    ? 'border-green-400 focus:ring-green-200 bg-green-50'
                                                    : 'border-gray-200 focus:ring-[#990000]/20'
                                        }`}
                                    />
                                    {phoneError && (
                                        <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                                            ⚠️ {phoneError}
                                        </p>
                                    )}
                                    {!phoneError && form.cp_penagihan && (
                                        <p className="text-xs text-green-600 font-semibold mt-1">✓ Nomor valid</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2.5 Pilihan Bahan (sebelum Detail Barang) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">PILIH BAHAN</h3>
                            <div className="flex flex-col gap-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Bahan Utama <span className="text-gray-400 font-normal">(Produk yang tampil di input barang akan difilter sesuai bahan ini)</span></label>
                                <select name="bahan" value={form.bahan || ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white text-base font-semibold">
                                    <option value="">-- Pilih Bahan (Semua produk tampil jika kosong) --</option>
                                    <option value="NAGATA">NAGATA</option>
                                    <option value="UNIONE">UNIONE</option>
                                    <option value="MACAN DRILL">MACAN DRILL</option>
                                    <option value="JAPAN DRILL">JAPAN DRILL</option>
                                    <option value="ERRO">ERRO</option>
                                    <option value="OXFORD">OXFORD</option>
                                    <option value="RISPTOP">RISPTOP</option>
                                    <option value="RIPSTOP">RIPSTOP</option>
                                    <option value="KAOS">KAOS</option>
                                    <option value="LACOSTE">LACOSTE</option>
                                    <option value="DRY FIT">DRY FIT</option>
                                    <option value="HIGH TWIST">HIGH TWIST</option>
                                    <option value="CANVAS">CANVAS</option>
                                    <option value="JEANS">JEANS</option>
                                    <option value="PARAGON">PARAGON</option>
                                    <option value="PARASUT">PARASUT</option>
                                    <option value="PIQUE">PIQUE</option>
                                    <option value="SERENA">SERENA</option>
                                    <option value="TASLAN MILKY">TASLAN MILKY</option>
                                </select>
                                {form.bahan && (
                                    <p className="text-xs text-blue-600 mt-1">✓ Produk difilter: hanya menampilkan produk berbahan <strong>{form.bahan}</strong></p>
                                )}
                            </div>
                        </div>

                        {/* 3. Detail Order & Items */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000]">DETAIL BARANG</h3>
                            <div className="space-y-4 mb-6">
                                {form.items && form.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 relative pt-8 md:pt-4">
                                        <div className="col-span-12 md:col-span-3 relative">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Produk</label>
                                            <input 
                                                type="text" 
                                                name="rincian" 
                                                value={item.rincian || item.nama_barang} 
                                                onChange={(e) => handleItemChange(index, e)} 
                                                onFocus={() => filterProducts(index, item.rincian || item.nama_barang)}
                                                onBlur={() => setTimeout(() => setActiveItemIndex(null), 200)}
                                                placeholder="Nama Produk" 
                                                required 
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" 
                                                autoComplete="off" 
                                            />
                                            {activeItemIndex === index && filteredProducts.length > 0 && (
                                                <ul className="absolute z-20 w-72 bg-white border border-gray-200 mt-1 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                    {filteredProducts.map(prod => (
                                                        <li key={prod.id} onClick={() => selectProduct(index, prod)} className="p-2.5 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-white bg-[#990000] px-1.5 py-0.5 rounded font-mono shrink-0">
                                                                    {prod.kode || `PRD-${prod.id}`}
                                                                </span>
                                                                <span className="text-xs font-semibold text-gray-800 truncate">{prod.nama_produk}</span>
                                                            </div>
                                                            <div className="flex justify-between mt-1">
                                                                <span className="text-[10px] text-gray-400">{prod.bahan || '-'} {prod.variasi ? `| ${prod.variasi}` : ''}</span>
                                                                <span className="text-[10px] font-bold text-[#990000]">Rp {Number(prod.harga_jual || prod.hpp_satuan || 0).toLocaleString('id-ID')}</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Detail</label>
                                            <input type="text" name="ukuran" value={item.ukuran || ''} onChange={(e) => handleItemChange(index, e)} placeholder="Cth: XL" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center text-sm" />
                                        </div>
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Qty</label>
                                            <input type="text" inputMode="decimal" name="qty" value={item.qty} onChange={(e) => handleItemChange(index, e)} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center text-sm" />
                                        </div>
                                        <div className="col-span-3 md:col-span-1">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-center">Unit</label>
                                            <input type="text" name="satuan" value={item.satuan || 'Pcs'} onChange={(e) => handleItemChange(index, e)} placeholder="Pcs" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-center text-sm" />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">Harga Satuan</label>
                                            <input type="text" inputMode="decimal" name="harga_satuan" value={item.harga_satuan} onChange={(e) => handleItemChange(index, e)} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right text-sm font-semibold" />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">Diskon Item</label>
                                            <div className="flex gap-1 items-center">
                                                <input type="text" inputMode="decimal" name="diskon_item" value={item.diskon_item || ''} onChange={(e) => handleItemChange(index, e)} placeholder="0" className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right text-sm ${needsApproval(item) ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-300 text-red-600'}`} />
                                                {needsApproval(item) && item.status_approval !== 'Menunggu Approval Owner' && (
                                                    <button type="button" onClick={() => sendApprove(index)} className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-[10px] font-bold shrink-0 whitespace-nowrap">Approve</button>
                                                )}
                                            </div>
                                            {needsApproval(item) && !item.status_approval && (
                                                <p className="text-[9px] text-red-500 font-bold mt-1 text-right">⚠ Harga di bawah SPV (Rp {Number(item.harga_spv).toLocaleString('id-ID')}), butuh approval Owner</p>
                                            )}
                                            {!needsApproval(item) && Number(item.diskon_item) > 0 && (
                                                <p className="text-[9px] text-green-600 font-bold mt-1 text-right">✓ Diskon OK, harga masih di atas SPV</p>
                                            )}
                                            {item.status_approval && <p className="text-[9px] text-yellow-600 font-bold mt-1 text-right">⏳ {item.status_approval}</p>}
                                        </div>
                                        <div className="absolute top-2 right-2 md:static md:col-span-1 flex items-end justify-center">
                                            <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 transition-colors p-2">
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <div className="col-span-12 grid grid-cols-12 gap-3 mt-2 border-t border-gray-100 pt-3">
                                            <div className="col-span-12 md:col-span-4">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bordir (Keterangan)</label>
                                                <input type="text" name="bordir" value={item.bordir || ''} onChange={(e) => handleItemChange(index, e)} placeholder="Contoh: Logo dada kiri" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" />
                                            </div>
                                            <div className="col-span-12 md:col-span-3">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Harga Bordir/pcs</label>
                                                <input type="text" inputMode="decimal" name="harga_bordir" value={item.harga_bordir || ''} onChange={(e) => handleItemChange(index, e)} placeholder="0" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right text-sm text-orange-600 font-semibold" />
                                                {Number(item.harga_bordir) > 0 && <p className="text-[9px] text-orange-500 mt-1 text-right">+Rp {(Number(item.qty||1)*Number(item.harga_bordir)).toLocaleString('id-ID')}</p>}
                                            </div>

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
                                        <label className="text-sm font-semibold text-gray-700 w-1/3">
                                            PPN (%)
                                            <span className="block text-[10px] text-gray-400 font-normal mt-0.5">(Jika dibutuhkan)</span>
                                        </label>
                                        <input type="text" inputMode="decimal" name="ppn_persen" value={form.ppn_persen} onChange={handleChange} className="w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right" />
                                        <span className="w-1/3 text-right text-sm text-gray-600">Rp {form.jumlah_ppn.toLocaleString('id-ID')}</span>
                                    </div>
                                    {/* Global discount removed; per-item discounts are used instead */}
                                    <div className="flex items-center justify-between gap-4">
                                        <label className="text-sm font-semibold text-gray-700 w-1/3">Ongkos Kirim</label>
                                        <input type="text" inputMode="decimal" name="ongkos_kirim" value={form.ongkos_kirim} onChange={handleChange} className="w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none text-right" placeholder="0" />
                                        <span className="w-1/3 text-right text-sm text-gray-600 font-bold">+ Rp {Number(form.ongkos_kirim || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-gray-300">
                                        <label className="text-base font-extrabold text-[#990000] w-1/3">GRAND TOTAL</label>
                                        <span className="w-2/3 text-right text-xl font-black text-[#990000]">Rp {form.grand_total.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* Detail Pembayaran */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><CreditCard size={20}/> DETAIL PEMBAYARAN</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Skema Pembayaran</label>
                                    <select name="payment_type" value={form.payment_type} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                        <option value="DP">DP (Down Payment)</option>
                                        <option value="Fullpayment">Fullpayment</option>
                                        <option value="Non DP">Non DP (Butuh Approval Atasan)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Metode Pembayaran</label>
                                    <select name="jenis_pembayaran" value={form.jenis_pembayaran} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                        <option value="">-- Pilih --</option>
                                        <option value="Transfer Bank">Transfer Bank</option>
                                        <option value="Cash">Cash</option>
                                        <option value="DP + Pelunasan">DP + Pelunasan</option>
                                        <option value="Credit">Credit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method (Info Rekening)</label>
                                    <textarea name="payment_note" value={form.payment_note} onChange={handleChange} rows={2} placeholder="Contoh: Transfer ke Bank BNI a/n PT Tanaka Nusantara No Rek 123456789" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Term of Payment (Ketentuan Tambahan)</label>
                                    <textarea name="term_of_payment" value={form.term_of_payment} onChange={handleChange} rows={2} placeholder="Contoh: DP 50% sebelum produksi, pelunasan sebelum pengiriman..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Pengaturan Proses */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><Settings size={20}/> DEADLINE PRODUKSI</h3>
                            <div className={`grid grid-cols-1 md:grid-cols-${form.tipe_pesanan === 'Ready' ? '2' : '3'} gap-4 mb-4`}>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ketersediaan Produk *</label>
                                    <select name="tipe_pesanan" value={form.tipe_pesanan || 'PO'} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none font-medium">
                                        <option value="PO">Pre-Order (Butuh Produksi)</option>
                                        <option value="Ready">Ready Stock (Gudang)</option>
                                    </select>
                                </div>
                                {form.tipe_pesanan !== 'Ready' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Deadline Produksi (Min. 14 Hari) *</label>
                                        <input type="date" name="deadline" value={form.deadline ? form.deadline.split('T')[0] : ''} onChange={handleChange} min={new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0]} required className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                        <div className="flex gap-2 mt-2">
                                            <button type="button" onClick={() => setForm({...form, deadline: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0]})} className="text-[10px] px-2 py-1 bg-gray-100 border border-gray-200 rounded text-gray-600 hover:bg-gray-200">2 Minggu</button>
                                            <button type="button" onClick={() => setForm({...form, deadline: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString().split('T')[0]})} className="text-[10px] px-2 py-1 bg-gray-100 border border-gray-200 rounded text-gray-600 hover:bg-gray-200">3 Minggu</button>
                                            <button type="button" onClick={() => setForm({...form, deadline: new Date(new Date().setDate(new Date().getDate() + 28)).toISOString().split('T')[0]})} className="text-[10px] px-2 py-1 bg-gray-100 border border-gray-200 rounded text-gray-600 hover:bg-gray-200">4 Minggu</button>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
                                    <textarea name="catatan" value={form.catatan} onChange={handleChange} rows={1} placeholder="Instruksi khusus produksi..." className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none resize-none"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Tanda Tangan & Upload */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 mb-4 text-[#990000] flex items-center gap-2"><PenTool size={20}/> TANDA TANGAN & DOKUMEN</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Marketing (TTD)</label>
                                        <select name="nama_marketing" value={form.nama_marketing} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none bg-white">
                                            <option value="">-- Pilih Marketing --</option>
                                            <option value="Naka">Naka</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Client (TTD)</label>
                                        <input type="text" name="nama_client_ttd" value={form.nama_client_ttd} onChange={handleChange} placeholder="Nama client yang menandatangani" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 outline-none" />
                                    </div>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => document.getElementById('quo_files_upload').click()}>
                                    <Upload className="text-gray-400 mb-3" size={32} />
                                    <h4 className="font-bold text-gray-700">Upload Dokumen Pendukung</h4>
                                    <p className="text-xs text-gray-500 mt-1 mb-4">Klik untuk memilih file PDF, gambar bukti transfer DP, dll.</p>
                                    <input type="file" id="quo_files_upload" multiple onChange={(e) => setQuoFiles(prev => [...prev, ...Array.from(e.target.files)])} className="hidden" />
                                </div>
                                {quoFiles.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {quoFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-100 shadow-sm">
                                                <span className="text-xs text-gray-700 font-medium truncate flex-1 mr-2">{file.name}</span>
                                                <button type="button" onClick={() => setQuoFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pb-10">
                            <button type="button" onClick={() => navigate('/marketing-offline-tanaka/orders')} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
                                <X size={18} /> Batal
                            </button>
                            <button type="submit" disabled={saving} className="px-8 py-3 bg-[#990000] text-white rounded-xl shadow-lg hover:bg-red-800 transition-transform active:scale-95 font-bold flex items-center gap-2 disabled:opacity-50">
                                <Save size={18} /> {saving ? 'Menyimpan...' : (editData ? 'Simpan Perubahan' : 'Buat Order & Quotation')}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateOrderOfflineTanaka;
