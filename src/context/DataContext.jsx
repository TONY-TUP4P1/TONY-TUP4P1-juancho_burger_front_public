import React, { createContext, useState, useContext, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { inventoryService } from '../services/inventoryService';
import { promotionService } from '../services/promotionService';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [menuProducts, setMenuProducts] = useState([]); // Iniciado como array vacío
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [users, setUsers] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // --- MODIFICACIÓN: Validación de respuestas de API ---
      
      // 1. Cargar productos del menú
      const productsData = await productService.getAllProducts();
      // Verificamos si es un array o si viene dentro de .data (común en Laravel)
      const validMenuProducts = Array.isArray(productsData) 
          ? productsData 
          : (productsData.data || []);
      setMenuProducts(validMenuProducts);

      // 2. Cargar inventario
      const inventoryData = await inventoryService.getAllInventory();
      const validInventory = Array.isArray(inventoryData) 
          ? inventoryData 
          : (inventoryData.data || []);
      setProducts(validInventory);

      // 3. Cargar promociones
      const promotionsData = await promotionService.getAllPromotions();
      const validPromotions = Array.isArray(promotionsData) 
          ? promotionsData 
          : (promotionsData.data || []);
      setPromotions(validPromotions);

      // ----------------------------------------------------

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err);
      
      // En caso de error, aseguramos arrays vacíos para evitar pantallas blancas
      setMenuProducts([]);
      setProducts([]);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  // ORDERS
  const addOrder = async (orderData) => {
    try {
      const newOrder = await orderService.createOrder(orderData);
      setOrders([newOrder, ...orders]);
      return newOrder;
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  };

  const updateOrder = async (orderId, updates) => {
    try {
      if (updates.status) {
        await orderService.updateOrderStatus(orderId, updates.status);
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
      await orderService.deleteOrder(orderId);
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      console.error('Error deleting order:', err);
      throw err;
    }
  };

  const loadUserOrders = async (userId) => {
    try {
      console.log('🔄 DataContext - loadUserOrders llamado con userId:', userId);
      const userOrders = await orderService.getUserOrders(userId);
      console.log('✅ DataContext - Pedidos recibidos:', userOrders);
      
      // Validación extra para orders
      setOrders(Array.isArray(userOrders) ? userOrders : []);
      
      console.log('✅ DataContext - Estado actualizado');
    } catch (err) {
      console.error('❌ DataContext - Error loading user orders:', err);
      throw err;
    }
  };

    // ⭐ Cargar todos los pedidos (para admin)
  const loadAllOrders = async () => {
    try {
      console.log('🔄 DataContext - Cargando TODOS los pedidos...');
      const allOrders = await orderService.getAllOrders();
      setOrders(Array.isArray(allOrders) ? allOrders : []);
    } catch (err) {
      console.error('❌ DataContext - Error loading all orders:', err);
      throw err;
    }
  };
  
  // PRODUCTS
  const updateProduct = async (productId, updates) => {
    try {
      await inventoryService.updateStock(productId, updates);
      setProducts(products.map(product => 
        product.id === productId ? { ...product, ...updates } : product
      ));
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  // PROMOTIONS
  const addPromotion = async (promotionData) => {
    try {
      const newPromo = await promotionService.createPromotion(promotionData);
      setPromotions([...promotions, newPromo]);
      return newPromo;
    } catch (err) {
      console.error('Error creating promotion:', err);
      throw err;
    }
  };

  const updatePromotion = async (promoId, updates) => {
    try {
      await promotionService.updatePromotion(promoId, updates);
      setPromotions(promotions.map(promo => 
        promo.id === promoId ? { ...promo, ...updates } : promo
      ));
    } catch (err) {
      console.error('Error updating promotion:', err);
      throw err;
    }
  };

  const deletePromotion = async (promoId) => {
    try {
      await promotionService.deletePromotion(promoId);
      setPromotions(promotions.filter(promo => promo.id !== promoId));
    } catch (err) {
      console.error('Error deleting promotion:', err);
      throw err;
    }
  };

  // USERS
  const registerUser = (userData) => {
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

  // CART
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