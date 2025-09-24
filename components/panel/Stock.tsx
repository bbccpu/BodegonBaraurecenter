import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../types';
import { Product } from '../../types';
import { ScannerModal } from './ScannerModal';
import { AddProductModal } from './AddProductModal';
import { useDollarRate } from '../../context/DollarRateContext';
import { useProducts } from '../../context/ProductContext';
import { supabase } from '../../lib/supabaseClient';

const Stock: React.FC = () => {
    const navigate = useNavigate();
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [scannedCode, setScannedCode] = useState<string | null>(null);
    const [isManualAddOpen, setManualAddOpen] = useState(false);
    const { products, updateProduct, refreshProducts } = useProducts();
    
    const handleExport = () => {
        const data = products;
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                        cell = `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'gestion_de_stock.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleScanSuccess = (code: string) => {
        setScannerOpen(false);
        const productExists = products.some(p => p.code === code);
        if (productExists) {
            alert(`El producto con el código ${code} ya existe en el inventario.`);
        } else {
            setScannedCode(code);
        }
    };

    const handleAddProductFromScan = async (newProduct: Omit<Product, 'id' | 'code'>) => {
        if (scannedCode) {
            try {
                // Generate sequential code
                const existingCodes = products.map(p => parseInt(p.code.replace('BBC', ''), 10)).filter(n => !isNaN(n));
                const nextId = Math.max(0, ...existingCodes) + 1;
                const newCode = `BBC${String(nextId).padStart(4, '0')}`;

                // Transform keys to match database column names
                const dbProduct = {
                    name: newProduct.name,
                    code: newCode,
                    barcode: scannedCode, // Use scanned code as barcode
                    price_usd: newProduct.price_usd,
                    quantity: newProduct.quantity,
                    category: newProduct.category,
                    subcategory: newProduct.subcategory,
                    imageurl: newProduct.imageUrl,
                    isbestseller: newProduct.isBestSeller,
                    weight: newProduct.weight,
                    weight_unit: newProduct.weight_unit
                };

                const { data, error } = await supabase
                    .from('products')
                    .insert([dbProduct])
                    .select()
                    .single();

                if (error) {
                    console.error('Error adding product:', error);
                    alert('Error al añadir producto: ' + error.message);
                } else {
                    // The context will automatically update via real-time subscription
                    console.log('Product added successfully:', data);
                    // Fallback: refresh products to ensure UI updates
                    refreshProducts();
                }
            } catch (error) {
                console.error('Error adding product:', error);
                alert('Error al añadir producto');
            }
        }
        setScannedCode(null); // Close modal
    };

    const handleManualAddProduct = async (newProduct: Omit<Product, 'id' | 'code'>) => {
        // Generate a new code for the manually added product
        const existingCodes = products.map(p => parseInt(p.code.replace('BBC', ''), 10)).filter(n => !isNaN(n));
        const nextId = Math.max(0, ...existingCodes) + 1;
        const newCode = `BBC${String(nextId).padStart(4, '0')}`;

        try {
            // Transform keys to match database column names
            const dbProduct = {
                name: newProduct.name,
                code: newCode,
                barcode: newProduct.barcode,
                price_usd: newProduct.price_usd,
                quantity: newProduct.quantity,
                category: newProduct.category,
                subcategory: newProduct.subcategory,
                imageurl: newProduct.imageUrl,
                isbestseller: newProduct.isBestSeller,
                weight: newProduct.weight,
                weight_unit: newProduct.weight_unit
            };

            const { data, error } = await supabase
                .from('products')
                .insert([dbProduct])
                .select()
                .single();

            if (error) {
                console.error('Error adding product:', error);
                alert('Error al añadir producto: ' + error.message);
            } else {
                // The context will automatically update via real-time subscription
                console.log('Product added successfully:', data);
                // Fallback: refresh products to ensure UI updates
                refreshProducts();
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Error al añadir producto');
        }
        setManualAddOpen(false); // Close modal
    };

    const handleQuantityChange = async (productId: number, newQuantityStr: string) => {
        const newQuantity = parseInt(newQuantityStr, 10);
        if (!isNaN(newQuantity)) {
            try {
                const { error } = await supabase
                    .from('products')
                    .update({ quantity: newQuantity })
                    .eq('id', productId.toString());

                if (error) {
                    console.error('Error updating quantity:', error);
                    alert('Error al actualizar cantidad');
                } else {
                    // The context will automatically update via real-time subscription
                    updateProduct(productId, { quantity: newQuantity });
                }
            } catch (error) {
                console.error('Error updating quantity:', error);
                alert('Error al actualizar cantidad');
            }
        }
    };

    const handlePriceChange = async (productId: number, newPriceStr: string) => {
        const newPrice = parseFloat(newPriceStr);
        if (!isNaN(newPrice) && newPrice >= 0) {
            try {
                const { error } = await supabase
                    .from('products')
                    .update({ price_usd: newPrice })
                    .eq('id', productId.toString());

                if (error) {
                    console.error('Error updating price:', error);
                    alert('Error al actualizar precio');
                } else {
                    // The context will automatically update via real-time subscription
                    updateProduct(productId, { price_usd: newPrice });
                }
            } catch (error) {
                console.error('Error updating price:', error);
                alert('Error al actualizar precio');
            }
        }
    };

    const { rate, loading } = useDollarRate();
    return (
        <div>
            <div className="mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                    <ion-icon name="arrow-back-outline" className="mr-1"></ion-icon>
                    Volver
                </button>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-white">Gestión de Stock</h1>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => setScannerOpen(true)}
                        className="flex items-center bg-vinotinto text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors duration-300"
                    >
                        <ion-icon name="qr-code-outline" className="mr-2"></ion-icon>
                        Escanear Código para Añadir
                    </button>
                    <button 
                        onClick={() => setManualAddOpen(true)}
                        className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300"
                    >
                        <ion-icon name="add-circle-outline" className="mr-2"></ion-icon>
                        Añadir Nuevo Producto
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex items-center bg-primary-orange text-white font-bold py-2 px-4 rounded-md hover:bg-orange-600 transition-colors duration-300"
                    >
                        <ion-icon name="download-outline" className="mr-2"></ion-icon>
                        Exportar a CSV
                    </button>
                </div>
            </div>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="p-2 md:p-4 font-semibold">Código</th>
                                <th className="p-2 md:p-4 font-semibold">Producto</th>
                                <th className="hidden sm:table-cell p-4 font-semibold">Categoría</th>
                                <th className="p-2 md:p-4 font-semibold text-right">Precio (USD)</th>
                                <th className="hidden md:table-cell p-4 font-semibold text-right">Precio (BSS)</th>
                                <th className="p-2 md:p-4 font-semibold text-center">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const priceUSD = product.price_usd ?? 0;
                                const priceBSS = rate ? (priceUSD * rate) : null;
                                return (
                                <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-2 md:p-4 text-gray-400 text-sm">{product.code}</td>
                                    <td className="p-2 md:p-4 font-medium text-sm md:text-base">{product.name}</td>
                                    <td className="hidden sm:table-cell p-4 text-gray-300 text-sm">{product.subcategory}</td>
                                    <td className="p-2 text-right">
                                        <input
                                            type="number"
                                            id={`price-${product.id}`}
                                            name="price_usd"
                                            defaultValue={priceUSD.toFixed(2)}
                                            onBlur={(e) => handlePriceChange(product.id, e.target.value)}
                                            className="w-16 md:w-20 bg-gray-700 text-primary-orange text-right rounded border border-gray-600 focus:ring-1 focus:ring-primary-orange focus:border-primary-orange text-sm"
                                            min="0"
                                            step="0.01"
                                            aria-label={`Precio USD de ${product.name}`}
                                        />
                                    </td>
                                    <td className="hidden md:table-cell p-4 text-right text-green-400 font-semibold text-sm">
                                        {loading ? 'Cargando...' : priceBSS !== null ? `${priceBSS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'No disponible'}
                                    </td>
                                    <td className="p-2 text-center">
                                        <input
                                            type="number"
                                            id={`quantity-${product.id}`}
                                            name="quantity"
                                            defaultValue={product.quantity}
                                            onBlur={(e) => handleQuantityChange(product.id, e.target.value)}
                                            className="w-16 md:w-20 bg-gray-700 text-white text-center rounded border border-gray-600 focus:ring-1 focus:ring-primary-orange focus:border-primary-orange text-sm"
                                            min="0"
                                            aria-label={`Cantidad de ${product.name}`}
                                        />
                                    </td>
                                </tr>
                            )})
                        }
                        </tbody>
                    </table>
                </div>
            </div>
            <ScannerModal 
                isOpen={isScannerOpen}
                onClose={() => setScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
            <AddProductModal
                isOpen={!!scannedCode}
                onClose={() => setScannedCode(null)}
                onSubmit={handleAddProductFromScan}
                scannedCode={scannedCode}
            />
            <AddProductModal
                isOpen={isManualAddOpen}
                onClose={() => setManualAddOpen(false)}
                onSubmit={handleManualAddProduct}
                scannedCode={null} // Scanned code is not applicable here
                manualMode={true}
            />
        </div>
    );
};

export default Stock;
