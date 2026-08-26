import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function PenyewaanView() {
  const navigate = useNavigate();
  const [penyewaan, setPenyewaan] = useState([]);
  const [pelangganList, setPelangganList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // State untuk popup menu action
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [menuPositions, setMenuPositions] = useState({});
  const [popupCoords, setPopupCoords] = useState({});
  
  // State untuk modal detail
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSewa, resPelanggan] = await Promise.all([
        api.get('/penyewaan'),
        api.get('/pelanggan')
      ]);
      setPenyewaan(resSewa.data.data || resSewa.data);
      setPelangganList(resPelanggan.data.data || resPelanggan.data);
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

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin membatalkan/menghapus transaksi sewa ini?')) {
      try {
        await api.delete(`/penyewaan/${id}`);
        showMessage('success', 'Transaksi berhasil dihapus!');
        fetchData();
        setActiveActionMenu(null);
      } catch (error) {
        showMessage('error', 'Gagal menghapus transaksi.');
      }
    }
  };

  const handleActionMenuClick = (event, id) => {
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 120;
    const spaceBelow = window.innerHeight - rect.bottom;
    const position = spaceBelow < menuHeight ? 'top' : 'bottom';
    
    const popupX = rect.right - 120;
    const popupY = position === 'bottom' ? rect.bottom : rect.top - menuHeight;
    
    setPopupCoords(prev => ({ ...prev, [id]: { x: popupX, y: popupY } }));
    setMenuPositions(prev => ({ ...prev, [id]: position }));
    setActiveActionMenu(activeActionMenu === id ? null : id);
  };

  const handleDetail = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
    setActiveActionMenu(null);
  };

  const handleEdit = (id) => {
    navigate(`/admin/penyewaan/edit/${id}`);
  };

  const getPelangganNama = (id) => {
    const p = pelangganList.find(x => x.pelanggan_id === id);
    return p ? p.pelanggan_nama : 'Unknown';
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  const getDurasiHari = (tglSewa, tglKembali) => {
    const start = new Date(tglSewa);
    const end = new Date(tglKembali);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  const filteredPenyewaan = penyewaan.filter((item) =>
    getPelangganNama(item.penyewaan_pelanggan_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <style>{`
        .view-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .table-card {
          background-color: #FFFFFF;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          overflow: visible;
        }

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

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .search-input {
          width: 250px;
          padding: 0.5rem 0.8rem;
          font-size: 0.9rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          outline: none;
        }
        .search-input:focus { border-color: #D84040; }

        .btn-add {
          padding: 0.6rem 1.2rem;
          background-color: #D84040;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .btn-add:hover { opacity: 0.9; }

        .alert-msg {
          padding: 0.8rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .alert-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        
        .table-wrapper {
          overflow-x: auto;
          overflow-y: visible;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        .data-table th, .data-table td {
          padding: 0.8rem 1rem;
          text-align: left;
          border-bottom: 1px solid #eee;
          font-size: 0.9rem;
        }
        .data-table th {
          background-color: #f9f9f9;
          font-weight: 600;
          color: #333;
        }
        .data-table tr:hover { background-color: #fcfcfc; }
        
        .action-cell {
          position: relative;
        }

        .btn-action-menu {
          padding: 0.4rem 0.6rem;
          background-color: transparent;
          color: #1D1616;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1.4rem;
          font-weight: 600;
          line-height: 1;
          transition: all 0.2s;
        }
        .btn-action-menu:hover { 
          background-color: #f0f0f0;
          color: #D84040;
        }

        .action-popup {
          position: fixed;
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 100;
          min-width: 120px;
        }

        .action-popup.bottom {
          top: 0;
        }

        .action-popup.top {
          top: 0;
        }

        .action-popup-item {
          padding: 0.6rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }
        .action-popup-item:last-child { border-bottom: none; }
        .action-popup-item:hover { background-color: #f9f9f9; }
        .action-popup-item.detail { color: #1D1616; }
        .action-popup-item.edit { color: #D84040; }
        .action-popup-item.delete { color: #8E1616; }

        .badge {
          display: inline-block;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
        }
        .badge-lunas { background-color: #d4edda; color: #155724; }
        .badge-dp { background-color: #fff3cd; color: #856404; }
        .badge-belum { background-color: #f8d7da; color: #721c24; }
        .badge-kembali { background-color: #d4edda; color: #155724; }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          overflow-y: auto;
        }

        .modal-content {
          background-color: white;
          padding: 2rem;
          border-radius: 8px;
          max-width: 700px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          margin: 2rem auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #EEEEEE;
          padding-bottom: 0.5rem;
        }

        .modal-header h3 {
          margin: 0;
          color: #1D1616;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }
        .modal-close:hover { color: #000; }

        .detail-row {
          display: flex;
          padding: 0.8rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .detail-row:last-child { border-bottom: none; }

        .detail-label {
          font-weight: 600;
          color: #555;
          width: 150px;
          flex-shrink: 0;
        }

        .detail-value {
          color: #333;
          flex: 1;
        }

        .detail-section-title {
          font-weight: 600;
          color: #1D1616;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 2px solid #EEEEEE;
        }

        .detail-items {
          background-color: #f9f9f9;
          padding: 0.8rem;
          border-radius: 4px;
          margin: 0.5rem 0;
        }

        .detail-item-row {
          display: flex;
          justify-content: space-between;
          padding: 0.4rem 0;
          font-size: 0.9rem;
        }

        .loading-text { text-align: center; padding: 2rem; color: #666; }
        .empty-text { text-align: center; padding: 1.5rem; color: #888; font-style: italic; }

        @media (max-width: 768px) {
          .header-actions {
            flex-direction: column;
            width: 100%;
          }
          .search-input {
            width: 100%;
          }
          .btn-add {
            width: 100%;
          }
          .data-table th, .data-table td {
            padding: 0.5rem;
            font-size: 0.8rem;
          }
        }
      `}</style>

      {message.text && (
        <div className={`alert-msg ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h3>Daftar Transaksi Sewa</h3>
          <div className="header-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Cari nama pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn-add" onClick={() => navigate('/admin/penyewaan/tambah')}>
              + Tambah Data
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-text">Memuat data...</div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th width="4%">No</th>
                  <th width="18%">Pelanggan</th>
                  <th width="20%">Tanggal Sewa</th>
                  <th width="16%">Total Harga</th>
                  <th width="16%">Pembayaran</th>
                  <th width="14%">Status Alat</th>
                  <th width="12%">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPenyewaan.length > 0 ? (
                  filteredPenyewaan.map((item, index) => (
                    <tr key={item.penyewaan_id}>
                      <td>{index + 1}</td>
                      <td><strong>{getPelangganNama(item.penyewaan_pelanggan_id)}</strong></td>
                      <td>
                        {item.penyewaan_tglsewa} s/d {item.penyewaan_tglkembali}
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
                        <span className={`badge ${item.penyewaan_sttskembali === 'Sudah Kembali' ? 'badge-kembali' : 'badge-belum'}`}>
                          {item.penyewaan_sttskembali}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button 
                          className="btn-action-menu"
                          onClick={(e) => handleActionMenuClick(e, item.penyewaan_id)}
                        >
                          ⋯
                        </button>
                        
                        {activeActionMenu === item.penyewaan_id && popupCoords[item.penyewaan_id] && (
                          <div 
                            className={`action-popup ${menuPositions[item.penyewaan_id] || 'bottom'}`}
                            style={{
                              left: popupCoords[item.penyewaan_id].x,
                              top: popupCoords[item.penyewaan_id].y
                            }}
                          >
                            <div 
                              className="action-popup-item detail"
                              onClick={() => handleDetail(item)}
                            >
                              Detail
                            </div>
                            <div 
                              className="action-popup-item edit"
                              onClick={() => handleEdit(item.penyewaan_id)}
                            >
                              Edit
                            </div>
                            <div 
                              className="action-popup-item delete"
                              onClick={() => handleDelete(item.penyewaan_id)}
                            >
                              Hapus
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-text">
                      {searchTerm ? 'Data transaksi tidak ditemukan.' : 'Belum ada data transaksi sewa.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Transaksi Sewa</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                &times;
              </button>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">ID Transaksi</div>
              <div className="detail-value">#{selectedItem.penyewaan_id}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Pelanggan</div>
              <div className="detail-value"><strong>{getPelangganNama(selectedItem.penyewaan_pelanggan_id)}</strong></div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Tanggal Sewa</div>
              <div className="detail-value">{selectedItem.penyewaan_tglsewa}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Tanggal Kembali</div>
              <div className="detail-value">{selectedItem.penyewaan_tglkembali}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Durasi Sewa</div>
              <div className="detail-value">
                {getDurasiHari(selectedItem.penyewaan_tglsewa, selectedItem.penyewaan_tglkembali)} hari
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Status Pembayaran</div>
              <div className="detail-value">
                <span className={`badge ${
                  selectedItem.penyewaan_sttspembayaran === 'Lunas' ? 'badge-lunas' : 
                  selectedItem.penyewaan_sttspembayaran === 'DP' ? 'badge-dp' : 'badge-belum'
                }`}>
                  {selectedItem.penyewaan_sttspembayaran}
                </span>
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Status Alat</div>
              <div className="detail-value">
                <span className={`badge ${selectedItem.penyewaan_sttskembali === 'Sudah Kembali' ? 'badge-kembali' : 'badge-belum'}`}>
                  {selectedItem.penyewaan_sttskembali}
                </span>
              </div>
            </div>
            
            {selectedItem.detail && selectedItem.detail.length > 0 && (
              <>
                <div className="detail-section-title">Detail Alat yang Disewa</div>
                {selectedItem.detail.map((item, idx) => (
                  <div key={idx} className="detail-items">
                    <div className="detail-item-row">
                      <span><strong>{item.alat?.alat_nama || 'Alat tidak ditemukan'}</strong></span>
                      <span>x{item.penyewaan_detail_jumlah}</span>
                    </div>
                    <div className="detail-item-row">
                      <span>Subtotal</span>
                      <span>{formatRupiah(item.penyewaan_detail_subharga)}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            <div className="detail-row" style={{ marginTop: '1rem', fontWeight: 'bold', borderTop: '2px solid #D84040' }}>
              <div className="detail-label">Total Harga</div>
              <div className="detail-value">{formatRupiah(selectedItem.penyewaan_totalharga)}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Dibuat Pada</div>
              <div className="detail-value">
                {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleDateString('id-ID') : '-'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
