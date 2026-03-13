import { config } from '../config';
import { STORAGE_TYPES } from '../shared/constants';
import { BaseStorageAdapter } from './adapters/base.storage';
import { LocalStorageAdapter } from './adapters/local.storage';

export function createStorageAdapter(): BaseStorageAdapter {
  switch (config.storage.type) {
    case STORAGE_TYPES.LOCAL:
      return new LocalStorageAdapter(config.storage.root);

    case STORAGE_TYPES.SHAREPOINT: {
      // Lazy-import to avoid requiring graph packages when not in use
      const { SharePointStorageAdapter } = require('./adapters/sharepoint.storage');
      return new SharePointStorageAdapter(config.storage.sharepoint);
    }

    default:
      throw new Error(
        `Unsupported STORAGE_TYPE: "${config.storage.type}". Supported: ${Object.values(STORAGE_TYPES).join(', ')}`
      );
  }
}

export { BaseStorageAdapter };
export type { StorageMetadata } from './adapters/base.storage';
