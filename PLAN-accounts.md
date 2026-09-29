# Plan: accounts and paid features

Status: **not built**. It needs a backend, a payments account and your
decisions. Today everything runs in the browser and nothing leaves the
device. This plan keeps that as the default.

## 1. What accounts would add

- Resumes synced across devices (phone and laptop)
- A backup that survives clearing the browser
- Optional paid extras (section 4)

Signing in stays **optional**. The free builder keeps working without an
account, exactly as it does now.

## 2. Recommended stack

| Need | Choice | Why |
| --- | --- | --- |
| Sign-in and database | **Supabase** (free tier) | Postgres, email-link and Google sign-in, row-level security, EU or US hosting |
| Payments | **Lemon Squeezy** (or Stripe) | Lemon Squeezy is the merchant of record, so it handles VAT and sales tax; Stripe costs less but leaves tax to you |
| Server code | **Vercel Functions** (already our host) | Only needed for the payment webhook |

Alternatives: Firebase instead of Supabase, which is similar but uses a NoSQL
database. Paddle instead of Lemon Squeezy.

## 3. How it fits the current code

- `src/lib/resume/library.ts` already stores a list of resumes plus one
  document per resume. Add a `sync.ts` next to it that, when signed in:
  - pushes the local copy to a `resumes` table (id, user_id, name, data JSON,
    updated_at)
  - pulls newer copies from the server
  - keeps the newer version when both have changed, and saves the other one
    as "(conflict copy)"
- Row-level security: each user can read and write only their own rows.
- Photos stay inside the resume JSON, as they are now, with a 1 MB limit.
- The builder's toolbar gets a "Sign in to sync" button. Signed-out users
  see no change.
- New pages: `/account` (sign in, sign out, delete account, export all) and
  an update to the privacy policy.

## 4. Paid features (ideas, pick what you want)

- **AI writing help:** rewrite a bullet, tailor the resume to a job ad. This
  needs an AI API key, and the cost is per use.
- **Unlimited cloud resumes.** Free accounts get 3, for example.
- **Custom domain share link:** a read-only online resume at
  `kitwise.../r/name`.
- **Premium templates.**

Suggested pricing: a one-off 7-day pass (common for job seekers) plus a
monthly plan. Keep PDF downloads free, because that is what users come
for and it matters for search rankings.

## 5. What we need from you

1. Create a Supabase project. Send the project URL and anon key, and keep
   the service key private.
2. Choose a payments provider and create the account (store, products,
   webhook secret).
3. Decide which features are paid, and the prices.
4. The final domain, so sign-in redirects and the webhook URL can be set.
5. The legal pages: update privacy and terms for accounts and payments.

## 6. Build order (about 4 phases)

1. Supabase sign-in (email link and Google), and the account page
2. Sync of the resume library, with conflict handling and tests
3. Payments: checkout link, webhook, and a `plan` column on the user
4. The first paid feature behind the plan check
