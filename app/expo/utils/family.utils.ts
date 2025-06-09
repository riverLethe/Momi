import { storage, STORAGE_KEYS } from './storage.utils';
import { FamilySpace, FamilyMember } from '@/types/family.types';
import { User } from '@/types/user.types';

/**
 * 生成唯一ID
 */
const generateId = (): string => {
  return 'family_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         '_' + Date.now().toString();
};

/**
 * 生成邀请码
 */
const generateInviteCode = (): string => {
  return 'FAM' + Math.floor(1000 + Math.random() * 9000);
};

/**
 * 获取所有家庭空间
 */
export const getFamilySpaces = async (): Promise<FamilySpace[]> => {
  try {
    const spaces = await storage.getItem<FamilySpace[]>(STORAGE_KEYS.FAMILY_SPACES);
    return spaces || [];
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
    const spaces = await getFamilySpaces();
    
    const newMember: FamilyMember = {
      id: user.id,
      username: user.name,
      isCreator: true,
      joinedAt: new Date()
    };
    
    const newSpace: FamilySpace = {
      id: generateId(),
      name,
      createdBy: user.id,
      creatorName: user.name,
      members: [newMember],
      inviteCode: generateInviteCode(),
      createdAt: new Date()
    };
    
    await storage.setItem(STORAGE_KEYS.FAMILY_SPACES, [...spaces, newSpace]);
    return newSpace;
  } catch (error) {
    console.error('Failed to create family space:', error);
    throw error;
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
    const spaces = await getFamilySpaces();
    const spaceIndex = spaces.findIndex(space => space.inviteCode === inviteCode);
    
    if (spaceIndex === -1) {
      return null; // 没有找到匹配的邀请码
    }
    
    // 检查用户是否已经是成员
    if (spaces[spaceIndex].members.some(member => member.id === user.id)) {
      return spaces[spaceIndex]; // 用户已经是成员
    }
    
    const newMember: FamilyMember = {
      id: user.id,
      username: user.name,
      isCreator: false,
      joinedAt: new Date()
    };
    
    spaces[spaceIndex].members.push(newMember);
    await storage.setItem(STORAGE_KEYS.FAMILY_SPACES, spaces);
    
    return spaces[spaceIndex];
  } catch (error) {
    console.error('Failed to join family space:', error);
    throw error;
  }
};

/**
 * 删除家庭空间
 */
export const deleteFamilySpace = async (id: string): Promise<boolean> => {
  try {
    const spaces = await getFamilySpaces();
    const filteredSpaces = spaces.filter(space => space.id !== id);
    
    if (spaces.length === filteredSpaces.length) {
      return false; // 没有找到对应的家庭空间
    }
    
    await storage.setItem(STORAGE_KEYS.FAMILY_SPACES, filteredSpaces);
    return true;
  } catch (error) {
    console.error('Failed to delete family space:', error);
    throw error;
  }
};

/**
 * 根据用户ID获取其加入的家庭空间
 */
export const getUserFamilySpaces = async (userId: string): Promise<FamilySpace[]> => {
  try {
    const spaces = await getFamilySpaces();
    return spaces.filter(space => 
      space.members.some(member => member.id === userId)
    );
  } catch (error) {
    console.error('Failed to get user family spaces:', error);
    return [];
  }
}; 