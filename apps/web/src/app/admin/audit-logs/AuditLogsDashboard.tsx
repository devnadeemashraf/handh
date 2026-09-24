'use client';

import {
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  User as UserIcon
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

import type { AdminAuditLogEntry } from '@hh/domain';

interface AuditLogsDashboardProps {
  initialLogs: AdminAuditLogEntry[];
  totalLogs: number;
}

export default function AuditLogsDashboard({ initialLogs, totalLogs }: AuditLogsDashboardProps) {
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/audit-logs?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch {
      // Keep existing state
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Entity type filter
      if (entityFilter !== 'all') {
        if (entityFilter === 'order' && log.entityType !== 'order') return false;
        if (
          entityFilter === 'inventory' &&
          !log.entityType.includes('inventory') &&
          !log.entityType.includes('product')
        )
          return false;
        if (entityFilter === 'settings' && !log.entityType.includes('settings')) return false;
        if (
          entityFilter === 'auth' &&
          !log.entityType.includes('admin') &&
          !log.entityType.includes('user')
        )
          return false;
        if (entityFilter === 'coupon' && !log.entityType.includes('coupon')) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesEmail = log.adminEmail.toLowerCase().includes(q);
        const matchesEntity = log.entityType.toLowerCase().includes(q);
        const matchesEntityId = (log.entityId ?? '').toLowerCase().includes(q);
        const matchesDetails = JSON.stringify(log.details).toLowerCase().includes(q);
        return matchesAction || matchesEmail || matchesEntity || matchesEntityId || matchesDetails;
      }

      return true;
    });
  }, [logs, entityFilter, searchQuery]);

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Timestamp',
      'Actor Email',
      'Action',
      'Entity Type',
      'Entity ID',
      'IP Address',
      'Details'
    ];
    const rows = filteredLogs.map((log) => [
      log.id,
      log.createdAt,
      log.adminEmail,
      log.action,
      log.entityType,
      log.entityId ?? '',
      log.ipAddress ?? '',
      JSON.stringify(log.details).replace(/"/g, '""')
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => `"${r.join('","')}"`)].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `admin-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('price') || action.includes('service_control') || action.includes('role')) {
      return 'destructive';
    }
    if (action.includes('status') || action.includes('return') || action.includes('pickup')) {
      return 'gold';
    }
    return 'outline';
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Administrative Mutation Audit Ledger
            </h1>
            <Badge variant="gold" className="text-xs uppercase tracking-wider font-semibold">
              <Shield className="mr-1 h-3 w-3 text-accent" />
              <span>Immutable</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Complete traceability and state-diff tracking across all operational, financial, and
            governance actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="text-xs h-9"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isRefreshing}
            className="text-xs h-9"
          >
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Log Entries
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground font-serif">{totalLogs}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Filtered Records
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground font-serif">
              {filteredLogs.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="p-4 pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Governance Status
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-foreground">
              Fail-Closed Traceability Active
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-card border-border shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by action, email, entity ID, or payload details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'order', label: 'Orders' },
                  { key: 'inventory', label: 'Inventory' },
                  { key: 'settings', label: 'Settings' },
                  { key: 'auth', label: 'Auth' },
                  { key: 'coupon', label: 'Coupons' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setEntityFilter(tab.key)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors',
                    entityFilter === tab.key
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="bg-card border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="font-medium text-sm">No audit logs found</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {searchQuery
                        ? 'Try modifying your search or filter criteria.'
                        : 'Admin actions will appear here once executed.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground/70" />
                        <span>{formatTimestamp(log.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{log.adminEmail}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant={getActionBadgeVariant(log.action)}
                        className="font-mono text-[10px]"
                      >
                        {log.action}
                      </Badge>
                    </td>

                    {/* Target Entity */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      <span className="text-foreground font-medium">{log.entityType}</span>
                      {log.entityId && (
                        <span className="ml-1 text-[10px] text-muted-foreground truncate max-w-[120px] inline-block align-bottom">
                          ({log.entityId})
                        </span>
                      )}
                    </td>

                    {/* Client IP */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {log.ipAddress || '—'}
                    </td>

                    {/* Details Action */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span>Inspect</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log Inspection Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-serif">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <span>Audit Record Details</span>
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-secondary/30 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Action
                  </span>
                  <span className="font-mono font-medium text-foreground">
                    {selectedLog.action}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Timestamp
                  </span>
                  <span className="font-mono text-foreground">{selectedLog.createdAt}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Actor
                  </span>
                  <span className="text-foreground">{selectedLog.adminEmail}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Entity
                  </span>
                  <span className="font-mono text-foreground">
                    {selectedLog.entityType} ({selectedLog.entityId || 'none'})
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Client IP
                  </span>
                  <span className="font-mono text-foreground">{selectedLog.ipAddress || '—'}</span>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    User Agent
                  </span>
                  <span className="text-foreground truncate block max-w-xs">
                    {selectedLog.userAgent || '—'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold mb-1">
                  Recorded Payload State Diffs
                </span>
                <pre className="bg-background text-foreground p-3 rounded-md font-mono text-[11px] overflow-x-auto max-h-60 border border-border">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedLog(null)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
