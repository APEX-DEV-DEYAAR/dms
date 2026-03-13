# Local Storage → SharePoint Migration Plan

## Prerequisites

1. Azure AD app registration with the following API permissions:
   - `Sites.ReadWrite.All` (Application)
   - `Files.ReadWrite.All` (Application)
2. SharePoint site with a document library created
3. npm packages installed: `npm install @microsoft/microsoft-graph-client @azure/identity`

## Step-by-step

### 1. Azure AD setup

1. Register an application in Azure AD → App registrations
2. Create a client secret under Certificates & secrets
3. Grant API permissions: Microsoft Graph → Application → `Sites.ReadWrite.All`, `Files.ReadWrite.All`
4. Admin consent granted for the tenant

### 2. Environment configuration

```env
STORAGE_TYPE=sharepoint
SP_TENANT_ID=your-tenant-id
SP_CLIENT_ID=your-client-id
SP_CLIENT_SECRET=your-client-secret
SP_SITE_ID=your-sharepoint-site-id
SP_DRIVE_ID=your-drive-id
SP_BASE_PATH=/DMS
```

To find `SP_SITE_ID` and `SP_DRIVE_ID`:
```bash
# Get site ID
curl -H "Authorization: Bearer $TOKEN" \
  "https://graph.microsoft.com/v1.0/sites/your-domain.sharepoint.com:/sites/YourSite"

# Get drive ID (document library)
curl -H "Authorization: Bearer $TOKEN" \
  "https://graph.microsoft.com/v1.0/sites/{site-id}/drives"
```

### 3. Implement SharePointStorageAdapter

Open `server/src/storage/adapters/sharepoint.storage.ts` and implement each method:

- **save()**: Upload file via `PUT /drives/{driveId}/root:{path}:/content`
  - For files >4MB, use upload session: `POST /drives/{driveId}/root:{path}:/createUploadSession`
- **archive()**: Move item via `PATCH /drives/{driveId}/items/{itemId}` with `parentReference`
- **retrieve()**: Download via `GET /drives/{driveId}/root:{path}:/content`
- **getReadStream()**: Same as retrieve but stream the response
- **delete()**: `DELETE /drives/{driveId}/items/{itemId}`
- **exists()**: `GET /drives/{driveId}/root:{path}` — 200 = exists, 404 = doesn't

### 4. Migrate existing files

Run a one-time migration script to upload all files from local storage to SharePoint:

```typescript
// migration script pseudocode
const localFiles = walkDir('./uploads');
for (const file of localFiles) {
  const buffer = fs.readFileSync(file.absolutePath);
  await sharePointAdapter.save(file.metadata, file.name, buffer);
  // Update database: letterheads.file_path = new SharePoint path
}
```

Update the `file_path` column in the database to reflect SharePoint paths.

### 5. Verify

1. Set `STORAGE_TYPE=sharepoint` in `.env`
2. Run `npm run dev`
3. Test: create a new letterhead → verify PDF appears in SharePoint
4. Test: download an existing letterhead → verify PDF streams correctly
5. Test: archive → verify file moves to archive folder in SharePoint
6. Verify all existing files are accessible via the new paths

### 6. Rollback plan

1. Keep local files intact during migration (copy, don't move)
2. If issues arise: set `STORAGE_TYPE=local` and restore original `file_path` values
3. Local files remain on disk as backup until SharePoint migration is verified

## Folder structure in SharePoint

The adapter maintains the same folder hierarchy as local storage:

```
/DMS
  /{DepartmentCode}
    /{Year}
      /{Month}
        /{ApprovalAuthority}
          /filename.pdf
  /archive
    /{DepartmentCode}
      /...
```

## Performance considerations

- SharePoint has throttling limits (~600 requests/min per app)
- Large file uploads (>4MB) should use resumable upload sessions
- Consider caching frequently accessed files locally if download latency is an issue
