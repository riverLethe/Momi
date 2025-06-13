import { Bill } from "@/types/bills.types";
import React, { useMemo } from "react";
import { Card, YStack, Separator } from "tamagui";
import { BillListItem } from "../bills/BillListItem";
import { useData } from "@/providers/DataProvider";

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
      backgroundColor="white"
    >
      <YStack paddingVertical="$2">
        {bills.map((bill, index) => {
          const isDeleted = !existingBillIds.has(bill.id);

          return (
            <React.Fragment key={bill.id}>
              <BillListItem item={bill} disabled={isDeleted} />
              {index < bills.length - 1 && (
                <Separator marginVertical="$2" borderColor="$gray3" />
              )}
            </React.Fragment>
          );
        })}
      </YStack>
    </Card>
  );
};
