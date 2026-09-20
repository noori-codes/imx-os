# Google and GitHub sign-in

IMX OS uses Supabase Auth OAuth. The app buttons call `signInWithOAuth` and land on `/auth/callback`.

## 1. Supabase redirect URLs

**Authentication → URL Configuration**

- **Site URL:** `https://imx-os.vercel.app` (or your production origin)
- **Redirect URLs** (add all you use):
  - `https://imx-os.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

## 2. Callback URL for Google and GitHub

In **Google Cloud** and **GitHub**, the OAuth “authorized redirect” must be the **Supabase** callback — not your Next.js URL:

```text
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Find `<your-project-ref>` in **Project Settings → API → Project URL**.

## 3. Google

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create **OAuth client ID** → Application type **Web application**.
3. Authorized redirect URIs: the Supabase callback from step 2.
4. Copy Client ID and Client Secret.
5. Supabase → **Authentication → Sign in / Providers → Google** → enable, paste ID and secret, save.

## 4. GitHub

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Homepage URL: your site (e.g. `https://imx-os.vercel.app`).
3. Authorization callback URL: the Supabase callback from step 2.
4. Create the app, generate a client secret.
5. Supabase → **Authentication → Sign in / Providers → GitHub** → enable, paste Client ID and secret, save.

## 5. App env

On **Vercel**, set:

```text
NEXT_PUBLIC_SITE_URL=https://imx-os.vercel.app
```

Do **not** set it to `http://localhost:3000` in Production.

Local `.env.local` may use `http://localhost:3000` for local OAuth/PKCE.

OAuth `redirectTo` uses the live request host in production (never localhost).

In Supabase → **URL Configuration**:

- **Site URL** must be `https://imx-os.vercel.app` (not localhost)
- **Redirect URLs** must include that origin’s `/auth/callback` (and localhost if you test locally)

## 6. Test

1. Open `/login` or `/register`.
2. Click **Continue with Google** or **Continue with GitHub**.
3. You should return to `/dashboard` after consent.

If you land on `/login?error=auth_callback_failed`, check redirect URLs, provider secrets, and that the provider is enabled in Supabase.
