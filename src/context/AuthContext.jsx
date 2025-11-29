import React, { createContext, useState, useEffect } from 'react';

// 🌍 URL MAESTRA
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // --- SERVICIO INTERNO DE AUTH ---
  const authFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('ACCESS_TOKEN') || localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response = await fetch(`${API_URL}/api/${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  };
  // --------------------------------

  const checkAuth = async () => {
    const token = localStorage.getItem('ACCESS_TOKEN') || localStorage.getItem('authToken');
    if (token) {
      try {
        const userData = await authFetch('user'); // Llama a /api/user
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('ACCESS_TOKEN');
        localStorage.removeItem('authToken');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    setErrors(null);
    try {
      // Llama a /api/login
      const data = await authFetch('login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      // Guardamos ambos keys por compatibilidad
      localStorage.setItem('ACCESS_TOKEN', data.token);
      localStorage.setItem('authToken', data.token); 
      
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setErrors(error.errors || { general: error.message || 'Credenciales incorrectas' });
      return false;
    }
  };

  const register = async (userData) => {
    setErrors(null);
    try {
      const data = await authFetch('register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      localStorage.setItem('ACCESS_TOKEN', data.token);
      localStorage.setItem('authToken', data.token);
      
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Register error:', error);
      setErrors(error.errors || { general: error.message || 'Error al registrar' });
      return false;
    }
  };

  const logout = async () => {
    try {
      await authFetch('logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('ACCESS_TOKEN');
      localStorage.removeItem('authToken');
      setUser(null);
      setErrors(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-800">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, register, errors }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;