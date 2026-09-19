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
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Users size={24} style={{ color: '#C5A880' }} />
            <h1
              style={{
                fontFamily: 'serif',
                fontSize: '1.75rem',
                fontWeight: 600,
                color: '#FDFBF7',
                margin: 0
              }}
            >
              Patron &amp; Staff Directory
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#8BAAA0' }}>
            Role-based access management, phone verification status, and communication preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshUsers}
          disabled={isRefreshing}
          className="admin-btn-secondary"
          style={{ minHeight: '40px', padding: '8px 16px' }}
        >
          <RefreshCw
            size={15}
            style={{
              color: '#C5A880',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}
          />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Directory'}</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div
          style={{
            backgroundColor: '#0E2A21',
            border: '1px solid #1F5242',
            borderRadius: '10px',
            padding: '16px 20px'
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: '#8BAAA0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Total Registered
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FDFBF7', marginTop: '4px' }}>
            {metrics.total}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0E2A21',
            border: '1px solid #1F5242',
            borderRadius: '10px',
            padding: '16px 20px'
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: '#8BAAA0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Phone Verified
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4ADE80', marginTop: '4px' }}>
            {metrics.verified}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0E2A21',
            border: '1px solid #1F5242',
            borderRadius: '10px',
            padding: '16px 20px'
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: '#8BAAA0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            WhatsApp Concierge Opted
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#C5A880', marginTop: '4px' }}>
            {metrics.whatsappOpted}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0E2A21',
            border: '1px solid #1F5242',
            borderRadius: '10px',
            padding: '16px 20px'
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: '#8BAAA0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Store Administrators
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#60A5FA', marginTop: '4px' }}>
            {metrics.staff}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid #4ADE80',
            borderRadius: '8px',
            color: '#4ADE80',
            fontSize: '0.875rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(248, 113, 113, 0.15)',
            border: '1px solid #F87171',
            borderRadius: '8px',
            color: '#F87171',
            fontSize: '0.875rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShieldAlert size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: '#0E2A21',
          border: '1px solid #1F5242',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '24px'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8BAAA0'
            }}
          />
          <input
            type="text"
            placeholder="Search by name, phone (+91), or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: '#081F18',
              border: '1px solid #1F5242',
              borderRadius: '6px',
              color: '#FDFBF7',
              fontSize: '0.875rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Role Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['all', 'customer', 'admin', 'super_admin'] as const).map((r) => {
            const isActive = roleFilter === r;
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
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 500,
                  border: '1px solid',
                  borderColor: isActive ? '#C5A880' : '#1F5242',
                  backgroundColor: isActive ? 'rgba(197, 168, 128, 0.15)' : 'transparent',
                  color: isActive ? '#C5A880' : '#8BAAA0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          backgroundColor: '#0E2A21',
          border: '1px solid #1F5242',
          borderRadius: '10px',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1F5242', backgroundColor: '#09231B' }}>
                <th
                  style={{
                    padding: '14px 18px',
                    fontSize: '0.75rem',
                    color: '#8BAAA0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Patron / Contact
                </th>
                <th
                  style={{
                    padding: '14px 18px',
                    fontSize: '0.75rem',
                    color: '#8BAAA0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Role &amp; Permissions
                </th>
                <th
                  style={{
                    padding: '14px 18px',
                    fontSize: '0.75rem',
                    color: '#8BAAA0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  WhatsApp Concierge
                </th>
                <th
                  style={{
                    padding: '14px 18px',
                    fontSize: '0.75rem',
                    color: '#8BAAA0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Last Active
                </th>
                <th
                  style={{
                    padding: '14px 18px',
                    fontSize: '0.75rem',
                    color: '#8BAAA0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Registered
                </th>
                {isSuperAdmin && (
                  <th
                    style={{
                      padding: '14px 18px',
                      fontSize: '0.75rem',
                      color: '#8BAAA0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: 'right'
                    }}
                  >
                    Access Control
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 6 : 5}
                    style={{ padding: '48px 24px', textAlign: 'center', color: '#8BAAA0' }}
                  >
                    No patrons or staff match the current search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === currentUserId;

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid rgba(31, 82, 66, 0.5)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Name & Phone */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#164335',
                              border: '1px solid #235847',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#C5A880',
                              fontWeight: 600,
                              fontSize: '0.85rem'
                            }}
                          >
                            {u.name ? u.name[0]?.toUpperCase() : <UserIcon size={16} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#FDFBF7', fontSize: '0.9rem' }}>
                              {u.name || 'Anonymous Patron'}
                              {isSelf && (
                                <span
                                  style={{
                                    marginLeft: '6px',
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(197, 168, 128, 0.2)',
                                    color: '#C5A880'
                                  }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                color: '#8BAAA0',
                                marginTop: '2px'
                              }}
                            >
                              <span>{u.phone}</span>
                              {u.phoneVerified && (
                                <span
                                  title="Verified mobile number"
                                  style={{ color: '#4ADE80', display: 'inline-flex' }}
                                >
                                  <CheckCircle2 size={13} />
                                </span>
                              )}
                              {u.email && <span>• {u.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '16px 18px' }}>
                        {u.role === 'super_admin' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: 'rgba(197, 168, 128, 0.18)',
                              color: '#F3E8D6',
                              border: '1px solid #C5A880',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}
                          >
                            <Crown size={12} color="#C5A880" />
                            <span>Super Admin</span>
                          </span>
                        )}
                        {u.role === 'admin' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: 'rgba(74, 222, 128, 0.12)',
                              color: '#4ADE80',
                              border: '1px solid rgba(74, 222, 128, 0.3)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}
                          >
                            <ShieldCheck size={12} />
                            <span>Admin</span>
                          </span>
                        )}
                        {u.role === 'customer' && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              backgroundColor: '#164335',
                              color: '#8BAAA0',
                              border: '1px solid #1F5242'
                            }}
                          >
                            <UserIcon size={12} />
                            <span>Customer</span>
                          </span>
                        )}
                      </td>

                      {/* WhatsApp Concierge */}
                      <td style={{ padding: '16px 18px' }}>
                        {u.whatsappOptIn ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.8rem',
                              color: '#4ADE80'
                            }}
                          >
                            <MessageSquare size={14} />
                            <span>Subscribed</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#8BAAA0' }}>Unsubscribed</span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td style={{ padding: '16px 18px', fontSize: '0.8rem', color: '#8BAAA0' }}>
                        {formatDate(u.lastLoginAt)}
                      </td>

                      {/* Created At */}
                      <td style={{ padding: '16px 18px', fontSize: '0.8rem', color: '#8BAAA0' }}>
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions (Super Admin Only) */}
                      {isSuperAdmin && (
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenRoleModal(u)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              backgroundColor: 'transparent',
                              border: '1px solid #235847',
                              color: '#C5A880',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Change Role
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: '#0E2A21',
              border: '1px solid #235847',
              borderRadius: '12px',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}
            >
              <Shield size={22} style={{ color: '#C5A880' }} />
              <h2 style={{ fontFamily: 'serif', fontSize: '1.25rem', color: '#FDFBF7', margin: 0 }}>
                Modify Access Role
              </h2>
            </div>

            <p
              style={{
                fontSize: '0.875rem',
                color: '#8BAAA0',
                lineHeight: 1.6,
                marginBottom: '20px'
              }}
            >
              Configure operational clearance for{' '}
              <strong style={{ color: '#FDFBF7' }}>
                {selectedUser.name || selectedUser.phone}
              </strong>
              .
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#8BAAA0',
                  marginBottom: '8px'
                }}
              >
                Select Role
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isSelected ? '#C5A880' : '#1F5242',
                        backgroundColor: isSelected ? 'rgba(197, 168, 128, 0.1)' : '#081F18',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value={r}
                        checked={isSelected}
                        onChange={() => setTargetRole(r)}
                        style={{ marginTop: '2px', accentColor: '#C5A880' }}
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: isSelected ? '#C5A880' : '#FDFBF7',
                            fontSize: '0.85rem'
                          }}
                        >
                          {r.replace('_', ' ').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8BAAA0', marginTop: '2px' }}>
                          {descriptions[r]}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCloseRoleModal}
                disabled={isUpdatingRole}
                className="admin-btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={isUpdatingRole}
                className="admin-btn-primary"
                style={{ padding: '8px 18px' }}
              >
                {isUpdatingRole ? 'Updating...' : 'Save Role Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
