import { Bill } from "@/types/bills.types";

export interface BillDetailProps {
  bill: Bill;
  updating: boolean;
  onUpdateField: (field: keyof Bill, value: any) => Promise<void>;
}

export interface BillDetailHeaderProps {
  onBack: () => void;
  onDelete: () => void;
  updating: boolean;
  isReadOnly?: boolean; // 是否为只读状态
}

export interface BillAmountCardProps extends BillDetailProps {
  onOpenAmountSheet: () => void;
  locale: string;
}

export interface BillDetailsCardProps extends BillDetailProps {
  onOpenCategorySheet: () => void;
  onOpenDateSheet: () => void;
  locale: string;
}
