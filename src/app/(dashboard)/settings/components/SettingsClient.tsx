'use client';
import React, { useState } from 'react';
import { User, Lock, Bell, Building2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'dorm'>('profile');
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('admin@sunrisedorm.app');
  const [dormName, setDormName] = useState('Sunrise Dormitory');
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifMaintenance, setNotifMaintenance] = useState(true);
  const [notifInvoices, setNotifInvoices] = useState(false);

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'dorm' as const, label: 'Dorm Settings', icon: Building2 },
  ];

  function handleSave() {
    toast.success('Settings saved successfully');
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Settings</h1>
        <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
          Manage your account and dorm preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[hsl(var(--muted))] rounded-xl p-1">
        {tabs.map(tab => (
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

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 space-y-5">
        {activeTab === 'profile' && (
          <>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Profile Information</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white text-xl font-semibold">
                AD
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
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Role</label>
                <input
                  type="text"
                  value="Administrator"
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
              {[
                { label: 'Payment received', desc: 'Get notified when a tenant makes a payment', value: notifPayments, set: setNotifPayments },
                { label: 'Maintenance requests', desc: 'Get notified on new or updated maintenance tickets', value: notifMaintenance, set: setNotifMaintenance },
                { label: 'Invoice reminders', desc: 'Get notified when invoices are due or overdue', value: notifInvoices, set: setNotifInvoices },
              ].map(item => (
                <div key={item.label} className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[hsl(var(--border))]">
                  <div>
                    <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{item.label}</p>
                    <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => item.set(!item.value)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${item.value ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted-foreground)/0.3)]'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'dorm' && (
          <>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Dorm Settings</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Dormitory Name</label>
                <input
                  type="text"
                  value={dormName}
                  onChange={e => setDormName(e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Address</label>
                <input type="text" placeholder="123 Campus Drive, City, State" className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Timezone</label>
                <select className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]">
                  <option>UTC-8 (Pacific Time)</option>
                  <option>UTC-5 (Eastern Time)</option>
                  <option>UTC+0 (GMT)</option>
                  <option>UTC+7 (Indochina Time)</option>
                </select>
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
