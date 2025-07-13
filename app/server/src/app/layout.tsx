import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Momi - 智能记账，让家庭财务管理更简单',
    template: '%s | Momi'
  },
  description: 'Momi是一款基于AI技术的智能记账应用，支持自然语言记账、家庭账单共享、消费分析等功能。让个人和家庭财务管理变得简单高效。',
  keywords: ['记账app', '智能记账', '家庭记账', 'AI记账', '财务管理', '消费分析', '账单管理'],
  authors: [{ name: 'Momi Team' }],
  creator: 'Momi Technology Co., Ltd.',
  publisher: 'Momi Technology Co., Ltd.',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://momi.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://momi.app',
    title: 'Momi - 智能记账，让家庭财务管理更简单',
    description: 'AI驱动的智能记账应用，支持自然语言记账和家庭账单共享',
    siteName: 'Momi',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Momi - 智能记账，让家庭财务管理更简单',
    description: 'AI驱动的智能记账应用，支持自然语言记账和家庭账单共享',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
