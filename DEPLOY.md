# Daily Ops Deployment

## Recommended Setup

- GitHub stores the app code.
- Vercel publishes the app as a public/private web URL.
- Supabase stores the shared team data.

## 1. Supabase

Run `supabase/schema.sql` once in Supabase SQL Editor.

The app uses one shared `app_state` table for the v1.1.5 prototype data sync.

## 2. GitHub

Upload this `daily-ops-app` folder to a GitHub repository.

Do not upload `.env.local`, `.next`, `.tools`, `node_modules`, or `out`.

## 3. Vercel

1. Create a Vercel account or sign in with GitHub.
2. Click `Add New Project`.
3. Import the GitHub repository.
4. Set the root directory to `daily-ops-app` if the repo contains other folders.
5. Add these environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

6. Deploy.

After deployment, Vercel will give you a URL like:

```text
https://your-app.vercel.app
```

Share that URL with the team. Everyone opening the same URL will read and write the same Supabase data.
