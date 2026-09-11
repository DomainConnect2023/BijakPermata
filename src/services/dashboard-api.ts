import { apiGet } from "@/services/api-client";
import { type DataRiskItem, formatDateParam } from "@/services/report-api";

export type BalanceChartItem = {
  label: string;
  value: number;
};

export type ProfitChartItem = {
  label: string;
  value: number;
};

export type DashboardData = {
  newCustomerCount: number;
  // TODO(backend): /Api/Dashboard, /Api/DashboardByMonth and
  // /Api/DashboardByYear don't return this yet — confirm the field name
  // with backend and wire it up once it's added. Defaults to 0 until then.
  // Existing customers is derived on our side as totalCustomerCount minus
  // newCustomerCount (e.g. 100 total, 10 new -> 90 existing) — see
  // `existingCustomerCount` in dashboard-screen.tsx.
  totalCustomerCount?: number;
  totalSalesRM: number;
  totalBuyRM: number;
  totalGrossProfit: number;
  transactionCount: number;
  balanceChart: BalanceChartItem[];
  profitChart: ProfitChartItem[];
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
