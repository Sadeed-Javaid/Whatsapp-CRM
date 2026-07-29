# WhatsApp CRM Dashboard

A 100% free, production-ready WhatsApp CRM built with Next.js 15, Supabase, and Meta WhatsApp Cloud API. No N8N, no paid services.

## Free Stack

| Service | Cost |
|---|---|
| Next.js | Free |
| Supabase | Free tier |
| Meta WhatsApp Cloud API | Free |
| Vercel | Free tier |

---

## Architecture

```
Browser → Next.js App Router
             ↓
     /api/campaigns  →  Meta WhatsApp API (sends templates)
     /api/messages   →  Meta WhatsApp API (sends replies)
     /api/webhook    ←  Meta webhook (incoming messages + delivery updates)
     /api/contacts
     /api/analytics
     /api/templates  →  Meta API (fetch approved templates)
             ↓
     Supabase (PostgreSQL + Realtime + Auth)
```

---

## Quick Start

### 1. Install
```bash
npm install
cp .env.example .env.local
```

### 2. Fill .env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
META_ACCESS_TOKEN=EAAxxxx
META_PHONE_NUMBER_ID=your-phone-number-id
META_WABA_ID=your-whatsapp-business-account-id
META_VERIFY_TOKEN=your-custom-verify-token
```

### 3. Set up Supabase
1. Create project at supabase.com
2. Run `database/schema.sql` in SQL Editor
3. Run `database/fix-functions.sql` in SQL Editor
4. Create user: Authentication → Users → Add user

### 4. Configure Meta Webhook
1. Go to Meta Developer Console → WhatsApp → Configuration
2. Callback URL: `https://your-domain.com/api/webhook`
3. Verify Token: match your `META_VERIFY_TOKEN`
4. Subscribe to: `messages`

### 5. Run
```bash
npm run dev
```

---

## Environment Variables

| Variable | Where to find |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `META_ACCESS_TOKEN` | Meta → WhatsApp → API Setup |
| `META_PHONE_NUMBER_ID` | Meta → WhatsApp → API Setup |
| `META_WABA_ID` | Meta → WhatsApp → Configuration |
| `META_VERIFY_TOKEN` | You choose this string |

---

## Features

- Campaign sender with Excel/CSV upload
- Dynamic template fetching from Meta (only approved templates shown)
- Realtime chat inbox with WhatsApp-style UI
- Delivery status tracking (sent → delivered → read)
- Contact management
- Analytics with charts
- Dark mode
- Supabase Auth

---

## Deployment

### Vercel
```bash
npm install -g vercel
vercel --prod
```
Add all env vars in Vercel Dashboard → Settings → Environment Variables.

Then update your Meta webhook callback URL to your Vercel domain.

---

## Contacts File Format

Excel or CSV with headers:

| phone | name | email |
|---|---|---|
| 9876543210 | Rahul Sharma | rahul@example.com |
| +919876543211 | Priya Singh | |

- `phone` required — 10 digits (auto +91) or full international format
- `name` and `email` optional

---

## Security

- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never exposed to browser
- `META_ACCESS_TOKEN` is server-only — never exposed to browser
- All API calls to Meta happen server-side via Next.js API routes
- RLS policies protect all database tables
