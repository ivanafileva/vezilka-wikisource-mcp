import { isAxiosError } from 'axios';

const CYRILLIC = /[Ѐ-ӿ]/;

/**
 * The message to show for a failed request: the backend's ApiError `message`
 * when it is in Macedonian, otherwise the Macedonian fallback. Anything else
 * (a network error, a framework default in English) goes to the console for
 * debugging instead of being shown to the user.
 */
export const errorMessage = (err: unknown, fallback: string): string => {
  const detail = isAxiosError<{ message?: string }>(err)
    ? err.response?.data?.message ?? err.message
    : err instanceof Error ? err.message : undefined;
  if (detail && CYRILLIC.test(detail)) {
    return detail;
  }
  if (detail) {
    console.warn(`${fallback} (${detail})`);
  }
  return fallback;
};
