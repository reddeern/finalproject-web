import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [admin, setAdmin] = useState(null);

  async function login(admin_username, password) {
    const res = await api.post('/login', { admin_username, password });
    const { access_token, admin: adminData } = res.data.data;

    localStorage.setItem('token', access_token);
    setToken(access_token);
    setAdmin(adminData);

    return res.data;
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ token, admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}