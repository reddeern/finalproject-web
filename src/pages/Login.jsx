import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Login gagal. Silakan periksa username dan password Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Block CSS Langsung di dalam JSX */}
      <style>{`
        :root {
          --color-dark: #1D1616;
          --color-red-dark: #8E1616;
          --color-red-light: #D84040;
          --color-light: #EEEEEE;
        }

        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-light);
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        .login-card {
          background-color: var(--color-dark);
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(29, 22, 22, 0.3);
          color: var(--color-light);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h2 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--color-light);
          letter-spacing: 0.5px;
        }

        .login-header p {
          margin: 0.5rem 0 0;
          font-size: 0.9rem;
          color: #a0a0a0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .login-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: rgba(216, 64, 64, 0.1);
          border-left: 4px solid var(--color-red-light);
          color: var(--color-red-light);
          padding: 0.75rem 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
        }

        .login-alert svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-light);
        }

        .input-group input {
          background-color: #2a2222;
          border: 1px solid #3d3232;
          color: var(--color-light);
          padding: 0.85rem 1rem;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          outline: none;
        }

        .input-group input::placeholder {
          color: #666;
        }

        .input-group input:focus {
          border-color: var(--color-red-light);
          box-shadow: 0 0 0 3px rgba(216, 64, 64, 0.2);
        }

        .btn-login {
          background-color: var(--color-red-light);
          color: var(--color-light);
          border: none;
          padding: 0.85rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
          transition: background-color 0.3s ease, transform 0.1s ease;
        }

        .btn-login:hover:not(:disabled) {
          background-color: var(--color-red-dark);
        }

        .btn-login:active:not(:disabled) {
          transform: translateY(1px);
        }

        .btn-login:disabled {
          background-color: var(--color-red-dark);
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-login.loading {
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* UI Halaman Login */}
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>Admin Access</h2>
            <p>CV Amanah Elektronik</p>
          </div>

          {error && (
            <div className="login-alert">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                required
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>

            <button 
              type="submit" 
              className={`btn-login ${loading ? 'loading' : ''}`} 
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}