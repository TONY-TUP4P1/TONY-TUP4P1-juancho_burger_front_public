import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. CONFIGURACIÓN DE URL CENTRALIZADA (Vital para Vercel/InfinityFree)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [menuProducts, setMenuProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [users, setUsers] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2. PERSISTENCIA DEL CARRITO (Nuevo: No perder datos al recargar)
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Cargar datos iniciales al montar
  useEffect(() => {
    loadInitialData();
  }, []);

  // Helper para Headers con Token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('ACCESS_TOKEN') || localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Usamos Promise.all para cargar todo junto y rápido
      const [productsRes, inventoryRes, promosRes] = await Promise.all([
        fetch(`${API_URL}/api/products`, { headers: getAuthHeaders() }), // Menú
        fetch(`${API_URL}/api/products`, { headers: getAuthHeaders() }), // Inventario (mismo endpoint)
        fetch(`${API_URL}/api/promotions`, { headers: getAuthHeaders() }) // Promos
      ]);

      // 1. Productos del Menú
      if (productsRes.ok) {
        const data = await productsRes.json();
        const validData = Array.isArray(data) ? data : (data.data || []);
        // Filtramos solo los disponibles para el menú del cliente
        setMenuProducts(validData.filter(p => p.available));
      }

      // 2. Inventario (Todos los productos)
      if (inventoryRes.ok) {
        const data = await inventoryRes.json();
        const validData = Array.isArray(data) ? data : (data.data || []);
        setProducts(validData);
      }

      // 3. Promociones
      if (promosRes.ok) {
        const data = await promosRes.json();
        const validData = Array.isArray(data) ? data : (data.data || []);
        setPromotions(validData);
      }

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err);
      // Evitamos pantallas blancas
      setMenuProducts([]);
      setProducts([]);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  // --- ORDERS ---
  const addOrder = async (orderData) => {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      const responseData = await response.json();
      // Agregamos la orden nueva a la lista local
      setOrders([responseData.data || responseData, ...orders]);
      return responseData;
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  };

  const updateOrder = async (orderId, updates) => {
    try {
      // Si hay cambio de status
      if (updates.status) {
        await fetch(`${API_URL}/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: updates.status })
        });
      }
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      ));
    } catch (err) {
      console.error('Error updating order:', err);
      throw err;
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      console.error('Error deleting order:', err);
      throw err;
    }
  };

  const loadUserOrders = async (userId) => {
    if (!userId) return;
    try {
      console.log('🔄 DataContext - loadUserOrders:', userId);
      const response = await fetch(`${API_URL}/api/orders/user/${userId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const validOrders = Array.isArray(data) ? data : [];
        setOrders(validOrders);
        console.log('✅ Pedidos cargados:', validOrders.length);
      }
    } catch (err) {
      console.error('❌ Error loading user orders:', err);
    }
  };

  const loadAllOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const validOrders = Array.isArray(data) ? data : [];
        setOrders(validOrders);
        
        // Lógica extra para extraer usuarios únicos para reportes
        const uniqueUsers = [];
        const seenIds = new Set();
        validOrders.forEach(order => {
            if (order.user && !seenIds.has(order.user.id)) {
                seenIds.add(order.user.id);
                uniqueUsers.push(order.user);
            }
        });
        setUsers(uniqueUsers);
      }
    } catch (err) {
      console.error('❌ Error loading all orders:', err);
    }
  };
  
  // --- PRODUCTS / INVENTORY ---
  const updateProduct = async (productId, updates) => {
    // Nota: Mantenemos la lógica pero llamamos directo a la API
    // Si la actualización es stock/disponibilidad:
    try {
        // Asumimos que es toggle availability o edición general
        // Si necesitas endpoints específicos, ajusta aquí. Por ahora un PUT genérico:
        /* await fetch(`${API_URL}/api/products/${productId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updates)
        });
        */
        // Actualizamos localmente para UI rápida
        setProducts(products.map(product => 
            product.id === productId ? { ...product, ...updates } : product
        ));
    } catch (err) {
        console.error('Error updating product:', err);
        throw err;
    }
  };

  // --- PROMOTIONS ---
  const addPromotion = async (promotionData) => {
    try {
      const response = await fetch(`${API_URL}/api/promotions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(promotionData)
      });
      
      if(response.ok) {
          const newPromo = await response.json();
          setPromotions([...promotions, newPromo.data || newPromo]);
          // Recargamos para asegurar sincronización
          loadInitialData();
          return newPromo;
      }
    } catch (err) {
      console.error('Error creating promotion:', err);
      throw err;
    }
  };

  const updatePromotion = async (promoId, updates) => {
    try {
      await fetch(`${API_URL}/api/promotions/${promoId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      setPromotions(promotions.map(promo => 
        promo.id === promoId ? { ...promo, ...updates } : promo
      ));
      loadInitialData();
    } catch (err) {
      console.error('Error updating promotion:', err);
      throw err;
    }
  };

  const deletePromotion = async (promoId) => {
    try {
      await fetch(`${API_URL}/api/promotions/${promoId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setPromotions(promotions.filter(promo => promo.id !== promoId));
    } catch (err) {
      console.error('Error deleting promotion:', err);
      throw err;
    }
  };

  // --- USERS (Registro local en contexto) ---
  const registerUser = (userData) => {
    // Esta función se mantiene para compatibilidad con tu código anterior,
    // pero idealmente AuthContext debería manejar el registro real a la API.
    const newUser = {
      ...userData,
      id: Math.max(...users.map(u => u.id), 0) + 1,
      role: 'user',
      registeredDate: new Date().toISOString().split('T')[0],
      addresses: []
    };
    setUsers([...users, newUser]);
    return newUser;
  };

  // --- CART FUNCTIONS (Lógica intacta) ---
  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    orders, setOrders, addOrder, updateOrder, deleteOrder, loadUserOrders, loadAllOrders,
    products, setProducts, updateProduct,
    menuProducts, setMenuProducts,
    promotions, setPromotions, addPromotion, updatePromotion, deletePromotion,
    users, registerUser,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal, getCartItemsCount,
    loading, error, loadInitialData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe ser usado dentro de un DataProvider');
  }
  return context;
};

export default DataContext;