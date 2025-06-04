// 用户相关类型
export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 家庭空间相关类型
export interface FamilySpace {
  id: string;
  name: string;
  creatorId: string;
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  userId: string;
  familySpaceId: string;
  role: 'creator' | 'member';
  joinedAt: Date;
  user: User;
}

// 账单相关类型
export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  merchant?: string;
  paymentAccount: string;
  date: Date;
  time: string;
  notes?: string;
  creatorId: string;
  familySpaceId?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
  creator?: User;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isDefault: boolean;
}

export interface PaymentAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank_card' | 'alipay' | 'wechat' | 'credit_card' | 'other';
  userId: string;
  isDefault: boolean;
}

// 预算相关类型
export interface Budget {
  id: string;
  name: string;
  amount: number;
  period: 'monthly' | 'yearly';
  categoryId?: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  spent: number;
  createdAt: Date;
  updatedAt: Date;
}

// 视图类型
export type ViewType = 'personal' | 'family';

// 聊天相关类型
export interface ChatMessage {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  image?: string;
  system?: boolean;
}

export interface ParsedBillData {
  amount?: number;
  description?: string;
  category?: string;
  merchant?: string;
  date?: Date;
  confidence: number;
}

// 统计分析相关类型
export interface ExpenseAnalysis {
  totalExpense: number;
  totalIncome: number;
  balance: number;
  categoryBreakdown: CategoryExpense[];
  monthlyTrend: MonthlyData[];
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyData {
  month: string;
  expense: number;
  income: number;
}

// 筛选相关类型
export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
  merchant?: string;
  creatorId?: string; // 仅在家庭视图下使用
}

// 导出相关类型
export interface ExportOptions {
  format: 'csv' | 'pdf';
  viewType: ViewType;
  familySpaceId?: string;
  startDate: Date;
  endDate: Date;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 状态管理相关类型
export interface AppState {
  user: User | null;
  currentFamilySpace: FamilySpace | null;
  currentView: ViewType;
  isLoading: boolean;
  error: string | null;
}

export interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
  paymentAccounts: PaymentAccount[];
  isLoading: boolean;
  error: string | null;
}

export interface FamilyState {
  familySpaces: FamilySpace[];
  currentMembers: FamilyMember[];
  isLoading: boolean;
  error: string | null;
} 