import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 1. AGREGAMOS ESTO: Estado para manejar errores y pasarlos al formulario
  const [errors, setErrors] = useState(null);

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
    setErrors(null); // Limpiamos errores previos
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      // Guardamos el error para mostrarlo en el login si es necesario
      setErrors(error.response?.data?.errors || { general: 'Credenciales incorrectas' });
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setErrors(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (userData) => {
    setErrors(null); // Limpiar errores antes de intentar
    try {
      console.log('📝 AuthContext - Intentando registrar:', userData);
      const data = await authService.register(userData);
      console.log('✅ AuthContext - Usuario registrado:', data.user);
      
      setUser(data.user);
      return true;

    } catch (error) {
      console.error('❌ AuthContext - Register error:', error);
      
      // 2. CORRECCIÓN: Usamos setErrors (que ya existe) en lugar de setError (que no existía)
      // Intentamos capturar los errores tal como los manda Laravel
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors({ general: error.message || 'Error al registrar usuario' });
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
    // 3. EXPORTAMOS 'errors': Para que Register.jsx pueda leerlos
    <AuthContext.Provider value={{ user, setUser, login, logout, register, errors }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;