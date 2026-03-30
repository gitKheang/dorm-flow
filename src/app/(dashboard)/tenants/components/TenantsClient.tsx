'use client';
import React, { useState, useMemo } from 'react';
import { Search, Plus, Mail, Phone, BedDouble, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { mockTenants, mockRooms } from '@/lib/mockData';

export default function TenantsClient() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');

  const filtered = useMemo(() => {
    return mockTenants.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'All' || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [search, filterStatus]);

  function getRoomNumber(roomId: string) {
    return mockRooms.find(r => r.id === roomId)?.roomNumber ?? '—';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Tenants</h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {mockTenants.length} registered tenants
          </p>
        </div>
        <button
          onClick={() => toast.info('Invite tenant feature coming soon')}
          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
        >
          <Plus size={15} />
          Invite Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
          />
        </div>
        <div className="flex gap-2">
          {(['All', 'Active', 'Inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 text-[13px] font-medium rounded-lg border transition-all ${
                filterStatus === s
                  ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]'
                  : 'bg-white text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.4)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tenant</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Contact</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Room</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Move-in</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-[12px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {filtered.map(tenant => (
                <tr key={tenant.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.12)] flex items-center justify-center text-[hsl(var(--primary))] text-[12px] font-semibold flex-shrink-0">
                        {tenant.avatar}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{tenant.name}</p>
                        <p className="text-[12px] text-[hsl(var(--muted-foreground))]">{tenant.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                        <Mail size={11} />
                        {tenant.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                        <Phone size={11} />
                        {tenant.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-[13px] text-[hsl(var(--foreground))]">
                      <BedDouble size={14} className="text-[hsl(var(--muted-foreground))]" />
                      Room {getRoomNumber(tenant.roomId)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[hsl(var(--muted-foreground))]">
                    {tenant.moveInDate}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full ${
                      tenant.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tenant.status === 'Active' ? <UserCheck size={11} /> : <UserX size={11} />}
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => toast.info(`Viewing ${tenant.name}'s profile`)}
                      className="text-[12px] text-[hsl(var(--primary))] font-medium hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[14px] text-[hsl(var(--muted-foreground))]">No tenants found</p>
          </div>
        )}
        <div className="px-5 py-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
          <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
            Showing {filtered.length} of {mockTenants.length} tenants
          </p>
        </div>
      </div>
    </div>
  );
}
