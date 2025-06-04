import React, { useState } from "react";
import { View, Text, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "tamagui";
import { useRouter } from "expo-router";
import { ChevronRight, Brain, Users, TrendingUp } from "lucide-react-native";
import { useLanguage } from "@/hooks/useLanguage";

const { width } = Dimensions.get("window");

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: OnboardingSlide[] = [
    {
      id: 0,
      title: t("Smart AI Accounting"),
      description: t(
        "Use AI to quickly record bills, support text, images and file imports"
      ),
      icon: <Brain size={80} color="#3B82F6" />,
    },
    {
      id: 1,
      title: t("Family Auto Sharing"),
      description: t(
        "Bills created in family space are automatically visible to all members"
      ),
      icon: <Users size={80} color="#3B82F6" />,
    },
    {
      id: 2,
      title: t("Visual Analysis"),
      description: t(
        "Clear charts to help you understand consumption patterns"
      ),
      icon: <TrendingUp size={80} color="#3B82F6" />,
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.replace("/auth/login");
    }
  };

  const handleSkip = () => {
    router.replace("/auth/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        {/* Skip Button */}
        <View className="flex-row justify-end pt-4">
          <Button
            variant="ghost"
            size="$3"
            onPress={handleSkip}
            className="text-gray-500"
          >
            {t("Skip")}
          </Button>
        </View>

        {/* Content */}
        <View className="flex-1 items-center justify-center">
          <View className="mb-12">{slides[currentSlide].icon}</View>

          <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
            {slides[currentSlide].title}
          </Text>

          <Text className="text-base text-gray-600 text-center px-8 mb-12">
            {slides[currentSlide].description}
          </Text>
        </View>

        {/* Indicators */}
        <View className="flex-row justify-center mb-8">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2 mx-1 rounded-full ${
                index === currentSlide ? "w-8 bg-blue-500" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </View>

        {/* Bottom Actions */}
        <View className="pb-8">
          <Button
            size="$4"
            onPress={handleNext}
            icon={ChevronRight}
            iconAfter
            className="bg-blue-500"
          >
            {currentSlide === slides.length - 1 ? t("Get Started") : t("Next")}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
