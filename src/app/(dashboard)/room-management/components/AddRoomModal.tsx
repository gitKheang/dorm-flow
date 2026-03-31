'use client';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
import AppSelect, { AppSelectOption } from '@/components/ui/AppSelect';
import { Room, RoomType, RoomStatus } from '@/lib/mockData';

interface FormValues {
  roomNumber: string;
  type: RoomType;
  floor: number;
  capacity: number;
  rentPerMonth: number;
  status: RoomStatus;
  notes: string;
  amenities: string;
}

interface AddRoomModalProps {
  room: Room | null;
  onClose: () => void;
  onSave: (room: Room) => void;
}

export default function AddRoomModal({ room, onClose, onSave }: AddRoomModalProps) {
  const isEdit = !!room;
  const [saving, setSaving] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: room ? {
      roomNumber: room.roomNumber,
      type: room.type,
      floor: room.floor,
      capacity: room.capacity,
      rentPerMonth: room.rentPerMonth,
      status: room.status,
      notes: room.notes,
      amenities: room.amenities.join(', '),
    } : {
      type: 'Single',
      floor: 1,
      capacity: 1,
      rentPerMonth: 850,
      status: 'Available',
      notes: '',
      amenities: 'WiFi, AC',
    },
  });

  const roomTypeOptions: AppSelectOption[] = [
    { value: 'Single', label: 'Single' },
    { value: 'Double', label: 'Double' },
    { value: 'Triple', label: 'Triple' },
    { value: 'Suite', label: 'Suite' },
  ];

  const roomStatusOptions: AppSelectOption[] = [
    { value: 'Available', label: 'Available' },
    { value: 'Occupied', label: 'Occupied' },
    { value: 'Under Maintenance', label: 'Under Maintenance' },
    { value: 'Reserved', label: 'Reserved' },
  ];

  useEffect(() => {
    if (room) {
      reset({
        roomNumber: room.roomNumber,
        type: room.type,
        floor: room.floor,
        capacity: room.capacity,
        rentPerMonth: room.rentPerMonth,
        status: room.status,
        notes: room.notes,
        amenities: room.amenities.join(', '),
      });
    }
  }, [room, reset]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function onSubmit(data: FormValues) {
    setSaving(true);
    // BACKEND INTEGRATION: POST /api/rooms or PUT /api/rooms/:id
    await new Promise(r => setTimeout(r, 800));
    const amenitiesArr = data.amenities.split(',').map(a => a.trim()).filter(Boolean);
    const saved: Room = {
      id: room?.id ?? `room-${Date.now()}`,
      roomNumber: data.roomNumber,
      type: data.type,
      floor: Number(data.floor),
      capacity: Number(data.capacity),
      occupants: room?.occupants ?? 0,
      rentPerMonth: Number(data.rentPerMonth),
      status: data.status,
      assignedTenants: room?.assignedTenants ?? [],
      lastUpdated: '2026-03-26',
      amenities: amenitiesArr,
      notes: data.notes,
    };
    setSaving(false);
    onSave(saved);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))] z-10">
          <div>
            <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">
              {isEdit ? `Edit Room #${room?.roomNumber}` : 'Add New Room'}
            </h2>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-0.5">
              {isEdit ? 'Update room details and configuration' : 'Define room capacity, rent, and availability'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {/* Room Number + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                Room Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register('roomNumber', {
                  required: 'Room number is required',
                  pattern: { value: /^[0-9A-Za-z-]+$/, message: 'Only alphanumeric characters' },
                })}
                placeholder="e.g. 301"
                className={`w-full px-3 py-2 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] focus:border-[hsl(var(--primary))] ${errors.roomNumber ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'}`}
              />
              {errors.roomNumber && (
                <p className="text-[12px] text-red-600">{errors.roomNumber.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                Room Type <span className="text-red-500">*</span>
              </label>
              <Controller
                name="type"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <AppSelect
                    ariaLabel="Room type"
                    fullWidth
                    value={field.value}
                    options={roomTypeOptions}
                    onChange={(value) => field.onChange(value as RoomType)}
                  />
                )}
              />
            </div>
          </div>

          {/* Floor + Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                Floor <span className="text-red-500">*</span>
              </label>
              <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Which floor is this room on?</p>
              <input
                type="number"
                min={1}
                max={20}
                {...register('floor', { required: 'Floor is required', min: { value: 1, message: 'Minimum floor is 1' } })}
                className={`w-full px-3 py-2 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] tabular-nums ${errors.floor ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'}`}
              />
              {errors.floor && <p className="text-[12px] text-red-600">{errors.floor.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                Capacity <span className="text-red-500">*</span>
              </label>
              <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Max number of occupants</p>
              <input
                type="number"
                min={1}
                max={10}
                {...register('capacity', { required: 'Capacity is required', min: { value: 1, message: 'Minimum 1' }, max: { value: 10, message: 'Maximum 10' } })}
                className={`w-full px-3 py-2 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] tabular-nums ${errors.capacity ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'}`}
              />
              {errors.capacity && <p className="text-[12px] text-red-600">{errors.capacity.message}</p>}
            </div>
          </div>

          {/* Rent per Month */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
              Rent per Month (USD) <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Base rent charged per occupant per month</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[hsl(var(--muted-foreground))]">$</span>
              <input
                type="number"
                min={0}
                step={50}
                {...register('rentPerMonth', {
                  required: 'Rent amount is required',
                  min: { value: 0, message: 'Rent cannot be negative' },
                })}
                className={`w-full pl-7 pr-4 py-2 text-[13px] border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] tabular-nums ${errors.rentPerMonth ? 'border-red-400 bg-red-50' : 'border-[hsl(var(--border))]'}`}
              />
            </div>
            {errors.rentPerMonth && <p className="text-[12px] text-red-600">{errors.rentPerMonth.message}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
              Initial Status <span className="text-red-500">*</span>
            </label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <AppSelect
                  ariaLabel="Initial room status"
                  fullWidth
                  value={field.value}
                  options={roomStatusOptions}
                  onChange={(value) => field.onChange(value as RoomStatus)}
                />
              )}
            />
          </div>

          {/* Amenities */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Amenities</label>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Comma-separated list, e.g. WiFi, AC, Private Bath</p>
            <input
              {...register('amenities')}
              placeholder="WiFi, AC, Shared Bath"
              className="w-full px-3 py-2 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Internal Notes</label>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Visible only to admins — not shown to tenants</p>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any notes about this room..."
              className="w-full px-3 py-2 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>

          {/* Required fields legend */}
          <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
            <span className="text-red-500">*</span> Required fields
          </p>
        </form>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-white rounded-b-2xl flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-room-form"
            disabled={saving}
            onClick={handleSubmit(onSubmit)}
            className="flex items-center gap-2 px-5 py-2 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 min-w-[120px] justify-center"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              isEdit ? 'Save Changes' : 'Add Room'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
