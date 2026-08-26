import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function PelangganView() {
  const navigate = useNavigate();
  const [pelanggan, setPelanggan] = useState([]);
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
    fetchPelanggan();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeActionMenu && !e.target.closest('.action-cell')) {
        setActiveActionMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeActionMenu]);

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
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus data pelanggan ini? Data transaksi terkait mungkin akan hilang.')) {
      try {
        await api.delete(`/pelanggan/${id}`);
        showMessage('success', 'Data pelanggan berhasil dihapus!');
        fetchPelanggan();
        setActiveActionMenu(null);
      } catch (error) {
        showMessage('error', 'Gagal menghapus data pelanggan.');
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
    navigate(`/admin/pelanggan/edit/${id}`);
  };

  const filteredPelanggan = pelanggan.filter((item) =>
    item.pelanggan_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.pelanggan_email.toLowerCase().includes(searchTerm.toLowerCase())
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

        .detail-photo {
          margin: 1rem 0;
          padding: 1rem 0;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-photo-title {
          font-weight: 600;
          color: #555;
          margin-bottom: 0.8rem;
        }

        .detail-photo-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 4px;
          background-color: #f9f9f9;
          border: 1px solid #eee;
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
            font-size: 0.85rem;
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
          <h3>Daftar Pelanggan</h3>
          <div className="header-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn-add" onClick={() => navigate('/admin/pelanggan/tambah')}>
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
                  <th width="5%">No</th>
                  <th width="22%">Nama Pelanggan</th>
                  <th width="25%">Kontak</th>
                  <th width="30%">Alamat</th>
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
                        <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                          <div>{item.pelanggan_notelp}</div>
                          <div>{item.pelanggan_email}</div>
                        </div>
                      </td>
                      <td>{item.pelanggan_alamat}</td>
                      <td className="action-cell">
                        <button 
                          className="btn-action-menu"
                          onClick={(e) => handleActionMenuClick(e, item.pelanggan_id)}
                        >
                          ⋯
                        </button>
                        
                        {activeActionMenu === item.pelanggan_id && popupCoords[item.pelanggan_id] && (
                          <div 
                            className={`action-popup ${menuPositions[item.pelanggan_id] || 'bottom'}`}
                            style={{
                              left: popupCoords[item.pelanggan_id].x,
                              top: popupCoords[item.pelanggan_id].y
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
                              onClick={() => handleEdit(item.pelanggan_id)}
                            >
                              Edit
                            </div>
                            <div 
                              className="action-popup-item delete"
                              onClick={() => handleDelete(item.pelanggan_id)}
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
                    <td colSpan="5" className="empty-text">
                      {searchTerm ? 'Data pelanggan tidak ditemukan.' : 'Belum ada data pelanggan.'}
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
              <h3>Detail Pelanggan</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                &times;
              </button>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">ID Pelanggan</div>
              <div className="detail-value">{selectedItem.pelanggan_id}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Nama Lengkap</div>
              <div className="detail-value"><strong>{selectedItem.pelanggan_nama}</strong></div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Email</div>
              <div className="detail-value">{selectedItem.pelanggan_email}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Nomor Telepon</div>
              <div className="detail-value">{selectedItem.pelanggan_notelp}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Alamat Lengkap</div>
              <div className="detail-value">{selectedItem.pelanggan_alamat}</div>
            </div>
            
            {selectedItem.pelanggan_data && (
              <>
                <div className="detail-row">
                  <div className="detail-label">Jenis Identitas</div>
                  <div className="detail-value">{selectedItem.pelanggan_data.pelanggan_data_jenis}</div>
                </div>
                
                {selectedItem.pelanggan_data.pelanggan_data_file && (
                  <div className="detail-photo">
                    <div className="detail-photo-title">Foto Identitas ({selectedItem.pelanggan_data.pelanggan_data_jenis})</div>
                    <img 
                      src={`${import.meta.env.VITE_API_URL}/storage/${selectedItem.pelanggan_data.pelanggan_data_file}`}
                      alt="Foto Identitas"
                      className="detail-photo-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML += '<div style="color: #999; font-size: 0.9rem;">Foto tidak tersedia</div>';
                      }}
                    />
                  </div>
                )}
              </>
            )}
            
            <div className="detail-row">
              <div className="detail-label">Terdaftar Pada</div>
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
