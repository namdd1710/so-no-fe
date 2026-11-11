/** Định dạng tiền & ngày (BRIEF §7) — VND nguyên, ngày không dùng Date. */

const numberFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/** 1250000 → "1.250.000" */
export function formatVnd(amount: number): string {
  return numberFormatter.format(amount);
}

/** 1250000 → "1.250.000₫" */
export function formatVndSuffix(amount: number): string {
  return `${numberFormatter.format(amount)}₫`;
}

/** "2026-11-10" → "10/11/2026" (không đi qua Date để khỏi lệch múi giờ) */
export function formatDateVn(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parts = isoDate.slice(0, 10).split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/** "2026-11-10" → "Thứ Ba" (dùng UTC để không lệch ngày). */
export function weekdayVn(isoDate: string): string {
  const names = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return '';
  return names[date.getUTCDay()] ?? '';
}

/** "2026-11" → "tháng 11/2026" */
export function formatMonthVn(month: string | null | undefined): string {
  if (!month) return 'Tất cả';
  const [year, m] = month.split('-');
  return `tháng ${Number(m)}/${year}`;
}

/** "2026-11-10T08:00:00.000Z" → "10/11/2026 15:00" (giờ VN) */
export function formatDateTimeVn(isoDateTime: string | null | undefined): string {
  if (!isoDateTime) return '—';
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return '—';
  const time = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return time;
}

/** Hôm nay theo Asia/Ho_Chi_Minh (YYYY-MM-DD). */
export function todayVn(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Thêm 1 ngày vào chuỗi YYYY-MM-DD (dùng UTC nội bộ cho an toàn). */
export function nextDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** Số ngày giữa hai mốc (bao gồm cả hai đầu). */
export function daysBetween(from: string | null, to: string): number {
  const start = new Date(`${from ?? '1970-01-01'}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

/** Chuẩn hoá chuỗi tiền người dùng gõ: "1.250.000" → "1250000". */
export function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/** "1250000" → "1.250.000" (để hiển thị lại khi blur). */
export function formatDigits(digits: string): string {
  if (!digits) return '';
  return numberFormatter.format(Number(digits));
}
