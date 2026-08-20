import { apiGet } from "@/services/api-client";
import { formatDateParam } from "@/services/report-api";

export type BalanceChartItem = {
  label: string;
  value: number;
};

export type MonthlyProfitChartItem = {
  month: string;
  profit: number;
};

export type DashboardData = {
  newCustomerCount: number;
  totalSalesRM: number;
  totalBuyRM: number;
  totalGrossProfit: number;
  transactionCount: number;
  balanceChart: BalanceChartItem[];
  monthlyProfitChart: MonthlyProfitChartItem[];
};

export async function fetchDashboard(date: Date): Promise<DashboardData> {
  return apiGet<DashboardData>(`/Api/Dashboard?date=${formatDateParam(date)}`);
}
