


import React from 'react';
import { useNavigate } from 'react-router-dom';
// Fix: Import for side-effects to load global custom JSX element types for ion-icon.
import '../../types';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div>
            <div className="mb-6">
                 <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                    {/* Fix: Use 'className' instead of 'class' for custom elements in JSX. */}
                    <ion-icon name="arrow-back-outline" className="mr-1"></ion-icon>
                    Volver
                </button>
            </div>
            <h1 className="text-3xl font-bold text-white mb-8">Administrar Perfil</h1>
            <div className="bg-gray-800 p-8 rounded-lg max-w-2xl mx-auto">
                <form className="space-y-6">
                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-full bg-primary-orange flex items-center justify-center text-white text-4xl font-bold">
                            U
                        </div>
                        <div>
                            <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors">
                                Cambiar Foto
                            </label>
                            <input id="avatar-upload" type="file" className="hidden" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de Usuario</label>
                        <input
                            type="text"
                            defaultValue="usuario_actual"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nueva Contraseña</label>
                        <input
                            type="password"
                            placeholder="Dejar en blanco para no cambiar"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Confirmar Nueva Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-orange"
                        />
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="w-full bg-primary-orange text-white font-bold py-3 px-4 rounded-md hover:bg-orange-600 transition-colors duration-300">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;