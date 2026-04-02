"use client";
import React, { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import AppLogo from "./ui/AppLogo";
import AppSelect from "./ui/AppSelect";
import {
  LayoutDashboard,
  BedDouble,
  Users,
  FileText,
  CreditCard,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  BarChart3,
  Building2,
  Bell,
  ChefHat,
  Lock,
} from "lucide-react";
import {
  getRoleLabel,
  isModuleAvailable,
  type DemoSession,
} from "@/lib/demoSession";
import { useDemoSession } from "./DemoSessionProvider";
import { useDemoWorkspace } from "./DemoWorkspaceProvider";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string | null;
  locked?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface AdminNavMetrics {
  peopleCount: number;
  invoiceCount: number;
  maintenanceCount: number;
  notificationCount: number;
}

function getNavGroups(session: DemoSession, adminMetrics: AdminNavMetrics) {
  const { role } = session;
  const hasNotifications = isModuleAvailable(session, "notifications");
  const hasMealService = isModuleAvailable(session, "mealService");
  const hasAnalytics = isModuleAvailable(session, "analytics");
  const hasMultiDorm = isModuleAvailable(session, "multiDorm");

  if (role === "Tenant") {
    const groups: NavGroup[] = [
      {
        label: "My Stay",
        items: [
          {
            icon: LayoutDashboard,
            label: "Dashboard",
            href: "/tenant-dashboard",
          },
          { icon: FileText, label: "My Invoices", href: "/invoices" },
          { icon: Wrench, label: "Maintenance", href: "/maintenance" },
        ],
      },
      {
        label: "Account",
        items: hasNotifications
          ? [
              {
                icon: Bell,
                label: "Notifications",
                href: "/notifications",
                badge:
                  adminMetrics.notificationCount > 0
                    ? String(adminMetrics.notificationCount)
                    : null,
              },
            ]
          : [],
      },
    ];

    return groups.filter((group) => group.items.length > 0);
  }

  if (role === "Chef") {
    const groups: NavGroup[] = [
      {
        label: "Kitchen",
        items: [
          {
            icon: ChefHat,
            label: "Kitchen Dashboard",
            href: "/chef-dashboard",
            locked: !hasMealService,
          },
        ],
      },
      {
        label: "Account",
        items: hasNotifications
          ? [{ icon: Bell, label: "Notifications", href: "/notifications" }]
          : [],
      },
    ];

    return groups.filter((group) => group.items.length > 0);
  }

  const groups: NavGroup[] = [
    {
      label: "Operations",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin-dashboard" },
        { icon: BedDouble, label: "Rooms", href: "/room-management" },
        {
          icon: Users,
          label: "People",
          href: "/tenants",
          badge: String(adminMetrics.peopleCount),
        },
        {
          icon: FileText,
          label: "Invoices",
          href: "/invoices",
          badge: String(adminMetrics.invoiceCount),
        },
        { icon: CreditCard, label: "Payments", href: "/payments" },
        {
          icon: Wrench,
          label: "Maintenance",
          href: "/maintenance",
          badge: String(adminMetrics.maintenanceCount),
        },
      ],
    },
    {
      label: "Analytics",
      items: [
        { icon: BarChart3, label: "Reports", href: "/reports", locked: !hasAnalytics },
        {
          icon: Building2,
          label: "Multi-Dorm",
          href: "/multi-dorm",
          locked: !hasMultiDorm,
        },
      ],
    },
    {
      label: "Account",
      items: hasNotifications
        ? [
            {
              icon: Bell,
              label: "Notifications",
              href: "/notifications",
              badge:
                adminMetrics.notificationCount > 0
                  ? String(adminMetrics.notificationCount)
                  : null,
            },
          ]
        : [],
    },
  ];

  return groups.filter((group) => group.items.length > 0);
}

export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut, switchActiveDorm } = useDemoSession();
  const {
    currentDorm,
    currentDormInvoices,
    currentDormMaintenanceTickets,
    currentDormTenants,
    currentDormChefs,
    unreadNotificationCount,
    workspace,
  } = useDemoWorkspace();
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const membershipDormIds = useMemo(
    () =>
      new Set(
        session?.memberships.map((membership) => membership.dormId) ?? [],
      ),
    [session?.memberships],
  );
  const activeDormOptions = useMemo(
    () =>
      workspace.dorms
        .filter(
          (dorm) => dorm.status === "Active" && membershipDormIds.has(dorm.id),
        )
        .map((dorm) => ({
          value: dorm.id,
          label: `${dorm.name} · ${dorm.city}`,
        })),
    [membershipDormIds, workspace.dorms],
  );
  const adminMetrics = useMemo<AdminNavMetrics>(
    () => ({
      peopleCount: currentDormTenants.length + currentDormChefs.length,
      invoiceCount: currentDormInvoices.filter(
        (invoice) =>
          invoice.status === "Issued" || invoice.status === "Overdue",
      ).length,
      maintenanceCount: currentDormMaintenanceTickets.filter(
        (ticket) => ticket.status !== "Resolved",
      ).length,
      notificationCount: unreadNotificationCount,
    }),
    [
      currentDormChefs.length,
      currentDormInvoices,
      currentDormMaintenanceTickets,
      currentDormTenants.length,
      unreadNotificationCount,
    ],
  );
  const navGroups = useMemo(() => {
    if (!session) return [];
    return getNavGroups(session, adminMetrics);
  }, [adminMetrics, session]);

  useEffect(() => {
    if (!session) return;

    const routesToWarm = [
      ...navGroups.flatMap((group) => group.items.map((item) => item.href)),
      "/settings",
    ].filter((href) => href !== pathname);

    const timeoutId = window.setTimeout(() => {
      routesToWarm.forEach((href) => {
        if (prefetchedRoutesRef.current.has(href)) {
          return;
        }

        router.prefetch(href);
        prefetchedRoutesRef.current.add(href);
      });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [navGroups, pathname, router, session]);

  if (!session) {
    return null;
  }

  function handleSignOut() {
    signOut();
    router.push("/sign-up-login-screen");
  }

  function handleActiveDormChange(dormId: string) {
    try {
      switchActiveDorm(dormId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to switch the active dorm.";
      toast.error(message);
    }
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-[hsl(var(--border))] sidebar-transition overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center border-b border-[hsl(var(--border))] flex-shrink-0 ${collapsed ? "px-4 py-4 justify-center" : "px-4 py-4 gap-2"}`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AppLogo size={32} />
            <div className="min-w-0">
              <p className="font-semibold text-[15px] text-[hsl(var(--foreground))] truncate">
                DormFlow
              </p>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                {session.dormName}
              </p>
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
            <ChevronLeft
              size={16}
              className="text-[hsl(var(--muted-foreground))]"
            />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {!collapsed &&
          session.role === "Admin" &&
          currentDorm &&
          activeDormOptions.length > 1 && (
            <div className="px-2">
              <p className="mb-1.5 px-3 text-[11px] font-500 uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Active Dorm
              </p>
              <AppSelect
                ariaLabel="Active dorm"
                fullWidth
                value={currentDorm.id}
                options={activeDormOptions}
                onChange={handleActiveDormChange}
                triggerClassName="py-2 text-[12px]"
              />
            </div>
          )}
        {navGroups.map((group) => (
          <div key={`group-${group.label}`}>
            {!collapsed && (
              <p className="text-[11px] font-500 tracking-wider text-[hsl(var(--muted-foreground))] uppercase px-3 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isHomeRoute = item.href === session.homePath;
                const isActive =
                  pathname === item.href ||
                  (!isHomeRoute && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={`nav-${item.label}`}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-150 group relative
                      ${
                        isActive
                          ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
                          : item.locked
                            ? "border border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100"
                          : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                      }
                      ${collapsed ? "justify-center" : ""}
                    `}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.locked && (
                          <Lock
                            size={13}
                            className="flex-shrink-0 text-[hsl(var(--muted-foreground))]"
                          />
                        )}
                        {item.badge && (
                          <span className="text-[11px] font-600 bg-[hsl(var(--primary))] text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center tabular-nums">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && (item.badge || item.locked) && (
                      <span className={`absolute top-1 right-1 h-2 w-2 rounded-full ${item.locked ? 'bg-amber-500' : 'bg-red-500'}`} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={`border-t border-[hsl(var(--border))] p-2 flex-shrink-0 ${collapsed ? "" : ""}`}
      >
        {collapsed ? (
          <>
            <button
              onClick={onToggleCollapse}
              className="w-full p-2.5 flex justify-center rounded-lg hover:bg-[hsl(var(--muted))] transition-colors mb-1"
              aria-label="Expand sidebar"
            >
              <ChevronRight
                size={16}
                className="text-[hsl(var(--muted-foreground))]"
              />
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full p-2.5 flex justify-center rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut
                size={16}
                className="text-[hsl(var(--muted-foreground))]"
              />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0">
                {session.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[hsl(var(--foreground))] truncate">
                  {session.name}
                </p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                  {getRoleLabel(session.role)}
                </p>
              </div>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <Settings size={16} />
              <span>Settings</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[hsl(var(--muted-foreground))] hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
