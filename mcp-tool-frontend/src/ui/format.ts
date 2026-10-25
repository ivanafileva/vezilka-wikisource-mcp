import type { SearchStatus } from '../api/types/searchRun.ts';
import type { DonationStatus } from '../api/types/donation.ts';

// Formatted by hand: not every browser ships the Macedonian locale data, and
// toLocaleString('mk-MK') silently falls back to US formats there.
const two = (n: number) => String(n).padStart(2, '0');

/** Date and time in Macedonian format, e.g. "28.09.2026, 09:43". */
export const formatDateTime = (value: string | number | Date) => {
  const d = new Date(value);
  return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}, ${two(d.getHours())}:${two(d.getMinutes())}`;
};

/** Whole numbers with a dot as the thousands separator, e.g. "1.565". */
export const formatNumber = (value: number) => String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** "1 текст", "5 текстови". */
export const plural = (n: number, one: string, many: string) => `${formatNumber(n)} ${n === 1 ? one : many}`;

export const words = (n: number) => plural(n, 'збор', 'зборови');
export const texts = (n: number) => plural(n, 'текст', 'текстови');

export const searchStatusLabel: Record<SearchStatus, string> = {
  PENDING: 'Во чекање',
  RUNNING: 'Во тек',
  COMPLETED: 'Завршено',
  FAILED: 'Неуспешно'
};

export const donationStatusLabel: Record<DonationStatus, string> = {
  DRAFT: 'Нацрт',
  APPROVED: 'Одобрен',
  SUBMITTED: 'Испратен',
  ACCEPTED: 'Прифатен',
  REJECTED: 'Одбиен',
  FAILED: 'Неуспешен'
};
