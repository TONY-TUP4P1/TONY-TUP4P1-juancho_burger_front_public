import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, X, MapPin, CreditCard, Tag } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';

const UserCart = () => {
  // Traemos 'promotions' del contexto
  const { cart, removeFromCart, updateCartQuantity, getCartTotal, clearCart, addOrder, promotions } = useData();
  const { user } = useAuth();
  
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [orderType, setOrderType] = useState('Delivery');
  const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.find(a => a.default) || null);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [notes, setNotes] = useState('');
  
  // 1. ESTADO PARA LA PROMOCIÓN
  const [appliedPromo, setAppliedPromo] = useState(null);
  
  const [addressForm, setAddressForm] = useState({
    street: '',
    number: '',
    district: '',
    reference: ''
  });
  const [addressErrors, setAddressErrors] = useState({});

  // 2. CÁLCULOS MATEMÁTICOS (Con Descuento)
  const subtotal = parseFloat(getCartTotal()) || 0;
  const deliveryFee = orderType === 'Delivery' ? 5 : 0;
  
  // Calculamos el descuento si hay promo seleccionada
  const discount = appliedPromo 
    ? (subtotal * parseFloat(appliedPromo.discount) / 100) 
    : 0;

  // Total final restando el descuento
  const total = subtotal + deliveryFee - discount;

  const distritos = ['Huancayo', 'El Tambo', 'Chilca', 'Pilcomayo', 'Huancan', 'Sapallanga'];

  // 3. FILTRO DE PROMOCIONES ACTIVAS
  const activePromotions = promotions ? promotions.filter(p => p.status === 'active') : [];

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) removeFromCart(productId);
    else updateCartQuantity(productId, newQuantity);
  };

  const validateAddress = () => {
    const errors = {};
    if (orderType === 'Delivery' && !selectedAddress) {
      if (!addressForm.street.trim()) errors.street = 'La calle es obligatoria';
      if (!addressForm.number.trim()) errors.number = 'El número es obligatorio';
      if (!addressForm.district) errors.district = 'Selecciona un distrito';
    }
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    if (!validateAddress()) return;

    let deliveryAddr = 'Para recoger en local';
    if (orderType === 'Delivery') {
      if (selectedAddress) {
        deliveryAddr = selectedAddress.address;
      } else {
        deliveryAddr = `${addressForm.street} ${addressForm.number}, ${addressForm.district} (Ref: ${addressForm.reference})`;
      }
    }

    // Traducción para el backend (Salón/Delivery)
    const backendType = orderType === 'Delivery' ? 'Delivery' : 'Salón';

    const orderData = {
      user_id: user.id,
      total: total, // Este total ya tiene el descuento restado
      type: backendType,
      status: 'pending',
      payment_method: paymentMethod,
      delivery_address: deliveryAddr,
      notes: notes,
      table: orderType === 'Delivery' ? 'Delivery' : 'Para Recoger',
      
      // 4. ENVIAMOS LA PROMOCIÓN A LA BASE DE DATOS
      applied_promo: appliedPromo ? `${appliedPromo.name} (-${appliedPromo.discount}%)` : null,
      
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price)
      }))
    };

    try {
      await addOrder(orderData);
      
      clearCart();
      setShowCheckoutModal(false);
      setAddressForm({ street: '', number: '', district: '', reference: '' });
      setNotes('');
      setAppliedPromo(null); // Limpiamos la promo
      alert('✅ ¡Pedido realizado con éxito!');
      
    } catch (error) {
      console.error("Error checkout:", error);
      alert('Hubo un problema al procesar tu pedido.');
    }
  };

  const handleUseNewAddress = () => {
    setSelectedAddress(null);
    setAddressForm({ street: '', number: '', district: '', reference: '' });
  };

  return (
    <div className="space-y-6 relative animate-fade-in">
      <div>
        <h2 className="text-4xl font-bold text-gray-800">Mi Carrito</h2>
        <p className="text-gray-600 mt-1">Revisa tu pedido antes de continuar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de productos */}
        <div className="lg:col-span-2 space-y-4">
          {!cart || cart.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h3>
            </div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex items-center gap-4">
                    <div className="bg-orange-100 w-20 h-20 rounded-xl flex items-center justify-center text-4xl overflow-hidden">
                        {item.image && item.image.startsWith('http') ? <img src={item.image} alt={item.name} className="w-full h-full object-cover"/> : '🍔'}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                        <p className="text-red-600 font-bold">S/ {parseFloat(item.price).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500"><Trash2/></button>
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} className="p-1"><Minus size={16}/></button>
                            <span className="font-bold px-2">{item.quantity}</span>
                            <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="p-1"><Plus size={16}/></button>
                        </div>
                    </div>
                </div>
              ))}
              <button onClick={clearCart} className="text-red-600 font-bold w-full text-center mt-4">Vaciar Carrito</button>
            </>
          )}
        </div>

        {/* Resumen */}
        <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 h-fit sticky top-24">
                <h3 className="font-bold text-lg mb-4">Resumen</h3>
                
                <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>S/ {subtotal.toFixed(2)}</span>
                    </div>
                    
                    {deliveryFee > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>Delivery</span>
                            <span>S/ {deliveryFee.toFixed(2)}</span>
                        </div>
                    )}

                    {/* MOSTRAR DESCUENTO */}
                    {appliedPromo && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>Descuento ({appliedPromo.name})</span>
                            <span>- S/ {discount.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div className="border-t pt-3 flex justify-between font-bold text-xl text-gray-800">
                    <span>Total</span>
                    <span>S/ {total.toFixed(2)}</span>
                </div>
                
                <button
                onClick={() => setShowCheckoutModal(true)}
                disabled={cart.length === 0}
                className="w-full mt-6 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:shadow-lg transition-all"
                >
                Proceder al Pago
                </button>
            </div>

            {/* SELECCIÓN DE PROMOCIONES */}
            {activePromotions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Tag size={18} className="text-orange-500"/> Promociones
                    </h3>
                    <div className="space-y-2">
                        {activePromotions.map(promo => (
                            <button
                                key={promo.id}
                                onClick={() => setAppliedPromo(appliedPromo?.id === promo.id ? null : promo)}
                                className={`w-full p-3 rounded-xl text-left border transition-all ${
                                    appliedPromo?.id === promo.id 
                                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500' 
                                    : 'border-gray-200 hover:border-orange-300'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-sm text-gray-700">{promo.name}</span>
                                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                                        -{promo.discount}%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{promo.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Modal Checkout (Igual que antes) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-white z-10">
                <h2 className="text-xl font-bold">Finalizar Pedido</h2>
                <button onClick={() => setShowCheckoutModal(false)}><X/></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 bg-gray-50/50">
                {/* Tipo de Pedido */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block font-bold text-sm mb-2 text-gray-700">Tipo de Pedido</label>
                    <select 
                        value={orderType} 
                        onChange={(e) => setOrderType(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                        <option value="Delivery">Delivery</option>
                        <option value="Recoger en Local">Recoger en Local</option>
                    </select>
                </div>

                {/* Dirección */}
                {orderType === 'Delivery' && (
                    <div className="space-y-3">
                        <label className="block font-bold text-sm text-gray-700">Dirección de Entrega</label>
                        {user?.addresses?.length > 0 && (
                            <div className="grid gap-2">
                                {user.addresses.map(addr => (
                                    <div key={addr.id} onClick={() => setSelectedAddress(addr)} 
                                        className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 ${selectedAddress?.id === addr.id ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'bg-white hover:bg-gray-50'}`}>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAddress?.id === addr.id ? 'border-orange-500' : 'border-gray-400'}`}>
                                            {selectedAddress?.id === addr.id && <div className="w-2 h-2 bg-orange-500 rounded-full"/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{addr.label}</p>
                                            <p className="text-xs text-gray-500">{addr.address}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <button onClick={handleUseNewAddress} className="text-orange-600 text-sm font-bold hover:underline mb-2 block">+ Usar otra dirección</button>

                        {(!selectedAddress || !user?.addresses?.length) && (
                            <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 shadow-sm">
                                <input placeholder="Calle / Av." value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"/>
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Número" value={addressForm.number} onChange={e => setAddressForm({...addressForm, number: e.target.value})} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"/>
                                    <select value={addressForm.district} onChange={e => setAddressForm({...addressForm, district: e.target.value})} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none">
                                        <option value="">Seleccionar Distrito</option>
                                        {distritos.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <input placeholder="Referencia (Ej: Frente al parque)" value={addressForm.reference} onChange={e => setAddressForm({...addressForm, reference: e.target.value})} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"/>
                            </div>
                        )}
                    </div>
                )}

                {/* Pago y Notas */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div>
                        <label className="block font-bold text-sm mb-2 text-gray-700">Método de Pago</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none">
                            <option value="Efectivo">Efectivo</option>
                            <option value="Yape">Yape</option>
                            <option value="Plin">Plin</option>
                            <option value="Tarjeta">Tarjeta (Contraentrega)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-bold text-sm mb-2 text-gray-700">Notas Adicionales</label>
                        <textarea 
                            placeholder="Ej: Sin cebolla, extra salsa..." 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)}
                            className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                            rows="2"
                        />
                    </div>
                </div>

                {/* Resumen Final Modal */}
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex justify-between items-center">
                    <span className="text-orange-800 font-medium">Total a Pagar</span>
                    <span className="text-2xl font-bold text-orange-600">S/ {total.toFixed(2)}</span>
                </div>
            </div>

            <div className="p-5 border-t bg-white z-10 flex justify-end gap-3">
                <button onClick={() => setShowCheckoutModal(false)} className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleCheckout} className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                    Confirmar Pedido
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCart;