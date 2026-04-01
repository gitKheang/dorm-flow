"use client";

import React from "react";
import {
  Bell,
  CheckCheck,
  ChefHat,
  FileText,
  Users,
  Wrench,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoSession } from "@/components/DemoSessionProvider";
import { useDemoWorkspace } from "@/components/DemoWorkspaceProvider";

const typeIcons: Record<string, React.ElementType> = {
  maintenance: Wrench,
  assignment: Users,
  invoice: FileText,
  meal: UtensilsCrossed,
  chef: ChefHat,
};

const typeBg: Record<string, string> = {
  maintenance: "bg-amber-50 text-amber-600",
  assignment: "bg-blue-50 text-blue-600",
  invoice: "bg-slate-50 text-slate-700",
  meal: "bg-orange-50 text-orange-600",
  chef: "bg-yellow-50 text-yellow-700",
};

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = Math.max(0, now.getTime() - then.getTime());
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export default function NotificationsClient() {
  const { session } = useDemoSession();
  const {
    currentUserNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    unreadNotificationCount,
  } = useDemoWorkspace();

  if (!session) {
    return null;
  }

  function markAllRead() {
    markAllNotificationsRead();
    toast.success("All notifications marked as read");
  }

  function markRead(id: string) {
    markNotificationRead(id);
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
            Notifications
          </h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {unreadNotificationCount} unread notification
            {unreadNotificationCount !== 1 ? "s" : ""}
          </p>
        </div>
        {unreadNotificationCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--foreground))] bg-white border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden divide-y divide-[hsl(var(--border))]">
        {currentUserNotifications.map((item) => {
          const Icon = typeIcons[item.type] || Bell;
          const isRead = item.readByUserIds.includes(session.user.id);
          return (
            <div
              key={item.id}
              onClick={() => markRead(item.id)}
              className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[hsl(var(--muted)/0.4)] ${isRead ? "opacity-60" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeBg[item.type] ?? "bg-slate-50 text-slate-600"}`}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-[13px] leading-snug ${isRead ? "text-[hsl(var(--muted-foreground))]" : "font-medium text-[hsl(var(--foreground))]"}`}
                  >
                    {item.message}
                  </p>
                  {!isRead && (
                    <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] text-[hsl(var(--muted-foreground))]">
                    {item.actor}
                  </span>
                  {item.meta && (
                    <>
                      <span className="text-[hsl(var(--muted-foreground))]">
                        ·
                      </span>
                      <span className="text-[12px] text-[hsl(var(--muted-foreground))]">
                        {item.meta}
                      </span>
                    </>
                  )}
                  <span className="text-[hsl(var(--muted-foreground))]">·</span>
                  <span className="text-[12px] text-[hsl(var(--muted-foreground))]">
                    {timeAgo(item.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {currentUserNotifications.length === 0 && (
          <div className="px-6 py-10 text-center">
            <Bell
              size={28}
              className="mx-auto mb-3 text-[hsl(var(--muted-foreground))] opacity-40"
            />
            <p className="text-[14px] text-[hsl(var(--muted-foreground))]">
              No notifications yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
