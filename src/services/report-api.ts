import { apiGet, getIPAddress, getReportData } from "@/services/api-client";

export type DataRiskType = "LOW" | "MED" | "AVE" | "HIGH";

export type DataRiskItem = {
  riskType: DataRiskType;
  total: number;
};

export async function fetchDataRisk(
  startDate: Date,
  endDate: Date,
  signal?: AbortSignal,
): Promise<DataRiskItem[]> {
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
  });
  return apiGet<DataRiskItem[]>(
    `/Report/GetDataRisk?${params.toString()}`,
    signal,
  );
}

export async function getDataRiskReportUrl(
  startDate: Date,
  endDate: Date,
): Promise<string> {
  const baseUrl = await getIPAddress();
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
  });
  return `${baseUrl}/Report/GetDataRiskReport?${params.toString()}`;
}

export type DailyBalanceItem = {
  currency: string;
  balance: number;
  in: number;
  out: number;
  adjustment: number;
  expense: number;
  rm: number;
  rate: number;
  closingBalance: number;
};

type DailyBalanceResponse = {
  date: string;
  data: DailyBalanceItem[];
};

export function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateParam(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export async function fetchDailyBalance(
  date: Date,
  signal?: AbortSignal,
): Promise<DailyBalanceItem[]> {
  return getReportData<DailyBalanceResponse["data"]>(
    `/Report/GetDailyBalance?date=${formatDateParam(date)}`,
    "Failed to load daily balance report",
    signal,
  );
}

// Printable HTML report page — opened directly in the device's browser via
// Linking.openURL, so exporting/printing/sharing needs no native module.
export async function getDailyBalanceReportUrl(date: Date): Promise<string> {
  const baseUrl = await getIPAddress();
  return `${baseUrl}/Report/GetDailyBalanceReport?date=${formatDateParam(date)}`;
}

export type DailyStockItem = {
  currency: string;
  ob: number;
  obRM: number;
  buy: number;
  buyRM: number;
  sale: number;
  saleRM: number;
  saleCost: number;
  balance: number;
  balRM: number;
};

type DailyStockResponse = {
  date: string;
  data: DailyStockItem[];
};

export async function fetchDailyStock(
  date: Date,
  signal?: AbortSignal,
): Promise<DailyStockItem[]> {
  return getReportData<DailyStockResponse["data"]>(
    `/Report/GetDailyStock?date=${formatDateParam(date)}`,
    "Failed to load daily stock report",
    signal,
  );
}

export async function getDailyStockReportUrl(date: Date): Promise<string> {
  const baseUrl = await getIPAddress();
  return `${baseUrl}/Report/GetDailyStockReport?date=${formatDateParam(date)}`;
}

export type MarginProfitItem = {
  currency: string;
  ob: number;
  obrm: number;
  buy: number;
  buyRM: number;
  sale: number;
  saleRM: number;
  saleCost: number;
  balance: number;
  balanceRM: number;
  profit: number;
  marginPercent: number;
};

type MarginProfitResponse = {
  dateTo: string;
  dateFrom: string;
  data: MarginProfitItem[];
};

export async function fetchMarginProfit(
  fromDate: Date,
  toDate: Date,
  signal?: AbortSignal,
): Promise<MarginProfitItem[]> {
  // The backend's `dateTo`/`dateFrom` query params are swapped relative to
  // their names: `dateTo` is actually the range start and `dateFrom` the
  // range end (see ReportController.GetMarginProfit).
  const params = new URLSearchParams({
    dateTo: formatDateParam(fromDate),
    dateFrom: formatDateParam(toDate),
  });

  return getReportData<MarginProfitResponse["data"]>(
    `/Report/GetMarginProfit?${params.toString()}`,
    "Failed to load margin report",
    signal,
  );
}

export async function getMarginProfitReportUrl(
  fromDate: Date,
  toDate: Date,
): Promise<string> {
  const baseUrl = await getIPAddress();
  // Same dateTo/dateFrom swap as fetchMarginProfit — see the comment there.
  const params = new URLSearchParams({
    dateTo: formatDateParam(fromDate),
    dateFrom: formatDateParam(toDate),
  });
  return `${baseUrl}/Report/GetMarginProfitReport?${params.toString()}`;
}

export async function fetchCurrencyList(
  signal?: AbortSignal,
): Promise<string[]> {
  const result = await apiGet<{ code: string }[]>(
    "/Report/GetCurrency",
    signal,
  );
  return result.map((item) => item.code);
}

export type DetailTransactionItem = {
  receiptNo: string;
  date: string;
  time: string;
  currency: string;
  fcAmount: number;
  rate: number;
  rm: number;
  bank: string | null;
  accode: string | null;
  customer: string | null;
  icNo: string | null;
  user: string;
  status: string;
  pcCode: string;
  tType: string;
  sFund: string | null;
  tPurpose: string | null;
  tsFund: string | null;
  dob: string | null;
  add1: string | null;
  add2: string | null;
  add3: string | null;
  sFundName: string | null;
  position: string | null;
  nationality: string | null;
};

export type DetailTransactionStatus = "ALL" | "B" | "S";

type DetailTransactionResponse = {
  startDate: string;
  endDate: string;
  currency: string | null;
  status: DetailTransactionStatus;
  total: number;
  data: DetailTransactionItem[];
};

export async function fetchDetailTransactions(
  startDate: Date,
  endDate: Date,
  currency: string | null,
  status: DetailTransactionStatus = "ALL",
  signal?: AbortSignal,
): Promise<DetailTransactionItem[]> {
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
    status,
  });
  if (currency) params.set("currency", currency);

  return getReportData<DetailTransactionResponse["data"]>(
    `/Report/GetDetailTransaction?${params.toString()}`,
    "Failed to load detail transaction report",
    signal,
  );
}

export async function getDetailTransactionReportUrl(
  startDate: Date,
  endDate: Date,
  currency: string | null,
  status: DetailTransactionStatus = "ALL",
): Promise<string> {
  const baseUrl = await getIPAddress();
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
    status,
  });
  if (currency) params.set("currency", currency);
  return `${baseUrl}/Report/GetDetailTransactionReport?${params.toString()}`;
}

export type PurchaseSalesTransactionItem = {
  receiptNo: string;
  date: string;
  currency: string;
  fcAmount: number;
  rate: number;
  rm: number;
  bank: string | null;
  customer: string | null;
  icNo: string | null;
  pcCode: string;
  status: string;
};

export type PurchaseSalesGroup = {
  currency: string;
  totalFCAmount: number;
  totalFCAmountRM: number;
  items: PurchaseSalesTransactionItem[];
};

export type PurchaseSalesStatus = "B" | "S";

type PurchaseSalesResponse = {
  startDate: string;
  endDate: string;
  status: PurchaseSalesStatus;
  data: PurchaseSalesGroup[];
};

export type CancelledTransactionItem = {
  receiptNo: string;
  date: string;
  time: string;
  currency: string;
  fcAmount: number;
  rate: number;
  rm: number;
  customer: string | null;
  icNo: string | null;
  pcCode: string;
  user: string;
  remarks: string | null;
  remCancel: string | null;
};

type CancelledTransactionResponse = {
  startDate: string;
  endDate: string;
  data: CancelledTransactionItem[];
};

export async function fetchBuyCancel(
  startDate: Date,
  endDate: Date,
  signal?: AbortSignal,
): Promise<CancelledTransactionItem[]> {
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
  });

  return getReportData<CancelledTransactionResponse["data"]>(
    `/Report/GetBuyCancel?${params.toString()}`,
    "Failed to load buy cancel report",
    signal,
  );
}

export async function getBuyCancelReportUrl(
  startDate: Date,
  endDate: Date,
): Promise<string> {
  const baseUrl = await getIPAddress();
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
  });
  return `${baseUrl}/Report/GetBuyCancelReport?${params.toString()}`;
}

export async function fetchSaleCancel(
  startDate: Date,
  endDate: Date,
  signal?: AbortSignal,
): Promise<CancelledTransactionItem[]> {
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
  });

  return getReportData<CancelledTransactionResponse["data"]>(
    `/Report/GetSaleCancel?${params.toString()}`,
    "Failed to load sale cancel report",
    signal,
  );
}

export async function getSaleCancelReportUrl(
  startDate: Date,
  endDate: Date,
): Promise<string> {
  const baseUrl = await getIPAddress();
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
  });
  return `${baseUrl}/Report/GetSaleCancelReport?${params.toString()}`;
}

export type ExpensesListingItem = {
  refNo: string;
  date: string;
  glCode: string | null;
  description: string | null;
  receipt: string | null;
  rm: number;
};

type ExpensesListingResponse = {
  startDate: string;
  endDate: string;
  data: ExpensesListingItem[];
};

export async function fetchExpensesListing(
  startDate: Date,
  endDate: Date,
  glCode?: string | null,
  signal?: AbortSignal,
): Promise<ExpensesListingItem[]> {
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
  });
  if (glCode) params.set("glCode", glCode);

  return getReportData<ExpensesListingResponse["data"]>(
    `/Report/GetExpensesListing?${params.toString()}`,
    "Failed to load expenses listing report",
    signal,
  );
}

export async function getExpensesListingReportUrl(
  startDate: Date,
  endDate: Date,
  glCode?: string | null,
): Promise<string> {
  const baseUrl = await getIPAddress();
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
  });
  if (glCode) params.set("glCode", glCode);
  return `${baseUrl}/Report/GetExpensesListingReport?${params.toString()}`;
}

export type GLCodeItem = {
  glCode: string;
  description: string | null;
};

type GLCodeResponse = {
  data: GLCodeItem[];
};

export async function fetchExpensesGLCodes(
  signal?: AbortSignal,
): Promise<GLCodeItem[]> {
  return getReportData<GLCodeResponse["data"]>(
    `/Report/GetExpensesGLCode`,
    "Failed to load GL code list",
    signal,
  );
}

export async function fetchPurchaseSales(
  startDate: Date,
  endDate: Date,
  status: PurchaseSalesStatus,
  signal?: AbortSignal,
): Promise<PurchaseSalesGroup[]> {
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
    status,
  });

  return getReportData<PurchaseSalesResponse["data"]>(
    `/Report/GetPurchaseSales?${params.toString()}`,
    "Failed to load purchase report",
    signal,
  );
}

export async function getPurchaseSalesReportUrl(
  startDate: Date,
  endDate: Date,
  status: PurchaseSalesStatus,
): Promise<string> {
  const baseUrl = await getIPAddress();
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
    status,
  });
  return `${baseUrl}/Report/GetPurchaseSalesReport?${params.toString()}`;
}
