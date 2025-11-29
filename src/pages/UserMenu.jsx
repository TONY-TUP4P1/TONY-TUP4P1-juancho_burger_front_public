import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search } from 'lucide-react';
import { useData } from '../hooks/useData';

const UserMenu = () => {
  const { menuProducts, addToCart, getCartItemsCount, loadInitialData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const categories = ['Todos', 'Hamburguesas', 'Combos', 'Acompañamientos', 'Bebidas'];

  const safeProducts = Array.isArray(menuProducts) ? menuProducts : [];

  const filteredProducts = safeProducts.filter(product => {
    // 1. Filtro por Texto (Nombre o Descripción)
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. CORRECCIÓN DEL FILTRO DE CATEGORÍA
    let matchesCategory = false;

    if (selectedCategory === 'Todos') {
        matchesCategory = true;
    } else if (selectedCategory === 'Acompañamientos' && product.category === 'Complementos') {
        // ¡AQUÍ ESTÁ EL TRUCO!
        // Si el usuario elige "Acompañamientos", mostramos los que en la BD son "Complementos"
        matchesCategory = true;
    } else {
        // Para el resto (Hamburguesas, Bebidas, Combos) debe coincidir exacto
        matchesCategory = product.category === selectedCategory;
    }

    return matchesSearch && matchesCategory && product.available;
  });

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setNotification(`${product.name} agregado al carrito`);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-gray-800">Nuestro Menú</h2>
          <p className="text-gray-600 mt-1">Descubre nuestros deliciosos productos</p>
        </div>
        <div className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
          <ShoppingCart size={24} />
          <span>{getCartItemsCount()} items</span>
        </div>
      </div>

      {/* Notificación */}
      {notification && (
        <div className="fixed top-24 right-6 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in">
          ✓ {notification}
        </div>
      )}

      {/* Búsqueda */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* Categorías */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all border border-gray-100 hover:scale-105 group">
            
            {/* Imagen del producto */}
            <div className="h-48 w-full bg-gray-200 relative overflow-hidden">
                <img 
                    src={product.image || `https://ui-avatars.com/api/?name=${product.name}&background=random`} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${product.name}&background=random&size=500`;
                    }}
                />
            </div>

            {/* Información del producto */}
            <div className="p-5">
              <div className="mb-3">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  ⏱️ {product.preparationTime || '15 min'}
                </span>
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  ✓ Disponible
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Precio</p>
                  <p className="text-2xl font-bold text-gray-800">S/ {parseFloat(product.price).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center space-x-2 active:scale-95"
                >
                  <Plus size={20} />
                  <span>Agregar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <p className="text-gray-500 text-lg font-medium">No se encontraron productos</p>
          <p className="text-gray-400 text-sm mt-2">Intenta con otra búsqueda o categoría</p>
        </div>
      )}
    </div>
  );
};

export default UserMenu;