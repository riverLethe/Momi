/**
 * MomiQ API配置文件
 * 此文件统一管理所有的API接口入口，便于后期替换为真实接口
 */

// API基础地址
export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.momiq.app/v1"
    : "https://dev-api.momiq.app/v1";

// 账单相关接口
export const BILL_API = {
  // 获取账单列表
  getBills: `${BASE_URL}/bills`,

  // 获取账单详情
  getBillById: (id: string) => `${BASE_URL}/bills/${id}`,

  // 创建账单
  createBill: `${BASE_URL}/bills`,

  // 更新账单
  updateBill: (id: string) => `${BASE_URL}/bills/${id}`,

  // 删除账单
  deleteBill: (id: string) => `${BASE_URL}/bills/${id}`,

  // 获取账单统计数据
  getBillStats: `${BASE_URL}/bills/stats`,

  // 按月份获取账单
  getBillsByMonth: `${BASE_URL}/bills/monthly`,

  // 获取即将到期的账单
  getUpcomingBills: `${BASE_URL}/bills/upcoming`,
};

// 交易相关接口
export const TRANSACTION_API = {
  // 获取交易列表
  getTransactions: `${BASE_URL}/transactions`,

  // 获取交易详情
  getTransactionById: (id: string) => `${BASE_URL}/transactions/${id}`,

  // 创建交易
  createTransaction: `${BASE_URL}/transactions`,

  // 更新交易
  updateTransaction: (id: string) => `${BASE_URL}/transactions/${id}`,

  // 删除交易
  deleteTransaction: (id: string) => `${BASE_URL}/transactions/${id}`,

  // 获取最近交易
  getRecentTransactions: `${BASE_URL}/transactions/recent`,
};

// 报表相关接口
export const REPORT_API = {
  // 获取报表数据
  getReportData: `${BASE_URL}/reports`,

  // 获取支出趋势
  getExpenseTrend: `${BASE_URL}/reports/trend`,

  // 获取类别分析
  getCategoryAnalysis: `${BASE_URL}/reports/categories`,

  // 获取财务洞察
  getFinancialInsights: `${BASE_URL}/reports/insights`,

  // 获取财务健康评分
  getFinancialHealthScore: `${BASE_URL}/reports/health-score`,
};

// 用户相关接口
export const USER_API = {
  // 用户登录
  login: `${BASE_URL}/auth/login`,

  // 用户注册
  register: `${BASE_URL}/auth/register`,

  // 刷新令牌
  refreshToken: `${BASE_URL}/auth/refresh-token`,

  // 获取用户信息
  getUserProfile: `${BASE_URL}/users/profile`,

  // 更新用户信息
  updateUserProfile: `${BASE_URL}/users/profile`,

  // 修改密码
  changePassword: `${BASE_URL}/users/change-password`,

  // 找回密码
  resetPassword: `${BASE_URL}/auth/reset-password`,
};

// 家庭空间相关接口
export const FAMILY_API = {
  // 获取家庭空间列表
  getFamilySpaces: `${BASE_URL}/family-spaces`,

  // 获取家庭空间详情
  getFamilySpaceById: (id: string) => `${BASE_URL}/family-spaces/${id}`,

  // 创建家庭空间
  createFamilySpace: `${BASE_URL}/family-spaces`,

  // 加入家庭空间
  joinFamilySpace: `${BASE_URL}/family-spaces/join`,

  // 离开家庭空间
  leaveFamilySpace: (id: string) => `${BASE_URL}/family-spaces/${id}/leave`,

  // 删除家庭空间
  deleteFamilySpace: (id: string) => `${BASE_URL}/family-spaces/${id}`,

  // 获取家庭成员
  getFamilyMembers: (id: string) => `${BASE_URL}/family-spaces/${id}/members`,

  // 邀请成员
  inviteMember: (id: string) => `${BASE_URL}/family-spaces/${id}/invite`,

  // 移除成员
  removeMember: (spaceId: string, memberId: string) =>
    `${BASE_URL}/family-spaces/${spaceId}/members/${memberId}`,
};

// 聊天相关接口
export const CHAT_API = {
  // 获取聊天记录
  getMessages: `${BASE_URL}/chat/messages`,

  // 发送消息
  sendMessage: `${BASE_URL}/chat/messages`,

  // 账单分析
  analyzeBill: `${BASE_URL}/chat/analyze-bill`,
};

// 同步相关接口
export const SYNC_API = {
  // 同步账单数据
  syncBills: `${BASE_URL}/sync/bills`,

  // 同步交易数据
  syncTransactions: `${BASE_URL}/sync/transactions`,

  // 同步报表数据
  syncReports: `${BASE_URL}/sync/reports`,
};
