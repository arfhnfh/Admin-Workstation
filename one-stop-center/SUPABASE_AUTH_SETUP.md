# Supabase Authentication Setup Guide

This guide will help you set up authentication for the staff system using Supabase.

## Prerequisites

1. A Supabase project (create one at https://supabase.com)
2. Access to your Supabase project dashboard

## Step 1: Configure Supabase Authentication

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Settings**
3. Configure the following:

   - **Enable Email Signup**: ✅ Enabled
   - **Confirm email**: Recommended for production (optional for development)
   - **Secure email change**: ✅ Enabled
   - **Double confirm email changes**: ✅ Enabled (recommended)

4. **Email Templates** (optional but recommended):
   - Customize the email templates for:
     - Signup confirmation
     - Password reset
     - Email change confirmation

## Step 2: Set Up SMTP (Production Only)

For production, configure SMTP to send authentication emails:

1. Go to **Authentication** > **Settings** > **SMTP Settings**
2. Enter your SMTP credentials:
   - SMTP Host
   - SMTP Port
   - SMTP User
   - SMTP Password
   - Sender email
   - Sender name

   **Note**: For development, Supabase provides a built-in email service (limited to 3 emails per hour).

## Step 3: Get Your API Keys

1. Go to **Settings** > **API**
2. Copy the following:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon/public key** → Use as `VITE_SUPABASE_ANON_KEY`

## Step 4: Configure Environment Variables

Create a `.env` file in the project root (or update existing one):

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Important**: Never commit the `.env` file to version control. The `.env.example` file should be committed instead.

## Step 5: Run Database Migrations

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the migrations in order:
   - `0001_init.sql` (if not already run)
   - `0003_auth_setup.sql` (for authentication setup)

Or use the Supabase CLI:

```bash
supabase db push
```

## Step 6: Create Staff Accounts

### Option A: Manual Creation (Recommended for Initial Setup)

1. **Create Auth User**:
   - Go to **Authentication** > **Users** in Supabase Dashboard
   - Click **Add User** > **Create new user**
   - Enter email (must be @aafiyatgroup.com for staff)
   - Set a temporary password
   - Copy the User UUID

2. **Link to Staff Record**:
   - Go to **SQL Editor**
   - Run:
   ```sql
   SELECT link_staff_to_auth_user('staff@aafiyatgroup.com', 'user-uuid-from-step-1');
   ```

### Option B: Self-Signup (For External Users)

External users (non-@aafiyatgroup.com) can sign up via the signup page. They will:
1. Fill out the signup form
2. Receive a confirmation email (if email confirmation is enabled)
3. Confirm their email
4. Sign in with their credentials

**Note**: External users won't have staff records initially. Admins can create staff records and link them later.

## Step 7: Password Requirements

Default minimum password length is 6 characters. To change:

1. Go to **Authentication** > **Settings** > **Password**
2. Configure:
   - Minimum length
   - Require uppercase
   - Require lowercase
   - Require numbers
   - Require special characters

## Step 8: Session Configuration

1. Go to **Authentication** > **Settings** > **Sessions**
2. Configure:
   - **JWT expiry**: Default 3600 seconds (1 hour)
   - **Refresh token rotation**: Recommended ✅
   - **Refresh token reuse detection**: Recommended ✅

## Step 9: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/auth` and try:
   - Signing in with a staff account
   - Signing up as an external user
   - Signing out

## Troubleshooting

### "Supabase is not configured" Error

- Check that `.env` file exists and has correct values
- Restart your development server after adding/changing `.env`
- Verify the keys in Supabase Dashboard > Settings > API

### "Invalid login credentials" Error

- Verify the user exists in Supabase Dashboard > Authentication > Users
- Check that the email matches exactly (case-insensitive)
- Ensure the password is correct
- If email confirmation is enabled, verify the user has confirmed their email

### User Can't Access Their Profile

- Verify the `auth_user_id` is linked in the `staff` table:
  ```sql
  SELECT s.*, sc.email 
  FROM staff s 
  LEFT JOIN staff_contact sc ON sc.staff_id = s.id 
  WHERE sc.email = 'user@aafiyatgroup.com';
  ```
- If `auth_user_id` is NULL, link it using `link_staff_to_auth_user()`

### Email Not Sending

- Check SMTP configuration (if using custom SMTP)
- For development, check Supabase email logs in Dashboard
- Verify email confirmation is not blocking sign-in (can disable for dev)

## Security Best Practices

1. **Enable Email Confirmation** in production
2. **Use Strong Passwords**: Configure password requirements
3. **Enable 2FA** for admin accounts (Supabase supports this)
4. **Regular Audits**: Check `auth_user_id` links periodically
5. **Monitor Auth Events**: Review authentication logs in Supabase Dashboard
6. **Use HTTPS**: Always use HTTPS in production
7. **Rotate Keys**: Regularly rotate service role keys (never expose in frontend)

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

