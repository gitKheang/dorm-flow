'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from './ui/AppLogo';
import {
  LayoutDashboard, BedDouble, Users, FileText, CreditCard,
  Wrench, ChevronLeft, ChevronRight, Settings, LogOut,
  BarChart3, UtensilsCrossed, Building2, Bell
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navGroups = [
  {
    label: 'Operations',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin-dashboard', badge: null },
      { icon: BedDouble, label: 'Rooms', href: '/room-management', badge: null },
      { icon: Users, label: 'Tenants', href: '/tenants', badge: '12' },
      { icon: FileText, label: 'Invoices', href: '/invoices', badge: '3' },
      { icon: CreditCard, label: 'Payments', href: '/payments', badge: null },
      { icon: Wrench, label: 'Maintenance', href: '/maintenance', badge: '5' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { icon: BarChart3, label: 'Reports', href: '/reports', badge: null },
      { icon: Building2, label: 'Multi-Dorm', href: '/reports', badge: null },
    ],
  },
  {
    label: 'Services',
    items: [
      { icon: UtensilsCrossed, label: 'Meal Plans', href: '/chef-dashboard', badge: null },
      { icon: Bell, label: 'Notifications', href: '/notifications', badge: '2' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col bg-white border-r border-[hsl(var(--border))] sidebar-transition overflow-hidden">
      {/* Header */}
      <div className={`flex items-center border-b border-[hsl(var(--border))] flex-shrink-0 ${collapsed ? 'px-4 py-4 justify-center' : 'px-4 py-4 gap-2'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AppLogo size={32} />
            <div className="min-w-0">
              <p className="font-semibold text-[15px] text-[hsl(var(--foreground))] truncate">DormFlow</p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">Sunrise Dorm</p>
            </div>
          </div>
        )}
        {collapsed && <AppLogo size={32} />}
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors flex-shrink-0"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={`group-${group.label}`}>
            {!collapsed && (
              <p className="text-[11px] font-500 tracking-wider text-[hsl(var(--muted-foreground))] uppercase px-3 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin-dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={`nav-${item.label}`}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-150 group relative
                      ${isActive
                        ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
                        : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="text-[11px] font-600 bg-[hsl(var(--primary))] text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center tabular-nums">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && item.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-[hsl(var(--border))] p-2 flex-shrink-0 ${collapsed ? '' : ''}`}>
        {collapsed ? (
          <>
            <button
              onClick={onToggleCollapse}
              className="w-full p-2.5 flex justify-center rounded-lg hover:bg-[hsl(var(--muted))] transition-colors mb-1"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={16} className="text-[hsl(var(--muted-foreground))]" />
            </button>
            <Link href="/sign-up-login-screen" className="w-full p-2.5 flex justify-center rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
              <LogOut size={16} className="text-[hsl(var(--muted-foreground))]" />
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[hsl(var(--foreground))] truncate">Admin User</p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">admin@dormflow.app</p>
              </div>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <Settings size={16} />
              <span>Settings</span>
            </Link>
            <Link
              href="/sign-up-login-screen"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}