import { Bill } from "@/types/bills.types";
import React from "react";
import { Card, YStack, Separator } from "tamagui";
import { BillListItem } from "../bills/BillListItem";

interface ExpenseListProps {
  bills: Bill[];
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ bills }) => {
  return (
    <Card
      marginBottom="$3"
      borderRadius="$4"
      overflow="hidden"
      elevation={0.5}
      backgroundColor="white"
    >
      <YStack paddingVertical="$2">
        {bills.map((bill, index) => (
          <React.Fragment key={bill.id}>
            <BillListItem item={bill} />
            {index < bills.length - 1 && (
              <Separator marginVertical="$2" borderColor="$gray3" />
            )}
          </React.Fragment>
        ))}
      </YStack>
    </Card>
  );
};
