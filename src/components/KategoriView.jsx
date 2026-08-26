import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function KategoriView() {
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // State pencarian
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk form
  const [formData, setFormData] = useState({ kategori_nama: '' });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchKategori();
  }, []);

  const fetchKategori = async () => {
    setLoading(true);
    try {
      const response = await api.get('/kategori'); 
      setKategori(response.data.data || response.data); 
    } catch (error) {
      console.error("Gagal mengambil data kategori", error);
      showMessage('error', 'Gagal memuat data kategori dari server.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, kategori_nama: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      if (editId) {
        await api.put(`/kategori/${editId}`, formData);
        showMessage('success', 'Kategori berhasil diperbarui!');
      } else {
        await api.post('/kategori', formData);
        showMessage('success', 'Kategori baru berhasil ditambahkan!');
      }
      
      setFormData({ kategori_nama: '' });
      setEditId(null);
      fetchKategori();
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.kategori_id);
    setFormData({ kategori_nama: item.kategori_nama });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData({ kategori_nama: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus kategori ini? Data alat yang terkait mungkin akan terpengaruh.')) {
      try {
        await api.delete(`/kategori/${id}`);
        showMessage('success', 'Kategori berhasil dihapus!');
        fetchKategori();
      } catch (error) {
        showMessage('error', 'Gagal menghapus kategori. Pastikan tidak ada alat yang masih memakai kategori ini.');
      }
    }
  };

  // LOGIKA FILTER PENCARIAN
  const filteredKategori = kategori.filter((item) =>
    item.kategori_nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <style>{`
        .view-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .form-card, .table-card {
          background-color: #FFFFFF;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .form-card h3 {
          margin-bottom: 1rem;
          color: #1D1616;
          border-bottom: 2px solid #EEEEEE;
          padding-bottom: 0.5rem;
        }

        /* Styling baru untuk header tabel agar sejajar dengan input search */
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 2px solid #EEEEEE;
          padding-bottom: 0.5rem;
        }

        .table-header h3 {
          margin: 0;
          color: #1D1616;
        }

        .search-input {
          width: 250px;
          padding: 0.5rem 0.8rem;
          font-size: 0.9rem;
        }

        .alert-msg {
          padding: 0.8rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .alert-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

        .crud-form { display: flex; gap: 1rem; align-items: flex-end; }
        .form-group-inline { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group-inline label { font-size: 0.85rem; font-weight: 600; color: #333; }
        
        .form-input {
          padding: 0.6rem 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus { border-color: #D84040; }

        .btn-action {
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          color: #fff;
          transition: opacity 0.2s;
          height: fit-content;
        }
        .btn-action:hover { opacity: 0.9; }
        .btn-submit { background-color: #1D1616; }
        .btn-cancel { background-color: #888; }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        .data-table th, .data-table td {
          padding: 0.8rem 1rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .data-table th {
          background-color: #f9f9f9;
          font-weight: 600;
          color: #333;
        }
        .data-table tr:hover { background-color: #fcfcfc; }
        
        .action-buttons { display: flex; gap: 0.5rem; }
        .btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.8rem;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          color: #fff;
        }
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
        <h3>{editId ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
        <form className="crud-form" onSubmit={handleSubmit}>
          <div className="form-group-inline">
            <label>Nama Kategori</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Kamera, Lensa, Lighting..."
              value={formData.kategori_nama}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="btn-action btn-submit" disabled={formLoading}>
            {formLoading ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Tambah Data')}
          </button>
          
          {editId && (
            <button type="button" className="btn-action btn-cancel" onClick={handleCancelEdit}>
              Batal
            </button>
          )}
        </form>
      </div>

      <div className="table-card">
        {/* Header tabel yang baru, di dalamnya ada input pencarian */}
        <div className="table-header">
          <h3>Daftar Kategori</h3>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Cari kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="loading-text">Memuat data...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th width="10%">No</th>
                  <th width="70%">Nama Kategori</th>
                  <th width="20%">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {/* Gunakan filteredKategori di sini, bukan kategori */}
                {filteredKategori.length > 0 ? (
                  filteredKategori.map((item, index) => (
                    <tr key={item.kategori_id}>
                      <td>{index + 1}</td>
                      <td>{item.kategori_nama}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-sm btn-edit"
                            onClick={() => handleEditClick(item)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn-sm btn-delete"
                            onClick={() => handleDelete(item.kategori_id)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="empty-text">
                      {searchTerm ? 'Kategori tidak ditemukan.' : 'Belum ada data kategori.'}
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