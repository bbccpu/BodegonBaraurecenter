import React from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';

interface BestSellersCarouselProps {
    products: Product[];
}

export const BestSellersCarousel: React.FC<BestSellersCarouselProps> = ({ products }) => {
    // Duplicate products for a seamless loop
    const extendedProducts = [...products, ...products];

    return (
        <div className="relative w-full overflow-hidden group">
            <div className="flex animate-scroll group-hover:[animation-play-state:paused] whitespace-nowrap">
                {extendedProducts.map((product, index) => (
                    <div key={`${product.id}-${index}`} className="flex-shrink-0 w-64 sm:w-72 mx-2 md:mx-3">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    );
};