


import React from 'react';
import { useCart } from '../context/CartContext';
import { PaymentOptions } from './PaymentOptions';
import { Link } from 'react-router-dom';
import { useDollarRate } from '../context/DollarRateContext';
import { supabase } from '../lib/supabaseClient';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../types';

export const CartPage: React.FC = () => {
    const { cart, updateCartQuantity, removeFromCart, totalItems, totalPrice, clearCart } = useCart();
    const { rate, loading } = useDollarRate();

    const handlePaymentSubmit = async (paymentData: {
        email?: string;
        method: string;
        reference?: string;
        total: number;
        shipping: {
            nombre: string;
            apellido: string;
            cedula: string;
            telefono: string;
        }
    }) => {
        console.log('handlePaymentSubmit called with:', paymentData);

        // Generate sequential payment reference with retry logic
        console.log('Generating sequential payment reference...');
        let paymentReference = '';
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                // Get the highest number from existing references
                const { data: lastOrder, error: queryError } = await supabase
                    .from('orders')
                    .select('payment_reference')
                    .not('payment_reference', 'is', null)
                    .order('payment_reference', { ascending: false })
                    .limit(1);

                if (queryError) {
                    console.error('Error querying last order:', queryError);
                    // Fallback to timestamp-based reference
                    paymentReference = `pagosbbc${Date.now().toString().slice(-8)}`;
                    break;
                }

                let nextNumber = 1;
                if (lastOrder && lastOrder.length > 0) {
                    const lastRef = lastOrder[0].payment_reference;
                    console.log('Last reference found:', lastRef);
                    const match = lastRef.match(/pagosbbc(\d+)/);
                    if (match) {
                        nextNumber = parseInt(match[1]) + 1;
                        console.log('Next number calculated:', nextNumber);
                    }
                }

                paymentReference = `pagosbbc${nextNumber.toString().padStart(4, '0')}`;

                // Check if this reference already exists (race condition protection)
                const { data: existingOrder, error: checkError } = await supabase
                    .from('orders')
                    .select('id')
                    .eq('payment_reference', paymentReference)
                    .limit(1);

                if (checkError) {
                    console.error('Error checking existing reference:', checkError);
                    // Fallback to timestamp-based reference
                    paymentReference = `pagosbbc${Date.now().toString().slice(-8)}`;
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
                paymentReference = `pagosbbc${Date.now().toString().slice(-8)}`;
                break;
            }
        }

        if (!paymentReference) {
            // Ultimate fallback
            paymentReference = `pagosbbc${Date.now().toString().slice(-8)}`;
        }

        console.log('Final payment reference:', paymentReference);

        // Prepare order data - using exact column names from database
        const orderData = {
            customername: `${paymentData.shipping.nombre} ${paymentData.shipping.apellido}`,
            date: new Date().toISOString(),
            total: paymentData.total,
            status: 'Pendiente',
            items: cart.map(item => ({
                productId: item.id,
                productName: item.name,
                quantity: item.cartQuantity,
                price: item.price_usd
            })),
            payment_method: paymentData.method,
            payment_reference: paymentData.reference?.trim() || paymentReference,
            customer_email: paymentData.email || null,
            payment_instructions: generatePaymentInstructions(paymentData.method, paymentReference, paymentData.total, paymentData.reference),
            payment_status: 'pending',
            // Shipping information
            shipping_name: paymentData.shipping.nombre,
            shipping_lastname: paymentData.shipping.apellido,
            shipping_id: paymentData.shipping.cedula,
            shipping_phone: paymentData.shipping.telefono
        };

        console.log('Order data to insert:', orderData);

        // Insert order into Supabase
        console.log('Inserting order into Supabase...');
        console.log('Full orderData being sent:', JSON.stringify(orderData, null, 2));

        try {
            const { data, error } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single();

            console.log('Supabase response - data:', data);
            console.log('Supabase response - error:', error);
            console.log('Full error object:', JSON.stringify(error, null, 2));

            if (error) {
                console.error('Detailed Supabase error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            console.log('Order created successfully:', data);

            // Clear cart and show success
            clearCart();
            const message = paymentData.email
                ? `Pedido creado exitosamente. Revisa tu email para las instrucciones de pago. Referencia: ${paymentReference}`
                : `Pedido creado exitosamente. Referencia: ${paymentReference}. Guarda esta referencia para seguimiento.`;
            alert(message);
        } catch (error) {
            console.error('Error in payment submission:', error);
            alert('Error al procesar el pago. Revisa la consola para más detalles.');
        }
    };

    const generatePaymentInstructions = (method: string, reference: string, total: number, userReference?: string): string => {
        const baseInstructions = {
            efectivo_divisa: `Paga en efectivo al recibir el pedido. Total: $${total.toFixed(2)} USD.`,
            efectivo_bs: `Paga en efectivo al recibir el pedido. Total: ${(total * (rate || 1)).toLocaleString('es-VE')} Bs.`,
            pago_movil: `Realiza el pago móvil a: Banco 0102, CI V-21.210.021, Teléfono 0414-2122121. Monto: ${(total * (rate || 1)).toLocaleString('es-VE')} Bs.`,
            banco_venezuela: `Transfiere a cuenta: 0102-1234-5678-9012, Bodegón Baraure Center C.A. Monto: ${(total * (rate || 1)).toLocaleString('es-VE')} Bs.`,
            cashea: `Escanea el código QR con la app Cashea. Total: $${total.toFixed(2)} USD.`
        };

        const instruction = baseInstructions[method as keyof typeof baseInstructions] || '';
        const referenceText = userReference ? ` Tu referencia: ${userReference}.` : '';
        return `${instruction}${referenceText} Referencia del pedido: ${reference}`;
    };

    const sendPaymentEmail = async (email: string, reference: string, instructions: string, total: number) => {
        const { data, error } = await supabase.functions.invoke('send-payment-email', {
            body: { email, reference, instructions, total }
        });

        if (error) {
            console.error('Error sending email:', error);
            throw error;
        }

        console.log('Email sent successfully:', data);
    };

    if (totalItems === 0) {
        return (
            <div className="text-center p-8">
                <h1 className="text-3xl font-bold mb-4">Tu Carrito de Compras</h1>
                <p className="text-gray-400 mb-6">Tu carrito está vacío.</p>
                <Link to="/" className="bg-primary-orange text-white font-bold py-3 px-6 rounded-md hover:bg-orange-600 transition-colors duration-300">
                    Seguir Comprando
                </Link>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Tu Carrito de Compras</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
                        <h2 className="text-xl font-bold">Resumen del Pedido ({totalItems} items)</h2>
                        <button onClick={clearCart} className="text-sm text-gray-400 hover:text-vibrant-red">
                            Vaciar Carrito
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-center space-x-4 border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                                <img src={item.imageurl} alt={item.name} className="w-20 h-20 object-cover rounded-md"/>
                                <div className="flex-grow">
                                    <h3 className="font-bold">{item.name}</h3>
                                                                        <p className="text-sm text-gray-400">${item.price_usd.toFixed(2)} USD</p>
                                                                        <p className="text-xs text-green-400 font-semibold">
                                                                            {loading ? 'Cargando...' : rate ? `${(item.price_usd * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'No disponible'}
                                                                        </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="number"
                                        value={item.cartQuantity}
                                        onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value, 10))}
                                        className="w-16 bg-gray-700 text-center rounded-md py-1"
                                        min="1"
                                    />
                                                                        <div className="w-24 text-right">
                                                                            <p className="font-bold">${(item.price_usd * item.cartQuantity).toFixed(2)} USD</p>
                                                                            <p className="text-xs text-green-400 font-semibold">
                                                                                {loading ? 'Cargando...' : rate ? `${((item.price_usd * item.cartQuantity) * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'No disponible'}
                                                                            </p>
                                                                        </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-vibrant-red">
                                    {/* Fix: Use 'className' instead of 'class' for custom elements in JSX. */}
                                    <ion-icon name="trash-outline" className="text-xl"></ion-icon>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg self-start sticky top-24">
                    <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Total</h2>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-300">Subtotal</span>
                        <span className="font-bold text-white text-xl">${totalPrice.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between mb-6">
                        <span className="text-gray-300">Subtotal en Bs</span>
                        <span className="font-bold text-green-400 text-lg">
                          {loading ? 'Cargando...' : rate ? `${(totalPrice * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : 'No disponible'}
                        </span>
                    </div>
                    <PaymentOptions total={totalPrice} onPaymentSubmit={handlePaymentSubmit} />
                </div>
            </div>
        </div>
    );
};
