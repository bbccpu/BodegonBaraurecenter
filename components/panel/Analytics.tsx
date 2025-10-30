import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../../types';
import { supabase } from '../../lib/supabaseClient';

declare const Chart: any; // Using Chart.js from CDN

interface AnalyticsData {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    topProducts: Array<{ name: string; sold: number; revenue: number }>;
    salesByCategory: Array<{ category: string; sales: number; percentage: number }>;
    salesByPeriod: Array<{ period: string; sales: number; orders: number }>;
    paymentMethods: Array<{ method: string; count: number; total: number; percentage: number }>;
    customerAnalytics: {
        totalCustomers: number;
        averageOrdersPerCustomer: number;
        topCustomers: Array<{ name: string; totalSpent: number; ordersCount: number }>;
    };
}

const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    trend?: string;
    trendColor?: string
}> = ({ title, value, subtitle, icon, trend, trendColor = 'text-green-400' }) => (
    <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-2">
            <ion-icon name={icon} className="text-3xl text-primary-orange"></ion-icon>
            {trend && <span className={`text-sm font-medium ${trendColor}`}>{trend}</span>}
        </div>
        <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({
    title,
    children,
    className = ""
}) => (
    <div className={`bg-gray-800 p-6 rounded-lg ${className}`}>
        <h3 className="font-bold text-lg mb-4 text-white">{title}</h3>
        <div className="relative h-80">{children}</div>
    </div>
);

const Analytics: React.FC = () => {
    const navigate = useNavigate();
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Chart refs
    const salesByCategoryChartRef = useRef<HTMLCanvasElement>(null);
    const topProductsChartRef = useRef<HTMLCanvasElement>(null);
    const salesTrendChartRef = useRef<HTMLCanvasElement>(null);
    const paymentMethodsChartRef = useRef<HTMLCanvasElement>(null);
    const customerValueChartRef = useRef<HTMLCanvasElement>(null);

    const getDateRange = (range: string) => {
        const now = new Date();
        const start = new Date();

        switch (range) {
            case '7d':
                start.setDate(now.getDate() - 7);
                break;
            case '30d':
                start.setDate(now.getDate() - 30);
                break;
            case '90d':
                start.setDate(now.getDate() - 90);
                break;
            case '1y':
                start.setFullYear(now.getFullYear() - 1);
                break;
            default:
                start.setDate(now.getDate() - 30);
        }

        return {
            start: start.toISOString(),
            end: now.toISOString()
        };
    };

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const { start, end } = getDateRange(dateRange);

            // Fetch completed orders within date range
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('status', 'Completado')
                .gte('date', start)
                .lte('date', end)
                .order('date', { ascending: false });

            if (ordersError) throw ordersError;

            // Calculate basic metrics
            const totalSales = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
            const totalOrders = orders?.length || 0;
            const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

            // Top products analysis
            const productSales: { [key: string]: { sold: number; revenue: number } } = {};
            orders?.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach((item: any) => {
                        const productName = item.productName || 'Producto Desconocido';
                        if (!productSales[productName]) {
                            productSales[productName] = { sold: 0, revenue: 0 };
                        }
                        productSales[productName].sold += item.quantity || 0;
                        productSales[productName].revenue += (item.price || 0) * (item.quantity || 0);
                    });
                }
            });

            const topProducts = Object.entries(productSales)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);

            // Category analysis
            const categorySales: { [key: string]: number } = {};
            orders?.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach((item: any) => {
                        const productName = item.productName?.toLowerCase() || '';
                        let category = 'Otros';

                        if (productName.includes('cerveza') || productName.includes('vino') || productName.includes('whisky') || productName.includes('ron') || productName.includes('licor')) {
                            category = 'Licores';
                        } else if (productName.includes('arroz') || productName.includes('pasta') || productName.includes('harina') || productName.includes('aceite') || productName.includes('azúcar')) {
                            category = 'Despensa';
                        } else if (productName.includes('carne') || productName.includes('pollo') || productName.includes('pescado') || productName.includes('queso') || productName.includes('leche')) {
                            category = 'Alimentos Frescos';
                        } else if (productName.includes('refresco') || productName.includes('jugo') || productName.includes('agua') || productName.includes('soda')) {
                            category = 'Bebidas';
                        } else if (productName.includes('jabón') || productName.includes('shampoo') || productName.includes('crema') || productName.includes('cepillo')) {
                            category = 'Cuidado Personal';
                        } else if (productName.includes('detergente') || productName.includes('cloro') || productName.includes('limpia') || productName.includes('esponja')) {
                            category = 'Limpieza';
                        }

                        categorySales[category] = (categorySales[category] || 0) + ((item.price || 0) * (item.quantity || 0));
                    });
                }
            });

            const totalCategorySales = Object.values(categorySales).reduce((sum, sales) => sum + sales, 0);
            const salesByCategory = Object.entries(categorySales)
                .map(([category, sales]) => ({
                    category,
                    sales,
                    percentage: totalCategorySales > 0 ? (sales / totalCategorySales) * 100 : 0
                }))
                .sort((a, b) => b.sales - a.sales);

            // Sales by period (daily for last 30 days, weekly for longer periods)
            const salesByPeriod = await calculateSalesByPeriod(orders || [], dateRange);

            // Payment methods analysis - parse the formatted payment_method string
            const paymentMethodsCount: { [key: string]: { count: number; total: number } } = {};
            orders?.forEach(order => {
                if (order.payment_method) {
                    // Split by ' | ' to get individual payment methods
                    const paymentStrings = order.payment_method.split(' | ');
                    paymentStrings.forEach(paymentStr => {
                        // Extract method and amount using regex
                        const match = paymentStr.match(/^([^:]+):\s*\$\s*([\d.]+)(?:\s*\([^)]*\))?$/);
                        if (match) {
                            const [, method, amountStr] = match;
                            const amount = parseFloat(amountStr);

                            // Normalize method names
                            let normalizedMethod = method.trim();
                            if (normalizedMethod === 'efectivo_usd') normalizedMethod = 'Efectivo USD';
                            else if (normalizedMethod === 'efectivo_bs') normalizedMethod = 'Efectivo Bs';
                            else if (normalizedMethod === 'pago_movil') normalizedMethod = 'Pago Móvil';
                            else if (normalizedMethod === 'banco_venezuela') normalizedMethod = 'Banco Venezuela';
                            else if (normalizedMethod === 'cashea') normalizedMethod = 'Cashea';
                            else if (normalizedMethod === 'puntos') normalizedMethod = 'Puntos';

                            if (!paymentMethodsCount[normalizedMethod]) {
                                paymentMethodsCount[normalizedMethod] = { count: 0, total: 0 };
                            }
                            paymentMethodsCount[normalizedMethod].count += 1;
                            paymentMethodsCount[normalizedMethod].total += amount;
                        }
                    });
                }
            });

            const totalPayments = Object.values(paymentMethodsCount).reduce((sum, data) => sum + data.count, 0);
            const paymentMethods = Object.entries(paymentMethodsCount)
                .map(([method, data]) => ({
                    method,
                    count: data.count,
                    total: data.total,
                    percentage: totalPayments > 0 ? (data.count / totalPayments) * 100 : 0
                }))
                .sort((a, b) => b.count - a.count);

            // Customer analytics
            const customerData: { [key: string]: { totalSpent: number; ordersCount: number } } = {};
            orders?.forEach(order => {
                const customerName = order.customername || 'Cliente General';
                if (!customerData[customerName]) {
                    customerData[customerName] = { totalSpent: 0, ordersCount: 0 };
                }
                customerData[customerName].totalSpent += order.total || 0;
                customerData[customerName].ordersCount += 1;
            });

            const totalCustomers = Object.keys(customerData).length;
            const averageOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;

            const topCustomers = Object.entries(customerData)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 10);

            const analytics: AnalyticsData = {
                totalSales,
                totalOrders,
                averageOrderValue,
                topProducts,
                salesByCategory,
                salesByPeriod,
                paymentMethods,
                customerAnalytics: {
                    totalCustomers,
                    averageOrdersPerCustomer,
                    topCustomers
                }
            };

            setAnalyticsData(analytics);
            setLastUpdate(new Date());

        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSalesByPeriod = async (orders: any[], range: string) => {
        const periodData: { [key: string]: { sales: number; orders: number } } = {};

        orders.forEach(order => {
            const date = new Date(order.date);
            let periodKey: string;

            if (range === '7d' || range === '30d') {
                // Daily breakdown
                periodKey = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            } else if (range === '90d') {
                // Weekly breakdown
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                periodKey = `Sem ${weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`;
            } else {
                // Monthly breakdown
                periodKey = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
            }

            if (!periodData[periodKey]) {
                periodData[periodKey] = { sales: 0, orders: 0 };
            }
            periodData[periodKey].sales += order.total || 0;
            periodData[periodKey].orders += 1;
        });

        return Object.entries(periodData)
            .map(([period, data]) => ({ period, ...data }))
            .sort((a, b) => a.period.localeCompare(b.period));
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, [dateRange]);

    useEffect(() => {
        if (!loading && analyticsData) {
            initializeCharts();
        }
    }, [loading, analyticsData]);

    // Cleanup charts on unmount
    useEffect(() => {
        return () => {
            try {
                if (Chart && Chart.instances && typeof Chart.instances === 'object') {
                    Object.values(Chart.instances).forEach((chart: any) => {
                        if (chart && typeof chart.destroy === 'function') {
                            chart.destroy();
                        }
                    });
                }
            } catch (error) {
                console.warn('Error cleaning up charts:', error);
            }
        };
    }, []);

    const initializeCharts = () => {
        if (!analyticsData || !Chart) return;

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

        const commonOptions = {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#D1D5DB' }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#9CA3AF' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#9CA3AF' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        };

        // 1. Sales by Category Chart
        if (salesByCategoryChartRef.current && analyticsData.salesByCategory.length > 0) {
            const ctx = salesByCategoryChartRef.current.getContext('2d');
            if (ctx) {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: analyticsData.salesByCategory.map(c => c.category),
                        datasets: [{
                            label: 'Ventas ($)',
                            data: analyticsData.salesByCategory.map(c => c.sales),
                            backgroundColor: 'rgba(245, 124, 0, 0.6)',
                            borderColor: '#f57c00',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const value = context.parsed.y;
                                        const percentage = analyticsData.salesByCategory[context.dataIndex]?.percentage || 0;
                                        return `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${percentage.toFixed(1)}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        // 2. Top Products Chart
        if (topProductsChartRef.current && analyticsData.topProducts.length > 0) {
            const ctx = topProductsChartRef.current.getContext('2d');
            if (ctx) {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: analyticsData.topProducts.slice(0, 8).map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
                        datasets: [{
                            label: 'Unidades Vendidas',
                            data: analyticsData.topProducts.slice(0, 8).map(p => p.sold),
                            backgroundColor: 'rgba(162, 193, 60, 0.6)',
                            borderColor: '#a2c13c',
                            borderWidth: 1
                        }]
                    },
                    options: { ...commonOptions, indexAxis: 'y' }
                });
            }
        }

        // 3. Sales Trend Chart
        if (salesTrendChartRef.current && analyticsData.salesByPeriod.length > 0) {
            const ctx = salesTrendChartRef.current.getContext('2d');
            if (ctx) {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: analyticsData.salesByPeriod.map(p => p.period),
                        datasets: [{
                            label: 'Ventas ($)',
                            data: analyticsData.salesByPeriod.map(p => p.sales),
                            borderColor: '#8D1C3D',
                            backgroundColor: 'rgba(141, 28, 61, 0.2)',
                            fill: true,
                            tension: 0.3,
                        }]
                    },
                    options: commonOptions
                });
            }
        }

        // 4. Payment Methods Chart
        if (paymentMethodsChartRef.current && analyticsData.paymentMethods.length > 0) {
            const ctx = paymentMethodsChartRef.current.getContext('2d');
            if (ctx) {
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: analyticsData.paymentMethods.map(m => `${m.method}\n${m.count} pagos\n$${m.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`),
                        datasets: [{
                            data: analyticsData.paymentMethods.map(m => m.count),
                            backgroundColor: [
                                '#f57c00', '#004d40', '#a2c13c', '#DC2626', '#8D1C3D', '#7C3AED'
                            ],
                            hoverOffset: 8
                        }]
                    },
                    options: {
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: '#D1D5DB',
                                    font: { size: 11 },
                                    padding: 10
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const method = analyticsData.paymentMethods[context.dataIndex];
                                        return [
                                            `${method.method}`,
                                            `${method.count} pagos realizados`,
                                            `Total: $${method.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
                                            `${method.percentage.toFixed(1)}% del total`
                                        ];
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        // 5. Customer Value Chart
        if (customerValueChartRef.current && analyticsData.customerAnalytics.topCustomers.length > 0) {
            const ctx = customerValueChartRef.current.getContext('2d');
            if (ctx) {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: analyticsData.customerAnalytics.topCustomers.slice(0, 5).map(c =>
                            c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name
                        ),
                        datasets: [{
                            label: 'Total Gastado ($)',
                            data: analyticsData.customerAnalytics.topCustomers.slice(0, 5).map(c => c.totalSpent),
                            backgroundColor: 'rgba(124, 58, 237, 0.6)',
                            borderColor: '#7C3AED',
                            borderWidth: 1
                        }]
                    },
                    options: commonOptions
                });
            }
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white">Cargando análisis...</div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-400">Error al cargar los datos de análisis</div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                  <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                     <ion-icon name="arrow-back-outline" className="mr-1"></ion-icon>
                     Volver
                 </button>
            </div>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Análisis Avanzado de Ventas</h1>
                    <p className="text-gray-400 mt-1">Métricas detalladas y tendencias de rendimiento del negocio</p>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">
                        Actualizado: {lastUpdate.toLocaleTimeString('es-ES')}
                    </span>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                        className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                    >
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                        <option value="90d">Últimos 90 días</option>
                        <option value="1y">Último año</option>
                    </select>
                    <button
                        onClick={fetchAnalyticsData}
                        className="bg-primary-orange text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                    >
                        <ion-icon name="refresh-outline"></ion-icon>
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Ventas Totales"
                    value={`$${analyticsData.totalSales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
                    subtitle={`En ${dateRange === '7d' ? '7 días' : dateRange === '30d' ? '30 días' : dateRange === '90d' ? '90 días' : '1 año'}`}
                    icon="cash-outline"
                />
                <StatCard
                    title="Total de Órdenes"
                    value={analyticsData.totalOrders.toLocaleString('es-ES', { minimumIntegerDigits: 1, maximumFractionDigits: 0 })}
                    subtitle={`${analyticsData.totalOrders > 0 ? (analyticsData.totalSales / analyticsData.totalOrders).toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '0'} promedio por orden`}
                    icon="receipt-outline"
                />
                <StatCard
                    title="Valor Promedio de Orden"
                    value={`$${analyticsData.averageOrderValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
                    subtitle="Por transacción completada"
                    icon="analytics-outline"
                />
                <StatCard
                    title="Clientes Activos"
                    value={analyticsData.customerAnalytics.totalCustomers.toLocaleString('es-ES')}
                    subtitle={`${analyticsData.customerAnalytics.averageOrdersPerCustomer.toLocaleString('es-ES', { minimumFractionDigits: 1 })} órdenes promedio por cliente`}
                    icon="people-outline"
                />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Métricas de Productos</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Producto más vendido:</span>
                            <span className="text-white font-medium">
                                {analyticsData.topProducts[0]?.name.split(' ')[0] || 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Unidades vendidas:</span>
                            <span className="text-green-400 font-medium">
                                {analyticsData.topProducts[0]?.sold.toLocaleString('es-ES') || '0'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Categorías activas:</span>
                            <span className="text-blue-400 font-medium">
                                {analyticsData.salesByCategory.length}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Métricas de Pagos</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Método preferido:</span>
                            <span className="text-white font-medium">
                                {analyticsData.paymentMethods[0]?.method || 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Total transacciones:</span>
                            <span className="text-green-400 font-medium">
                                {analyticsData.paymentMethods.reduce((sum, m) => sum + m.count, 0).toLocaleString('es-ES')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Monto total:</span>
                            <span className="text-blue-400 font-medium">
                                ${analyticsData.paymentMethods.reduce((sum, m) => sum + m.total, 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Métodos usados:</span>
                            <span className="text-purple-400 font-medium">
                                {analyticsData.paymentMethods.length}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Métricas de Clientes</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Cliente más valioso:</span>
                            <span className="text-white font-medium">
                                {analyticsData.customerAnalytics.topCustomers[0]?.name.split(' ')[0] || 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Total gastado:</span>
                            <span className="text-green-400 font-medium">
                                ${analyticsData.customerAnalytics.topCustomers[0]?.totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Frecuencia promedio:</span>
                            <span className="text-blue-400 font-medium">
                                {analyticsData.customerAnalytics.averageOrdersPerCustomer.toLocaleString('es-ES', { minimumFractionDigits: 1 })} órdenes
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ChartCard title="Ventas por Categoría">
                    <canvas ref={salesByCategoryChartRef}></canvas>
                </ChartCard>
                <ChartCard title="Productos Más Vendidos">
                    <canvas ref={topProductsChartRef}></canvas>
                </ChartCard>
                <ChartCard title="Tendencia de Ventas" className="lg:col-span-2">
                    <canvas ref={salesTrendChartRef}></canvas>
                </ChartCard>
            </div>

            {/* Payment Methods and Customer Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ChartCard title="Métodos de Pago Utilizados">
                    <canvas ref={paymentMethodsChartRef}></canvas>
                </ChartCard>
                <ChartCard title="Clientes Más Valiosos">
                    <canvas ref={customerValueChartRef}></canvas>
                </ChartCard>
            </div>

            {/* Payment Methods Summary Table - Moved below */}
            <div className="mb-8">
                <ChartCard title="Resumen Detallado de Métodos de Pago">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analyticsData.paymentMethods.map((method, index) => (
                            <div key={method.method} className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: ['#f57c00', '#004d40', '#a2c13c', '#DC2626', '#8D1C3D', '#7C3AED'][index % 6] }}
                                    ></div>
                                    <h4 className="text-white font-medium text-sm">{method.method}</h4>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Transacciones:</span>
                                        <span className="text-white font-medium">{method.count.toLocaleString('es-ES')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Monto total:</span>
                                        <span className="text-green-400 font-medium">${method.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Porcentaje:</span>
                                        <span className="text-blue-400 font-medium">{method.percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Promedio:</span>
                                        <span className="text-purple-400 font-medium">${(method.total / method.count).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>

            {/* Detailed Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title="Top 10 Productos por Ingresos">
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {analyticsData.topProducts.slice(0, 10).map((product, index) => (
                            <div key={product.name} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <span className={`text-sm font-bold w-6 ${
                                        index === 0 ? 'text-yellow-400' :
                                        index === 1 ? 'text-gray-400' :
                                        index === 2 ? 'text-orange-400' : 'text-primary-orange'
                                    }`}>
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-white font-medium text-sm truncate max-w-48" title={product.name}>
                                            {product.name}
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            {product.sold.toLocaleString('es-ES')} unidades • ${(product.revenue / product.sold).toFixed(2)} promedio
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-green-400 font-bold text-lg">
                                        ${product.revenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                    </span>
                                    <p className="text-gray-400 text-xs">
                                        {((product.revenue / analyticsData.totalSales) * 100).toFixed(1)}% del total
                                    </p>
                                </div>
                            </div>
                        ))}
                        {analyticsData.topProducts.length === 0 && (
                            <div className="text-center text-gray-400 py-8">
                                No hay datos de productos disponibles
                            </div>
                        )}
                    </div>
                </ChartCard>

                <ChartCard title="Clientes Más Valiosos">
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {analyticsData.customerAnalytics.topCustomers.slice(0, 10).map((customer, index) => (
                            <div key={customer.name} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <span className={`text-sm font-bold w-6 ${
                                        index === 0 ? 'text-yellow-400' :
                                        index === 1 ? 'text-gray-400' :
                                        index === 2 ? 'text-orange-400' : 'text-primary-orange'
                                    }`}>
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-white font-medium text-sm truncate max-w-40" title={customer.name}>
                                            {customer.name}
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            {customer.ordersCount} órdenes • ${(customer.totalSpent / customer.ordersCount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} promedio
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-green-400 font-bold text-lg">
                                        ${customer.totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                    </span>
                                    <p className="text-gray-400 text-xs">
                                        {((customer.totalSpent / analyticsData.totalSales) * 100).toFixed(1)}% del total
                                    </p>
                                </div>
                            </div>
                        ))}
                        {analyticsData.customerAnalytics.topCustomers.length === 0 && (
                            <div className="text-center text-gray-400 py-8">
                                No hay datos de clientes disponibles
                            </div>
                        )}
                    </div>
                </ChartCard>
            </div>

            {/* Summary Insights */}
            <div className="mt-8 space-y-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <ion-icon name="bulb-outline" className="mr-2 text-yellow-400"></ion-icon>
                        Insights Inteligentes del Período
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-gray-700 rounded-lg">
                            <ion-icon name="trophy-outline" className="text-3xl text-primary-orange mb-2"></ion-icon>
                            <p className="text-xl font-bold text-primary-orange mb-1">
                                {analyticsData.salesByCategory[0]?.category || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-400">Categoría líder</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {analyticsData.salesByCategory[0]?.percentage.toFixed(1) || '0'}% de ventas
                            </p>
                        </div>
                        <div className="text-center p-4 bg-gray-700 rounded-lg">
                            <ion-icon name="star-outline" className="text-3xl text-green-400 mb-2"></ion-icon>
                            <p className="text-xl font-bold text-green-400 mb-1 truncate" title={analyticsData.topProducts[0]?.name}>
                                {analyticsData.topProducts[0]?.name.split(' ')[0] || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-400">Producto estrella</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {analyticsData.topProducts[0]?.sold.toLocaleString('es-ES') || '0'} unidades
                            </p>
                        </div>
                        <div className="text-center p-4 bg-gray-700 rounded-lg">
                            <ion-icon name="card-outline" className="text-3xl text-blue-400 mb-2"></ion-icon>
                            <p className="text-xl font-bold text-blue-400 mb-1">
                                {analyticsData.paymentMethods[0]?.method || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-400">Pago preferido</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {analyticsData.paymentMethods[0]?.percentage.toFixed(1) || '0'}% de transacciones
                            </p>
                        </div>
                        <div className="text-center p-4 bg-gray-700 rounded-lg">
                            <ion-icon name="person-outline" className="text-3xl text-purple-400 mb-2"></ion-icon>
                            <p className="text-xl font-bold text-purple-400 mb-1 truncate" title={analyticsData.customerAnalytics.topCustomers[0]?.name}>
                                {analyticsData.customerAnalytics.topCustomers[0]?.name.split(' ')[0] || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-400">Cliente VIP</p>
                            <p className="text-xs text-gray-500 mt-1">
                                ${analyticsData.customerAnalytics.topCustomers[0]?.totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 0 }) || '0'} gastados
                            </p>
                        </div>
                    </div>
                </div>

                {/* Performance Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h4 className="text-md font-bold text-white mb-3 flex items-center">
                            <ion-icon name="trending-up-outline" className="mr-2 text-green-400"></ion-icon>
                            Rendimiento General
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Conversión de órdenes:</span>
                                <span className="text-green-400 font-medium">
                                    {analyticsData.totalOrders > 0 ? '100%' : '0%'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Valor promedio por cliente:</span>
                                <span className="text-blue-400 font-medium">
                                    ${analyticsData.customerAnalytics.totalCustomers > 0 ?
                                        (analyticsData.totalSales / analyticsData.customerAnalytics.totalCustomers).toLocaleString('es-ES', { minimumFractionDigits: 2 }) :
                                        '0'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Diversidad de productos:</span>
                                <span className="text-purple-400 font-medium">
                                    {analyticsData.topProducts.length} productos activos
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h4 className="text-md font-bold text-white mb-3 flex items-center">
                            <ion-icon name="time-outline" className="mr-2 text-blue-400"></ion-icon>
                            Tendencias de Tiempo
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Período analizado:</span>
                                <span className="text-white font-medium">
                                    {dateRange === '7d' ? '7 días' : dateRange === '30d' ? '30 días' : dateRange === '90d' ? '90 días' : '1 año'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Puntos de datos:</span>
                                <span className="text-green-400 font-medium">
                                    {analyticsData.salesByPeriod.length} períodos
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Frecuencia de actualización:</span>
                                <span className="text-yellow-400 font-medium">
                                    Manual
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h4 className="text-md font-bold text-white mb-3 flex items-center">
                            <ion-icon name="analytics-outline" className="mr-2 text-purple-400"></ion-icon>
                            Métricas Avanzadas
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Concentración de ventas:</span>
                                <span className="text-orange-400 font-medium">
                                    {analyticsData.topProducts.length > 0 && analyticsData.totalSales > 0 ?
                                        ((analyticsData.topProducts.slice(0, 3).reduce((sum, p) => sum + p.revenue, 0) / analyticsData.totalSales) * 100).toFixed(1) :
                                        '0'}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Diversidad de pagos:</span>
                                <span className="text-blue-400 font-medium">
                                    {analyticsData.paymentMethods.length} métodos
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Cobertura de mercado:</span>
                                <span className="text-green-400 font-medium">
                                    {analyticsData.salesByCategory.length} categorías
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
