import type { Ionicons } from "@expo/vector-icons";

export type ReportMenuItem = {
  name: string;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  activeIcon?: React.ComponentProps<typeof Ionicons>["name"];
};

// The 7 report categories shown in the drawer menu and in the "Report"
// picker page (see `/report-menu`). Kept in one place so both stay in sync.
export const REPORT_ITEMS: ReportMenuItem[] = [
  {
    name: "purchasing",
    title: "Purchasing",
    icon: "cart-outline",
    activeIcon: "cart",
  },
  {
    name: "sales",
    title: "Sales",
    icon: "trending-up-outline",
    activeIcon: "trending-up",
  },
  {
    name: "margin",
    title: "Margin",
    icon: "analytics-outline",
    activeIcon: "analytics",
  },
  {
    name: "daily",
    title: "Daily",
    icon: "calendar-outline",
    activeIcon: "calendar",
  },
  {
    name: "finance",
    title: "Expenses",
    icon: "wallet-outline",
    activeIcon: "wallet",
  },
  {
    name: "transaction",
    title: "Transaction",
    icon: "swap-horizontal-outline",
    activeIcon: "swap-horizontal",
  },
  {
    name: "risk",
    title: "Data Risk",
    icon: "warning-outline",
    activeIcon: "warning",
  },
];
