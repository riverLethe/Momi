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
  username: string;
  isCreator: boolean;
  joinedAt: Date;
}
