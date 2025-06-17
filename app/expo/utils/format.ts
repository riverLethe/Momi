import i18n from "../i18n";

// Mapping between supported languages and their default locale-currency pair
const LANGUAGE_LOCALE_CURRENCY: Record<
  string,
  { locale: string; currency: string }
> = {
  en: { locale: "en-US", currency: "USD" },
  zh: { locale: "zh-CN", currency: "CNY" },
  es: { locale: "es-ES", currency: "EUR" },
};

/**
 * Get locale and currency based on current app language.
 */
const getLocaleCurrency = () => {
  const lang = i18n.language?.split("-")[0] || "en";
  return LANGUAGE_LOCALE_CURRENCY[lang] ?? LANGUAGE_LOCALE_CURRENCY.en;
};

// Currency formatting function
export const formatCurrency = (amount: number): string => {
  const { locale, currency } = getLocaleCurrency();
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Date formatting function
export const formatDate = (
  date: string | Date,
  format: "full" | "short" | "year-month" = "full"
): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const { locale } = getLocaleCurrency();

  if (format === "full") {
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (format === "short") {
    return d.toLocaleDateString(locale, {
      month: "numeric",
      day: "numeric",
    });
  }

  if (format === "year-month") {
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
    });
  }

  return d.toLocaleDateString(locale);
};

// Time formatting function
export const formatTime = (date: Date): string => {
  const { locale } = getLocaleCurrency();
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Calculate time difference with friendly description
export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  return formatDate(date, "short");
};
