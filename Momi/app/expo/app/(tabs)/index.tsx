import React, { useRef, useState } from "react";
import { useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent, View } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useDerivedValue,
    runOnJS
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import PeriodPage from "@/components/home/PeriodPage";

// UI Components ------------------------------------------------------------
import DateFilter from "@/components/reports/DateFilter";

// Utils & Types ------------------------------------------------------------
import { DatePeriodEnum } from "@/types/reports.types";
import { generatePeriodSelectors } from "@/utils/date.utils";

export default function HomeScreenPager() {
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

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / width);
        if (idx !== currentIdx) setCurrentIdx(idx);
    };

    const handleExternalPeriodChange = (p: DatePeriodEnum) => {
        const idx = periodOrder.indexOf(p);
        if (idx !== -1 && scrollRef.current) {
            scrollRef.current.scrollTo({ x: idx * width, animated: true });
            setCurrentIdx(idx);
        }
    };

    // Handle selector change inside DateFilter
    const handlePeriodSelectorChange = (id: string) => {
        const periodType = periodOrder[currentIdx];
        setSelectedIds((prev) => ({ ...prev, [periodType]: id }));
    };

    // Update header index on UI thread → JS thread quickly
    useDerivedValue(() => {
        const idx = Math.round(scrollX.value / width);
        if (idx !== lastIdx.value) {
            lastIdx.value = idx;
            runOnJS(setVisibleIdx)(idx);
        }
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#eee" }}>
            {/* Fixed Header */}
            <View style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                <DateFilter
                    selectedPeriod={periodOrder[visibleIdx]}
                    onPeriodChange={handleExternalPeriodChange}
                    periodSelectors={generatePeriodSelectors(periodOrder[visibleIdx])}
                    selectedPeriodId={selectedIds[periodOrder[visibleIdx]]}
                    onPeriodSelectorChange={handlePeriodSelectorChange}
                    onBillsPress={() => router.push("/bills")}
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
                {periodOrder.map((p) => (
                    <View key={p} style={{ width }}>
                        <PeriodPage
                            periodType={p}
                            onPeriodTypeChange={handleExternalPeriodChange}
                            selectedPeriodId={selectedIds[p]}
                            onSelectedPeriodChange={(id: string) =>
                                setSelectedIds((prev) => ({ ...prev, [p]: id }))
                            }
                        />
                    </View>
                ))}
            </Animated.ScrollView>
        </SafeAreaView>
    );
}