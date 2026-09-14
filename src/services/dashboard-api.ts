import { apiGet } from "@/services/api-client";
import { type DataRiskItem, formatDateParam } from "@/services/report-api";

export type BalanceChartItem = {
  label: string;
  value: number;
};

export type ProfitChartItem = {
  label: string;
  // Net profit = margin - expenses (matches the backend's
  // sp_NetProfit_Yearly definition).
  value: number;
  // Margin = SUM(SALE_RM - SALE_COST), before subtracting expenses.
  margin: number;
};

export type DashboardData = {
  newCustomerCount: number;
  // Distinct customers who transacted within the selected period and
  // weren't new in that same period (i.e. registered before it started) —
  // "returning" customers, computed server-side.
  existingCustomerCount: number;
  totalSalesRM: number;
  totalBuyRM: number;
  totalGrossProfit: number;
  transactionCount: number;
  balanceChart: BalanceChartItem[];
  profitChart: ProfitChartItem[];
  // DashboardByMonth only — same calendar month, previous year, for the
  // "Profit Comparison" card. undefined for the daily/yearly dashboard.
  lastYearSameMonth?: ProfitChartItem;
  dataRiskChart: DataRiskItem[];
};

export async function fetchDashboard(date: Date): Promise<DashboardData> {
  return apiGet<DashboardData>(`/Api/Dashboard?date=${formatDateParam(date)}`);
}

export async function fetchDashboardByMonth(
  year: number,
  month: number,
): Promise<DashboardData> {
  return apiGet<DashboardData>(
    `/Api/DashboardByMonth?year=${year}&month=${month}`,
  );
}

export async function fetchDashboardByYear(
  year: number,
): Promise<DashboardData> {
  return apiGet<DashboardData>(`/Api/DashboardByYear?year=${year}`);
}
