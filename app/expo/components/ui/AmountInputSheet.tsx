import React, { useState, useEffect } from "react";
// import { Platform } from "react-native";
import { Sheet, YStack, XStack, Button, Text, Paragraph } from "tamagui";
import {
  Delete as DeleteIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Equal as EqualIcon,
  X as CloseIcon,
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

  /* 计算逻辑 */
  const calculate = (first: number, second: number, op: string): number => {
    switch (op) {
      case "+":
        return first + second;
      case "-":
        return first - second;
      default:
        return second;
    }
  };

  /* 键盘点击 */
  const handleKeypadPress = (key: string) => {
    if (amount.length >= 8 && !shouldResetDisplay) return;

    if (shouldResetDisplay) {
      setAmount(key === "." ? "0." : key);
      setShouldResetDisplay(false);
      return;
    }

    if (key === ".") {
      if (!amount.includes(".")) setAmount(amount + ".");
      return;
    }

    if (amount.includes(".") && amount.split(".")[1].length >= 2) return;
    if (amount === "0") setAmount(key);
    else setAmount(amount + key);
  };

  const handleDeletePress = () => {
    if (shouldResetDisplay && operator) {
      setOperator(null);
      setShouldResetDisplay(false);
      return;
    }

    if (operator && !shouldResetDisplay) {
      if (amount.length > 1) {
        setAmount(amount.slice(0, -1));
      } else {
        setShouldResetDisplay(true);
        if (firstOperand !== null) {
          setAmount(String(firstOperand));
        }
      }
      return;
    }

    setAmount(amount.length > 1 ? amount.slice(0, -1) : "0");
    if (shouldResetDisplay) {
      setShouldResetDisplay(false);
    }
  };

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
  };

  const handleCalculate = () => {
    if (firstOperand === null || operator === null || shouldResetDisplay)
      return;
    const result = calculate(firstOperand, parseFloat(amount), operator);
    setAmount(String(result.toFixed(2)));
    setFirstOperand(null);
    setOperator(null);
    setShouldResetDisplay(true);
  };

  const handleDone = () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      onOpenChange(false);
      return;
    }
    onSubmit(numericAmount);
    onOpenChange(false);
  };

  /* 金额显示字体大小自动调整 */
  const getFontSize = (text: string) => {
    if (text.length > 15) return "$5";
    if (text.length > 10) return "$6";
    return "$7";
  };

  const displayString = () => {
    if (operator && firstOperand !== null) {
      if (shouldResetDisplay) return `${firstOperand} ${operator}`;
      return `${firstOperand} ${operator} ${amount}`;
    }
    return amount;
  };

  /* 渲染键盘 */
  const renderKeypad = () => (
    <XStack p="$2" gap="$2">
      {/* 数字区 */}
      <YStack flex={3} gap="$2">
        {[
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
        ].map((row) => (
          <XStack key={row.join("-")} gap="$2">
            {row.map((key) => (
              <Button
                key={key}
                flex={1}
                size="$5"
                onPress={() => handleKeypadPress(key)}
              >
                <Text fontSize="$6">{key}</Text>
              </Button>
            ))}
          </XStack>
        ))}
        <XStack gap="$2">
          <Button flex={1} size="$5" onPress={() => handleKeypadPress(".")}>
            <Text fontSize="$6">.</Text>
          </Button>
          <Button flex={1} size="$5" onPress={() => handleKeypadPress("0")}>
            <Text fontSize="$6">0</Text>
          </Button>
          <Button
            flex={1}
            size="$5"
            onPress={handleDeletePress}
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
          onPress={() => handleOperatorPress("+")}
        />
        <Button
          flex={1}
          size="$5"
          icon={<MinusIcon size={24} color="#333" />}
          onPress={() => handleOperatorPress("-")}
        />

    <Button
          flex={1}
          size="$5"
          padding="$0"
          onPress={
           ()=>{
            onOpenChange(false)
           }
          }
        >
          <Text >
              {t("Cancel")}
            </Text>
        </Button>
        <Button
          flex={1}
          size="$5"
          theme="active"
          backgroundColor="$blue10"
          padding="$0"
          onPress={
            operator && !shouldResetDisplay ? handleCalculate : handleDone
          }
        >
          {operator && !shouldResetDisplay ? (
            <EqualIcon size={24} color="white" />
          ) : (
            <Text color="white" fontWeight="bold">
              {t("Done")}
            </Text>
          )}
        </Button>
      </YStack>
    </XStack>
  );

  return (
    <Sheet
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
              fontSize={getFontSize(displayString())}
              fontWeight="700"
              textAlign="right"
            >
              {displayString()}
            </Text>
          </YStack>
          {renderKeypad()}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};

export default AmountInputSheet;
