"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Building2, Lock, Save, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { useDemoSession } from "@/components/DemoSessionProvider";
import { useDemoWorkspace } from "@/components/DemoWorkspaceProvider";
import PlanBadge from "@/components/premium/PlanBadge";
import AppSelect from "@/components/ui/AppSelect";
import { getRoleLabel } from "@/lib/demoSession";
import { buildPremiumCheckoutHref, type DormPlan } from "@/lib/plans";

type SettingsTab = "profile" | "security" | "notifications" | "dorm";

function parseSettingsTab(value: string | null): SettingsTab | null {
  return value === "profile" ||
    value === "security" ||
    value === "notifications" ||
    value === "dorm"
    ? value
    : null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function ToggleSwitch({
  checked,
  disabled = false,
  onClick,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span
        className={`min-w-7 text-right text-[11px] font-medium ${
          checked
            ? "text-[hsl(var(--primary))]"
            : "text-[hsl(var(--muted-foreground))]"
        }`}
      >
        {checked ? "On" : "Off"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary)/0.35)] focus-visible:ring-offset-2 ${
          checked
            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
            : "border-[hsl(var(--border))] bg-white"
        } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      >
        <span
          className={`absolute h-5 w-5 rounded-full shadow-sm transition-transform duration-200 ease-out ${
            checked
              ? "translate-x-5 bg-white"
              : "translate-x-0.5 bg-[hsl(var(--muted-foreground)/0.35)]"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsClient() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authMode, session, updateSession, changePassword } = useDemoSession();
  const {
    canToggleModule,
    currentDorm,
    currentDormPlan,
    hasModule,
    setDormPlan,
    setModuleEnabled,
    updateDorm,
    workspace,
  } = useDemoWorkspace();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dormName, setDormName] = useState("");
  const [dormCity, setDormCity] = useState("");
  const [dormAddress, setDormAddress] = useState("");
  const [timezone, setTimezone] = useState("UTC+7 (Indochina Time)");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!session) return;
    setName(session.name);
    setEmail(session.email);
    setDormName(currentDorm?.name ?? session.dormName);
    setDormCity(currentDorm?.city ?? "");
    setDormAddress(currentDorm?.address ?? "");
    setTimezone(currentDorm?.timezone ?? "UTC+7 (Indochina Time)");
  }, [currentDorm, session]);

  const isAdmin = session?.role === "Admin";
  const requestedTab = parseSettingsTab(searchParams.get("tab"));
  const activeTab: SettingsTab =
    requestedTab === "dorm" && !isAdmin
      ? "profile"
      : (requestedTab ?? "profile");

  const tabs = useMemo(() => {
    const baseTabs: Array<{
      id: SettingsTab;
      label: string;
      icon: React.ElementType;
    }> = [
      { id: "profile" as const, label: "Profile", icon: User },
      { id: "security" as const, label: "Security", icon: Lock },
      { id: "notifications" as const, label: "Notifications", icon: Bell },
    ];

    if (isAdmin) {
      baseTabs.push({
        id: "dorm" as const,
        label: "Dorm Settings",
        icon: Building2,
      });
    }

    return baseTabs;
  }, [isAdmin]);

  const notificationOptions = useMemo(() => {
    if (session?.role === "Tenant") {
      return [
        {
          label: "Invoice reminders",
          desc: "Get notified when rent is issued, due, or overdue",
          enabled: true,
        },
        {
          label: "Maintenance updates",
          desc: "Get notified when your maintenance requests are updated",
          enabled: true,
        },
        {
          label: "Dorm announcements",
          desc: "Receive notices from the dorm management team",
          enabled: false,
        },
      ];
    }

    if (session?.role === "Chef") {
      return [
        {
          label: "Meal plan changes",
          desc: "Get notified when kitchen schedules or servings change",
          enabled: true,
        },
        {
          label: "Kitchen alerts",
          desc: "Receive prep and operational alerts for the dorm kitchen",
          enabled: true,
        },
        {
          label: "Dorm announcements",
          desc: "Receive general notices that affect service operations",
          enabled: false,
        },
      ];
    }

    return [
      {
        label: "Payment received",
        desc: "Get notified when a resident makes a payment",
        enabled: true,
      },
      {
        label: "Maintenance requests",
        desc: "Get notified on new or updated maintenance tickets",
        enabled: true,
      },
      {
        label: "Invoice reminders",
        desc: "Get notified when invoices are due or overdue",
        enabled: false,
      },
    ];
  }, [session?.role]);

  const dormModules = useMemo(
    () => [
      {
        key: "mealService" as const,
        label: "Meal Service",
        desc: "Lets residents save meal selections and kitchen staff manage meals.",
        premium: true,
      },
      {
        key: "notifications" as const,
        label: "Notifications",
        desc: "Turns new in-app notifications on or off for this dorm.",
        premium: false,
      },
      {
        key: "analytics" as const,
        label: "Reports",
        desc: "Shows or hides the reports page for this dorm.",
        premium: true,
      },
      {
        key: "multiDorm" as const,
        label: "Multiple Dorms",
        desc: "Lets this account add dorms and switch the active dorm.",
        premium: true,
      },
    ],
    [],
  );

  const isPasswordChangeAvailable = authMode === "demo";
  const isNotificationsPreferencesAvailable = false;

  if (!session) {
    return null;
  }

  function handleSave() {
    try {
      if (activeTab === "profile") {
        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!trimmedName) {
          throw new Error("Full name is required.");
        }

        if (!normalizedEmail || !normalizedEmail.includes("@")) {
          throw new Error("Enter a valid email address.");
        }

        updateSession({ name: trimmedName, email: normalizedEmail });
        toast.success("Profile updated successfully");
        return;
      }

      if (activeTab === "security") {
        if (!isPasswordChangeAvailable) {
          throw new Error(
            "Password changes are not available in this auth mode yet.",
          );
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
          throw new Error("Complete all password fields before saving.");
        }

        if (newPassword.length < 8) {
          throw new Error("New password must be at least 8 characters long.");
        }

        if (newPassword !== confirmPassword) {
          throw new Error("New password and confirmation do not match.");
        }

        changePassword(currentPassword, newPassword);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password updated for this account");
        return;
      }

      if (activeTab === "dorm") {
        if (!isAdmin || !currentDorm) {
          throw new Error("Dorm settings are only available to owners.");
        }

        const trimmedDormName = dormName.trim();
        const trimmedDormCity = dormCity.trim();
        const trimmedDormAddress = dormAddress.trim();

        if (!trimmedDormName) {
          throw new Error("Dormitory name is required.");
        }

        if (!trimmedDormCity) {
          throw new Error("City is required.");
        }

        if (!trimmedDormAddress) {
          throw new Error("Address is required.");
        }

        updateDorm(currentDorm.id, {
          name: trimmedDormName,
          city: trimmedDormCity,
          address: trimmedDormAddress,
          timezone,
        });
        toast.success("Dorm settings saved successfully");
        return;
      }

      toast.info("Notification settings cannot be changed on this page.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function handlePlanChange(nextPlan: DormPlan) {
    try {
      if (!isAdmin || !currentDorm) {
        throw new Error("Dorm plans can only be managed by owners.");
      }

      if (nextPlan === "premium") {
        router.push(
          buildPremiumCheckoutHref({
            source: "settings",
            returnTo: "/settings?tab=dorm",
          }),
        );
        return;
      }

      setDormPlan(nextPlan, currentDorm.id);
      toast.success("This dorm is now on the Free plan.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || session.initials;
  const actionLabel =
    activeTab === "profile"
      ? "Save Profile"
      : activeTab === "security"
        ? isPasswordChangeAvailable
          ? "Update Password"
          : "Changes Unavailable"
        : activeTab === "notifications"
          ? "Changes Unavailable"
          : "Save Dorm Settings";
  const isActionDisabled =
    activeTab === "notifications" ||
    (activeTab === "security" && !isPasswordChangeAvailable);
  const planSummary =
    currentDormPlan === "premium"
      ? "Meal service, reports, and multiple dorms are available for this dorm."
      : "Upgrade this dorm to use meal service, reports, and multiple dorms.";

  function handleTabChange(nextTab: SettingsTab) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
            Settings
          </h1>
          {isAdmin && <PlanBadge plan={currentDormPlan} />}
        </div>
        <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
          {isAdmin
            ? "Manage your account and this dorm"
            : "Manage your account"}
        </p>
      </div>

      <div className="flex gap-1 bg-[hsl(var(--muted))] rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 space-y-5">
        {activeTab === "profile" && (
          <>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">
              Profile
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white text-xl font-semibold">
                {initials}
              </div>
              <button
                onClick={() =>
                  toast.info("Profile photos are fixed for this workspace.")
                }
                className="text-[13px] text-[hsl(var(--primary))] font-medium hover:underline"
              >
                Profile photo
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  Role
                </label>
                <input
                  type="text"
                  value={getRoleLabel(session.role)}
                  readOnly
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "security" && (
          <>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">
              Security
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] p-4">
                <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  {isPasswordChangeAvailable
                    ? "Change the password for this account."
                    : "Password changes are not available for this sign-in method."}
                </p>
                <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
                  {isPasswordChangeAvailable
                    ? "Use your current password, then set a new one with at least 8 characters."
                    : "The fields below are disabled for this account."}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  disabled={!isPasswordChangeAvailable}
                  placeholder="Enter current password"
                  className={`w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] ${isPasswordChangeAvailable ? "bg-white" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"}`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={!isPasswordChangeAvailable}
                  placeholder="Enter new password"
                  className={`w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] ${isPasswordChangeAvailable ? "bg-white" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"}`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={!isPasswordChangeAvailable}
                  placeholder="Confirm new password"
                  className={`w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] ${isPasswordChangeAvailable ? "bg-white" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed"}`}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "notifications" && (
          <>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">
              Notifications
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] p-4">
                <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  Notification settings are fixed for this workspace.
                </p>
                <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
                  You can review the current notification setup here, but it
                  cannot be changed on this page.
                </p>
              </div>
              {notificationOptions.map((option) => (
                <div
                  key={option.label}
                  className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[hsl(var(--border))]"
                >
                  <div>
                    <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                      {option.label}
                    </p>
                    <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5">
                      {option.desc}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={option.enabled}
                    disabled={!isNotificationsPreferencesAvailable}
                    label={option.label}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "dorm" && isAdmin && (
          <>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">
              Dorm Settings
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                        Dorm Plan
                      </p>
                      <PlanBadge plan={currentDormPlan} />
                    </div>
                    <p className="mt-2 text-[12px] leading-6 text-[hsl(var(--muted-foreground))]">
                      {planSummary}
                    </p>
                    <p className="mt-2 text-[12px] text-[hsl(var(--muted-foreground))]">
                      Residents and kitchen staff follow this dorm plan
                      automatically.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {currentDormPlan === "free" ? (
                      <button
                        type="button"
                        onClick={() => handlePlanChange("premium")}
                        className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
                      >
                        <Sparkles size={15} />
                        Upgrade to Premium
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePlanChange("free")}
                        className="rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
                      >
                        Downgrade to Free
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  Dorm Name
                </label>
                <input
                  type="text"
                  value={dormName}
                  onChange={(event) => setDormName(event.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  Address
                </label>
                <input
                  type="text"
                  value={dormAddress}
                  onChange={(event) => setDormAddress(event.target.value)}
                  placeholder="123 Campus Drive, City, State"
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  City
                </label>
                <input
                  type="text"
                  value={dormCity}
                  onChange={(event) => setDormCity(event.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  Timezone
                </label>
                <AppSelect
                  ariaLabel="Dorm timezone"
                  fullWidth
                  value={timezone}
                  options={[
                    {
                      value: "UTC-8 (Pacific Time)",
                      label: "UTC-8 (Pacific Time)",
                    },
                    {
                      value: "UTC-5 (Eastern Time)",
                      label: "UTC-5 (Eastern Time)",
                    },
                    { value: "UTC+0 (GMT)", label: "UTC+0 (GMT)" },
                    {
                      value: "UTC+7 (Indochina Time)",
                      label: "UTC+7 (Indochina Time)",
                    },
                  ]}
                  onChange={setTimezone}
                />
              </div>
              <div className="space-y-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] p-4">
                <div>
                  <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                    Operational Modules
                  </p>
                  <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                    Turn each area on only when you want it available in this
                    dorm.
                  </p>
                </div>
                <div className="space-y-3">
                  {dormModules.map((module) => {
                    const canToggle = canToggleModule(
                      module.key,
                      currentDorm?.id,
                    );
                    const lockedOnPlan = module.premium && !canToggle;
                    const storedEnabled = currentDorm
                      ? (
                          workspace.dormModules.find(
                            (entry) => entry.dormId === currentDorm.id,
                          )?.enabledModules ?? []
                        ).includes(module.key)
                      : false;
                    const enabled = lockedOnPlan
                      ? storedEnabled
                      : hasModule(module.key);
                    return (
                      <div
                        key={module.key}
                        className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 ${
                          lockedOnPlan
                            ? "border-amber-200 bg-amber-50"
                            : "border-[hsl(var(--border))] bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                              {module.label}
                            </p>
                            {module.premium && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                                Premium
                              </span>
                            )}
                            {lockedOnPlan && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                                Upgrade required
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                            {module.desc}
                          </p>
                          {lockedOnPlan && (
                            <p className="mt-1.5 text-[12px] text-amber-800">
                              This setting stays {storedEnabled ? "on" : "off"}{" "}
                              until the dorm is upgraded to Premium.
                            </p>
                          )}
                        </div>
                        {lockedOnPlan ? (
                          <button
                            type="button"
                            onClick={() => handlePlanChange("premium")}
                            className="rounded-lg bg-white px-3 py-2 text-[12px] font-medium text-amber-900 transition-colors hover:bg-amber-100"
                          >
                            Upgrade
                          </button>
                        ) : (
                          <ToggleSwitch
                            checked={enabled}
                            onClick={() =>
                              setModuleEnabled(module.key, !enabled)
                            }
                            label={`Toggle ${module.label}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                {!hasModule("mealService") && (
                  <p className="text-[12px] text-amber-700">
                    {currentDormPlan === "premium"
                      ? "Meal service is off. Turn it back on to reopen kitchen tools and resident meal selections."
                      : "Meal service is a Premium feature. Upgrade this dorm to unlock kitchen tools and resident meal selections."}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={isActionDisabled}
          className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium rounded-lg transition-colors ${isActionDisabled ? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed" : "text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)]"}`}
        >
          <Save size={15} />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
