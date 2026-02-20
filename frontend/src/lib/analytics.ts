import { getAPIBaseURL } from '@/lib/config';

/** Report current page view for admin metrics (no auth required). */
export function reportPageView(path: string): void {
  const base = getAPIBaseURL();
  if (!path || !base) return;
  fetch(`${base}/api/v1/analytics/page-view`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  }).catch(() => {});
}
