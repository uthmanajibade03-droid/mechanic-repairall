# RepairAll Auto LLC — Payment System

## Files
- `mechanic.html` — Dashboard to create & manage invoices
- `customer.html` — Customer-facing payment page (accessed via unique link)
- `schema.sql` — Supabase database setup

---

## Setup (5 steps)

### 1. Create the Supabase table
1. Go to: https://supabase.com/dashboard/project/kvxwjpsunapmutrpgjrp/sql
2. Paste the contents of `schema.sql` and click **Run**

### 2. Deploy the files
Upload `mechanic.html` and `customer.html` to any static host:
- **Netlify** (drag & drop): https://netlify.com/drop
- **Vercel**: `npx vercel`
- **GitHub Pages**: push to a repo and enable Pages

### 3. Wire up the backend for payments
Stripe requires a backend to create PaymentIntents (to keep your secret key safe).

**Minimal Node.js / Express backend:**
```js
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY');

app.post('/create-payment-intent', async (req, res) => {
  const { amount, invoice_id } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount,           // in cents
    currency: 'usd',
    metadata: { invoice_id }
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});
```

Then in `customer.html`, replace:
```
YOUR_BACKEND_ENDPOINT/create-payment-intent
```
with your actual server URL, e.g.:
```
https://repairall-api.railway.app/create-payment-intent
```

**Easy backend hosting:** Railway, Render, or Vercel Functions

### 4. Handle Stripe webhook (mark invoices as paid)
In your backend, add a webhook listener for `payment_intent.succeeded`:
```js
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], 'whsec_...');
  if (event.type === 'payment_intent.succeeded') {
    const invoiceId = event.data.object.metadata.invoice_id;
    // Update Supabase: set status = 'paid' for this invoice_id
  }
  res.json({received: true});
});
```

### 5. Open the mechanic dashboard
Open `mechanic.html` in a browser. Create an invoice — it auto-copies the payment link. Send the link to your customer!

---

## How it works
1. Mechanic fills in customer name, vehicle, services → clicks **Generate Invoice**
2. Invoice is saved to Supabase with a unique ID (e.g. `INV-X7K2M9PQ`)
3. A payment link is auto-copied: `https://yoursite.com/customer.html?id=INV-X7K2M9PQ`
4. Customer opens the link, sees their itemized invoice, pays via Stripe
5. Invoice status updates to **Paid** in the dashboard (realtime)

---

## Keys already configured
- Supabase URL: `https://kvxwjpsunapmutrpgjrp.supabase.co`
- Stripe Publishable Key: `pk_test_51TGJM5QZ...` ✓
- Supabase Anon Key: wired in ✓
