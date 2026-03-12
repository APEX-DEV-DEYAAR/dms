import { Readable } from 'stream';

export interface StorageMetadata {
  departmentCode: string;
  letterDate: string;       // ISO date string (YYYY-MM-DD)
  approvalAuthority: string;
}

export abstract class BaseStorageAdapter {
  abstract save(metadata: StorageMetadata, fileName: string, buffer: Buffer): Promise<string>;
  abstract archive(filePath: string): Promise<string | null>;
  abstract retrieve(filePath: string): Promise<Buffer>;
  abstract getReadStream(filePath: string): Promise<Readable>;
  abstract delete(filePath: string): Promise<void>;
  abstract exists(filePath: string): Promise<boolean>;
}
