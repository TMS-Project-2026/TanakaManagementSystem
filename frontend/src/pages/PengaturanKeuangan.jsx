import NotificationBell from '../components/NotificationBell';
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import {
  Landmark, Wallet, Calendar, Bell, Plus, Pencil, Trash2, X,
  Save, CheckCircle, Lock, Unlock, ToggleLeft, ToggleRight,
  AlertTriangle, Loader2, RefreshCw, Search, UserCircle
} from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const TABS = [
  { key: 'bank',    label: 'Rekening Bank',     icon: <Landmark size={16} /> },
  { key: 'petty',   label: 'Petty Cash',         icon: <Wallet size={16} /> },
  { key: 'periode', label: 'Periode Akuntansi',  icon: <Calendar size={16} /> },
  { key: 'notif',   label: 'Notifikasi',          icon: <Bell size={16} /> },
];

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
      <div className="px-6 py-4 bg-[#990000] flex justify-between items-center">
        <h3 className="font-black text-white text-base">{title}</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
      </div>
      {children}
    </div>
  </div>
);

// ── TAB REKENING BANK ──────────────────────────────────────────────────────
const TabBank = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nama_bank: '', no_rekening: '', atas_nama: '', cabang: 'Pusat', saldo_awal: '' });
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    try { setLoading(true); const r = await api.get('/pengaturan-keuangan/rekening'); setBanks(r.data); }
    catch { } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ nama_bank: '', no_rekening: '', atas_nama: '', cabang: 'Pusat', saldo_awal: '' }); setEditId(null); setModal(true); };
  const openEdit = (b) => { setForm({ nama_bank: b.nama_bank, no_rekening: b.no_rekening, atas_nama: b.atas_nama || '', cabang: b.cabang, saldo_awal: b.saldo_awal }); setEditId(b.id); setModal(true); };

  const handleSave = async () => {
    if (!form.nama_bank || !form.no_rekening) return alert('Nama bank dan nomor rekening wajib diisi.');
    try {
      if (editId) await api.put(`/pengaturan-keuangan/rekening/${editId}`, form);
      else await api.post('/pengaturan-keuangan/rekening', form);
      setModal(false); load();
    } catch (e) { alert('Gagal: ' + (e.response?.data?.message || e.message)); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/pengaturan-keuangan/rekening/${deleteId}`); setDeleteId(null); load(); }
    catch (e) { alert('Gagal hapus: ' + (e.response?.data?.message || e.message)); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-gray-500">Daftar rekening bank perusahaan yang digunakan untuk transaksi keuangan.</p>
        <button onClick={openAdd} className="inline-flex items-center gap-2 bg-[#990000] hover:bg-red-800 text-white px-4 py-2 rounded-xl font-bold text-sm shadow transition-all hover:scale-105">
          <Plus size={15} /> Tambah Rekening
        </button>
      </div>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#990000]" size={32} /></div> : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-[#990000] to-red-800 text-white">
              <tr>{['Nama Bank','No. Rekening','Atas Nama','Cabang','Saldo Awal','Aksi'].map(h => <th key={h} className="py-3 px-4 text-left font-semibold text-xs">{h}</th>)}</tr>
            </thead>
            <tbody>
              {banks.map((b, i) => (
                <tr key={b.id} className={`border-b border-gray-50 hover:bg-red-50/20 transition-colors ${i%2===0?'bg-white':'bg-gray-50/30'}`}>
                  <td className="py-3 px-4 font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Landmark size={14} className="text-blue-600" /></div>
                    {b.nama_bank}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-700">{b.no_rekening}</td>
                  <td className="py-3 px-4 text-gray-600">{b.atas_nama || '-'}</td>
                  <td className="py-3 px-4"><span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">{b.cabang}</span></td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">{fmt(b.saldo_awal)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(b)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(b.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {banks.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400 italic">Belum ada rekening bank.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={editId ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'} onClose={() => setModal(false)}>
          <div className="p-6 space-y-4">
            {[['Nama Bank','nama_bank','Contoh: BRI'],['No. Rekening','no_rekening','Nomor rekening...'],['Atas Nama','atas_nama','Nama pemilik rekening...']].map(([lbl,key,ph]) => (
              <div key={key}>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{lbl}</label>
                <input type="text" value={form[key]} onChange={e => setForm(p => ({...p,[key]:e.target.value}))} placeholder={ph} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cabang</label>
              <select value={form.cabang} onChange={e => setForm(p => ({...p,cabang:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                {[['Banua','PT Banua Mitra Lestari'],['Tanaka','PT Tanaka Rizqi Barokah'],['Pusat','Pusat'],['Banjarbaru','Banjarbaru']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Saldo Awal (Rp)</label>
              <input type="number" value={form.saldo_awal} onChange={e => setForm(p => ({...p,saldo_awal:+e.target.value}))} placeholder="0" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl">Batal</button>
              <button onClick={handleSave} className="px-6 py-2.5 text-sm font-bold text-white bg-[#990000] hover:bg-red-800 rounded-xl shadow flex items-center gap-2"><Save size={14} /> Simpan</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={28} className="text-red-600" /></div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Hapus Rekening?</h3>
            <p className="text-sm text-gray-500 mb-6">Data rekening ini akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-[#990000] text-white rounded-xl font-bold hover:bg-red-800">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── TAB PETTY CASH ─────────────────────────────────────────────────────────
const TabPettyCash = () => {
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ min_saldo: '', max_transaksi: '' });

  const load = useCallback(async () => {
    try { setLoading(true); const r = await api.get('/pengaturan-keuangan/petty-cash'); setLimits(r.data); }
    catch { } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const startEdit = (item) => { setEditId(item.id); setForm({ min_saldo: item.min_saldo, max_transaksi: item.max_transaksi }); };
  const saveEdit = async () => {
    try { await api.put(`/pengaturan-keuangan/petty-cash/${editId}`, form); setEditId(null); load(); alert('Setting petty cash berhasil disimpan.'); }
    catch (e) { alert('Gagal: ' + (e.response?.data?.message || e.message)); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#990000]" size={32} /></div>;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">Atur batas minimum saldo dan batas maksimal transaksi petty cash per cabang.</p>
      <div className="grid gap-4">
        {limits.map(item => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><Wallet size={18} className="text-amber-600" /></div>
                <div><h3 className="font-black text-gray-900">{item.cabang}</h3><p className="text-xs text-gray-400">Petty Cash Limit</p></div>
              </div>
              {editId === item.id ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-lg">Batal</button>
                  <button onClick={saveEdit} className="px-3 py-1.5 text-xs font-bold text-white bg-[#990000] rounded-lg flex items-center gap-1"><Save size={12} /> Simpan</button>
                </div>
              ) : (
                <button onClick={() => startEdit(item)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl"><Pencil size={14} /></button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[{label:'Batas Minimum Saldo',key:'min_saldo',color:'amber'},{label:'Batas Maksimal Transaksi',key:'max_transaksi',color:'blue'}].map(({label,key,color}) => (
                <div key={key} className={`bg-${color}-50 rounded-xl p-4 border border-${color}-100`}>
                  <p className={`text-xs font-bold text-${color}-600 uppercase tracking-wider mb-2`}>{label}</p>
                  {editId === item.id
                    ? <input type="number" value={form[key]} onChange={e => setForm(p => ({...p,[key]:+e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-[#990000]" />
                    : <p className={`text-lg font-black text-${color}-900`}>{fmt(item[key])}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
        {limits.length === 0 && <p className="text-center text-gray-400 italic py-10">Belum ada data petty cash.</p>}
      </div>
    </div>
  );
};

// ── TAB PERIODE AKUNTANSI ──────────────────────────────────────────────────
const TabPeriode = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const load = useCallback(async () => {
    try { setLoading(true); const r = await api.get(`/pengaturan-keuangan/periode?tahun=${tahun}`); setPeriods(r.data); }
    catch { } finally { setLoading(false); }
  }, [tahun]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (id, action, bulan) => {
    const newStatus = action === 'buka' ? 'Buka' : 'Tutup';
    try {
      await api.put(`/pengaturan-keuangan/periode/${id}/toggle`, { status: newStatus });
      setPeriods(p => p.map(per => per.id === id ? { ...per, status: newStatus } : per));
      setConfirm(null);
    } catch (e) { alert('Gagal: ' + (e.response?.data?.message || e.message)); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">Kelola status buka/tutup periode akuntansi bulanan.</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setTahun(t => t - 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><span className="text-sm font-bold">‹</span></button>
          <span className="text-base font-black text-gray-800 px-3">{tahun}</span>
          <button onClick={() => setTahun(t => t + 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><span className="text-sm font-bold">›</span></button>
          <button onClick={load} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={14} /></button>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#990000]" size={32} /></div> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {periods.map(per => {
            const isOpen = per.status === 'Buka';
            return (
              <div key={per.id} className={`rounded-2xl border p-4 transition-all ${isOpen ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-gray-800 text-lg">{per.nama_bulan?.substring(0,3)}</span>
                  {isOpen ? <CheckCircle size={18} className="text-emerald-600" /> : <Lock size={18} className="text-gray-400" />}
                </div>
                <span className={`block text-xs font-bold px-2.5 py-0.5 rounded-full w-fit mb-3 ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>{per.status}</span>
                <button onClick={() => setConfirm({ id: per.id, action: isOpen ? 'tutup' : 'buka', bulan: per.nama_bulan })}
                  className={`w-full py-1.5 text-xs font-bold rounded-lg transition-all ${isOpen ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                  {isOpen ? <span className="flex items-center justify-center gap-1"><Lock size={11} /> Tutup</span>
                           : <span className="flex items-center justify-center gap-1"><Unlock size={11} /> Buka</span>}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${confirm.action === 'buka' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {confirm.action === 'buka' ? <Unlock size={28} className="text-emerald-600" /> : <Lock size={28} className="text-red-600" />}
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">{confirm.action === 'buka' ? 'Buka' : 'Tutup'} Periode {confirm.bulan}?</h3>
            <p className="text-sm text-gray-500 mb-6">{confirm.action === 'buka' ? 'Transaksi akan kembali dapat dicatat pada periode ini.' : 'Tidak ada transaksi baru yang dapat dicatat setelah periode ditutup.'}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Batal</button>
              <button onClick={() => toggle(confirm.id, confirm.action, confirm.bulan)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-white ${confirm.action === 'buka' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#990000] hover:bg-red-800'}`}>
                Ya, {confirm.action === 'buka' ? 'Buka' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── TAB NOTIFIKASI ─────────────────────────────────────────────────────────
const TabNotifikasi = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const ICONS = {
    overdue: <AlertTriangle size={20} className="text-red-500" />,
    petty_cash_min: <Wallet size={20} className="text-amber-500" />,
    approval_pending: <Bell size={20} className="text-blue-500" />,
  };
  const BG = { overdue: 'bg-red-50', petty_cash_min: 'bg-amber-50', approval_pending: 'bg-blue-50' };

  const load = useCallback(async () => {
    try { setLoading(true); const r = await api.get('/pengaturan-keuangan/notifikasi'); setSettings(r.data); }
    catch { } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = (kode) => setSettings(p => p.map(s => s.kode === kode ? { ...s, aktif: s.aktif ? 0 : 1 } : s));

  const saveAll = async () => {
    try {
      setSaving(true);
      await api.post('/pengaturan-keuangan/notifikasi/save-all', { settings: settings.map(s => ({ kode: s.kode, aktif: s.aktif })) });
      alert('Pengaturan notifikasi berhasil disimpan!');
    } catch (e) { alert('Gagal: ' + (e.response?.data?.message || e.message)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#990000]" size={32} /></div>;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">Aktifkan atau nonaktifkan notifikasi sistem untuk berbagai kondisi keuangan.</p>
      <div className="space-y-4">
        {settings.map(({ kode, label, aktif }) => (
          <div key={kode} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 ${BG[kode] || 'bg-gray-50'} rounded-xl flex items-center justify-center shrink-0`}>{ICONS[kode] || <Bell size={20} />}</div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{aktif ? 'Aktif' : 'Nonaktif'}</p>
              </div>
            </div>
            <button onClick={() => toggle(kode)} className="shrink-0 transition-transform hover:scale-110">
              {aktif ? <ToggleRight size={40} className="text-emerald-500" /> : <ToggleLeft size={40} className="text-gray-300" />}
            </button>
          </div>
        ))}
        {settings.length === 0 && <p className="text-center text-gray-400 italic py-10">Tidak ada pengaturan notifikasi.</p>}
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 bg-[#990000] hover:bg-red-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow transition-all hover:scale-105 disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan Pengaturan
        </button>
      </div>
    </div>
  );
};

// ── MAIN ────────────────────────────────────────────────────────────────────
export default function PengaturanKeuangan() {
  const [activeTab, setActiveTab] = useState('bank');
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const TabContent = { bank: <TabBank />, petty: <TabPettyCash />, periode: <TabPeriode />, notif: <TabNotifikasi /> };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans relative">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR */}
        <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari pengaturan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                    <p className="text-sm font-black text-gray-900">Admin</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">Finance</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
          <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">Pengaturan Keuangan</h1>
              <p className="text-gray-500 font-medium mt-1 text-sm">Konfigurasi rekening bank, petty cash, periode akuntansi, dan notifikasi sistem.</p>
            </div>
            <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
              {TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 -mb-[1px] ${activeTab === tab.key ? 'border-[#990000] text-[#990000]' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1">
              {TabContent[activeTab]}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
