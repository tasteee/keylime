# Supabase Setup Guide

This guide will help you set up Supabase for authentication and data persistence in Keylime.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Bun installed locally

## Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - **Name**: keylime (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
4. Click "Create new project"

## Step 2: Run Database Schema

1. Once your project is created, go to the SQL Editor in the Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste it into a new query in the SQL Editor
4. Click "Run" to execute the schema

This will create:
- `profiles` table for user data
- `projects` table for project metadata
- `pattern_signals` table for pattern editor data
- `progression_items` table for chord progressions
- Row Level Security (RLS) policies to protect user data
- Triggers and functions for automatic profile creation

## Step 3: Configure Environment Variables

1. In your Supabase project dashboard, go to **Settings → API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

3. Create a `.env` file in the project root (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```

4. Add your Supabase credentials to `.env`:
   ```env
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Verify Setup

1. Start your development server:
   ```bash
   bun run dev
   ```

2. Test authentication:
   - Try signing up with a new account
   - Check that a profile is created in the `profiles` table
   - Try signing in with your credentials

3. Test project functionality:
   - Create a new project
   - Save the project
   - Verify the data appears in the `projects` table in Supabase

## Authentication Flow

The app uses Supabase Auth with the following features:

- **Sign Up**: Email/password registration
- **Sign In**: Email/password authentication
- **Sign Out**: Clear session
- **Password Reset**: Email-based password recovery
- **Auto Profile Creation**: Profiles are automatically created via database trigger

## Data Structure

### Projects Table
Stores project metadata including:
- User ID (owner)
- Title, description
- Musical settings (key, scale, BPM, octave)
- Velocity range
- Pattern duration
- Public/private flag
- Timestamps

### Pattern Signals Table
Stores individual notes/signals in the pattern editor:
- Signal ID and row ID
- Start time and duration
- Note and velocity
- Linked to parent project

### Progression Items Table
Stores chord progression data:
- Item type (chord or rest)
- Chord details (symbol, root note, color)
- Modifiers (inversion, octave offset, voicing, bass note)
- Duration and position
- Linked to parent project

## Row Level Security (RLS)

All tables have RLS enabled to ensure users can only:
- View their own projects and associated data
- View public projects (read-only)
- Create/update/delete their own content

## API Usage Examples

### Creating a New Project
```typescript
import projectStore from '$lib/stores/project.svelte'

// Create and save a new project
await projectStore.save()
```

### Loading a Project
```typescript
import projectStore from '$lib/stores/project.svelte'

await projectStore.load('project-id-here')
```

### Fetching User's Projects
```typescript
import projectsStore from '$lib/stores/projects.svelte'

// Projects are automatically loaded when user signs in
// Access via: projectsStore.projects
```

### Deleting a Project
```typescript
import projectsStore from '$lib/stores/projects.svelte'

await projectsStore.deleteProject('project-id-here')
```

## Troubleshooting

### "User must be authenticated" errors
Make sure the user is signed in before attempting to save/load projects:
```typescript
import authStore from '$lib/stores/auth.svelte'

if (authStore.isAuthenticated) {
  await projectStore.save()
}
```

### RLS Policy errors
If you get permission errors, verify:
1. The user is authenticated
2. The project belongs to the authenticated user
3. RLS policies were created correctly (check SQL Editor)

### Connection errors
Verify your environment variables are set correctly:
- `PUBLIC_SUPABASE_URL` should start with `https://`
- `PUBLIC_SUPABASE_ANON_KEY` should be the anon/public key, not the service role key

## Next Steps

- Set up email templates in Supabase for password reset emails
- Configure social auth providers (Google, GitHub, etc.) if needed
- Set up database backups in Supabase dashboard
- Consider adding real-time subscriptions for collaborative editing

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [SvelteKit + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-sveltekit)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
