import React, { useState, useEffect } from 'react';
import { useDollarRate } from '../../context/DollarRateContext';

// Define the shape of a supply order based on a subset of the database schema
export interface SupplyOrderForm {
    code: string;
    supplier: string;
    order_date: string;
    reception_date: string | null;
    product_quantity: number;
    amount_usd: number;
    status: 'PENDIENTE' | 'EN TRANSITO' | 'ENTREGADO' | 'CANCELADO';
}

interface AddSupplyOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newOrder: Omit<SupplyOrderForm, 'reception_date' | 'status'>) => void;
}

const initialFormData: Omit<SupplyOrderForm, 'reception_date' | 'status'> = {
    code: '',
    supplier: '',
    order_date: new Date().toISOString().split('T')[0], // Default to today
    product_quantity: 0,
    amount_usd: 0,
};

export const AddSupplyOrderModal: React.FC<AddSupplyOrderModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [amountBss, setAmountBss] = useState('0.00');
    const { rate: dollarRate, loading: rateLoading } = useDollarRate();

    useEffect(() => {
        // Reset form when modal opens
        if (isOpen) {
            setFormData({...initialFormData, order_date: new Date().toISOString().split('T')[0]});
            setAmountBss('0.00');
        }
    }, [isOpen]);

    // Auto-calculate BSS amount from USD amount
    useEffect(() => {
        if (formData.amount_usd && dollarRate) {
            const calculatedBss = (formData.amount_usd * dollarRate).toFixed(2);
            setAmountBss(calculatedBss);
        } else {
            setAmountBss('0.00');
        }
    }, [formData.amount_usd, dollarRate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' && value !== '' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code || !formData.supplier || !formData.order_date) {
            alert('Por favor, complete los campos obligatorios: Código, Proveedor y Fecha del Pedido.');
            return;
        }
        const finalOrder = {
            ...formData,
            product_quantity: Number(formData.product_quantity) || 0,
            amount_usd: Number(formData.amount_usd) || 0,
        };
        onSubmit(finalOrder);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4 relative border border-gray-700 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <ion-icon name="close-outline" style={{ fontSize: '24px' }}></ion-icon>
                </button>
                <h2 className="text-2xl font-bold text-center mb-6">Añadir Nueva Orden de Suministro</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">Código de Orden</label>
                            <input id="code" name="code" type="text" value={formData.code} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" placeholder="Ej: PBBC00001" required />
                        </div>
                        <div>
                            <label htmlFor="supplier" className="block text-sm font-medium text-gray-300 mb-1">Proveedor</label>
                            <input id="supplier" name="supplier" type="text" value={formData.supplier} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" placeholder="Nombre del proveedor" required />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="order_date" className="block text-sm font-medium text-gray-300 mb-1">Fecha que se Pide</label>
                        <input id="order_date" name="order_date" type="date" value={formData.order_date} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="amount_usd" className="block text-sm font-medium text-gray-300 mb-1">Cantidad (USD)</label>
                            <input id="amount_usd" name="amount_usd" type="number" value={formData.amount_usd} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" step="0.01" min="0" placeholder="0.00" required />
                        </div>
                        <div>
                            <label htmlFor="amount_bss" className="block text-sm font-medium text-gray-300 mb-1">Cantidad (BSS)</label>
                            <input id="amount_bss" name="amount_bss" type="text" value={rateLoading ? 'Cargando tasa...' : amountBss} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-gray-400" readOnly />
                            {dollarRate && <span className="text-xs text-gray-400 mt-1">Tasa: {dollarRate.toFixed(2)} Bs/USD</span>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="product_quantity" className="block text-sm font-medium text-gray-300 mb-1">Cantidad de Productos</label>
                        <input id="product_quantity" name="product_quantity" type="number" value={formData.product_quantity} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" min="0" required />
                    </div>

                    <button type="submit" className="w-full bg-primary-orange text-white font-bold py-3 px-4 rounded-md hover:bg-orange-600 transition-colors duration-300 mt-6">
                        Guardar Orden de Suministro
                    </button>
                </form>
            </div>
        </div>
    );
};
