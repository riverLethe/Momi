/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        secondary: "#10B981",
        error: "#EF4444",
        warning: "#F59E0B",
        success: "#22C55E",
        background: "#F9FAFB",
        card: "#FFFFFF",
        text: "#1F2937",
        border: "#E5E7EB",
      },
    },
  },
  plugins: [],
};
