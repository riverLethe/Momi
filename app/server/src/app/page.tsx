'use client';

import Link from 'next/link';
import { Button, Card, CardBody, Navbar, NavbarBrand, NavbarContent, NavbarItem, Chip } from '@nextui-org/react';
import { useState, useEffect } from 'react';
import { LanguagesIcon, MessageCircleMoreIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../lib/i18n';

export default function Home() {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <Navbar
        position="sticky"
        className=' bg-background/50 backdrop-blur-[10px] z-10'
        maxWidth='full'
      >
        <div className='max-w-7xl mx-auto w-full flex items-center justify-between'>
          <div className='flex items-center gap-8'>
            <NavbarBrand>
              <div className="flex items-center py-3">
                <img
                  src="/icon.png"
                  alt="Momi Logo"
                  className="w-[40px] h-[40px] object-cover rounded-md"
                />
              </div>
            </NavbarBrand>
            <NavbarContent className="hidden md:flex gap-8" justify="center">
              <NavbarItem>
                <Link
                  href="#features"
                  className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium text-lg relative group"
                >
                  {t('Features')}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </NavbarItem>
              <NavbarItem>
                <Link
                  href="#about"
                  className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium text-lg relative group"
                >
                  {t('About')}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </NavbarItem>
            </NavbarContent>
          </div>
          <NavbarContent justify="end">
            <NavbarItem>
              <Button
                variant="light"
                size="sm"
                onPress={() => changeLanguage(i18n.language === 'en' ? 'zh' : 'en')}
              >
                <LanguagesIcon />
              </Button>
            </NavbarItem>
          </NavbarContent>
        </div>
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
                  {t('Made by an indie developer')}
                </Chip>

                <h1 className="text-5xl  font-black text-gray-900 leading-none tracking-tight">
                  {t('Smart Expense Tracking')}
                </h1>
                <h1 className="text-5xl  font-black text-gray-900 leading-none tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t('Made Simple')}
                </h1>

                <p className="text-2xl text-gray-600 leading-relaxed max-w-2xl">
                  {t('AI-powered expense tracking app with natural language input, automatic categorization, and intelligent insights. Take control of your personal finances effortlessly.')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <Button
                  as="a"
                  href="https://apps.apple.com/app/momi"
                  target="_blank"
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-7 text-xl font-bold transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 rounded-md"
                >
                  <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  {t('Download for iOS')}
                </Button>

                <Button
                  as="a"
                  href="#features"
                  variant="bordered"
                  size="lg"
                  className="rounded-md border-2 border-gray-300 text-gray-700 px-10 py-7 text-xl font-bold hover:border-blue-500 hover:text-blue-600 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {t('Explore Features')}
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-gray-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{t('Supports iOS 14+')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{t('Privacy First')}</span>
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
                        <div className="w-16 h-16  rounded-2xl mx-auto mb-4 flex items-center justify-center">
                          <img
                            src="/icon.png"
                            alt="Momi Logo"
                            className="w-16 h-16 object-cover rounded-2xl"
                          />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">MomiQ</h3>
                        <p className="text-gray-600">{t('Smart Expense Tracking')}</p>
                      </div>

                      {/* Feature Cards */}
                      <div className="space-y-4">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                              <MessageCircleMoreIcon className='text-primary' />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{t('AI Chat Input')}</h4>
                              <p className="text-sm text-gray-600">{t('Natural language')}</p>
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
                              <h4 className="font-semibold text-gray-900">{t('Smart Analytics')}</h4>
                              <p className="text-sm text-gray-600">{t('Spending insights')}</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <Chip
              variant="flat"
              color="secondary"
              className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 text-purple-700"
            >
              {t('Core Features')}
            </Chip>
            <h2 className="text-5xl lg:text-7xl font-black text-gray-900 mb-8 leading-tight">
              {t('Core Features')}
            </h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {t('Everything you need for smart financial management')}
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-20">
            {/* Feature 1 - AI Chat */}
            <Card className="rounded-md group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105">
              <CardBody className="p-10 overflow-y-hidden">
                <div >
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{t('AI-Powered Input')}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t('Simply tell Momi what you spent. Our AI understands natural language and automatically categorizes your expenses with 90% accuracy.')}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>

            {/* Feature 2 - Smart Analytics */}
            <Card className="rounded-md group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10 overflow-y-hidden">
                <div >
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{t('Smart Analytics')}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t('Get personalized insights into your spending patterns with beautiful charts and actionable recommendations.')}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>

            {/* Feature 3 - Privacy */}
            <Card className="rounded-md group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10 overflow-y-hidden">
                <div >
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{t('Privacy First')}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t('Your financial data stays on your device. Bank-grade encryption ensures your information is always secure.')}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>
          </div>

          {/* Additional Features Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Feature 4 - Lightning Fast */}
            <Card className="rounded-md group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10 overflow-y-hidden">
                <div >
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{t('Lightning Fast')}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t('Complete expense tracking in 3 seconds with voice, photo, and manual input options')}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400/20 to-amber-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>

            {/* Feature 5 - Budget Management */}
            <Card className="rounded-md group relative overflow-hidden border-0 bg-gradient-to-br from-teal-50 to-cyan-100 hover:from-teal-100 hover:to-cyan-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10 overflow-y-hidden">
                <div >
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{t('Budget Management')}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t('Smart budget reminders help you control spending and achieve financial goals')}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-teal-400/20 to-cyan-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>

            {/* Feature 6 - Data Export */}
            <Card className="rounded-md group relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-rose-100 hover:from-red-100 hover:to-rose-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10 overflow-y-hidden">
                <div >
                  <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{t('Data Export')}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t('Export data in CSV and PDF formats for tax filing and financial analysis')}
                  </p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-red-400/20 to-rose-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </CardBody>
            </Card>

            {/* Feature 7 - Data Security */}
            <Card className="rounded-md group relative overflow-hidden border-0 bg-gradient-to-br from-indigo-50 to-blue-100 hover:from-indigo-100 hover:to-blue-200 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105" radius="lg">
              <CardBody className="p-10 overflow-y-hidden">
                <div >
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:rotate-6">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">{t('Data Security')}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t('Bank-grade encryption technology ensures your financial data is secure and reliable')}
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
      <section className="py-32 bg-gradient-to-br from-orange-900/80 via-purple-900/50 to-purple-900 relative overflow-hidden relative z-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Chip
              variant="flat"
              className="mb-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-200"
            >
              {t('Ready to Start?')}
            </Chip>
            <h2 className="text-6xl lg:text-8xl font-black text-white mb-8 leading-tight">
              {t('Ready to take control?')}
            </h2>
            <p className="text-2xl text-blue-100 mb-16 max-w-4xl mx-auto leading-relaxed">
              {t('Join thousands of users who have simplified their expense tracking')}
            </p>

            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-24">
              <Button
                as="a"
                href="https://apps.apple.com/app/momi"
                target="_blank"
                size="lg"
                className="rounded-md gap-2 bg-gradient-to-r from-white to-gray-100 text-gray-900 hover:from-gray-100 hover:to-white font-bold px-12 py-6 text-xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105"
                startContent={
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                }
              >
                {t('Get Started Free')}
              </Button>


            </div>
          </div>

          {/* Features highlight */}
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="bg-default/5 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:-translate-y-2" radius="lg">
              <CardBody className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{t('Free to Use')}</h3>
                <p className="text-blue-100 text-lg leading-relaxed">{t('No hidden costs')}</p>
              </CardBody>
            </Card>

            <Card className="bg-default/5 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:-translate-y-2" radius="lg">
              <CardBody className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{t('Secure & Private')}</h3>
                <p className="text-blue-100 text-lg leading-relaxed">{t('Your data stays safe')}</p>
              </CardBody>
            </Card>

            <Card className="bg-default/5 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:-translate-y-2" radius="lg">
              <CardBody className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{t('Lightning Fast')}</h3>
                <p className="text-blue-100 text-lg leading-relaxed">{t('3-second expense tracking')}</p>
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

      <footer className="py-4 px-4 sm:px-6 text-center sm:text-end max-w-7xl mx-auto text-xs">
        © 2025 MomiQ. All rights reserved.
      </footer>
    </div>
  );
}
