import React, { useRef, useState, useCallback, useEffect } from "react";
import { useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useDerivedValue,
  runOnJS
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { View, YStack, Text, useTheme } from "tamagui";

// Data & Welcome -----------------------------------------------------------
import { useData } from "@/providers/DataProvider";
import { useAuth } from "@/providers/AuthProvider";
import WelcomeScreen from "@/components/home/WelcomeScreen";

// 懒加载PeriodPage组件，避免阻塞初始渲染
import PeriodPage from "@/components/home/PeriodPage"

// UI Components ------------------------------------------------------------
import DateFilter from "@/components/reports/DateFilter";

// Utils & Types ------------------------------------------------------------
import { DatePeriodEnum } from "@/types/reports.types";
import { generatePeriodSelectors } from "@/utils/date.utils";
import { useTranslation } from "react-i18next";

// Budget modal and budgets -------------------------------------------------
import BudgetUpdateModal from "@/components/budget/BudgetUpdateModal";
import { useBudgets } from "@/hooks/useBudgets";
import { syncBudgetWidgets } from "@/utils/budgetWidgetSync.utils";
import type { Budgets, BudgetPeriod } from "@/utils/budget.utils";
import { apiClient } from "@/utils/api";
import { getAuthToken } from "@/utils/userPreferences.utils";

export default function HomeScreenPager() {
  const { t } = useTranslation();
  // ---------------------------------------------------------------------
  // Global data status / decide what to show
  // ---------------------------------------------------------------------
  const { bills, isLoading: dataLoading } = useData();
  const { user } = useAuth();
  const initialLoading = dataLoading.initial;
  const hasBills = bills.length > 0;
  const insets = useSafeAreaInsets();

  const router = useRouter();

  const { width } = useWindowDimensions();

  const periodOrder = [
    DatePeriodEnum.WEEK,
    DatePeriodEnum.MONTH,
    DatePeriodEnum.YEAR,
  ];

  // Track selected periodId for each period type
  const initIds: Record<DatePeriodEnum, string> = {
    [DatePeriodEnum.WEEK]: generatePeriodSelectors(DatePeriodEnum.WEEK)[0]?.id ?? "",
    [DatePeriodEnum.MONTH]: generatePeriodSelectors(DatePeriodEnum.MONTH)[0]?.id ?? "",
    [DatePeriodEnum.YEAR]: generatePeriodSelectors(DatePeriodEnum.YEAR)[0]?.id ?? "",
  };

  const [selectedIds, setSelectedIds] = useState<Record<DatePeriodEnum, string>>(initIds);

  const scrollRef = useRef<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  // Header quick index
  const [visibleIdx, setVisibleIdx] = useState(0);

  const scrollX = useSharedValue(0);
  const lastIdx = useSharedValue(0);
  // Use shared value instead of ref to avoid mutation warning inside worklets
  const targetIdxSV = useSharedValue(-1);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });
  useEffect(() => {
    if (!user) return
    const abc = async () => {
      const token = await getAuthToken();
      if (token) console.log(await apiClient.sync.downloadBills(token))
    }
    abc()
  }, [user])

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== currentIdx) {
      setCurrentIdx(idx);
    }
    // programmatic scroll finished
    targetIdxSV.value = -1;
  };

  const handleExternalPeriodChange = (p: DatePeriodEnum) => {
    const idx = periodOrder.indexOf(p);
    if (idx === -1) return;

    // 1. 立即更新 header 高亮
    setVisibleIdx(idx);

    // mark target idx to suppress intermediate updates
    targetIdxSV.value = idx;

    // 2. 平滑滚动对应页面（若用户点击）
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });

    // 3. 告诉数据层当前选中的 index（如果你的重加载逻辑仍依赖）
    setCurrentIdx(idx);
  };

  // Handle selector change inside DateFilter
  const handlePeriodSelectorChange = (id: string) => {
    const periodType = periodOrder[visibleIdx];
    setSelectedIds((prev) => ({ ...prev, [periodType]: id }));
  };

  // Update header index on UI thread → JS thread quickly
  useDerivedValue(() => {
    const idx = Math.round(scrollX.value / width);
    if (idx !== lastIdx.value) {
      lastIdx.value = idx;
      // During programmatic scroll, ignore intermediate indices to avoid flicker
      if (targetIdxSV.value === -1 || idx === targetIdxSV.value) {
        runOnJS(setVisibleIdx)(idx);
      }
    }
  });

  // Budgets ----------------------------------------------------------------
  const { budgets, saveBudgetForPeriod } = useBudgets();

  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);

  const openBudgetModal = useCallback(() => setBudgetModalOpen(true), []);

  const handleSaveBudgets = useCallback(async (nextBudgets: Budgets) => {
    try {
      const periods: BudgetPeriod[] = ["weekly", "monthly", "yearly"];
      for (const p of periods) {
        const detail = nextBudgets[p as keyof Budgets];
        if (detail) {
          // eslint-disable-next-line no-await-in-loop
          await saveBudgetForPeriod(p, detail);
        }
      }

      // Sync widgets after budgets updated
      await syncBudgetWidgets({ viewMode: "personal", budgetVersion: Date.now() }).catch(() => { });
    } catch (error) {
      console.error("Failed to save budgets:", error);
    }
  }, [saveBudgetForPeriod]);

  const theme = useTheme();

  // Decide UI -------------------------------------------------------------
  if (initialLoading) {
    return <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
      <ActivityIndicator size="large" color={theme.blue9?.get()} />
      <Text mt="$3" color="$color10">
        {t("Synchronizing data...")}
      </Text>
    </YStack>;
  }

  if (!hasBills) {
    return <WelcomeScreen onStartChatPress={() => router.push("/chat")} />;
  }

  return (
    <>
      <View flex={1} backgroundColor="$background" paddingTop={insets.top}>
        {/* Fixed Header */}
        <View paddingHorizontal={8} paddingVertical={4} >
          <DateFilter
            selectedPeriod={periodOrder[visibleIdx]}
            onPeriodChange={handleExternalPeriodChange}
            periodSelectors={generatePeriodSelectors(periodOrder[visibleIdx])}
            selectedPeriodId={selectedIds[periodOrder[visibleIdx]]}
            onPeriodSelectorChange={handlePeriodSelectorChange}
            onBillsPress={() => router.push("/bills")}
            hasFamily={!!user?.family}
          />
        </View>

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {periodOrder.map((p, idx) => (
            <View key={p} style={{ width }}>
              <PeriodPage
                periodType={p}
                onPeriodTypeChange={handleExternalPeriodChange}
                selectedPeriodId={selectedIds[p]}
                onSelectedPeriodChange={(id: string) =>
                  setSelectedIds((prev) => ({ ...prev, [p]: id }))
                }
                openBudgetModal={openBudgetModal}
              />
            </View>
          ))}
        </Animated.ScrollView>

      </View>

      {/* Global budget update modal */}
      <BudgetUpdateModal
        isOpen={isBudgetModalOpen}
        onOpenChange={setBudgetModalOpen}
        budgets={budgets}
        onSave={handleSaveBudgets}
        defaultPeriod={periodOrder[visibleIdx]}
      />
    </>
  );
}
