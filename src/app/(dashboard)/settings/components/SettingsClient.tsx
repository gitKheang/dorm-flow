'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Building2, Lock, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { useDemoSession } from '@/components/DemoSessionProvider';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import AppSelect from '@/components/ui/AppSelect';
import { getRoleLabel } from '@/lib/demoSession';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'dorm';

export default function SettingsClient() {
  const { session, updateSession } = useDemoSession();
  const { hasModule, setModuleEnabled } = useDemoWorkspace();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dormName, setDormName] = useState('');
  const [timezone, setTimezone] = useState('UTC+7 (Indochina Time)');
  const [notifPrimary, setNotifPrimary] = useState(true);
  const [notifSecondary, setNotifSecondary] = useState(true);
  const [notifTertiary, setNotifTertiary] = useState(false);

  useEffect(() => {
    if (!session) return;
    setName(session.name);
    setEmail(session.email);
    setDormName(session.dormName);
  }, [session]);

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
          value: notifPrimary,
          set: setNotifPrimary,
        },
        {
          label: 'Maintenance updates',
          desc: 'Get notified when your maintenance requests are updated',
          value: notifSecondary,
          set: setNotifSecondary,
        },
        {
          label: 'Dorm announcements',
          desc: 'Receive notices from the dorm management team',
          value: notifTertiary,
          set: setNotifTertiary,
        },
      ];
    }

    if (session?.role === 'Chef') {
      return [
        {
          label: 'Meal plan changes',
          desc: 'Get notified when kitchen schedules or servings change',
          value: notifPrimary,
          set: setNotifPrimary,
        },
        {
          label: 'Kitchen alerts',
          desc: 'Receive prep and operational alerts for the dorm kitchen',
          value: notifSecondary,
          set: setNotifSecondary,
        },
        {
          label: 'Dorm announcements',
          desc: 'Receive general notices that affect service operations',
          value: notifTertiary,
          set: setNotifTertiary,
        },
      ];
    }

    return [
      {
        label: 'Payment received',
        desc: 'Get notified when a tenant makes a payment',
        value: notifPrimary,
        set: setNotifPrimary,
      },
      {
        label: 'Maintenance requests',
        desc: 'Get notified on new or updated maintenance tickets',
        value: notifSecondary,
        set: setNotifSecondary,
      },
      {
        label: 'Invoice reminders',
        desc: 'Get notified when invoices are due or overdue',
        value: notifTertiary,
        set: setNotifTertiary,
      },
    ];
  }, [notifPrimary, notifSecondary, notifTertiary, session?.role]);

  const dormModules = useMemo(() => ([
    {
      key: 'mealService' as const,
      label: 'Meal Service',
      desc: 'Enables chef operations and tenant meal-plan controls.',
    },
    {
      key: 'notifications' as const,
      label: 'Notifications',
      desc: 'Keeps role-specific notifications available throughout the app.',
    },
    {
      key: 'analytics' as const,
      label: 'Reports & Analytics',
      desc: 'Shows admin reporting dashboards and portfolio insights.',
    },
    {
      key: 'multiDorm' as const,
      label: 'Multi-Dorm Portfolio',
      desc: 'Unlocks cross-property management and portfolio-level metrics.',
    },
  ]), []);

  if (!session) {
    return null;
  }

  function handleSave() {
    updateSession({
      name,
      email,
      dormName: isAdmin ? dormName : session!.dormName ?? dormName,
    });
    toast.success('Settings saved successfully');
  }

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || session.initials;

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
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Current Password</label>
                <input type="password" placeholder="Enter current password" className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">New Password</label>
                <input type="password" placeholder="Enter new password" className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Confirm New Password</label>
                <input type="password" placeholder="Confirm new password" className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
              </div>
            </div>
          </>
        )}

        {activeTab === 'notifications' && (
          <>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Notification Preferences</h2>
            <div className="space-y-4">
              {notificationOptions.map((option) => (
                <div key={option.label} className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[hsl(var(--border))]">
                  <div>
                    <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{option.label}</p>
                    <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5">{option.desc}</p>
                  </div>
                  <button
                    onClick={() => option.set(!option.value)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${option.value ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted-foreground)/0.3)]'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${option.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
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
                <input type="text" placeholder="123 Campus Drive, City, State" className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
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
                        <button
                          type="button"
                          onClick={() => setModuleEnabled(module.key, !enabled)}
                          className={`relative mt-1 h-5 w-10 rounded-full transition-colors ${enabled ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted-foreground)/0.3)]'}`}
                          aria-label={`Toggle ${module.label}`}
                        >
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
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
          className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
        >
          <Save size={15} />
          Save Changes
        </button>
      </div>
    </div>
  );
}
