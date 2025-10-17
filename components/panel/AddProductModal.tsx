import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '../../types';
import { categories } from '../../data/categories';
import { useDollarRate } from '../../context/DollarRateContext';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newProduct: Omit<Product, 'id' | 'code'>) => void;
  scannedCode: string | null;
  manualMode?: boolean;
}

const initialFormData = {
    name: '',
    barcode: '',
    price_usd: 0,
    quantity: 0,
    category: categories[0]?.name || '',
    subcategory: categories[0]?.subcategories[0]?.name || '',
    imageurl: '',
    isbestseller: false,
    weight: 0,
    weight_unit: 'unid',
    iva_status: 'N' as 'E' | 'N', // Default to No exento
};

const weightUnits = ['unid', 'kg', 'g', 'l', 'ml'];

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSubmit, scannedCode, manualMode }) => {
    const [formData, setFormData] = useState<Omit<Product, 'id' | 'code'>>(initialFormData);
    const [priceBss, setPriceBss] = useState('0.00');
    const { rate: dolarRate, loading: rateLoading } = useDollarRate();

    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setPriceBss('0.00');
    }, []);

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen, resetForm]);

    // Auto-calculate BSS price from USD price
    useEffect(() => {
        if (formData.price_usd && dolarRate) {
            const calculatedBss = (formData.price_usd * dolarRate).toFixed(2);
            setPriceBss(calculatedBss);
        }
         else {
            setPriceBss('0.00');
        }
    }, [formData.price_usd, dolarRate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            const parsedValue = (e.target as HTMLInputElement).type === 'number' && value !== '' ? parseFloat(value) : value;
            setFormData(prev => ({ ...prev, [name]: parsedValue }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Formulario enviado. Verificando datos..."); // TRACER 1

        if (!formData.name || !formData.category || !formData.subcategory) {
            alert("Por favor, complete los campos obligatorios: Nombre, Categoría y Subcategoría.");
            return;
        }
        // Ensure numeric values are numbers, not strings
        const finalProduct: Omit<Product, 'id' | 'code'> = {
            ...formData,
            price_usd: Number(formData.price_usd) || 0,
            quantity: Number(formData.quantity) || 0,
            weight: Number(formData.weight) || 0,
            weight_unit: formData.weight_unit || 'unid',
            imageurl: formData.imageurl || `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`,
            iva_status: formData.iva_status || 'N',
        };

        console.log("Llamando a onSubmit del modal con el producto:", finalProduct); // TRACER 2
        onSubmit(finalProduct);
        onClose(); // Close modal on successful submit
    };

    if (!isOpen) return null;

    const subcategoryOptions = categories.find(c => c.name === formData.category)?.subcategories || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4 relative border border-gray-700 max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <ion-icon name="close-outline" style={{ fontSize: '24px' }}></ion-icon>
                </button>
                <h2 className="text-2xl font-bold text-center mb-6">{manualMode ? 'Añadir Nuevo Producto' : 'Completar Datos del Producto'}</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">Código Producto</label>
                            <input id="code" name="code" type="text" value={'Asignado Automáticamente'} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-gray-400" readOnly />
                        </div>
                        <div>
                            <label htmlFor="barcode" className="block text-sm font-medium text-gray-300 mb-1">Código de Barra/QR (Opcional)</label>
                            <input id="barcode" name="barcode" type="text" value={formData.barcode} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" placeholder="Escanear o escribir" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nombre del Producto</label>
                        <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price_usd" className="block text-sm font-medium text-gray-300 mb-1">Precio (USD)</label>
                            <input id="price_usd" name="price_usd" type="number" value={formData.price_usd} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" step="0.01" min="0" placeholder="0.00" required />
                        </div>
                        <div>
                            <label htmlFor="price_bss" className="block text-sm font-medium text-gray-300 mb-1">Precio (BSS)</label>
                            <input id="price_bss" name="price_bss" type="text" value={rateLoading ? 'Cargando tasa...' : priceBss} className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-gray-400" readOnly />
                            {dolarRate && <span className="text-xs text-gray-400 mt-1">Tasa: {dolarRate.toFixed(2)} Bs/USD</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-1">Cantidad en Inventario</label>
                            <input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" min="0" required />
                        </div>
                         <div>
                              <label htmlFor="imageurl" className="block text-sm font-medium text-gray-300 mb-1">URL de la Imagen (Opcional)</label>
                              <input id="imageurl" name="imageurl" type="text" value={formData.imageurl} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" placeholder="https://ejemplo.com/imagen.png" />
                          </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-1">Peso (Opcional)</label>
                            <input id="weight" name="weight" type="number" value={formData.weight} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" step="0.001" min="0" placeholder="Ej: 1.250" />
                        </div>
                        <div>
                            <label htmlFor="weight_unit" className="block text-sm font-medium text-gray-300 mb-1">Unidad de Peso</label>
                            <select id="weight_unit" name="weight_unit" value={formData.weight_unit} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white">
                                {weightUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                            <select id="category" name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white">
                                {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-300 mb-1">Subcategoría</label>
                            <select id="subcategory" name="subcategory" value={formData.subcategory} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white" required>
                                {subcategoryOptions.map(sub => <option key={sub.name} value={sub.name}>{sub.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label htmlFor="iva_status" className="block text-sm font-medium text-gray-300 mb-1">Estado IVA</label>
                            <select id="iva_status" name="iva_status" value={formData.iva_status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-500 rounded-md py-2 px-3 text-white">
                                <option value="N">No Exento (Se cobra IVA)</option>
                                <option value="E">Exento (Sin IVA)</option>
                            </select>
                        </div>
                        <div className="flex items-center">
                            <label htmlFor="isbestseller" className="flex items-center text-sm text-gray-300">
                                <input id="isbestseller" name="isbestseller" type="checkbox" checked={formData.isbestseller} onChange={handleChange} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-primary-orange focus:ring-primary-orange" />
                                <span className="ml-2">Marcar como Más Vendido</span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-primary-orange text-white font-bold py-3 px-4 rounded-md hover:bg-orange-600 transition-colors duration-300 mt-6">
                        Guardar Producto
                    </button>
                </form>
            </div>
        </div>
    );
};
