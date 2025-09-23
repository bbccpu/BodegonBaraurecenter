import React from 'react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useDollarRate } from '../context/DollarRateContext';
import { useProducts } from '../context/ProductContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { rate, loading } = useDollarRate();
  const { products } = useProducts();

  // Get real-time product data from context
  const currentProduct = products.find(p => p.id === product.id) || product;

  const priceUSD = currentProduct.price_usd; // Corrected: No fallback to obsolete .price
  const priceBSS = rate ? (priceUSD * rate) : null;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-primary-dark/40 border border-gray-700 transition-all duration-300 transform hover:-translate-y-2 group">
      <img className="w-full h-48 object-cover" src={product.imageUrl} alt={product.name} />
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-light-green transition-colors">{product.name}</h3>
        <p className="text-gray-400 text-sm mb-2">Código: {product.code}</p>
        <div className="flex flex-col gap-1 mb-2">
          <span className="text-primary-orange font-bold text-lg">${priceUSD.toFixed(2)} USD</span>
          <span className="text-green-400 text-sm font-semibold">
            {loading ? 'Cargando tasa...' : priceBSS !== null ? `${priceBSS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'No disponible'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className={`text-xs font-medium ${currentProduct.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
              Stock: {currentProduct.quantity}
            </span>
            <button
              onClick={() => addToCart(currentProduct)}
              disabled={currentProduct.quantity <= 0}
              className={`text-xs font-semibold py-1 px-3 rounded-full transition-colors duration-300 ${
                currentProduct.quantity > 0
                  ? 'bg-gray-700 text-white hover:bg-primary-orange hover:text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentProduct.quantity > 0 ? 'Agregar' : 'Agotado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};