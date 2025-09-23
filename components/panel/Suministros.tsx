import React, { useState, useEffect } from 'react';
import { SupplyOrder } from '../../types';
import { supabase } from '../../lib/supabaseClient';

// Modal Component
const AddSupplyOrderModal: React.FC<{ 
    onClose: () => void; 
    onAddOrder: (newOrder: Omit<SupplyOrder, 'id' | 'created_at'>) => Promise<void>; 
}> = ({ onClose, onAddOrder }) => {
    const [supplier, setSupplier] = useState('');
    const [productQuantity, setProductQuantity] = useState<number | string>('');
    const [amountUsd, setAmountUsd] = useState<number | string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numProductQuantity = Number(productQuantity);
        const numAmountUsd = Number(amountUsd);

        if (!supplier || numProductQuantity <= 0 || numAmountUsd <= 0) {
            alert('Por favor, complete todos los campos correctamente.');
            return;
        }
        setIsSubmitting(true);
        try {
            await onAddOrder({
                code: `PBBC${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
                supplier,
                order_date: new Date().toISOString(),
                reception_date: null,
                product_quantity: numProductQuantity,
                amount_usd: String(numAmountUsd),
                status: 'PENDIENTE',
            });
            onClose();
        } catch (error) {
            // The parent component will show the alert.
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-white">Añadir Nuevo Pedido de Suministro</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="supplier" className="block text-sm font-medium text-gray-300 mb-1">Proveedor</label>
                        <input
                            type="text"
                            id="supplier"
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="productQuantity" className="block text-sm font-medium text-gray-300 mb-1">Cantidad de Productos</label>
                        <input
                            type="number"
                            id="productQuantity"
                            value={productQuantity}
                            onChange={(e) => setProductQuantity(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="amountUsd" className="block text-sm font-medium text-gray-300 mb-1">Monto Total (USD)</label>
                        <input
                            type="number"
                            id="amountUsd"
                            step="0.01"
                            value={amountUsd}
                            onChange={(e) => setAmountUsd(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                            {isSubmitting ? 'Guardando...' : 'Añadir Pedido'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main Component
const Suministros: React.FC = () => {
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupplyOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('supply_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching supply orders:', error);
        alert('No se pudieron cargar los pedidos de suministros.');
      } else {
        setSupplyOrders(data || []);
      }
      setLoading(false);
    };

    fetchSupplyOrders();
  }, []);

  const handleAddOrder = async (newOrderData: Omit<SupplyOrder, 'id' | 'created_at'>) => {
    const { data: newOrder, error } = await supabase
      .from('supply_orders')
      .insert(newOrderData)
      .select()
      .single();

    if (error) {
      console.error('Error adding supply order:', error);
      alert(`Error al añadir el pedido: ${error.message}`);
      throw error; 
    }

    if (newOrder) {
      setSupplyOrders(prevOrders => [newOrder, ...prevOrders]);
    }
  };

  const handleConfirmReception = async (orderId: string | number) => {
    const { data: updatedOrder, error } = await supabase
      .from('supply_orders')
      .update({ status: 'ENTREGADO', reception_date: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error confirming reception:', error);
      alert('No se pudo confirmar la recepción del pedido.');
    } else if (updatedOrder) {
      setSupplyOrders(prevOrders =>
        prevOrders.map(order => (order.id === updatedOrder.id ? updatedOrder : order))
      );
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Cargando suministros...</div>;
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Suministros</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary-orange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
        >
          <ion-icon name="add-outline" class="mr-2"></ion-icon>
          Añadir Pedido
        </button>
      </div>

      <div className="overflow-x-auto bg-gray-800 rounded-lg shadow">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Código</th>
              <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Proveedor</th>
              <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Fecha Pedido</th>
              <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Fecha Entrega</th>
              <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Items</th>
              <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Monto (USD)</th>
              <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Estatus</th>
              <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {supplyOrders.map(order => (
              <tr key={order.id} className="hover:bg-gray-700 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">{order.code}</td>
                <td className="px-4 py-3 whitespace-nowrap">{order.supplier}</td>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(order.order_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {order.reception_date ? new Date(order.reception_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{order.product_quantity}</td>
                <td className="px-4 py-3 whitespace-nowrap">${typeof order.amount_usd === 'number' ? order.amount_usd.toFixed(2) : parseFloat(order.amount_usd).toFixed(2)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'ENTREGADO' ? 'bg-green-600 text-green-100' :
                    order.status === 'PENDIENTE' ? 'bg-yellow-600 text-yellow-100' :
                    'bg-red-600 text-red-100'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {order.status === 'PENDIENTE' && (
                    <button
                      onClick={() => handleConfirmReception(order.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm transition-colors"
                    >
                      Confirmar Recepción
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AddSupplyOrderModal
          onClose={() => setModalOpen(false)}
          onAddOrder={handleAddOrder}
        />
      )}
    </div>
  );
};

export default Suministros;