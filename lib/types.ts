/** Kiểu dữ liệu dùng chung, phản chiếu hình dạng API của so-no-be. */

/** `single` = thêm lẻ một ngày, `range` = sinh ra từ khoảng ngày. */
export type EntryType = 'single' | 'range';

export type DebtorSummary = {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  accessCode: string;
  active: boolean;
  createdAt: string;
  archivedAt: string | null;
  unsettled: number;
  settled: number;
  lastSettledAt: string | null;
  entryCount: number;
};

export type EntryJson = {
  id: string;
  date: string;
  category: string;
  /** Tổng của khoản = unitAmount × quantity. */
  amount: number;
  /** Đơn giá nhập vào (×1). */
  unitAmount: number;
  /** Số lượng (≥ 1). */
  quantity: number;
  /** Nguồn tạo khoản. */
  entryType: EntryType;
  /** Ngày bắt đầu của khoảng (null nếu khoản một ngày). */
  startDate: string | null;
  /** Ngày kết thúc của khoảng (null nếu khoản một ngày). */
  endDate: string | null;
  note: string;
  editable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SettlementJson = {
  id: string;
  periodStart: string | null;
  periodEnd: string;
  amount: number;
  entryCount: number;
  status: 'active' | 'void';
  voidReason: string | null;
  createdAt: string;
  voidedAt: string | null;
};

export type LedgerTotals = {
  unsettled: number;
  settled: number;
  monthTotal: number;
  unsettledCount: number;
  settlePreview: number;
  settlePreviewCount: number;
};

export type DayGroup = {
  date: string;
  total: number;
  count: number;
  entries: EntryJson[];
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalGroups: number;
  totalPages: number;
};

export type LedgerResponse = {
  debtor: DebtorSummary;
  today: string;
  watermark: string | null;
  latestSettlement: SettlementJson | null;
  totals: LedgerTotals;
  entries: EntryJson[];
  groups: DayGroup[];
  settlements: SettlementJson[];
  month: string | null;
  status: 'unsettled' | 'settled' | 'all';
  from: string | null;
  to: string | null;
  pagination: PaginationMeta;
  categories: string[];
};

export type PublicEntry = {
  id: string;
  date: string;
  category: string;
  amount: number;
  unitAmount: number;
  quantity: number;
  entryType: EntryType;
  startDate: string | null;
  endDate: string | null;
  note: string;
};

export type PublicLedgerResponse = {
  name: string;
  today: string;
  watermark: string | null;
  latestSettlement: { periodEnd: string; amount: number } | null;
  totals: { unsettled: number; unsettledCount: number; settled: number; monthTotal: number };
  entries: PublicEntry[];
  groups: { date: string; total: number; count: number; entries: PublicEntry[] }[];
  settlements: { id: string; periodStart: string | null; periodEnd: string; amount: number; entryCount: number; createdAt: string }[];
  month: string | null;
  status: 'unsettled' | 'settled' | 'all';
  from: string | null;
  to: string | null;
  pagination: PaginationMeta;
};

export type SettlePreview = {
  ok: boolean;
  periodStart: string | null;
  periodEnd: string;
  amount: number;
  entryCount: number;
  dayCount: number;
  code?: string;
  message?: string;
};

export type ApiErrorShape = {
  error?: { code?: string; message?: string; [key: string]: unknown };
};
