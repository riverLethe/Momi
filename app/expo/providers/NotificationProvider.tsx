import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
// @ts-ignore – expo-notifications types provided by expo SDK runtime
import * as Notifications from 'expo-notifications';
import type { DailyNotificationTrigger } from 'expo-notifications';
import { storage, STORAGE_KEYS } from '@/utils/storage.utils';
import { useData } from '@/providers/DataProvider';
import { useBudgets } from '@/hooks/useBudgets';
import { summariseBills } from '@/utils/abi-summary.utils';
import { DatePeriodEnum } from '@/types/reports.types';
import { startOfMonth, endOfMonth, format as formatDate } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Date;
  read: boolean;
}

interface NotificationSettings {
  pushEnabled: boolean;
  logReminders: boolean;
  billReminders: boolean;
  budgetAlerts: boolean;
  familyUpdates: boolean;
  weeklyReports: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

const defaultSettings: NotificationSettings = {
  pushEnabled: true,
  logReminders: true,
  billReminders: true,
  budgetAlerts: true,
  familyUpdates: true,
  weeklyReports: false,
};

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
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  // External data for alert computations ------------------------------
  const { bills, dataVersion } = useData();
  const { budgets } = useBudgets();

  // -------------------------------------------------------------------
  // 1. Load persisted notifications & settings on mount
  useEffect(() => {
    (async () => {
      const storedNotis = await storage.getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS);
      if (storedNotis) setNotifications(storedNotis.map(n => ({ ...n, createdAt: new Date(n.createdAt) })));

      const storedSettings = await storage.getItem<NotificationSettings>(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (storedSettings) setSettings(prev => ({ ...prev, ...storedSettings }));
    })();
  }, []);

  // 2. Persist when notifications or settings change ------------------
  useEffect(() => {
    storage.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications).catch(() => { });
  }, [notifications]);

  useEffect(() => {
    storage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings).catch(() => { });
  }, [settings]);

  // -------------------------------------------------------------------
  // 3. Budget Alert Logic ---------------------------------------------
  // Track which months have been alerted to avoid duplicates
  const [alertHistory, setAlertHistory] = useState<Record<string, { l80: boolean; l100: boolean }>>({});

  const maybeTriggerBudgetAlert = useCallback(() => {
    if (!settings.budgetAlerts) return;

    const today = new Date();
    const monthKey = formatDate(today, 'yyyy-MM');

    const summary = summariseBills(
      bills,
      budgets,
      DatePeriodEnum.MONTH,
      startOfMonth(today),
      endOfMonth(today)
    );

    const usagePct = summary.budgetUtilisation.usagePct ?? 0;
    if (usagePct === 0) return; // no budget set

    const hist = alertHistory[monthKey] || { l80: false, l100: false };

    if (usagePct >= 100 && !hist.l100) {
      addNotification({
        title: 'Budget Exceeded',
        message: 'You have reached 100% of your monthly budget.',
        type: 'error',
      });
      setAlertHistory(prev => ({ ...prev, [monthKey]: { ...hist, l100: true } }));
    } else if (usagePct >= 80 && !hist.l80) {
      addNotification({
        title: 'Budget 80% Utilised',
        message: 'You have spent 80% of your monthly budget.',
        type: 'warning',
      });
      setAlertHistory(prev => ({ ...prev, [monthKey]: { ...hist, l80: true } }));
    }
  }, [settings.budgetAlerts, bills, budgets, alertHistory]);

  useEffect(() => {
    maybeTriggerBudgetAlert();
  }, [maybeTriggerBudgetAlert, dataVersion]);

  // -------------------------------------------------------------------
  // 4. Daily Log Reminder ---------------------------------------------
  const scheduleLogReminder = useCallback(async () => {
    if (!settings.pushEnabled || !settings.logReminders) return; // treat as notification off or user disabled

    // Cancel all previous scheduled reminders (lightweight)
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => { });

    // Determine if user already logged bills today
    const todayStr = formatDate(new Date(), 'yyyy-MM-dd');
    const hasBillToday = bills.some(b => {
      const d = new Date(b.date as any);
      return formatDate(d, 'yyyy-MM-dd') === todayStr;
    });

    if (hasBillToday) return; // no reminder needed

    // Request permissions (only once)
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== 'granted') return; // cannot schedule
    }

    const triggerHour = 20;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Don't forget to log today's expenses",
        body: 'Tap to add your bills now.',
        sound: 'default',
      },
      trigger: {
        hour: triggerHour,
        minute: 0,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      },
    }).catch(() => { });
  }, [bills, settings.pushEnabled, settings.logReminders]);

  // Schedule log reminder when bills or settings change
  useEffect(() => {
    scheduleLogReminder();
  }, [scheduleLogReminder, dataVersion]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
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

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value = {
    notifications,
    unreadCount,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updateSettings,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 