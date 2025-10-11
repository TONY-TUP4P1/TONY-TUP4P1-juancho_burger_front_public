import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const Register = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validar campo individual en tiempo real
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value.trim()) {
          error = 'El nombre es obligatorio';
        } else if (value.trim().length < 3) {
          error = 'El nombre debe tener al menos 3 caracteres';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'El email es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Ingrese un email válido';
        }
        break;

      case 'username':
        if (!value.trim()) {
          error = 'El usuario es obligatorio';
        } else if (value.trim().length < 3) {
          error = 'El usuario debe tener al menos 3 caracteres';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          error = 'Solo letras, números y guión bajo';
        }
        break;

      case 'password':
        if (!value) {
          error = 'La contraseña es obligatoria';
        } else if (value.length < 6) {
          error = 'Debe tener al menos 6 caracteres';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          error = 'Confirme su contraseña';
        } else if (value !== formData.password) {
          error = 'Las contraseñas no coinciden';
        }
        break;

      default:
        break;
    }

    return error;
  };

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Validar el campo en tiempo real
    const error = validateField(name, value);
    setErrors({
      ...errors,
      [name]: error
    });

    // Limpiar error general
    setGeneralError('');
  };

  // Validar todo el formulario
  const validateForm = () => {
    const newErrors = {};
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    // Validar formulario completo
    if (!validateForm()) {
      setGeneralError('Por favor corrija los errores antes de continuar');
      return;
    }

    try {
      setLoading(true);
      console.log('📝 Register - Enviando datos:', {
        name: formData.name,
        username: formData.username,
        email: formData.email
      });

      // Enviar solo los datos necesarios (sin confirmPassword)
      const userData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password
      };

      const success = await register(userData);
      
      if (success) {
        alert('✅ ¡Registro exitoso! Ahora puedes iniciar sesión con tus credenciales.');
        onSwitchToLogin();
      }
    } catch (err) {
      console.error('❌ Register - Error:', err);
      
      // Manejar errores del backend
      if (err.errors) {
        // Errores de validación específicos del backend
        const backendErrors = {};
        Object.keys(err.errors).forEach(key => {
          backendErrors[key] = err.errors[key][0]; // Tomar el primer error
        });
        setErrors({ ...errors, ...backendErrors });
        setGeneralError('Hay errores en el formulario. Por favor revíselos.');
      } else {
        setGeneralError(err.message || 'Error al registrar usuario. Por favor intente nuevamente.');
      }
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
            Registro
          </h1>
          <p className="text-gray-600 mt-2 font-medium">Crea tu cuenta en Juancho Burger</p>
        </div>
        
        {generalError && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center space-x-2 animate-pulse">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">{generalError}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 transition-all ${
                errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="Ej: Juan Pérez"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                <span>❌</span>
                <span>{errors.name}</span>
              </p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 transition-all ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="ejemplo@correo.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                <span>❌</span>
                <span>{errors.email}</span>
              </p>
            )}
          </div>
          
          {/* Usuario */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Usuario *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 transition-all ${
                errors.username ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="usuario123"
              disabled={loading}
            />
            {errors.username && (
              <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                <span>❌</span>
                <span>{errors.username}</span>
              </p>
            )}
            {!errors.username && formData.username && (
              <p className="text-xs text-green-600 mt-1 flex items-center space-x-1">
                <span>✅</span>
                <span>Usuario válido</span>
              </p>
            )}
          </div>
          
          {/* Contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 transition-all ${
                errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                <span>❌</span>
                <span>{errors.password}</span>
              </p>
            )}
            {!errors.password && formData.password && formData.password.length >= 6 && (
              <p className="text-xs text-green-600 mt-1 flex items-center space-x-1">
                <span>✅</span>
                <span>Contraseña segura</span>
              </p>
            )}
          </div>
          
          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirmar Contraseña *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 transition-all ${
                errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="Repite tu contraseña"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                <span>❌</span>
                <span>{errors.confirmPassword}</span>
              </p>
            )}
            {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-xs text-green-600 mt-1 flex items-center space-x-1">
                <span>✅</span>
                <span>Las contraseñas coinciden</span>
              </p>
            )}
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
                <span>Registrando...</span>
              </span>
            ) : (
              'Registrarse'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToLogin}
            className="text-red-600 hover:text-red-700 font-semibold hover:underline transition-all"
            disabled={loading}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>

        {/* Requisitos del formulario */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-xs font-bold text-blue-700 mb-2">📋 Requisitos:</p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Nombre: mínimo 3 caracteres</li>
            <li>• Usuario: mínimo 3 caracteres (solo letras, números y _)</li>
            <li>• Email: formato válido (ejemplo@correo.com)</li>
            <li>• Contraseña: mínimo 6 caracteres</li>
            <li>• Las contraseñas deben coincidir</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;