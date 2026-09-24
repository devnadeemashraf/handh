import { type DatabaseClient, sweepExpiredReservations } from '@hh/db';

export interface InventorySweeperOptions {
  intervalMs?: number | undefined;
}

/**
 * Runs a single pass of the inventory hold sweeper:
 * Identifies expired active reservations, restores reserved inventory levels,
 * cancels stale pending orders, and records outbox events.
 */
export async function runInventorySweeperPass(
  db: DatabaseClient,
  asOf: Date = new Date()
): Promise<{
  releasedReservationsCount: number;
  affectedVariantsCount: number;
  cancelledOrdersCount: number;
}> {
  const result = await sweepExpiredReservations(db, asOf);

  if (result.releasedReservationsCount > 0) {
    console.log(
      JSON.stringify({
        level: 'info',
        message: 'Inventory hold sweeper completed pass',
        releasedReservations: result.releasedReservationsCount,
        affectedVariants: result.affectedVariantsCount,
        cancelledOrders: result.cancelledOrdersCount,
        orderIds: result.orderIds
      })
    );
  }

  return {
    releasedReservationsCount: result.releasedReservationsCount,
    affectedVariantsCount: result.affectedVariantsCount,
    cancelledOrdersCount: result.cancelledOrdersCount
  };
}

/**
 * Starts continuous background sweeping for expired inventory holds (E-COM-043, E-COM-117).
 * Prevents re-entrancy / concurrent overlapping sweeps.
 * Returns an asynchronous teardown function that cleanly drains any in-flight pass (E-COM-160).
 */
export function startInventorySweeper(db: DatabaseClient, intervalMs = 60000): () => Promise<void> {
  let isSweeping = false;
  let isStopped = false;
  let activeSweepPromise: Promise<unknown> | null = null;

  const intervalId = setInterval(async () => {
    if (isSweeping || isStopped) return;
    isSweeping = true;

    try {
      activeSweepPromise = runInventorySweeperPass(db);
      await activeSweepPromise;
    } catch (err) {
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'Unhandled error during inventory sweeper pass',
          error: err instanceof Error ? err.message : String(err)
        })
      );
    } finally {
      isSweeping = false;
      activeSweepPromise = null;
    }
  }, intervalMs);

  return async () => {
    isStopped = true;
    clearInterval(intervalId);
    if (activeSweepPromise) {
      try {
        await activeSweepPromise;
      } catch {
        // error already logged
      }
    }
  };
}
