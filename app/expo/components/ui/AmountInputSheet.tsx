import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Sheet, YStack, XStack, Button, Text } from "tamagui";
import {
  Delete as DeleteIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Equal as EqualIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface AmountInputSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAmount?: number;
  onSubmit: (amount: number) => void;
}

/**
 * AmountInputSheet 组件
 * --------------------
 * 一个可重用的底部弹出层数字键盘，用于输入或修改金额。
 * - 继承自 AddBillScreen 中的自定义键盘逻辑。
 * - 支持加/减简单运算，"Done" 按钮提交。
 */
export const AmountInputSheet: React.FC<AmountInputSheetProps> = ({
  open,
  onOpenChange,
  initialAmount = 0,
  onSubmit,
}) => {
  const { t } = useTranslation();

  /* 本地状态 */
  const [amount, setAmount] = useState<string>("0");
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  /* 打开/关闭时同步初始金额 */
  useEffect(() => {
    if (open) {
      setAmount(String(initialAmount || 0));
      setFirstOperand(null);
      setOperator(null);
      setShouldResetDisplay(false);
    }
  }, [open, initialAmount]);

  /* 计算逻辑 - 加速计算操作 */
  const calculate = useCallback((first: number, second: number, op: string): number => {
    switch (op) {
      case "+": return first + second;
      case "-": return first - second;
      default: return second;
    }
  }, []);

  // 缓存金额分析
  const amountAnalysis = useMemo(() => {
    const hasDecimal = amount.includes(".");
    return {
      hasDecimal,
      decimalDigits: hasDecimal ? amount.split(".")[1].length : 0,
      maxLength: amount.length >= 8,
      isZero: amount === "0",
    };
  }, [amount]);

  /* 键盘点击 - 优化性能处理 */
  const handleKeypadPress = (key: string) => {
    // 直接更新UI，然后将计算放在下一个渲染循环
    if (amountAnalysis.maxLength && !shouldResetDisplay) return;

    if (shouldResetDisplay) {
      setAmount(key === "." ? "0." : key);
      setShouldResetDisplay(false);
      return;
    }

    if (key === ".") {
      if (!amountAnalysis.hasDecimal) {
        setAmount(prev => prev + ".");
      }
      return;
    }

    if (amountAnalysis.hasDecimal && amountAnalysis.decimalDigits >= 2) return;

    setAmount(prev => prev === "0" ? key : prev + key);
  };

  /* 删除按钮 - 优化性能处理 */
  const handleDeletePress = () => {
    if (shouldResetDisplay && operator) {
      setOperator(null);
      setShouldResetDisplay(false);
      return;
    }

    if (operator && !shouldResetDisplay) {
      if (amount.length > 1) {
        setAmount(prev => prev.slice(0, -1));
      } else {
        setShouldResetDisplay(true);
        if (firstOperand !== null) {
          setAmount(String(firstOperand));
        }
      }
      return;
    }

    setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
    if (shouldResetDisplay) {
      setShouldResetDisplay(false);
    }
  }

  /* 操作符按钮 - 优化性能处理 */
  const handleOperatorPress = (op: string) => {
    if (firstOperand !== null && operator && !shouldResetDisplay) {
      const currentResult = calculate(
        firstOperand,
        parseFloat(amount),
        operator
      );
      setFirstOperand(currentResult);
      setAmount(String(currentResult));
    } else {
      setFirstOperand(parseFloat(amount));
    }
    setOperator(op);
    setShouldResetDisplay(true);
  }

  /* 计算结果 - 优化性能处理 */
  const handleCalculate = () => {
    if (firstOperand === null || operator === null || shouldResetDisplay)
      return;
    const result = calculate(firstOperand, parseFloat(amount), operator);
    setAmount(String(result.toFixed(2)));
    setFirstOperand(null);
    setOperator(null);
    setShouldResetDisplay(true);
  }

  /* 完成操作 - 优化性能处理 */
  const handleDone = () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      onOpenChange(false);
      return;
    }
    onSubmit(numericAmount);
    onOpenChange(false);
  }

  /* 金额显示字体大小自动调整 */
  const getFontSize = useCallback((text: string) => {
    if (text.length > 15) return "$5";
    if (text.length > 10) return "$6";
    return "$7";
  }, []);

  /* 预计算显示文本，减少渲染时计算 */
  const displayString = useMemo(() => {
    if (operator && firstOperand !== null) {
      if (shouldResetDisplay) return `${firstOperand} ${operator}`;
      return `${firstOperand} ${operator} ${amount}`;
    }
    return amount;
  }, [amount, firstOperand, operator, shouldResetDisplay]);


  /* 预计算完成按钮内容 */
  const doneButtonContent = useMemo(() => {
    if (operator && !shouldResetDisplay) {
      return <EqualIcon size={24} color="white" />;
    }
    return (
      <Text color="white" fontWeight="bold">
        {t("Done")}
      </Text>
    );
  }, [operator, shouldResetDisplay, t]);

  return (<Sheet
    modal
    open={open}
    onOpenChange={onOpenChange}
    snapPoints={[45]}
    dismissOnSnapToBottom
  >
    <Sheet.Overlay />
    <Sheet.Handle />
    <Sheet.Frame bg="$background" padding="$4">
      <YStack gap="$3">
        <YStack paddingVertical="$2">
          <Text
            fontSize={getFontSize(displayString)}
            fontWeight="700"
            textAlign="right"
          >
            {displayString}
          </Text>
        </YStack>
        <XStack p="$2" gap="$2">
          {/* 数字区 */}
          <YStack flex={3} gap="$2">
            {/* 第一行 */}
            <XStack gap="$2">
              <Button flex={1} size="$5" onTouchStart={() => handleKeypadPress("1")}>
                <Text fontSize="$6">1</Text>
              </Button>
              <Button flex={1} size="$5" onTouchStart={() => handleKeypadPress("2")}>
                <Text fontSize="$6">2</Text>
              </Button>
              <Button flex={1} size="$5" onTouchStart={() => handleKeypadPress("3")}>
                <Text fontSize="$6">3</Text>
              </Button>
            </XStack>

            {/* 第二行 */}
            <XStack gap="$2">
              <Button flex={1} size="$5" onTouchStart={() => handleKeypadPress("4")}>
                <Text fontSize="$6">4</Text>
              </Button>
              <Button flex={1} size="$5" onTouchStart={() => handleKeypadPress("5")}>
                <Text fontSize="$6">5</Text>
              </Button>
              <Button flex={1} size="$5" onTouchStart={() => handleKeypadPress("6")}>
                <Text fontSize="$6">6</Text>
              </Button>
            </XStack>

            {/* 第三行 */}
            <XStack gap="$2">
              <Button flex={1} size="$5" onTouchStart={() => handleKeypadPress("7")}>
                <Text fontSize="$6">7</Text>
              </Button>
              <Button flex={1} size="$5" onTouchStart={() => handleKeypadPress("8")}>
                <Text fontSize="$6">8</Text>
              </Button>
              <Button flex={1} size="$5" onTouchStart={() => handleKeypadPress("9")}>
                <Text fontSize="$6">9</Text>
              </Button>
            </XStack>
            <XStack gap="$2">
              <Button flex={1} size="$5" onTouchStart={() => handleKeypadPress(".")}>
                <Text fontSize="$6">.</Text>
              </Button>
              <Button flex={1} size="$5" onTouchStart={() => handleKeypadPress("0")}>
                <Text fontSize="$6">0</Text>
              </Button>
              <Button
                flex={1}
                size="$5"
                onTouchStart={handleDeletePress}
                icon={<DeleteIcon size={24} color="#333" />}
              />
            </XStack>
          </YStack>
          {/* 功能区 */}
          <YStack flex={1} gap="$2">
            <Button
              flex={1}
              size="$5"
              icon={<PlusIcon size={24} color="#333" />}
              onTouchStart={() => handleOperatorPress("+")}
            />
            <Button
              flex={1}
              size="$5"
              icon={<MinusIcon size={24} color="#333" />}
              onTouchStart={() => handleOperatorPress("-")}
            />

            <Button
              flex={1}
              size="$5"
              padding="$0"
              onTouchStart={() => onOpenChange(false)}
            >
              <Text>{t("Cancel")}</Text>
            </Button>
            <Button
              flex={1}
              size="$5"
              theme="active"
              backgroundColor="$blue10"
              padding="$0"
              onTouchStart={
                operator && !shouldResetDisplay ? handleCalculate : handleDone
              }
            >
              {doneButtonContent}
            </Button>
          </YStack>
        </XStack>
      </YStack>
    </Sheet.Frame>
  </Sheet>)
};

// Memoize to prevent unnecessary re-renders when parent state changes
export default React.memo(AmountInputSheet);
