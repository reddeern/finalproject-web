import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function KategoriForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({ kategori_nama: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isEdit) {
      fetchKategori();
    }
  }, [id]);

  const fetchKategori = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/kategori/${id}`);
      const data = response.data.data || response.data;
      setFormData({ kategori_nama: data.kategori_nama });
    } catch (error) {
      showMessage('error', 'Gagal memuat data kategori');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, kategori_nama: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isEdit) {
        await api.put(`/kategori/${id}`, formData);
        showMessage('success', 'Kategori berhasil diperbarui!');
      } else {
        await api.post('/kategori', formData);
        showMessage('success', 'Kategori baru berhasil ditambahkan!');
      }
      
      setTimeout(() => navigate('/admin/kategori'), 1000);
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
          max-width: 600px;
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

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.7rem 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus { border-color: #D84040; }

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
      `}</style>

      <div className="form-card">
        <div className="form-header">
          <h3>{isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
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
            <div className="form-group">
              <label>Nama Kategori *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Kamera, Lensa, Lighting..."
                value={formData.kategori_nama}
                onChange={handleInputChange}
                required
              />
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
                onClick={() => navigate('/admin/kategori')}
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
