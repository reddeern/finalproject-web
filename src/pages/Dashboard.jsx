import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardView from '../components/DashboardView';
import KategoriView from '../components/KategoriView';
import AlatView from '../components/AlatView';
import PelangganView from '../components/PelangganView';
import PenyewaanView from '../components/PenyewaanView';

export default function Dashboard() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  
  // State untuk melacak menu mana yang sedang aktif
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Fungsi untuk me-render konten berdasarkan menu yang aktif
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardView adminName={admin?.admin_username || 'Admin'} />;
      case 'kategori':
        return <KategoriView />;
      case 'alat':
        return <AlatView />;
      case 'pelanggan':
        return <PelangganView />;
      case 'penyewaan':
        return <PenyewaanView />;
      default:
        return <div>Pilih menu dari sidebar.</div>;
    }
  };

  return (
    <>
      <style>{`
        /* Reset & Variabel Warna (Sama dengan Login) */
        :root {
          --color-dark: #1D1616;
          --color-red-dark: #8E1616;
          --color-red-light: #D84040;
          --color-light: #EEEEEE;
          --color-white: #FFFFFF;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Layout Utama Dasbor */
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background-color: var(--color-light);
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          overflow: hidden; /* Mencegah scrolling gap yang bocor */
        }

        /* --- Sidebar Styling --- */
        .sidebar {
          width: 260px;
          background-color: var(--color-dark);
          color: var(--color-light);
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 15px rgba(0,0,0,0.1);
          z-index: 10;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid #332727;
          text-align: center;
        }

        .sidebar-header h2 {
          color: var(--color-red-light);
          font-size: 1.5rem;
          margin-bottom: 0.3rem;
        }

        .sidebar-header p {
          font-size: 0.8rem;
          color: #a0a0a0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .nav-item {
          padding: 1rem 1.5rem;
          cursor: pointer;
          font-weight: 500;
          color: #d1d1d1;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav-item:hover {
          background-color: rgba(216, 64, 64, 0.1);
          color: var(--color-red-light);
        }

        .nav-item.active {
          background-color: var(--color-red-dark);
          color: var(--color-white);
          border-right: 4px solid var(--color-red-light);
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid #332727;
        }

        .btn-logout {
          width: 100%;
          padding: 0.8rem;
          background-color: transparent;
          border: 1px solid var(--color-red-light);
          color: var(--color-red-light);
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-logout:hover {
          background-color: var(--color-red-light);
          color: var(--color-white);
        }

        /* --- Main Content Styling --- */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow-y: auto;
        }

        .top-navbar {
          background-color: var(--color-white);
          padding: 1rem 2rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: var(--color-dark);
        }

        .avatar {
          width: 35px;
          height: 35px;
          background-color: var(--color-red-light);
          color: var(--color-white);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .content-area {
          padding: 2rem;
        }

        .content-card {
          background-color: var(--color-white);
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          color: var(--color-dark);
        }

        .content-card h2 {
          margin-bottom: 1rem;
          color: var(--color-dark);
          border-bottom: 2px solid var(--color-light);
          padding-bottom: 0.5rem;
        }
      `}</style>

      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Amanah</h2>
            <p>Elektronik</p>
          </div>
          
          <nav className="sidebar-nav">
            <div 
              className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
            >
              Dashboard
            </div>
            <div 
              className={`nav-item ${activeMenu === 'kategori' ? 'active' : ''}`}
              onClick={() => setActiveMenu('kategori')}
            >
              Kategori Alat
            </div>
            <div 
              className={`nav-item ${activeMenu === 'alat' ? 'active' : ''}`}
              onClick={() => setActiveMenu('alat')}
            >
              Data Alat
            </div>
            <div 
              className={`nav-item ${activeMenu === 'pelanggan' ? 'active' : ''}`}
              onClick={() => setActiveMenu('pelanggan')}
            >
              Data Pelanggan
            </div>
            <div 
              className={`nav-item ${activeMenu === 'penyewaan' ? 'active' : ''}`}
              onClick={() => setActiveMenu('penyewaan')}
            >
              Transaksi Sewa
            </div>
          </nav>

          <div className="sidebar-footer">
            <button className="btn-logout" onClick={handleLogout}>
              Logout System
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <header className="top-navbar">
            <div className="user-profile">
              <span>{admin?.admin_username || 'Admin'}</span>
              <div className="avatar">
                {/* Menampilkan huruf pertama dari username admin */}
                {(admin?.admin_username || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <section className="content-area">
            {renderContent()}
          </section>
        </main>
      </div>
    </>
  );
}