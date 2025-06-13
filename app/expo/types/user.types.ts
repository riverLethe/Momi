export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  currency: string;
  language: string;
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  defaultAccount: string;
  budgetAmount?: number;
  budgetPeriod?: "weekly" | "monthly" | "yearly";
  /**
   * Categories that should be INCLUDED when calculating budget statistics.
   * If this array is non-empty it takes precedence over excluded categories.
   */
  budgetIncludedCategories?: string[];

  /**
   * Categories that should be EXCLUDED when calculating budget statistics.
   * Only consulted when `budgetIncludedCategories` is empty.
   */
  budgetExcludedCategories?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}
