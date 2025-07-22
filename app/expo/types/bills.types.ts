export interface Bill {
  id: string;
  amount: number;
  category: string;
  account?: string;
  date: Date;
  merchant?: string;
  notes?: string;
  createdBy: string;
  creatorName: string;
  isFamilyBill: boolean;
  familyId?: string;
  familyName?: string;
  isReadOnly?: boolean; // 标识账单是否只读（家庭账单中非本人创建的账单）
  createdAt: Date;
  updatedAt: Date;
}

export interface BillInput {
  amount: number;
  category: string;
  account?: string;
  date: Date;
  merchant?: string;
  notes?: string;
  isFamilyBill: boolean;
  familyId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Account {
  id: string;
  name: string;
  icon: string;
}

export interface BillStats {
  totalAmount: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}
