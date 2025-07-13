'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button, Card, CardBody, Navbar, NavbarBrand, NavbarContent, NavbarItem, Chip } from '@nextui-org/react';
import { useState, useEffect } from 'react';

export default function Home() {
  const [language, setLanguage] = useState('en');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const content = {
    en: {
      nav: {
        features: 'Features',
        download: 'Download',
        about: 'About',
        contact: 'Contact'
      },
      hero: {
        title: 'Smart Expense Tracking',
        subtitle: 'Made Simple',
        description: 'AI-powered expense tracking app with natural language input, automatic categorization, and intelligent insights. Take control of your personal finances effortlessly.',
        downloadIOS: 'Download for iOS',
        compatibility: 'Supports iOS 14+'
      },
      features: {
        title: 'Core Features',
        subtitle: 'Everything you need for smart financial management',
        aiChat: {
          title: 'AI-Powered Input',
          description: 'Simply tell Momi what you spent. Our AI understands natural language and automatically categorizes your expenses with 90% accuracy.'
        },
        smartAnalysis: {
          title: 'Smart Analytics',
          description: 'Get personalized insights into your spending patterns with beautiful charts and actionable recommendations.'
        },
        privacy: {
          title: 'Privacy First',
          description: 'Your financial data stays on your device. Bank-grade encryption ensures your information is always secure.'
        }
      },
      cta: {
        title: 'Ready to take control?',
        subtitle: 'Join thousands of users who have simplified their expense tracking',
        button: 'Get Started Free'
      },
      footer: {
        madeBy: 'Made with ❤️ by an indie developer',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service'
      }
    },
    zh: {
      nav: {
        features: '功能特色',
        download: '下载应用',
        about: '关于',
        contact: '联系'
      },
      hero: {
        title: '智能记账',
        subtitle: '让财务管理更简单',
        description: '基于AI技术的智能记账应用，支持自然语言记账、自动分类和智能分析。轻松掌控个人财务。',
        downloadIOS: '下载 iOS 版',
        compatibility: '支持 iOS 14+'
      },
      features: {
        title: '核心功能',
        subtitle: '智能财务管理所需的一切',
        aiChat: {
          title: 'AI智能输入',
          description: '只需告诉Momi你的消费，AI理解自然语言并自动分类，准确率高达90%。'
        },
        smartAnalysis: {
          title: '智能分析',
          description: '通过精美图表和可操作建议，获得个性化的消费模式洞察。'
        },
        privacy: {
          title: '隐私优先',
          description: '财务数据保存在您的设备上，银行级加密确保信息安全。'
        }
      },
      cta: {
        title: '准备好掌控财务了吗？',
        subtitle: '加入数千名用户，简化您的记账体验',
        button: '免费开始'
      },
      footer: {
        madeBy: '由独立开发者用 ❤️ 制作',
        privacy: '隐私政策',
        terms: '服务条款'
      }
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <Navbar
        className={`transition-all duration-300 h-20 ${isScrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg'
          : 'bg-transparent backdrop-blur-sm'
          }`}
        isBlurred
        maxWidth="xl"
        position="sticky"
      >
        <NavbarBrand>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-white">
                <Image
                  src="/icon.png"
                  alt="Momi Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Momi
            </span>
          </div>
        </NavbarBrand>
        <NavbarContent className="hidden md:flex gap-8" justify="center">
          <NavbarItem>
            <Link
              href="#features"
              className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium text-lg relative group"
            >
              {t.nav.features}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              href="#download"
              className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium text-lg relative group"
            >
              {t.nav.download}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              href="#about"
              className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium text-lg relative group"
            >
              {t.nav.about}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button
              variant="light"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="text-gray-700 hover:text-blue-600 font-medium"
              radius="lg"
            >
              {language === 'en' ? '中文' : 'EN'}
            </Button>
          </NavbarItem>
          <NavbarItem>
            <Button
              as="a"
              href="https://apps.apple.com/app/momi"
              target="_blank"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              radius="lg"
            >
              {t.nav.download}
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex gap-6 justify-between items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <Chip
                  variant="flat"
                  color="primary"
                  className="px-2 py-1 gap-1 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 text-blue-700 text-sm"
                  startContent={
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  }
                >
                  {language === 'en' ? 'Made by an indie developer' : '独立开发者作品'}
                </Chip>

                <h1 className="text-5xl  font-black text-gray-900 leading-none tracking-tight">
                  {t.hero.title}
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t.hero.subtitle}
                  </span>
                </h1>

                <p className="text-2xl text-gray-600 leading-relaxed max-w-2xl">
                  {t.hero.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <Button
                  as="a"
                  href="https://apps.apple.com/app/momi"
                  target="_blank"
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-7 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105"
                  radius="lg"
                >
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  {t.hero.downloadIOS}
                </Button>

                <Button
                  as="a"
                  href="#features"
                  variant="bordered"
                  size="lg"
                  className="border-2 border-gray-300 text-gray-700 px-10 py-7 text-xl font-bold hover:border-blue-500 hover:text-blue-600 transition-all duration-300 transform hover:-translate-y-1"
                  radius="lg"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {language === 'en' ? 'Explore Features' : '探索功能'}
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-gray-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{t.hero.compatibility}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{language === 'en' ? 'Privacy First' : '隐私优先'}</span>
                </div>
              </div>
            </div>

            {/* Right Content - App Preview */}
            <div className="relative lg:h-[600px] flex items-center justify-center">
              <div className="relative">
                {/* Phone Mockup */}
                <div className="w-80 h-[600px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-[3rem] p-2 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700">
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-[2.5rem] overflow-hidden relative">
                    {/* Status Bar */}
                    <div className="h-12 bg-white/90 flex items-center justify-between px-8 text-sm font-semibold text-gray-800">
                      <span>9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-4 h-2 bg-gray-800 rounded-sm"></div>
                        <div className="w-4 h-2 bg-gray-800 rounded-sm"></div>
                        <div className="w-4 h-2 bg-gray-800 rounded-sm"></div>
                      </div>
                    </div>

                    {/* App Content */}
                    <div className="p-6 space-y-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Momi</h3>
                        <p className="text-gray-600">{language === 'en' ? 'Smart Expense Tracking' : '智能记账助手'}</p>
                      </div>

                      {/* Feature Cards */}
                      <div className="space-y-4">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{language === 'en' ? 'AI Chat Input' : 'AI 对话输入'}</h4>
                              <p className="text-sm text-gray-600">{language === 'en' ? 'Natural language' : '自然语言识别'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{language === 'en' ? 'Smart Analytics' : '智能分析'}</h4>
                              <p className="text-sm text-gray-600">{language === 'en' ? 'Spending insights' : '消费洞察'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-8 -left-8 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-xl animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl shadow-xl animate-bounce" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 -right-12 w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full shadow-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-64 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-400/5 to-purple-600/5 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <Chip
              variant="flat"
              color="secondary"
              className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 text-purple-700"
            >
              {language === 'en' ? 'Core Features' : '核心功能'}
            </Chip>
            <h2 className="text-5xl lg:text-7xl font-black text-gray-900 mb-8 leading-tight">
              {t.features.title}
            </h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {t.features.subtitle}
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-20">
            {/* Feature 1 - AI Chat */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10">
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{t.features.aiChat.title}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t.features.aiChat.description}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>

            {/* Feature 2 - Smart Analytics */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10">
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{t.features.smartAnalysis.title}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t.features.smartAnalysis.description}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>

            {/* Feature 3 - Privacy */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10">
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{t.features.privacy.title}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t.features.privacy.description}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>
          </div>

          {/* Additional Features Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Feature 4 - Lightning Fast */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10">
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{language === 'en' ? 'Lightning Fast' : '快速便捷'}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {language === 'en' ? 'Complete expense tracking in 3 seconds with voice, photo, and manual input options' : '3秒完成记账，支持语音、拍照、手动等多种录入方式'}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-amber-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>

            {/* Feature 5 - Budget Management */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-teal-50 to-cyan-100 hover:from-teal-100 hover:to-cyan-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10">
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{language === 'en' ? 'Budget Management' : '预算管理'}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {language === 'en' ? 'Smart budget reminders help you control spending and achieve financial goals' : '智能预算提醒，帮助您控制支出，实现财务目标'}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-teal-400/20 to-cyan-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>

            {/* Feature 6 - Data Export */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-rose-100 hover:from-red-100 hover:to-rose-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10">
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{language === 'en' ? 'Data Export' : '数据导出'}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {language === 'en' ? 'Export data in CSV and PDF formats for tax filing and financial analysis' : '支持CSV、PDF格式导出，方便报税和财务分析'}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-red-400/20 to-rose-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>

            {/* Feature 7 - Data Security */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-indigo-50 to-blue-100 hover:from-indigo-100 hover:to-blue-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10">
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{language === 'en' ? 'Data Security' : '数据安全保护'}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {language === 'en' ? 'Bank-grade encryption technology ensures your financial data is secure and reliable' : '采用银行级加密技术，确保您的财务数据安全可靠'}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-blue-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-pink-400/10 to-orange-600/10 rounded-full blur-3xl"></div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Chip
              variant="flat"
              className="mb-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-200"
            >
              {language === 'en' ? 'Ready to Start?' : '准备开始了吗？'}
            </Chip>
            <h2 className="text-6xl lg:text-8xl font-black text-white mb-8 leading-tight">
              {t.cta.title}
            </h2>
            <p className="text-2xl text-blue-100 mb-16 max-w-4xl mx-auto leading-relaxed">
              {t.cta.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-24">
              <Button
                as="a"
                href="https://apps.apple.com/app/momi"
                target="_blank"
                size="lg"
                className="bg-gradient-to-r from-white to-gray-100 text-gray-900 hover:from-gray-100 hover:to-white font-bold px-12 py-6 text-xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105"
                radius="full"
                startContent={
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                }
              >
                {t.cta.button}
              </Button>

              <Button
                as="a"
                href="#features"
                size="lg"
                variant="bordered"
                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white font-bold px-12 py-6 text-xl transition-all duration-500 transform hover:-translate-y-2 backdrop-blur-sm"
                radius="full"
                startContent={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                }
              >
                {language === 'en' ? 'Learn More' : '了解更多'}
              </Button>
            </div>
          </div>

          {/* Features highlight */}
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:-translate-y-2" radius="lg">
              <CardBody className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{language === 'en' ? 'Free to Use' : '免费使用'}</h3>
                <p className="text-blue-100 text-lg leading-relaxed">{language === 'en' ? 'No hidden costs' : '无隐藏费用'}</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:-translate-y-2" radius="lg">
              <CardBody className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{language === 'en' ? 'Secure & Private' : '安全私密'}</h3>
                <p className="text-blue-100 text-lg leading-relaxed">{language === 'en' ? 'Your data stays safe' : '数据安全保障'}</p>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:-translate-y-2" radius="lg">
              <CardBody className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{language === 'en' ? 'Lightning Fast' : '闪电般快速'}</h3>
                <p className="text-blue-100 text-lg leading-relaxed">{language === 'en' ? '3-second expense tracking' : '3秒记账体验'}</p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Background effects */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-cyan-600/10 rounded-full blur-3xl"></div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-8">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-white">
                      <Image
                        src="/icon.png"
                        alt="Momi Logo"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-xl"></div>
                </div>
                <span className="ml-4 text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Momi</span>
              </div>
              <p className="text-gray-300 mb-8 max-w-lg text-xl leading-relaxed">
                {t.footer.madeBy}
              </p>
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30">
                <svg className="w-6 h-6 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-blue-200 font-semibold text-lg">{language === 'en' ? 'Supports iOS 14+' : '支持 iOS 14+'}</span>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-8 text-white">{language === 'en' ? 'Product' : '产品'}</h3>
              <ul className="space-y-5">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group text-lg">
                    <svg className="w-5 h-5 mr-3 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {language === 'en' ? 'Features' : '功能特色'}
                  </a>
                </li>
                <li>
                  <a href="#download" className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group text-lg">
                    <svg className="w-5 h-5 mr-3 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {language === 'en' ? 'Download' : '下载应用'}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group text-lg">
                    <svg className="w-5 h-5 mr-3 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {language === 'en' ? 'Tutorials' : '使用教程'}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group text-lg">
                    <svg className="w-5 h-5 mr-3 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {language === 'en' ? 'FAQ' : '常见问题'}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-8 text-white">{language === 'en' ? 'Legal' : '法律信息'}</h3>
              <ul className="space-y-5">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group text-lg">
                    <svg className="w-5 h-5 mr-3 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {t.footer.privacy}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group text-lg">
                    <svg className="w-5 h-5 mr-3 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {t.footer.terms}
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group text-lg">
                    <svg className="w-5 h-5 mr-3 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {language === 'en' ? 'About' : '关于我们'}
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-gray-400 hover:text-white transition-all duration-300 flex items-center group text-lg">
                    <svg className="w-5 h-5 mr-3 text-blue-400 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {language === 'en' ? 'Contact' : '联系我们'}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700/50 pt-12">
            <div className="flex flex-col lg:flex-row justify-between items-center">
              <p className="text-gray-400 text-xl mb-6 lg:mb-0">{language === 'en' ? '© 2024 Momi. All rights reserved.' : '© 2024 Momi. 保留所有权利。'}</p>
              <div className="flex space-x-8">
                <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Background effects */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-full blur-3xl"></div>
        </div>
      </footer>
    </div>
  );
}
