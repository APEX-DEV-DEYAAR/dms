import { config } from '../config';
import { BaseStorageAdapter } from './adapters/base.storage';
import { LocalStorageAdapter } from './adapters/local.storage';

export function createStorageAdapter(): BaseStorageAdapter {
  switch (config.storage.type) {
    case 'local':
      return new LocalStorageAdapter(config.storage.root);
    default:
      return new LocalStorageAdapter(config.storage.root);
  }
}

export { BaseStorageAdapter };
export type { StorageMetadata } from './adapters/base.storage';
