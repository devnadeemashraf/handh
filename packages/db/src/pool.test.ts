import { describe, expect, it } from 'vitest';

import { getSharedDbClient } from './index';

describe('Shared Database Connection Pooling (E-COM-072, E-COM-090)', () => {
  const primaryUrl = 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const secondaryUrl = 'postgres://postgres:postgres@localhost:5432/hh_test_secondary';

  it('reuses identical singleton instance across multiple getSharedDbClient invocations', () => {
    const client1 = getSharedDbClient(primaryUrl);
    const client2 = getSharedDbClient(primaryUrl);
    const client3 = getSharedDbClient(primaryUrl);

    expect(client1).toBeDefined();
    expect(client2).toBe(client1);
    expect(client3).toBe(client1);
  });

  it('maintains distinct isolated pools for different database connection strings', () => {
    const clientPrimary = getSharedDbClient(primaryUrl);
    const clientSecondary = getSharedDbClient(secondaryUrl);

    expect(clientPrimary).toBeDefined();
    expect(clientSecondary).toBeDefined();
    expect(clientSecondary).not.toBe(clientPrimary);

    // Subsequent retrieval of secondary returns the cached secondary
    const clientSecondaryAgain = getSharedDbClient(secondaryUrl);
    expect(clientSecondaryAgain).toBe(clientSecondary);
  });
});
