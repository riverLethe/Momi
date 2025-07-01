import React, { useState, useEffect } from "react";
import { Platform } from "react-native";
import { Sheet, YStack, XStack, Button, Paragraph, useTheme } from "tamagui";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";

export interface DatePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 默认选中的日期 */
  initialDate: Date;
  /** 点击确定后的回调 */
  onConfirm: (date: Date) => void;
  /** 标题 */
  title?: string;
  /** 选择模式，默认为 "date" */
  mode?: "date" | "time" | "datetime";
  onlyContent?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
}

/**
 * DatePickerSheet
 * ----------------
 * 通用的底部弹出层日期选择器，支持下滑关闭。
 * - 依赖 Tamagui 的 Sheet 组件呈现弹出层。
 * - 内部使用 `@react-native-community/datetimepicker`。
 * - 通过 `onConfirm` 返回选中的日期，取消操作不会触发回调。
 */
const DatePickerSheet: React.FC<DatePickerSheetProps> = ({
  open,
  onOpenChange,
  initialDate,
  onConfirm,
  title,
  mode = "date",
  onlyContent = false,
  maximumDate,
  minimumDate,
}) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const theme = useTheme();
  /**
   * 当弹窗打开时，同步初始日期
   */
  useEffect(() => {
    if (open) {
      setSelectedDate(initialDate);
    }
  }, [open]);

  /**
   * 点击『Done』按钮
   */
  const handleConfirm = () => {
    onConfirm(selectedDate);
    onOpenChange(false);
  };

  const renderContent = () => (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Paragraph fontSize={18} fontWeight="700">
          {title || t("Select Date")}
        </Paragraph>

        <Button
          theme="active"
          backgroundColor="$blue10"
          onPress={handleConfirm}
          size="$3"
        >
          <Paragraph color="white" fontWeight="700">
            {t("Save")}
          </Paragraph>
        </Button>
      </XStack>

      <DateTimePicker
        value={selectedDate}
        mode={mode}
        display={Platform.OS === "ios" ? "spinner" : "default"}
        onChange={(_, date) => {
          if (date) {
            setSelectedDate(date);
          }
        }}
        style={{ alignSelf: "center" }}
        maximumDate={maximumDate || new Date()}
        minimumDate={minimumDate}
        textColor={theme.color?.val}
      />
    </YStack>
  );
  return onlyContent ? renderContent() : (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[40]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame bg="$background" padding="$4">
        {renderContent()}
      </Sheet.Frame>
    </Sheet>
  );
};

// Memoize to avoid unnecessary rerenders when parent updates
export default React.memo(DatePickerSheet);
