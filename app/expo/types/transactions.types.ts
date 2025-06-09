export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  date: Date;
  merchant?: string;
  notes?: string;
  isFamilyTransaction: boolean;
  familyId?: string;
  familyName?: string;
  createdBy: string;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: string[]; // URLs to attachment images
}

export interface TransactionInput {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  date: Date;
  merchant?: string;
  notes?: string;
  isFamilyTransaction: boolean;
  familyId?: string;
  attachments?: string[];
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
}

export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  type?: 'income' | 'expense' | 'all';
  categories?: string[];
  accounts?: string[];
  search?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
} 