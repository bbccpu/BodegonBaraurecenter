


import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../../types';
// Fix: Changed to a full import to ensure global type declarations for custom JSX elements like 'ion-icon' are loaded.
import { Product, Profile } from '../../types';
import { useDollarRate } from '../../context/DollarRateContext';
import { supabase } from '../../lib/supabaseClient';
import { useProducts } from '../../context/ProductContext';

interface CartItem extends Product {
    orderQuantity: number;
}

interface CustomerProfile {
    id?: string;
    nombre?: string;
    apellido?: string;
    cedula?: string;
    phone?: string;
    email?: string;
}

const Caja: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
    const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>([]);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState<CustomerProfile>({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<Array<{method: string, amount: number, reference?: string}>>([]);
    const [currentPaymentMethod, setCurrentPaymentMethod] = useState<string>('');
    const [currentPaymentAmount, setCurrentPaymentAmount] = useState<string>('');
    const [currentPaymentReference, setCurrentPaymentReference] = useState<string>('');
    const [lastOrder, setLastOrder] = useState<any>(null);

    const { products } = useProducts();
    const { rate, loading } = useDollarRate();

    useEffect(() => {
        const fetchCustomerProfiles = async () => {
            try {
                // Fetch customers from caja_clients table (cash register customers)
                const { data: cajaClientsData, error: cajaClientsError } = await supabase
                    .from('caja_clients')
                    .select('id, nombre, apellido, cedula, phone, email')
                    .order('nombre');

                if (cajaClientsError) {
                    console.error('Error fetching caja clients:', cajaClientsError);
                }

                // Also fetch registered customers from profiles table
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, nombre, apellido, cedula, phone, email')
                    .eq('role', 'T1') // Only customers
                    .order('nombre');

                if (profilesError) {
                    console.error('Error fetching customer profiles:', profilesError);
                }

                // Also fetch from order history for customers that might not be in database yet
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select('shipping_name, shipping_lastname, shipping_id, shipping_phone, customer_email')
                    .not('shipping_name', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (ordersError) {
                    console.error('Error fetching customer history:', ordersError);
                }

                // Combine all sources
                const customersFromCajaClients = (cajaClientsData || []).map(client => ({
                    id: client.id,
                    nombre: client.nombre,
                    apellido: client.apellido,
                    cedula: client.cedula,
                    phone: client.phone,
                    email: client.email
                }));

                const customersFromProfiles = (profilesData || []).map(profile => ({
                    id: profile.id,
                    nombre: profile.nombre,
                    apellido: profile.apellido,
                    cedula: profile.cedula,
                    phone: profile.phone,
                    email: profile.email
                }));

                // Add customers from orders that aren't already in the lists
                const customersFromOrders = (ordersData || []).reduce((acc: CustomerProfile[], order) => {
                    const existing = [...customersFromCajaClients, ...customersFromProfiles, ...acc].find(c =>
                        c.nombre === order.shipping_name &&
                        c.apellido === order.shipping_lastname &&
                        c.cedula === order.shipping_id
                    );
                    if (!existing && order.shipping_name && order.shipping_lastname && order.shipping_id) {
                        acc.push({
                            nombre: order.shipping_name,
                            apellido: order.shipping_lastname,
                            cedula: order.shipping_id,
                            phone: order.shipping_phone,
                            email: order.customer_email
                        });
                    }
                    return acc;
                }, []);

                const allCustomers = [...customersFromCajaClients, ...customersFromProfiles, ...customersFromOrders];
                setCustomerProfiles(allCustomers);
            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        };

        fetchCustomerProfiles();
    }, []);

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const lowercasedQuery = searchQuery.toLowerCase();
        return products.filter(product =>
            product.name.toLowerCase().includes(lowercasedQuery) ||
            product.code.toLowerCase().includes(lowercasedQuery) ||
            (product.barcode && product.barcode.toLowerCase().includes(lowercasedQuery))
        ).slice(0, 5); // Limit results for performance
    }, [searchQuery, products]);

    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customerProfiles.slice(0, 5);
        const lowercasedQuery = customerSearch.toLowerCase();
        return customerProfiles.filter(customer =>
            customer.nombre?.toLowerCase().includes(lowercasedQuery) ||
            customer.apellido?.toLowerCase().includes(lowercasedQuery) ||
            customer.cedula?.toLowerCase().includes(lowercasedQuery) ||
            customer.phone?.toLowerCase().includes(lowercasedQuery)
        ).slice(0, 5);
    }, [customerSearch, customerProfiles]);

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, orderQuantity: item.orderQuantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, orderQuantity: 1 }];
        });
        setSearchQuery('');
    };

    const updateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(cart.filter(item => item.id !== productId));
        } else {
            setCart(cart.map(item => item.id === productId ? { ...item, orderQuantity: newQuantity } : item));
        }
    };

    const selectCustomer = (customer: CustomerProfile) => {
        setSelectedCustomer(customer);
        setCustomerSearch('');
    };

    const createCustomer = async () => {
        console.log('createCustomer function called'); // Debug log

        if (!newCustomer.nombre || !newCustomer.apellido || !newCustomer.cedula) {
            alert('Nombre, apellido y cédula son requeridos');
            return;
        }

        try {
            // Create customer in the caja_clients table (designed for cash register customers)
            const { data, error } = await supabase
                .from('caja_clients')
                .insert([{
                    nombre: newCustomer.nombre,
                    apellido: newCustomer.apellido,
                    cedula: newCustomer.cedula,
                    phone: newCustomer.phone,
                    email: newCustomer.email
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating customer:', error);
                alert(`Error al crear cliente: ${error.message}`);
                return;
            }

            const customer = {
                id: data.id,
                nombre: newCustomer.nombre,
                apellido: newCustomer.apellido,
                cedula: newCustomer.cedula || '',
                phone: newCustomer.phone,
                email: newCustomer.email
            };

            console.log('Customer created successfully:', customer); // Debug log

            setSelectedCustomer(customer);
            setCustomerProfiles([...customerProfiles, customer]);
            setShowCustomerModal(false);
            setNewCustomer({});
            alert('Cliente creado exitosamente en la base de datos');
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Error al crear cliente');
        }
    };

    const generatePaymentReference = async () => {
        // Generate sequential payment reference with retry logic
        let paymentReference = '';
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                // Get the highest number from existing references
                const { data, error } = await supabase
                    .from('orders')
                    .select('payment_reference')
                    .not('payment_reference', 'is', null)
                    .order('payment_reference', { ascending: false })
                    .limit(1);

                if (error) {
                    console.error('Error querying last order:', error);
                    // Fallback to timestamp-based reference
                    paymentReference = `Pagosbbc${Date.now().toString().slice(-8)}`;
                    break;
                }

                let nextNumber = 1;
                if (data && data.length > 0) {
                    const lastRef = data[0].payment_reference;
                    console.log('Last reference found:', lastRef);
                    const match = lastRef.match(/pagosbbc(\d+)/i); // Case-insensitive
                    if (match) {
                        nextNumber = parseInt(match[1]) + 1;
                        console.log('Next number calculated:', nextNumber);
                    }
                }

                paymentReference = `Pagosbbc${nextNumber.toString().padStart(5, '0')}`;

                // Check if this reference already exists (race condition protection)
                const { data: existingOrder, error: checkError } = await supabase
                    .from('orders')
                    .select('id')
                    .eq('payment_reference', paymentReference)
                    .limit(1);

                if (checkError) {
                    console.error('Error checking existing reference:', checkError);
                    // Fallback to timestamp-based reference
                    paymentReference = `Pagosbbc${Date.now().toString().slice(-8)}`;
                    break;
                }

                if (!existingOrder || existingOrder.length === 0) {
                    // Reference is unique, we can use it
                    break;
                } else {
                    // Reference already exists, try next number
                    console.log('Reference already exists, trying next number');
                    attempts++;
                }

            } catch (error) {
                console.error('Error in reference generation:', error);
                // Fallback to timestamp-based reference
                paymentReference = `Pagosbbc${Date.now().toString().slice(-8)}`;
                break;
            }
        }

        if (!paymentReference) {
            // Ultimate fallback
            paymentReference = `Pagosbbc${Date.now().toString().slice(-8)}`;
        }

        console.log('Final payment reference:', paymentReference);
        return paymentReference;
    };

    const addPaymentMethod = () => {
        const amount = parseFloat(currentPaymentAmount);
        if (!currentPaymentMethod || !amount || amount <= 0) {
            alert('Seleccione método de pago e ingrese monto válido');
            return;
        }

        const newPayment = {
            method: currentPaymentMethod,
            amount: amount,
            reference: (currentPaymentMethod === 'pago_movil' || currentPaymentMethod === 'banco_venezuela' || currentPaymentMethod === 'cashea') ? currentPaymentReference : undefined
        };

        setPaymentMethods([...paymentMethods, newPayment]);
        setCurrentPaymentMethod('');
        setCurrentPaymentAmount('');
        setCurrentPaymentReference('');
    };

    const removePaymentMethod = (index: number) => {
        setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    };

    const totalPaid = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0);

    const processPayment = async () => {
        console.log('processPayment function called'); // Debug log
        console.log('Cart:', cart); // Debug log
        console.log('Payment methods:', paymentMethods); // Debug log

        // Allow processing without customer for walk-in customers

        if (cart.length === 0) {
            alert('El carrito está vacío');
            return;
        }

        if (paymentMethods.length === 0) {
            alert('Debe agregar al menos un método de pago');
            return;
        }

        const remainingAmount = Math.max(0, total - totalPaid);
        if (remainingAmount > 0) {
            alert('El monto total no está cubierto por los métodos de pago');
            return;
        }

        // Check references for methods that require them
        const methodsNeedingReference = paymentMethods.filter(p =>
            (p.method === 'pago_movil' || p.method === 'banco_venezuela' || p.method === 'cashea') && !p.reference
        );
        if (methodsNeedingReference.length > 0) {
            alert('Debe ingresar referencias para métodos de pago que las requieren');
            return;
        }

        try {
            console.log('Generating payment reference...'); // Debug log
            const reference = await generatePaymentReference();
            console.log('Generated reference:', reference); // Debug log

            // Convert payment methods array to a formatted string for storage
            const paymentMethodsText = paymentMethods.map(p =>
                `${p.method.replace('_', ' ').toUpperCase()}: $${p.amount.toFixed(2)}${p.reference ? ` (Ref: ${p.reference})` : ''}`
            ).join(' | ');

            const orderData = {
                customername: selectedCustomer ? `${selectedCustomer.nombre} ${selectedCustomer.apellido}` : 'Cliente General',
                date: new Date().toISOString(),
                total: total,
                status: 'Completado',
                items: cart.map(item => ({
                    productId: item.id,
                    productName: item.name,
                    quantity: item.orderQuantity,
                    price: item.price_usd,
                    iva_status: item.iva_status || 'N'
                })),
                payment_method: paymentMethodsText, // Store as formatted text
                payment_reference: reference,
                customer_email: selectedCustomer?.email,
                payment_status: 'completed',
                shipping_name: selectedCustomer?.nombre,
                shipping_lastname: selectedCustomer?.apellido,
                shipping_id: selectedCustomer?.cedula,
                shipping_phone: selectedCustomer?.phone
            };

            console.log('Order data to save:', orderData); // Debug log

            console.log('Saving order to database...'); // Debug log
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();

            console.log('Database response:', { data, error }); // Debug log

            if (error) {
                console.error('Error saving order:', error);
                alert('Error al guardar la orden');
                return;
            }

            // Set last order for invoice
            setLastOrder(data);

            // Clear cart and close modal
            setCart([]);
            setSelectedCustomer(null);
            setShowPaymentModal(false);
            setPaymentMethods([]);
            setCurrentPaymentMethod('');
            setCurrentPaymentAmount('');
            setCurrentPaymentReference('');

            alert(`Pago procesado exitosamente. Referencia: ${reference}`);

            // TODO: Print invoice

        } catch (error) {
            console.error('Error processing payment:', error);
            alert('Error al procesar el pago');
        }
    };

    const printInvoice = () => {
        if (!lastOrder) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Calculate totals in Bs using current rate
        const totalBs = (lastOrder.total * rate).toFixed(0);

        // Direct ESC/POS commands for thermal printer (no HTML, direct printer control)
        const escposCommands = {
            init: '\x1b\x40', // Initialize printer
            alignCenter: '\x1b\x61\x01', // Center alignment
            alignLeft: '\x1b\x61\x00', // Left alignment
            boldOn: '\x1b\x45\x01', // Bold on
            boldOff: '\x1b\x45\x00', // Bold off
            doubleHeightOn: '\x1b\x21\x10', // Double height
            doubleHeightOff: '\x1b\x21\x00', // Normal height
            cut: '\x1d\x56\x42\x00', // Full cut
            feed: '\n\n' // Minimal feed
        };

        // Build ESC/POS receipt data
        let receiptData = escposCommands.init;
        receiptData += escposCommands.alignCenter;
        receiptData += escposCommands.boldOn;
        receiptData += 'BODEGON BARAURE CENTER 2025 C.A.\n';
        receiptData += 'RIF: J-3507270106\n';
        receiptData += escposCommands.boldOff;
        receiptData += '================================\n';

        // Customer info
        if (lastOrder.customerName && lastOrder.customerName !== 'Cliente General') {
            receiptData += lastOrder.customerName + '\n';
        }
        if (lastOrder.shipping_id) {
            receiptData += 'CI: ' + lastOrder.shipping_id + '\n';
        }
        receiptData += '--------------------------------\n';

        // Invoice details
        receiptData += 'Factura: ' + lastOrder.payment_reference + '\n';
        receiptData += 'Fecha: ' + new Date(lastOrder.date).toLocaleDateString('es-VE') + '\n';
        receiptData += '--------------------------------\n';

        // Items
        lastOrder.items.forEach((item: any) => {
            receiptData += item.productName.substring(0, 20) + '\n';
            receiptData += item.quantity + 'x' + (item.price * rate).toFixed(0) + '=' + (item.price * rate * item.quantity).toFixed(0) + 'Bs\n';
        });

        receiptData += '================================\n';
        receiptData += escposCommands.doubleHeightOn;
        receiptData += escposCommands.boldOn;
        receiptData += 'TOTAL: ' + totalBs + ' Bs\n';
        receiptData += escposCommands.boldOff;
        receiptData += escposCommands.doubleHeightOff;

        // Payment info
        receiptData += lastOrder.payment_method.substring(0, 30) + '\n';
        if (lastOrder.payment_reference) {
            receiptData += 'Ref: ' + lastOrder.payment_reference + '\n';
        }

        receiptData += '================================\n';
        receiptData += 'Gracias por su preferencia!\n';
        receiptData += 'Factura valida para credito fiscal\n';
        receiptData += escposCommands.cut;
        receiptData += escposCommands.feed;

        // Create a simple HTML wrapper that sends raw data to printer
        const invoiceHTML = `
            <html>
            <head>
                <title>Factura - ${lastOrder.payment_reference}</title>
                <style>
                    @media print {
                        @page {
                            size: 58mm auto;
                            margin: 0;
                        }
                        body {
                            width: 48mm;
                            font-family: 'Courier New', monospace;
                            font-size: 9px;
                            line-height: 1.0;
                            margin: 0;
                            padding: 0;
                            white-space: pre-wrap;
                        }
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 9px;
                        line-height: 1.0;
                        max-width: 48mm;
                        margin: 0 auto;
                        padding: 0;
                        white-space: pre-wrap;
                    }
                </style>
            </head>
            <body>
                <div style="display: none;">${btoa(receiptData)}</div>
                <pre>${[
                    'BODEGON BARAURE CENTER 2025 C.A.',
                    'RIF: J-3507270106',
                    '================================',
                    lastOrder.customerName || 'Cliente General',
                    lastOrder.shipping_id ? `CI: ${lastOrder.shipping_id}` : '',
                    '--------------------------------',
                    `Factura: ${lastOrder.payment_reference}`,
                    `Fecha: ${new Date(lastOrder.date).toLocaleDateString('es-VE')}`,
                    '--------------------------------',
                    ...lastOrder.items.flatMap((item: any) => [
                        item.productName.substring(0, 20),
                        `${item.quantity}x${(item.price * rate).toFixed(0)}=${(item.price * rate * item.quantity).toFixed(0)}Bs`
                    ]),
                    '================================',
                    `TOTAL: ${totalBs} Bs`,
                    lastOrder.payment_method.substring(0, 30),
                    lastOrder.payment_reference ? `Ref: ${lastOrder.payment_reference}` : '',
                    '================================',
                    'Gracias por su preferencia!',
                    'Factura valida para credito fiscal'
                ].join('\n')}</pre>
            </body>
            </html>
        `;

        printWindow.document.write(invoiceHTML);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    };

    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price_usd * item.orderQuantity), 0);
    }, [cart]);

    return (
        <div>
            <div className="mb-6">
                 <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                    {/* Fix: Use 'className' instead of 'class' for custom elements in JSX. */}
                    <ion-icon name="arrow-back-outline" className="mr-1"></ion-icon>
                    Volver
                </button>
            </div>
            <h1 className="text-3xl font-bold text-white mb-8">Caja / Punto de Venta</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Customer Selection */}
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Cliente</h2>
                    {selectedCustomer ? (
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <p className="font-medium">{selectedCustomer.nombre} {selectedCustomer.apellido}</p>
                            <p className="text-sm text-gray-400">Cédula: {selectedCustomer.cedula}</p>
                            <p className="text-sm text-gray-400">Teléfono: {selectedCustomer.phone}</p>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="mt-2 text-sm text-red-400 hover:text-red-300"
                            >
                                Cambiar cliente
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar cliente por nombre, apellido, cédula o teléfono..."
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    className="w-full bg-gray-700 text-white placeholder-gray-400 border-2 border-gray-600 focus:border-primary-orange focus:ring-0 rounded-lg py-3 pl-4 pr-10"
                                />
                                {customerSearch && (
                                    <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg overflow-hidden">
                                        {filteredCustomers.length > 0 ? (
                                            <ul>
                                                {filteredCustomers.map((customer, index) => (
                                                    <li
                                                        key={customer.id || `customer-${index}`}
                                                        onClick={() => selectCustomer(customer)}
                                                        className={`flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-gray-600 transition-colors ${index < filteredCustomers.length - 1 ? 'border-b border-gray-600' : ''}`}
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-200">{customer.nombre} {customer.apellido}</p>
                                                            <p className="text-sm text-gray-400">Cédula: {customer.cedula}</p>
                                                            <p className="text-sm text-gray-400">Teléfono: {customer.phone}</p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p key="no-customers" className="px-4 py-3 text-gray-400">No se encontraron clientes.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowCustomerModal(true)}
                                className="w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Crear Nuevo Cliente
                            </button>
                        </div>
                    )}
                </div>

                {/* Search and Cart */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre o código..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-700 text-white placeholder-gray-400 border-2 border-gray-600 focus:border-primary-orange focus:ring-0 rounded-lg py-3 pl-4 pr-10"
                        />
                         {searchQuery && (
                            <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg overflow-hidden">
                                {filteredProducts.length > 0 ? (
                                    <ul>
                                        {filteredProducts.map((p, index) => (
                                            <li 
                                                key={p.id} 
                                                onClick={() => addToCart(p)} 
                                                className={`flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-gray-600 transition-colors ${index < filteredProducts.length - 1 ? 'border-b border-gray-600' : ''}`}
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-200">{p.name}</p>
                                                    <p className="text-sm text-gray-400">Código: {p.code}</p>
                                                </div>
                                                                                        <span className="font-bold text-primary-orange">${p.price_usd ?? p.price_usd ?? 0.00}</span>
                                                                                        <span className="text-green-400 text-xs font-semibold ml-2">
                                                                                            {loading ? 'Cargando...' : rate ? `${((p.price_usd ?? p.price_usd ?? 0) * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'No disponible'}
                                                                                        </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="px-4 py-3 text-gray-400">No se encontraron productos.</p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <h2 className="text-xl font-bold mb-4">Pedido Actual</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="p-2">Producto</th>
                                    <th className="p-2">Precio</th>
                                    <th className="p-2 text-center">Cantidad</th>
                                    <th className="p-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map(item => (
                                    <tr key={item.id} className="border-b border-gray-700">
                                        <td className="p-2 font-medium">{item.name}</td>
                                                                                <td className="p-2">
                                                                                    <span>${item.price_usd ?? item.price_usd ?? 0.00}</span>
                                                                                    <span className="block text-green-400 text-xs font-semibold">
                                                                                        {loading ? 'Cargando...' : rate ? `${((item.price_usd ?? item.price_usd ?? 0) * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'No disponible'}
                                                                                    </span>
                                                                                </td>
                                        <td className="p-2 text-center">
                                            <input 
                                                type="number" 
                                                value={item.orderQuantity}
                                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                                className="w-16 bg-gray-600 text-center rounded"
                                                min="0"
                                            />
                                        </td>
                                                                                <td className="p-2 text-right font-bold">
                                                                                    ${(item.price_usd ?? item.price_usd ?? 0) * item.orderQuantity}
                                                                                    <span className="block text-green-400 text-xs font-semibold">
                                                                                        {loading ? 'Cargando...' : rate ? `${(((item.price_usd ?? item.price_usd ?? 0) * rate) * item.orderQuantity).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'No disponible'}
                                                                                    </span>
                                                                                </td>
                                    </tr>
                                ))}
                                 {cart.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-gray-400">Agregue productos para comenzar un pedido.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Total and Actions */}
                <div className="bg-gray-800 p-6 rounded-lg flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Total a Pagar</h2>
                                                 <p className="text-5xl font-black text-primary-orange mb-2">${total.toFixed(2)}</p>
                                                 <p className="text-2xl font-bold text-green-400 mb-6">
                                                     {loading ? 'Cargando...' : rate ? `${(total * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'No disponible'}
                                                 </p>
                        {lastOrder && (
                            <div className="mb-4 p-4 bg-green-800 rounded-lg">
                                <p className="text-green-200 font-bold">Última venta: {lastOrder.payment_reference}</p>
                                <button
                                    onClick={printInvoice}
                                    className="mt-2 w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Imprimir Factura
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                          <button
                              onClick={() => setShowPaymentModal(true)}
                              className="w-full bg-primary-orange text-white font-bold py-4 rounded-lg text-lg hover:bg-orange-600 transition-colors duration-300 mb-2"
                          >
                             Procesar Pago
                         </button>
                         <button onClick={() => setCart([])} className="w-full bg-vibrant-red text-white font-bold py-2 rounded-lg hover:bg-red-700 transition-colors duration-300">
                             Cancelar Pedido
                         </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Procesar Pago</h3>

                        {/* Current Payment Methods */}
                        {paymentMethods.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-lg font-semibold mb-2">Métodos de Pago Agregados:</h4>
                                <div className="space-y-2">
                                    {paymentMethods.map((payment, index) => (
                                        <div key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                                            <div>
                                                <span className="font-medium capitalize">{payment.method.replace('_', ' ')}</span>
                                                {payment.reference && <span className="text-sm text-gray-400 ml-2">Ref: {payment.reference}</span>}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold">${payment.amount.toFixed(2)}</span>
                                                <button
                                                    onClick={() => removePaymentMethod(index)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <ion-icon name="trash-outline"></ion-icon>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 p-2 bg-gray-700 rounded-lg">
                                    <div className="flex justify-between">
                                        <span>Total pagado:</span>
                                        <span className="font-bold text-green-400">${totalPaid.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Restante:</span>
                                        <span className={`font-bold ${Math.max(0, total - totalPaid) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            ${Math.max(0, total - totalPaid).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Add New Payment Method */}
                        <div className="space-y-4 border-t border-gray-600 pt-4">
                            <h4 className="text-lg font-semibold">Agregar Método de Pago:</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pago</label>
                                <select
                                    value={currentPaymentMethod}
                                    onChange={(e) => setCurrentPaymentMethod(e.target.value)}
                                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                                >
                                    <option value="">Seleccionar método</option>
                                    <option value="efectivo_usd">Efectivo USD</option>
                                    <option value="efectivo_bs">Efectivo Bs</option>
                                    <option value="pago_movil">Pago Móvil</option>
                                    <option value="banco_venezuela">Banco Venezuela</option>
                                    <option value="cashea">Cashea</option>
                                    <option value="puntos">Puntos</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Monto</label>
                                <input
                                    type="number"
                                    value={currentPaymentAmount}
                                    onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                                />
                            </div>

                            {(currentPaymentMethod === 'pago_movil' || currentPaymentMethod === 'banco_venezuela' || currentPaymentMethod === 'cashea') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Referencia de Pago</label>
                                    <input
                                        type="text"
                                        value={currentPaymentReference}
                                        onChange={(e) => setCurrentPaymentReference(e.target.value)}
                                        placeholder="Ingrese la referencia"
                                        className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                                    />
                                </div>
                            )}

                            <button
                                onClick={addPaymentMethod}
                                className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Agregar Método de Pago
                            </button>
                        </div>

                        <div className="text-center mt-4 p-3 bg-gray-700 rounded-lg">
                            <p className="text-xl font-bold">Total a Pagar: ${total.toFixed(2)}</p>
                        </div>

                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={processPayment}
                                disabled={paymentMethods.length === 0 || Math.max(0, total - totalPaid) > 0}
                                className="flex-1 bg-primary-orange text-white font-bold py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                Confirmar Pago
                            </button>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 bg-gray-600 text-white font-bold py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Creation Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Crear Nuevo Cliente</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nombre"
                                value={newCustomer.nombre || ''}
                                onChange={(e) => setNewCustomer({...newCustomer, nombre: e.target.value})}
                                className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            />
                            <input
                                type="text"
                                placeholder="Apellido"
                                value={newCustomer.apellido || ''}
                                onChange={(e) => setNewCustomer({...newCustomer, apellido: e.target.value})}
                                className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            />
                            <input
                                type="text"
                                placeholder="Cédula"
                                value={newCustomer.cedula || ''}
                                onChange={(e) => setNewCustomer({...newCustomer, cedula: e.target.value})}
                                className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            />
                            <input
                                type="text"
                                placeholder="Teléfono"
                                value={newCustomer.phone || ''}
                                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            />
                            <input
                                type="email"
                                placeholder="Email (opcional)"
                                value={newCustomer.email || ''}
                                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                                className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                            />
                        </div>
                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={createCustomer}
                                className="flex-1 bg-primary-orange text-white font-bold py-2 rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Crear
                            </button>
                            <button
                                onClick={() => setShowCustomerModal(false)}
                                className="flex-1 bg-gray-600 text-white font-bold py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Caja;
