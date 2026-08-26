import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function PelangganForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    pelanggan_nama: '',
    pelanggan_email: '',
    pelanggan_notelp: '',
    pelanggan_alamat: '',
    pelanggan_data_jenis: 'KTP',
    pelanggan_data_file: null
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isEdit) {
      fetchPelanggan();
    }
  }, [id]);

  const fetchPelanggan = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/pelanggan/${id}`);
      const data = response.data.data || response.data;
      setFormData({
        pelanggan_nama: data.pelanggan_nama,
        pelanggan_email: data.pelanggan_email,
        pelanggan_notelp: data.pelanggan_notelp,
        pelanggan_alamat: data.pelanggan_alamat,
        pelanggan_data_jenis: data.pelanggan_data?.pelanggan_data_jenis || 'KTP',
        pelanggan_data_file: null
      });
    } catch (error) {
      showMessage('error', 'Gagal memuat data pelanggan');
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

  const handleFileChange = (e) => {
    setFormData({ ...formData, pelanggan_data_file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
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
      if (isEdit) {
        submitData.append('_method', 'PUT');
        await api.post(`/pelanggan/${id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showMessage('success', 'Data pelanggan berhasil diperbarui!');
      } else {
        await api.post('/pelanggan', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showMessage('success', 'Pelanggan baru berhasil ditambahkan!');
      }
      
      setTimeout(() => navigate('/admin/pelanggan'), 1000);
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
          min-height: 100px;
        }

        .form-input[type="file"] {
          padding: 0.5rem 1rem;
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

        .form-hint {
          font-size: 0.8rem;
          color: #666;
          margin-top: 0.3rem;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="form-card">
        <div className="form-header">
          <h3>{isEdit ? 'Edit Data Pelanggan' : 'Registrasi Pelanggan Baru'}</h3>
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
                <label>Nama Lengkap *</label>
                <input
                  type="text"
                  name="pelanggan_nama"
                  className="form-input"
                  placeholder="Nama sesuai identitas"
                  value={formData.pelanggan_nama}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="pelanggan_email"
                  className="form-input"
                  placeholder="email@contoh.com"
                  value={formData.pelanggan_email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nomor Telepon / WhatsApp *</label>
                <input
                  type="tel"
                  name="pelanggan_notelp"
                  className="form-input"
                  placeholder="08xxxxxxxxxx"
                  value={formData.pelanggan_notelp}
                  onChange={handleInputChange}
                  maxLength="13"
                  required
                />
              </div>

              <div className="form-group">
                <label>Jenis Identitas *</label>
                <select
                  name="pelanggan_data_jenis"
                  className="form-input"
                  value={formData.pelanggan_data_jenis}
                  onChange={handleInputChange}
                  required
                >
                  <option value="KTP">KTP</option>
                  <option value="SIM">SIM</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Alamat Lengkap *</label>
                <textarea
                  name="pelanggan_alamat"
                  className="form-input"
                  placeholder="Nama jalan, RT/RW, kelurahan, kota, provinsi..."
                  value={formData.pelanggan_alamat}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>
                  Unggah Foto Identitas {isEdit && '(Kosongkan jika tidak ingin mengubah)'}
                </label>
                <input 
                  type="file" 
                  name="pelanggan_data_file"
                  className="form-input"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  required={!isEdit}
                />
                <div className="form-hint">Format: JPG, PNG, atau PDF. Maksimal 5MB.</div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-submit"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Registrasi Pelanggan')}
              </button>
              <button 
                type="button" 
                className="btn btn-cancel"
                onClick={() => navigate('/admin/pelanggan')}
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
