import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../types';

interface StatusButtonsProps {
  userRole: UserRole | null;
}

// Helper function to format the time difference
const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return "hace un momento";
    let interval = seconds / 31536000; // years
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000; // months
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400; // days
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600; // hours
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60; // minutes
    if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
    return `hace ${Math.floor(seconds)} segundos`;
};

export const StatusButtons: React.FC<StatusButtonsProps> = ({ userRole }) => {
  const [storeStatus, setStoreStatus] = useState<'OPEN' | 'CLOSED' | null>(null);
  const [lastChanged, setLastChanged] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('store_status')
        .select('current_status, last_changed_at')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Error fetching store status:', error);
      } else if (data) {
        setStoreStatus(data.current_status as 'OPEN' | 'CLOSED');
        setLastChanged(new Date(data.last_changed_at));
      }
    };

    fetchStatus();

  }, []);

  useEffect(() => {
    if (!lastChanged) return;

    const intervalId = setInterval(() => {
      setTimeAgo(formatTimeAgo(lastChanged));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [lastChanged]);

  const handleStatusChange = async (newStatus: 'OPEN' | 'CLOSED') => {
    if (storeStatus === newStatus) return;

    const { data, error } = await supabase
      .from('store_status')
      .update({
        current_status: newStatus,
        last_changed_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      console.error('Error updating store status:', error);
    } else if (data) {
      setStoreStatus(data.current_status as 'OPEN' | 'CLOSED');
      setLastChanged(new Date(data.last_changed_at));
    }
  };

  const canChangeStatus = userRole === 'T2' || userRole === 'T3';
  const baseClasses = "w-full sm:w-auto flex-1 sm:flex-initial sm:px-12 text-lg font-bold py-3 px-4 rounded-lg border-b-4 transform transition-all duration-200 ease-in-out focus:outline-none flex flex-col items-center";
  const embossClasses = "shadow-md hover:shadow-lg active:translate-y-1 active:border-b-2";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  // Colores personalizados
  const openActive = "bg-green-500 text-white border-green-700 shadow-[0_0_10px_2px_#22ff22]";
  const openInactive = "bg-green-200 text-green-700 border-green-400";
  const closedActive = "bg-red-600 text-white border-red-800 shadow-[0_0_10px_2px_#ff2222]";
  const closedInactive = "bg-red-200 text-red-700 border-red-400";


  // Los colores SIEMPRE reflejan el estado real de la tienda, solo se deshabilita el click para T1
  const openButtonProps = {
    onClick: canChangeStatus ? () => handleStatusChange('OPEN') : undefined,
    disabled: canChangeStatus ? storeStatus === 'OPEN' : true,
    className: `${baseClasses} ${embossClasses} ${storeStatus === 'OPEN' ? openActive : openInactive} ${!canChangeStatus ? 'opacity-70 cursor-not-allowed' : ''}`
  };

  const closedButtonProps = {
    onClick: canChangeStatus ? () => handleStatusChange('CLOSED') : undefined,
    disabled: canChangeStatus ? storeStatus === 'CLOSED' : true,
    className: `${baseClasses} ${embossClasses} ${storeStatus === 'CLOSED' ? closedActive : closedInactive} ${!canChangeStatus ? 'opacity-70 cursor-not-allowed' : ''}`
  };

  // Badge de estado actual
  const statusBadge = storeStatus === 'OPEN'
    ? <span className="inline-block bg-green-500 text-white font-bold px-4 py-2 rounded-full shadow-lg text-lg animate-pulse">ABIERTO</span>
    : storeStatus === 'CLOSED'
    ? <span className="inline-block bg-red-600 text-white font-bold px-4 py-2 rounded-full shadow-lg text-lg animate-pulse">CERRADO</span>
    : null;

  // Botón de acción disponible
  let actionButton = null;
  if (storeStatus === 'OPEN') {
    actionButton = (
      <button {...closedButtonProps}>
        <span>CERRAR TIENDA</span>
        <span className="text-xs font-normal mt-1">{timeAgo}</span>
      </button>
    );
  } else if (storeStatus === 'CLOSED') {
    actionButton = (
      <button {...openButtonProps}>
        <span>ABRIR TIENDA</span>
        <span className="text-xs font-normal mt-1">{timeAgo}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 my-6">
      {statusBadge}
      {actionButton}
    </div>
  );
};