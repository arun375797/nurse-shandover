# BedsideRelay API

Base path: `/api`  
All authenticated responses include `Cache-Control: no-store`.  
Mutating requests (except login) require header `x-csrf-token` from `GET /api/auth/csrf-token`.  
Credentials: cookie session (`br.sid` by default).

## Auth

### `POST /api/auth/login`

Body:

```json
{ "email": "nurse.dev@bedsiderelay.local", "password": "..." }
```

Returns `{ user, unit, timezone }`.

### `POST /api/auth/logout`

Ends session. Requires auth + CSRF.

### `GET /api/auth/me`

Returns current `{ user, unit, timezone }`.

### `GET /api/auth/csrf-token`

Returns `{ csrfToken }`.

## Patients

Nurses only see/modify patients in their `unitId`.

### `GET /api/patients`

Query: `search`, `status`, `unitId` (admin), `ward`, `shift`, `page`, `limit`, `sort`  
(`-updatedAt` default). Archived excluded unless `status=archived`.

### `POST /api/patients`

Validated body (see shared Zod schema). Required: `patientName`, `mrNumberDisplay`.  
`409 DUPLICATE_MR` if MR already active in unit.

### `GET /api/patients/:id`

### `PATCH /api/patients/:id`

Requires `version` for optimistic concurrency.  
`409 VERSION_CONFLICT` if another save landed first.

### `DELETE /api/patients/:id`

Soft archive (`status=archived`).

### `POST /api/patients/:id/restore`

Admin only. Restores archived patient when MR not in use.

## Errors

```json
{ "error": { "code": "VALIDATION", "message": "...", "details": {} } }
```

Production 500 responses use a generic message.
