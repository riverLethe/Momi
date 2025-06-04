import { Category } from "@/types";

// 默认消费类别
export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  // 支出类别
  {
    name: "Food & Dining",
    icon: "utensils",
    color: "#ef4444",
    type: "expense",
    isDefault: true,
  },
  {
    name: "Transportation",
    icon: "car",
    color: "#3b82f6",
    type: "expense",
    isDefault: true,
  },
  {
    name: "Shopping",
    icon: "shopping-bag",
    color: "#8b5cf6",
    type: "expense",
    isDefault: true,
  },
  {
    name: "Entertainment",
    icon: "gamepad-2",
    color: "#f59e0b",
    type: "expense",
    isDefault: true,
  },
  {
    name: "Healthcare",
    icon: "heart-pulse",
    color: "#10b981",
    type: "expense",
    isDefault: true,
  },
  {
    name: "Education",
    icon: "graduation-cap",
    color: "#6366f1",
    type: "expense",
    isDefault: true,
  },
  {
    name: "Housing",
    icon: "home",
    color: "#84cc16",
    type: "expense",
    isDefault: true,
  },
  {
    name: "Communication",
    icon: "smartphone",
    color: "#06b6d4",
    type: "expense",
    isDefault: true,
  },
  {
    name: "Clothing",
    icon: "shirt",
    color: "#ec4899",
    type: "expense",
    isDefault: true,
  },
  {
    name: "Other",
    icon: "more-horizontal",
    color: "#6b7280",
    type: "expense",
    isDefault: true,
  },

  // 收入类别
  {
    name: "Salary",
    icon: "banknote",
    color: "#22c55e",
    type: "income",
    isDefault: true,
  },
  {
    name: "Bonus",
    icon: "gift",
    color: "#f97316",
    type: "income",
    isDefault: true,
  },
  {
    name: "Investment",
    icon: "trending-up",
    color: "#8b5cf6",
    type: "income",
    isDefault: true,
  },
  {
    name: "Part-time",
    icon: "briefcase",
    color: "#3b82f6",
    type: "income",
    isDefault: true,
  },
  {
    name: "Other Income",
    icon: "plus-circle",
    color: "#6b7280",
    type: "income",
    isDefault: true,
  },
];

// 支付账户类型
export const PAYMENT_ACCOUNT_TYPES = [
  { value: "cash", label: "Cash", icon: "banknote" },
  { value: "bank_card", label: "Bank Card", icon: "credit-card" },
  { value: "alipay", label: "Alipay", icon: "smartphone" },
  { value: "wechat", label: "WeChat Pay", icon: "message-circle" },
  { value: "credit_card", label: "Credit Card", icon: "credit-card" },
  { value: "other", label: "Other", icon: "more-horizontal" },
] as const;

// 预算周期
export const BUDGET_PERIODS = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

// 导出格式
export const EXPORT_FORMATS = [
  {
    value: "csv",
    label: "CSV File",
    description: "Suitable for opening in Excel",
  },
  {
    value: "pdf",
    label: "PDF File",
    description: "Suitable for printing and sharing",
  },
] as const;

// 时间范围选项
export const TIME_RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom" },
] as const;

// 排序选项
export const SORT_OPTIONS = [
  { value: "date_desc", label: "Date (Latest)" },
  { value: "date_asc", label: "Date (Earliest)" },
  { value: "amount_desc", label: "Amount (Highest)" },
  { value: "amount_asc", label: "Amount (Lowest)" },
  { value: "category", label: "Category" },
] as const;

// 图表类型
export const CHART_TYPES = [
  { value: "pie", label: "Pie Chart", icon: "pie-chart" },
  { value: "bar", label: "Bar Chart", icon: "bar-chart" },
  { value: "line", label: "Line Chart", icon: "line-chart" },
] as const;

// 应用配置
export const APP_CONFIG = {
  name: "Momi",
  version: "1.0.0",
  description: "Smart accounting, easy financial management",

  // AI 相关配置
  ai: {
    targetAccuracy: 0.9, // 90% 准确率目标
    maxRetries: 3,
    timeout: 30000, // 30秒超时
  },

  // 分页配置
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  // 文件上传配置
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedDocumentTypes: [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },

  // 缓存配置
  cache: {
    transactionsTTL: 5 * 60 * 1000, // 5分钟
    categoriesTTL: 30 * 60 * 1000, // 30分钟
    userTTL: 60 * 60 * 1000, // 1小时
  },
} as const;

// 错误消息键值
export const ERROR_MESSAGES = {
  network: "Network connection failed, please check network settings",
  unauthorized: "Login expired, please login again",
  forbidden: "No permission to perform this operation",
  notFound: "Requested resource does not exist",
  validation: "Input information is incorrect, please check and try again",
  server: "Server error, please try again later",
  unknown: "Unknown error, please try again later",

  // 业务相关错误
  aiParseFailed:
    "AI parsing failed, please enter transaction information manually",
  familySpaceNotFound: "Family space does not exist",
  invalidInviteCode: "Invalid or expired invite code",
  duplicateTransaction:
    "Transaction already exists, please do not add duplicate",
  budgetExceeded: "Budget exceeded",
  exportFailed: "Export failed, please try again later",
} as const;

// 成功消息键值
export const SUCCESS_MESSAGES = {
  transactionCreated: "Transaction added successfully",
  transactionUpdated: "Transaction updated successfully",
  transactionDeleted: "Transaction deleted successfully",
  familySpaceCreated: "Family space created successfully",
  familySpaceJoined: "Joined family space successfully",
  familySpaceLeft: "Left family space successfully",
  budgetCreated: "Budget set successfully",
  budgetUpdated: "Budget updated successfully",
  exportCompleted: "Export completed",
  dataSynced: "Data synced successfully",
} as const;
