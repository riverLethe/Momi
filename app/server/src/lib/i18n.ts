import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      // Navigation
      Features: "Features",
      About: "About",

      // Hero Section
      "Smart Expense Tracking": "Smart Expense Tracking",
      "Made Simple": "Made Simple",
      "AI-powered expense tracking app with natural language input, automatic categorization, and intelligent insights. Take control of your personal finances effortlessly.":
        "AI-powered expense tracking app with natural language input, automatic categorization, and intelligent insights. Take control of your personal finances effortlessly.",
      "Download for iOS": "Download for iOS",
      "Explore Features": "Explore Features",
      "Supports iOS 14+": "Supports iOS 14+",
      "Privacy First": "Privacy First",
      "Made by an indie developer": "Made by an indie developer",

      // Features
      "AI-Powered Input": "AI-Powered Input",
      "Simply tell Momi what you spent. Our AI understands natural language and automatically categorizes your expenses with 90% accuracy.":
        "Simply tell Momi what you spent. Our AI understands natural language and automatically categorizes your expenses with 90% accuracy.",
      "Smart Analytics": "Smart Analytics",
      "Get personalized insights into your spending patterns with beautiful charts and actionable recommendations.":
        "Get personalized insights into your spending patterns with beautiful charts and actionable recommendations.",
      "Your financial data stays on your device. Bank-grade encryption ensures your information is always secure.":
        "Your financial data stays on your device. Bank-grade encryption ensures your information is always secure.",
      "Lightning Fast": "Lightning Fast",
      "Complete expense tracking in 3 seconds with voice, photo, and manual input options":
        "Complete expense tracking in 3 seconds with voice, photo, and manual input options",
      "Budget Management": "Budget Management",
      "Smart budget reminders help you control spending and achieve financial goals":
        "Smart budget reminders help you control spending and achieve financial goals",
      "Data Export": "Data Export",
      "Export data in CSV and PDF formats for tax filing and financial analysis":
        "Export data in CSV and PDF formats for tax filing and financial analysis",
      "Data Security": "Data Security",
      "Bank-grade encryption technology ensures your financial data is secure and reliable":
        "Bank-grade encryption technology ensures your financial data is secure and reliable",

      // CTA
      "Ready to Start?": "Ready to Start?",
      "Ready to take control?": "Ready to take control?",
      "Join thousands of users who have simplified their expense tracking":
        "Join thousands of users who have simplified their expense tracking",
      "Get Started Free": "Get Started Free",
      "Learn More": "Learn More",
      "Free to Use": "Free to Use",
      "No hidden costs": "No hidden costs",
      "Secure & Private": "Secure & Private",
      "Your data stays safe": "Your data stays safe",
      "3-second expense tracking": "3-second expense tracking",

      // Footer
      Product: "Product",
      Download: "Download",
      Tutorials: "Tutorials",
      FAQ: "FAQ",
      Legal: "Legal",
      "Privacy Policy": "Privacy Policy",
      "Terms of Service": "Terms of Service",
      Contact: "Contact",
      "© 2024 Momi. All rights reserved.":
        "© 2024 Momi. All rights reserved.",
      "Core Features": "Core Features",
      "Everything you need for smart financial management":
        "Everything you need for smart financial management",
      "AI Chat Input": "AI Chat Input",
      "Natural language": "Natural language",
      "Spending insights": "Spending insights",
    },
  },
  zh: {
    translation: {
      // Navigation
      Features: "功能特色",
      About: "关于我们",

      // Hero Section
      "Smart Expense Tracking": "智能记账助手",
      "Made Simple": "让记账变简单",
      "AI-powered expense tracking app with natural language input, automatic categorization, and intelligent insights. Take control of your personal finances effortlessly.":
        "AI驱动的记账应用，支持自然语言输入、自动分类和智能洞察。轻松掌控您的个人财务。",
      "Download for iOS": "下载iOS版",
      "Explore Features": "探索功能",
      "Supports iOS 14+": "支持 iOS 14+",
      "Privacy First": "隐私优先",
      "Made by an indie developer": "独立开发者作品",

      // Features
      "AI-Powered Input": "AI 对话输入",
      "Simply tell Momi what you spent. Our AI understands natural language and automatically categorizes your expenses with 90% accuracy.":
        "只需告诉Momi您的消费，AI理解自然语言并自动分类，准确率达90%。",
      "Smart Analytics": "智能分析",
      "Get personalized insights into your spending patterns with beautiful charts and actionable recommendations.":
        "通过精美图表和可操作建议，获得个性化的消费模式洞察。",
      "Your financial data stays on your device. Bank-grade encryption ensures your information is always secure.":
        "您的财务数据保存在设备上。银行级加密确保信息始终安全。",
      "Lightning Fast": "闪电般快速",
      "Complete expense tracking in 3 seconds with voice, photo, and manual input options":
        "3秒完成记账，支持语音、拍照、手动等多种录入方式",
      "Budget Management": "预算管理",
      "Smart budget reminders help you control spending and achieve financial goals":
        "智能预算提醒，帮助您控制支出，实现财务目标",
      "Data Export": "数据导出",
      "Export data in CSV and PDF formats for tax filing and financial analysis":
        "支持CSV、PDF格式导出，方便报税和财务分析",
      "Data Security": "数据安全保护",
      "Bank-grade encryption technology ensures your financial data is secure and reliable":
        "采用银行级加密技术，确保您的财务数据安全可靠",

      // CTA
      "Ready to Start?": "准备开始了吗？",
      "Ready to take control?": "准备掌控财务？",
      "Join thousands of users who have simplified their expense tracking":
        "加入数千名用户，简化您的记账体验",
      "Get Started Free": "免费开始",
      "Learn More": "了解更多",
      "Free to Use": "免费使用",
      "No hidden costs": "无隐藏费用",
      "Secure & Private": "安全私密",
      "Your data stays safe": "数据安全保障",
      "3-second expense tracking": "3秒记账体验",

      // Footer
      Product: "产品",
      Download: "下载应用",
      Tutorials: "使用教程",
      FAQ: "常见问题",
      Legal: "法律信息",
      "Privacy Policy": "隐私政策",
      "Terms of Service": "服务条款",
      Contact: "联系我们",
      "© 2024 Momi. All rights reserved.": "© 2024 Momi. 保留所有权利。",
      "Core Features": "核心功能",
      "Everything you need for smart financial management":
        "您需要的智能财务管理工具",
      "AI Chat Input": "AI 对话输入",
      "Natural language": "自然语言",
      "Spending insights": "消费洞察",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    lng: "en", // default language
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

export default i18n;
