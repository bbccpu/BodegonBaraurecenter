
import React, { useState } from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
}

const INITIAL_PRODUCTS = 20;
const LOAD_MORE_INCREMENT = 20;
const MAX_BEFORE_PAGINATION = 100;

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_PRODUCTS);
  const [currentPage, setCurrentPage] = useState(1);
  const [usePagination, setUsePagination] = useState(false);

  if (products.length === 0) {
    return <p className="text-center text-gray-400">No hay productos para mostrar en esta categoría.</p>;
  }

  const handleLoadMore = () => {
    const newCount = visibleCount + LOAD_MORE_INCREMENT;
    if (newCount >= MAX_BEFORE_PAGINATION) {
      setUsePagination(true);
      setVisibleCount(MAX_BEFORE_PAGINATION);
      setCurrentPage(1);
    } else {
      setVisibleCount(newCount);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  let currentProducts: Product[];
  let totalPages = 1;
  let startIndex = 0;
  let endIndex = visibleCount;

  if (usePagination) {
    const PRODUCTS_PER_PAGE = 50; // Larger page size for pagination
    totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
    startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    endIndex = Math.min(startIndex + PRODUCTS_PER_PAGE, products.length);
    currentProducts = products.slice(startIndex, endIndex);
  } else {
    currentProducts = products.slice(0, visibleCount);
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Load More / Pagination Controls */}
      <div className="flex flex-col items-center mt-8 space-y-4">
        {!usePagination && visibleCount < products.length && (
          <button
            onClick={handleLoadMore}
            className="px-6 py-3 bg-primary-orange text-white font-bold rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <ion-icon name="add-circle-outline"></ion-icon>
            <span>Ver Más Productos</span>
          </button>
        )}

        {usePagination && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const page = i + 1;
                const showEllipsis = totalPages > 10 && i === 7;
                const showLastPages = totalPages > 10 && i >= 8;

                if (showEllipsis) {
                  return (
                    <span key="ellipsis" className="px-2 py-2 text-gray-400">
                      ...
                    </span>
                  );
                }

                if (showLastPages) {
                  const actualPage = totalPages - (9 - i);
                  if (actualPage <= 0) return null;
                  return (
                    <button
                      key={actualPage}
                      onClick={() => handlePageChange(actualPage)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        actualPage === currentPage
                          ? 'bg-primary-orange text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {actualPage}
                    </button>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      page === currentPage
                        ? 'bg-primary-orange text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Progress indicator */}
        <div className="text-center text-gray-400 text-sm">
          {!usePagination ? (
            <span>Mostrando {visibleCount} de {products.length} productos</span>
          ) : (
            <span>
              Mostrando {startIndex + 1}-{endIndex} de {products.length} productos
              {totalPages > 1 && ` (Página ${currentPage} de ${totalPages})`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
