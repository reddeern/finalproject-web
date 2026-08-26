import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function PenyewaanView() {
  const [penyewaan, setPenyewaan] = useState([]);
  const [pelangganList, setPelangganList] = useState([]);
  const [alatList, setAlatList] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // State untuk form utama (Master)
  const [formData, setFormData] = useState({
    penyewaan_pelanggan_id: '',
    penyewaan_tglsewa: '',
    penyewaan_tglkembali: '',
    penyewaan_sttspembayaran: 'Belum Dibayar',
    penyewaan_sttskembali: 'Belum Kembali'
  });

  // State untuk item yang disewa (Detail / Cart)
  const [cart, setCart] = useState([]);
  const [selectedAlat, setSelectedAlat] = useState('');
  const [jumlahAlat, setJumlahAlat] = useState(1);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSewa, resPelanggan, resAlat] = await Promise.all([
        api.get('/penyewaan'),
        api.get('/pelanggan'),
        api.get('/alat')
      ]);
      setPenyewaan(resSewa.data.data || resSewa.data);
      setPelangganList(resPelanggan.data.data || resPelanggan.data);
      setAlatList(resAlat.data.data || resAlat.data);
    } catch (error) {
      showMessage('error', 'Gagal memuat data dari server.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // --- LOGIKA PERHITUNGAN DURASI & HARGA ---
  const getDurasiHari = () => {
    if (!formData.penyewaan_tglsewa || !formData.penyewaan_tglkembali) return 0;
    const start = new Date(formData.penyewaan_tglsewa);
    const end = new Date(formData.penyewaan_tglkembali);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays; // Minimal sewa 1 hari
  };

  const hitungTotalHarga = () => {
    const durasi = getDurasiHari();
    return cart.reduce((total, item) => total + (item.subharga * durasi), 0);
  };

  // --- LOGIKA KERANJANG (CART) ---
  const addToCart = () => {
    if (!selectedAlat || jumlahAlat < 1) return;
    if (!formData.penyewaan_tglsewa || !formData.penyewaan_tglkembali) {
      showMessage('error', 'Isi tanggal sewa dan kembali terlebih dahulu untuk menghitung harga!');
      return;
    }

    const alat = alatList.find(a => a.alat_id.toString() === selectedAlat);
    if (!alat) return;

    if (jumlahAlat > alat.alat_stok) {
      showMessage('error', `Stok ${alat.alat_nama} tidak mencukupi (Sisa: ${alat.alat_stok})`);
      return;
    }

    // Cek apakah alat sudah ada di keranjang
    const existingItem = cart.find(c => c.alat_id === alat.alat_id);
    if (existingItem) {
      showMessage('error', 'Alat ini sudah ada di daftar sewa.');
      return;
    }

    const newItem = {
      alat_id: alat.alat_id,
      alat_nama: alat.alat_nama,
      harga_perhari: alat.alat_hargaperhari,
      jumlah: parseInt(jumlahAlat),
      subharga: alat.alat_hargaperhari * parseInt(jumlahAlat) // subharga per hari
    };

    setCart([...cart, newItem]);
    setSelectedAlat('');
    setJumlahAlat(1);
  };

  const removeFromCart = (alat_id) => {
    setCart(cart.filter(c => c.alat_id !== alat_id));
  };

  // --- SUBMIT FORM ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showMessage('error', 'Pilih minimal satu alat untuk disewa!');
      return;
    }

    setFormLoading(true);
    
    // Gabungkan data master dan detail
    const payload = {
      ...formData,
      penyewaan_totalharga: hitungTotalHarga(),
      detail: cart.map(item => ({
        penyewaan_detail_alat_id: item.alat_id,
        penyewaan_detail_jumlah: item.jumlah,
        penyewaan_detail_subharga: item.subharga * getDurasiHari()
      }))
    };

    try {
      if (editId) {
        await api.put(`/penyewaan/${editId}`, payload);
        showMessage('success', 'Transaksi sewa berhasil diperbarui!');
      } else {
        await api.post('/penyewaan', payload);
        showMessage('success', 'Transaksi sewa baru berhasil dibuat!');
      }
      handleCancelEdit();
      fetchData();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Gagal menyimpan transaksi.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.penyewaan_id);
    setFormData({
      penyewaan_pelanggan_id: item.penyewaan_pelanggan_id,
      penyewaan_tglsewa: item.penyewaan_tglsewa,
      penyewaan_tglkembali: item.penyewaan_tglkembali,
      penyewaan_sttspembayaran: item.penyewaan_sttspembayaran,
      penyewaan_sttskembali: item.penyewaan_sttskembali
    });
    
    // Populasikan cart jika backend mengirimkan relasi penyewaan_detail
    if (item.penyewaan_detail && item.penyewaan_detail.length > 0) {
      const existingCart = item.penyewaan_detail.map(det => {
        const alat = alatList.find(a => a.alat_id === det.penyewaan_detail_alat_id);
        const durasi = Math.max(1, Math.ceil(Math.abs(new Date(item.penyewaan_tglkembali) - new Date(item.penyewaan_tglsewa)) / (1000 * 60 * 60 * 24)));
        return {
          alat_id: det.penyewaan_detail_alat_id,
          alat_nama: alat ? alat.alat_nama : 'Alat tidak ditemukan',
          harga_perhari: det.penyewaan_detail_subharga / det.penyewaan_detail_jumlah / durasi,
          jumlah: det.penyewaan_detail_jumlah,
          subharga: det.penyewaan_detail_subharga / durasi
        };
      });
      setCart(existingCart);
    } else {
      setCart([]);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData({
      penyewaan_pelanggan_id: '',
      penyewaan_tglsewa: '',
      penyewaan_tglkembali: '',
      penyewaan_sttspembayaran: 'Belum Dibayar',
      penyewaan_sttskembali: 'Belum Kembali'
    });
    setCart([]);
    setSelectedAlat('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin membatalkan/menghapus transaksi sewa ini?')) {
      try {
        await api.delete(`/penyewaan/${id}`);
        showMessage('success', 'Transaksi berhasil dihapus!');
        fetchData();
      } catch (error) {
        showMessage('error', 'Gagal menghapus transaksi.');
      }
    }
  };

  // Helper untuk mendapatkan nama pelanggan
  const getPelangganNama = (id) => {
    const p = pelangganList.find(x => x.pelanggan_id === id);
    return p ? p.pelanggan_nama : 'Unknown';
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  const filteredPenyewaan = penyewaan.filter((item) =>
    getPelangganNama(item.penyewaan_pelanggan_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <style>{`
        .view-container { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-card, .table-card { background-color: #FFFFFF; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .form-card h3 { margin-bottom: 1rem; color: #1D1616; border-bottom: 2px solid #EEEEEE; padding-bottom: 0.5rem; }
        
        .section-title { font-size: 1rem; color: #D84040; font-weight: 600; margin: 1.5rem 0 0.5rem; border-bottom: 1px dashed #ccc; padding-bottom: 0.3rem;}
        
        .crud-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group.full-width { grid-column: 1 / -1; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: #333; }
        .form-input { padding: 0.6rem 1rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; outline: none; transition: border-color 0.2s; }
        .form-input:focus { border-color: #D84040; }
        
        .cart-input-area { display: flex; gap: 0.5rem; align-items: flex-end; }
        .cart-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.9rem; }
        .cart-table th, .cart-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #eee; }
        .cart-table th { background-color: #f9f9f9; }
        
        .total-box { margin-top: 1rem; padding: 1rem; background-color: #1D1616; color: #EEEEEE; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 1.2rem; font-weight: bold; }
        
        .btn-action { padding: 0.6rem 1.5rem; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; color: #fff; transition: opacity 0.2s; }
        .btn-action:hover { opacity: 0.9; }
        .btn-submit { background-color: #D84040; font-size: 1.1rem; padding: 0.8rem; width: 100%; margin-top: 1rem;}
        .btn-cancel { background-color: #888; width: 100%; margin-top: 0.5rem; }
        .btn-add-cart { background-color: #1D1616; color: #fff; padding: 0.6rem 1rem; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap; }

        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 2px solid #EEEEEE; padding-bottom: 0.5rem; }
        .search-input { width: 250px; padding: 0.5rem 0.8rem; font-size: 0.9rem; border: 1px solid #ccc; border-radius: 4px; outline: none; }
        
        .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9rem;}
        .data-table th, .data-table td { padding: 0.8rem 1rem; text-align: left; border-bottom: 1px solid #eee; }
        .data-table th { background-color: #f9f9f9; font-weight: 600; color: #333; }
        
        .badge { padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; display: inline-block; }
        .badge-lunas { background-color: #d4edda; color: #155724; }
        .badge-dp { background-color: #fff3cd; color: #856404; }
        .badge-belum { background-color: #f8d7da; color: #721c24; }
        
        .action-buttons { display: flex; gap: 0.5rem; }
        .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 4px; border: none; cursor: pointer; color: #fff; }
        .btn-edit { background-color: #D84040; }
        .btn-delete { background-color: #8E1616; }

        .alert-msg { padding: 0.8rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.9rem; }
        .alert-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
      `}</style>

      {message.text && (
        <div className={`alert-msg ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      {/* --- FORM MASTER DETAIL --- */}
      <div className="form-card">
        <h3>{editId ? 'Edit Transaksi Sewa' : 'Buat Transaksi Sewa Baru'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="crud-form">
            {/* Bagian Master (Data Utama) */}
            <div className="form-group full-width">
              <label>Pilih Pelanggan</label>
              <select name="penyewaan_pelanggan_id" className="form-input" value={formData.penyewaan_pelanggan_id} onChange={handleInputChange} required>
                <option value="">-- Cari / Pilih Pelanggan --</option>
                {pelangganList.map(p => (
                  <option key={p.pelanggan_id} value={p.pelanggan_id}>{p.pelanggan_nama} - {p.pelanggan_notelp}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tanggal Sewa</label>
              <input type="date" name="penyewaan_tglsewa" className="form-input" value={formData.penyewaan_tglsewa} onChange={handleInputChange} required />
            </div>

            <div className="form-group">
              <label>Tanggal Kembali</label>
              <input type="date" name="penyewaan_tglkembali" className="form-input" value={formData.penyewaan_tglkembali} onChange={handleInputChange} required min={formData.penyewaan_tglsewa} />
            </div>

            <div className="form-group">
              <label>Status Pembayaran</label>
              <select name="penyewaan_sttspembayaran" className="form-input" value={formData.penyewaan_sttspembayaran} onChange={handleInputChange}>
                <option value="Belum Dibayar">Belum Dibayar</option>
                <option value="DP">DP (Uang Muka)</option>
                <option value="Lunas">Lunas</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status Alat</label>
              <select name="penyewaan_sttskembali" className="form-input" value={formData.penyewaan_sttskembali} onChange={handleInputChange}>
                <option value="Belum Kembali">Belum Kembali (Sedang Disewa)</option>
                <option value="Sudah Kembali">Sudah Dikembalikan</option>
              </select>
            </div>

            {/* Bagian Detail (Keranjang Sewa) */}
            <div className="form-group full-width">
              <div className="section-title">Pilih Alat Elektronik yang Disewa</div>
              <div className="cart-input-area">
                <div style={{ flex: 2 }}>
                  <select className="form-input" style={{ width: '100%' }} value={selectedAlat} onChange={(e) => setSelectedAlat(e.target.value)}>
                    <option value="">-- Pilih Alat --</option>
                    {alatList.map(a => (
                      <option key={a.alat_id} value={a.alat_id}>{a.alat_nama} (Stok: {a.alat_stok}) - {formatRupiah(a.alat_hargaperhari)}/hari</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <input type="number" className="form-input" style={{ width: '100%' }} placeholder="Qty" min="1" value={jumlahAlat} onChange={(e) => setJumlahAlat(e.target.value)} />
                </div>
                <button type="button" className="btn-add-cart" onClick={addToCart}>+ Tambah Alat</button>
              </div>

              {cart.length > 0 && (
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Nama Alat</th>
                      <th>Harga/Hari</th>
                      <th>Qty</th>
                      <th>Subtotal/Hari</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((c, i) => (
                      <tr key={i}>
                        <td>{c.alat_nama}</td>
                        <td>{formatRupiah(c.harga_perhari)}</td>
                        <td>{c.jumlah}</td>
                        <td>{formatRupiah(c.subharga)}</td>
                        <td>
                          <button type="button" onClick={() => removeFromCart(c.alat_id)} style={{ color: 'red', cursor: 'pointer', border: 'none', background: 'none', fontWeight: 'bold' }}>X</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Total Section */}
            <div className="form-group full-width">
              <div className="total-box">
                <span>Durasi: {getDurasiHari()} Hari</span>
                <span>TOTAL: {formatRupiah(hitungTotalHarga())}</span>
              </div>
              
              <button type="submit" className="btn-action btn-submit" disabled={formLoading}>
                {formLoading ? 'Memproses Transaksi...' : (editId ? 'Simpan Perubahan Transaksi' : 'Konfirmasi & Simpan Transaksi')}
              </button>
              {editId && (
                <button type="button" className="btn-action btn-cancel" onClick={handleCancelEdit}>Batal Edit</button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* --- TABEL DATA --- */}
      <div className="table-card">
        <div className="table-header">
          <h3>Daftar Transaksi Sewa</h3>
          <input type="text" className="search-input" placeholder="Cari nama pelanggan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Memuat data transaksi...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Pelanggan</th>
                  <th>Tanggal</th>
                  <th>Total Harga</th>
                  <th>Pembayaran</th>
                  <th>Status Alat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPenyewaan.length > 0 ? (
                  filteredPenyewaan.map((item) => (
                    <tr key={item.penyewaan_id}>
                      <td>#{item.penyewaan_id}</td>
                      <td><strong>{getPelangganNama(item.penyewaan_pelanggan_id)}</strong></td>
                      <td>
                        {item.penyewaan_tglsewa} <br/> s/d <br/> {item.penyewaan_tglkembali}
                      </td>
                      <td>{formatRupiah(item.penyewaan_totalharga)}</td>
                      <td>
                        <span className={`badge ${
                          item.penyewaan_sttspembayaran === 'Lunas' ? 'badge-lunas' : 
                          item.penyewaan_sttspembayaran === 'DP' ? 'badge-dp' : 'badge-belum'
                        }`}>
                          {item.penyewaan_sttspembayaran}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${item.penyewaan_sttskembali === 'Sudah Kembali' ? 'badge-lunas' : 'badge-belum'}`}>
                          {item.penyewaan_sttskembali}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-sm btn-edit" onClick={() => handleEditClick(item)}>Edit / Status</button>
                          <button className="btn-sm btn-delete" onClick={() => handleDelete(item.penyewaan_id)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: '#888' }}>
                      Belum ada transaksi penyewaan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}