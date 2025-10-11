import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay usuario logueado al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (userData) => {
  try {
    console.log('📝 AuthContext - Intentando registrar:', userData);
    const data = await authService.register(userData);
    console.log('✅ AuthContext - Usuario registrado:', data.user);
    setUser(data.user);
    setError(null);
    return true;
  } catch (error) {
    console.error('❌ AuthContext - Register error:', error);
    
    // Mostrar errores de validación de forma clara
    if (error.errors) {
      const errorMessages = Object.values(error.errors).flat().join('\n');
      setError(errorMessages);
      alert('Errores de validación:\n' + errorMessages);
    } else {
      setError(error.message || 'Error al registrar usuario');
      alert(error.message || 'Error al registrar usuario');
    }
    
    return false;
  }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🍔</div>
          <p className="text-xl font-bold text-gray-800">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;