import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

export default function PelangganView() {
  const [pelanggan, setPelanggan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State form mencakup data tabel pelanggan & pelanggan_data
  const [formData, setFormData] = useState({
    pelanggan_nama: '',
    pelanggan_email: '',
    pelanggan_notelp: '',
    pelanggan_alamat: '',
    pelanggan_data_jenis: 'KTP', // Default enum
    pelanggan_data_file: null // Untuk menyimpan objek file
  });
  
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null); // Untuk mereset input file

  useEffect(() => {
    fetchPelanggan();
  }, []);

  const fetchPelanggan = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pelanggan');
      setPelanggan(response.data.data || response.data);
    } catch (error) {
      showMessage('error', 'Gagal memuat data pelanggan dari server.');
    } finally {
      setLoading(false);
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

  const handleFileChange = (e) => {
    setFormData({ ...formData, pelanggan_data_file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    // Karena ada file, kita WAJIB pakai FormData (multipart/form-data)
    const submitData = new FormData();
    submitData.append('pelanggan_nama', formData.pelanggan_nama);
    submitData.append('pelanggan_email', formData.pelanggan_email);
    submitData.append('pelanggan_notelp', formData.pelanggan_notelp);
    submitData.append('pelanggan_alamat', formData.pelanggan_alamat);
    submitData.append('pelanggan_data_jenis', formData.pelanggan_data_jenis);
    
    if (formData.pelanggan_data_file) {
      submitData.append('pelanggan_data_file', formData.pelanggan_data_file);
    }

    try {
      if (editId) {
        // Laravel butuh trick _method='PUT' kalau pakai FormData
        submitData.append('_method', 'PUT');
        await api.post(`/pelanggan/${editId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showMessage('success', 'Data pelanggan berhasil diperbarui!');
      } else {
        await api.post('/pelanggan', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showMessage('success', 'Pelanggan baru berhasil ditambahkan!');
      }
      
      handleCancelEdit();
      fetchPelanggan();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.pelanggan_id);
    setFormData({
      pelanggan_nama: item.pelanggan_nama,
      pelanggan_email: item.pelanggan_email,
      pelanggan_notelp: item.pelanggan_notelp,
      pelanggan_alamat: item.pelanggan_alamat,
      // Jika relasi pelanggan_data dikirim dari backend, sesuaikan ini:
      pelanggan_data_jenis: item.pelanggan_data?.pelanggan_data_jenis || 'KTP',
      pelanggan_data_file: null // Kosongkan file saat edit, agar tidak tertimpa jika tidak diubah
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData({
      pelanggan_nama: '',
      pelanggan_email: '',
      pelanggan_notelp: '',
      pelanggan_alamat: '',
      pelanggan_data_jenis: 'KTP',
      pelanggan_data_file: null
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus data pelanggan ini? Data transaksi terkait mungkin akan hilang.')) {
      try {
        await api.delete(`/pelanggan/${id}`);
        showMessage('success', 'Data pelanggan berhasil dihapus!');
        fetchPelanggan();
      } catch (error) {
        showMessage('error', 'Gagal menghapus data pelanggan.');
      }
    }
  };

  const filteredPelanggan = pelanggan.filter((item) =>
    item.pelanggan_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.pelanggan_email.toLowerCase().includes(searchTerm.toLowerCase())
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

        .crud-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group.full-width { grid-column: 1 / -1; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: #333; }
        
        .form-input { padding: 0.6rem 1rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; outline: none; transition: border-color 0.2s; font-family: inherit; }
        .form-input:focus { border-color: #D84040; }
        .form-input[type="file"] { padding: 0.4rem 1rem; }
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

        .contact-info { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.85rem; }
        .badge-id { display: inline-block; padding: 0.2rem 0.5rem; background-color: #eee; border-radius: 4px; font-size: 0.75rem; font-weight: bold; color: #555;}
        
        .loading-text { text-align: center; padding: 2rem; color: #666; }
        .empty-text { text-align: center; padding: 1.5rem; color: #888; font-style: italic; }
      `}</style>

      {message.text && (
        <div className={`alert-msg ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      <div className="form-card">
        <h3>{editId ? 'Edit Data Pelanggan' : 'Registrasi Pelanggan Baru'}</h3>
        <form className="crud-form" onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input type="text" name="pelanggan_nama" className="form-input" value={formData.pelanggan_nama} onChange={handleInputChange} required placeholder="Nama sesuai identitas" />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="pelanggan_email" className="form-input" value={formData.pelanggan_email} onChange={handleInputChange} required placeholder="email@contoh.com" />
          </div>

          <div className="form-group">
            <label>No. Telepon / WhatsApp</label>
            <input type="tel" name="pelanggan_notelp" className="form-input" value={formData.pelanggan_notelp} onChange={handleInputChange} required placeholder="08xxxxxxxxxx" maxLength="13" />
          </div>

          <div className="form-group">
            <label>Jenis Identitas</label>
            <select name="pelanggan_data_jenis" className="form-input" value={formData.pelanggan_data_jenis} onChange={handleInputChange} required>
              <option value="KTP">KTP</option>
              <option value="SIM">SIM</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label>Alamat Lengkap</label>
            <textarea name="pelanggan_alamat" className="form-input" value={formData.pelanggan_alamat} onChange={handleInputChange} required placeholder="Nama jalan, RT/RW, kelurahan..." />
          </div>

          <div className="form-group full-width">
            <label>Unggah Foto Identitas {editId && '(Kosongkan jika tidak ingin mengubah)'}</label>
            <input 
              type="file" 
              className="form-input" 
              onChange={handleFileChange} 
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              required={!editId} // Wajib isi jika tambah baru, opsional saat edit
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-action btn-submit" disabled={formLoading}>
              {formLoading ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Registrasi Pelanggan')}
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
          <h3>Daftar Pelanggan</h3>
          <input type="text" className="search-input" placeholder="Cari nama atau email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        {loading ? (
          <div className="loading-text">Memuat data...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th width="5%">No</th>
                  <th width="20%">Nama Pelanggan</th>
                  <th width="25%">Kontak</th>
                  <th width="30%">Alamat</th>
                  <th width="10%">ID</th>
                  <th width="10%">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPelanggan.length > 0 ? (
                  filteredPelanggan.map((item, index) => (
                    <tr key={item.pelanggan_id}>
                      <td>{index + 1}</td>
                      <td><strong>{item.pelanggan_nama}</strong></td>
                      <td>
                        <div className="contact-info">
                          <span>📞 {item.pelanggan_notelp}</span>
                          <span>✉️ {item.pelanggan_email}</span>
                        </div>
                      </td>
                      <td>{item.pelanggan_alamat}</td>
                      <td>
                         {/* Menampilkan jenis KTP/SIM dari relasi (jika ada) */}
                         <span className="badge-id">
                           {item.pelanggan_data?.pelanggan_data_jenis || 'N/A'}
                         </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-sm btn-edit" onClick={() => handleEditClick(item)}>Edit</button>
                          <button className="btn-sm btn-delete" onClick={() => handleDelete(item.pelanggan_id)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-text">
                      {searchTerm ? 'Data pelanggan tidak ditemukan.' : 'Belum ada data pelanggan.'}
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