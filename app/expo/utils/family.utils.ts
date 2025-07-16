import { FamilySpace, FamilyMember } from '@/types/family.types';
import { User } from '@/types/user.types';
import { apiClient } from './api';
import { getAuthToken } from './userPreferences.utils';

// 这些函数已经移到服务端实现

/**
 * 获取所有家庭空间
 */
export const getFamilySpaces = async (): Promise<FamilySpace[]> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('未登录');
    
    const response = await apiClient.family.getFamilySpaces(token);
    return response.data || [];
  } catch (error) {
    console.error('Failed to get family spaces:', error);
    return [];
  }
};

/**
 * 创建新的家庭空间
 */
export const createFamilySpace = async (
  name: string,
  user: User
): Promise<FamilySpace> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('未登录');
    
    const response = await apiClient.family.createFamilySpace(token, { name });
    return response.data;
  } catch (error) {
    console.error('Failed to create family space:', error);
    throw error;
  }
};

/**
 * 根据邀请码获取家庭信息（不加入）
 */
export const getFamilyByInviteCode = async (
  inviteCode: string
): Promise<FamilySpace | null> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('未登录');
    
    const response = await apiClient.family.getFamilyByInviteCode(token, inviteCode);
    return response.data;
  } catch (error) {
    console.error('Failed to get family by invite code:', error);
    return null;
  }
};

/**
 * 加入家庭空间
 */
export const joinFamilySpace = async (
  inviteCode: string,
  user: User
): Promise<FamilySpace | null> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('未登录');
    
    const response = await apiClient.family.joinFamilySpace(token, inviteCode);
    return response.data;
  } catch (error) {
    console.error('Failed to join family space:', error);
    return null;
  }
};

/**
 * 删除家庭空间
 */
export const deleteFamilySpace = async (id: string): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('未登录');
    
    const response = await apiClient.family.deleteFamilySpace(token, id);
    return response.success;
  } catch (error) {
    console.error('Failed to delete family space:', error);
    return false;
  }
};

/**
 * 通过邮箱添加成员
 */
export const addMemberByEmail = async (familyId: string, email: string): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('未登录');
    
    const response = await apiClient.family.addMember(token, familyId, email);
    return response.success;
  } catch (error) {
    console.error('Failed to add member by email:', error);
    return false;
  }
};

/**
 * 通过用户ID添加成员
 */
export const addMemberById = async (familyId: string, userId: string): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('未登录');
    
    const response = await apiClient.family.addMember(token, familyId, undefined, userId);
    return response.success;
  } catch (error) {
    console.error('Failed to add member by ID:', error);
    return false;
  }
};

/**
 * 退出家庭空间
 */
export const leaveFamilySpace = async (familyId: string, userId: string): Promise<boolean> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('未登录');
    
    const response = await apiClient.family.leaveFamilySpace(token, familyId);
    return response.success;
  } catch (error) {
    console.error('Failed to leave family space:', error);
    return false;
  }
};

/**
 * 根据用户ID获取其加入的家庭空间
 */
export const getUserFamilySpaces = async (userId: string): Promise<FamilySpace[]> => {
  try {
    // 直接调用获取所有家庭空间的方法，服务端已经过滤了当前用户的家庭空间
    return await getFamilySpaces();
  } catch (error) {
    console.error('Failed to get user family spaces:', error);
    return [];
  }
};

/**
 * 更新用户最后记账时间
 * 注意：此功能现在由服务端自动处理，当用户创建或更新账单时会自动更新
 */
export const updateLastTransactionTime = async (userId: string): Promise<void> => {
  // 此功能现在由服务端自动处理
  console.log('Last transaction time is now updated automatically by the server');
};

/**
 * 获取家庭空间详情
 */
export const getFamilySpaceDetails = async (familyId: string): Promise<FamilySpace | null> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('未登录');
    
    const response = await apiClient.family.getFamilySpaceDetails(token, familyId);
    return response.data;
  } catch (error) {
    console.error('Failed to get family space details:', error);
    return null;
  }
};