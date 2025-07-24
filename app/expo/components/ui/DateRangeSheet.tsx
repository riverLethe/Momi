import React, { useState, useMemo, useEffect } from "react";
import {
  Sheet,
  YStack,
  Text,
  Button,
  XStack,
  useTheme,
  ScrollView,
} from "tamagui";
import { Calendar, DateData } from "react-native-calendars";
import { useTranslation } from "react-i18next";
import {
  format,
  getYear,
  getMonth,
  setYear,
  setMonth,
  addYears,
  subYears,
  addMonths,
} from "date-fns";
import { TouchableOpacity } from "react-native";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react-native";
import { enUS, zhCN, es as esLocale } from "date-fns/locale";
import type { Locale } from "date-fns";
import i18n from "@/i18n";

type MarkedDates = {
  [key: string]: {
    startingDay?: boolean;
    endingDay?: boolean;
    color: string;
    textColor: string;
    disabled?: boolean;
    disableTouchEvent?: boolean;
  };
};

interface DateRangeSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onApply: (startDate: Date | null, endDate: Date | null) => void;
  initialStartDate: Date | null;
  initialEndDate: Date | null;
  minDate?: Date;
  maxDate?: Date;
  /** Maximum selectable span in months from start date */
  maxRangeMonths?: number;
}

type ViewMode = "days" | "months" | "years";

export const DateRangeSheet: React.FC<DateRangeSheetProps> = ({
  isOpen,
  setIsOpen,
  onApply,
  initialStartDate,
  initialEndDate,
  minDate,
  maxDate,
  maxRangeMonths = 3,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [visibleDate, setVisibleDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("days");

  useEffect(() => {
    const start = initialStartDate;
    const end = initialEndDate;
    setStartDate(start);
    setEndDate(end);
    setVisibleDate(start || end || new Date());
    setViewMode("days");
  }, [initialStartDate, initialEndDate, isOpen]);

  const handleDayPress = (day: DateData) => {
    const selectedDate = new Date(day.timestamp);
    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (selectedDate < startDate) {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const markedDates = useMemo(() => {
    const marks: MarkedDates = {};
    const primaryColor = theme.blue9?.val || "#007AFF";
    const textColor = theme.color1?.val || "#FFFFFF";

    if (startDate) {
      const startStr = format(startDate, "yyyy-MM-dd");
      marks[startStr] = {
        startingDay: true,
        color: primaryColor,
        textColor,
      };

      if (endDate) {
        const endStr = format(endDate, "yyyy-MM-dd");

        if (startStr !== endStr) {
          let current = new Date(startDate);
          current.setDate(current.getDate() + 1);
          while (current < endDate) {
            const dateStr = format(current, "yyyy-MM-dd");
            marks[dateStr] = {
              color: theme.blue5?.val || "#DCEEFF",
              textColor: primaryColor,
            };
            current.setDate(current.getDate() + 1);
          }
        }

        marks[endStr] = {
          ...marks[endStr],
          endingDay: true,
          color: primaryColor,
          textColor,
        };
      }
    }
    return marks;
  }, [startDate, endDate, theme]);

  const applyAndClose = () => {
    if (startDate && !endDate) {
      onApply(startDate, startDate);
    } else {
      onApply(startDate, endDate);
    }
    setIsOpen(false);
  };

  const clearDates = () => {
    setStartDate(null);
    setEndDate(null);
    onApply(null, null);
    setIsOpen(false);
  };

  const setPreset = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const today = new Date();

  // calculate effective max date (cannot select after today or beyond range)
  const computedMaxDate = useMemo(() => {
    if (startDate && !endDate) {
      const rangeCap = addMonths(startDate, maxRangeMonths);
      const globalMax = maxDate || new Date();
      return rangeCap < globalMax ? rangeCap : globalMax;
    }
    return maxDate;
  }, [startDate, endDate, maxDate, maxRangeMonths]);

  // Map i18n language codes to date-fns locales
  const localeMap: Record<string, Locale> = {
    en: enUS,
    zh: zhCN,
    es: esLocale,
  };

  const currentLocale = localeMap[i18n.language] || enUS;

  const renderYearSelector = () => {
    const currentYear = getYear(visibleDate);
    const startYear = Math.floor(currentYear / 10) * 10;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i - 1);

    return (
      <YStack f={1}>
        <XStack justifyContent="space-between" alignItems="center" padding="$2">
          <Button
            chromeless
            onPress={() => setVisibleDate((d) => subYears(d, 10))}
            icon={<ChevronLeftIcon size={24} color={theme.blue9?.val} />}
          ></Button>
          <Text
            fontSize="$6"
            fontWeight="bold"
          >{`${years[0]} - ${years[years.length - 1]}`}</Text>
          <Button
            chromeless
            onPress={() => setVisibleDate((d) => addYears(d, 10))}
            icon={<ChevronRightIcon size={24} color={theme.blue9?.val} />}
          ></Button>
        </XStack>
        <ScrollView>
          <XStack flexWrap="wrap" justifyContent="center" padding="$2">
            {years.map((year) => (
              <Button
                key={year}
                theme={year === getYear(visibleDate) ? ("blue" as any) : ("gray" as any)}
                onPress={() => {
                  setVisibleDate((d) => setYear(d, year));
                  setViewMode("months");
                }}
                margin="$1.5"
                width={80}
              >
                <Text>{year}</Text>
              </Button>
            ))}
          </XStack>
        </ScrollView>
      </YStack>
    );
  };

  const renderMonthSelector = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const year = getYear(visibleDate);

    return (
      <YStack f={1}>
        <XStack justifyContent="space-between" alignItems="center" padding="$2">
          <Button
            chromeless
            onPress={() => setVisibleDate((d) => subYears(d, 1))}
            icon={<ChevronLeftIcon size={24} color={theme.blue9?.val} />}
          ></Button>
          <TouchableOpacity onPress={() => setViewMode("years")}>
            <Text fontSize="$6" fontWeight="bold">
              {year}
            </Text>
          </TouchableOpacity>
          <Button
            chromeless
            onPress={() => setVisibleDate((d) => addYears(d, 1))}
            icon={<ChevronRightIcon size={24} color={theme.blue9?.val} />}
          ></Button>
        </XStack>
        <ScrollView>
          <XStack flexWrap="wrap" justifyContent="center" padding="$2">
            {months.map((month) => (
              <Button
                key={month}
                theme={month === getMonth(visibleDate) ? ("blue" as any) : ("gray" as any)}
                onPress={() => {
                  setVisibleDate((d) => setMonth(d, month));
                  setViewMode("days");
                }}
                margin="$1.5"
                width={80}
              >
                {format(new Date(year, month), "MMM", { locale: currentLocale })}
              </Button>
            ))}
          </XStack>
        </ScrollView>
      </YStack>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case "years":
        return renderYearSelector();
      case "months":
        return renderMonthSelector();
      case "days":
      default:
        return (
          <YStack f={1}>
            <Calendar
              current={format(visibleDate, "yyyy-MM-dd")}
              onDayPress={handleDayPress}
              onMonthChange={(date: DateData) =>
                setVisibleDate(new Date(date.timestamp))
              }
              markingType={"period"}
              markedDates={markedDates}
              minDate={minDate ? format(minDate, "yyyy-MM-dd") : undefined}
              maxDate={computedMaxDate ? format(computedMaxDate, "yyyy-MM-dd") : undefined}
              theme={{
                backgroundColor: theme.card?.val,
                calendarBackground: theme.card?.val,
                textSectionTitleColor: theme.color11?.val,
                selectedDayBackgroundColor: theme.blue9?.val,
                selectedDayTextColor: "#ffffff",
                todayTextColor: theme.blue9?.val,
                dayTextColor: theme.color?.val,
                textDisabledColor: theme.color8?.val,
                dotColor: theme.blue9?.val,
                selectedDotColor: "#ffffff",
                arrowColor: theme.blue9?.val,
                monthTextColor: theme.color?.val,
                indicatorColor: theme.color?.val,
                textDayFontWeight: "300",
                textMonthFontWeight: "bold",
                textDayHeaderFontWeight: "300",
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 16,
              }}
              renderHeader={(date: any) => {
                const jsDate = new Date(date?.getTime() || Date.now());
                return (
                  <XStack
                    justifyContent="center"
                    paddingVertical="$2"
                    alignItems="center"
                  >
                    <TouchableOpacity onPress={() => setViewMode("months")}>
                      <Text fontSize="$6" fontWeight="bold">
                        {format(jsDate, "MMMM yyyy", { locale: currentLocale })}
                      </Text>
                    </TouchableOpacity>
                  </XStack>
                );
              }}
            />
          </YStack>
        );
    }
  };

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={setIsOpen}
      snapPoints={[50]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Handle />

      <Sheet.Frame backgroundColor="$card">
        <YStack f={1}>
          {renderContent()}
          <YStack padding="$5" space="$3">
            {/* <XStack space="$2" justifyContent="space-between">
              <Button
                f={1}
                theme="gray"
                onPress={() => setPreset(today, today)}
              >
                {t("Today")}
              </Button>
              <Button
                f={1}
                theme="gray"
                onPress={() =>
                  setPreset(startOfMonth(visibleDate), endOfMonth(visibleDate))
                }
              >
                {t("This Month")}
              </Button>
              <Button
                f={1}
                theme="gray"
                onPress={() =>
                  setPreset(startOfYear(visibleDate), endOfYear(visibleDate))
                }
              >
                {t("This Year")}
              </Button>
            </XStack> */}
            <XStack space="$3">
              <Button flex={1} theme={"gray" as any} onPress={clearDates}>
                {t("Clear")}
              </Button>
              <Button flex={1} theme={"blue" as any} onPress={applyAndClose}>
                {t("Apply")}
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
