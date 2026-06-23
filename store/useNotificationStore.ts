import { create } from 'zustand';

export type NotificationType = 'BOOK_REQUEST' | 'CHAT_MESSAGE';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  url?: string;
  isRead: boolean;
  isVisible: boolean;
  createdAt: number;
}

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'isRead' | 'isVisible'>) => void;
  markAsRead: (id: string) => void;
  hideToast: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      { ...notification, isRead: false, isVisible: true },
      ...state.notifications
    ]
  })),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, isRead: true, isVisible: false } : n
    )
  })),

  hideToast: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, isVisible: false } : n
    )
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true, isVisible: false }))
  }))
}));
