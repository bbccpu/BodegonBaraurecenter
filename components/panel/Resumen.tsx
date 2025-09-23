import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../../types';
import { supabase } from '../../lib/supabaseClient';

declare const Chart: any; // Using Chart.js from CDN

interface DashboardStats {
    todaySales: number;
    monthlyRevenue: number;
    newCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
    pendingOrders: number;
    completedOrders: number;
    yesterdaySales?: number;
    lastMonthRevenue?: number;
}

interface WeeklySales {
    day: string;
    sales: number;
}

interface CategorySales {
    category: string;
    sales: number;
    percentage: number;
}

const StatCard: React.FC<{ title: string; value: string; icon: string; trend?: string; trendColor?: string }> = ({ title, value, icon, trend, trendColor = 'text-green-400' }) => (
    <div className="bg-gray-800 p-6 rounded-lg flex items-center space-x-4">
        <div className="bg-primary-orange/20 p-3 rounded-full">
            <ion-icon name={icon} className="text-3xl text-primary-orange"></ion-icon>
        </div>
        <div className="flex-1">
            <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-white">{value}</p>
            {trend && <p className={`text-xs ${trendColor}`}>{trend}</p>}
        </div>
    </div>
);

const calculateTrend = (current: number, previous: number): { text: string; color: string } => {
    if (previous === 0) {
        return current > 0 ? { text: '+100%', color: 'text-green-400' } : { text: '0%', color: 'text-gray-400' };
    }

    const percentage = ((current - previous) / previous) * 100;
    const formatted = percentage >= 0 ? `+${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;
    const color = percentage >= 0 ? 'text-green-400' : 'text-red-400';

    return { text: formatted, color };
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
        <div>{children}</div>
    </div>
);

const Resumen: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        todaySales: 0,
        monthlyRevenue: 0,
        newCustomers: 0,
        totalProducts: 0,
        lowStockProducts: 0,
        pendingOrders: 0,
        completedOrders: 0
    });
    const [weeklySales, setWeeklySales] = useState<WeeklySales[]>([]);
    const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [bcvRate, setBcvRate] = useState('Cargando...');
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const weeklySalesChartRef = useRef<HTMLCanvasElement>(null);
    const topCategoriesChartRef = useRef<HTMLCanvasElement>(null);
    const salesTrendChartRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        fetchDashboardData();
        fetchBCVRate();

        // Auto-refresh every 5 minutes
        const interval = setInterval(() => {
            fetchDashboardData();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Get today's date range
            const today = new Date();
            const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

            // Get this month's date range
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

            // Fetch today's sales
            const { data: todayOrders, error: todayError } = await supabase
                .from('orders')
                .select('total')
                .eq('status', 'Completado')
                .gte('date', startOfToday.toISOString())
                .lte('date', endOfToday.toISOString());

            if (todayError) throw todayError;

            const todaySales = todayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

            // Fetch yesterday's sales for comparison
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

            const { data: yesterdayOrders } = await supabase
                .from('orders')
                .select('total')
                .eq('status', 'Completado')
                .gte('date', startOfYesterday.toISOString())
                .lte('date', endOfYesterday.toISOString());

            const yesterdaySales = yesterdayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

            // Fetch monthly revenue
            const { data: monthOrders, error: monthError } = await supabase
                .from('orders')
                .select('total')
                .eq('status', 'Completado')
                .gte('date', startOfMonth.toISOString())
                .lte('date', endOfMonth.toISOString());

            if (monthError) throw monthError;

            const monthlyRevenue = monthOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

            // Fetch last month's revenue for comparison
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

            const { data: lastMonthOrders } = await supabase
                .from('orders')
                .select('total')
                .eq('status', 'Completado')
                .gte('date', lastMonth.toISOString())
                .lte('date', endOfLastMonth.toISOString());

            const lastMonthRevenue = lastMonthOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

            // Fetch new customers this month
            const { data: newCustomersData, error: customersError } = await supabase
                .from('orders')
                .select('customername')
                .gte('date', startOfMonth.toISOString())
                .not('customername', 'is', null);

            if (customersError) throw customersError;

            const uniqueCustomers = new Set(newCustomersData?.map(order => order.customername));
            const newCustomers = uniqueCustomers.size;

            // Fetch total products
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id, quantity')
                .order('id');

            if (productsError) {
                console.error('Products query error:', productsError);
                throw productsError;
            }

            const totalProducts = products?.length || 0;
            const lowStockProducts = products?.filter(p => (p.quantity || 0) <= 5).length || 0;

            console.log('Products data:', { totalProducts, lowStockProducts, productsCount: products?.length });

            // Fetch order counts
            const { data: allOrders, error: ordersError } = await supabase
                .from('orders')
                .select('status');

            if (ordersError) throw ordersError;

            const pendingOrders = allOrders?.filter(o => o.status === 'Pendiente' || o.status === 'En Proceso').length || 0;
            const completedOrders = allOrders?.filter(o => o.status === 'Completado').length || 0;

            setStats({
                todaySales,
                monthlyRevenue,
                newCustomers,
                totalProducts,
                lowStockProducts,
                pendingOrders,
                completedOrders,
                yesterdaySales,
                lastMonthRevenue
            });

            // Fetch weekly sales data
            await fetchWeeklySales();

            // Fetch category sales data
            await fetchCategorySales();

            // Fetch recent orders
            await fetchRecentOrders();

            console.log('Dashboard data loaded successfully:', { stats, weeklySales, categorySales });

            setLastUpdate(new Date());

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentOrders = async () => {
        try {
            const { data: recentOrdersData, error } = await supabase
                .from('orders')
                .select('id, customername, total, status, date, payment_reference')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            setRecentOrders(recentOrdersData || []);
        } catch (error) {
            console.error('Error fetching recent orders:', error);
        }
    };

    const fetchWeeklySales = async () => {
        try {
            const today = new Date();
            const weekData: WeeklySales[] = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

                const { data: dayOrders } = await supabase
                    .from('orders')
                    .select('total')
                    .eq('status', 'Completado')
                    .gte('date', startOfDay.toISOString())
                    .lte('date', endOfDay.toISOString());

                const daySales = dayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

                const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                weekData.push({
                    day: dayNames[date.getDay()],
                    sales: daySales
                });
            }

            setWeeklySales(weekData);
        } catch (error) {
            console.error('Error fetching weekly sales:', error);
        }
    };

    const fetchCategorySales = async () => {
        try {
            // Get all completed orders with items
            const { data: orders, error } = await supabase
                .from('orders')
                .select('items')
                .eq('status', 'Completado');

            if (error) throw error;

            const categoryTotals: { [key: string]: number } = {};

            orders?.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach((item: any) => {
                        // For now, we'll categorize by product name patterns
                        // In a real app, products would have categories
                        const productName = item.productName?.toLowerCase() || '';
                        let category = 'Otros';

                        if (productName.includes('cerveza') || productName.includes('vino') || productName.includes('whisky') || productName.includes('ron')) {
                            category = 'Licores';
                        } else if (productName.includes('arroz') || productName.includes('pasta') || productName.includes('aceite')) {
                            category = 'Despensa';
                        } else if (productName.includes('carne') || productName.includes('pollo') || productName.includes('pescado')) {
                            category = 'Alimentos Frescos';
                        } else if (productName.includes('refresco') || productName.includes('jugo') || productName.includes('agua')) {
                            category = 'Bebidas';
                        }

                        categoryTotals[category] = (categoryTotals[category] || 0) + (item.price * item.quantity);
                    });
                }
            });

            const totalSales = Object.values(categoryTotals).reduce((sum, sales) => sum + sales, 0);

            const categoryData: CategorySales[] = Object.entries(categoryTotals)
                .map(([category, sales]) => ({
                    category,
                    sales,
                    percentage: totalSales > 0 ? (sales / totalSales) * 100 : 0
                }))
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5); // Top 5 categories

            setCategorySales(categoryData);
        } catch (error) {
            console.error('Error fetching category sales:', error);
        }
    };

    const fetchBCVRate = async () => {
        try {
            const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
            const data = await response.json();

            if (data && data.promedio) {
                const formattedRate = new Intl.NumberFormat('es-VE', {
                    style: 'currency',
                    currency: 'VES',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(data.promedio);
                setBcvRate(formattedRate);
            } else {
                setBcvRate('No disponible');
            }
        } catch (error) {
            console.error('Error fetching BCV rate:', error);
            setBcvRate('Error');
        }
    };

    useEffect(() => {
        if (!loading && weeklySales.length > 0) {
            initializeCharts();
        }
    }, [loading, weeklySales, categorySales]);

    const initializeCharts = () => {
        if (!Chart) return;

        // Destroy existing charts first
        try {
            if (Chart.instances && typeof Chart.instances === 'object') {
                Object.values(Chart.instances).forEach((chart: any) => {
                    if (chart && typeof chart.destroy === 'function') {
                        chart.destroy();
                    }
                });
            }
        } catch (error) {
            console.warn('Error destroying existing charts:', error);
        }

        // Weekly Sales Chart
        if (weeklySalesChartRef.current) {
            const weeklySalesCtx = weeklySalesChartRef.current.getContext('2d');
            if (weeklySalesCtx) {
                new Chart(weeklySalesCtx, {
                    type: 'line',
                    data: {
                        labels: weeklySales.map(d => d.day),
                        datasets: [{
                            label: 'Ventas Diarias ($)',
                            data: weeklySales.map(d => d.sales),
                            borderColor: '#f57c00',
                            backgroundColor: 'rgba(245, 124, 0, 0.2)',
                            fill: true,
                            tension: 0.4,
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: {
                                ticks: {
                                    color: '#9CA3AF',
                                    callback: function(value) {
                                        return '$' + value;
                                    }
                                }
                            },
                            x: { ticks: { color: '#9CA3AF' } }
                        }
                    }
                });
            }
        }

        // Top Categories Chart
        if (topCategoriesChartRef.current) {
            const topCategoriesCtx = topCategoriesChartRef.current.getContext('2d');
            if (topCategoriesCtx) {
                new Chart(topCategoriesCtx, {
                type: 'doughnut',
                data: {
                    labels: categorySales.map(c => c.category),
                    datasets: [{
                        label: 'Ventas por Categoría',
                        data: categorySales.map(c => c.sales),
                        backgroundColor: [
                            '#f57c00', '#004d40', '#a2c13c', '#8D1C3D', '#4B5563'
                        ],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#9CA3AF' }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed;
                                    const percentage = categorySales[context.dataIndex]?.percentage || 0;
                                    return `$${value.toFixed(2)} (${percentage.toFixed(1)}%)`;
                                }
                            }
                        }
                    }
                }
                });
            }
        }

        // Charts are cleaned up at the beginning of the next call
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white">Cargando dashboard...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                  <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                     <ion-icon name="arrow-back-outline" className="mr-1"></ion-icon>
                     Volver a la Tienda
                 </button>
            </div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Resumen del Negocio</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">
                        Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
                    </span>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-primary-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                    >
                        <ion-icon name="refresh-outline"></ion-icon>
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Ventas Hoy"
                    value={`$${stats.todaySales.toFixed(2)}`}
                    icon="cash-outline"
                    trend={stats.yesterdaySales !== undefined ? calculateTrend(stats.todaySales, stats.yesterdaySales).text : undefined}
                    trendColor={stats.yesterdaySales !== undefined ? calculateTrend(stats.todaySales, stats.yesterdaySales).color : undefined}
                />
                <StatCard
                    title="Ingresos del Mes"
                    value={`$${stats.monthlyRevenue.toFixed(2)}`}
                    icon="wallet-outline"
                    trend={stats.lastMonthRevenue !== undefined ? calculateTrend(stats.monthlyRevenue, stats.lastMonthRevenue).text : undefined}
                    trendColor={stats.lastMonthRevenue !== undefined ? calculateTrend(stats.monthlyRevenue, stats.lastMonthRevenue).color : undefined}
                />
                <StatCard
                    title="Tasa Dólar BCV"
                    value={bcvRate}
                    icon="analytics-outline"
                />
                <StatCard
                    title="Nuevos Clientes"
                    value={stats.newCustomers.toString()}
                    icon="person-add-outline"
                    trend="Este mes"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Productos"
                    value={stats.totalProducts.toString()}
                    icon="cube-outline"
                />
                <StatCard
                    title="Stock Bajo"
                    value={stats.lowStockProducts.toString()}
                    icon="warning-outline"
                />
                <StatCard
                    title="Pedidos Pendientes"
                    value={stats.pendingOrders.toString()}
                    icon="time-outline"
                />
                <StatCard
                    title="Pedidos Completados"
                    value={stats.completedOrders.toString()}
                    icon="checkmark-circle-outline"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartCard title="Ventas de la Semana">
                        <canvas ref={weeklySalesChartRef}></canvas>
                    </ChartCard>
                </div>
                <div>
                    <ChartCard title="Top 5 Categorías">
                        <canvas ref={topCategoriesChartRef}></canvas>
                    </ChartCard>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
                <ChartCard title="Actividad Reciente">
                    <div className="space-y-4">
                        {/* System Status */}
                        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-white">Sistema operativo</span>
                            </div>
                            <span className="text-gray-400 text-sm">Ahora</span>
                        </div>

                        {/* Pending Orders Alert */}
                        {stats.pendingOrders > 0 && (
                            <div className="flex items-center justify-between p-3 bg-blue-900/50 border border-blue-700 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-white">{stats.pendingOrders} pedidos pendientes</span>
                                </div>
                                <span className="text-gray-400 text-sm">Requieren atención</span>
                            </div>
                        )}

                        {/* Low Stock Alert */}
                        {stats.lowStockProducts > 0 && (
                            <div className="flex items-center justify-between p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <span className="text-white">{stats.lowStockProducts} productos con stock bajo</span>
                                </div>
                                <span className="text-gray-400 text-sm">Reponer pronto</span>
                            </div>
                        )}

                        {/* Recent Orders */}
                        {recentOrders.slice(0, 3).map((order, index) => (
                            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                        order.status === 'Completado' ? 'bg-green-500' :
                                        order.status === 'En Proceso' ? 'bg-blue-500' :
                                        order.status === 'Pendiente' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}></div>
                                    <div>
                                        <span className="text-white font-medium">
                                            Pedido {order.payment_reference || order.id.slice(0, 8)}...
                                        </span>
                                        <div className="text-gray-400 text-sm">
                                            {order.customername} - ${order.total?.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-gray-400 text-sm">
                                    {new Date(order.date).toLocaleDateString('es-ES')}
                                </span>
                            </div>
                        ))}

                        {recentOrders.length === 0 && (
                            <div className="text-center text-gray-400 py-4">
                                No hay actividad reciente
                            </div>
                        )}
                    </div>
                </ChartCard>
            </div>
        </div>
    );
};

export default Resumen;