// 应用常量定义

// API 相关常量
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
  },
  FAMILY: {
    CREATE: '/api/family/create',
    JOIN: '/api/family/join',
    LEAVE: '/api/family/leave',
    REQUEST_JOIN: '/api/family/request-join',
    JOIN_REQUESTS: '/api/family/join-requests',
    HANDLE_JOIN_REQUEST: '/api/family/handle-join-request',
  },
  CHAT: {
    MESSAGES: '/api/chat/messages',
    SEND: '/api/chat/send',
  },
  REPORTS: {
    GENERATE: '/api/reports/generate',
    LIST: '/api/reports/list',
  },
} as const;

// 状态常量
export const STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

// 用户角色常量
export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

// 错误消息常量
export const ERROR_MESSAGES = {
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '权限不足',
  NOT_FOUND: '资源不存在',
  VALIDATION_ERROR: '数据验证失败',
  INTERNAL_ERROR: '服务器内部错误',
  INVALID_TOKEN: '无效的令牌',
  EXPIRED_TOKEN: '令牌已过期',
  INVALID_CREDENTIALS: '用户名或密码错误',
  USER_NOT_FOUND: '用户不存在',
  EMAIL_ALREADY_EXISTS: '邮箱已存在',
  FAMILY_NOT_FOUND: '家庭不存在',
  ALREADY_MEMBER: '已经是家庭成员',
  PENDING_REQUEST_EXISTS: '已有待处理的加入请求',
} as const;

// 成功消息常量
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '退出成功',
  REGISTER_SUCCESS: '注册成功',
  FAMILY_CREATED: '家庭创建成功',
  FAMILY_JOINED: '加入家庭成功',
  REQUEST_SENT: '加入请求已发送',
  REQUEST_APPROVED: '请求已批准',
  REQUEST_REJECTED: '请求已拒绝',
} as const;

// 分页默认值
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// 时间相关常量
export const TIME = {
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;