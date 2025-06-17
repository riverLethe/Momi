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

  budgetAmount?: number;
  budgetPeriod?: "weekly" | "monthly" | "yearly";

  /**
   * New per-period category filter definition.
   * Each period can independently specify include/exclude mode and categories.
   * This supersedes the global budgetIncludedCategories/budgetExcludedCategories fields.
   */
  budgetFilters?: {
    weekly?: {
      mode: "all" | "include" | "exclude";
      categories: string[];
    };
    monthly?: {
      mode: "all" | "include" | "exclude";
      categories: string[];
    };
    yearly?: {
      mode: "all" | "include" | "exclude";
      categories: string[];
    };
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}
