import { afterAll } from 'vitest';

import { closeSharedDbClients } from './index';

afterAll(async () => {
  await closeSharedDbClients();
});
