'use client';

import { Check, Edit2, MapPin, Plus, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { triggerHaptic } from '@/lib/haptic';

import { INDIAN_STATES } from '@hh/domain';

import type { UserAddress } from '@hh/domain';

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    label: 'Home',
    recipientName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: 'Telangana',
    postalCode: '',
    isDefault: false
  });

  const loadAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses');
      const data = await res.json();
      if (data.success && Array.isArray(data.addresses)) {
        setAddresses(data.addresses);
      }
    } catch {
      setError('Failed to load address book.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setFormData({
      label: 'Home',
      recipientName: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: 'Telangana',
      postalCode: '',
      isDefault: addresses.length === 0
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (addr: UserAddress) => {
    setEditingAddress(addr);
    setFormData({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const endpoint = editingAddress
      ? `/api/user/addresses/${editingAddress.id}`
      : '/api/user/addresses';
    const method = editingAddress ? 'PATCH' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save address.');
        return;
      }

      setShowAddModal(false);
      triggerHaptic('success');
      addToast({
        title: 'Address saved',
        description: 'Your delivery address has been saved.'
      });
      await loadAddresses();
    } catch {
      setError('Network error while saving address.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this delivery address?')) return;

    try {
      await fetch(`/api/user/addresses/${id}`, { method: 'DELETE' });
      triggerHaptic('medium');
      addToast({
        title: 'Address removed',
        description: 'Delivery destination removed from your account.'
      });
      await loadAddresses();
    } catch {
      setError('Failed to delete address.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`/api/user/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true })
      });
      triggerHaptic('selection');
      addToast({
        title: 'Default address updated',
        description: 'Primary delivery address set.'
      });
      await loadAddresses();
    } catch {
      setError('Failed to set default address.');
    }
  };

  return (
    <div className="bg-card rounded-md border border-border/80 p-6 sm:p-8 shadow-xs flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground tracking-tight mb-1">
            Saved Delivery Addresses
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Manage shipping destinations for swift, single-tap checkout.
          </p>
        </div>

        <Button
          onClick={() => {
            triggerHaptic('selection');
            handleOpenAdd();
          }}
          className="gap-2 h-9 px-4 text-xs font-medium bg-royal hover:bg-royal/90 text-white rounded-sm active:scale-[0.98] transition-transform"
        >
          <Plus className="h-3.5 w-3.5" /> Add Address
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-destructive text-xs sm:text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm py-8 text-center animate-pulse">
          Loading addresses...
        </p>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 max-w-sm mx-auto">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <MapPin className="h-6 w-6" />
          </div>
          <p className="font-serif text-lg font-medium text-foreground mb-1">No Saved Addresses</p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">
            Save your home or work destination for seamless doorstep delivery.
          </p>
          <Button
            onClick={() => {
              triggerHaptic('selection');
              handleOpenAdd();
            }}
            className="px-5 h-9 text-xs font-medium bg-royal hover:bg-royal/90 text-white rounded-sm active:scale-[0.98] transition-transform"
          >
            Add First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-md p-5 relative border transition-all ${
                addr.isDefault
                  ? 'border-royal ring-1 ring-royal/20 bg-royal/5'
                  : 'border-border/80 bg-card hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground bg-secondary px-2 py-0.5 rounded-sm">
                  {addr.label}
                </span>

                {addr.isDefault && (
                  <Badge
                    variant="outline"
                    className="gap-1 bg-royal/10 text-royal border-royal/30 font-medium text-xs rounded-sm"
                  >
                    <Check className="h-3 w-3" /> Default
                  </Badge>
                )}
              </div>

              <p className="font-semibold text-sm text-foreground mb-1">{addr.recipientName}</p>
              <p className="text-xs text-muted-foreground">{addr.line1}</p>
              {addr.line2 && <p className="text-xs text-muted-foreground">{addr.line2}</p>}
              <p className="text-xs text-muted-foreground mb-2">
                {addr.city}, {addr.state} — {addr.postalCode}
              </p>
              <p className="text-xs font-medium text-foreground mb-4 font-mono tabular-nums">
                Phone: {addr.phone}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-border/60 pt-3">
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      handleSetDefault(addr.id);
                    }}
                    className="text-xs font-semibold text-royal hover:underline cursor-pointer p-0"
                  >
                    Set Default
                  </button>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      handleOpenEdit(addr);
                    }}
                    aria-label="Edit address"
                    className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer rounded-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('heavy');
                      handleDelete(addr.id);
                    }}
                    aria-label="Delete address"
                    className="text-destructive/80 hover:text-destructive p-1 transition-colors cursor-pointer rounded-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal (Strict 4px Radius) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card rounded-md border border-border/80 overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="bg-secondary/40 px-6 py-4 border-b border-border/60 flex items-center justify-between">
              <h2 className="font-serif text-lg font-medium text-foreground">
                {editingAddress ? 'Edit Delivery Address' : 'New Delivery Address'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-sm"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Label</label>
                  <Input
                    type="text"
                    required
                    placeholder="Home / Work"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="h-9 text-xs rounded-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Recipient Name
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Full recipient name"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="h-9 text-xs rounded-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Delivery Contact Phone (+91)
                </label>
                <Input
                  type="tel"
                  required
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-9 text-xs rounded-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Address Line 1
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Flat / Villa / Street"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  className="h-9 text-xs rounded-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Address Line 2 (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="Apartment name, Landmark"
                  value={formData.line2}
                  onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                  className="h-9 text-xs rounded-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">City</label>
                  <Input
                    type="text"
                    required
                    placeholder="Hyderabad"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-9 text-xs rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full h-9 rounded-sm border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    PIN Code
                  </label>
                  <Input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="500034"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="h-9 text-xs rounded-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded-sm border-border text-royal accent-royal h-4 w-4"
                />
                <span className="text-xs text-foreground font-medium">
                  Set as default delivery address
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="h-9 text-xs rounded-sm border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 text-xs font-medium bg-royal hover:bg-royal/90 text-white rounded-sm active:scale-[0.98] transition-transform"
                >
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
