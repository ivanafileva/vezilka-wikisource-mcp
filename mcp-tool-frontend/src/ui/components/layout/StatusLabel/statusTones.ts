import type { SearchStatus } from '../../../../api/types/searchRun.ts';
import type { DonationStatus } from '../../../../api/types/donation.ts';
import type { StatusTone } from './StatusLabel.tsx';

export const searchStatusTone: Record<SearchStatus, StatusTone> = {
  PENDING: 'default',
  RUNNING: 'info',
  COMPLETED: 'success',
  FAILED: 'error'
};

export const donationStatusTone: Record<DonationStatus, StatusTone> = {
  DRAFT: 'default',
  APPROVED: 'info',
  SUBMITTED: 'primary',
  ACCEPTED: 'success',
  REJECTED: 'error',
  FAILED: 'warning'
};
