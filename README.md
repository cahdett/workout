# Workout Tracker

A installable web app (PWA) for logging gym workouts, following routines, tracking progress charts, and hitting PRs. Runs from any browser; "Add to Home Screen" on iOS makes it behave like an app icon with no Safari chrome.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), sign up/sign in, and create a new project (pick any name/region, free tier is enough).
2. Once it's provisioned, go to **Project Settings → API**. You'll need:
   - **Project URL**
   - **anon public** key

## 2. Run the database schema

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it.
3. This creates the `exercises`, `routines`, `routine_exercises`, `workouts`, and `workout_sets` tables, plus Row Level Security policies so each signed-in user can only see their own data.

## 3. Enable Google sign-in

1. In the [Google Cloud Console](https://console.cloud.google.com/), create (or reuse) a project, then go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback` (find your exact callback URL in Supabase under **Authentication → Providers → Google**).
2. Copy the generated **Client ID** and **Client Secret**.
3. In Supabase, go to **Authentication → Providers → Google**, toggle it on, and paste in the Client ID/Secret. Save.

## 4. Configure local environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in the values from step 1:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 5. Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL, sign in with Google, and start logging.

## 6. Deploy (so it's installable on your iPhone)

iOS Safari only allows "Add to Home Screen" installability over HTTPS. The easiest free option is [Vercel](https://vercel.com):

1. Push this repo to GitHub.
2. In Vercel, "Add New Project" → import the repo (framework preset: Vite).
3. Add the two environment variables from `.env.local` in the Vercel project settings.
4. Deploy. You'll get an `https://…vercel.app` URL.
5. In Supabase, add that same URL under **Authentication → URL Configuration → Redirect URLs** (and as a **Site URL** if you want it to be the default), otherwise the Google sign-in redirect will fail on the deployed site.
6. On your iPhone, open the deployed URL in Safari → Share → **Add to Home Screen**.

## Notes & limitations

- **Requires a network connection.** Data is synced live to Supabase — there's no offline write queue, so you need wifi/cellular to log a workout (fine for virtually any gym).
- **Rest timer** plays a short tone via the Web Audio API and shows a floating countdown after each logged set; tap **+15s** to extend or **Skip** to dismiss.
- **Personal records** are computed from the Epley estimated-1-rep-max formula (`weight × (1 + reps/30)`) — a set that beats your prior best on that exercise is flagged as a PR.
- The app icons in `public/` are simple placeholders generated for this project — swap `public/icon-192.png`, `public/icon-512.png`, and `public/apple-touch-icon.png` for your own artwork any time.
