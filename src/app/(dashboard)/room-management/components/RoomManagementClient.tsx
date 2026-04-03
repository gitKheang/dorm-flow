'use client';
import React, { useState, useMemo } from 'react';
import { Plus, Search, SlidersHorizontal, Download, Trash2, Edit2, Eye, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import ExportDialog from '@/components/ui/ExportDialog';
import AppSelect from '@/components/ui/AppSelect';
import { Room, RoomStatus, RoomType } from '@/lib/mockData';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import { exportRowsToCsv, openPrintableExport } from '@/lib/export';
import AddRoomModal from './AddRoomModal';
import RoomStatusBadge from './RoomStatusBadge';

type SortKey = keyof Room | null;
type SortDir = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function RoomManagementClient() {
  const {
    addRoom,
    currentDorm,
    currentDormRooms,
    deleteRoom,
    updateRoom,
    updateRoomStatus,
  } = useDemoWorkspace();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<RoomStatus | 'All'>('All');
  const [filterType, setFilterType] = useState<RoomType | 'All'>('All');
  const [filterFloor, setFilterFloor] = useState<number | 'All'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('roomNumber');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const rooms = currentDormRooms;
  const floors = useMemo(() => [...new Set(currentDormRooms.map((room) => room.floor))].sort((a, b) => a - b), [currentDormRooms]);

  const filtered = useMemo(() => {
    let result = rooms.filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.roomNumber.includes(q) || r.type.toLowerCase().includes(q) || r.assignedTenants.some(t => t.toLowerCase().includes(q));
      const matchStatus = filterStatus === 'All' || r.status === filterStatus;
      const matchType = filterType === 'All' || r.type === filterType;
      const matchFloor = filterFloor === 'All' || r.floor === filterFloor;
      return matchSearch && matchStatus && matchType && matchFloor;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }
    return result;
  }, [rooms, search, filterStatus, filterType, filterFloor, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(r => r.id)));
  }

  function handleBulkDelete() {
    if (selectedIds.size > 1) {
      toast.info('Delete rooms one at a time so resident, maintenance, and billing records stay accurate.');
      return;
    }

    try {
      const [roomId] = Array.from(selectedIds);
      if (!roomId) {
        return;
      }

      deleteRoom(roomId);
      setSelectedIds(new Set());
      toast.success('Selected room removed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to remove the selected rooms.';
      toast.error(message);
    }
  }

  function handleStatusChange(roomId: string, newStatus: RoomStatus) {
    try {
      updateRoomStatus(roomId, newStatus);
      toast.success('Room status updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update the room status.';
      toast.error(message);
    }
  }

  function handleAddRoom(room: Room) {
    try {
      addRoom(room);
      setShowAddModal(false);
      toast.success(`Room ${room.roomNumber} added successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add the room.';
      toast.error(message);
    }
  }

  function handleEditRoom(room: Room) {
    try {
      updateRoom(room);
      setEditRoom(null);
      toast.success(`Room ${room.roomNumber} updated`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update the room.';
      toast.error(message);
    }
  }

  function handleDeleteRoom(room: Room) {
    try {
      deleteRoom(room.id);
      toast.success(`Room ${room.roomNumber} removed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to remove the room.';
      toast.error(message);
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp size={12} className="text-[hsl(var(--muted-foreground))] opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-[hsl(var(--primary))]" />
      : <ChevronDown size={12} className="text-[hsl(var(--primary))]" />;
  };

  const statusCounts = useMemo(() => ({
    All: rooms.length,
    Occupied: rooms.filter(r => r.status === 'Occupied').length,
    Available: rooms.filter(r => r.status === 'Available').length,
    'Under Maintenance': rooms.filter(r => r.status === 'Under Maintenance').length,
    Reserved: rooms.filter(r => r.status === 'Reserved').length,
  }), [rooms]);

  const roomTypeOptions = useMemo(
    () => [{ value: 'All', label: 'All Types' }, ...(['Single', 'Double', 'Triple', 'Suite'] as RoomType[]).map((type) => ({ value: type, label: type }))],
    [],
  );

  const floorOptions = useMemo(
    () => [{ value: 'All', label: 'All Floors' }, ...floors.map((floor) => ({ value: String(floor), label: `Floor ${floor}` }))],
    [floors],
  );

  const pageSizeOptions = useMemo(
    () => PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) })),
    [],
  );

  function handleExport(format: 'csv' | 'pdf') {
    const exportRows = filtered.map((room) => ({
      roomNumber: room.roomNumber,
      type: room.type,
      floor: room.floor,
      capacity: room.capacity,
      occupants: room.occupants,
      rentPerMonth: room.rentPerMonth,
      status: room.status,
      assignedTenants: room.assignedTenants.join(', ') || 'No residents assigned',
      lastUpdated: room.lastUpdated,
    }));
    const columns = [
      { key: 'roomNumber', label: 'Room', accessor: (row: (typeof exportRows)[number]) => row.roomNumber },
      { key: 'type', label: 'Type', accessor: (row: (typeof exportRows)[number]) => row.type },
      { key: 'floor', label: 'Floor', accessor: (row: (typeof exportRows)[number]) => row.floor },
      { key: 'capacity', label: 'Capacity', accessor: (row: (typeof exportRows)[number]) => row.capacity },
      { key: 'occupants', label: 'Occupants', accessor: (row: (typeof exportRows)[number]) => row.occupants },
      { key: 'rentPerMonth', label: 'Rent / Month', accessor: (row: (typeof exportRows)[number]) => row.rentPerMonth },
      { key: 'status', label: 'Status', accessor: (row: (typeof exportRows)[number]) => row.status },
      { key: 'assignedTenants', label: 'Assigned Residents', accessor: (row: (typeof exportRows)[number]) => row.assignedTenants },
      { key: 'lastUpdated', label: 'Last Updated', accessor: (row: (typeof exportRows)[number]) => row.lastUpdated },
    ];

    if (format === 'csv') {
      exportRowsToCsv(
        `${(currentDorm?.name ?? 'dorm').toLowerCase().replace(/\s+/g, '-')}-rooms.csv`,
        exportRows,
        columns,
      );
      toast.success('Room CSV exported');
    } else {
      openPrintableExport({
        title: `${currentDorm?.name ?? 'Dorm'} room export`,
        subtitle: 'Room records currently shown on this page',
        rows: exportRows,
        columns,
      });
      toast.success('Room print view opened');
    }

    setShowExportDialog(false);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Rooms</h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {currentDorm?.name ?? 'Dorm'} · {rooms.length} rooms · {statusCounts.Occupied} occupied · {statusCounts.Available} available
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <Download size={15} />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-all active:scale-95"
          >
            <Plus size={15} />
            Add Room
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {(['All', 'Occupied', 'Available', 'Under Maintenance', 'Reserved'] as const).map((s) => (
          <button
            key={`status-tab-${s}`}
            onClick={() => { setFilterStatus(s); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
              filterStatus === s
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
          >
            {s}
            <span className={`text-[11px] rounded-full px-1.5 py-0.5 tabular-nums ${
              filterStatus === s ? 'bg-white/20 text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
            }`}>
              {statusCounts[s as keyof typeof statusCounts] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search rooms or residents..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))]"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 text-[13px] font-medium border rounded-lg transition-colors ${
            showFilters ? 'bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary)/0.3)] text-[hsl(var(--primary))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {(filterType !== 'All' || filterFloor !== 'All') && (
            <span className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full" />
          )}
        </button>
        {showFilters && (
          <div className="flex items-center gap-2 w-full flex-wrap slide-up">
            <AppSelect
              ariaLabel="Filter by room type"
              value={filterType}
              options={roomTypeOptions}
              onChange={(value) => {
                setFilterType(value as RoomType | 'All');
                setPage(1);
              }}
              triggerClassName="min-w-[148px] py-2"
            />
            <AppSelect
              ariaLabel="Filter by floor"
              value={String(filterFloor)}
              options={floorOptions}
              onChange={(value) => {
                setFilterFloor(value === 'All' ? 'All' : Number(value));
                setPage(1);
              }}
              triggerClassName="min-w-[148px] py-2"
            />
            {(filterType !== 'All' || filterFloor !== 'All') && (
              <button
                onClick={() => { setFilterType('All'); setFilterFloor('All'); }}
                className="text-[12px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[hsl(var(--primary)/0.06)] border border-[hsl(var(--primary)/0.2)] rounded-xl slide-up">
          <span className="text-[13px] font-medium text-[hsl(var(--primary))]">
            {selectedIds.size} room{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size > 1}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg border transition-colors ${
              selectedIds.size > 1
                ? 'cursor-not-allowed border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                : 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
            }`}
          >
            <Trash2 size={14} />
            {selectedIds.size > 1 ? 'Review individually' : 'Delete selected'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            Deselect all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.size === paginated.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
                    aria-label="Select all rooms"
                  />
                </th>
                {[
                  { key: 'roomNumber', label: 'Room No.' },
                  { key: 'type', label: 'Type' },
                  { key: 'floor', label: 'Floor' },
                  { key: 'capacity', label: 'Capacity' },
                  { key: 'occupants', label: 'Occupants' },
                  { key: 'rentPerMonth', label: 'Rent / Month' },
                  { key: 'status', label: 'Status' },
                  { key: 'assignedTenants', label: 'Assigned Residents' },
                  { key: 'lastUpdated', label: 'Last Updated' },
                ].map(col => (
                  <th
                    key={`col-${col.key}`}
                    onClick={() => handleSort(col.key as SortKey)}
                    className="px-4 py-3 text-left text-[12px] font-500 uppercase tracking-wider text-[hsl(var(--muted-foreground))] cursor-pointer hover:text-[hsl(var(--foreground))] select-none whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      <SortIcon col={col.key as SortKey} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-[12px] font-500 uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-[hsl(var(--muted))] rounded-xl flex items-center justify-center">
                        <Search size={20} className="text-[hsl(var(--muted-foreground))]" />
                      </div>
                      <p className="text-[15px] font-semibold text-[hsl(var(--foreground))]">No rooms found</p>
                      <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
                        Try a different search or filter, or add a room.
                      </p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-1 px-4 py-2 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
                      >
                        Add Room
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((room, idx) => (
                  <tr
                    key={room.id}
                    className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.4)] transition-colors ${
                      selectedIds.has(room.id) ? 'bg-[hsl(var(--primary)/0.04)]' : idx % 2 === 1 ? 'bg-[hsl(var(--muted)/0.15)]' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(room.id)}
                        onChange={() => toggleSelect(room.id)}
                        className="rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
                        aria-label={`Select room ${room.roomNumber}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[13px] font-medium text-[hsl(var(--foreground))]">
                        #{room.roomNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-[hsl(var(--foreground))]">{room.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-[hsl(var(--muted-foreground))] tabular-nums">Floor {room.floor}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {Array.from({ length: room.capacity }).map((_, i) => (
                            <div
                              key={`cap-${room.id}-${i}`}
                              className={`w-2 h-3 rounded-sm ${i < room.occupants ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))]'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[12px] text-[hsl(var(--muted-foreground))] tabular-nums">{room.capacity}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium tabular-nums text-[hsl(var(--foreground))]">
                        {room.occupants}/{room.capacity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium tabular-nums text-[hsl(var(--foreground))]">
                        ${room.rentPerMonth.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RoomStatusBadge
                        status={room.status}
                        onStatusChange={(s) => handleStatusChange(room.id, s)}
                      />
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      {room.assignedTenants.length === 0 ? (
                        <span className="text-[12px] text-[hsl(var(--muted-foreground))] italic">No residents assigned</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {room.assignedTenants.slice(0, 2).map((t, ti) => (
                            <span key={`tenant-${room.id}-${ti}`} className="text-[12px] text-[hsl(var(--foreground))] truncate">{t}</span>
                          ))}
                          {room.assignedTenants.length > 2 && (
                            <span className="text-[11px] text-[hsl(var(--muted-foreground))]">+{room.assignedTenants.length - 2} more</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-[hsl(var(--muted-foreground))] tabular-nums">{room.lastUpdated}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toast.info(`Room ${room.roomNumber} · ${room.occupants}/${room.capacity} occupied · ${room.status}`)}
                          title={`Quick summary for room ${room.roomNumber}`}
                          className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setEditRoom(room)}
                          title={`Edit room ${room.roomNumber}`}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-[hsl(var(--muted-foreground))] hover:text-blue-600 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room)}
                          title={`Delete room ${room.roomNumber} — this cannot be undone`}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[hsl(var(--muted-foreground))] hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(var(--border))]">
            <div className="flex items-center gap-2 text-[13px] text-[hsl(var(--muted-foreground))]">
              <span>Rows per page:</span>
              <AppSelect
                ariaLabel="Rows per page"
                value={String(pageSize)}
                options={pageSizeOptions}
                onChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
                triggerClassName="min-w-[76px] px-2 py-1 text-[13px]"
              />
              <span className="tabular-nums">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="First page"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return p <= totalPages ? (
                  <button
                    key={`page-${p}`}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                      p === page
                        ? 'bg-[hsl(var(--primary))] text-white'
                        : 'hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {p}
                  </button>
                ) : null;
              })}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Last page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {(showAddModal || editRoom) && (
        <AddRoomModal
          room={editRoom}
          onClose={() => { setShowAddModal(false); setEditRoom(null); }}
          onSave={editRoom ? handleEditRoom : handleAddRoom}
        />
      )}
      <ExportDialog
        description="Export the room records currently shown on this page as CSV or a print view."
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        title="Export rooms"
      />
    </div>
  );
}
