import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { reportPageView } from '@/lib/analytics';

/** Reports the current path to the analytics endpoint on route change. */
export function PageViewTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    reportPageView(pathname);
  }, [pathname]);
  return null;
}
