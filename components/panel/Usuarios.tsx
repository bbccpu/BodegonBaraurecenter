import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Profile } from '../../types'; // Assuming Profile type exists and is accurate

const getRoleInfo = (role: Profile['role']) => {
  const info = {
    T1: { label: 'Usuario', color: 'bg-blue-500/20 text-blue-400' },
    T2: { label: 'Trabajador', color: 'bg-yellow-500/20 text-yellow-400' },
    T3: { label: 'Admin', color: 'bg-primary-orange/20 text-primary-orange' },
  };
  return info[role] || { label: 'Desconocido', color: 'bg-gray-500/20 text-gray-400' };
};

const Usuarios: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false }); // T3, T2, T1

      if (error) {
        console.error("Error fetching user profiles:", error);
        alert("No se pudieron cargar los perfiles de usuario.");
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'T1' | 'T2' | 'T3') => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const roleLabel = getRoleInfo(newRole).label;
    const confirmation = window.confirm(
      `¿Estás seguro de que quieres cambiar el rol de ${userToUpdate.nombre || userToUpdate.email} a "${roleLabel}"?`
    );

    if (!confirmation) {
      return;
    }

    const { data, error } = await supabase.rpc('update_user_role', {
      target_user_id: userId,
      new_role: newRole,
    });

    if (error) {
      console.error("Error updating user role:", error);
      alert(`Error al actualizar el rol: ${error.message}`);
    } else {
      alert("Rol actualizado correctamente.");
      // Update local state for immediate feedback
      setUsers(prevUsers =>
        prevUsers.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
      console.log(data); // Log success message from function
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-white">Cargando usuarios...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Gestión de Usuarios y Roles</h1>
      
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 font-semibold">Nombre</th>
                <th className="p-4 font-semibold">Apellido</th>
                <th className="p-4 font-semibold">Cédula</th>
                <th className="p-4 font-semibold">Teléfono</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Rol Asignado</th>
                <th className="p-4 font-semibold text-center">Cambiar Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                return (
                  <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-4 font-medium">{user.nombre || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{user.apellido || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{user.cedula || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{user.phone || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'T1' | 'T2' | 'T3')}
                        className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-primary-orange"
                      >
                        <option value="T1">Usuario</option>
                        <option value="T2">Trabajador</option>
                        <option value="T3">Admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Usuarios;