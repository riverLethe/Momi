import { Transaction, User, FamilySpace, PaymentAccount } from "@/types";
import { generateId } from "./index";

// 模拟用户数据
export const mockUser: User = {
  id: "current-user-id",
  username: "demo_user",
  nickname: "演示用户",
  avatar: "",
  email: "demo@example.com",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date(),
};

// 模拟家庭空间
export const mockFamilySpace: FamilySpace = {
  id: "family-space-1",
  name: "我的小家",
  creatorId: "current-user-id",
  inviteCode: "ABC123",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date(),
};

// 模拟支付账户
export const mockPaymentAccounts: PaymentAccount[] = [
  {
    id: "account-1",
    name: "现金",
    type: "cash",
    userId: "current-user-id",
    isDefault: true,
  },
  {
    id: "account-2",
    name: "招商银行储蓄卡",
    type: "bank_card",
    userId: "current-user-id",
    isDefault: false,
  },
  {
    id: "account-3",
    name: "支付宝",
    type: "alipay",
    userId: "current-user-id",
    isDefault: false,
  },
  {
    id: "account-4",
    name: "微信支付",
    type: "wechat",
    userId: "current-user-id",
    isDefault: false,
  },
];

// 模拟交易数据
export const mockTransactions: Transaction[] = [
  {
    id: generateId(),
    amount: -58.5,
    description: "超市买菜",
    category: "餐饮",
    merchant: "永辉超市",
    paymentAccount: "支付宝",
    date: new Date(),
    time: "18:30",
    notes: "买了蔬菜和肉类",
    creatorId: "current-user-id",
    familySpaceId: "family-space-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: mockUser,
  },
  {
    id: generateId(),
    amount: -25.0,
    description: "地铁出行",
    category: "交通",
    merchant: "深圳地铁",
    paymentAccount: "微信支付",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天
    time: "08:15",
    notes: "",
    creatorId: "current-user-id",
    familySpaceId: undefined, // 个人账单
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    creator: mockUser,
  },
  {
    id: generateId(),
    amount: -120.0,
    description: "午餐聚会",
    category: "餐饮",
    merchant: "海底捞",
    paymentAccount: "招商银行储蓄卡",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 前天
    time: "12:30",
    notes: "和朋友聚餐",
    creatorId: "current-user-id",
    familySpaceId: undefined,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    creator: mockUser,
  },
  {
    id: generateId(),
    amount: 5000.0,
    description: "工资收入",
    category: "工资",
    merchant: "公司财务",
    paymentAccount: "招商银行储蓄卡",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    time: "10:00",
    notes: "月度工资",
    creatorId: "current-user-id",
    familySpaceId: undefined,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    creator: mockUser,
  },
  {
    id: generateId(),
    amount: -89.9,
    description: "网购衣服",
    category: "购物",
    merchant: "淘宝",
    paymentAccount: "支付宝",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    time: "20:15",
    notes: "买了一件T恤",
    creatorId: "current-user-id",
    familySpaceId: "family-space-1",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    creator: mockUser,
  },
];

// 初始化模拟数据的函数
export const initializeMockData = () => {
  return {
    user: mockUser,
    familySpace: mockFamilySpace,
    transactions: mockTransactions,
    paymentAccounts: mockPaymentAccounts,
  };
};
