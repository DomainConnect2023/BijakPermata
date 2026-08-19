import { apiGet, getIPAddress } from "@/services/api-client";

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
): Promise<DailyBalanceItem[]> {
  let response: Response;
  try {
    const baseUrl = await getIPAddress();
    response = await fetch(
      `${baseUrl}/Report/GetDailyBalance?date=${formatDateParam(date)}`,
      { headers: { "Content-Type": "application/json" } },
    );
  } catch {
    throw new Error("Unable to connect to the server. Please try again.");
  }

  if (!response.ok) {
    throw new Error("Failed to load daily balance report");
  }

  const result: DailyBalanceResponse = await response.json();
  return result.data;
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
): Promise<MarginProfitItem[]> {
  // The backend's `dateTo`/`dateFrom` query params are swapped relative to
  // their names: `dateTo` is actually the range start and `dateFrom` the
  // range end (see ReportController.GetMarginProfit).
  const params = new URLSearchParams({
    dateTo: formatDateParam(fromDate),
    dateFrom: formatDateParam(toDate),
  });

  let response: Response;
  try {
    const baseUrl = await getIPAddress();
    response = await fetch(
      `${baseUrl}/Report/GetMarginProfit?${params.toString()}`,
      { headers: { "Content-Type": "application/json" } },
    );
  } catch {
    throw new Error("Unable to connect to the server. Please try again.");
  }

  if (!response.ok) {
    throw new Error("Failed to load margin report");
  }

  const result: MarginProfitResponse = await response.json();
  return result.data;
}

export async function fetchCurrencyList(): Promise<string[]> {
  const result = await apiGet<{ code: string }[]>("/Report/GetCurrency");
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
): Promise<DetailTransactionItem[]> {
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
    status,
  });
  if (currency) params.set("currency", currency);

  let response: Response;
  try {
    const baseUrl = await getIPAddress();
    response = await fetch(
      `${baseUrl}/Report/GetDetailTransaction?${params.toString()}`,
      { headers: { "Content-Type": "application/json" } },
    );
  } catch {
    throw new Error("Unable to connect to the server. Please try again.");
  }

  if (!response.ok) {
    throw new Error("Failed to load detail transaction report");
  }

  const result: DetailTransactionResponse = await response.json();
  return result.data;
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
  items: PurchaseSalesTransactionItem[];
};

export type PurchaseSalesStatus = "B" | "S";

type PurchaseSalesResponse = {
  startDate: string;
  endDate: string;
  status: PurchaseSalesStatus;
  data: PurchaseSalesGroup[];
};

export async function fetchPurchaseSales(
  startDate: Date,
  endDate: Date,
  status: PurchaseSalesStatus,
): Promise<PurchaseSalesGroup[]> {
  const params = new URLSearchParams({
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
    status,
  });

  let response: Response;
  try {
    const baseUrl = await getIPAddress();
    response = await fetch(
      `${baseUrl}/Report/GetPurchaseSales?${params.toString()}`,
      { headers: { "Content-Type": "application/json" } },
    );
  } catch {
    throw new Error("Unable to connect to the server. Please try again.");
  }

  if (!response.ok) {
    throw new Error("Failed to load purchase report");
  }

  const result: PurchaseSalesResponse = await response.json();
  return result.data;
}
