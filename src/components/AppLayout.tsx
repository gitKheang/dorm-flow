'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { canAccessPath } from '@/lib/demoSession';
import Sidebar from './Sidebar';
import { useDemoSession } from './DemoSessionProvider';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isHydrated, session } = useDemoSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const accessState = useMemo(() => {
    if (!isHydrated) return 'loading';
    if (!session) return 'unauthenticated';
    if (!canAccessPath(pathname, session)) return 'unauthorized';
    return 'allowed';
  }, [isHydrated, pathname, session]);

  useEffect(() => {
    if (accessState === 'unauthenticated') {
      router.replace('/sign-up-login-screen');
      return;
    }

    if (accessState === 'unauthorized' && session) {
      router.replace(session.homePath);
    }
  }, [accessState, router, session]);

  if (accessState !== 'allowed' || !session) {
    const statusMessage =
      accessState === 'unauthenticated'
        ? 'Redirecting to sign in...'
        : accessState === 'unauthorized'
          ? 'Redirecting to your workspace...'
          : 'Loading your workspace...';

    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-6">
        <div className="w-full max-w-sm rounded-2xl border border-[hsl(var(--border))] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]" />
          <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">DormFlow</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{statusMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative z-50 h-full flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ width: sidebarCollapsed ? '64px' : '240px' }}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[hsl(var(--border))]">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
            aria-label="Open navigation"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
            </svg>
          </button>
          <div className="min-w-0">
            <span className="block font-semibold text-[hsl(var(--foreground))]">DormFlow</span>
            <span className="block truncate text-[11px] text-[hsl(var(--muted-foreground))]">{session.dormName}</span>
          </div>
        </div>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
