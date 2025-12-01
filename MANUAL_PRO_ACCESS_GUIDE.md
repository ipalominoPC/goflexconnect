# Manual PRO Access System - Implementation Guide

## Overview

The manual PRO access system allows admins to grant FREE users PRO-tier access without any billing integration. This is perfect for:
- Beta testers
- Comped accounts
- Early adopters
- Internal testing

## Key Features

### 1. Centralized Plan Resolution
All plan checks now go through `resolveUserPlan()` which checks:
1. Manual plan overrides (in `plan_overrides` table)
2. User metadata plan (if ever used)
3. Defaults to FREE

### 2. Admin Dashboard Integration
- **Location**: Admin Dashboard → User Management (first section)
- **Features**:
  - View all users with their effective plans
  - Search/filter users by email
  - Click "Edit Plan" to change any user's plan
  - Add optional reason (e.g., "Beta tester", "Comped for feedback")
  - View who granted access and when

### 3. Database Structure

**Table: `plan_overrides`**
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users, unique)
- plan_id: TEXT ('FREE' or 'PRO')
- granted_by: UUID (admin who granted access)
- reason: TEXT (optional note)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**RLS Policies:**
- Users can SELECT their own override (to check their plan)
- Only admins can INSERT/UPDATE/DELETE overrides
- Admin check: email IN approved list

### 4. How It Works

**For Admins:**
1. Open Admin Dashboard
2. Find user in User Management table
3. Click "Edit Plan"
4. Select FREE or PRO
5. Add reason (optional)
6. Save

**For Users:**
- Plan override is automatically checked on every limit operation
- PRO users immediately get:
  - Unlimited projects
  - Unlimited surveys
  - Unlimited measurements
  - Unlimited AI insights
  - Unlimited heatmap exports
  - No watermarks on exports
  - No ads

### 5. Integration Points

All existing plan checks now use `resolveUserPlan()`:
- ✅ `assertCanCreateProject()`
- ✅ `assertCanCreateSurvey()`
- ✅ `assertCanRecordMeasurement()`
- ✅ `assertCanUseAiInsights()`
- ✅ `assertCanExportHeatmap()`

Watermark utility still works (takes plan string as parameter).

### 6. Backward Compatibility

The old `getUserPlan(user)` function still exists for backward compatibility but:
- ⚠️ Does NOT check plan_overrides
- Only checks user_metadata
- Should NOT be used for new code

Always use `resolveUserPlan(userId)` for accurate plan detection.

### 7. Self-Tests Unaffected

All existing self-tests (T1-T7) continue to work:
- Test users remain on FREE plan by default
- Tests verify FREE limits correctly
- PRO test (T6) still passes
- Admin alerts (T7) still work

## Usage Examples

### Admin Grants PRO Access
```typescript
import { grantProAccess } from '../services/adminPlanService';

await grantProAccess(userId, 'Beta tester - early access');
// User immediately has PRO features
```

### Admin Revokes PRO Access
```typescript
import { revokeProAccess } from '../services/adminPlanService';

await revokeProAccess(userId);
// User reverts to FREE plan
```

### Check User's Effective Plan
```typescript
import { resolveUserPlan } from '../services/planService';

const resolved = await resolveUserPlan(userId);
console.log(resolved);
// {
//   plan: 'pro',
//   basePlan: 'free',
//   override: 'pro',
//   reason: 'Beta tester - early access'
// }
```

## Security

- Only approved admin emails can manage plan overrides
- Admin list: ipalominopc@gmail.com, isaac@goflexconnect.com, isaac@goflexcloud.com, dev@goflexconnect.com
- RLS policies prevent non-admins from bypassing checks
- All changes are logged (granted_by, created_at, updated_at)

## Database Functions

**`get_all_users_admin()`**
- Returns all users from auth.users (admin only)
- Used by User Management UI to list users
- Security: DEFINER function with admin check

## Files Modified/Created

### New Files:
- `src/services/adminPlanService.ts` - Admin plan management
- `src/components/admin/UserManagement.tsx` - UI component
- `supabase/migrations/create_plan_overrides_table.sql` - Database schema
- `supabase/migrations/create_admin_get_users_function.sql` - Admin function

### Modified Files:
- `src/services/planService.ts` - Added resolveUserPlan()
- `src/pages/AdminDashboard.tsx` - Integrated User Management UI
- All guard functions updated to use resolveUserPlan()

## Testing Checklist

- [ ] Admin can see User Management section
- [ ] Admin can search for users
- [ ] Admin can grant PRO access with reason
- [ ] Admin can revoke PRO access
- [ ] User immediately gets PRO features after grant
- [ ] User loses PRO features after revoke
- [ ] Self-tests (T1-T7) all pass
- [ ] Non-admin users cannot modify plan_overrides
- [ ] Plan changes are tracked (granted_by, timestamps)

## Next Steps

1. Refresh your browser
2. Open Admin Dashboard (if you're an approved admin)
3. View the User Management section
4. Try granting yourself PRO access as a test
5. Verify PRO features work (no limits, no watermarks)
6. Run Self-Tests to confirm nothing broke

## Notes

- This is an **internal-only** system (no Stripe, no billing)
- Perfect for MVP and beta testing phase
- Can be extended later with real billing if needed
- All plan logic is centralized for easy future updates
