import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const Login = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones en el frontend
    if (!credentials.username || !credentials.password) {
      setError('Por favor complete todos los campos');
      return;
    }

    if (credentials.username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return;
    }

    if (credentials.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 Login - Intentando login con:', credentials.username);
      
      const success = await login(credentials);
      
      if (!success) {
        setError('Usuario o contraseña incorrectos');
      }
      // Si el login es exitoso, el usuario será redirigido automáticamente
    } catch (err) {
      console.error('❌ Login - Error:', err);
      setError('Usuario o contraseña incorrectos. Por favor verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-5xl">🍔</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Juancho Burger
          </h1>
          <p className="text-gray-600 mt-2 font-medium">Sistema de Gestión Empresarial</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center space-x-2 animate-shake">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Usuario *
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => {
                setCredentials({...credentials, username: e.target.value});
                setError(''); // Limpiar error al escribir
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              placeholder="Ingrese su usuario"
              disabled={loading}
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña *
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => {
                setCredentials({...credentials, password: e.target.value});
                setError(''); // Limpiar error al escribir
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              placeholder="Ingrese su contraseña"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Iniciando sesión...</span>
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToRegister}
            disabled={loading}
            className="text-red-600 hover:text-red-700 font-semibold hover:underline transition-all disabled:opacity-50"
          >
            ¿No tienes cuenta? Regístrate aquí
          </button>
        </div>

        
        
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2025 Juancho Burger - Sistema de Gestión v1.0
        </p>
      </div>
    </div>
  );
};

export default Login;