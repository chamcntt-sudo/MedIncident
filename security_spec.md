# Security Specification (Phase 0 TDD)

## 1. Data Invariants
- All writes and reads to `/hospitalStates/{stateId}` require a verified authenticated user (`request.auth != null && request.auth.token.email_verified == true`).
- Document ID `{stateId}` must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters (`isValidId(stateId)`).
- Every `HospitalState` document must strictly contain only the allowed keys `['ownerId', 'hospitalName', 'directorName', 'province', 'createdAt', 'updatedAt']`.
- `ownerId` must match `request.auth.uid` on creation and remain immutable on update (`incoming().ownerId == existing().ownerId`).
- `createdAt` must equal `request.time` on creation and remain immutable on update (`incoming().createdAt == existing().createdAt`).
- `updatedAt` must equal `request.time` on creation and update.
- All string fields must enforce explicit `.size()` bounds (`hospitalName <= 200`, `directorName <= 150`, `province <= 150`).

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null`, creating `/hospitalStates/state_1` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth = { uid: 'u1', token: { email: 'cham.cntt@gmail.com', email_verified: false } }` -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Create**: `auth.uid = 'u1'`, payload `ownerId: 'u2'` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Payload includes extra key `isAdmin: true` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection on Update**: Payload adds `role: 'SUPER_ADMIN'` -> `PERMISSION_DENIED`.
6. **Owner Immutability Violation**: Updating `ownerId` from `'u1'` to `'u2'` -> `PERMISSION_DENIED`.
7. **CreatedAt Immutability Violation**: Updating `createdAt` to a new timestamp -> `PERMISSION_DENIED`.
8. **Client-Forged Timestamp**: Setting `updatedAt` to a past timestamp (`request.time - 1000s`) -> `PERMISSION_DENIED`.
9. **Value Poisoning (Oversized String)**: Setting `hospitalName` to a 10,000-character string -> `PERMISSION_DENIED`.
10. **Value Poisoning (Wrong Type)**: Setting `directorName` to a number `12345` -> `PERMISSION_DENIED`.
11. **ID Poisoning**: Creating document with ID containing spaces or > 128 chars -> `PERMISSION_DENIED`.
12. **Unauthorized Cross-User Read/List**: User `'u2'` attempting to read or list documents where `resource.data.ownerId == 'u1'` -> `PERMISSION_DENIED`.

## 3. The Test Runner (`firestore.rules.test.ts`)
```typescript
// Verifies that all 12 Dirty Dozen payloads return PERMISSION_DENIED
// against hardened rules in firestore.rules.
```
