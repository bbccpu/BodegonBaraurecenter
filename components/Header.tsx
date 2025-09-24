import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../types';
// Fix: Changed to a full import to ensure global type declarations for custom JSX elements like 'ion-icon' are loaded.
import { Product } from '../types';
import { DollarRateBanner } from './DollarRateBanner';

interface HeaderProps {
    onRegisterClick: () => void;
    onSearch: (query: string) => void;
    isLoggedIn: boolean;
    onLogout: () => void;
    onMenuClick?: () => void;
}

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');

export const Header: React.FC<HeaderProps> = ({ onRegisterClick, onSearch, isLoggedIn, onLogout, onMenuClick }) => {
    const { products } = useProducts();
    const [query, setQuery] = useState('');
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const { totalItems } = useCart();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        onSearch(newQuery);

        if (newQuery.trim()) {
            const lowercasedQuery = newQuery.toLowerCase();
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(lowercasedQuery) ||
                product.code.toLowerCase().includes(lowercasedQuery)
            ).slice(0, 5); // Limit to 5 results
            setSearchResults(filtered);
            setDropdownVisible(filtered.length > 0);
        } else {
            setSearchResults([]);
            setDropdownVisible(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setDropdownVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    return (
        <header className="bg-gray-800 shadow-lg p-4 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center space-x-2 md:space-x-4">
                {onMenuClick && (
                    <button onClick={onMenuClick} className="md:hidden text-white mr-2">
                        <ion-icon name="menu-outline" style={{fontSize: '28px'}}></ion-icon>
                    </button>
                )}
                  <a href="/#">
                     <Logo />
                 </a>
            </div>

            {/* Buscador y tasa oficial juntos */}
            <div className="flex-1 mx-2 sm:mx-4 flex items-center gap-4" ref={searchContainerRef}>
                <div className="relative w-full max-w-lg mx-auto">
                    <input
                        type="text"
                        id="search-input"
                        name="search"
                        placeholder="Buscar..."
                        value={query}
                        onChange={handleSearchChange}
                        onFocus={() => query.trim() && searchResults.length > 0 && setDropdownVisible(true)}
                        className="w-full bg-gray-700 text-white placeholder-gray-400 border-2 border-transparent focus:border-primary-orange focus:ring-0 rounded-full py-2 pl-10 pr-4 transition-all duration-300 ease-in-out text-sm sm:text-base"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ion-icon name="search-outline" className="text-gray-400"></ion-icon>
                    </div>
                    {isDropdownVisible && searchResults.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-gray-700 rounded-lg shadow-lg overflow-hidden z-50 border border-gray-600">
                            <ul>
                                {searchResults.map(product => (
                                    <li key={product.id}>
                                        <Link
                                            to={`/category/${slugify(product.subcategory)}`}
                                            onClick={() => {
                                                setDropdownVisible(false);
                                                setQuery('');
                                                onSearch('');
                                            }}
                                            className="flex items-center p-3 hover:bg-gray-600 transition-colors"
                                        >
                                            <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-md mr-4 flex-shrink-0" />
                                            <span className="text-white font-medium truncate">{product.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                                {/* Banner de tasa oficial alineado a la derecha del buscador */}
                                <div className="hidden md:block ml-4">
                                    <DollarRateBanner />
                                </div>
                        </div>

            <div className="flex items-center">
                <Link to="/cart" className="relative text-white hover:text-primary-orange transition-colors mr-2 md:mr-4">
                    <ion-icon name="cart-outline" style={{fontSize: '28px', verticalAlign: 'middle'}}></ion-icon>
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-2 bg-vibrant-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {totalItems}
                        </span>
                    )}
                </Link>
                <div className="relative">
                    {isLoggedIn ? (
                        <div className="flex items-center">
                            <button onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="w-10 h-10 rounded-full bg-primary-orange text-white flex items-center justify-center font-bold text-lg">
                                U
                            </button>
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-12 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50">
                                    <Link to="/panel/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">
                                        Panel
                                    </Link>
                                    <button onClick={() => { onLogout(); setUserMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={onRegisterClick}
                            className="bg-primary-orange text-white font-bold py-2 px-3 sm:px-4 md:px-6 rounded-full hover:bg-orange-600 transition-colors duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 text-sm sm:text-base whitespace-nowrap"
                        >
                           <span className="hidden sm:inline">Acceder</span>
                           <span className="sm:hidden"><ion-icon name="log-in-outline" style={{fontSize: '20px', verticalAlign: 'middle'}}></ion-icon></span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
