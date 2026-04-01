'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Building2, Lock, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { useDemoSession } from '@/components/DemoSessionProvider';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import AppSelect from '@/components/ui/AppSelect';
import { getRoleLabel } from '@/lib/demoSession';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'dorm';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
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
            ? 'text-[hsl(var(--primary))]'
            : 'text-[hsl(var(--muted-foreground))]'
        }`}
      >
        {checked ? 'On' : 'Off'}
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
            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]'
            : 'border-[hsl(var(--border))] bg-white'
        } ${
          disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        }`}
      >
        <span
          className={`absolute h-5 w-5 rounded-full shadow-sm transition-transform duration-200 ease-out ${
            checked
              ? 'translate-x-5 bg-white'
              : 'translate-x-0.5 bg-[hsl(var(--muted-foreground)/0.35)]'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsClient() {
  const { authMode, session, updateSession, changePassword } = useDemoSession();
  const { currentDorm, hasModule, setModuleEnabled, updateDorm } = useDemoWorkspace();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dormName, setDormName] = useState('');
  const [dormCity, setDormCity] = useState('');
  const [dormAddress, setDormAddress] = useState('');
  const [timezone, setTimezone] = useState('UTC+7 (Indochina Time)');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!session) return;
    setName(session.name);
    setEmail(session.email);
    setDormName(currentDorm?.name ?? session.dormName);
    setDormCity(currentDorm?.city ?? '');
    setDormAddress(currentDorm?.address ?? '');
    setTimezone(currentDorm?.timezone ?? 'UTC+7 (Indochina Time)');
  }, [currentDorm, session]);

  const isAdmin = session?.role === 'Admin';

  useEffect(() => {
    if (!isAdmin && activeTab === 'dorm') {
      setActiveTab('profile');
    }
  }, [activeTab, isAdmin]);

  const tabs = useMemo(() => {
    const baseTabs: Array<{ id: SettingsTab; label: string; icon: React.ElementType }> = [
      { id: 'profile' as const, label: 'Profile', icon: User },
      { id: 'security' as const, label: 'Security', icon: Lock },
      { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    ];

    if (isAdmin) {
      baseTabs.push({ id: 'dorm' as const, label: 'Dorm Settings', icon: Building2 });
    }

    return baseTabs;
  }, [isAdmin]);

  const notificationOptions = useMemo(() => {
    if (session?.role === 'Tenant') {
      return [
        {
          label: 'Invoice reminders',
          desc: 'Get notified when rent is issued, due, or overdue',
          enabled: true,
        },
        {
          label: 'Maintenance updates',
          desc: 'Get notified when your maintenance requests are updated',
          enabled: true,
        },
        {
          label: 'Dorm announcements',
          desc: 'Receive notices from the dorm management team',
          enabled: false,
        },
      ];
    }

    if (session?.role === 'Chef') {
      return [
        {
          label: 'Meal plan changes',
          desc: 'Get notified when kitchen schedules or servings change',
          enabled: true,
        },
        {
          label: 'Kitchen alerts',
          desc: 'Receive prep and operational alerts for the dorm kitchen',
          enabled: true,
        },
        {
          label: 'Dorm announcements',
          desc: 'Receive general notices that affect service operations',
          enabled: false,
        },
      ];
    }

    return [
      {
        label: 'Payment received',
        desc: 'Get notified when a tenant makes a payment',
        enabled: true,
      },
      {
        label: 'Maintenance requests',
        desc: 'Get notified on new or updated maintenance tickets',
        enabled: true,
      },
      {
        label: 'Invoice reminders',
        desc: 'Get notified when invoices are due or overdue',
        enabled: false,
      },
    ];
  }, [session?.role]);

  const dormModules = useMemo(() => ([
    {
      key: 'mealService' as const,
      label: 'Meal Service',
      desc: 'Turns chef operations and tenant meal-plan actions on or off while preserving meal history.',
    },
    {
      key: 'notifications' as const,
      label: 'Notifications',
      desc: 'Keeps historical alerts visible, but turning this off pauses new in-app notifications for the dorm.',
    },
    {
      key: 'analytics' as const,
      label: 'Reports & Analytics',
      desc: 'Controls reporting visibility only. Historical analytics data remains intact.',
    },
    {
      key: 'multiDorm' as const,
      label: 'Multi-Dorm Portfolio',
      desc: 'Controls cross-dorm management actions without changing the dorm’s stored history.',
    },
  ]), []);

  const isPasswordChangeAvailable = authMode === 'demo';
  const isNotificationsPreferencesAvailable = false;

  if (!session) {
    return null;
  }

  function handleSave() {
    try {
      if (activeTab === 'profile') {
        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!trimmedName) {
          throw new Error('Full name is required.');
        }

        if (!normalizedEmail || !normalizedEmail.includes('@')) {
          throw new Error('Enter a valid email address.');
        }

        updateSession({ name: trimmedName, email: normalizedEmail });
        toast.success('Profile updated successfully');
        return;
      }

      if (activeTab === 'security') {
        if (!isPasswordChangeAvailable) {
          throw new Error('Password changes are not available in this auth mode yet.');
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
          throw new Error('Complete all password fields before saving.');
        }

        if (newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters long.');
        }

        if (newPassword !== confirmPassword) {
          throw new Error('New password and confirmation do not match.');
        }

        changePassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Password updated for this demo account');
        return;
      }

      if (activeTab === 'dorm') {
        if (!isAdmin || !currentDorm) {
          throw new Error('Dorm settings are only available to owners.');
        }

        const trimmedDormName = dormName.trim();
        const trimmedDormCity = dormCity.trim();
        const trimmedDormAddress = dormAddress.trim();

        if (!trimmedDormName) {
          throw new Error('Dormitory name is required.');
        }

        if (!trimmedDormCity) {
          throw new Error('City is required.');
        }

        if (!trimmedDormAddress) {
          throw new Error('Address is required.');
        }

        updateDorm(currentDorm.id, {
          name: trimmedDormName,
          city: trimmedDormCity,
          address: trimmedDormAddress,
          timezone,
        });
        toast.success('Dorm settings saved successfully');
        return;
      }

      toast.info('Notification delivery preferences are not configurable yet.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || session.initials;
  const actionLabel = activeTab === 'profile'
    ? 'Save Profile'
    : activeTab === 'security'
      ? (isPasswordChangeAvailable ? 'Change Password' : 'Password Change Unavailable')
      : activeTab === 'notifications'
        ? 'Preferences Unavailable'
        : 'Save Dorm Settings';
  const isActionDisabled =
    activeTab === 'notifications'
    || (activeTab === 'security' && !isPasswordChangeAvailable);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Settings</h1>
        <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
          {isAdmin ? 'Manage your account and dorm preferences' : 'Manage your account and personal preferences'}
        </p>
      </div>

      <div className="flex gap-1 bg-[hsl(var(--muted))] rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 space-y-5">
        {activeTab === 'profile' && (
          <>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Profile Information</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white text-xl font-semibold">
                {initials}
              </div>
              <button onClick={() => toast.info('Photo upload coming soon')} className="text-[13px] text-[hsl(var(--primary))] font-medium hover:underline">
                Change photo
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Role</label>
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

        {activeTab === 'security' && (
          <>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Security</h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] p-4">
                <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  {isPasswordChangeAvailable
                    ? 'Demo mode password changes update the local demo auth account for this workspace.'
                    : 'Password changes are not wired for the current auth mode yet.'}
                </p>
                <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
                  {isPasswordChangeAvailable
                    ? 'Use the current password for this session, then set a new password with at least 8 characters.'
                    : 'The fields below are disabled until the auth backend supports credential updates.'}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  disabled={!isPasswordChangeAvailable}
                  placeholder="Enter current password"
                  className={`w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] ${isPasswordChangeAvailable ? 'bg-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed'}`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={!isPasswordChangeAvailable}
                  placeholder="Enter new password"
                  className={`w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] ${isPasswordChangeAvailable ? 'bg-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed'}`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={!isPasswordChangeAvailable}
                  placeholder="Confirm new password"
                  className={`w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] ${isPasswordChangeAvailable ? 'bg-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed'}`}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'notifications' && (
          <>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Notification Preferences</h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] p-4">
                <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                  Preference editing is not wired yet.
                </p>
                <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
                  Role-scoped dorm notifications still appear automatically when invoices, maintenance, invitations, room assignments, and meal-service events are created.
                </p>
              </div>
              {notificationOptions.map((option) => (
                <div key={option.label} className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[hsl(var(--border))]">
                  <div>
                    <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{option.label}</p>
                    <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5">{option.desc}</p>
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

        {activeTab === 'dorm' && isAdmin && (
          <>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Dorm Settings</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Dormitory Name</label>
                <input
                  type="text"
                  value={dormName}
                  onChange={(event) => setDormName(event.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Address</label>
                <input
                  type="text"
                  value={dormAddress}
                  onChange={(event) => setDormAddress(event.target.value)}
                  placeholder="123 Campus Drive, City, State"
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">City</label>
                <input
                  type="text"
                  value={dormCity}
                  onChange={(event) => setDormCity(event.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Timezone</label>
                <AppSelect
                  ariaLabel="Dorm timezone"
                  fullWidth
                  value={timezone}
                  options={[
                    { value: 'UTC-8 (Pacific Time)', label: 'UTC-8 (Pacific Time)' },
                    { value: 'UTC-5 (Eastern Time)', label: 'UTC-5 (Eastern Time)' },
                    { value: 'UTC+0 (GMT)', label: 'UTC+0 (GMT)' },
                    { value: 'UTC+7 (Indochina Time)', label: 'UTC+7 (Indochina Time)' },
                  ]}
                  onChange={setTimezone}
                />
              </div>
              <div className="space-y-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] p-4">
                <div>
                  <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">Operational Modules</p>
                  <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                    Turn features on only when your team is ready to run them.
                  </p>
                </div>
                <div className="space-y-3">
                  {dormModules.map((module) => {
                    const enabled = hasModule(module.key);
                    return (
                      <div key={module.key} className="flex items-start justify-between gap-4 rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-3">
                        <div>
                          <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{module.label}</p>
                          <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">{module.desc}</p>
                        </div>
                        <ToggleSwitch
                          checked={enabled}
                          onClick={() => setModuleEnabled(module.key, !enabled)}
                          label={`Toggle ${module.label}`}
                        />
                      </div>
                    );
                  })}
                </div>
                {!hasModule('mealService') && (
                  <p className="text-[12px] text-amber-700">
                    Meal service is off. Chef dashboard access and tenant meal selection are paused until you re-enable it.
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={isActionDisabled}
          className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium rounded-lg transition-colors ${isActionDisabled ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed' : 'text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)]'}`}
        >
          <Save size={15} />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
