import React, { useState, useEffect } from 'react';
import type { Order, UserRole } from '../../types';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../../types';
import { supabase } from '../../lib/supabaseClient';
import { useDollarRate } from '../../context/DollarRateContext';

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'Completado': return 'bg-green-500/20 text-green-400';
    case 'En Proceso': return 'bg-blue-500/20 text-blue-400';
    case 'Pendiente': return 'bg-yellow-500/20 text-yellow-400';
    case 'Cancelado': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const OrderDetailModal: React.FC<{
    order: Order & { showInvoice?: boolean; processed_at?: string; created_by?: string };
    onClose: () => void;
    onStatusChange: (orderId: string, newStatus: Order['status']) => void;
    canModifyStatus: boolean;
}> = ({ order, onClose, onStatusChange, canModifyStatus }) => {
    const { rate, loading: rateLoading } = useDollarRate();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4 relative border border-gray-700 max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <ion-icon name="close-outline" style={{ fontSize: '24px' }}></ion-icon>
                </button>
                <h2 className="text-2xl font-bold mb-4">Detalles del Pedido <span className="text-primary-orange">{order.payment_reference || order.id.slice(0, 8)}...</span></h2>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div><strong>Cliente:</strong> {order.customerName}</div>
                    <div><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString('es-ES')}</div>
                    <div><strong>ID Cliente:</strong> {order.customerId || 'N/A'}</div>
                    <div className="flex items-center gap-2">
                        <strong>Estado:</strong>
                        {canModifyStatus ? (
                            <select
                                value={order.status}
                                onChange={(e) => onStatusChange(order.id, e.target.value as Order['status'])}
                                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Proceso">En Proceso</option>
                                <option value="Completado">Completado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        )}
                    </div>
                </div>

                {/* Payment Information */}
                {order.payment_method && (
                    <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                        <h3 className="font-bold mb-2">Información de Pago</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Método:</strong> {order.payment_method}</div>
                            <div><strong>Referencia:</strong> {order.payment_reference}</div>
                            <div><strong>Email:</strong> {order.customer_email || 'No proporcionado'}</div>
                            <div><strong>Estado Pago:</strong> {order.payment_status || 'pending'}</div>
                        </div>
                        {order.payment_instructions && (
                            <div className="mt-2">
                                <strong>Instrucciones:</strong>
                                <p className="text-sm text-gray-300 mt-1">{order.payment_instructions}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Shipping Information */}
                {(order.shipping_name || order.shipping_lastname) && (
                    <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                        <h3 className="font-bold mb-2">Información de Envío</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Nombre:</strong> {order.shipping_name} {order.shipping_lastname}</div>
                            <div><strong>Cédula:</strong> {order.shipping_id}</div>
                            <div><strong>Teléfono:</strong> {order.shipping_phone}</div>
                        </div>
                    </div>
                )}

                <div className="flex-grow overflow-y-auto border-t border-b border-gray-700 py-4">
                    <h3 className="font-bold mb-2">Artículos del Pedido</h3>
                    <table className="w-full text-left">
                        <thead><tr className="border-b border-gray-600"><th className="p-2">Producto</th><th className="p-2">Cant.</th><th className="p-2">Precio Unit.</th><th className="p-2 text-right">Subtotal</th></tr></thead>
                        <tbody>
                            {order.items.map((item, index) => (
                                <tr key={`${item.productId}-${index}`}>
                                    <td className="p-2">{item.productName}</td>
                                    <td className="p-2">{item.quantity}</td>
                                    <td className="p-2">${item.price.toFixed(2)}</td>
                                    <td className="p-2 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 text-right space-y-2">
                    <p className="text-2xl font-bold">Total USD: <span className="text-primary-orange">${order.total.toFixed(2)}</span></p>
                    <p className="text-xl font-bold text-green-400">
                        Total Bs: {rateLoading ? 'Cargando...' : rate ? `${(order.total * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'No disponible'}
                    </p>
                    {order.showInvoice && order.status === 'Completado' && (
                        <div className="mt-6 p-4 bg-white text-black rounded-lg font-mono text-sm border-2 border-gray-300">
                            <div className="text-center border-b-2 border-black pb-2 mb-2">
                                <div className="font-bold text-lg">BODEGON BARAURE CENTER 2025 C.A</div>
                                <div>RIF: J-3507270106</div>
                            </div>

                            <div className="mb-2">
                                <div><strong>Factura:</strong> {order.payment_reference}</div>
                                <div><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString('es-VE')}</div>
                                <div><strong>Hora:</strong> {new Date(order.processed_at || order.date).toLocaleTimeString('es-VE')}</div>
                                <div><strong>Cliente:</strong> {order.customerName || 'Cliente General'}</div>
                                {order.shipping_id && <div><strong>CI:</strong> {order.shipping_id}</div>}
                                <div><strong>Usuario:</strong> {order.created_by || 'Sistema'}</div>
                            </div>

                            <div className="border-t border-b border-black py-2 my-2">
                                <div className="grid grid-cols-3 gap-2 font-bold mb-1">
                                    <div>Producto</div>
                                    <div className="text-center">Cant</div>
                                    <div className="text-right">Total</div>
                                </div>
                                {order.items.map((item: any, index: number) => (
                                    <div key={index} className="grid grid-cols-3 gap-2 text-sm">
                                        <div className="truncate">{item.productName.substring(0, 15)}</div>
                                        <div className="text-center">{item.quantity}</div>
                                        <div className="text-right">{((item.price * rate) * item.quantity).toFixed(0)}Bs</div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-right font-bold text-lg">
                                TOTAL: {(order.total * rate).toFixed(0)} Bs
                            </div>

                            <div className="mt-2 text-xs">
                                <div><strong>Método:</strong> {order.payment_method?.substring(0, 25) || 'N/A'}</div>
                                {order.payment_reference && <div><strong>Ref:</strong> {order.payment_reference}</div>}
                            </div>

                            <div className="text-center text-xs mt-2 border-t border-black pt-2">
                                Gracias por su preferencia!<br/>
                                Factura válida para crédito fiscal
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface PedidosProps {
  userRole: UserRole | null;
}

const Pedidos: React.FC<PedidosProps> = ({ userRole }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { showInvoice?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const { rate, loading: rateLoading } = useDollarRate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000); // Limit to prevent performance issues

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      // Transform the data to match our Order interface
      const transformedOrders: Order[] = (data || []).map(order => ({
        id: order.id,
        customerName: order.customername,
        customerId: order.customerid,
        date: order.date,
        total: order.total,
        status: order.status,
        items: order.items || [],
        payment_method: order.payment_method,
        payment_reference: order.payment_reference,
        customer_email: order.customer_email,
        payment_instructions: order.payment_instructions,
        payment_status: order.payment_status,
        shipping_name: order.shipping_name,
        shipping_lastname: order.shipping_lastname,
        shipping_id: order.shipping_id,
        shipping_phone: order.shipping_phone,
        processed_at: order.processed_at,
        created_by: order.created_by
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'Completado') {
        updateData.payment_status = 'completed';
      }
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        alert('Error al actualizar el estado del pedido');
        return;
      }

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      // Update modal if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? {...prev, status: newStatus} : null);
      }
    } catch (error) {
      console.error('Error in handleStatusChange:', error);
      alert('Error al actualizar el estado del pedido');
    }
  };

  const canModifyStatus = (order: Order) => {
    // T3 (Admin) puede modificar cualquier pedido
    // T2 (Cajero) puede modificar pedidos que no estén completados o cancelados
    // T1 no tiene acceso a este panel
    if (userRole === 'T3') {
      return true;
    }
    if (userRole === 'T2') {
      return order.status !== 'Completado' && order.status !== 'Cancelado';
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Gestión de Pedidos de Clientes</h1>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 font-semibold">ID Pedido</th>
                <th className="p-4 font-semibold">ID Cliente</th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Total</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4 font-mono text-sm text-gray-400">{order.payment_reference || order.id.slice(0, 8)}...</td>
                  <td className="p-4 font-mono text-sm text-gray-400">{order.customerId || 'N/A'}</td>
                  <td className="p-4 font-medium">{order.customerName}</td>
                  <td className="p-4 text-gray-300">{new Date(order.date).toLocaleDateString('es-ES')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-primary-orange">${order.total.toFixed(2)}</td>
                  <td className="p-4 text-center space-x-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Ver Detalles
                    </button>
                    {order.status === 'Completado' && (
                      <button
                        onClick={() => setSelectedOrder({...order, showInvoice: true})}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                      >
                        Ver Factura
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusChange={handleStatusChange}
            canModifyStatus={canModifyStatus(selectedOrder)}
        />
      )}
    </div>
  );
};

export default Pedidos;
