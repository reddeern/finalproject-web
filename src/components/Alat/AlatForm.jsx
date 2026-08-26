import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function AlatForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    alat_kategori_id: '',
    alat_nama: '',
    alat_deskripsi: '',
    alat_hargaperhari: '',
    alat_stok: ''
  });
  
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchKategori();
    if (isEdit) {
      fetchAlat();
    }
  }, [id]);

  const fetchKategori = async () => {
    try {
      const response = await api.get('/kategori');
      setKategoriList(response.data.data || response.data);
    } catch (error) {
      console.error("Gagal memuat kategori", error);
    }
  };

  const fetchAlat = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/alat/${id}`);
      const data = response.data.data || response.data;
      setFormData({
        alat_kategori_id: data.alat_kategori_id,
        alat_nama: data.alat_nama,
        alat_deskripsi: data.alat_deskripsi,
        alat_hargaperhari: data.alat_hargaperhari,
        alat_stok: data.alat_stok
      });
    } catch (error) {
      showMessage('error', 'Gagal memuat data alat');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isEdit) {
        await api.put(`/alat/${id}`, formData);
        showMessage('success', 'Alat berhasil diperbarui!');
      } else {
        await api.post('/alat', formData);
        showMessage('success', 'Alat baru berhasil ditambahkan!');
      }
      
      setTimeout(() => navigate('/admin/alat'), 1000);
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <style>{`
        .form-container {
          max-width: 800px;
        }
        
        .form-card {
          background-color: #FFFFFF;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .form-header {
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #EEEEEE;
          padding-bottom: 0.5rem;
        }

        .form-header h3 {
          margin: 0;
          color: #1D1616;
        }

        .alert-msg {
          padding: 0.8rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .alert-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
        }

        .form-input {
          padding: 0.7rem 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .form-input:focus { border-color: #D84040; }

        textarea.form-input {
          resize: vertical;
          min-height: 120px;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn {
          flex: 1;
          padding: 0.7rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn:hover { opacity: 0.9; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-submit {
          background-color: #D84040;
          color: white;
        }

        .btn-cancel {
          background-color: #888;
          color: white;
        }

        .loading-text {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="form-card">
        <div className="form-header">
          <h3>{isEdit ? 'Edit Data Alat' : 'Tambah Alat Baru'}</h3>
        </div>

        {message.text && (
          <div className={`alert-msg ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message.text}
          </div>
        )}

        {loading && !message.text ? (
          <div className="loading-text">Memuat data...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nama Alat *</label>
                <input
                  type="text"
                  name="alat_nama"
                  className="form-input"
                  placeholder="Contoh: Sony A7III"
                  value={formData.alat_nama}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Kategori *</label>
                <select
                  name="alat_kategori_id"
                  className="form-input"
                  value={formData.alat_kategori_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {kategoriList.map(kat => (
                    <option key={kat.kategori_id} value={kat.kategori_id}>
                      {kat.kategori_nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Harga Sewa per Hari (Rp) *</label>
                <input
                  type="number"
                  name="alat_hargaperhari"
                  className="form-input"
                  placeholder="Contoh: 150000"
                  value={formData.alat_hargaperhari}
                  onChange={handleInputChange}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Stok Tersedia *</label>
                <input
                  type="number"
                  name="alat_stok"
                  className="form-input"
                  placeholder="Contoh: 5"
                  value={formData.alat_stok}
                  onChange={handleInputChange}
                  required
                  min="0"
                />
              </div>

              <div className="form-group full-width">
                <label>Deskripsi *</label>
                <textarea
                  name="alat_deskripsi"
                  className="form-input"
                  placeholder="Masukkan spesifikasi atau deskripsi singkat alat..."
                  value={formData.alat_deskripsi}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-submit"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Data')}
              </button>
              <button 
                type="button" 
                className="btn btn-cancel"
                onClick={() => navigate('/admin/alat')}
                disabled={loading}
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
