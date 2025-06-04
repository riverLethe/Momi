import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
} from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * 格式化金额显示
 */
export const formatCurrency = (amount: number, showSymbol = true): string => {
  const formatted = Math.abs(amount).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = showSymbol ? "¥" : "";
  return amount >= 0 ? `${symbol}${formatted}` : `-${symbol}${formatted}`;
};

/**
 * 格式化日期显示
 */
export const formatDate = (date: Date, formatStr = "yyyy-MM-dd"): string => {
  return format(date, formatStr, { locale: zhCN });
};

/**
 * 格式化时间显示
 */
export const formatTime = (date: Date): string => {
  return format(date, "HH:mm", { locale: zhCN });
};

/**
 * 格式化相对时间 - 支持国际化
 */
export const formatRelativeTime = (
  date: Date,
  t?: (key: string, options?: any) => string
): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (!t) {
    // 如果没有传入翻译函数，使用英文默认值
    if (diffInMinutes < 1) {
      return "just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return formatDate(date, "MM-dd");
    }
  }

  if (diffInMinutes < 1) {
    return t("just now");
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${t("minutes ago")}`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${t("hours ago")}`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${t("days ago")}`;
  } else {
    return formatDate(date, "MM-dd");
  }
};

/**
 * 获取时间范围
 */
export const getTimeRange = (range: string): { start: Date; end: Date } => {
  const now = new Date();

  switch (range) {
    case "today":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59
        ),
      };
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case "year":
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
  }
};

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 生成邀请码
 */
export const generateInviteCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 验证邮箱格式
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证金额格式
 */
export const isValidAmount = (amount: string): boolean => {
  const amountRegex = /^\d+(\.\d{1,2})?$/;
  return amountRegex.test(amount) && parseFloat(amount) > 0;
};

/**
 * 解析金额字符串
 */
export const parseAmount = (amountStr: string): number => {
  // 移除所有非数字和小数点的字符
  const cleaned = amountStr.replace(/[^\d.]/g, "");
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * 深拷贝对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (typeof obj === "object") {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
};

/**
 * 计算百分比
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * 获取颜色的透明度版本
 */
export const getColorWithOpacity = (color: string, opacity: number): string => {
  // 如果是十六进制颜色
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // 如果已经是 rgba 格式
  if (color.startsWith("rgba")) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`);
  }

  // 如果是 rgb 格式
  if (color.startsWith("rgb")) {
    return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
  }

  return color;
};

/**
 * 文件大小格式化
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 获取文件扩展名
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

/**
 * 检查是否为图片文件
 */
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
  const extension = getFileExtension(filename).toLowerCase();
  return imageExtensions.includes(extension);
};

/**
 * 安全的JSON解析
 */
export const safeJsonParse = <T>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
};

/**
 * 生成随机颜色
 */
export const generateRandomColor = (): string => {
  const colors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
