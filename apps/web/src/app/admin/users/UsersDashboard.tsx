'use client';

import {
  CheckCircle2,
  Crown,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Users
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { type User, USER_ROLES, type UserRole } from '@hh/domain';

interface UsersDashboardProps {
  initialUsers: User[];
  currentUserRole: UserRole;
  currentUserId?: string | undefined;
}

export default function UsersDashboard({
  initialUsers,
  currentUserRole,
  currentUserId
}: UsersDashboardProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'admin' | 'super_admin'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Role change modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('customer');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const isSuperAdmin = currentUserRole === 'super_admin';

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setActionError(null);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const showError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 5000);
  };

  const refreshUsers = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.users)) {
        setUsers(data.users);
        showSuccess('User directory refreshed.');
      } else {
        showError(data.error || 'Failed to refresh users.');
      }
    } catch {
      showError('Network error while refreshing directory.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.phone.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const metrics = useMemo(() => {
    const total = users.length;
    const verified = users.filter((u) => u.phoneVerified).length;
    const whatsappOpted = users.filter((u) => u.whatsappOptIn).length;
    const staff = users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length;
    return { total, verified, whatsappOpted, staff };
  }, [users]);

  const handleOpenRoleModal = (u: User) => {
    setSelectedUser(u);
    setTargetRole(u.role);
  };

  const handleCloseRoleModal = () => {
    setSelectedUser(null);
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser) return;
    if (selectedUser.id === currentUserId && targetRole !== 'super_admin') {
      showError('You cannot demote your own Super Admin account.');
      return;
    }

    setIsUpdatingRole(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user role.');
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, role: targetRole } : u))
      );
      showSuccess(
        `Updated ${selectedUser.name || selectedUser.phone} to ${targetRole.replace('_', ' ').toUpperCase()}`
      );
      setSelectedUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error modifying user role.';
      showError(msg);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return 'Never';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              Patron &amp; Staff Directory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Role-based access management, phone verification status, and communication preferences.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={refreshUsers}
          disabled={isRefreshing}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={cn('h-4 w-4 text-accent', isRefreshing && 'animate-spin')} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Directory'}</span>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Registered
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
              {metrics.total}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Phone Verified
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div className="text-2xl sm:text-3xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
              {metrics.verified}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              WhatsApp Concierge Opted
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div className="text-2xl sm:text-3xl font-bold font-serif text-accent">
              {metrics.whatsappOpted}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Store Administrators
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div className="text-2xl sm:text-3xl font-bold font-serif text-blue-500">
              {metrics.staff}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name, phone (+91), or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-10 text-xs"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="inline-flex rounded-lg border border-border bg-card p-1 shadow-xs overflow-x-auto max-w-full">
          {(['all', 'customer', 'admin', 'super_admin'] as const).map((r) => {
            const labels: Record<string, string> = {
              all: 'All Patrons',
              customer: 'Customers',
              admin: 'Admins',
              super_admin: 'Super Admins'
            };

            return (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors select-none whitespace-nowrap',
                  roleFilter === r
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Patron / Contact
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Role &amp; Permissions
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  WhatsApp Concierge
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Last Active
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Registered
                </th>
                {isSuperAdmin && (
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Access Control
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 6 : 5}
                    className="py-12 px-4 text-center text-muted-foreground text-xs"
                  >
                    No patrons or staff match the current search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === currentUserId;

                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      {/* Name & Phone */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent/15 border border-border flex items-center justify-center text-accent font-semibold text-xs shrink-0">
                            {u.name ? u.name[0]?.toUpperCase() : <UserIcon className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-medium text-foreground text-sm flex items-center gap-1.5">
                              <span>{u.name || 'Anonymous Patron'}</span>
                              {isSelf && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 font-semibold text-accent"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <span>{u.phone}</span>
                              {u.phoneVerified && (
                                <span
                                  title="Verified mobile number"
                                  className="text-emerald-500 inline-flex"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </span>
                              )}
                              {u.email && <span>&bull; {u.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3">
                        {u.role === 'super_admin' && (
                          <Badge
                            variant="outline"
                            className="border-accent/50 text-accent font-semibold text-xs gap-1"
                          >
                            <Crown className="h-3 w-3" />
                            <span>Super Admin</span>
                          </Badge>
                        )}
                        {u.role === 'admin' && (
                          <Badge
                            variant="secondary"
                            className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs gap-1 border-emerald-500/30"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            <span>Admin</span>
                          </Badge>
                        )}
                        {u.role === 'customer' && (
                          <Badge variant="outline" className="text-muted-foreground text-xs gap-1">
                            <UserIcon className="h-3 w-3" />
                            <span>Customer</span>
                          </Badge>
                        )}
                      </td>

                      {/* WhatsApp Concierge */}
                      <td className="px-4 py-3 text-xs">
                        {u.whatsappOptIn ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Subscribed</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Unsubscribed</span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(u.lastLoginAt)}
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions (Super Admin Only) */}
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenRoleModal(u)}
                            className="h-7 px-3 text-xs text-accent border-border hover:bg-muted"
                          >
                            Change Role
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Role Change Modal */}
      <Dialog
        open={Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) handleCloseRoleModal();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <DialogTitle className="font-serif text-xl">Modify Access Role</DialogTitle>
            </div>
          </DialogHeader>

          {selectedUser && (
            <div className="flex flex-col gap-4 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure operational clearance for{' '}
                <strong className="text-foreground">
                  {selectedUser.name || selectedUser.phone}
                </strong>
                .
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Role
                </label>

                <div className="flex flex-col gap-2">
                  {USER_ROLES.map((r) => {
                    const isSelected = targetRole === r;
                    const descriptions: Record<UserRole, string> = {
                      customer: 'Standard storefront access, profile, wishlist & order history.',
                      admin: 'Workshop operations, order fulfillment, inventory & catalog control.',
                      super_admin:
                        'Full master governance including role assignment and brand policies.'
                    };

                    return (
                      <label
                        key={r}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-xs',
                          isSelected
                            ? 'border-accent bg-accent/10 shadow-xs'
                            : 'border-border bg-card hover:bg-muted/30'
                        )}
                      >
                        <input
                          type="radio"
                          name="userRole"
                          value={r}
                          checked={isSelected}
                          onChange={() => setTargetRole(r)}
                          className="mt-0.5 accent-primary"
                        />
                        <div>
                          <div
                            className={cn(
                              'font-semibold text-xs',
                              isSelected ? 'text-accent' : 'text-foreground'
                            )}
                          >
                            {r.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-muted-foreground text-[11px] mt-0.5">
                            {descriptions[r]}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseRoleModal} disabled={isUpdatingRole}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRoleChange} disabled={isUpdatingRole}>
              {isUpdatingRole ? 'Updating...' : 'Save Role Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
