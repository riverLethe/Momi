export interface FamilySpace {
  id: string;
  name: string;
  createdBy: string;
  creatorName: string;
  members: FamilyMember[];
  inviteCode: string;
  createdAt: Date;
}

export interface FamilyMember {
  id: string;
  name: string;
  isCreator: boolean;
  joinedAt: Date;
  lastTransactionTime?: Date; // 最后记账时间
}
