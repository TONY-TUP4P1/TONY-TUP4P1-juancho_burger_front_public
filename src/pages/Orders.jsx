import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Store, Truck } from 'lucide-react';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { useData } from '../hooks/useData';
import { orderService } from '../services/orderService';

const Orders = () => {
  const { addOrder, updateOrder, deleteOrder } = useData();
  const [orders, setOrders] = useState([]); // Estado local para pedidos
  const [showModal, setShowModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ table: '', type: 'Salón', items: '', total: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Cargar todos los pedidos
  const cargarPedidos = async () => {
    try {
      console.log('📋 Orders - Cargando pedidos...');
      setLoading(true);
      const allOrders = await orderService.getAllOrders();
      console.log('✅ Orders - Pedidos cargados:', allOrders);
      console.log('✅ Orders - Cantidad:', allOrders.length);
      setOrders(allOrders);
    } catch (error) {
      console.error('❌ Orders - Error al cargar pedidos:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    console.log('📋 Orders - Componente montado');
    cargarPedidos();
  }, []);

  // Función para mostrar items (compatible con string y array)
  const displayItems = (items) => {
    if (Array.isArray(items)) {
      return items.map(item => `${item.name} x${item.quantity}`).join(', ');
    }
    return items || 'Sin items';
  };

  const handleAddOrder = async () => {
    if (!newOrder.table || !newOrder.items || !newOrder.total) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      console.log('📦 Admin - Creando pedido manual...');
      
      const orderData = {
        userId: 1, // ID del admin
        table: newOrder.table,
        type: newOrder.type,
        items: newOrder.items,
        total: parseFloat(newOrder.total),
        deliveryAddress: newOrder.type === 'Delivery' ? newOrder.table : null,
        paymentMethod: 'Efectivo',
        notes: 'Pedido creado por administrador',
      };

      console.log('📋 Datos a enviar:', orderData);
      
      await addOrder(orderData);
      
      setNewOrder({ table: '', type: 'Salón', items: '', total: '' });
      setShowModal(false);
      
      // Recargar pedidos
      cargarPedidos();
      
      alert('¡Pedido creado exitosamente!');
    } catch (error) {
      console.error('❌ Error al crear pedido:', error);
      alert('Error al crear el pedido: ' + (error.message || 'Por favor intenta nuevamente'));
    }
  };

  const updateOrderStatus = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    const statusFlow = { pending: 'preparing', preparing: 'ready', ready: 'delivered' };
    if (order && statusFlow[order.status]) {
      try {
        await updateOrder(orderId, { status: statusFlow[order.status] });
        // Actualizar localmente
        setOrders(orders.map(o => 
          o.id === orderId ? { ...o, status: statusFlow[order.status] } : o
        ));
      } catch (error) {
        console.error('❌ Error al actualizar estado:', error);
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('¿Está seguro de eliminar este pedido?')) {
      try {
        await deleteOrder(orderId);
        // Actualizar localmente
        setOrders(orders.filter(o => o.id !== orderId));
      } catch (error) {
        console.error('❌ Error al eliminar pedido:', error);
      }
    }
  };

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = order.table?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id?.toString().includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const activeOrdersCount = (orders || []).filter(o => o.status !== 'delivered').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-gray-800">Gestión de Pedidos</h2>
          <p className="text-gray-600 mt-1">RF01: Registro de pedidos en salón y delivery</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm font-semibold text-blue-600">{activeOrdersCount} pedidos activos</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-600">{orders?.length || 0} total</span>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg"
        >
          <Plus size={20} />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por mesa o ID de pedido..."
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="preparing">En Preparación</option>
            <option value="ready">Listos</option>
            <option value="delivered">Entregados</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">ID</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Mesa/Ubicación</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Items</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Total</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Hora</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-800">#{order.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {order.type === 'Delivery' ? <Truck size={16} className="text-orange-500" /> : <Store size={16} className="text-purple-500" />}
                        <span className="font-medium text-gray-700">{order.table}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        order.type === 'Salón' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {displayItems(order.items)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-800">S/ {parseFloat(order.total).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.time}</td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        status={order.status} 
                        text={
                          order.status === 'pending' ? 'Pendiente' : 
                          order.status === 'preparing' ? 'En Preparación' : 
                          order.status === 'ready' ? 'Listo' : 'Entregado'
                        } 
                        type="order" 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {order.status !== 'delivered' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline"
                          >
                            Siguiente
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No se encontraron pedidos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear pedido */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setNewOrder({ table: '', type: 'Salón', items: '', total: '' });
        }}
        title="Nuevo Pedido"
        onSave={handleAddOrder}
        saveButtonText="Guardar Pedido"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Mesa/Ubicación *</label>
          <input
            type="text"
            value={newOrder.table}
            onChange={(e) => setNewOrder({...newOrder, table: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Ej: Mesa 3 o Delivery Av. Real"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Pedido *</label>
          <select
            value={newOrder.type}
            onChange={(e) => setNewOrder({...newOrder, type: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option>Salón</option>
            <option>Delivery</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Items del Pedido *</label>
          <textarea
            value={newOrder.items}
            onChange={(e) => setNewOrder({...newOrder, items: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Ej: Hamburguesa Clásica x2, Papas Medianas x1"
            rows="4"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Total (S/) *</label>
          <input
            type="number"
            value={newOrder.total}
            onChange={(e) => setNewOrder({...newOrder, total: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">
            💡 <strong>Tip:</strong> Como administrador puedes registrar pedidos manualmente para el salón o delivery
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Orders;