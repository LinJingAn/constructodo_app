import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  userType: 'client' | 'professional';
  onLogout: () => void;
}

export function DashboardLayout({ children, userType, onLogout }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar userType={userType} onLogout={onLogout} />
      <main className={cn('flex-1 min-h-screen lg:ml-0 pt-16 lg:pt-0')}>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}