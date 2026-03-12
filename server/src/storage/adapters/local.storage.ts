import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { BaseStorageAdapter, StorageMetadata } from './base.storage';

export class LocalStorageAdapter extends BaseStorageAdapter {
  private rootDir: string;

  constructor(rootDir: string) {
    super();
    this.rootDir = path.resolve(rootDir);
  }

  private resolveSafePath(relativePath: string): string {
    const absolutePath = path.resolve(this.rootDir, relativePath);
    const normalizedRoot = `${this.rootDir}${path.sep}`;
    if (absolutePath !== this.rootDir && !absolutePath.startsWith(normalizedRoot)) {
      throw new Error('Invalid storage path');
    }
    return absolutePath;
  }

  /**
   * Builds a DMS folder structure from document metadata:
   *   {departmentCode}/{year}/{month}/{approvalAuthority}/{fileName}
   *
   * Example: HR/2026/03/CEO/HR-00001.pdf
   */
  async save(metadata: StorageMetadata, fileName: string, buffer: Buffer): Promise<string> {
    const date = new Date(metadata.letterDate);
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const safeAuthority = metadata.approvalAuthority.replace(/[^a-zA-Z0-9_-]/g, '_');

    const relativeDir = path.join(metadata.departmentCode, year, month, safeAuthority);
    const absoluteDir = path.join(this.rootDir, relativeDir);

    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(relativeDir, safeName);
    const absolutePath = path.join(this.rootDir, filePath);

    fs.writeFileSync(absolutePath, buffer);
    return filePath.replace(/\\/g, '/');
  }

  async archive(filePath: string): Promise<string | null> {
    const absolutePath = this.resolveSafePath(filePath);
    if (!fs.existsSync(absolutePath)) {
      return null;
    }

    const normalizedPath = filePath.replace(/\\/g, '/');
    const parsedPath = path.posix.parse(normalizedPath);
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const archiveDir = path.join(this.rootDir, 'archive', parsedPath.dir);
    const archivedFileName = `${parsedPath.name}__archived_${timestamp}${parsedPath.ext}`;
    const archivedAbsolutePath = path.join(archiveDir, archivedFileName);

    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    fs.renameSync(absolutePath, archivedAbsolutePath);
    return path.posix.join('archive', parsedPath.dir, archivedFileName);
  }

  async retrieve(filePath: string): Promise<Buffer> {
    const absolutePath = this.resolveSafePath(filePath);
    return fs.readFileSync(absolutePath);
  }

  async getReadStream(filePath: string): Promise<Readable> {
    const absolutePath = this.resolveSafePath(filePath);
    return fs.createReadStream(absolutePath);
  }

  async delete(filePath: string): Promise<void> {
    const absolutePath = this.resolveSafePath(filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const absolutePath = this.resolveSafePath(filePath);
    return fs.existsSync(absolutePath);
  }
}
