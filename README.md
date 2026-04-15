# RepairAll Auto LLC — Invoice & Membership System

Deployed on **Vercel** at `https://www.repairall.llc`

---

## Pages

| URL | File | Who uses it |
|-----|------|-------------|
| `/dashboard` | `mechanic.html` | Mechanic — create invoices |
| `/customer?id=INV-XXXXX` | `customer.html` | Customer — view invoice & pay |
| `/login` | `login.html` | Mechanic login |
| `/` | `index.html` | Membership landing page |

---

## API Routes (`/api/`)

| Endpoint | Purpose |
|----------|---------|
| `auth.js` | Password check for mechanic login |
| `mechanic-invoices.js` | GET list / POST create invoice (Airtable) |
| `get-invoice.js` | GET single invoice by ID (Airtable) |
| `update-invoice.js` | PATCH invoice status (Airtable) |
| `create-payment-intent.js` | Create Stripe PaymentIntent |
| `send-invoice-sms.js` | Send payment link to customer via GHL SMS |
| `send-review-sms.js` | Send Google review request after payment via GHL SMS |
| `join-membership.js` | Save membership to Airtable + GHL welcome SMS |
| `ghl.js` | Shared GHL helper (upsertContact, sendSMS) |

---

## Environment Variables (set in Vercel → Project Settings → Environment Variables)

| Variable | Description |
|----------|-------------|
| `AIRTABLE_API_KEY` | Airtable personal access token |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) |
| `MECHANIC_PASSWORD` | Password to access the mechanic dashboard |
| `GHL_API_KEY` | GoHighLevel private integration API key |
| `GHL_LOCATION_ID` | GHL sub-account location ID |
| `SITE_URL` | `https://www.repairall.llc` |
| `GOOGLE_REVIEW_LINK` | Google Business review short link |

---

## How it works

1. Mechanic types a free-form line (e.g. `Ali 8622145237 brake pad $150`) → system parses it → mechanic confirms
2. Invoice saved to Airtable, customer gets a payment link via SMS
3. Customer opens the link, pays via Stripe
4. After payment, customer gets a Google review request via SMS
5. Membership signups go to Airtable + customer gets a welcome SMS

---

## Deploy

Push to the `main` branch on GitHub — Vercel auto-deploys.

```bash
git add .
git commit -m "your message"
git push origin main
```
