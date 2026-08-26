import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function PenyewaanForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    penyewaan_pelanggan_id: '',
    penyewaan_tglsewa: '',
    penyewaan_tglkembali: '',
    penyewaan_sttspembayaran: 'Belum Dibayar',
    penyewaan_sttskembali: 'Belum Kembali'
  });

  const [cart, setCart] = useState([]);
  const [selectedAlat, setSelectedAlat] = useState('');
  const [jumlahAlat, setJumlahAlat] = useState(1);
  
  const [pelangganList, setPelangganList] = useState([]);
  const [alatList, setAlatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
    if (isEdit) {
      fetchPenyewaan();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [resPelanggan, resAlat] = await Promise.all([
        api.get('/pelanggan'),
        api.get('/alat')
      ]);
      setPelangganList(resPelanggan.data.data || resPelanggan.data);
      setAlatList(resAlat.data.data || resAlat.data);
    } catch (error) {
      showMessage('error', 'Gagal memuat data dari server');
    }
  };

  const fetchPenyewaan = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/penyewaan/${id}`);
      const data = response.data.data || response.data;
      setFormData({
        penyewaan_pelanggan_id: data.penyewaan_pelanggan_id,
        penyewaan_tglsewa: data.penyewaan_tglsewa,
        penyewaan_tglkembali: data.penyewaan_tglkembali,
        penyewaan_sttspembayaran: data.penyewaan_sttspembayaran,
        penyewaan_sttskembali: data.penyewaan_sttskembali
      });

      if (data.detail && data.detail.length > 0) {
        const durasi = getDurasiHari(data.penyewaan_tglsewa, data.penyewaan_tglkembali);
        const existingCart = data.detail.map(det => {
          const alat = alatList.find(a => a.alat_id === det.penyewaan_detail_alat_id);
          return {
            alat_id: det.penyewaan_detail_alat_id,
            alat_nama: alat ? alat.alat_nama : 'Alat tidak ditemukan',
            harga_perhari: det.penyewaan_detail_subharga / det.penyewaan_detail_jumlah / durasi,
            jumlah: det.penyewaan_detail_jumlah,
            subharga: det.penyewaan_detail_subharga / durasi
          };
        });
        setCart(existingCart);
      }
    } catch (error) {
      showMessage('error', 'Gagal memuat data penyewaan');
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

  const getDurasiHari = (tglSewa, tglKembali) => {
    if (!tglSewa || !tglKembali) return 0;
    const start = new Date(tglSewa);
    const end = new Date(tglKembali);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  const hitungTotalHarga = () => {
    const durasi = getDurasiHari(formData.penyewaan_tglsewa, formData.penyewaan_tglkembali);
    return cart.reduce((total, item) => total + (item.subharga * durasi), 0);
  };

  const addToCart = () => {
    if (!selectedAlat || jumlahAlat < 1) return;
    if (!formData.penyewaan_tglsewa || !formData.penyewaan_tglkembali) {
      showMessage('error', 'Isi tanggal sewa dan kembali terlebih dahulu!');
      return;
    }

    const alat = alatList.find(a => a.alat_id.toString() === selectedAlat);
    if (!alat) return;

    if (alat.alat_stok <= 0) {
      showMessage('error', `Stok ${alat.alat_nama} sudah habis.`);
      return;
    }

    if (jumlahAlat > alat.alat_stok) {
      showMessage('error', `Stok ${alat.alat_nama} tidak mencukupi (Sisa: ${alat.alat_stok})`);
      return;
    }

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
      subharga: alat.alat_hargaperhari * parseInt(jumlahAlat)
    };

    setCart([...cart, newItem]);
    setSelectedAlat('');
    setJumlahAlat(1);
  };

  const removeFromCart = (alat_id) => {
    setCart(cart.filter(c => c.alat_id !== alat_id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showMessage('error', 'Pilih minimal satu alat untuk disewa!');
      return;
    }

    setLoading(true);
    
    const durasi = getDurasiHari(formData.penyewaan_tglsewa, formData.penyewaan_tglkembali);
    const payload = {
      ...formData,
      penyewaan_totalharga: hitungTotalHarga(),
      detail: cart.map(item => ({
        alat_id: item.alat_id,
        jumlah: item.jumlah,
        subharga: item.subharga * durasi
      }))
    };

    try {
      if (isEdit) {
        await api.put(`/penyewaan/${id}`, payload);
        showMessage('success', 'Transaksi sewa berhasil diperbarui!');
      } else {
        await api.post('/penyewaan', payload);
        showMessage('success', 'Transaksi sewa baru berhasil dibuat!');
      }
      
      setTimeout(() => navigate('/admin/penyewaan'), 1000);
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  const durasi = getDurasiHari(formData.penyewaan_tglsewa, formData.penyewaan_tglkembali);
  const totalHarga = hitungTotalHarga();

  return (
    <div className="form-container">
      <style>{`
        .form-container {
          max-width: 1000px;
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
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 1rem;
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

        .section-title {
          font-size: 1rem;
          color: #D84040;
          font-weight: 600;
          margin: 1.5rem 0 0.5rem;
          border-bottom: 1px dashed #ccc;
          padding-bottom: 0.3rem;
        }

        .cart-input-area {
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
          margin-bottom: 1rem;
        }

        .cart-input-area select,
        .cart-input-area input {
          flex: 1;
          padding: 0.7rem 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
        }

        .btn-add-cart {
          background-color: #1D1616;
          color: white;
          padding: 0.7rem 1.5rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          white-space: nowrap;
        }
        .btn-add-cart:hover { opacity: 0.9; }

        .cart-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }
        .cart-table th, .cart-table td {
          padding: 0.5rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .cart-table th { background-color: #f9f9f9; }

        .btn-remove {
          color: red;
          cursor: pointer;
          border: none;
          background: none;
          font-weight: bold;
        }

        .total-box {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #1D1616;
          color: #EEEEEE;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.1rem;
          font-weight: bold;
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
            grid-template-columns: 1fr 1fr;
          }
          .cart-input-area {
            flex-direction: column;
          }
          .cart-input-area select,
          .cart-input-area input,
          .btn-add-cart {
            width: 100%;
          }
          .total-box {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>

      <div className="form-card">
        <div className="form-header">
          <h3>{isEdit ? 'Edit Transaksi Sewa' : 'Buat Transaksi Sewa Baru'}</h3>
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
                <label>Pilih Pelanggan *</label>
                <select 
                  name="penyewaan_pelanggan_id" 
                  className="form-input" 
                  value={formData.penyewaan_pelanggan_id} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="">-- Pilih Pelanggan --</option>
                  {pelangganList.map(p => (
                    <option key={p.pelanggan_id} value={p.pelanggan_id}>
                      {p.pelanggan_nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tanggal Sewa *</label>
                <input 
                  type="date" 
                  name="penyewaan_tglsewa" 
                  className="form-input" 
                  value={formData.penyewaan_tglsewa} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Tanggal Kembali *</label>
                <input 
                  type="date" 
                  name="penyewaan_tglkembali" 
                  className="form-input" 
                  value={formData.penyewaan_tglkembali} 
                  onChange={handleInputChange} 
                  required 
                  min={formData.penyewaan_tglsewa}
                />
              </div>

              <div className="form-group">
                <label>Status Pembayaran *</label>
                <select 
                  name="penyewaan_sttspembayaran" 
                  className="form-input" 
                  value={formData.penyewaan_sttspembayaran} 
                  onChange={handleInputChange}
                >
                  <option value="Belum Dibayar">Belum Dibayar</option>
                  <option value="DP">DP (Uang Muka)</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status Alat *</label>
                <select 
                  name="penyewaan_sttskembali" 
                  className="form-input" 
                  value={formData.penyewaan_sttskembali} 
                  onChange={handleInputChange}
                >
                  <option value="Belum Kembali">Belum Kembali (Sedang Disewa)</option>
                  <option value="Sudah Kembali">Sudah Dikembalikan</option>
                </select>
              </div>
            </div>

            <div className="form-grid full-width" style={{ gridColumn: '1 / -1' }}>
              <div className="section-title" style={{ gridColumn: '1 / -1' }}>Pilih Alat Elektronik yang Disewa</div>
              
              <div className="cart-input-area" style={{ gridColumn: '1 / -1' }}>
                <select 
                  className="form-input" 
                  value={selectedAlat} 
                  onChange={(e) => setSelectedAlat(e.target.value)}
                  style={{ flex: 2 }}
                >
                  <option value="">-- Pilih Alat --</option>
                  {alatList.map(a => (
                    <option key={a.alat_id} value={a.alat_id}>
                      {a.alat_nama} (Stok: {a.alat_stok}) - {formatRupiah(a.alat_hargaperhari)}/hari
                    </option>
                  ))}
                </select>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="Qty"
                  min="1" 
                  value={jumlahAlat} 
                  onChange={(e) => setJumlahAlat(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn-add-cart" onClick={addToCart}>
                  + Tambah Alat
                </button>
              </div>

              {cart.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
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
                            <button 
                              type="button"
                              className="btn-remove"
                              onClick={() => removeFromCart(c.alat_id)}
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="total-box">
                    <span>Durasi: {durasi} Hari</span>
                    <span>TOTAL: {formatRupiah(totalHarga)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-submit"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan Transaksi' : 'Konfirmasi & Simpan Transaksi')}
              </button>
              <button 
                type="button" 
                className="btn btn-cancel"
                onClick={() => navigate('/admin/penyewaan')}
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
