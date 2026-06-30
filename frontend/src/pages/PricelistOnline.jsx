import React, { useState, useEffect, useCallback } from 'react';
import { Search, Upload, Tag, UserCircle, Edit2, Check, X, Plus, Loader2, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const GRUP_OPTIONS = [
  'PRODUK HONDA MOTOR','PRODUK YAMAHA MOTOR','PRODUK HONDA MOBIL',
  'PRODUK MITSUBISHI MOBIL','PRODUK TOYOTA MOBIL','PRODUK SUZUKI MOBIL',
  'PRODUK ISUZU MOBIL','PRODUK HYUNDAI MOBIL','PRODUK WULING MOBIL',
  'PRODUK MAZDA MOBIL','PRODUK ALFAMART',
];

const EMPTY_FORM = { kode:'', grup_produk:'PRODUK HONDA MOTOR', jenis:'', nama_produk:'', bahan:'UNIONE', harga_jual:'', hpp:'', pot_shopee:'', margin:'' };

export default function PricelistOnline() {
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [editKey, setEditKey]         = useState(null);
  const [editBuf, setEditBuf]         = useState({});
  const [saving, setSaving]           = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [addForm, setAddForm]         = useState(EMPTY_FORM);
  const [addError, setAddError]       = useState('');
  const [addLoading, setAddLoading]   = useState(false);
  const user = JSON.parse(localStorage.getItem('user')) || {};

  /* ── Fetch dari API ─────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/pricelist-online');
      setItems(res.data.data || []);
    } catch (err) {
      console.error('Gagal fetch pricelist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Edit helpers ─────────────────────────────── */
  const startEdit = (item) => {
    setEditKey(item.id);
    setEditBuf({ kode: item.kode, jenis: item.jenis, nama_produk: item.nama_produk, bahan: item.bahan, harga_jual: item.harga_jual, hpp: item.hpp, pot_shopee: item.pot_shopee, margin: item.margin });
  };
  const cancelEdit = () => { setEditKey(null); setEditBuf({}); };

  const saveEdit = async (item) => {
    setSaving(true);
    try {
      await api.put(`/pricelist-online/${item.id}`, {
        kode: editBuf.kode || item.kode,
        grup_produk: item.grup_produk,
        jenis: editBuf.jenis || item.jenis,
        nama_produk: editBuf.nama_produk || item.nama_produk,
        bahan: editBuf.bahan || item.bahan,
        harga_jual: Number(editBuf.harga_jual) || 0,
        hpp: Number(editBuf.hpp) || 0,
        pot_shopee: Number(editBuf.pot_shopee) || 0,
        margin: Number(editBuf.margin) || 0,
      });
      setEditKey(null);
      setEditBuf({});
      fetchData();
    } catch (err) {
      alert('Gagal update: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Hapus produk "${nama}"?`)) return;
    try {
      await api.delete(`/pricelist-online/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal hapus: ' + (err.response?.data?.message || err.message));
    }
  };

  /* ── Tambah Produk ──────────────────────────────── */
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    if (name === 'harga_jual') {
      const val = Number(value) || 0;
      setAddForm(p => ({
        ...p,
        harga_jual: value,
        hpp: Math.round(val * 0.7),
        pot_shopee: Math.round(val * 0.2),
        margin: Math.round(val * 0.1)
      }));
    } else {
      setAddForm(p => ({ ...p, [name]: value }));
    }
  };

  const handleAddSubmit = async () => {
    const { kode, jenis, nama_produk, harga_jual, hpp } = addForm;
    if (!kode.trim() || !jenis.trim() || !nama_produk.trim() || !harga_jual || !hpp) {
      setAddError('Kode, Jenis, Nama Produk, Harga Jual, dan HPP wajib diisi.');
      return;
    }
    setAddLoading(true);
    try {
      await api.post('/pricelist-online', {
        ...addForm,
        harga_jual: Number(addForm.harga_jual),
        hpp: Number(addForm.hpp),
        pot_shopee: Number(addForm.pot_shopee) || 0,
        margin: Number(addForm.margin) || 0,
      });
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
      setAddError('');
      fetchData();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Gagal menyimpan produk.');
    } finally {
      setAddLoading(false);
    }
  };

  /* ── Download PDF ──────────────────────────────── */
  const handleDownload = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(13);
    doc.text('JUKLAK HARGA UNIFORM', 14, 14);
    const rows = items.map(i => [i.kode, i.grup_produk, i.jenis, i.nama_produk, i.bahan, fmt(i.harga_jual), fmt(i.hpp), Number(i.pot_shopee).toLocaleString('id-ID'), fmt(i.margin), '10%']);
    autoTable(doc, {
      startY: 20,
      head: [['KODE','GRUP','JENIS','NAMA PRODUK','BAHAN','HARGA JUAL','HPP','POT.SHOPEE','MARGIN','PROFIT']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [153, 0, 0], fontSize: 7 },
      styles: { fontSize: 7 },
    });
    doc.save('Juklak_Harga_Uniform_Online.pdf');
  };

  /* ── Grouping & Filter ─────────────────────────── */
  const q = search.toLowerCase();
  const grouped = {};
  items.forEach(i => {
    if (q && !i.kode.toLowerCase().includes(q) && !i.nama_produk.toLowerCase().includes(q) && !i.jenis.toLowerCase().includes(q)) return;
    if (!grouped[i.grup_produk]) grouped[i.grup_produk] = [];
    grouped[i.grup_produk].push(i);
  });
  const groupKeys = Object.keys(grouped);

  /* ── Inline Input ───────────────────────────────── */
  const TxtInput = ({ field, cls = '' }) => (
    <input type="text" value={editBuf[field] || ''} onChange={e => setEditBuf(p => ({ ...p, [field]: e.target.value }))}
      className={`border border-[#990000] rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-red-200 ${cls}`} />
  );
  const NumInput = ({ field }) => (
    <input type="number" value={editBuf[field] ?? ''} 
      onChange={e => {
        const val = e.target.value;
        if (field === 'harga_jual') {
          const numVal = Number(val) || 0;
          setEditBuf(p => ({
            ...p,
            harga_jual: val,
            hpp: Math.round(numVal * 0.7),
            pot_shopee: Math.round(numVal * 0.2),
            margin: Math.round(numVal * 0.1)
          }));
        } else {
          setEditBuf(p => ({ ...p, [field]: val }));
        }
      }}
      className="w-28 border border-[#990000] rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-2 focus:ring-red-200" />
  );

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">

        {/* TOP BAR */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 mb-2">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Cari kode, jenis, atau nama produk..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all" />
          </div>
          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="relative">
              <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md border border-gray-100" onClick={() => setShowProfile(p => !p)}>
                <UserCircle size={32} className="text-gray-400 hover:text-[#990000] transition-colors" />
              </div>
              {showProfile && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 bg-red-50/50">
                    <p className="text-sm font-black text-gray-900">{user.nama || user.username || 'User'}</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(user.role || '').replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
          <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">

            {/* PAGE HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  <Tag className="text-[#990000]" size={24} />
                  Juklak Harga Uniform
                </h1>
                <p className="text-gray-400 text-xs mt-1">{items.length} produk terdaftar</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDownload} className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-700 transition-all shadow-sm text-sm">
                  <Upload size={16} /> Download PDF
                </button>
                <button onClick={() => { setAddForm(EMPTY_FORM); setAddError(''); setShowAdd(true); }} className="flex items-center gap-2 bg-[#990000] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-800 transition-all shadow-sm text-sm">
                  <Plus size={16} /> Tambah Produk
                </button>
              </div>
            </div>

            {/* LOADING */}
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
                <Loader2 size={28} className="animate-spin text-[#990000]" />
                <span className="font-semibold">Memuat data pricelist...</span>
              </div>
            ) : (
              <div className="space-y-8">
                {groupKeys.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 font-medium">Tidak ada data ditemukan.</div>
                ) : groupKeys.map(grup => (
                  <div key={grup} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-[#990000] px-4 py-2.5 flex items-center">
                      <span className="text-white font-black text-sm tracking-wide">{grup}</span>
                      <span className="ml-auto text-white/70 text-xs font-semibold">{grouped[grup].length} item</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse whitespace-nowrap">
                        <thead>
                          <tr className="bg-gray-900 text-white text-[11px] uppercase tracking-wider">
                            <th className="px-3 py-2.5 text-left border-r border-gray-700">KODE</th>
                            <th className="px-3 py-2.5 text-left border-r border-gray-700">JENIS</th>
                            <th className="px-3 py-2.5 text-left border-r border-gray-700">NAMA PRODUK</th>
                            <th className="px-3 py-2.5 text-left border-r border-gray-700">BAHAN</th>
                            <th className="px-3 py-2.5 text-right border-r border-gray-700">HARGA JUAL ONLINE</th>
                            <th className="px-3 py-2.5 text-right border-r border-gray-700">HPP ONLINE</th>
                            <th className="px-3 py-2.5 text-right border-r border-gray-700">POT. SHOPEE</th>
                            <th className="px-3 py-2.5 text-right border-r border-gray-700">MARGIN</th>
                            <th className="px-3 py-2.5 text-center border-r border-gray-700">PROFIT</th>
                            <th className="px-3 py-2.5 text-center">AKSI</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grouped[grup].map((item, idx) => {
                            const isEd = editKey === item.id;
                            return (
                              <tr key={item.id} className={`border-t border-gray-100 ${isEd ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} hover:bg-red-50/40 transition-colors`}>
                                <td className="px-3 py-2.5 font-bold text-[#990000] border-r border-gray-100">
                                  {isEd ? <TxtInput field="kode" cls="w-24 uppercase" /> : item.kode}
                                </td>
                                <td className="px-3 py-2.5 text-gray-600 border-r border-gray-100">
                                  {isEd ? <TxtInput field="jenis" cls="w-24 uppercase" /> : item.jenis}
                                </td>
                                <td className="px-3 py-2.5 font-medium text-gray-800 border-r border-gray-100">
                                  {isEd ? <TxtInput field="nama_produk" cls="w-56 uppercase" /> : item.nama_produk}
                                </td>
                                <td className="px-3 py-2.5 text-gray-500 border-r border-gray-100">
                                  {isEd ? <TxtInput field="bahan" cls="w-24 uppercase" /> : (item.bahan || '-')}
                                </td>
                                <td className="px-3 py-2.5 text-right font-bold text-gray-900 border-r border-gray-100">
                                  {isEd ? <NumInput field="harga_jual" /> : fmt(item.harga_jual)}
                                </td>
                                <td className="px-3 py-2.5 text-right text-gray-600 border-r border-gray-100">
                                  {isEd ? <NumInput field="hpp" /> : fmt(item.hpp)}
                                </td>
                                <td className="px-3 py-2.5 text-right text-gray-600 border-r border-gray-100">
                                  {isEd ? <NumInput field="pot_shopee" /> : Number(item.pot_shopee).toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-2.5 text-right text-gray-600 border-r border-gray-100">
                                  {isEd ? <NumInput field="margin" /> : fmt(item.margin)}
                                </td>
                                <td className="px-3 py-2.5 text-center border-r border-gray-100">
                                  <span className="bg-green-100 text-green-700 text-[11px] font-black px-2 py-0.5 rounded-full">10%</span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {isEd ? (
                                    <div className="flex justify-center gap-1.5">
                                      <button onClick={() => saveEdit(item)} disabled={saving} className="p-1.5 bg-[#990000] text-white rounded-lg hover:bg-red-800 transition-colors" title="Simpan">
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                      </button>
                                      <button onClick={cancelEdit} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors" title="Batal">
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center gap-1.5">
                                      <button onClick={() => startEdit(item)} className="p-1.5 text-[#990000] bg-red-50 hover:bg-[#990000] hover:text-white rounded-lg transition-colors" title="Edit">
                                        <Edit2 size={14} />
                                      </button>
                                      <button onClick={() => handleDelete(item.id, item.nama_produk)} className="p-1.5 text-gray-400 bg-gray-50 hover:bg-red-600 hover:text-white rounded-lg transition-colors" title="Hapus">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL TAMBAH PRODUK */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Plus className="text-[#990000]" size={20} /> Tambah Produk Baru
              </h2>
              <button onClick={() => setShowAdd(false)} className="p-2 text-gray-400 hover:text-[#990000] hover:bg-red-50 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {addError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-2.5 rounded-xl">{addError}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">KODE PRODUK <span className="text-red-500">*</span></label>
                  <input name="kode" value={addForm.kode} onChange={handleAddChange} placeholder="Contoh: HM018" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">GRUP PRODUK <span className="text-red-500">*</span></label>
                  <input 
                    name="grup_produk" 
                    value={addForm.grup_produk} 
                    onChange={handleAddChange} 
                    list="grup-opt" 
                    placeholder="PILIH ATAU KETIK GRUP PRODUK..." 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 uppercase" 
                  />
                  <datalist id="grup-opt">
                    {GRUP_OPTIONS.map(g => <option key={g} value={g} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">JENIS / KATEGORI <span className="text-red-500">*</span></label>
                  <input name="jenis" value={addForm.jenis} onChange={handleAddChange} list="jenis-opt" placeholder="PDH / PDL / WEARPACK..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 uppercase" />
                  <datalist id="jenis-opt">{['PDH','PDL','WEARPACK','CELANA','TOPI','APRON','KEMEJA','FULL SET'].map(v => <option key={v} value={v} />)}</datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">BAHAN</label>
                  <input name="bahan" value={addForm.bahan} onChange={handleAddChange} list="bahan-opt" placeholder="UNIONE / PIQUE..." className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 uppercase" />
                  <datalist id="bahan-opt">{['UNIONE','PIQUE','DRILL','KANVAS','OXFORD'].map(v => <option key={v} value={v} />)}</datalist>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">NAMA PRODUK <span className="text-red-500">*</span></label>
                  <input name="nama_produk" value={addForm.nama_produk} onChange={handleAddChange} placeholder="Contoh: FLP MERAH COWOK" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 uppercase" />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Informasi Harga</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[{name:'harga_jual',label:'HARGA JUAL ONLINE',req:true},{name:'hpp',label:'HPP ONLINE',req:true},{name:'pot_shopee',label:'POT. SHOPEE',req:false},{name:'margin',label:'MARGIN',req:false}].map(f => (
                    <div key={f.name}>
                      <label className="block text-xs font-bold text-gray-700 mb-1">{f.label}{f.req && <span className="text-red-500"> *</span>}</label>
                      <input type="number" name={f.name} value={addForm[f.name]} onChange={handleAddChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm">Batal</button>
              <button onClick={handleAddSubmit} disabled={addLoading} className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#990000] hover:bg-red-800 transition-colors text-sm flex items-center gap-2">
                {addLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Simpan Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
