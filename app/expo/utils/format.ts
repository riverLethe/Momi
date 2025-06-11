// Currency formatting function
export const formatCurrency = (
  amount: number,
  locale = "zh-CN",
  currency = "CNY"
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Date formatting function
export const formatDate = (date: string | Date, format = "full"): string => {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "full") {
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (format === "short") {
    return d.toLocaleDateString("zh-CN", {
      month: "numeric",
      day: "numeric",
    });
  }

  if (format === "year-month") {
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
    });
  }

  return d.toLocaleDateString();
};

// Time formatting function
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
