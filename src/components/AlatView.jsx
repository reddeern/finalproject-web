import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function AlatView() {
  const [alat, setAlat] = useState([]);
  const [kategoriList, setKategoriList] = useState([]); // Untuk menyimpan opsi dropdown kategori
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State form disesuaikan dengan kolom di ERD
  const [formData, setFormData] = useState({
    alat_kategori_id: '',
    alat_nama: '',
    alat_deskripsi: '',
    alat_hargaperhari: '',
    alat_stok: ''
  });
  
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAlat();
    fetchKategori(); // Panggil data kategori untuk dropdown
  }, []);

  const fetchAlat = async () => {
    setLoading(true);
    try {
      const response = await api.get('/alat');
      setAlat(response.data.data || response.data);
    } catch (error) {
      showMessage('error', 'Gagal memuat data alat dari server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchKategori = async () => {
    try {
      const response = await api.get('/kategori');
      setKategoriList(response.data.data || response.data);
    } catch (error) {
      console.error("Gagal memuat kategori untuk dropdown", error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      if (editId) {
        await api.put(`/alat/${editId}`, formData);
        showMessage('success', 'Data alat berhasil diperbarui!');
      } else {
        await api.post('/alat', formData);
        showMessage('success', 'Alat baru berhasil ditambahkan!');
      }
      
      handleCancelEdit();
      fetchAlat();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.alat_id);
    setFormData({
      alat_kategori_id: item.alat_kategori_id,
      alat_nama: item.alat_nama,
      alat_deskripsi: item.alat_deskripsi,
      alat_hargaperhari: item.alat_hargaperhari,
      alat_stok: item.alat_stok
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData({
      alat_kategori_id: '',
      alat_nama: '',
      alat_deskripsi: '',
      alat_hargaperhari: '',
      alat_stok: ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus alat ini?')) {
      try {
        await api.delete(`/alat/${id}`);
        showMessage('success', 'Alat berhasil dihapus!');
        fetchAlat();
      } catch (error) {
        showMessage('error', 'Gagal menghapus data alat.');
      }
    }
  };

  // Helper untuk mencari nama kategori berdasarkan ID (jika API backend tidak mengirimkan relasi object)
  const getKategoriNama = (id) => {
    const kat = kategoriList.find(k => k.kategori_id === id);
    return kat ? kat.kategori_nama : 'Tidak diketahui';
  };

  // Format Rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const filteredAlat = alat.filter((item) =>
    item.alat_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getKategoriNama(item.alat_kategori_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <style>{`
        .view-container { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-card, .table-card { background-color: #FFFFFF; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .form-card h3 { margin-bottom: 1rem; color: #1D1616; border-bottom: 2px solid #EEEEEE; padding-bottom: 0.5rem; }
        
        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 2px solid #EEEEEE; padding-bottom: 0.5rem; }
        .table-header h3 { margin: 0; color: #1D1616; }
        .search-input { width: 250px; padding: 0.5rem 0.8rem; font-size: 0.9rem; border: 1px solid #ccc; border-radius: 4px; outline: none; }
        .search-input:focus { border-color: #D84040; }

        .alert-msg { padding: 0.8rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.9rem; }
        .alert-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

        /* Form diubah menjadi Grid agar rapi */
        .crud-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group.full-width { grid-column: 1 / -1; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: #333; }
        
        .form-input { padding: 0.6rem 1rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; outline: none; transition: border-color 0.2s; font-family: inherit; }
        .form-input:focus { border-color: #D84040; }
        textarea.form-input { resize: vertical; min-height: 80px; }

        .form-actions { grid-column: 1 / -1; display: flex; gap: 1rem; margin-top: 0.5rem; }
        .btn-action { padding: 0.6rem 1.5rem; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; color: #fff; transition: opacity 0.2s; }
        .btn-action:hover { opacity: 0.9; }
        .btn-submit { background-color: #1D1616; }
        .btn-cancel { background-color: #888; }
        
        .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .data-table th, .data-table td { padding: 0.8rem 1rem; text-align: left; border-bottom: 1px solid #eee; font-size: 0.95rem; }
        .data-table th { background-color: #f9f9f9; font-weight: 600; color: #333; }
        .data-table tr:hover { background-color: #fcfcfc; }
        
        .action-buttons { display: flex; gap: 0.5rem; }
        .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 4px; border: none; cursor: pointer; color: #fff; }
        .btn-edit { background-color: #D84040; }
        .btn-delete { background-color: #8E1616; }

        .loading-text { text-align: center; padding: 2rem; color: #666; }
        .empty-text { text-align: center; padding: 1.5rem; color: #888; font-style: italic; }
      `}</style>

      {message.text && (
        <div className={`alert-msg ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      <div className="form-card">
        <h3>{editId ? 'Edit Data Alat' : 'Tambah Alat Baru'}</h3>
        <form className="crud-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nama Alat</label>
            <input type="text" name="alat_nama" className="form-input" value={formData.alat_nama} onChange={handleInputChange} required placeholder="Contoh: Sony A7III" />
          </div>

          <div className="form-group">
            <label>Kategori</label>
            <select name="alat_kategori_id" className="form-input" value={formData.alat_kategori_id} onChange={handleInputChange} required>
              <option value="">-- Pilih Kategori --</option>
              {kategoriList.map(kat => (
                <option key={kat.kategori_id} value={kat.kategori_id}>{kat.kategori_nama}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Harga Sewa / Hari (Rp)</label>
            <input type="number" name="alat_hargaperhari" className="form-input" value={formData.alat_hargaperhari} onChange={handleInputChange} required placeholder="Contoh: 150000" min="0" />
          </div>

          <div className="form-group">
            <label>Stok Tersedia</label>
            <input type="number" name="alat_stok" className="form-input" value={formData.alat_stok} onChange={handleInputChange} required placeholder="Contoh: 5" min="0" />
          </div>

          <div className="form-group full-width">
            <label>Deskripsi</label>
            <textarea name="alat_deskripsi" className="form-input" value={formData.alat_deskripsi} onChange={handleInputChange} required placeholder="Masukkan spesifikasi atau deskripsi singkat..." />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-action btn-submit" disabled={formLoading}>
              {formLoading ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Tambah Data')}
            </button>
            {editId && (
              <button type="button" className="btn-action btn-cancel" onClick={handleCancelEdit}>
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>Daftar Alat Elektronik</h3>
          <input type="text" className="search-input" placeholder="Cari nama alat / kategori..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        {loading ? (
          <div className="loading-text">Memuat data...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th width="5%">No</th>
                  <th width="20%">Nama Alat</th>
                  <th width="15%">Kategori</th>
                  <th width="20%">Harga/Hari</th>
                  <th width="10%">Stok</th>
                  <th width="15%">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlat.length > 0 ? (
                  filteredAlat.map((item, index) => (
                    <tr key={item.alat_id}>
                      <td>{index + 1}</td>
                      <td><strong>{item.alat_nama}</strong></td>
                      <td>{getKategoriNama(item.alat_kategori_id)}</td>
                      <td>{formatRupiah(item.alat_hargaperhari)}</td>
                      <td>{item.alat_stok} unit</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-sm btn-edit" onClick={() => handleEditClick(item)}>Edit</button>
                          <button className="btn-sm btn-delete" onClick={() => handleDelete(item.alat_id)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-text">
                      {searchTerm ? 'Data alat tidak ditemukan.' : 'Belum ada data alat.'}
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