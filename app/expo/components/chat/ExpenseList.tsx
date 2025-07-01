import React, { useMemo } from "react";
import { Card, Separator, YStack } from "tamagui";
import { Bill } from "@/types/bills.types";
import { useData } from "@/providers/DataProvider";
import { BillListItem } from "@/components/bills/BillListItem";

interface ExpenseListProps {
  bills: Bill[];
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ bills }) => {
  // Get current (non-deleted) bills from data context
  const { bills: existingBills } = useData();

  const existingBillIds = useMemo(
    () => new Set(existingBills.map((b) => b.id)),
    [existingBills]
  );

  return (
    <Card
      marginBottom="$3"
      borderRadius="$4"
      overflow="hidden"
      elevation={0.5}
      backgroundColor="$card"
    >
      <YStack paddingVertical="$2">
        {bills.map((bill, index) => {
          const isDeleted = !existingBillIds.has(bill.id);

          return (
            <React.Fragment key={bill.id}>
              <BillListItem item={bill} disabled={isDeleted} />
              {index < bills.length - 1 && (
                <Separator marginVertical="$2" borderColor="$borderColor" />
              )}
            </React.Fragment>
          );
        })}
      </YStack>
    </Card>
  );
};
