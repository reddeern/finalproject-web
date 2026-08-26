import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function KategoriView() {
  const navigate = useNavigate();
  const [kategori, setKategori] = useState([]);
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
    fetchKategori();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Klik diluar popup, tutup popup
      if (activeActionMenu && !e.target.closest('.action-cell')) {
        setActiveActionMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeActionMenu]);

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
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus kategori ini? Data alat yang terkait mungkin akan terpengaruh.')) {
      try {
        await api.delete(`/kategori/${id}`);
        showMessage('success', 'Kategori berhasil dihapus!');
        fetchKategori();
        setActiveActionMenu(null);
      } catch (error) {
        showMessage('error', 'Gagal menghapus kategori. Pastikan tidak ada alat yang masih memakai kategori ini.');
      }
    }
  };

  const handleActionMenuClick = (event, id) => {
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 120; // Perkiraan tinggi menu
    const spaceBelow = window.innerHeight - rect.bottom;
    const position = spaceBelow < menuHeight ? 'top' : 'bottom';
    
    // Calculate fixed position untuk popup
    const popupX = rect.right - 120; // Align ke kanan tombol, width popup ~120px
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
    navigate(`/admin/kategori/edit/${id}`);
  };

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
        }

        .modal-content {
          background-color: white;
          padding: 2rem;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
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
        }
      `}</style>

      {message.text && (
        <div className={`alert-msg ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h3>Daftar Kategori Alat</h3>
          <div className="header-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Cari kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn-add" onClick={() => navigate('/admin/kategori/tambah')}>
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
                  <th width="10%">No</th>
                  <th width="70%">Nama Kategori</th>
                  <th width="20%">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredKategori.length > 0 ? (
                  filteredKategori.map((item, index) => (
                    <tr key={item.kategori_id}>
                      <td>{index + 1}</td>
                      <td>{item.kategori_nama}</td>
                      <td className="action-cell">
                        <button 
                          className="btn-action-menu"
                          onClick={(e) => handleActionMenuClick(e, item.kategori_id)}
                        >
                          ⋯
                        </button>
                        
                        {activeActionMenu === item.kategori_id && popupCoords[item.kategori_id] && (
                          <div 
                            className={`action-popup ${menuPositions[item.kategori_id] || 'bottom'}`}
                            style={{
                              left: popupCoords[item.kategori_id].x,
                              top: popupCoords[item.kategori_id].y
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
                              onClick={() => handleEdit(item.kategori_id)}
                            >
                              Edit
                            </div>
                            <div 
                              className="action-popup-item delete"
                              onClick={() => handleDelete(item.kategori_id)}
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

      {/* Modal Detail */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Kategori</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                &times;
              </button>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">ID Kategori</div>
              <div className="detail-value">{selectedItem.kategori_id}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Nama Kategori</div>
              <div className="detail-value">{selectedItem.kategori_nama}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Dibuat Pada</div>
              <div className="detail-value">
                {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleDateString('id-ID') : '-'}
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Diperbarui Pada</div>
              <div className="detail-value">
                {selectedItem.updated_at ? new Date(selectedItem.updated_at).toLocaleDateString('id-ID') : '-'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
