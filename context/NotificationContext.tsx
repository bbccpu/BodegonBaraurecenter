import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserRole } from '../types';

interface Notification {
  id: string;
  type: 'order' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  userRole: UserRole | null;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, userRole }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Only enable real-time notifications for T2 and T3 users
  useEffect(() => {
    if (!userRole || (userRole !== 'T2' && userRole !== 'T3')) {
      return;
    }

    // Subscribe to new orders
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload);
          const newOrder = payload.new;

          // Create notification for new order
          const notification: Notification = {
            id: `order-${Date.now()}`,
            type: 'order',
            title: 'Nuevo Pedido',
            message: `Pedido #${newOrder.payment_reference || newOrder.id.slice(0, 8)} - $${newOrder.total} - ${newOrder.customerName}`,
            timestamp: new Date(),
            read: false
          };

          addNotification(notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove notification after 10 seconds if not read
    setTimeout(() => {
      setNotifications(prev =>
        prev.filter(n => n.id !== newNotification.id || n.read)
      );
    }, 10000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};