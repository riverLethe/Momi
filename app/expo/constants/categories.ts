import { PizzaIcon, Train, ShoppingBag, Film, Zap, Home, Smartphone, Gift, BookOpen, Coffee, Utensils, DollarSign } from "lucide-react-native";
import { useTranslation } from 'react-i18next';

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  lightColor: string;
  icon: string;
}

export const EXPENSE_CATEGORIES = [
  {
    id: "food",
    name: "Food",
    color: "#10B981",
    lightColor: "#ECFDF5",
    icon: "Utensils"
  },
  {
    id: "transport",
    name: "Transport",
    color: "#3B82F6",
    lightColor: "#EFF6FF",
    icon: "Train"
  },
  {
    id: "shopping",
    name: "Shopping",
    color: "#EC4899",
    lightColor: "#FCE7F3",
    icon: "ShoppingBag"
  },
  {
    id: "entertainment",
    name: "Entertainment",
    color: "#F59E0B",
    lightColor: "#FEF3C7",
    icon: "Film"
  },
  {
    id: "utilities",
    name: "Utilities",
    color: "#8B5CF6",
    lightColor: "#F3E8FF",
    icon: "Zap"
  },
  {
    id: "housing",
    name: "Housing",
    color: "#06B6D4",
    lightColor: "#ECFEFF",
    icon: "Home"
  },
  {
    id: "communication",
    name: "Communication",
    color: "#6366F1",
    lightColor: "#EEF2FF",
    icon: "Smartphone"
  },
  {
    id: "gifts",
    name: "Gifts",
    color: "#F43F5E",
    lightColor: "#FEE2E2",
    icon: "Gift"
  },
  {
    id: "education",
    name: "Education",
    color: "#4F46E5",
    lightColor: "#E0E7FF",
    icon: "BookOpen"
  },
  {
    id: "cafe",
    name: "Coffee",
    color: "#D97706",
    lightColor: "#FEF3C7",
    icon: "Coffee"
  },
  {
    id: "other",
    name: "Other",
    color: "#6B7280",
    lightColor: "#F3F4F6",
    icon: "DollarSign"
  }
];

// Get category by ID
export const getCategoryById = (id: string): ExpenseCategory => {
  const category = EXPENSE_CATEGORIES.find(cat => cat.id === id);
  return category || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]; // Return "other" category as default
};

// Get translated category name
export const getTranslatedCategoryName = (categoryId: string) => {
  const { t } = useTranslation();
  const category = getCategoryById(categoryId);
  return t(category.name);
};

// Get category icon component
export const getCategoryIcon = (categoryId: string) => {
  const category = getCategoryById(categoryId);
  
  switch (category.icon) {
    case "Utensils":
    case "PizzaIcon":
      return PizzaIcon;
    case "Train":
      return Train;
    case "ShoppingBag":
      return ShoppingBag;
    case "Film":
      return Film;
    case "Zap":
      return Zap;
    case "Home":
      return Home;
    case "Smartphone":
      return Smartphone;
    case "Gift":
      return Gift;
    case "BookOpen":
      return BookOpen;
    case "Coffee":
      return Coffee;
    case "DollarSign":
    default:
      return DollarSign;
  }
};