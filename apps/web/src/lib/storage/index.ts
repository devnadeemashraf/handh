import { LocalStorageAdapter } from './local-storage.adapter';

import type { StorageProvider } from './types';

export * from './local-storage.adapter';
export * from './types';

let instance: StorageProvider | null = null;

/**
 * Storage factory - returns active storage provider based on environment.
 * Default is LocalStorageAdapter; can be swapped to S3StorageAdapter or R2StorageAdapter.
 */
export function getStorageProvider(): StorageProvider {
  if (!instance) {
    instance = new LocalStorageAdapter();
  }
  return instance;
}
