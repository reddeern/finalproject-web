import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar 
} from 'recharts';

export default function DashboardView({ adminName }) {
  const [stats, setStats] = useState({
    totalPelanggan: 0,
    totalAlat: 0,
    transaksiAktif: 0,
    pendapatan: 0
  });
  
  const [chartData, setChartData] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Panggil semua endpoint sekaligus biar cepat
      const [resSewa, resAlat, resPelanggan] = await Promise.all([
        api.get('/penyewaan'),
        api.get('/alat'),
        api.get('/pelanggan')
      ]);

      const dataSewa = resSewa.data.data || resSewa.data || [];
      const dataAlat = resAlat.data.data || resAlat.data || [];
      const dataPelanggan = resPelanggan.data.data || resPelanggan.data || [];

      // 1. Hitung Summary Cards
      const transaksiAktif = dataSewa.filter(s => s.penyewaan_sttskembali === 'Belum Kembali').length;
      const pendapatan = dataSewa
        .filter(s => s.penyewaan_sttspembayaran === 'Lunas')
        .reduce((sum, item) => sum + Number(item.penyewaan_totalharga), 0);

      setStats({
        totalPelanggan: dataPelanggan.length,
        totalAlat: dataAlat.length,
        transaksiAktif,
        pendapatan
      });

      // 2. Olah Data Grafik Peminjaman (7 Hari Terakhir)
      const last7Days = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        last7Days[dateString] = 0; // Set default 0 transaksi
      }

      dataSewa.forEach(sewa => {
        const tglSewa = sewa.penyewaan_tglsewa;
        if (last7Days[tglSewa] !== undefined) {
          last7Days[tglSewa] += 1;
        }
      });

      const formattedChartData = Object.keys(last7Days).map(date => ({
        tanggal: date.substring(5), // Ambil MM-DD saja biar tidak kepanjangan di grafik
        transaksi: last7Days[date]
      }));
      setChartData(formattedChartData);

      // 3. Olah Data Barang Paling Sering Disewa
      const itemCounts = {};
      dataSewa.forEach(sewa => {
        // Cek kedua kemungkinan nama field: detail atau penyewaan_detail
        const details = sewa.detail || sewa.penyewaan_detail;
        if (details && details.length > 0) {
          details.forEach(det => {
            const id = det.penyewaan_detail_alat_id || det.alat_id;
            const jumlah = det.penyewaan_detail_jumlah || det.jumlah;
            itemCounts[id] = (itemCounts[id] || 0) + Number(jumlah);
          });
        }
      });

      // Map ID ke Nama Alat dan sorting
      const sortedPopular = Object.keys(itemCounts)
        .map(id => {
          const alat = dataAlat.find(a => a.alat_id.toString() === id);
          return {
            nama: alat ? alat.alat_nama : `Alat ID ${id}`,
            jumlahDisewa: itemCounts[id]
          };
        })
        .sort((a, b) => b.jumlahDisewa - a.jumlahDisewa)
        .slice(0, 5); // Ambil Top 5 saja

      setPopularItems(sortedPopular);

    } catch (error) {
      console.error("Gagal memuat data dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat analitik dashboard...</div>;

  return (
    <div className="dashboard-view">
      <style>{`
        .dashboard-view { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .welcome-banner { background-color: #1D1616; color: #EEEEEE; padding: 1.5rem 2rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .welcome-banner h2 { margin-bottom: 0.5rem; color: #D84040; }
        
        /* Grid Summary Cards */
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .stat-card { background-color: #FFFFFF; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 0.5rem; border-bottom: 4px solid transparent; transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-3px); }
        .stat-card.red { border-bottom-color: #D84040; }
        .stat-card.dark { border-bottom-color: #1D1616; }
        
        .stat-title { font-size: 0.9rem; color: #888; font-weight: 600; text-transform: uppercase; }
        .stat-value { font-size: 1.8rem; font-weight: bold; color: #1D1616; }
        
        /* Grid Chart & Popular Items */
        .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
        @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
        
        .chart-card, .list-card { background-color: #FFFFFF; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .card-header { font-size: 1.1rem; font-weight: bold; color: #1D1616; margin-bottom: 1.5rem; border-bottom: 2px solid #EEEEEE; padding-bottom: 0.5rem; }
        
        /* List Popular Items */
        .popular-list { display: flex; flex-direction: column; gap: 1rem; }
        .popular-item { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; background-color: #f9f9f9; border-radius: 6px; border-left: 3px solid #D84040; }
        .item-name { font-weight: 600; color: #333; font-size: 0.95rem; }
        .item-count { background-color: #1D1616; color: #fff; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }
        
        .empty-text { text-align: center; color: #888; font-style: italic; font-size: 0.9rem; }
      `}</style>

      <div className="welcome-banner">
        <h2>Selamat Datang, {adminName}!</h2>
        <p>Pantau performa persewaan CV Amanah Elektronik hari ini.</p>
      </div>

      <div className="summary-grid">
        <div className="stat-card red">
          <div className="stat-title">Transaksi Aktif</div>
          <div className="stat-value">{stats.transaksiAktif}</div>
        </div>
        <div className="stat-card dark">
          <div className="stat-title">Total Pendapatan (Lunas)</div>
          <div className="stat-value">{formatRupiah(stats.pendapatan)}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-title">Total Pelanggan</div>
          <div className="stat-value">{stats.totalPelanggan}</div>
        </div>
        <div className="stat-card dark">
          <div className="stat-title">Katalog Alat</div>
          <div className="stat-value">{stats.totalAlat}</div>
        </div>
      </div>

      <div className="main-grid">
        {/* Area Grafik */}
        <div className="chart-card">
          <div className="card-header">Grafik Transaksi (7 Hari Terakhir)</div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="tanggal" tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#888', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="transaksi" stroke="#D84040" strokeWidth={3} activeDot={{ r: 8 }} name="Jml Transaksi" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Barang Terlaris */}
        <div className="list-card">
          <div className="card-header">Top 5 Alat Sering Disewa</div>
          <div className="popular-list">
            {popularItems.length > 0 ? (
              popularItems.map((item, index) => (
                <div className="popular-item" key={index}>
                  <div className="item-name">{item.nama}</div>
                  <div className="item-count">{item.jumlahDisewa}x</div>
                </div>
              ))
            ) : (
              <div className="empty-text">Belum ada data persewaan alat.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}