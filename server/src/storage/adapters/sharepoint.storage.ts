import { ClientSecretCredential } from '@azure/identity';
import { Readable } from 'stream';
import { BaseStorageAdapter, StorageMetadata } from './base.storage';

interface SharePointConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  siteId: string;
  driveId: string;
  basePath: string;
}

interface GraphItem {
  id: string;
  name: string;
  parentReference?: {
    path?: string;
  };
}

interface UploadSession {
  uploadUrl: string;
}

export class SharePointStorageAdapter extends BaseStorageAdapter {
  private readonly config: SharePointConfig;
  private readonly credential: ClientSecretCredential;
  private accessToken: { token: string; expiresAt: number } | null = null;

  constructor(config: SharePointConfig) {
    super();
    this.config = {
      ...config,
      basePath: this.normalizeBasePath(config.basePath),
    };

    this.validateDependencies();
    this.validateConfig();
    this.credential = new ClientSecretCredential(
      this.config.tenantId,
      this.config.clientId,
      this.config.clientSecret
    );
  }

  private validateDependencies(): void {
    try {
      require('@microsoft/microsoft-graph-client');
      require('@azure/identity');
    } catch {
      throw new Error(
        'Cannot use SharePoint storage: required packages are not installed.\n' +
        'Run `npm install @microsoft/microsoft-graph-client @azure/identity` ' +
        'before setting STORAGE_TYPE=sharepoint.'
      );
    }
  }

  private validateConfig(): void {
    const missing = Object.entries(this.config)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(`Missing SharePoint configuration values: ${missing.join(', ')}`);
    }
  }

  private normalizeBasePath(basePath: string): string {
    const trimmed = (basePath || '').trim().replace(/\\/g, '/');
    const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return withLeadingSlash.replace(/\/+$/, '') || '/';
  }

  private sanitizeSegment(value: string): string {
    return value.replace(/[<>:"/\\|?*\x00-\x1F#%&{}~]/g, '_').trim() || 'unknown';
  }

  private encodePath(remotePath: string): string {
    return remotePath
      .split('/')
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) {
      return this.accessToken.token;
    }

    const token = await this.credential.getToken('https://graph.microsoft.com/.default');
    if (!token) {
      throw new Error('Failed to acquire Microsoft Graph access token');
    }

    this.accessToken = {
      token: token.token,
      expiresAt: token.expiresOnTimestamp,
    };

    return token.token;
  }

  private async graphRequest<T>(path: string, init: RequestInit = {}, allowNotFound = false): Promise<T | null> {
    const token = await this.getAccessToken();
    const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body instanceof Buffer ? { 'Content-Type': 'application/octet-stream' } : {}),
        ...(init.body && !(init.body instanceof Buffer) ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    });

    if (allowNotFound && response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(`SharePoint request failed (${response.status}): ${details || response.statusText}`);
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return null;
  }

  private async graphBinary(path: string): Promise<Response> {
    const token = await this.getAccessToken();
    const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(`SharePoint binary request failed (${response.status}): ${details || response.statusText}`);
    }

    return response;
  }

  private buildFolderPath(metadata: StorageMetadata): string {
    const date = new Date(metadata.letterDate);
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const safeAuthority = this.sanitizeSegment(metadata.approvalAuthority);
    const deptCode = this.sanitizeSegment(metadata.departmentCode);

    return `${this.config.basePath}/${deptCode}/${year}/${month}/${safeAuthority}`;
  }

  private buildArchivePath(filePath: string): { directory: string; name: string } {
    const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    const directory = lastSlashIndex >= 0 ? normalizedPath.slice(0, lastSlashIndex) : '';
    const fileName = lastSlashIndex >= 0 ? normalizedPath.slice(lastSlashIndex + 1) : normalizedPath;
    const extIndex = fileName.lastIndexOf('.');
    const name = extIndex >= 0 ? fileName.slice(0, extIndex) : fileName;
    const ext = extIndex >= 0 ? fileName.slice(extIndex) : '';
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

    return {
      directory: `${this.config.basePath}/archive/${directory}`.replace(/\/+/g, '/'),
      name: `${name}__archived_${timestamp}${ext}`,
    };
  }

  private async ensureFolder(folderPath: string): Promise<void> {
    const normalized = folderPath.replace(/\/+/g, '/').replace(/^\/+/, '');
    const segments = normalized.split('/').filter(Boolean);
    let current = '';

    for (const segment of segments) {
      current = `${current}/${segment}`;
      const encodedCurrent = this.encodePath(current);
      const existing = await this.graphRequest<GraphItem>(
        `/drives/${this.config.driveId}/root:/${encodedCurrent}`,
        {},
        true
      );

      if (existing) {
        continue;
      }

      const parent = current.split('/').slice(0, -1).join('/');
      const parentPath = parent ? `/${this.encodePath(parent)}` : '';
      await this.graphRequest(
        `/drives/${this.config.driveId}/root:${parentPath}:/children`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: segment,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'replace',
          }),
        }
      );
    }
  }

  private async getItemByPath(filePath: string): Promise<GraphItem | null> {
    const encodedPath = this.encodePath(filePath.replace(/\\/g, '/').replace(/^\/+/, ''));
    return this.graphRequest<GraphItem>(
      `/drives/${this.config.driveId}/root:/${encodedPath}`,
      {},
      true
    );
  }

  private async uploadSmallFile(remotePath: string, buffer: Buffer): Promise<void> {
    const encodedPath = this.encodePath(remotePath);
    await this.graphRequest(
      `/drives/${this.config.driveId}/root:/${encodedPath}:/content`,
      {
        method: 'PUT',
        body: buffer,
      }
    );
  }

  private async uploadLargeFile(remotePath: string, buffer: Buffer): Promise<void> {
    const encodedPath = this.encodePath(remotePath);
    const session = await this.graphRequest<UploadSession>(
      `/drives/${this.config.driveId}/root:/${encodedPath}:/createUploadSession`,
      {
        method: 'POST',
        body: JSON.stringify({
          item: {
            '@microsoft.graph.conflictBehavior': 'replace',
          },
        }),
      }
    );

    if (!session?.uploadUrl) {
      throw new Error('Failed to create SharePoint upload session');
    }

    const chunkSize = 320 * 1024 * 10;
    for (let start = 0; start < buffer.length; start += chunkSize) {
      const end = Math.min(start + chunkSize, buffer.length);
      const chunk = buffer.subarray(start, end);
      const response = await fetch(session.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': String(chunk.length),
          'Content-Range': `bytes ${start}-${end - 1}/${buffer.length}`,
        },
        body: chunk,
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(`SharePoint chunk upload failed (${response.status}): ${details || response.statusText}`);
      }
    }
  }

  async save(metadata: StorageMetadata, fileName: string, buffer: Buffer): Promise<string> {
    const folder = this.buildFolderPath(metadata);
    await this.ensureFolder(folder);

    const safeName = this.sanitizeSegment(fileName);
    const remotePath = `${folder}/${safeName}`.replace(/\/+/g, '/').replace(/^\/+/, '');

    if (buffer.length > 4 * 1024 * 1024) {
      await this.uploadLargeFile(remotePath, buffer);
    } else {
      await this.uploadSmallFile(remotePath, buffer);
    }

    return remotePath;
  }

  async archive(filePath: string): Promise<string | null> {
    const item = await this.getItemByPath(filePath);
    if (!item) {
      return null;
    }

    const archiveTarget = this.buildArchivePath(filePath);
    await this.ensureFolder(archiveTarget.directory);

    const parentReferencePath = `/drives/${this.config.driveId}/root:/${this.encodePath(archiveTarget.directory.replace(/^\/+/, ''))}`;
    await this.graphRequest(
      `/drives/${this.config.driveId}/items/${item.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          parentReference: {
            path: parentReferencePath,
          },
          name: archiveTarget.name,
        }),
      }
    );

    return `${archiveTarget.directory.replace(/^\/+/, '')}/${archiveTarget.name}`.replace(/\/+/g, '/');
  }

  async retrieve(filePath: string): Promise<Buffer> {
    const encodedPath = this.encodePath(filePath.replace(/\\/g, '/').replace(/^\/+/, ''));
    const response = await this.graphBinary(`/drives/${this.config.driveId}/root:/${encodedPath}:/content`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async getReadStream(filePath: string): Promise<Readable> {
    const encodedPath = this.encodePath(filePath.replace(/\\/g, '/').replace(/^\/+/, ''));
    const response = await this.graphBinary(`/drives/${this.config.driveId}/root:/${encodedPath}:/content`);
    if (!response.body) {
      throw new Error('SharePoint response did not include a stream body');
    }

    return Readable.fromWeb(response.body as never);
  }

  async delete(filePath: string): Promise<void> {
    const item = await this.getItemByPath(filePath);
    if (!item) {
      return;
    }

    await this.graphRequest(
      `/drives/${this.config.driveId}/items/${item.id}`,
      {
        method: 'DELETE',
      }
    );
  }

  async exists(filePath: string): Promise<boolean> {
    const item = await this.getItemByPath(filePath);
    return !!item;
  }
}
