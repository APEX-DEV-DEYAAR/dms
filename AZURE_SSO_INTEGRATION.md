# Azure SSO Integration Guide

This document captures the recommended approach for integrating this project with Microsoft Entra ID (Azure AD) for Single Sign-On without changing the intended business behavior of the application.

## Goal

Enable users to sign in with Microsoft Entra ID while keeping the current application authorization model intact.

That means:

- use Azure / Entra ID for identity and login
- keep this app's existing local roles and permissions
- avoid rewriting the entire backend authorization model

## Recommended Architecture

Use Microsoft Entra ID for authentication and keep the current backend-issued local JWT for application access.

Recommended login sequence:

1. User clicks `Sign in with Microsoft` in the React frontend
2. Frontend authenticates with Entra ID using Authorization Code Flow with PKCE
3. Frontend sends the Entra ID token to this backend
4. Backend validates the Microsoft token
5. Backend maps the Microsoft identity to a local user in the `users` table
6. Backend issues the existing local application JWT
7. The rest of the app continues to use the existing role-based logic

## Why This Fits This Project

This application already has:

- local user roles such as `admin`, `department_user`, `compliance`, `ceo_office`
- backend authorization rules based on those roles
- a frontend React SPA
- an Express backend API

Because of that, the safest and least disruptive approach is:

- authenticate with Entra ID
- authorize with local roles already stored in this app

## Official References

- App sign-in flow:
  https://learn.microsoft.com/en-us/azure/active-directory/develop/app-sign-in-flow

- Authorization code flow with PKCE:
  https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow

- Authentication flows and app scenarios:
  https://learn.microsoft.com/en-us/entra/identity-platform/authentication-flows-app-scenarios

- OpenID Connect scopes:
  https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc

- MSAL React:
  https://learn.microsoft.com/en-us/entra/msal/javascript/react/getting-started

## Current Project Areas Relevant to the Change

Frontend authentication:

- `client/src/contexts/AuthContext.tsx`
- `client/src/services/auth.api.ts`
- `client/src/pages/LoginPage.tsx`

Backend authentication:

- `server/src/services/auth.service.ts`
- `server/src/controllers/auth.controller.ts`
- `server/src/routes/auth.routes.ts`
- `server/src/middleware/auth.ts`

Database users:

- `database/seeds/002_users.sql`

## Integration Steps

### 1. Register an App in Microsoft Entra ID

Create an application registration for the frontend login flow.

In Entra ID:

- create a new app registration
- choose your tenant type
- configure platform as `Single-page application`

Collect:

- `CLIENT_ID`
- `TENANT_ID`

Configure redirect URIs such as:

- `http://localhost:5173`
- your production frontend URL

### 2. Configure Authentication for the SPA

For the SPA app registration:

- enable Authorization Code Flow with PKCE
- use OpenID Connect scopes:
  - `openid`
  - `profile`
  - `email`

You usually do not need a client secret for the frontend SPA.

### 3. Decide Tenant Scope

Decide whether login should be:

- single-tenant only
- multi-tenant

For internal enterprise apps, single-tenant is usually preferred.

### 4. Add Azure Configuration to the Frontend

Add environment variables in the client environment:

```env
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_REDIRECT_URI=http://localhost:5173
```

If you want logout redirect support:

```env
VITE_AZURE_POST_LOGOUT_REDIRECT_URI=http://localhost:5173/login
```

### 5. Install Frontend Libraries

Add:

- `@azure/msal-browser`
- `@azure/msal-react`

These should be added to the client workspace.

### 6. Add MSAL Setup in the Client

Suggested future file:

- `client/src/auth/msal.ts`

This file should:

- create the MSAL configuration
- initialize `PublicClientApplication`
- define login scopes

Example areas to configure:

- authority using tenant ID
- client ID
- redirect URI
- cache location

### 7. Wrap the React App with the MSAL Provider

Update the client bootstrapping so the React app uses:

- `MsalProvider`

This will allow the login page and auth context to call Entra login cleanly.

### 8. Add Microsoft Sign-In to the Login Page

Update:

- `client/src/pages/LoginPage.tsx`

Add a button such as:

- `Sign in with Microsoft`

This should:

- trigger MSAL login popup or redirect
- retrieve the ID token / account info
- send the token to the backend for exchange

### 9. Add a Backend Endpoint for Azure Login

Add a new backend endpoint, for example:

- `POST /api/auth/azure-login`

This endpoint should receive:

- the Microsoft token from the frontend

The backend should then:

- validate the token
- extract stable user identity
- find the corresponding local user
- issue the existing local app JWT

### 10. Validate the Microsoft Token on the Backend

Do not trust frontend claims directly.

The backend should verify:

- issuer
- audience
- tenant
- signature
- expiration

Typical implementation options:

- use Microsoft JWKS / OIDC metadata
- use a standard JWT validation library with Entra metadata

### 11. Add Azure Identity Mapping to the Users Table

Add fields to the `users` table to map Microsoft identities to local users.

Recommended columns:

- `azure_oid` for Entra object ID
- `azure_upn` for user principal name
- `azure_email` for email

Recommended matching priority:

1. `azure_oid`
2. `azure_upn`
3. `azure_email`

Using `azure_oid` is the safest long-term identity key.

### 12. Map Azure Users to Local Application Roles

Do not move authorization logic entirely into Entra unless you intend a broader redesign.

Instead:

- keep roles in the local `users` table
- use Azure only to prove identity
- continue using existing role checks in the backend

This preserves all current app logic.

### 13. Issue the Existing App JWT After Azure Login

Once the Azure user is matched to a local user:

- build the same local auth payload currently used by the app
- sign the existing app JWT
- return it to the frontend

This keeps the rest of the application unchanged.

### 14. Update the Frontend Auth Context

Update:

- `client/src/contexts/AuthContext.tsx`

So that it supports:

- regular username/password login
- Azure SSO login

The end result should still be:

- local token stored in the same place
- same user object shape
- same route protection logic

### 15. Optional: Keep Local Login for Admin/Testing

You may choose to keep:

- local username/password login for testing or admin fallback

This can help during rollout.

If you want tighter enterprise control later, local login can be disabled.

## Suggested Database Changes

When implementing later, create a migration to add:

- `azure_oid`
- `azure_upn`
- `azure_email`

Suggested constraints:

- unique index on `azure_oid`
- optional index on `azure_email`

## Suggested Future Files to Add

Frontend:

- `client/src/auth/msal.ts`
- optional `client/src/auth/AzureLoginButton.tsx`

Backend:

- `server/src/services/azure-auth.service.ts`
- `server/src/utils/jwks.ts` or similar token validation helper

Likely files to update:

- `client/src/pages/LoginPage.tsx`
- `client/src/contexts/AuthContext.tsx`
- `client/src/services/auth.api.ts`
- `server/src/controllers/auth.controller.ts`
- `server/src/routes/auth.routes.ts`
- `server/src/services/auth.service.ts`
- `server/src/types/index.ts`

## Suggested Backend Flow

The new Azure login endpoint should roughly follow this sequence:

1. receive Entra ID token from frontend
2. validate token against Microsoft issuer and audience
3. extract:
   - object ID
   - email / preferred username
   - tenant ID
4. find matching local user
5. reject if user is not mapped or inactive
6. build local `AuthPayload`
7. issue existing local app JWT
8. return `{ token, user }`

## Suggested Frontend Flow

The React app should:

1. start Microsoft login with MSAL
2. receive the Microsoft account/token result
3. call backend Azure login endpoint
4. receive local application JWT
5. store local JWT
6. continue with current app flow

## Validation Checklist

After implementation, verify:

- Microsoft login works locally
- backend accepts only valid tokens from your Entra app
- mapped local users receive the correct local app role
- unmapped users are rejected cleanly
- `/auth/me` still works with the local app JWT
- protected routes still behave exactly as before
- local role-based permissions remain unchanged

## Security Best Practices

When integrating Azure SSO:

- validate Microsoft tokens on the backend
- do not trust frontend claims directly
- restrict to your tenant unless multi-tenant login is required
- use `azure_oid` as the primary identity mapping field
- keep local authorization in the database unless you intentionally redesign it
- avoid putting secrets in the SPA
- log authentication failures without logging tokens

## Alternative Architecture

An alternative is to fully adopt Entra access tokens for API authorization.

That would require:

- a separate backend API app registration
- exposed API scopes
- frontend requesting API access tokens
- backend validating Entra access tokens directly
- refactoring local JWT auth flow

That is a larger redesign and is not the recommended first step for this codebase.

## Final Recommendation

For this project, the best migration path is:

- use Azure / Entra ID for SSO login
- keep local user records and roles
- exchange the Microsoft login result for the current local app JWT

This gives you enterprise SSO with minimal disruption to the current application design.
