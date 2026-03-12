# SharePoint Integration Guide

This document captures the recommended steps to convert the current file storage in this project from local disk storage to SharePoint-backed storage without changing the intended business behavior of the application.

## Goal

The current application stores PDF files through the backend storage abstraction and keeps file metadata in the database. The safest migration path is:

- keep the current database model and business flows
- replace the storage implementation behind the backend
- use SharePoint as the document store through Microsoft Graph

## Recommended Architecture

Use backend-to-SharePoint integration with Microsoft Graph app-only authentication.

Reason:

- this project already uploads and downloads files from the backend
- the backend already has a storage abstraction
- this avoids exposing SharePoint credentials or Graph upload logic to the frontend

## Current Project Areas Relevant to the Change

The storage integration should align with these files:

- `server/src/storage/adapters/base.storage.ts`
- `server/src/storage/adapters/local.storage.ts`
- `server/src/storage/index.ts`
- `server/src/services/letterhead.service.ts`

The current folder structure is based on:

- `departmentCode/year/month/approvalAuthority/fileName`

This same structure should be preserved inside SharePoint folders.

## Implementation Steps

### 1. Register an Application in Microsoft Entra ID

Create an app registration for this backend service.

Collect these values:

- `TENANT_ID`
- `CLIENT_ID`
- `CLIENT_SECRET` or certificate credentials

Recommended authentication flow:

- OAuth 2.0 client credentials flow

Official reference:

- https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow

### 2. Grant SharePoint Access Permissions

Recommended permission model:

- `Sites.Selected`

Avoid broad tenant-wide permissions unless there is a real business need.

Official reference:

- https://learn.microsoft.com/en-us/graph/permissions-selected-overview

### 3. Grant the App Access to the Specific SharePoint Site

After admin consent, explicitly assign the app permission to the target SharePoint site.

Typical approach:

- resolve the target site
- grant write access to that specific site only

Official reference:

- https://learn.microsoft.com/en-us/graph/permissions-selected-overview

### 4. Identify the Target Site and Document Library

You need the following:

- SharePoint hostname, for example `contoso.sharepoint.com`
- site path, for example `/sites/LetterManagement`
- target document library name or drive ID

Official reference:

- https://learn.microsoft.com/en-us/graph/api/site-getbypath?view=graph-rest-1.0

### 5. Add Environment Variables to This Project

Add configuration similar to the following in `.env`:

```env
STORAGE_TYPE=sharepoint
MS_TENANT_ID=your-tenant-id
MS_CLIENT_ID=your-client-id
MS_CLIENT_SECRET=your-client-secret
SP_HOSTNAME=contoso.sharepoint.com
SP_SITE_PATH=/sites/LetterManagement
SP_LIBRARY_NAME=Documents
```

Suggested future config additions in `server/src/config/index.ts`:

- tenant ID
- client ID
- client secret
- SharePoint hostname
- site path
- document library name

## Code Changes to Make

### 6. Add a SharePoint Storage Adapter

Create a new file:

- `server/src/storage/adapters/sharepoint.storage.ts`

This adapter should implement the same contract as:

- `server/src/storage/adapters/base.storage.ts`

Required methods:

- `save(...)`
- `archive(...)`
- `retrieve(...)`
- `getReadStream(...)`
- `delete(...)`
- `exists(...)`

### 7. Update the Storage Factory

Update:

- `server/src/storage/index.ts`

So that:

- `STORAGE_TYPE=local` uses the existing local adapter
- `STORAGE_TYPE=sharepoint` uses the new SharePoint adapter

### 8. Keep the Current Folder Structure

The current local storage logic places files under:

- `{departmentCode}/{year}/{month}/{approvalAuthority}/{fileName}`

Preserve exactly the same logical structure in SharePoint folders.

Example:

- `HR/2026/03/CEO/HR-00001.pdf`

This minimizes application changes and keeps archival logic predictable.

### 9. Use Microsoft Graph for File Upload and Download

Use Microsoft Graph to:

- resolve the SharePoint site
- resolve the document library drive
- create folders if they do not exist
- upload files
- download files
- move archived files when attachments are replaced

Official upload reference:

- https://learn.microsoft.com/en-us/graph/api/driveitem-put-content?view=graph-rest-1.0

For larger files, use upload sessions instead of a single upload call.

### 10. Preserve the Existing Database Contract

Do not redesign the database for SharePoint unless necessary.

Keep using:

- `file_name`
- `file_path`
- `mime_type`
- `file_size_bytes`

Recommended approach:

- store the SharePoint-relative logical path in `file_path`
- optionally keep enough data to resolve the document from that path in the adapter

This keeps the rest of the backend logic unchanged.

### 11. Preserve Archive Behavior

This application already archives replaced files and records modification snapshots.

When moving to SharePoint:

- move the previous file into an `archive/...` folder path
- keep the same logical structure under archive
- continue storing archived path information in version history

Example:

- live path: `HR/2026/03/CEO/HR-00001.pdf`
- archived path: `archive/HR/2026/03/CEO/HR-00001__archived_YYYYMMDDHHMMSS.pdf`

## Suggested Development Sequence

Follow this order:

1. Verify Entra app registration works
2. Verify token acquisition works
3. Resolve site by path
4. Resolve document library / drive
5. Upload a single test PDF manually from code
6. Download the same file
7. Implement folder creation logic
8. Implement `save(...)`
9. Implement `getReadStream(...)`
10. Implement `archive(...)`
11. Switch `STORAGE_TYPE` to `sharepoint`
12. Test create letter flow
13. Test download flow
14. Test edit flow with attachment replacement
15. Test archive/version history flow

## Validation Checklist

After implementation, verify:

- login and standard business flows still work
- upload creates the correct SharePoint folder structure
- download returns the same file content
- replacing an attachment archives the previous file
- modification history still records archived attachment references
- file paths stored in DB are consistent
- no SharePoint credentials are exposed to the frontend

## Security Best Practices

When implementing the SharePoint integration:

- keep all Graph calls on the backend only
- prefer `Sites.Selected` over broad site permissions
- prefer certificate auth over client secret if available
- never expose Entra app credentials in frontend code
- do not log secrets or raw access tokens
- log failures with request IDs or correlation IDs only

## Suggested Future Files to Add

When you implement this later, likely files to add or update:

- `server/src/storage/adapters/sharepoint.storage.ts`
- `server/src/lib/graph-client.ts` or similar helper
- `server/src/config/index.ts`
- `server/src/storage/index.ts`
- `.env`

## References

- Client credentials flow:
  https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow

- Selected permissions overview:
  https://learn.microsoft.com/en-us/graph/permissions-selected-overview

- Resolve site by path:
  https://learn.microsoft.com/en-us/graph/api/site-getbypath?view=graph-rest-1.0

- Upload file content:
  https://learn.microsoft.com/en-us/graph/api/driveitem-put-content?view=graph-rest-1.0

## Final Note

The safest conversion strategy is not to redesign the app around SharePoint. Instead:

- keep the current database and service behavior
- replace only the storage implementation
- preserve folder structure and archive semantics

That approach will make the SharePoint migration much easier to implement and much safer to test.
