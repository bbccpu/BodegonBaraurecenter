import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTermsClick: () => void;
  onLoginSuccess: (rememberMe: boolean) => void;
}

// Helper para la función de verificación
const verificarCedula = async (nacionalidad, cedula) => {
  if (!nacionalidad || !cedula) {
    return { success: false, message: "Nacionalidad y cédula son requeridas" };
  }
  try {
    const { data, error } = await supabase.functions.invoke('verify-cedula', {
      body: { nacionalidad, cedula },
    });
    if (error) throw new Error(error.message);
    if (data.error) return { success: false, message: data.error_str };
    return { success: true, data: data.data };
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onTermsClick, onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot_cedula' | 'confirmation'>('login');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // UI feedback state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setView('login'); // Default to login view
      setEmail('');
      setPassword('');
      setNombre('');
      setApellido('');
      setCedula('');
      setTelefono('');
      setIsMinor(false);
      setTermsAccepted(false);
      setError(null);
      setSuccessMessage(null);
      setLoading(false);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        setError(error.message);
    } else if (data.user) {
        onLoginSuccess(rememberMe);
    }
    setLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!termsAccepted) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    setLoading(true);

    // Reverted to original logic: Rely on the database trigger for profile creation.
    const proceedWithEmailVerification = async (message: string) => {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nombre,
                    apellido,
                    cedula,
                    telefono,
                    verification_method: 'email',
                },
            },
        });

        if (signUpError) {
            setError(signUpError.message);
        } else if (signUpData.user) {
            setSuccessMessage(message);
            setView('confirmation');
        }
        setLoading(false);
    };

    if (isMinor) {
        await proceedWithEmailVerification("Registro iniciado. Revisa tu correo para verificar tu cuenta.");
        return;
    }

    let nacionalidad = '';
    let cedulaNumber = '';
    const cleanedCedula = cedula.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (cleanedCedula.startsWith('V') || cleanedCedula.startsWith('E')) {
        nacionalidad = cleanedCedula.charAt(0);
        cedulaNumber = cleanedCedula.substring(1);
    } else if (/^\d+$/.test(cleanedCedula)) {
        nacionalidad = 'V';
        cedulaNumber = cleanedCedula;
    }

    if (!nacionalidad || !cedulaNumber) {
        setError("Formato de cédula inválido. Use V-12345678 o solo el número.");
        setLoading(false);
        return;
    }

    const verificationResult = await verificarCedula(nacionalidad, cedulaNumber);

    if (verificationResult.success) {
        const apiData = verificationResult.data;
        const cedulaMatches = apiData.cedula.toString() === cedulaNumber;
        const inputNombre = nombre.toUpperCase();
        const inputApellido = apellido.toUpperCase();
        const apiNombres = [apiData.primer_nombre, apiData.segundo_nombre].filter(Boolean).map(n => n.toUpperCase());
        const apiApellidos = [apiData.primer_apellido, apiData.segundo_apellido].filter(Boolean).map(a => a.toUpperCase());
        const nombreCoincide = apiNombres.some(n => n === inputNombre);
        const apellidoCoincide = apiApellidos.some(a => a === inputApellido);

        if (cedulaMatches && (nombreCoincide || apellidoCoincide)) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nombre: apiData.primer_nombre,
                        apellido: apiData.primer_apellido,
                        cedula: `${apiData.nacionalidad}-${apiData.cedula}`,
                        telefono,
                        verification_method: 'cedula',
                    },
                },
            });
            if (signUpError) {
                setError(signUpError.message);
            } else if (signUpData.user) {
                setSuccessMessage("¡Verificación exitosa! Revisa tu correo para activar tu cuenta.");
                setView('confirmation');
            }
        } else {
            setError("Los datos no coinciden con el registro oficial. Verifica tu información o selecciona la opción para registrarte por correo.");
            setLoading(false);
        }
    } else {
        await proceedWithEmailVerification("No pudimos validar tu cédula. Por favor, completa tu registro y verifica tu cuenta por correo.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md m-4 relative border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <ion-icon name="close-outline" style={{fontSize: '24px'}}></ion-icon>
        </button>
        
        {view === 'login' && (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
                  <input type="email" id="email" name="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange" />
              </div>
              <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Clave</label>
                  <input type="password" id="password" name="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange" />
              </div>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                    <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-primary-orange focus:ring-primary-orange" />
                    <label htmlFor="rememberMe" className="text-sm text-gray-300">Recordar sesión</label>
                </div>
                <button type="button" onClick={() => setView('forgot_cedula')} className="text-sm text-gray-400 hover:text-primary-orange hover:underline">
                  ¿Olvidaste tu clave?
                </button>
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-primary-orange text-white font-bold py-3 px-4 rounded-md hover:bg-orange-600 transition-colors duration-300 mt-6 disabled:bg-gray-500">
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-300">
                  ¿No tienes una cuenta?{' '}
                  <button type="button" onClick={() => setView('register')} className="font-semibold text-primary-orange hover:underline">
                    Regístrate aquí
                  </button>
                </p>
              </div>
            </form>
          </>
        )}

        {view === 'register' && (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Crear Cuenta</h2>
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
               {/* Input fields are connected to state now */}
              <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                  <input type="text" id="nombre" name="nombre" placeholder="Tu primer nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange" />
              </div>
              <div>
                  <label htmlFor="apellido" className="block text-sm font-medium text-gray-300 mb-1">Apellido</label>
                  <input type="text" id="apellido" name="apellido" placeholder="Tu primer apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange" />
              </div>
              <div>
                  <label htmlFor="cedula" className="block text-sm font-medium text-gray-300 mb-1">Cédula</label>
                  <input type="text" id="cedula" name="cedula" placeholder="V-12345678" value={cedula} onChange={(e) => setCedula(e.target.value)} required className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange" />
              </div>
              <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
                  <input type="tel" id="telefono" name="telefono" placeholder="0412-1234567" value={telefono} onChange={(e) => setTelefono(e.target.value)} required className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange" />
              </div>
              <div>
                  <label htmlFor="email-register" className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
                  <input type="email" id="email-register" name="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange" />
              </div>
              <div>
                  <label htmlFor="password-register" className="block text-sm font-medium text-gray-300 mb-1">Clave</label>
                  <input type="password" id="password-register" name="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-600 border border-gray-500 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange" />
              </div>
              
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}

              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                    <input type="checkbox" id="isMinor" checked={isMinor} onChange={(e) => setIsMinor(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-primary-orange focus:ring-primary-orange" />
                    <label htmlFor="isMinor" className="text-sm text-gray-300">Soy menor de edad (o mis datos no aparecen en el registro).</label>
                </div>
                <div className="flex items-center space-x-2">
                    <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} required className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-primary-orange focus:ring-primary-orange" />
                    <label htmlFor="terms" className="text-sm text-gray-300">
                      Acepto los{' '}
                      <button type="button" onClick={onTermsClick} className="text-primary-orange hover:underline">
                        Términos y Condiciones
                      </button>
                    </label>
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-primary-orange text-white font-bold py-3 px-4 rounded-md hover:bg-orange-600 transition-colors duration-300 mt-6 disabled:bg-gray-500">
                {loading ? 'Verificando...' : 'Registrarse'}
              </button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-300">
                  ¿Ya tienes una cuenta?{' '}
                  <button type="button" onClick={() => setView('login')} className="font-semibold text-primary-orange hover:underline">
                    Inicia sesión
                  </button>
                </p>
              </div>
            </form>
          </>
        )}
        
        {view === 'confirmation' && (
           <div className="text-center">
             <h2 className="text-2xl font-bold text-center mb-6">{successMessage ? 'Registro en Proceso' : 'Error'}</h2>
             <p className="text-gray-300 mb-6">
               {successMessage || error || 'Ha ocurrido un error.'}
             </p>
             <button onClick={onClose} className="w-full bg-primary-orange text-white font-bold py-3 px-4 rounded-md hover:bg-orange-600 transition-colors duration-300">
               Entendido
             </button>
           </div>
        )}

      </div>
    </div>
  );
};