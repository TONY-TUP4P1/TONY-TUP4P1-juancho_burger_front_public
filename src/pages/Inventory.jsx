import React, { useState, useEffect } from 'react';
import ProductForm from '../components/products/ProductForm';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['all', 'Hamburguesas', 'Bebidas', 'Complementos', 'Postres', 'Ensaladas', 'Combos'];

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  // Función auxiliar para obtener el token correcto siempre
  const getToken = () => localStorage.getItem('ACCESS_TOKEN') || localStorage.getItem('authToken');

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/products', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success || response.ok) {
        setProducts(data.data || data); // Soporte para ambas estructuras de respuesta
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/products/stats/all', {
        headers: {
          'Authorization': `Bearer ${getToken()}`, // CORREGIDO: Usaba 'token' antes
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success || response.ok) {
        setStats(data.data || data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Está seguro de eliminar este producto?')) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        fetchProducts();
        fetchStats();
      } else {
        alert('Error al eliminar el producto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  };

  // --- CORRECCIÓN PRINCIPAL AQUÍ ---
  const handleToggleAvailability = async (product) => {
    // 1. Actualización Optimista: Cambiamos la UI inmediatamente para que se sienta rápido
    const updatedProducts = products.map(p => 
      p.id === product.id ? { ...p, available: !p.available } : p
    );
    setProducts(updatedProducts);

    try {
      // 2. Llamada a la API
      // Nota: Si tu backend no tiene la ruta 'toggle-availability', usa un PUT normal a /products/{id}
      const response = await fetch(`http://127.0.0.1:8000/api/products/${product.id}/toggle-availability`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getToken()}`, // CORREGIDO: Antes decía 'token' y fallaba
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Falló la actualización en servidor');
      }
      
      // Actualizamos estadísticas en segundo plano
      fetchStats();

    } catch (error) {
      console.error('Error al cambiar disponibilidad:', error);
      // Si falla, revertimos los cambios recargando la lista original
      fetchProducts();
      alert('No se pudo cambiar la disponibilidad. Verifica tu conexión.');
    }
  };

  const handleFormSuccess = () => {
    fetchProducts();
    fetchStats();
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
            <span className="text-4xl">📦</span>
            <span>Gestión de Inventario</span>
          </h1>
          <p className="text-gray-600 mt-1">Administra los productos del menú</p>
        </div>
        <button
          onClick={handleCreateProduct}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center space-x-2"
        >
          <span className="text-xl">➕</span>
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Productos</p>
                <p className="text-3xl font-bold mt-2">{stats.total_products || 0}</p>
              </div>
              <span className="text-5xl opacity-80">📊</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Disponibles</p>
                <p className="text-3xl font-bold mt-2">{stats.available_products || 0}</p>
              </div>
              <span className="text-5xl opacity-80">✅</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">No Disponibles</p>
                <p className="text-3xl font-bold mt-2">{stats.unavailable_products || 0}</p>
              </div>
              <span className="text-5xl opacity-80">❌</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Precio Promedio</p>
                <p className="text-3xl font-bold mt-2">S/. {parseFloat(stats.average_price || 0).toFixed(2)}</p>
              </div>
              <span className="text-5xl opacity-80">💰</span>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🔍 Buscar producto
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏷️ Filtrar por categoría
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Producto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Categoría</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Precio</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Ventas</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <span className="text-6xl">📭</span>
                      <p className="mt-4 text-lg font-medium">No se encontraron productos</p>
                      <p className="text-sm mt-2">Intenta con otros filtros o crea uno nuevo</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image || `https://ui-avatars.com/api/?name=${product.name}&background=random`}
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${product.name}&background=random&color=fff`;
                          }}
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{product.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {product.description || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">S/. {parseFloat(product.price).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700">{product.sales || 0}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleAvailability(product)} // Pasamos el objeto completo
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          product.available
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {product.available ? '✅ Disponible' : '❌ No disponible'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default Inventory;