import { createDbClient, listAdminInventory, listInventoryAuditLogs } from '@hh/db';
import InventoryManager from './InventoryManager';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export default async function AdminInventoryPage() {
  const db = getDatabase();

  const [inventoryData, auditLogs] = await Promise.all([
    listAdminInventory(db),
    listInventoryAuditLogs(db, undefined, 50)
  ]);

  return (
    <InventoryManager
      initialItems={inventoryData.items}
      initialSummary={inventoryData.summary}
      initialAuditLogs={auditLogs}
    />
  );
}
