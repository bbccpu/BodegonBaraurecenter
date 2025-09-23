import React, { useState } from 'react';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../types';

interface PaymentOptionsProps {
    onPaymentSubmit?: (paymentData: {
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
    }) => void;
    total: number;
}

const AccordionItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-700 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left font-bold py-4 px-2 focus:outline-none"
            >
                <span>{title}</span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ion-icon name="chevron-down-outline"></ion-icon>
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const PaymentOptions: React.FC<PaymentOptionsProps> = ({ onPaymentSubmit, total }) => {
    const [email, setEmail] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('');
    const [reference, setReference] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Shipping information
    const [shipping, setShipping] = useState({
        nombre: '',
        apellido: '',
        cedula: '',
        telefono: ''
    });

    // Métodos que requieren número de referencia
    const requiresReference = ['banco_venezuela', 'pago_movil', 'cashea'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted with:', { email, selectedMethod, reference, shipping, total });

        if (!selectedMethod) {
            alert('Por favor seleccione un método de pago');
            return;
        }
        if (requiresReference.includes(selectedMethod) && !reference.trim()) {
            alert('Este método de pago requiere un número de referencia');
            return;
        }
        if (!shipping.nombre.trim() || !shipping.apellido.trim() || !shipping.cedula.trim() || !shipping.telefono.trim()) {
            alert('Por favor complete toda la información de envío');
            return;
        }
        setIsSubmitting(true);
        try {
            console.log('Calling onPaymentSubmit...');
            if (onPaymentSubmit) {
                await onPaymentSubmit({
                    email: email.trim() || undefined,
                    method: selectedMethod,
                    reference: reference.trim() || undefined,
                    total,
                    shipping
                });
                console.log('onPaymentSubmit completed successfully');
            }
        } catch (error) {
            console.error('Error al procesar el pago:', error);
            alert('Error al procesar el pago. Intente nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                {/* Shipping Information */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3 border-b border-gray-600 pb-2">Información de Envío</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="shipping-nombre" className="block text-sm font-medium mb-2">Nombre</label>
                            <input
                                id="shipping-nombre"
                                type="text"
                                value={shipping.nombre}
                                onChange={(e) => setShipping({...shipping, nombre: e.target.value})}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                                placeholder="Tu nombre"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="shipping-apellido" className="block text-sm font-medium mb-2">Apellido</label>
                            <input
                                id="shipping-apellido"
                                type="text"
                                value={shipping.apellido}
                                onChange={(e) => setShipping({...shipping, apellido: e.target.value})}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                                placeholder="Tu apellido"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="shipping-cedula" className="block text-sm font-medium mb-2">Cédula</label>
                            <input
                                id="shipping-cedula"
                                type="text"
                                value={shipping.cedula}
                                onChange={(e) => setShipping({...shipping, cedula: e.target.value})}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                                placeholder="V-12345678"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="shipping-telefono" className="block text-sm font-medium mb-2">Teléfono</label>
                            <input
                                id="shipping-telefono"
                                type="tel"
                                value={shipping.telefono}
                                onChange={(e) => setShipping({...shipping, telefono: e.target.value})}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                                placeholder="0414-1234567"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="customer-email" className="block text-sm font-medium mb-2">Correo Electrónico (Opcional)</label>
                    <input
                        id="customer-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                        placeholder="tu@email.com"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Método de Pago</label>
                    <select
                        value={selectedMethod}
                        onChange={(e) => {
                            console.log('Method changed to:', e.target.value);
                            setSelectedMethod(e.target.value);
                            // Clear reference when changing method
                            if (!requiresReference.includes(e.target.value)) {
                                setReference('');
                            }
                        }}
                        className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                        required
                    >
                        <option value="">Seleccionar método</option>
                        <option value="efectivo_divisa">Efectivo en Divisa</option>
                        <option value="efectivo_bs">Efectivo en Bs</option>
                        <option value="pago_movil">Pago Móvil</option>
                        <option value="banco_venezuela">Banco de Venezuela</option>
                        <option value="cashea">Cashea</option>
                    </select>
                </div>
                {(() => {
                    const shouldShow = requiresReference.includes(selectedMethod);
                    console.log('Should show reference field:', shouldShow, 'for method:', selectedMethod);
                    return shouldShow && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Número de Referencia</label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-orange"
                                placeholder="Ingresa el número de referencia"
                                required
                            />
                        </div>
                    );
                })()}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary-orange text-white font-bold py-3 rounded-lg text-lg hover:bg-orange-600 transition-colors duration-300 mb-4 disabled:opacity-50"
                >
                    {isSubmitting ? 'Procesando...' : 'Pagar'}
                </button>
            </form>
            <div className="bg-gray-700 rounded-lg">
                <AccordionItem title="Efectivo en Divisa">
                    <div
                        className="h-40 bg-cover bg-center rounded-lg flex items-center justify-center"
                        style={{backgroundImage: "url('https://i.imgur.com/L23eN98.jpeg')"}}
                    >
                        <p className="text-white text-2xl font-black bg-black bg-opacity-50 p-4 rounded">Paga en efectivo al recibir (USD)</p>
                    </div>
                </AccordionItem>
                <AccordionItem title="Efectivo en Bs">
                    <div
                        className="h-40 bg-cover bg-center rounded-lg flex items-center justify-center"
                        style={{backgroundImage: "url('https://i.imgur.com/L23eN98.jpeg')"}}
                    >
                        <p className="text-white text-2xl font-black bg-black bg-opacity-50 p-4 rounded">Paga en efectivo al recibir (Bs)</p>
                    </div>
                </AccordionItem>
                <AccordionItem title="Pago Móvil">
                    <div className="bg-vinotinto p-4 rounded-lg text-white text-center font-mono">
                        <p className="font-bold text-lg mb-2">Datos de Pago Móvil</p>
                        <p>Banco: <strong>0102 - Bco Venezuela</strong></p>
                        <p>CI: <strong>V-21.210.021</strong></p>
                        <p>Teléfono: <strong>0414-2122121</strong></p>
                    </div>
                </AccordionItem>
                <AccordionItem title="Banco de Venezuela">
                    <div className="bg-vinotinto p-4 rounded-lg text-white text-center font-mono">
                        <p className="font-bold text-lg mb-2">Cuenta Banco de Venezuela</p>
                        <p>Número de Cuenta: <strong>0102-1234-5678-9012</strong></p>
                        <p>Titular: <strong>Bodegón Baraure Center C.A</strong></p>
                        <p>CI: <strong>J-12345678-9</strong></p>
                    </div>
                </AccordionItem>
                <AccordionItem title="Cashea">
                    <div className="p-2 bg-white rounded-lg">
                          <img src="https://i.imgur.com/yaXA2Dl.png" alt="Paga con Cashea" className="w-full object-contain"/>
                          <p className="text-center text-sm text-gray-600 mt-2">Escanea el código QR con la app Cashea</p>
                    </div>
                </AccordionItem>
            </div>
        </div>
    );
};