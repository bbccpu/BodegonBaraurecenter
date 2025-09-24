import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';

interface ProductContextType {
  products: Product[];
  updateProduct: (productId: number, updates: Partial<Product>) => void;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

interface ProductProviderProps {
  children: ReactNode;
  initialProducts: Product[];
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children, initialProducts }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Update products when initialProducts changes
  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Product change detected:', payload);

          // Transform database fields to match Product type
          const transformProduct = (dbProduct: any): Product => ({
            id: dbProduct.id,
            name: dbProduct.name,
            code: dbProduct.code,
            barcode: dbProduct.barcode,
            price_usd: dbProduct.price_usd,
            quantity: dbProduct.quantity,
            category: dbProduct.category,
            subcategory: dbProduct.subcategory,
            imageUrl: dbProduct.imageurl,
            isBestSeller: dbProduct.isbestseller,
            weight: dbProduct.weight,
            weight_unit: dbProduct.weight_unit
          });

          if (payload.eventType === 'UPDATE') {
            const updatedProduct = transformProduct(payload.new);
            setProducts(prevProducts => {
              const existingProductIndex = prevProducts.findIndex(p => p.id === updatedProduct.id);

              if (existingProductIndex >= 0) {
                // Product exists in current list
                if (updatedProduct.quantity > 0) {
                  // Still has stock, update it
                  return prevProducts.map(product =>
                    product.id === updatedProduct.id ? { ...product, ...updatedProduct } : product
                  );
                } else {
                  // Stock went to 0, remove from visible products
                  return prevProducts.filter(product => product.id !== updatedProduct.id);
                }
              } else {
                // Product not in current list
                if (updatedProduct.quantity > 0) {
                  // Now has stock, add it to visible products
                  return [...prevProducts, updatedProduct];
                }
                // If quantity is 0, do nothing (stays hidden)
                return prevProducts;
              }
            });
          } else if (payload.eventType === 'INSERT') {
            // Add new product only if it has stock
            const newProduct = transformProduct(payload.new);
            if (newProduct.quantity > 0) {
              setProducts(prevProducts => [...prevProducts, newProduct]);
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted product
            setProducts(prevProducts =>
              prevProducts.filter(product => product.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateProduct = (productId: number, updates: Partial<Product>) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId ? { ...product, ...updates } : product
      )
    );
  };

  const refreshProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, barcode, price_usd, imageurl as imageUrl, category, subcategory, isbestseller as isBestSeller, quantity, weight, weight_unit as weightUnit, created_at as createdAt')
        .order('name');

      if (error) {
        console.error('Error refreshing products:', error);
        return;
      }

      // Filter out products with zero quantity (out of stock)
      const availableProducts = (data || []).filter(product => product.quantity > 0);
      setProducts(availableProducts);
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  };

  const value: ProductContextType = {
    products,
    updateProduct,
    refreshProducts
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};
