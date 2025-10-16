import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate, Outlet, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { MegaMenu } from './components/MegaMenu';
import { DollarRateBanner } from './components/DollarRateBanner';
import { StatusButtons } from './components/StatusButtons';
import { BestSellersCarousel } from './components/BestSellersCarousel';
import { ProductGrid } from './components/ProductGrid';
import { AuthModal } from './components/AuthModal';
import { TermsModal } from './components/TermsModal';
import { categories } from './data/categories';
import UserPanelLayout from './components/panel/UserPanelLayout';
import Profile from './components/panel/Profile';
import Caja from './components/panel/Caja';
import Stock from './components/panel/Stock';
import GenericTableView from './components/panel/GenericTableView';
import Resumen from './components/panel/Resumen';
import Analytics from './components/panel/Analytics';
import Clientes from './components/panel/Clientes';
import Pedidos from './components/panel/Pedidos';
import Pagos from './components/panel/Pagos';
import Usuarios from './components/panel/Usuarios';
import Suministros from './components/panel/Suministros';
import { payments as initialPayments } from './data/panelData';
import { initialCustomers } from './data/customerData';
import { initialOrders } from './data/orderData';
import { initialProducts } from './data/initialProducts';

import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProductProvider, useProducts } from './context/ProductContext';
// import { ThemeSwitcher } from './components/ThemeSwitcher';
import { CartPage } from './components/CartPage';
import { SocialLinks } from './components/SocialLinks';
import { BackgroundProvider } from './context/BackgroundContext';
// import { BackgroundSwitcher } from './components/BackgroundSwitcher';
import './types';
import { Product, Customer, Order, User, UserRole } from './types';
import { supabase } from './lib/supabaseClient'; // Import Supabase client

// Helper to manage localStorage (will be phased out)
const usePersistentState = (key: string, defaultValue: any) => {
    const [state, setState] = useState(() => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    return [state, setState];
};


const MemoizedHome = React.memo(() => {
  const { products } = useProducts();

  return (
    <div className="text-center p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Bienvenido a Bodegón Baraure Center 2025 C.A</h1>
      <p className="text-md md:text-lg text-gray-300 mb-6">Su tienda de confianza para víveres, licores y más. Use el menú para explorar nuestras categorías.</p>

      {/* Best Sellers Section */}
      <div className="mt-8 md:mt-12 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Productos Más Vendidos</h2>
          <BestSellersCarousel products={products.filter(p => p.isBestSeller)} />
      </div>

      {/* All Products Section */}
      <div className="mt-8 md:mt-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Todos los Productos</h2>
          <ProductGrid products={products} />
      </div>
    </div>
  );
});

const CategoryView = () => {
    const navigate = useNavigate();
    const { subcategorySlug } = useParams();
    const { products } = useProducts();

    const subcategoryProducts = products.filter(p =>
        p.subcategory.toLowerCase().replace(/\s+/g, '-') === subcategorySlug
    );
    const subcategoryName = categories
        .flatMap(cat => cat.subcategories)
        .find(sub => sub.name.toLowerCase().replace(/\s+/g, '-') === subcategorySlug)?.name || 'Categoría';

    return (
        <div className="p-4 md:p-8">
            <div className="mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                    <ion-icon name="arrow-back-outline" className="mr-1"></ion-icon>
                    Volver
                </button>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-6">{subcategoryName}</h1>
            <ProductGrid products={subcategoryProducts} />
        </div>
    );
};

const MemoizedStoreLayout = React.memo(({ onRegisterClick, onSearch, searchQuery, filteredProducts, userRole, isMenuOpen, onMenuClose }: { onRegisterClick: () => void; onSearch: (query: string) => void; searchQuery: string; filteredProducts: Product[]; userRole: UserRole | null; isMenuOpen: boolean; onMenuClose: () => void }) => {
    const { products } = useProducts();
    return (
        <>
            <main className="flex">
                <MegaMenu
                    categories={categories}
                    isOpen={isMenuOpen}
                    onClose={onMenuClose}
                />
                <div className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    {/* Banner de tasa oficial eliminado, solo queda el del header */}
                    <StatusButtons userRole={userRole} />
                    {searchQuery.trim() ? (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Resultados de la búsqueda para "{searchQuery}"</h2>
                            {filteredProducts.length > 0 ? (
                                <ProductGrid products={filteredProducts} />
                            ) : (
                                <p>No se encontraron productos.</p>
                            )}
                        </div>
                    ) : (
                        <Routes>
                            <Route path="/" element={<MemoizedHome />} />
                            <Route path="/category/:subcategorySlug" element={<CategoryView />} />
                        </Routes>
                    )}
                </div>
            </main>
        </>
    );
});

const ProtectedRoute = ({ isLoggedIn, userRole, children }: { isLoggedIn: boolean; userRole: UserRole | null; children: React.ReactNode }) => {
    // Allow access if logged in and has any role (T1, T2, T3)
    if (!isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    // T1 users can only access their profile
    if (userRole === 'T1' && !window.location.hash.endsWith('/panel/profile')) {
        return <Navigate to="/panel/profile" replace />;
    }

    return children;
};

interface AppProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    isLoggedIn: boolean;
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    userRole: UserRole | null;
    setUserRole: React.Dispatch<React.SetStateAction<UserRole | null>>;
}

const App: React.FC<AppProps> = ({ products, setProducts, isLoggedIn, setIsLoggedIn, userRole, setUserRole }) => {
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);
    const [isTermsModalOpen, setTermsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    
    // Persist panel data (to be migrated)
    const [payments] = usePersistentState('bbc-payments', initialPayments);
    const [customers, setCustomers] = usePersistentState('bbc-customers', initialCustomers);
    const [orders, setOrders] = usePersistentState('bbc-orders', initialOrders);

    const handleLoginSuccess = () => {
        setAuthModalOpen(false);
        // Navigation is now handled by the onAuthStateChange listener
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            setIsLoggedIn(false);
            setUserRole(null);
            navigate('/');
        } catch (error) {
            console.error('Error during logout:', error);
            // Force logout even if there's an error
            setIsLoggedIn(false);
            setUserRole(null);
            navigate('/');
        }
    };


    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const lowercasedQuery = searchQuery.toLowerCase();
        return products.filter(product =>
            product.name.toLowerCase().includes(lowercasedQuery) ||
            product.code.toLowerCase().includes(lowercasedQuery) ||
            product.category.toLowerCase().includes(lowercasedQuery) ||
            product.subcategory.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, products]);
    
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    return (
        <div className="min-h-screen font-sans">
            <Header
                onRegisterClick={() => setAuthModalOpen(true)}
                onSearch={handleSearch}
                isLoggedIn={isLoggedIn}
                onLogout={handleLogout}
                onMenuClick={() => setMenuOpen(true)}
            />
             <Routes>
                <Route path="/cart" element={<CartPage />} />
                <Route path="/*" element={
                    <MemoizedStoreLayout
                        onRegisterClick={() => setAuthModalOpen(true)}
                        onSearch={handleSearch}
                        searchQuery={searchQuery}
                        filteredProducts={filteredProducts}
                        userRole={userRole}
                        isMenuOpen={isMenuOpen}
                        onMenuClose={() => setMenuOpen(false)}
                    />
                } />
                <Route path="/panel/*" element={
                    <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole}>
                        <UserPanelLayout userRole={userRole}>
                            <Routes>
                                <Route path="profile" element={<Profile />} />
                                <Route path="caja" element={<Caja />} />
                                <Route path="stock" element={<Stock />} />
                                <Route path="pagos" element={<Pagos />} />
                                <Route path="suministros" element={<Suministros />} />
                                <Route path="resumen" element={<Resumen />} />
                                <Route path="analytic" element={<Analytics />} />

                                {/* New Admin Routes */}
                                <Route path="clientes" element={<Clientes />} />
                                <Route path="pedidos" element={<Pedidos userRole={userRole} />} />
                                <Route path="usuarios" element={<Usuarios />} />

                            </Routes>
                        </UserPanelLayout>
                    </ProtectedRoute>
                } />
            </Routes>
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setAuthModalOpen(false)}
                onTermsClick={() => {
                    setAuthModalOpen(false);
                    setTermsModalOpen(true);
                }}
                onLoginSuccess={handleLoginSuccess}
            />
            <TermsModal 
                isOpen={isTermsModalOpen}
                onClose={() => setTermsModalOpen(false)}
            />
            <SocialLinks />
            <div className="fixed bottom-4 left-4 z-50 flex space-x-3">
              {/* <ThemeSwitcher /> */}
              {/* <BackgroundSwitcher /> */}
            </div>
        </div>
    );
};

import { DollarRateProvider } from './context/DollarRateContext';
const AppWithProviders: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const navigate = useNavigate();
    const authInitialized = useRef(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data, error } = await supabase.from('products').select('*');
                if (error) {
                    console.error('Error fetching products from Supabase:', error);
                    setProducts([]);
                } else {
                    console.log('Products loaded from Supabase:', data?.length || 0);
                    setProducts(data || []);
                }
            } catch (err) {
                console.error('Unexpected error fetching products:', err);
                setProducts([]);
            }
        };
        fetchProducts();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!authInitialized.current) {
                console.log('Auth event:', _event);
                console.log('Session:', session);
                authInitialized.current = true;
            }
            const loggedIn = !!session;
            setIsLoggedIn(loggedIn);

            if (loggedIn) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (!authInitialized.current) {
                    console.log('Profile fetch result:', { profile, error });
                }

                if (error) {
                    console.error("Error fetching profile:", error);
                    setUserRole(null);
                } else if (profile) {
                    const role = profile.role as UserRole;
                    setUserRole(role);
                    // On initial sign-in, redirect based on role
                    if (_event === 'SIGNED_IN') {
                        switch (role) {
                            case 'T3':
                                navigate('/panel/resumen');
                                break;
                            case 'T2':
                                navigate('/panel/caja');
                                break;
                            case 'T1':
                                navigate('/panel/profile');
                                break;
                            default:
                                navigate('/');
                        }
                    }
                } else {
                    // Profile doesn't exist, set default role T1
                    console.warn("Profile not found for user, setting default role T1");
                    setUserRole('T1');
                }
            } else {
                setUserRole(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    return (
        <ProductProvider initialProducts={products}>
            <App
                products={products}
                setProducts={setProducts}
                isLoggedIn={isLoggedIn}
                setIsLoggedIn={setIsLoggedIn}
                userRole={userRole}
                setUserRole={setUserRole}
            />
        </ProductProvider>
    );
};

const Root = () => (
    <HashRouter>
        <CartProvider>
            <ThemeProvider>
                <BackgroundProvider>
                    <DollarRateProvider>
                        <NotificationProvider userRole={null}>
                            <AppWithProviders />
                        </NotificationProvider>
                    </DollarRateProvider>
                </BackgroundProvider>
            </ThemeProvider>
        </CartProvider>
    </HashRouter>
)

export default Root;
