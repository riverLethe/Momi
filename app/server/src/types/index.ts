// 通用类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 用户相关类型
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 家庭相关类型
export interface Family {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user?: User;
}

export interface FamilyJoinRequest {
  id: string;
  familyId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  user?: User;
  family?: Family;
}