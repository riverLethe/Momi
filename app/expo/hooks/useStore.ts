import { create } from 'zustand';
import { 
  User, 
  FamilySpace, 
  Transaction, 
  Category, 
  PaymentAccount, 
  Budget,
  ViewType,
  FamilyMember 
} from '@/types';
import { DEFAULT_CATEGORIES } from '@/constants';

// 应用主状态
interface AppState {
  // 用户相关
  user: User | null;
  isAuthenticated: boolean;
  
  // 视图相关
  currentView: ViewType;
  currentFamilySpace: FamilySpace | null;
  
  // 加载状态
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setCurrentView: (view: ViewType) => void;
  setCurrentFamilySpace: (space: FamilySpace | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  currentView: 'personal',
  currentFamilySpace: null,
  isLoading: false,
  error: null,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentFamilySpace: (space) => set({ currentFamilySpace: space }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    currentView: 'personal',
    currentFamilySpace: null 
  }),
}));

// 账单相关状态
interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
  paymentAccounts: PaymentAccount[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setCategories: (categories: Category[]) => void;
  setPaymentAccounts: (accounts: PaymentAccount[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeDefaultCategories: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  categories: [],
  paymentAccounts: [],
  isLoading: false,
  error: null,
  
  setTransactions: (transactions) => set({ transactions }),
  
  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions]
  })),
  
  updateTransaction: (id, updates) => set((state) => ({
    transactions: state.transactions.map(t => 
      t.id === id ? { ...t, ...updates } : t
    )
  })),
  
  deleteTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter(t => t.id !== id)
  })),
  
  setCategories: (categories) => set({ categories }),
  setPaymentAccounts: (accounts) => set({ paymentAccounts: accounts }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  initializeDefaultCategories: () => {
    const categories = DEFAULT_CATEGORIES.map((cat, index) => ({
      id: `default-${index}`,
      ...cat
    }));
    set({ categories });
  },
}));

// 家庭空间相关状态
interface FamilyState {
  familySpaces: FamilySpace[];
  currentMembers: FamilyMember[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setFamilySpaces: (spaces: FamilySpace[]) => void;
  addFamilySpace: (space: FamilySpace) => void;
  updateFamilySpace: (id: string, updates: Partial<FamilySpace>) => void;
  deleteFamilySpace: (id: string) => void;
  setCurrentMembers: (members: FamilyMember[]) => void;
  addMember: (member: FamilyMember) => void;
  removeMember: (userId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  familySpaces: [],
  currentMembers: [],
  isLoading: false,
  error: null,
  
  setFamilySpaces: (spaces) => set({ familySpaces: spaces }),
  
  addFamilySpace: (space) => set((state) => ({
    familySpaces: [...state.familySpaces, space]
  })),
  
  updateFamilySpace: (id, updates) => set((state) => ({
    familySpaces: state.familySpaces.map(s => 
      s.id === id ? { ...s, ...updates } : s
    )
  })),
  
  deleteFamilySpace: (id) => set((state) => ({
    familySpaces: state.familySpaces.filter(s => s.id !== id)
  })),
  
  setCurrentMembers: (members) => set({ currentMembers: members }),
  
  addMember: (member) => set((state) => ({
    currentMembers: [...state.currentMembers, member]
  })),
  
  removeMember: (userId) => set((state) => ({
    currentMembers: state.currentMembers.filter(m => m.userId !== userId)
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

// 预算相关状态
interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  isLoading: false,
  error: null,
  
  setBudgets: (budgets) => set({ budgets }),
  
  addBudget: (budget) => set((state) => ({
    budgets: [...state.budgets, budget]
  })),
  
  updateBudget: (id, updates) => set((state) => ({
    budgets: state.budgets.map(b => 
      b.id === id ? { ...b, ...updates } : b
    )
  })),
  
  deleteBudget: (id) => set((state) => ({
    budgets: state.budgets.filter(b => b.id !== id)
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
})); 