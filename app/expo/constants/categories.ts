import {
  PizzaIcon,
  Train,
  ShoppingBag,
  Film,
  Zap,
  Home,
  Smartphone,
  Gift,
  BookOpen,
  Coffee,
  DollarSign,
  ShoppingCart,
  Shield,
  Plane,
  Scissors,
  Dog,
  HeartPulse,
  Heart,
  ReceiptText,
  CreditCard,
  AppleIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  lightColor: string;
  icon: string;
}

export const EXPENSE_CATEGORIES = [
  {
    id: "fruit",
    name: "Fruit",
    color: "#F43F5E",
    lightColor: "#FEE2E2",
    icon: "Apple",
  },
  {
    id: "food",
    name: "Food",
    color: "#10B981",
    lightColor: "#ECFDF5",
    icon: "Utensils",
  },
  {
    id: "transport",
    name: "Transport",
    color: "#3B82F6",
    lightColor: "#EFF6FF",
    icon: "Train",
  },
  {
    id: "shopping",
    name: "Shopping",
    color: "#EC4899",
    lightColor: "#FCE7F3",
    icon: "ShoppingBag",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    color: "#F59E0B",
    lightColor: "#FEF3C7",
    icon: "Film",
  },
  {
    id: "utilities",
    name: "Utilities",
    color: "#8B5CF6",
    lightColor: "#F3E8FF",
    icon: "Zap",
  },
  {
    id: "housing",
    name: "Housing",
    color: "#06B6D4",
    lightColor: "#ECFEFF",
    icon: "Home",
  },
  {
    id: "communication",
    name: "Communication",
    color: "#6366F1",
    lightColor: "#EEF2FF",
    icon: "Smartphone",
  },
  {
    id: "gifts",
    name: "Gifts",
    color: "#F43F5E",
    lightColor: "#FEE2E2",
    icon: "Gift",
  },
  {
    id: "education",
    name: "Education",
    color: "#4F46E5",
    lightColor: "#E0E7FF",
    icon: "BookOpen",
  },
  {
    id: "cafe",
    name: "Coffee",
    color: "#D97706",
    lightColor: "#FEF3C7",
    icon: "Coffee",
  },
  {
    id: "other",
    name: "Other",
    color: "#6B7280",
    lightColor: "#F3F4F6",
    icon: "DollarSign",
  },
  {
    id: "groceries",
    name: "Groceries",
    color: "#22C55E",
    lightColor: "#ECFDF5",
    icon: "ShoppingCart",
  },
  {
    id: "health",
    name: "Health",
    color: "#EF4444",
    lightColor: "#FEE2E2",
    icon: "HeartPulse",
  },
  {
    id: "insurance",
    name: "Insurance",
    color: "#0EA5E9",
    lightColor: "#E0F2FE",
    icon: "Shield",
  },
  {
    id: "travel",
    name: "Travel",
    color: "#F97316",
    lightColor: "#FFEDD5",
    icon: "Plane",
  },
  {
    id: "personal_care",
    name: "Personal Care",
    color: "#DB2777",
    lightColor: "#FCE7F3",
    icon: "Scissors",
  },
  {
    id: "pets",
    name: "Pets",
    color: "#F59E0B",
    lightColor: "#FEF3C7",
    icon: "Dog",
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    color: "#8B5CF6",
    lightColor: "#F3E8FF",
    icon: "CreditCard",
  },
  {
    id: "taxes",
    name: "Taxes",
    color: "#6B7280",
    lightColor: "#F3F4F6",
    icon: "ReceiptText",
  },
  {
    id: "charity",
    name: "Charity",
    color: "#E11D48",
    lightColor: "#FEE2E2",
    icon: "Heart",
  },
];

// Get category by ID
export const getCategoryById = (id: string): ExpenseCategory => {
  const category = EXPENSE_CATEGORIES.find((cat) => cat.id === id);
  return category || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]; // Return "other" category as default
};

// Get translated category name
export const useTranslatedCategoryName = (categoryId: string) => {
  const { t } = useTranslation();
  const category = getCategoryById(categoryId);
  return t(category.name);
};

// Get category icon component
export const getCategoryIcon = (categoryId: string) => {
  const category = getCategoryById(categoryId);

  switch (category.icon) {
    case "Apple":
      return AppleIcon;
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
    case "ShoppingCart":
      return ShoppingCart;
    case "Shield":
      return Shield;
    case "Plane":
      return Plane;
    case "Scissors":
      return Scissors;
    case "Dog":
      return Dog;
    case "HeartPulse":
      return HeartPulse;
    case "ReceiptText":
      return ReceiptText;
    case "CreditCard":
      return CreditCard;
    case "Heart":
      return Heart;
    case "DollarSign":
    default:
      return DollarSign;
  }
};
