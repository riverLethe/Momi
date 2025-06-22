import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
// @ts-ignore – expo-notifications types provided by expo SDK runtime
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { storage, STORAGE_KEYS } from '@/utils/storage.utils';
import { useData } from '@/providers/DataProvider';
import { useBudgets } from '@/hooks/useBudgets';
import { summariseBills } from '@/utils/abi-summary.utils';
import { DatePeriodEnum } from '@/types/reports.types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, format as formatDate } from 'date-fns';

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
  // 3. Budget Alert Logic - Simple daily check ----------------------
  const { t } = useTranslation();

  const checkAndScheduleBudget = useCallback(async () => {
    if (!settings.pushEnabled || !settings.budgetAlerts) return;

    // Cancel existing budget alerts
    await Notifications.cancelScheduledNotificationAsync('budget-weekly-check').catch(() => { });
    await Notifications.cancelScheduledNotificationAsync('budget-monthly-check').catch(() => { });
    await Notifications.cancelScheduledNotificationAsync('budget-yearly-check').catch(() => { });

    // Request permissions if needed
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== 'granted') return;
    }

    const today = new Date();

    // Define the three periods to check
    const periods = [
      {
        type: DatePeriodEnum.WEEK,
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
        identifier: 'budget-weekly-check',
        labelKey: 'weekly'
      },
      {
        type: DatePeriodEnum.MONTH,
        start: startOfMonth(today),
        end: endOfMonth(today),
        identifier: 'budget-monthly-check',
        labelKey: 'monthly'
      },
      {
        type: DatePeriodEnum.YEAR,
        start: startOfYear(today),
        end: endOfYear(today),
        identifier: 'budget-yearly-check',
        labelKey: 'yearly'
      }
    ];

    // Check each period for budget alerts
    for (const period of periods) {
      const summary = summariseBills(
        bills,
        budgets,
        period.type,
        period.start,
        period.end
      );

      const usagePct = summary.budgetUtilisation.usagePct ?? 0;

      // Only schedule if there's actually a budget set for this period
      if (usagePct > 0) {
        if (usagePct >= 100) {
          // 100% exceeded - critical alert
          await Notifications.scheduleNotificationAsync({
            identifier: period.identifier,
            content: {
              title: t('Budget exceeded'),
              body: t('You have reached 100% of your {{period}} budget.', { period: t(period.labelKey) }),
            },
            trigger: {
              hour: 18,
              minute: 0,
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
            },
          }).catch(() => { });
        } else if (usagePct >= 80) {
          // 80% warning alert
          await Notifications.scheduleNotificationAsync({
            identifier: period.identifier,
            content: {
              title: t('Budget 80% used'),
              body: t('You have spent 80% of your {{period}} budget.', { period: t(period.labelKey) }),
            },
            trigger: {
              hour: 18,
              minute: 0,
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
            },
          }).catch(() => { });
        }
      }
    }
  }, [settings.pushEnabled, settings.budgetAlerts, bills, budgets, t]);

  useEffect(() => {
    checkAndScheduleBudget();
  }, [checkAndScheduleBudget]);

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

  // -------------------------------------------------------------------
  // 5. Weekly Report Notification -------------------------------------
  const scheduleWeeklyReport = useCallback(async () => {
    if (!settings.pushEnabled || !settings.weeklyReports) return;

    // cancel existing weekly triggers (identified by id prefix)
    await Notifications.cancelScheduledNotificationAsync('weekly-report').catch(() => { });

    await Notifications.scheduleNotificationAsync({
      identifier: 'weekly-report',
      content: {
        title: t('Your weekly report is ready'),
        body: t('Open MomiQ to view insights.'),
      },
      trigger: {
        weekday: 2, // Monday
        hour: 8,
        minute: 0,
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY
      },
    }).catch(() => { });
  }, [settings.pushEnabled, settings.weeklyReports]);

  useEffect(() => {
    scheduleWeeklyReport();
  }, [scheduleWeeklyReport]);

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